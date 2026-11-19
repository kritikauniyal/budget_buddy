import datetime
from decimal import Decimal
from collections import defaultdict
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import User, ExpenseCategory, IncomeCategory, Expense, Income, MonthlyBudget
from app.dependencies.auth import get_current_user, get_optional_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard Analytics"])

DEFAULT_EXPENSE_CATEGORIES = [
    {"name": "Food", "icon": "🛒", "color": "#7557E8"},
    {"name": "Shopping", "icon": "🛍️", "color": "#22B8A0"},
    {"name": "Travel", "icon": "🚕", "color": "#F4AE50"},
    {"name": "Bills", "icon": "💡", "color": "#5794EA"},
    {"name": "Rent", "icon": "🏠", "color": "#E58DAA"},
    {"name": "Electricity", "icon": "⚡", "color": "#E91E63"},
    {"name": "Medical", "icon": "💊", "color": "#00BCD4"},
    {"name": "Entertainment", "icon": "🎬", "color": "#9C27B0"},
    {"name": "Education", "icon": "📚", "color": "#3F51B5"},
    {"name": "Groceries", "icon": "🍏", "color": "#4CAF50"},
    {"name": "Other", "icon": "💳", "color": "#9E9E9E"},
]

DEFAULT_INCOME_CATEGORIES = [
    {"name": "Salary", "icon": "💰", "color": "#22B8A0"},
    {"name": "Freelancing", "icon": "💻", "color": "#7557E8"},
    {"name": "Business", "icon": "🏢", "color": "#5794EA"},
    {"name": "Investments", "icon": "📈", "color": "#F4AE50"},
    {"name": "Other", "icon": "💵", "color": "#9E9E9E"},
]

def ensure_initial_seed(db: Session):
    """Seed default category definitions if none exist in system."""
    if db.query(ExpenseCategory).first() is None:
        for cat in DEFAULT_EXPENSE_CATEGORIES:
            db.add(ExpenseCategory(name=cat["name"], icon=cat["icon"], color=cat["color"]))
        db.commit()

    if db.query(IncomeCategory).first() is None:
        for cat in DEFAULT_INCOME_CATEGORIES:
            db.add(IncomeCategory(name=cat["name"], icon=cat["icon"], color=cat["color"]))
        db.commit()

    user = db.query(User).first()
    return user


def get_date_range(period: str, start_date: Optional[str] = None, end_date: Optional[str] = None):
    today = datetime.date.today()
    if period == "today":
        return today, today
    elif period == "this_week":
        start = today - datetime.timedelta(days=today.weekday())
        return start, today
    elif period == "this_month":
        start = datetime.date(today.year, today.month, 1)
        return start, today
    elif period == "last_month":
        first_this = datetime.date(today.year, today.month, 1)
        last_prev = first_this - datetime.timedelta(days=1)
        first_prev = datetime.date(last_prev.year, last_prev.month, 1)
        return first_prev, last_prev
    elif period == "custom" and start_date and end_date:
        try:
            s = datetime.datetime.strptime(start_date, "%Y-%m-%d").date()
            e = datetime.datetime.strptime(end_date, "%Y-%m-%d").date()
            return s, e
        except ValueError:
            pass
    return datetime.date(today.year, today.month, 1), today


# Pydantic Response Schemas
class SummaryResponse(BaseModel):
    total_income: float
    total_expenses: float
    available_balance: float
    monthly_budget: float
    remaining_budget: float
    total_savings: float
    highest_spending_category: str
    highest_spending_amount: float
    budget_utilization: float
    budget_alert: str
    period: str
    start_date: str
    end_date: str

class RecentTxItem(BaseModel):
    id: int
    name: str
    category: str
    amount: float
    type: str
    date: str
    icon: str
    payment_method: Optional[str] = None

class MonthlyAnalyticsPoint(BaseModel):
    month: str
    income: float
    expense: float
    savings: float

class CategoryAnalyticsPoint(BaseModel):
    name: str
    value: float
    percentage: float
    color: str

class FullDashboardResponse(BaseModel):
    summary: SummaryResponse
    stats: List[dict]
    spendingData: List[dict]
    categoryData: List[dict]
    transactions: List[RecentTxItem]


