import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Numeric,
    DateTime,
    Boolean,
    ForeignKey,
    Text,
    Date
)
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    full_name = Column(String(150), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(50), unique=False, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=False)
    profile_image = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    is_guest = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    incomes = relationship("Income", back_populates="user", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="user", cascade="all, delete-orphan")
    monthly_budgets = relationship("MonthlyBudget", back_populates="user", cascade="all, delete-orphan")
    group_inboxes = relationship("GroupInbox", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")

    # Group relationships
    group_memberships = relationship("GroupMember", back_populates="user", cascade="all, delete-orphan")
    group_expenses = relationship("GroupExpense", back_populates="payer", foreign_keys="GroupExpense.paid_by")
    group_splits = relationship("GroupExpenseSplit", back_populates="user", cascade="all, delete-orphan")


class IncomeCategory(Base):
    __tablename__ = "income_categories"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    name = Column(String(100), nullable=False)
    icon = Column(String(50), default="💰")
    color = Column(String(20), default="#22B8A0")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    incomes = relationship("Income", back_populates="category")


class ExpenseCategory(Base):
    __tablename__ = "expense_categories"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    name = Column(String(100), nullable=False)
    icon = Column(String(50), default="💳")
    color = Column(String(20), default="#7557E8")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    expenses = relationship("Expense", back_populates="category")
    category_budgets = relationship("CategoryBudget", back_populates="category")
    group_inboxes = relationship("GroupInbox", back_populates="category")


class Income(Base):
    __tablename__ = "incomes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(Integer, ForeignKey("income_categories.id", ondelete="SET NULL"), nullable=True)
    amount = Column(Numeric(12, 2), nullable=False)
    description = Column(String(255), nullable=True)
    transaction_date = Column(Date, nullable=False, default=datetime.date.today)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="incomes")
    category = relationship("IncomeCategory", back_populates="incomes")


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(Integer, ForeignKey("expense_categories.id", ondelete="SET NULL"), nullable=True)
    amount = Column(Numeric(12, 2), nullable=False)
    description = Column(String(255), nullable=True)
    payment_method = Column(String(50), default="Cash")  # Cash, UPI, Debit Card, Credit Card, Net Banking, Other
    receipt_url = Column(String(255), nullable=True)
    transaction_date = Column(Date, nullable=False, default=datetime.date.today)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="expenses")
    category = relationship("ExpenseCategory", back_populates="expenses")


class MonthlyBudget(Base):
    __tablename__ = "monthly_budgets"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    month = Column(Integer, nullable=False)  # 1 - 12
    year = Column(Integer, nullable=False)
    total_budget = Column(Numeric(12, 2), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="monthly_budgets")
    category_budgets = relationship("CategoryBudget", back_populates="monthly_budget", cascade="all, delete-orphan")


