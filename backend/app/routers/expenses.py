import datetime
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Expense, ExpenseCategory, User
from app.dependencies.auth import get_current_user
from app.routers.dashboard import ensure_initial_seed
from pydantic import BaseModel

router = APIRouter(prefix="/api/expenses", tags=["Expense Management"])

class ExpenseInput(BaseModel):
    category_id: Optional[int] = None
    category_name: Optional[str] = "Food"
    amount: Decimal
    payment_method: Optional[str] = "Cash"
    description: Optional[str] = None
    transaction_date: Optional[str] = None
    receipt_url: Optional[str] = None

class ExpenseDetailOut(BaseModel):
    id: int
    amount: float
    category_id: Optional[int]
    category_name: str
    category_icon: str
    category_color: str
    payment_method: str
    description: Optional[str]
    transaction_date: str
    receipt_url: Optional[str] = None

@router.get("", response_model=List[ExpenseDetailOut])
def get_expenses(
    category: Optional[str] = None,
    payment_method: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = current_user
    query = db.query(Expense).filter(Expense.user_id == user.id)

    if search:
        query = query.filter(Expense.description.ilike(f"%{search}%"))
    if payment_method:
        query = query.filter(Expense.payment_method == payment_method)

    cat_map = {c.id: c for c in db.query(ExpenseCategory).all()}
    if category:
        target_cat = db.query(ExpenseCategory).filter(ExpenseCategory.name.ilike(category)).first()
        if target_cat:
            query = query.filter(Expense.category_id == target_cat.id)

    expenses = query.order_by(Expense.transaction_date.desc(), Expense.id.desc()).all()

    results = []
    for exp in expenses:
        cat = cat_map.get(exp.category_id)
        results.append(
            ExpenseDetailOut(
                id=exp.id,
                amount=float(exp.amount),
                category_id=exp.category_id,
                category_name=cat.name if cat else "Other",
                category_icon=cat.icon if cat else "💳",
                category_color=cat.color if cat else "#7557E8",
                payment_method=exp.payment_method or "Cash",
                description=exp.description,
                transaction_date=exp.transaction_date.strftime("%b %d, %Y"),
                receipt_url=exp.receipt_url
            )
        )
    return results


@router.post("", response_model=ExpenseDetailOut)
def create_expense_item(
    item: ExpenseInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = current_user

    category = None
    if item.category_id:
        category = db.query(ExpenseCategory).filter(ExpenseCategory.id == item.category_id).first()
    if not category and item.category_name:
        category = db.query(ExpenseCategory).filter(ExpenseCategory.name.ilike(item.category_name)).first()
        if not category:
            category = ExpenseCategory(user_id=user.id, name=item.category_name, icon="💳", color="#7557E8")
            db.add(category)
            db.commit()
            db.refresh(category)

    tx_date = datetime.date.today()
    if item.transaction_date:
        try:
            tx_date = datetime.datetime.strptime(item.transaction_date, "%Y-%m-%d").date()
        except ValueError:
            pass

    new_expense = Expense(
        user_id=user.id,
        category_id=category.id if category else None,
        amount=item.amount,
        payment_method=item.payment_method or "Cash",
        description=item.description or (category.name if category else "Expense"),
        transaction_date=tx_date,
        receipt_url=item.receipt_url
    )
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)

    return ExpenseDetailOut(
        id=new_expense.id,
        amount=float(new_expense.amount),
        category_id=new_expense.category_id,
        category_name=category.name if category else "Other",
        category_icon=category.icon if category else "💳",
        category_color=category.color if category else "#7557E8",
        payment_method=new_expense.payment_method or "Cash",
        description=new_expense.description,
        transaction_date=new_expense.transaction_date.strftime("%b %d, %Y"),
        receipt_url=new_expense.receipt_url
    )


@router.delete("/{expense_id}")
def delete_expense(
    expense_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = current_user
    exp = db.query(Expense).filter(Expense.id == expense_id, Expense.user_id == user.id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Expense record not found")

    db.delete(exp)
    db.commit()
    return {"message": "Expense deleted successfully"}



@router.put("/{expense_id}", response_model=ExpenseDetailOut)
def update_expense(
    expense_id: int,
    item: ExpenseInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = current_user
    exp = db.query(Expense).filter(Expense.id == expense_id, Expense.user_id == user.id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Expense record not found")

    if item.category_name:
        category = db.query(ExpenseCategory).filter(ExpenseCategory.name.ilike(item.category_name)).first()
        if category:
            exp.category_id = category.id

    if item.amount:
        exp.amount = item.amount
    if item.description:
        exp.description = item.description
    if item.payment_method:
        exp.payment_method = item.payment_method
    if item.transaction_date:
        try:
            exp.transaction_date = datetime.datetime.strptime(item.transaction_date, "%Y-%m-%d").date()
        except ValueError:
            pass

    db.commit()
    db.refresh(exp)

    cat = db.query(ExpenseCategory).filter(ExpenseCategory.id == exp.category_id).first()
    return ExpenseDetailOut(
        id=exp.id,
        amount=float(exp.amount),
        category_id=exp.category_id,
        category_name=cat.name if cat else "Other",
        category_icon=cat.icon if cat else "💳",
        category_color=cat.color if cat else "#7557E8",
        payment_method=exp.payment_method or "Cash",
        description=exp.description,
        transaction_date=exp.transaction_date.strftime("%b %d, %Y")
    )
