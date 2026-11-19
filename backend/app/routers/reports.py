import io
import csv
import datetime
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Income, Expense, IncomeCategory, ExpenseCategory, User
from app.dependencies.auth import get_optional_current_user
from app.routers.dashboard import ensure_initial_seed, get_date_range
from pydantic import BaseModel

router = APIRouter(prefix="/api/reports", tags=["Reports & Analytics"])

class ReportSummary(BaseModel):
    total_income: float
    total_expenses: float
    net_savings: float
    savings_rate: float
    transaction_count: int
    period: str
    start_date: str
    end_date: str

class ReportCategoryItem(BaseModel):
    category: str
    type: str
    amount: float
    percentage: float

class FullReportData(BaseModel):
    summary: ReportSummary
    category_breakdown: List[ReportCategoryItem]
    incomes: List[dict]
    expenses: List[dict]


@router.get("/data", response_model=FullReportData)
def get_report_data(
    period: str = "this_month",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    ensure_initial_seed(db)
    user = current_user or db.query(User).first()
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

    inc_cats = {c.id: c.name for c in db.query(IncomeCategory).all()}
    exp_cats = {c.id: c.name for c in db.query(ExpenseCategory).all()}

    tot_inc = sum(float(i.amount) for i in incomes)
    tot_exp = sum(float(e.amount) for e in expenses)
    savings = tot_inc - tot_exp
    rate = (savings / tot_inc * 100) if tot_inc > 0 else 0.0

    # Category breakdown
    cat_summary = {}
    for e in expenses:
        name = exp_cats.get(e.category_id, "Other")
        cat_summary[name] = cat_summary.get(name, 0.0) + float(e.amount)

    cat_items = []
    for cname, amt in sorted(cat_summary.items(), key=lambda x: x[1], reverse=True):
        pct = (amt / tot_exp * 100) if tot_exp > 0 else 0.0
        cat_items.append(
            ReportCategoryItem(
                category=cname,
                type="expense",
                amount=round(amt, 2),
                percentage=round(pct, 1)
            )
        )

    inc_list = [
        {
            "id": i.id,
            "description": i.description,
            "category": inc_cats.get(i.category_id, "Salary"),
            "amount": float(i.amount),
            "date": i.transaction_date.strftime("%Y-%m-%d")
        } for i in incomes
    ]

    exp_list = [
        {
            "id": e.id,
            "description": e.description,
            "category": exp_cats.get(e.category_id, "Other"),
            "amount": float(e.amount),
            "payment_method": e.payment_method,
            "date": e.transaction_date.strftime("%Y-%m-%d")
        } for e in expenses
    ]

    return FullReportData(
        summary=ReportSummary(
            total_income=round(tot_inc, 2),
            total_expenses=round(tot_exp, 2),
            net_savings=round(savings, 2),
            savings_rate=round(rate, 1),
            transaction_count=len(incomes) + len(expenses),
            period=period,
            start_date=s_date.strftime("%Y-%m-%d"),
            end_date=e_date.strftime("%Y-%m-%d")
        ),
        category_breakdown=cat_items,
        incomes=inc_list,
        expenses=exp_list
    )


@router.get("/export/csv")
def export_csv(
    period: str = "this_month",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """Exports all transactions within the selected range as an Excel-compatible CSV file."""
    data = get_report_data(period, start_date, end_date, current_user, db)

    output = io.StringIO()
    writer = csv.writer(output)

    # Header section
    writer.writerow(["BUDGET BUDDY - FINANCIAL REPORT"])
    writer.writerow(["Period", data.summary.period])
    writer.writerow(["Date Range", f"{data.summary.start_date} to {data.summary.end_date}"])
    writer.writerow(["Total Income (INR)", data.summary.total_income])
    writer.writerow(["Total Expenses (INR)", data.summary.total_expenses])
    writer.writerow(["Net Savings (INR)", data.summary.net_savings])
    writer.writerow([])

    # Incomes Table
    writer.writerow(["INCOME TRANSACTIONS"])
    writer.writerow(["ID", "Date", "Source/Description", "Category", "Amount (INR)"])
    for i in data.incomes:
        writer.writerow([i["id"], i["date"], i["description"], i["category"], i["amount"]])
    writer.writerow([])

    # Expenses Table
    writer.writerow(["EXPENSE TRANSACTIONS"])
    writer.writerow(["ID", "Date", "Description", "Category", "Payment Method", "Amount (INR)"])
    for e in data.expenses:
        writer.writerow([e["id"], e["date"], e["description"], e["category"], e["payment_method"], e["amount"]])

    output.seek(0)
    filename = f"budget_buddy_report_{data.summary.start_date}_{data.summary.end_date}.csv"

    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8-sig")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/export/pdf")
def export_pdf(
    period: str = "this_month",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """Generates a professional PDF Financial Statement."""
    data = get_report_data(period, start_date, end_date, current_user, db)

    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib import colors

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
        elements = []
        styles = getSampleStyleSheet()

        # Title
        title_style = ParagraphStyle(name='TitleStyle', fontName='Helvetica-Bold', fontSize=20, leading=24, textColor=colors.HexColor("#191b35"))
        elements.append(Paragraph("BUDGET BUDDY — FINANCIAL STATEMENT", title_style))
        elements.append(Paragraph(f"Period: {data.summary.period.replace('_', ' ').title()} ({data.summary.start_date} to {data.summary.end_date})", styles["Normal"]))
        elements.append(Spacer(1, 16))

        # Financial Summary Table
        summary_data = [
            ["Metric", "Amount (INR)"],
            ["Total Inflow (Income)", f"Rs. {data.summary.total_income:,.2f}"],
            ["Total Outflow (Expenses)", f"Rs. {data.summary.total_expenses:,.2f}"],
            ["Net Savings", f"Rs. {data.summary.net_savings:,.2f}"],
            ["Savings Rate", f"{data.summary.savings_rate}%"]
        ]
        t_summary = Table(summary_data, colWidths=[250, 250])
        t_summary.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#7557E8")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
        ]))
        elements.append(t_summary)
        elements.append(Spacer(1, 20))

        # Recent Expenses Table
        elements.append(Paragraph("<b>Recent Expenses Summary</b>", styles["Heading3"]))
        exp_table_data = [["Date", "Description", "Category", "Payment", "Amount"]]
        for e in data.expenses[:15]:
            exp_table_data.append([e["date"], e["description"][:25], e["category"], e["payment_method"], f"Rs. {e['amount']:,.2f}"])

        if len(exp_table_data) == 1:
            exp_table_data.append(["-", "No expenses recorded", "-", "-", "Rs. 0.00"])

        t_exp = Table(exp_table_data, colWidths=[70, 180, 90, 80, 80])
        t_exp.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#191b35")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ]))
        elements.append(t_exp)

        doc.build(elements)
        buffer.seek(0)
        filename = f"budget_buddy_statement_{data.summary.start_date}.pdf"
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        # Fallback to CSV if ReportLab fails
        return export_csv(period, start_date, end_date, current_user, db)

