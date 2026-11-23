import datetime
from typing import List, Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import RecurringExpense, Expense, ExpenseCategory, User, Notification
from app.schemas.schemas import RecurringExpenseCreate, RecurringExpenseOut
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/api/recurring", tags=["Recurring Expenses"])


@router.get("", response_model=List[RecurringExpenseOut])
def get_recurring_expenses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    items = db.query(RecurringExpense).filter(
        RecurringExpense.user_id == current_user.id
    ).order_by(RecurringExpense.next_due_date.asc(), RecurringExpense.id.desc()).all()

    results = []
    for it in items:
        results.append(
            RecurringExpenseOut(
                id=it.id,
                user_id=it.user_id,
                title=it.title,
                amount=float(it.amount),
                category_name=it.category_name,
                frequency=it.frequency,
                start_date=it.start_date.strftime("%Y-%m-%d"),
                next_due_date=it.next_due_date.strftime("%Y-%m-%d"),
                is_active=it.is_active,
                notes=it.notes,
                created_at=it.created_at.strftime("%b %d, %Y")
            )
        )
    return results


@router.post("", response_model=RecurringExpenseOut)
def create_recurring_expense(
    body: RecurringExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if body.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")

    today = datetime.date.today()
    start_d = today
    if body.start_date:
        try:
            start_d = datetime.datetime.strptime(body.start_date, "%Y-%m-%d").date()
        except Exception:
            start_d = today

    next_d = start_d
    if body.next_due_date:
        try:
            next_d = datetime.datetime.strptime(body.next_due_date, "%Y-%m-%d").date()
        except Exception:
            next_d = start_d

    item = RecurringExpense(
        user_id=current_user.id,
        title=body.title.strip(),
        amount=body.amount,
        category_name=body.category_name or "Bills",
        frequency=body.frequency or "monthly",
        start_date=start_d,
        next_due_date=next_d,
        is_active=True,
        notes=body.notes.strip() if body.notes else None
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    return RecurringExpenseOut(
        id=item.id,
        user_id=item.user_id,
        title=item.title,
        amount=float(item.amount),
        category_name=item.category_name,
        frequency=item.frequency,
        start_date=item.start_date.strftime("%Y-%m-%d"),
        next_due_date=item.next_due_date.strftime("%Y-%m-%d"),
        is_active=item.is_active,
        notes=item.notes,
        created_at=item.created_at.strftime("%b %d, %Y")
    )


@router.delete("/{recurring_id}")
def delete_recurring_expense(
    recurring_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(RecurringExpense).filter(
        RecurringExpense.id == recurring_id,
        RecurringExpense.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Recurring expense not found")

    db.delete(item)
    db.commit()
    return {"message": "Recurring expense deleted successfully"}


@router.post("/{recurring_id}/log-now")
def log_recurring_expense_now(
    recurring_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(RecurringExpense).filter(
        RecurringExpense.id == recurring_id,
        RecurringExpense.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Recurring expense not found")

    # Find matching category id
    cat = db.query(ExpenseCategory).filter(
        ExpenseCategory.user_id == current_user.id,
        ExpenseCategory.name == item.category_name
    ).first()
    cat_id = cat.id if cat else None

    # Log actual expense
    today = datetime.date.today()
    actual_exp = Expense(
        user_id=current_user.id,
        category_id=cat_id,
        amount=item.amount,
        description=f"{item.title} (Auto-recurring {item.frequency})",
        payment_method="UPI",
        transaction_date=today
    )
    db.add(actual_exp)

    # Advance next_due_date
    if item.frequency == "daily":
        item.next_due_date = item.next_due_date + datetime.timedelta(days=1)
    elif item.frequency == "weekly":
        item.next_due_date = item.next_due_date + datetime.timedelta(days=7)
    elif item.frequency == "yearly":
        item.next_due_date = datetime.date(item.next_due_date.year + 1, item.next_due_date.month, item.next_due_date.day)
    else:  # monthly default
        m = item.next_due_date.month + 1
        y = item.next_due_date.year
        if m > 12:
            m = 1
            y += 1
        # Handle month end overflow
        import calendar
        max_day = calendar.monthrange(y, m)[1]
        day = min(item.next_due_date.day, max_day)
        item.next_due_date = datetime.date(y, m, day)

    db.commit()

    return {
        "message": f"Successfully recorded '{item.title}' (₹{item.amount}) to your live expenses! Next due: {item.next_due_date.strftime('%b %d, %Y')}",
        "next_due_date": item.next_due_date.strftime("%Y-%m-%d")
    }

