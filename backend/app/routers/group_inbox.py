import datetime
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import GroupInbox, Expense, ExpenseCategory, User, Group, GroupMember
from app.dependencies.auth import get_current_user
from app.routers.dashboard import ensure_initial_seed
from pydantic import BaseModel

router = APIRouter(prefix="/api/group-inbox", tags=["Group Inbox Module"])

class SubmitGroupExpense(BaseModel):
    title: str
    amount: Decimal
    group_id: Optional[int] = None
    category_id: Optional[int] = None
    category_name: Optional[str] = "Food"
    payment_method: Optional[str] = "UPI"
    description: Optional[str] = None

class RejectInput(BaseModel):
    reason: str

class GroupInboxItemOut(BaseModel):
    id: int
    group_id: Optional[int] = None
    group_name: str = "General Group"
    group_type: str = "Group"
    title: str
    amount: float
    category_id: Optional[int]
    category_name: str
    category_icon: str
    payment_method: str
    description: Optional[str]
    status: str  # pending, approved, rejected
    rejection_reason: Optional[str]
    submitted_by: str
    created_at: str

@router.get("", response_model=List[GroupInboxItemOut])
def get_group_inbox(
    status_filter: Optional[str] = None,
    group_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Only return inbox items for groups where user is an active member
    user_group_ids = [
        gm.group_id for gm in db.query(GroupMember.group_id).filter(
            GroupMember.user_id == current_user.id,
            GroupMember.status == "active"
        ).all()
    ]

    if not user_group_ids:
        return []

    query = db.query(GroupInbox).filter(GroupInbox.group_id.in_(user_group_ids)).order_by(GroupInbox.created_at.desc())
    if status_filter:
        query = query.filter(GroupInbox.status == status_filter)
    if group_id:
        if group_id not in user_group_ids:
            return []
        query = query.filter(GroupInbox.group_id == group_id)

    items = query.all()
    cat_map = {c.id: c for c in db.query(ExpenseCategory).all()}
    user_map = {u.id: u for u in db.query(User).all()}
    group_map = {g.id: g for g in db.query(Group).all()}

    results = []
    for item in items:
        cat = cat_map.get(item.category_id)
        submitter = user_map.get(item.user_id)
        grp = group_map.get(item.group_id) if item.group_id else None

        results.append(
            GroupInboxItemOut(
                id=item.id,
                group_id=item.group_id,
                group_name=grp.name if grp else "General Group",
                group_type=grp.group_type if grp else "Group",
                title=item.title,
                amount=float(item.amount),
                category_id=item.category_id,
                category_name=cat.name if cat else "General",
                category_icon=cat.icon if cat else "📋",
                payment_method=item.payment_method or "Cash",
                description=item.description,
                status=item.status,
                rejection_reason=item.rejection_reason,
                submitted_by=submitter.full_name if submitter else "Team Member",
                created_at=item.created_at.strftime("%b %d, %Y - %I:%M %p")
            )
        )
    return results


@router.post("", response_model=GroupInboxItemOut)
def submit_to_inbox(
    item: SubmitGroupExpense,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not item.group_id:
        raise HTTPException(status_code=400, detail="Group ID is required to submit a group expense.")

    # Verify user is an active member of this group
    mem = db.query(GroupMember).filter(
        GroupMember.group_id == item.group_id,
        GroupMember.user_id == current_user.id,
        GroupMember.status == "active"
    ).first()
    if not mem:
        raise HTTPException(status_code=403, detail="You are not an active member of this group.")

    grp = db.query(Group).filter(Group.id == item.group_id).first()
    if not grp:
        raise HTTPException(status_code=404, detail="Group not found.")

    cat = None
    if item.category_id:
        cat = db.query(ExpenseCategory).filter(ExpenseCategory.id == item.category_id).first()
    if not cat and item.category_name:
        cat = db.query(ExpenseCategory).filter(ExpenseCategory.name.ilike(item.category_name)).first()

    new_inbox = GroupInbox(
        user_id=current_user.id,
        group_id=grp.id,
        category_id=cat.id if cat else None,
        title=item.title,
        amount=item.amount,
        payment_method=item.payment_method or "Cash",
        description=item.description,
        status="pending"
    )
    db.add(new_inbox)
    db.commit()
    db.refresh(new_inbox)

    return GroupInboxItemOut(
        id=new_inbox.id,
        group_id=new_inbox.group_id,
        group_name=grp.name,
        group_type=grp.group_type,
        title=new_inbox.title,
        amount=float(new_inbox.amount),
        category_id=new_inbox.category_id,
        category_name=cat.name if cat else "General",
        category_icon=cat.icon if cat else "📋",
        payment_method=new_inbox.payment_method,
        description=new_inbox.description,
        status=new_inbox.status,
        rejection_reason=None,
        submitted_by=current_user.full_name,
        created_at=new_inbox.created_at.strftime("%b %d, %Y - %I:%M %p")
    )


@router.post("/{inbox_id}/approve")
def approve_inbox_expense(
    inbox_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    inbox_item = db.query(GroupInbox).filter(GroupInbox.id == inbox_id).first()
    if not inbox_item:
        raise HTTPException(status_code=404, detail="Inbox item not found")

    # Verify user is an active member (admin or member) of the item's group
    mem = db.query(GroupMember).filter(
        GroupMember.group_id == inbox_item.group_id,
        GroupMember.user_id == current_user.id,
        GroupMember.status == "active"
    ).first()
    if not mem:
        raise HTTPException(status_code=403, detail="Not authorized to approve expenses for this group.")

    if inbox_item.status == "approved":
        raise HTTPException(status_code=400, detail="This expense has already been approved.")

    # Business rule: On approval, create the corresponding expense in expenses table!
    new_expense = Expense(
        user_id=user.id,
        category_id=inbox_item.category_id,
        amount=inbox_item.amount,
        description=f"[Group Approved] {inbox_item.title}",
        payment_method=inbox_item.payment_method or "Cash",
        transaction_date=datetime.date.today()
    )
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)

    inbox_item.status = "approved"
    inbox_item.approved_expense_id = new_expense.id
    db.commit()

    return {"message": "Expense approved and recorded to live expenses successfully!", "expense_id": new_expense.id}


@router.post("/{inbox_id}/reject")
def reject_inbox_expense(
    inbox_id: int,
    body: RejectInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    inbox_item = db.query(GroupInbox).filter(GroupInbox.id == inbox_id).first()
    if not inbox_item:
        raise HTTPException(status_code=404, detail="Inbox item not found")

    if inbox_item.status == "approved":
        raise HTTPException(status_code=400, detail="Cannot reject an already approved expense.")

    inbox_item.status = "rejected"
    inbox_item.rejection_reason = body.reason.strip()
    db.commit()

    return {"message": "Expense rejected successfully"}
