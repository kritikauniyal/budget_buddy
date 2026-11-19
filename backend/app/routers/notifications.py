import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Notification, User, MonthlyBudget, Expense
from app.dependencies.auth import get_optional_current_user
from app.routers.dashboard import ensure_initial_seed
from pydantic import BaseModel

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    type: str  # budget_warning, budget_exceeded, approval, rejection, info
    is_read: bool
    created_at: str

@router.get("", response_model=List[NotificationOut])
def get_notifications(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    user = current_user or ensure_initial_seed(db)

    # Check budget dynamically to trigger fresh alerts if needed
    today = datetime.date.today()
    mb = db.query(MonthlyBudget).filter(
        MonthlyBudget.user_id == user.id,
        MonthlyBudget.month == today.month,
        MonthlyBudget.year == today.year
    ).first()

    if mb and mb.total_budget > 0:
        expenses = db.query(Expense).filter(Expense.user_id == user.id).all()
        spent = sum(float(e.amount) for e in expenses if e.transaction_date.month == today.month and e.transaction_date.year == today.year)
        util = (spent / float(mb.total_budget) * 100)

        if util >= 100:
            existing = db.query(Notification).filter(
                Notification.user_id == user.id,
                Notification.type == "budget_exceeded",
                Notification.title.ilike(f"%{today.strftime('%B %Y')}%")
            ).first()
            if not existing:
                db.add(Notification(
                    user_id=user.id,
                    title=f"Monthly Budget Exceeded - {today.strftime('%B %Y')}",
                    message=f"You have spent ₹{spent:,.2f}, surpassing your ₹{float(mb.total_budget):,.2f} budget allocation.",
                    type="budget_exceeded"
                ))
                db.commit()
        elif util >= 80:
            existing = db.query(Notification).filter(
                Notification.user_id == user.id,
                Notification.type == "budget_warning",
                Notification.title.ilike(f"%{today.strftime('%B %Y')}%")
            ).first()
            if not existing:
                db.add(Notification(
                    user_id=user.id,
                    title=f"Budget Alert (80% Reached) - {today.strftime('%B %Y')}",
                    message=f"You have used {util:.1f}% of your monthly allowance.",
                    type="budget_warning"
                ))
                db.commit()

    notes = db.query(Notification).filter(Notification.user_id == user.id).order_by(Notification.created_at.desc()).all()
    return [
        NotificationOut(
            id=n.id,
            title=n.title,
            message=n.message,
            type=n.type,
            is_read=n.is_read,
            created_at=n.created_at.strftime("%b %d, %Y - %I:%M %p")
        ) for n in notes
    ]


@router.put("/{notification_id}/read")
def mark_read(
    notification_id: int,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    user = current_user or ensure_initial_seed(db)
    note = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Notification not found")
    note.is_read = True
    db.commit()
    return {"message": "Notification marked as read"}


@router.put("/read-all")
def mark_all_read(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    user = current_user or ensure_initial_seed(db)
    db.query(Notification).filter(Notification.user_id == user.id, Notification.is_read == False).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}