class CategoryBudget(Base):
    __tablename__ = "category_budgets"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    monthly_budget_id = Column(Integer, ForeignKey("monthly_budgets.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(Integer, ForeignKey("expense_categories.id", ondelete="CASCADE"), nullable=False)
    budgeted_amount = Column(Numeric(12, 2), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    monthly_budget = relationship("MonthlyBudget", back_populates="category_budgets")
    category = relationship("ExpenseCategory", back_populates="category_budgets")


# =====================================================================
# GROUP EXPENSE SHARING & INVITATION SYSTEM MODELS
# =====================================================================

class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    group_type = Column(String(50), default="Friends")  # Friends, Family, Roommates, Trip, Office, Other
    image_url = Column(String(255), nullable=True)
    currency = Column(String(10), default="₹")
    created_by = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    creator = relationship("User", foreign_keys=[created_by])
    members = relationship("GroupMember", back_populates="group", cascade="all, delete-orphan")
    invitations = relationship("GroupInvitation", back_populates="group", cascade="all, delete-orphan")
    expenses = relationship("GroupExpense", back_populates="group", cascade="all, delete-orphan")
    settlements = relationship("GroupSettlement", back_populates="group", cascade="all, delete-orphan")
    inbox_items = relationship("GroupInbox", back_populates="group", cascade="all, delete-orphan")


class GroupMember(Base):
    __tablename__ = "group_members"

    id = Column(Integer, primary_key=True, autoincrement=True)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(20), default="member")  # admin, member
    status = Column(String(20), default="active")  # active, invited, left
    joined_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    group = relationship("Group", back_populates="members")
    user = relationship("User", back_populates="group_memberships")


class GroupInvitation(Base):
    __tablename__ = "group_invitations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="CASCADE"), nullable=False, index=True)
    invited_by = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    invitee_name = Column(String(150), nullable=True)
    invitee_email = Column(String(255), nullable=True, index=True)
    invitee_phone = Column(String(50), nullable=True, index=True)
    token = Column(String(100), unique=True, index=True, nullable=False)
    status = Column(String(20), default="pending")  # pending, accepted, declined, rejected, expired, cancelled
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    accepted_at = Column(DateTime, nullable=True)
    declined_at = Column(DateTime, nullable=True)

    # Relationships
    group = relationship("Group", back_populates="invitations")
    inviter = relationship("User", foreign_keys=[invited_by])


class GroupExpense(Base):
    __tablename__ = "group_expenses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="CASCADE"), nullable=False, index=True)
    paid_by = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("expense_categories.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(150), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    split_type = Column(String(20), default="equal")  # equal, custom, single
    expense_date = Column(Date, default=datetime.date.today, nullable=False)
    payment_method = Column(String(50), default="UPI")  # UPI, Cash, Card, Net Banking, Other
    description = Column(Text, nullable=True)
    receipt_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    group = relationship("Group", back_populates="expenses")
    payer = relationship("User", foreign_keys=[paid_by], back_populates="group_expenses")
    category = relationship("ExpenseCategory")
    splits = relationship("GroupExpenseSplit", back_populates="group_expense", cascade="all, delete-orphan")


class GroupExpenseSplit(Base):
    __tablename__ = "group_expense_splits"

    id = Column(Integer, primary_key=True, autoincrement=True)
    group_expense_id = Column(Integer, ForeignKey("group_expenses.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    owed_amount = Column(Numeric(12, 2), nullable=False, default=0.00)
    percentage = Column(Numeric(5, 2), nullable=True)
    is_settled = Column(Boolean, default=False)

    # Relationships
    group_expense = relationship("GroupExpense", back_populates="splits")
    user = relationship("User", back_populates="group_splits")


class GroupSettlement(Base):
    __tablename__ = "group_settlements"

    id = Column(Integer, primary_key=True, autoincrement=True)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="CASCADE"), nullable=False, index=True)
    payer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    payment_method = Column(String(50), default="UPI")  # UPI, Cash, Bank Transfer, Other
    notes = Column(String(255), nullable=True)
    settled_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    group = relationship("Group", back_populates="settlements")
    payer = relationship("User", foreign_keys=[payer_id])
    receiver = relationship("User", foreign_keys=[receiver_id])


class GroupInbox(Base):
    __tablename__ = "group_inbox"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="CASCADE"), nullable=True, index=True)
    category_id = Column(Integer, ForeignKey("expense_categories.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(150), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    description = Column(Text, nullable=True)
    payment_method = Column(String(50), default="Cash")
    status = Column(String(20), default="pending")  # pending, approved, rejected
    rejection_reason = Column(String(255), nullable=True)
    approved_expense_id = Column(Integer, ForeignKey("expenses.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="group_inboxes")
    category = relationship("ExpenseCategory", back_populates="group_inboxes")
    group = relationship("Group", back_populates="inbox_items")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(150), nullable=False)
    message = Column(String(255), nullable=False)
    type = Column(String(50), default="info")  # group_invite, expense_added, settlement, budget_warning, info
    action_url = Column(String(255), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="notifications")


class RecurringExpense(Base):
    __tablename__ = "recurring_expenses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    category_name = Column(String(100), default="Bills")
    frequency = Column(String(50), default="monthly")  # daily, weekly, monthly, yearly
    start_date = Column(Date, default=datetime.date.today, nullable=False)
    next_due_date = Column(Date, default=datetime.date.today, nullable=False)
    is_active = Column(Boolean, default=True)
    notes = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User")