@router.get("/summary", response_model=SummaryResponse)
def get_dashboard_summary(
    period: str = Query("this_month", description="today, this_week, this_month, last_month, custom"),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    ensure_initial_seed(db)
    user = current_user or db.query(User).first()
    if not user:
        return SummaryResponse(
            total_income=0.0, total_expenses=0.0, available_balance=0.0,
            monthly_budget=0.0, remaining_budget=0.0, total_savings=0.0,
            highest_spending_category="None", highest_spending_amount=0.0,
            budget_utilization=0.0, budget_alert="normal",
            period=period, start_date="", end_date=""
        )

    s_date, e_date = get_date_range(period, start_date, end_date)

    incomes = db.query(Income).filter(
        Income.user_id == user.id,
        Income.transaction_date >= s_date,
        Income.transaction_date <= e_date
    ).all()

    expenses = db.query(Expense).filter(
        Expense.user_id == user.id,
        Expense.transaction_date >= s_date,
        Expense.transaction_date <= e_date
    ).all()

    tot_income = sum(float(i.amount) for i in incomes)
    tot_expense = sum(float(e.amount) for e in expenses)
    avail_balance = tot_income - tot_expense
    savings = max(0.0, avail_balance)

    # Monthly Budget
    today = datetime.date.today()
    mb = db.query(MonthlyBudget).filter(
        MonthlyBudget.user_id == user.id,
        MonthlyBudget.month == today.month,
        MonthlyBudget.year == today.year
    ).first()
    budget_val = float(mb.total_budget) if mb else 0.0
    rem_budget = max(0.0, budget_val - tot_expense) if budget_val > 0 else 0.0
    utilization = (tot_expense / budget_val * 100) if budget_val > 0 else 0.0

    alert = "normal"
    if budget_val > 0:
        if utilization >= 100:
            alert = "exceeded_100"
        elif utilization >= 80:
            alert = "warning_80"

    # Highest spending category
    cat_map = {c.id: c.name for c in db.query(ExpenseCategory).all()}
    cat_expenses = defaultdict(float)
    for e in expenses:
        cname = cat_map.get(e.category_id, "Other")
        cat_expenses[cname] += float(e.amount)

    highest_cat = "None"
    highest_amt = 0.0
    if cat_expenses:
        highest_cat, highest_amt = max(cat_expenses.items(), key=lambda x: x[1])

    return SummaryResponse(
        total_income=round(tot_income, 2),
        total_expenses=round(tot_expense, 2),
        available_balance=round(avail_balance, 2),
        monthly_budget=round(budget_val, 2),
        remaining_budget=round(rem_budget, 2),
        total_savings=round(savings, 2),
        highest_spending_category=highest_cat,
        highest_spending_amount=round(highest_amt, 2),
        budget_utilization=round(utilization, 1),
        budget_alert=alert,
        period=period,
        start_date=s_date.strftime("%Y-%m-%d"),
        end_date=e_date.strftime("%Y-%m-%d")
    )


@router.get("/recent-transactions", response_model=List[RecentTxItem])
def get_recent_transactions(
    limit: int = 10,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    ensure_initial_seed(db)
    user = current_user or db.query(User).first()
    if not user:
        return []

    inc_cats = {c.id: c for c in db.query(IncomeCategory).all()}
    exp_cats = {c.id: c for c in db.query(ExpenseCategory).all()}

    incomes = db.query(Income).filter(Income.user_id == user.id).all()
    expenses = db.query(Expense).filter(Expense.user_id == user.id).all()

    combined = []
    for inc in incomes:
        c = inc_cats.get(inc.category_id)
        combined.append({
            "id": inc.id,
            "name": inc.description or (c.name if c else "Income"),
            "category": c.name if c else "Salary",
            "amount": float(inc.amount),
            "type": "income",
            "date_obj": inc.transaction_date,
            "date": inc.transaction_date.strftime("%b %d, %Y"),
            "icon": c.icon if c else "💰",
            "payment_method": "Bank"
        })

    for exp in expenses:
        c = exp_cats.get(exp.category_id)
        combined.append({
            "id": exp.id,
            "name": exp.description or (c.name if c else "Expense"),
            "category": c.name if c else "Other",
            "amount": float(exp.amount),
            "type": "expense",
            "date_obj": exp.transaction_date,
            "date": exp.transaction_date.strftime("%b %d, %Y"),
            "icon": c.icon if c else "💳",
            "payment_method": exp.payment_method or "Cash"
        })

    # Sort descending by date
    combined.sort(key=lambda x: (x["date_obj"], x["id"]), reverse=True)
    return [RecentTxItem(**item) for item in combined[:limit]]


@router.get("/monthly-analytics", response_model=List[MonthlyAnalyticsPoint])
def get_monthly_analytics(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    ensure_initial_seed(db)
    user = current_user or db.query(User).first()
    if not user:
        return []

    today = datetime.date.today()
    points = []

    # Last 6 months
    for i in range(5, -1, -1):
        # Calculate year and month
        m = today.month - i
        y = today.year
        while m <= 0:
            m += 12
            y -= 1

        month_label = datetime.date(y, m, 1).strftime("%b")
        start_d = datetime.date(y, m, 1)
        next_m = m + 1 if m < 12 else 1
        next_y = y if m < 12 else y + 1
        end_d = datetime.date(next_y, next_m, 1) - datetime.timedelta(days=1)

        m_inc = db.query(Income).filter(
            Income.user_id == user.id,
            Income.transaction_date >= start_d,
            Income.transaction_date <= end_d
        ).all()
        m_exp = db.query(Expense).filter(
            Expense.user_id == user.id,
            Expense.transaction_date >= start_d,
            Expense.transaction_date <= end_d
        ).all()

        inc_tot = sum(float(x.amount) for x in m_inc)
        exp_tot = sum(float(x.amount) for x in m_exp)
        sav_tot = max(0.0, inc_tot - exp_tot)

        points.append(
            MonthlyAnalyticsPoint(
                month=month_label,
                income=round(inc_tot, 2),
                expense=round(exp_tot, 2),
                savings=round(sav_tot, 2)
            )
        )

    return points


@router.get("/category-analytics", response_model=List[CategoryAnalyticsPoint])
def get_category_analytics(
    period: str = "this_month",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    ensure_initial_seed(db)
    user = current_user or db.query(User).first()
    if not user:
        return []

    s_date, e_date = get_date_range(period, start_date, end_date)
    expenses = db.query(Expense).filter(
        Expense.user_id == user.id,
        Expense.transaction_date >= s_date,
        Expense.transaction_date <= e_date
    ).all()

    cat_map = {c.id: c for c in db.query(ExpenseCategory).all()}
    cat_totals = defaultdict(float)
    total_spent = sum(float(e.amount) for e in expenses)

    for e in expenses:
        c = cat_map.get(e.category_id)
        cname = c.name if c else "Other"
        cat_totals[cname] += float(e.amount)

    results = []
    for cname, val in sorted(cat_totals.items(), key=lambda x: x[1], reverse=True):
        cat_obj = next((c for c in cat_map.values() if c.name == cname), None)
        pct = (val / total_spent * 100) if total_spent > 0 else 0.0
        results.append(
            CategoryAnalyticsPoint(
                name=cname,
                value=round(val, 2),
                percentage=round(pct, 1),
                color=cat_obj.color if cat_obj else "#7557E8"
            )
        )
    return results


@router.get("", response_model=FullDashboardResponse)
def get_full_dashboard(
    period: str = "this_month",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    summary = get_dashboard_summary(period, start_date, end_date, current_user, db)
    recent = get_recent_transactions(10, current_user, db)
    monthly = get_monthly_analytics(current_user, db)
    category = get_category_analytics(period, start_date, end_date, current_user, db)

    stats = [
        {
            "title": "Total Balance",
            "amount": f"₹{summary.available_balance:,.2f}",
            "change": "+100%" if summary.available_balance > 0 else "0%",
            "positive": summary.available_balance >= 0,
            "icon": "Wallet",
            "color": "purple",
            "note": "Available funds"
        },
        {
            "title": "Total Income",
            "amount": f"₹{summary.total_income:,.2f}",
            "change": f"{period.replace('_', ' ').title()}",
            "positive": True,
            "icon": "ArrowDownRight",
            "color": "green",
            "note": "Total earnings"
        },
        {
            "title": "Total Expenses",
            "amount": f"₹{summary.total_expenses:,.2f}",
            "change": f"{summary.budget_utilization}% of budget",
            "positive": summary.total_expenses <= summary.monthly_budget if summary.monthly_budget > 0 else True,
            "icon": "ArrowUpRight",
            "color": "orange",
            "note": "Total spent"
        },
        {
            "title": "Monthly Budget",
            "amount": f"₹{summary.monthly_budget:,.2f}",
            "change": f"₹{summary.remaining_budget:,.2f} left",
            "positive": summary.budget_alert != "exceeded_100",
            "icon": "CircleDollarSign",
            "color": "blue",
            "note": f"{summary.budget_alert.replace('_', ' ').title()}"
        }
    ]

    spendingData = [
        {"month": p.month, "income": p.income, "expense": p.expense}
        for p in monthly
    ]

    categoryData = [
        {"name": c.name, "value": c.value, "color": c.color}
        for c in category
    ]

    return FullDashboardResponse(
        summary=summary,
        stats=stats,
        spendingData=spendingData,
        categoryData=categoryData,
        transactions=recent
    )
