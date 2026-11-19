import uuid
import datetime
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.models import (
    User,
    Group,
    GroupMember,
    GroupInvitation,
    GroupExpense,
    GroupExpenseSplit,
    GroupSettlement,
    GroupInbox,
    ExpenseCategory,
    Notification
)
from app.schemas.schemas import (
    GroupCreate,
    GroupUpdate,
    GroupOut,
    GroupMemberOut,
    GroupExpenseCreate,
    GroupExpenseOut,
    GroupExpenseSplitOut,
    GroupSettlementCreate,
    GroupSettlementOut,
    GroupBalancesResponse,
    MemberBalance,
    DebtInstruction,
    GroupDashboardResponse
)
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/api/groups", tags=["Group Expense Sharing"])


def get_user_group_membership(db: Session, group_id: int, user_id: int) -> GroupMember:
    """Helper to check if a user is an active member of a group."""
    membership = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == user_id,
        GroupMember.status == "active"
    ).first()
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this group"
        )
    return membership


def calculate_net_balances(db: Session, group_id: int):
    """
    Computes for every active member in the group:
    - total_paid: sum of GroupExpense.amount where paid_by == user.id
    - total_share: sum of GroupExpenseSplit.owed_amount where user_id == user.id
    - settlements_sent: sum of GroupSettlement.amount where payer_id == user.id
    - settlements_received: sum of GroupSettlement.amount where receiver_id == user.id
    - net_balance: (total_paid - total_share) + settlements_sent - settlements_received
    """
    members = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.status == "active"
    ).all()

    user_ids = [m.user_id for m in members]
    user_map = {u.id: u for u in db.query(User).filter(User.id.in_(user_ids)).all()}

    # Expenses paid
    expenses = db.query(GroupExpense).filter(GroupExpense.group_id == group_id).all()
    expense_ids = [e.id for e in expenses]

    splits = []
    if expense_ids:
        splits = db.query(GroupExpenseSplit).filter(
            GroupExpenseSplit.group_expense_id.in_(expense_ids)
        ).all()

    # Settlements
    settlements = db.query(GroupSettlement).filter(GroupSettlement.group_id == group_id).all()

    paid_map = {uid: Decimal("0.00") for uid in user_ids}
    share_map = {uid: Decimal("0.00") for uid in user_ids}
    sent_map = {uid: Decimal("0.00") for uid in user_ids}
    recv_map = {uid: Decimal("0.00") for uid in user_ids}

    for e in expenses:
        if e.paid_by in paid_map:
            paid_map[e.paid_by] += Decimal(str(e.amount))

    for s in splits:
        if s.user_id in share_map:
            share_map[s.user_id] += Decimal(str(s.owed_amount))

    for setl in settlements:
        if setl.payer_id in sent_map:
            sent_map[setl.payer_id] += Decimal(str(setl.amount))
        if setl.receiver_id in recv_map:
            recv_map[setl.receiver_id] += Decimal(str(setl.amount))

    member_balances: List[MemberBalance] = []
    for uid in user_ids:
        u = user_map.get(uid)
        p = paid_map[uid]
        sh = share_map[uid]
        sent = sent_map[uid]
        recv = recv_map[uid]
        net = (p - sh) + sent - recv

        if net > Decimal("0.01"):
            stat = "owed"
        elif net < Decimal("-0.01"):
            stat = "owes"
        else:
            stat = "settled"

        member_balances.append(
            MemberBalance(
                user_id=uid,
                user_name=u.full_name if u else "Member",
                email=u.email if u else "",
                phone=u.phone if u else None,
                total_paid=round(float(p), 2),
                total_share=round(float(sh), 2),
                settlements_sent=round(float(sent), 2),
                settlements_received=round(float(recv), 2),
                net_balance=round(float(net), 2),
                status=stat
            )
        )

    # Simplified Debt Algorithm (Minimizing transaction count)
    debtors = []  # owe money: [uid, name, amount_remaining]
    creditors = []  # owed money: [uid, name, amount_remaining]

    for mb in member_balances:
        if mb.net_balance < -0.01:
            debtors.append({
                "id": mb.user_id,
                "name": mb.user_name,
                "amount": abs(mb.net_balance)
            })
        elif mb.net_balance > 0.01:
            creditors.append({
                "id": mb.user_id,
                "name": mb.user_name,
                "amount": mb.net_balance
            })

    suggested_settlements: List[DebtInstruction] = []
    i, j = 0, 0
    while i < len(debtors) and j < len(creditors):
        debtor = debtors[i]
        creditor = creditors[j]
        settle_amt = min(debtor["amount"], creditor["amount"])

        if settle_amt > 0.01:
            suggested_settlements.append(
                DebtInstruction(
                    from_user_id=debtor["id"],
                    from_user_name=debtor["name"],
                    to_user_id=creditor["id"],
                    to_user_name=creditor["name"],
                    amount=round(settle_amt, 2)
                )
            )

        debtor["amount"] -= settle_amt
        creditor["amount"] -= settle_amt

        if debtor["amount"] <= 0.01:
            i += 1
        if creditor["amount"] <= 0.01:
            j += 1

    total_expense = sum(float(e.amount) for e in expenses)

    return total_expense, member_balances, suggested_settlements


