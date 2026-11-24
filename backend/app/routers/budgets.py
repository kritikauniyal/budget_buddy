import datetime
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import MonthlyBudget, CategoryBudget, ExpenseCategory, Expense, User
from app.dependencies.auth import get_current_user
from app.routers.dashboard import ensure_initial_seed
from pydantic import BaseModel

router = APIRouter(prefix="/api/budgets", tags=["Budget Management"])

class CategoryBudgetInput(BaseModel):
    category_id: int
    budgeted_amount: Decimal

class SetBudgetInput(BaseModel):
    month: Optional[int] = None
    year: Optional[int] = None
    total_budget: Decimal
    category_budgets: Optional[List[CategoryBudgetInput]] = None

class CategoryBudgetOut(BaseModel):
    category_id: int
    category_name: str
    category_icon: str
    category_color: str
    budgeted_amount: float
    spent_amount: float
    remaining_amount: float
    utilization_percentage: float
    alert_status: str  # "normal", "warning_80", "exceeded_100"

class BudgetSummaryOut(BaseModel):
    month: int
    year: int
    total_budget: float
    total_spent: float
    remaining_budget: float
    utilization_percentage: float
    alert_status: str  # "normal", "warning_80", "exceeded_100"
    categories: List[CategoryBudgetOut]

@router.get("", response_model=BudgetSummaryOut)
def get_current_budget(
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = current_user
    now = datetime.date.today()
    target_month = month or now.month
    target_year = year or now.year

    # Find monthly budget
    mb = db.query(MonthlyBudget).filter(
        MonthlyBudget.user_id == user.id,
        MonthlyBudget.month == target_month,
        MonthlyBudget.year == target_year
    ).first()

    total_budget = float(mb.total_budget) if mb else 0.0

    # Calculate actual spending this month
    all_expenses = db.query(Expense).filter(Expense.user_id == user.id).all()
    this_month_expenses = [
        e for e in all_expenses
        if e.transaction_date.month == target_month and e.transaction_date.year == target_year
    ]
    total_spent = sum(float(e.amount) for e in this_month_expenses)
    remaining_budget = max(0.0, total_budget - total_spent) if total_budget > 0 else 0.0
    utilization = (total_spent / total_budget * 100) if total_budget > 0 else 0.0

    overall_status = "normal"
    if total_budget > 0:
        if utilization >= 100:
            overall_status = "exceeded_100"
        elif utilization >= 80:
            overall_status = "warning_80"

    # Category budgets breakdown
    expense_cats = db.query(ExpenseCategory).all()
    cat_spent_map = {}
    for exp in this_month_expenses:
        cat_spent_map[exp.category_id] = cat_spent_map.get(exp.category_id, 0.0) + float(exp.amount)

    cb_map = {cb.category_id: cb for cb in mb.category_budgets} if mb else {}

    cat_results = []
    for cat in expense_cats:
        cb = cb_map.get(cat.id)
        budgeted = float(cb.budgeted_amount) if cb else 0.0
        spent = cat_spent_map.get(cat.id, 0.0)
        cat_rem = max(0.0, budgeted - spent) if budgeted > 0 else 0.0
        cat_util = (spent / budgeted * 100) if budgeted > 0 else 0.0

        c_status = "normal"
        if budgeted > 0:
            if cat_util >= 100:
                c_status = "exceeded_100"
            elif cat_util >= 80:
                c_status = "warning_80"

        cat_results.append(
            CategoryBudgetOut(
                category_id=cat.id,
                category_name=cat.name,
                category_icon=cat.icon,
                category_color=cat.color,
                budgeted_amount=budgeted,
                spent_amount=spent,
                remaining_amount=cat_rem,
                utilization_percentage=round(cat_util, 1),
                alert_status=c_status
            )
        )

    return BudgetSummaryOut(
        month=target_month,
        year=target_year,
        total_budget=total_budget,
        total_spent=round(total_spent, 2),
        remaining_budget=round(remaining_budget, 2),
        utilization_percentage=round(utilization, 1),
        alert_status=overall_status,
        categories=cat_results
    )


@router.post("", response_model=BudgetSummaryOut)
def save_budget(
    item: SetBudgetInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = current_user
    now = datetime.date.today()
    target_month = item.month or now.month
    target_year = item.year or now.year

    mb = db.query(MonthlyBudget).filter(
        MonthlyBudget.user_id == user.id,
        MonthlyBudget.month == target_month,
        MonthlyBudget.year == target_year
    ).first()

    if not mb:
        mb = MonthlyBudget(user_id=user.id, month=target_month, year=target_year, total_budget=item.total_budget)
        db.add(mb)
    else:
        mb.total_budget = item.total_budget

    db.commit()
    db.refresh(mb)

    # Save category budgets if provided
    if item.category_budgets:
        for cb_in in item.category_budgets:
            existing_cb = db.query(CategoryBudget).filter(
                CategoryBudget.monthly_budget_id == mb.id,
                CategoryBudget.category_id == cb_in.category_id
            ).first()

            if existing_cb:
                existing_cb.budgeted_amount = cb_in.budgeted_amount
            else:
                db.add(
                    CategoryBudget(
                        monthly_budget_id=mb.id,
                        category_id=cb_in.category_id,
                        budgeted_amount=cb_in.budgeted_amount
                    )
                )
        db.commit()

    return get_current_budget(month=target_month, year=target_year, current_user=user, db=db)

