from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import ExpenseCategory, IncomeCategory, Expense, Income, User
from app.dependencies.auth import get_optional_current_user
from app.routers.dashboard import ensure_initial_seed
from pydantic import BaseModel

router = APIRouter(prefix="/api/categories", tags=["Category Management"])

class CategoryCreate(BaseModel):
    name: str
    icon: Optional[str] = "🏷️"
    color: Optional[str] = "#7557E8"
    type: Optional[str] = "expense"  # expense or income

class CategoryOut(BaseModel):
    id: int
    name: str
    icon: str
    color: str
    type: str
    total_spent: Optional[float] = 0.0

@router.get("", response_model=List[CategoryOut])
def get_categories(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    user = current_user or ensure_initial_seed(db)

    expense_cats = db.query(ExpenseCategory).all()
    income_cats = db.query(IncomeCategory).all()

    # Calculate total spent for each expense category
    user_expenses = db.query(Expense).filter(Expense.user_id == user.id).all()
    cat_spent = {}
    for exp in user_expenses:
        cat_spent[exp.category_id] = cat_spent.get(exp.category_id, 0.0) + float(exp.amount)

    results = []
    for c in expense_cats:
        results.append(
            CategoryOut(
                id=c.id,
                name=c.name,
                icon=c.icon,
                color=c.color,
                type="expense",
                total_spent=round(cat_spent.get(c.id, 0.0), 2)
            )
        )

    for c in income_cats:
        results.append(
            CategoryOut(
                id=c.id,
                name=c.name,
                icon=c.icon,
                color=c.color,
                type="income",
                total_spent=0.0
            )
        )

    return results


@router.post("", response_model=CategoryOut)
def create_category(
    item: CategoryCreate,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    user = current_user or ensure_initial_seed(db)

    if item.type == "income":
        cat = IncomeCategory(user_id=user.id, name=item.name.strip(), icon=item.icon or "💰", color=item.color or "#22B8A0")
        db.add(cat)
        db.commit()
        db.refresh(cat)
        return CategoryOut(id=cat.id, name=cat.name, icon=cat.icon, color=cat.color, type="income", total_spent=0.0)
    else:
        cat = ExpenseCategory(user_id=user.id, name=item.name.strip(), icon=item.icon or "💳", color=item.color or "#7557E8")
        db.add(cat)
        db.commit()
        db.refresh(cat)
        return CategoryOut(id=cat.id, name=cat.name, icon=cat.icon, color=cat.color, type="expense", total_spent=0.0)


@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    type: str = "expense",
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    user = current_user or ensure_initial_seed(db)

    if type == "expense":
        # Check if category is being used by existing expenses
        in_use = db.query(Expense).filter(Expense.category_id == category_id).first()
        if in_use:
            raise HTTPException(
                status_code=400,
                detail="Cannot delete category that is currently linked to existing transactions."
            )
        cat = db.query(ExpenseCategory).filter(ExpenseCategory.id == category_id).first()
    else:
        in_use = db.query(Income).filter(Income.category_id == category_id).first()
        if in_use:
            raise HTTPException(
                status_code=400,
                detail="Cannot delete category that is currently linked to existing transactions."
            )
        cat = db.query(IncomeCategory).filter(IncomeCategory.id == category_id).first()

    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    db.delete(cat)
    db.commit()
    return {"message": "Category deleted successfully"}

