import datetime
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Income, IncomeCategory, User
from app.dependencies.auth import get_optional_current_user
from app.routers.dashboard import ensure_initial_seed
from pydantic import BaseModel

router = APIRouter(prefix="/api/incomes", tags=["Income Management"])

class IncomeCreate(BaseModel):
    category_id: Optional[int] = None
    category_name: Optional[str] = "Salary"
    amount: Decimal
    description: Optional[str] = None
    transaction_date: Optional[str] = None

class IncomeOut(BaseModel):
    id: int
    amount: float
    category_id: Optional[int]
    category_name: str
    category_icon: str
    category_color: str
    description: Optional[str]
    transaction_date: str

@router.get("", response_model=List[IncomeOut])
def get_incomes(
    search: Optional[str] = None,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    user = current_user or ensure_initial_seed(db)
    query = db.query(Income).filter(Income.user_id == user.id)

    if search:
        query = query.filter(Income.description.ilike(f"%{search}%"))

    incomes = query.order_by(Income.transaction_date.desc(), Income.id.desc()).all()
    cat_map = {c.id: c for c in db.query(IncomeCategory).all()}

    results = []
    for inc in incomes:
        cat = cat_map.get(inc.category_id)
        results.append(
            IncomeOut(
                id=inc.id,
                amount=float(inc.amount),
                category_id=inc.category_id,
                category_name=cat.name if cat else "Other",
                category_icon=cat.icon if cat else "💰",
                category_color=cat.color if cat else "#22B8A0",
                description=inc.description,
                transaction_date=inc.transaction_date.strftime("%b %d, %Y")
            )
        )
    return results


@router.post("", response_model=IncomeOut)
def create_income(
    item: IncomeCreate,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    user = current_user or ensure_initial_seed(db)

    # Resolve category
    category = None
    if item.category_id:
        category = db.query(IncomeCategory).filter(IncomeCategory.id == item.category_id).first()
    if not category and item.category_name:
        category = db.query(IncomeCategory).filter(IncomeCategory.name.ilike(item.category_name)).first()
        if not category:
            category = IncomeCategory(user_id=user.id, name=item.category_name, icon="💰", color="#22B8A0")
            db.add(category)
            db.commit()
            db.refresh(category)

    tx_date = datetime.date.today()
    if item.transaction_date:
        try:
            tx_date = datetime.datetime.strptime(item.transaction_date, "%Y-%m-%d").date()
        except ValueError:
            pass

    new_income = Income(
        user_id=user.id,
        category_id=category.id if category else None,
        amount=item.amount,
        description=item.description or (category.name if category else "Income"),
        transaction_date=tx_date
    )
    db.add(new_income)
    db.commit()
    db.refresh(new_income)

    return IncomeOut(
        id=new_income.id,
        amount=float(new_income.amount),
        category_id=new_income.category_id,
        category_name=category.name if category else "Other",
        category_icon=category.icon if category else "💰",
        category_color=category.color if category else "#22B8A0",
        description=new_income.description,
        transaction_date=new_income.transaction_date.strftime("%b %d, %Y")
    )


@router.delete("/{income_id}")
def delete_income(
    income_id: int,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    user = current_user or ensure_initial_seed(db)
    inc = db.query(Income).filter(Income.id == income_id, Income.user_id == user.id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Income record not found")

    db.delete(inc)
    db.commit()
    return {"message": "Income record deleted successfully"}



@router.put("/{income_id}", response_model=IncomeOut)
def update_income(
    income_id: int,
    item: IncomeCreate,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    user = current_user or ensure_initial_seed(db)
    inc = db.query(Income).filter(Income.id == income_id, Income.user_id == user.id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Income record not found")

    if item.category_name:
        category = db.query(IncomeCategory).filter(IncomeCategory.name.ilike(item.category_name)).first()
        if category:
            inc.category_id = category.id

    if item.amount:
        inc.amount = item.amount
    if item.description:
        inc.description = item.description
    if item.transaction_date:
        try:
            inc.transaction_date = datetime.datetime.strptime(item.transaction_date, "%Y-%m-%d").date()
        except ValueError:
            pass

    db.commit()
    db.refresh(inc)

    cat = db.query(IncomeCategory).filter(IncomeCategory.id == inc.category_id).first()
    return IncomeOut(
        id=inc.id,
        amount=float(inc.amount),
        category_id=inc.category_id,
        category_name=cat.name if cat else "Other",
        category_icon=cat.icon if cat else "💰",
        category_color=cat.color if cat else "#22B8A0",
        description=inc.description,
        transaction_date=inc.transaction_date.strftime("%b %d, %Y")
    )
