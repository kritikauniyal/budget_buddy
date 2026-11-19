import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Income, Expense, IncomeCategory, ExpenseCategory, User
from app.dependencies.auth import get_optional_current_user
from app.routers.dashboard import ensure_initial_seed
from pydantic import BaseModel

router = APIRouter(prefix="/api/transactions", tags=["Unified Transactions Ledger"])

class TransactionItemOut(BaseModel):
    id: int
    name: str
    category: str
    category_icon: str
    amount: float
    type: str  # income or expense
    payment_method: Optional[str]
    date: str
    raw_date: str

class PaginatedTransactions(BaseModel):
    items: List[TransactionItemOut]
    total: int
    page: int
    limit: int

@router.get("", response_model=PaginatedTransactions)
def get_all_transactions(
    type_filter: Optional[str] = Query(None, description="all, income, expense"),
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    user = current_user or ensure_initial_seed(db)
    if not user:
        return PaginatedTransactions(items=[], total=0, page=page, limit=limit)

    inc_cats = {c.id: c for c in db.query(IncomeCategory).all()}
    exp_cats = {c.id: c for c in db.query(ExpenseCategory).all()}

    combined = []

    # Fetch Incomes
    if type_filter in [None, "all", "income"]:
        q_inc = db.query(Income).filter(Income.user_id == user.id)
        if search:
            q_inc = q_inc.filter(Income.description.ilike(f"%{search}%"))
        for inc in q_inc.all():
            c = inc_cats.get(inc.category_id)
            combined.append({
                "id": inc.id,
                "name": inc.description or (c.name if c else "Income"),
                "category": c.name if c else "Salary",
                "category_icon": c.icon if c else "💰",
                "amount": float(inc.amount),
                "type": "income",
                "payment_method": "Bank Deposit",
                "date_obj": inc.transaction_date,
                "date": inc.transaction_date.strftime("%b %d, %Y"),
                "raw_date": inc.transaction_date.strftime("%Y-%m-%d"),
            })

    # Fetch Expenses
    if type_filter in [None, "all", "expense"]:
        q_exp = db.query(Expense).filter(Expense.user_id == user.id)
        if search:
            q_exp = q_exp.filter(Expense.description.ilike(f"%{search}%"))
        for exp in q_exp.all():
            c = exp_cats.get(exp.category_id)
            combined.append({
                "id": exp.id,
                "name": exp.description or (c.name if c else "Expense"),
                "category": c.name if c else "Other",
                "category_icon": c.icon if c else "💳",
                "amount": float(exp.amount),
                "type": "expense",
                "payment_method": exp.payment_method or "Cash",
                "date_obj": exp.transaction_date,
                "date": exp.transaction_date.strftime("%b %d, %Y"),
                "raw_date": exp.transaction_date.strftime("%Y-%m-%d"),
            })

    # Sort chronological descending
    combined.sort(key=lambda x: (x["date_obj"], x["id"]), reverse=True)

    total_count = len(combined)
    start_idx = (page - 1) * limit
    paginated = combined[start_idx : start_idx + limit]

    return PaginatedTransactions(
        items=[TransactionItemOut(**item) for item in paginated],
        total=total_count,
        page=page,
        limit=limit
    )