# -------------------------------------------------------------
# GROUPS CRUD
# -------------------------------------------------------------

@router.post("", response_model=GroupOut)
def create_group(
    group_in: GroupCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Create Group
    new_group = Group(
        name=group_in.name.strip(),
        description=group_in.description.strip() if group_in.description else None,
        group_type=group_in.group_type or "Friends",
        image_url=group_in.image_url,
        currency=group_in.currency or "₹",
        created_by=current_user.id
    )
    db.add(new_group)
    db.commit()
    db.refresh(new_group)

    # 2. Add creator as Admin
    admin_member = GroupMember(
        group_id=new_group.id,
        user_id=current_user.id,
        role="admin",
        status="active"
    )
    db.add(admin_member)
    db.commit()

    # 3. Handle initial contacts to invite
    if group_in.contacts_to_invite:
        for contact in group_in.contacts_to_invite:
            contact_email = contact.email.strip().lower() if contact.email else None
            contact_phone = contact.phone.strip() if contact.phone else None
            contact_name = contact.name.strip() if contact.name else None

            if not contact_email and not contact_phone:
                continue

            # Check if this contact is already a registered user
            reg_user = None
            if contact_email:
                reg_user = db.query(User).filter(User.email == contact_email).first()
            if not reg_user and contact_phone:
                reg_user = db.query(User).filter(User.phone == contact_phone).first()

            token = str(uuid.uuid4())
            invitation = GroupInvitation(
                group_id=new_group.id,
                invited_by=current_user.id,
                invitee_name=contact_name or (reg_user.full_name if reg_user else None),
                invitee_email=contact_email or (reg_user.email if reg_user else None),
                invitee_phone=contact_phone or (reg_user.phone if reg_user else None),
                token=token,
                status="pending",
                expires_at=datetime.datetime.utcnow() + datetime.timedelta(days=30)
            )
            db.add(invitation)

            # If user is already registered, send in-app notification immediately
            if reg_user and reg_user.id != current_user.id:
                db.add(Notification(
                    user_id=reg_user.id,
                    title=f"Invitation to join '{new_group.name}'",
                    message=f"{current_user.full_name} invited you to join the group '{new_group.name}'.",
                    type="group_invite",
                    action_url=f"/groups/{new_group.id}"
                ))

        db.commit()

    return GroupOut(
        id=new_group.id,
        name=new_group.name,
        description=new_group.description,
        group_type=new_group.group_type,
        image_url=new_group.image_url,
        currency=new_group.currency,
        created_by=new_group.created_by,
        created_at=new_group.created_at.strftime("%b %d, %Y"),
        member_count=1,
        my_role="admin",
        total_expense=0.0,
        my_balance=0.0
    )


@router.get("", response_model=List[GroupOut])
def get_my_groups(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    memberships = db.query(GroupMember).filter(
        GroupMember.user_id == current_user.id,
        GroupMember.status == "active"
    ).all()

    if not memberships:
        return []

    group_ids = [m.group_id for m in memberships]
    groups = db.query(Group).filter(Group.id.in_(group_ids)).all()
    group_map = {g.id: g for g in groups}

    results = []
    for m in memberships:
        grp = group_map.get(m.group_id)
        if not grp:
            continue

        tot_exp, balances, _ = calculate_net_balances(db, grp.id)
        my_bal = next((b.net_balance for b in balances if b.user_id == current_user.id), 0.0)

        results.append(
            GroupOut(
                id=grp.id,
                name=grp.name,
                description=grp.description,
                group_type=grp.group_type,
                image_url=grp.image_url,
                currency=grp.currency,
                created_by=grp.created_by,
                created_at=grp.created_at.strftime("%b %d, %Y"),
                member_count=len(balances),
                my_role=m.role,
                total_expense=tot_exp,
                my_balance=my_bal
            )
        )
    return results


@router.get("/{group_id}", response_model=GroupOut)
def get_group_details(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    membership = get_user_group_membership(db, group_id, current_user.id)
    grp = db.query(Group).filter(Group.id == group_id).first()
    if not grp:
        raise HTTPException(status_code=404, detail="Group not found")

    tot_exp, balances, _ = calculate_net_balances(db, grp.id)
    my_bal = next((b.net_balance for b in balances if b.user_id == current_user.id), 0.0)

    return GroupOut(
        id=grp.id,
        name=grp.name,
        description=grp.description,
        group_type=grp.group_type,
        image_url=grp.image_url,
        currency=grp.currency,
        created_by=grp.created_by,
        created_at=grp.created_at.strftime("%b %d, %Y"),
        member_count=len(balances),
        my_role=membership.role,
        total_expense=tot_exp,
        my_balance=my_bal
    )


@router.put("/{group_id}", response_model=GroupOut)
def update_group(
    group_id: int,
    group_in: GroupUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    membership = get_user_group_membership(db, group_id, current_user.id)
    if membership.role != "admin":
        raise HTTPException(status_code=403, detail="Only group admins can update group details")

    grp = db.query(Group).filter(Group.id == group_id).first()
    if not grp:
        raise HTTPException(status_code=404, detail="Group not found")

    if group_in.name is not None:
        grp.name = group_in.name.strip()
    if group_in.description is not None:
        grp.description = group_in.description.strip()
    if group_in.group_type is not None:
        grp.group_type = group_in.group_type
    if group_in.image_url is not None:
        grp.image_url = group_in.image_url
    if group_in.currency is not None:
        grp.currency = group_in.currency

    db.commit()
    db.refresh(grp)

    tot_exp, balances, _ = calculate_net_balances(db, grp.id)
    my_bal = next((b.net_balance for b in balances if b.user_id == current_user.id), 0.0)

    return GroupOut(
        id=grp.id,
        name=grp.name,
        description=grp.description,
        group_type=grp.group_type,
        image_url=grp.image_url,
        currency=grp.currency,
        created_by=grp.created_by,
        created_at=grp.created_at.strftime("%b %d, %Y"),
        member_count=len(balances),
        my_role=membership.role,
        total_expense=tot_exp,
        my_balance=my_bal
    )


@router.delete("/{group_id}")
def delete_group(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    membership = get_user_group_membership(db, group_id, current_user.id)
    if membership.role != "admin":
        raise HTTPException(status_code=403, detail="Only group admins can delete this group")

    grp = db.query(Group).filter(Group.id == group_id).first()
    if not grp:
        raise HTTPException(status_code=404, detail="Group not found")

    db.delete(grp)
    db.commit()
    return {"message": f"Group '{grp.name}' deleted successfully"}


# -------------------------------------------------------------
# MEMBERS MANAGEMENT
# -------------------------------------------------------------

@router.get("/{group_id}/members", response_model=List[GroupMemberOut])
def get_group_members(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    get_user_group_membership(db, group_id, current_user.id)

    members = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.status == "active"
    ).all()

    user_ids = [m.user_id for m in members]
    users = db.query(User).filter(User.id.in_(user_ids)).all()
    user_map = {u.id: u for u in users}

    results = []
    for m in members:
        u = user_map.get(m.user_id)
        results.append(
            GroupMemberOut(
                id=m.id,
                user_id=m.user_id,
                full_name=u.full_name if u else "User",
                email=u.email if u else "",
                phone=u.phone if u else None,
                role=m.role,
                status=m.status,
                joined_at=m.joined_at.strftime("%b %d, %Y")
            )
        )
    return results


@router.delete("/{group_id}/members/{target_user_id}")
def remove_group_member(
    group_id: int,
    target_user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    my_membership = get_user_group_membership(db, group_id, current_user.id)

    target_membership = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == target_user_id,
        GroupMember.status == "active"
    ).first()

    if not target_membership:
        raise HTTPException(status_code=404, detail="Member not found in group")

    # Only admin can remove others, or user can remove (leave) themselves
    if current_user.id != target_user_id and my_membership.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can remove other members")

    # If admin is leaving, ensure there's at least another admin or member
    if target_membership.role == "admin":
        other_admins = db.query(GroupMember).filter(
            GroupMember.group_id == group_id,
            GroupMember.role == "admin",
            GroupMember.status == "active",
            GroupMember.user_id != target_user_id
        ).count()
        if other_admins == 0:
            # Promote the next member if one exists
            next_member = db.query(GroupMember).filter(
                GroupMember.group_id == group_id,
                GroupMember.status == "active",
                GroupMember.user_id != target_user_id
            ).first()
            if next_member:
                next_member.role = "admin"

    target_membership.status = "left"
    db.commit()
    return {"message": "Member removed from group"}


# -------------------------------------------------------------
# GROUP DASHBOARD & ANALYTICS
# -------------------------------------------------------------

@router.get("/{group_id}/dashboard", response_model=GroupDashboardResponse)
def get_group_dashboard(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    get_user_group_membership(db, group_id, current_user.id)
    grp = db.query(Group).filter(Group.id == group_id).first()
    if not grp:
        raise HTTPException(status_code=404, detail="Group not found")

    total_expense, balances, _ = calculate_net_balances(db, group_id)

    # Current month expenses
    today = datetime.date.today()
    month_start = datetime.date(today.year, today.month, 1)
    month_expenses = db.query(func.coalesce(func.sum(GroupExpense.amount), 0)).filter(
        GroupExpense.group_id == group_id,
        GroupExpense.expense_date >= month_start
    ).scalar()

    # My stats
    my_balance_info = next((b for b in balances if b.user_id == current_user.id), None)
    my_total_paid = my_balance_info.total_paid if my_balance_info else 0.0
    my_total_share = my_balance_info.total_share if my_balance_info else 0.0
    my_net_balance = my_balance_info.net_balance if my_balance_info else 0.0

    # Category breakdown
    expenses = db.query(GroupExpense).filter(GroupExpense.group_id == group_id).all()
    cat_ids = list(set([e.category_id for e in expenses if e.category_id]))
    cats = db.query(ExpenseCategory).filter(ExpenseCategory.id.in_(cat_ids)).all() if cat_ids else []
    cat_map = {c.id: c for c in cats}

    cat_totals = {}
    for e in expenses:
        cat_name = cat_map[e.category_id].name if e.category_id in cat_map else "General"
        cat_color = cat_map[e.category_id].color if e.category_id in cat_map else "#7557E8"
        cat_icon = cat_map[e.category_id].icon if e.category_id in cat_map else "💳"
        if cat_name not in cat_totals:
            cat_totals[cat_name] = {"name": cat_name, "value": 0.0, "color": cat_color, "icon": cat_icon}
        cat_totals[cat_name]["value"] += float(e.amount)

    category_breakdown = list(cat_totals.values())
    if not category_breakdown:
        category_breakdown = [{"name": "No Expenses Yet", "value": 0, "color": "#22B8A0", "icon": "🎉"}]

    # Member summaries for chart
    member_summaries = []
    for b in balances:
        member_summaries.append({
            "name": b.user_name,
            "paid": b.total_paid,
            "share": b.total_share,
            "net": b.net_balance,
            "status": b.status
        })

    # Recent 5 expenses
    recent_exp_objs = db.query(GroupExpense).filter(
        GroupExpense.group_id == group_id
    ).order_by(GroupExpense.expense_date.desc(), GroupExpense.id.desc()).limit(5).all()

    user_map = {u.id: u for u in db.query(User).all()}
    recent_expenses = []
    for r in recent_exp_objs:
        payer = user_map.get(r.paid_by)
        cat = cat_map.get(r.category_id)
        recent_expenses.append({
            "id": r.id,
            "title": r.title,
            "amount": float(r.amount),
            "payer_name": payer.full_name if payer else "Member",
            "date": r.expense_date.strftime("%b %d, %Y"),
            "category": cat.name if cat else "General",
            "icon": cat.icon if cat else "💳",
            "payment_method": r.payment_method
        })

    # Pending inbox items count
    pending_inbox = db.query(GroupInbox).filter(
        GroupInbox.group_id == group_id,
        GroupInbox.status == "pending"
    ).count()

    return GroupDashboardResponse(
        group_id=grp.id,
        group_name=grp.name,
        group_type=grp.group_type,
        description=grp.description,
        currency=grp.currency,
        total_expenses=round(total_expense, 2),
        this_month_expenses=round(float(month_expenses), 2),
        member_count=len(balances),
        my_total_paid=round(my_total_paid, 2),
        my_total_share=round(my_total_share, 2),
        my_net_balance=round(my_net_balance, 2),
        pending_inbox_count=pending_inbox,
        category_breakdown=category_breakdown,
        member_summaries=member_summaries,
        recent_expenses=recent_expenses
    )


# -------------------------------------------------------------
# GROUP EXPENSES & SPLIT SYSTEM
# -------------------------------------------------------------

@router.get("/{group_id}/expenses", response_model=List[GroupExpenseOut])
def get_group_expenses(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    get_user_group_membership(db, group_id, current_user.id)

    expenses = db.query(GroupExpense).filter(
        GroupExpense.group_id == group_id
    ).order_by(GroupExpense.expense_date.desc(), GroupExpense.id.desc()).all()

    if not expenses:
        return []

    expense_ids = [e.id for e in expenses]
    splits = db.query(GroupExpenseSplit).filter(GroupExpenseSplit.group_expense_id.in_(expense_ids)).all()

    user_map = {u.id: u for u in db.query(User).all()}
    cat_map = {c.id: c for c in db.query(ExpenseCategory).all()}

    splits_by_exp = {}
    for s in splits:
        if s.group_expense_id not in splits_by_exp:
            splits_by_exp[s.group_expense_id] = []
        u = user_map.get(s.user_id)
        splits_by_exp[s.group_expense_id].append(
            GroupExpenseSplitOut(
                id=s.id,
                user_id=s.user_id,
                user_name=u.full_name if u else "User",
                owed_amount=float(s.owed_amount),
                percentage=float(s.percentage) if s.percentage else None,
                is_settled=s.is_settled
            )
        )

    results = []
    for e in expenses:
        payer = user_map.get(e.paid_by)
        cat = cat_map.get(e.category_id)
        results.append(
            GroupExpenseOut(
                id=e.id,
                group_id=e.group_id,
                title=e.title,
                amount=float(e.amount),
                paid_by=e.paid_by,
                payer_name=payer.full_name if payer else "Member",
                category_id=e.category_id,
                category_name=cat.name if cat else "General",
                category_icon=cat.icon if cat else "💳",
                split_type=e.split_type,
                expense_date=e.expense_date.strftime("%b %d, %Y"),
                payment_method=e.payment_method,
                description=e.description,
                splits=splits_by_exp.get(e.id, []),
                created_at=e.created_at.strftime("%b %d, %Y")
            )
        )
    return results


@router.post("/{group_id}/expenses", response_model=GroupExpenseOut)
def add_group_expense(
    group_id: int,
    expense_in: GroupExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    get_user_group_membership(db, group_id, current_user.id)

    total_amount = Decimal(str(expense_in.amount))
    if total_amount <= 0:
        raise HTTPException(status_code=400, detail="Expense amount must be greater than 0")

    # Determine payer
    payer_id = expense_in.paid_by if expense_in.paid_by else current_user.id
    # Ensure payer is an active member
    payer_membership = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == payer_id,
        GroupMember.status == "active"
    ).first()
    if not payer_membership:
        raise HTTPException(status_code=400, detail="The selected payer is not an active group member")

    # Resolve category
    category_id = expense_in.category_id
    if not category_id and expense_in.category_name:
        cat = db.query(ExpenseCategory).filter(ExpenseCategory.name == expense_in.category_name).first()
        if cat:
            category_id = cat.id

    # Parse date
    exp_date = datetime.date.today()
    if expense_in.expense_date:
        try:
            exp_date = datetime.datetime.strptime(expense_in.expense_date, "%Y-%m-%d").date()
        except Exception:
            pass

    # Create GroupExpense
    new_expense = GroupExpense(
        group_id=group_id,
        paid_by=payer_id,
        category_id=category_id,
        title=expense_in.title.strip(),
        amount=total_amount,
        split_type=expense_in.split_type or "equal",
        expense_date=exp_date,
        payment_method=expense_in.payment_method or "UPI",
        description=expense_in.description
    )
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)

    # Calculate splits
    all_members = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.status == "active"
    ).all()
    all_member_ids = [m.user_id for m in all_members]

    split_objects = []

    if new_expense.split_type == "equal":
        # If participants specified, split only among them; else all members
        participants = expense_in.participant_ids if expense_in.participant_ids else all_member_ids
        participants = [p for p in participants if p in all_member_ids]
        if not participants:
            participants = all_member_ids

        n = len(participants)
        base_share = (total_amount / Decimal(n)).quantize(Decimal("0.01"))
        # Adjust remainder cents on the first participant
        remainder = total_amount - (base_share * Decimal(n))

        for idx, uid in enumerate(participants):
            share = base_share + (remainder if idx == 0 else Decimal("0.00"))
            split_obj = GroupExpenseSplit(
                group_expense_id=new_expense.id,
                user_id=uid,
                owed_amount=share,
                percentage=(Decimal("100.00") / Decimal(n)).quantize(Decimal("0.01")),
                is_settled=False
            )
            split_objects.append(split_obj)
            db.add(split_obj)

    elif new_expense.split_type == "custom":
        if not expense_in.splits:
            raise HTTPException(status_code=400, detail="Custom splits must be specified")

        split_sum = sum(Decimal(str(s.owed_amount)) for s in expense_in.splits)
        if abs(split_sum - total_amount) > Decimal("0.05"):
            raise HTTPException(
                status_code=400,
                detail=f"Sum of custom splits (₹{split_sum}) must equal total expense amount (₹{total_amount})"
            )

        for s in expense_in.splits:
            pct = (Decimal(str(s.owed_amount)) / total_amount * Decimal("100.00")).quantize(Decimal("0.01")) if total_amount > 0 else Decimal("0.00")
            split_obj = GroupExpenseSplit(
                group_expense_id=new_expense.id,
                user_id=s.user_id,
                owed_amount=Decimal(str(s.owed_amount)),
                percentage=pct,
                is_settled=False
            )
            split_objects.append(split_obj)
            db.add(split_obj)

    elif new_expense.split_type == "single":
        # Single member owes 100%
        single_uid = expense_in.participant_ids[0] if (expense_in.participant_ids and len(expense_in.participant_ids) > 0) else payer_id
        split_obj = GroupExpenseSplit(
            group_expense_id=new_expense.id,
            user_id=single_uid,
            owed_amount=total_amount,
            percentage=Decimal("100.00"),
            is_settled=False
        )
        split_objects.append(split_obj)
        db.add(split_obj)

    db.commit()

    # Create notifications for participants (excluding creator/payer)
    grp = db.query(Group).filter(Group.id == group_id).first()
    payer_user = db.query(User).filter(User.id == payer_id).first()
    for s in split_objects:
        if s.user_id != current_user.id:
            db.add(Notification(
                user_id=s.user_id,
                title=f"New Expense in {grp.name if grp else 'Group'}",
                message=f"{payer_user.full_name if payer_user else 'Someone'} added '{new_expense.title}' (₹{float(total_amount)}). Your share: ₹{float(s.owed_amount)}.",
                type="expense_added",
                action_url=f"/groups/{group_id}"
            ))
    db.commit()

    user_map = {u.id: u for u in db.query(User).all()}
    cat = db.query(ExpenseCategory).filter(ExpenseCategory.id == new_expense.category_id).first()

    splits_out = [
        GroupExpenseSplitOut(
            id=s.id,
            user_id=s.user_id,
            user_name=user_map[s.user_id].full_name if s.user_id in user_map else "User",
            owed_amount=float(s.owed_amount),
            percentage=float(s.percentage) if s.percentage else None,
            is_settled=s.is_settled
        )
        for s in split_objects
    ]

    return GroupExpenseOut(
        id=new_expense.id,
        group_id=new_expense.group_id,
        title=new_expense.title,
        amount=float(new_expense.amount),
        paid_by=new_expense.paid_by,
        payer_name=payer_user.full_name if payer_user else "Member",
        category_id=new_expense.category_id,
        category_name=cat.name if cat else "General",
        category_icon=cat.icon if cat else "💳",
        split_type=new_expense.split_type,
        expense_date=new_expense.expense_date.strftime("%b %d, %Y"),
        payment_method=new_expense.payment_method,
        description=new_expense.description,
        splits=splits_out,
        created_at=new_expense.created_at.strftime("%b %d, %Y")
    )


@router.delete("/{group_id}/expenses/{expense_id}")
def delete_group_expense(
    group_id: int,
    expense_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    membership = get_user_group_membership(db, group_id, current_user.id)
    expense = db.query(GroupExpense).filter(
        GroupExpense.id == expense_id,
        GroupExpense.group_id == group_id
    ).first()

    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    # Only expense payer or group admin can delete
    if expense.paid_by != current_user.id and membership.role != "admin":
        raise HTTPException(status_code=403, detail="Only the person who paid or an admin can delete this expense")

    db.delete(expense)
    db.commit()
    return {"message": "Expense deleted successfully"}


# -------------------------------------------------------------
# BALANCES & SETTLEMENTS ("WHO OWES WHOM")
# -------------------------------------------------------------

@router.get("/{group_id}/balances", response_model=GroupBalancesResponse)
def get_group_balances_view(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    get_user_group_membership(db, group_id, current_user.id)
    total_expense, balances, suggested = calculate_net_balances(db, group_id)
    return GroupBalancesResponse(
        total_expense=round(total_expense, 2),
        member_balances=balances,
        suggested_settlements=suggested
    )


@router.post("/{group_id}/settle", response_model=GroupSettlementOut)
def record_settlement(
    group_id: int,
    settlement_in: GroupSettlementCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    get_user_group_membership(db, group_id, current_user.id)

    amt = Decimal(str(settlement_in.amount))
    if amt <= 0:
        raise HTTPException(status_code=400, detail="Settlement amount must be greater than 0")

    if settlement_in.payer_id == settlement_in.receiver_id:
        raise HTTPException(status_code=400, detail="Payer and receiver cannot be the same member")

    # Verify both are active group members
    for uid in [settlement_in.payer_id, settlement_in.receiver_id]:
        m = db.query(GroupMember).filter(
            GroupMember.group_id == group_id,
            GroupMember.user_id == uid,
            GroupMember.status == "active"
        ).first()
        if not m:
            raise HTTPException(status_code=400, detail=f"User ID {uid} is not an active group member")

    settlement = GroupSettlement(
        group_id=group_id,
        payer_id=settlement_in.payer_id,
        receiver_id=settlement_in.receiver_id,
        amount=amt,
        payment_method=settlement_in.payment_method or "UPI",
        notes=settlement_in.notes
    )
    db.add(settlement)
    db.commit()
    db.refresh(settlement)

    payer = db.query(User).filter(User.id == settlement_in.payer_id).first()
    receiver = db.query(User).filter(User.id == settlement_in.receiver_id).first()
    grp = db.query(Group).filter(Group.id == group_id).first()

    # Notify receiver
    db.add(Notification(
        user_id=settlement_in.receiver_id,
        title=f"Payment Received in {grp.name if grp else 'Group'}",
        message=f"{payer.full_name} recorded a settlement payment of ₹{float(amt)} to you via {settlement.payment_method}.",
        type="settlement",
        action_url=f"/groups/{group_id}"
    ))
    db.commit()

    return GroupSettlementOut(
        id=settlement.id,
        group_id=settlement.group_id,
        payer_id=settlement.payer_id,
        payer_name=payer.full_name if payer else "Member",
        receiver_id=settlement.receiver_id,
        receiver_name=receiver.full_name if receiver else "Member",
        amount=float(settlement.amount),
        payment_method=settlement.payment_method,
        notes=settlement.notes,
        settled_at=settlement.settled_at.strftime("%b %d, %Y - %I:%M %p")
    )


@router.get("/{group_id}/settlements", response_model=List[GroupSettlementOut])
def get_group_settlements(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    get_user_group_membership(db, group_id, current_user.id)

    settlements = db.query(GroupSettlement).filter(
        GroupSettlement.group_id == group_id
    ).order_by(GroupSettlement.settled_at.desc()).all()

    if not settlements:
        return []

    users = db.query(User).all()
    user_map = {u.id: u for u in users}

    results = []
    for s in settlements:
        p = user_map.get(s.payer_id)
        r = user_map.get(s.receiver_id)
        results.append(
            GroupSettlementOut(
                id=s.id,
                group_id=s.group_id,
                payer_id=s.payer_id,
                payer_name=p.full_name if p else "Member",
                receiver_id=s.receiver_id,
                receiver_name=r.full_name if r else "Member",
                amount=float(s.amount),
                payment_method=s.payment_method,
                notes=s.notes,
                settled_at=s.settled_at.strftime("%b %d, %Y - %I:%M %p")
            )
        )
    return results
