from typing import Optional, List, Dict, Any
from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel

class HealthResponse(BaseModel):
    status: str
    api: str
    database: str
    app_name: str
    environment: str

# User Schemas
class UserBase(BaseModel):
    email: str
    full_name: str
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str
    invitation_token: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserOut(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    reset_token: str
    new_password: str

class UpdateProfileRequest(BaseModel):
    full_name: str
    phone: Optional[str] = None

# Dashboard Schemas
class StatItem(BaseModel):
    title: str
    amount: str
    change: str
    positive: bool
    icon: str
    color: str
    note: str

class SpendingPoint(BaseModel):
    month: str
    expense: float
    income: float

class CategoryPoint(BaseModel):
    name: str
    value: float
    color: str

class RecentTransactionItem(BaseModel):
    id: int
    name: str
    category: str
    amount: float
    type: str  # income or expense
    date: str
    icon: str
    payment_method: Optional[str] = None

class DashboardResponse(BaseModel):
    stats: List[StatItem]
    spendingData: List[SpendingPoint]
    categoryData: List[CategoryPoint]
    transactions: List[RecentTransactionItem]

# Expense Schemas
class ExpenseCreate(BaseModel):
    name: str
    amount: Decimal
    category: str
    transaction_date: Optional[str] = None
    payment_method: Optional[str] = "Cash"
    description: Optional[str] = None
    receipt_url: Optional[str] = None

class ExpenseOut(BaseModel):
    id: int
    name: str
    amount: float
    category: str
    date: str
    icon: str
    payment_method: str
    description: Optional[str] = None
    receipt_url: Optional[str] = None

    class Config:
        from_attributes = True

# =====================================================================
# GROUP EXPENSE SHARING & INVITATIONS SCHEMAS
# =====================================================================

class ContactInviteInput(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None

class GroupCreate(BaseModel):
    name: str
    description: Optional[str] = None
    group_type: Optional[str] = "Friends"  # Friends, Family, Roommates, Trip, Office, Other
    image_url: Optional[str] = None
    currency: Optional[str] = "₹"
    contacts_to_invite: Optional[List[ContactInviteInput]] = []

class GroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    group_type: Optional[str] = None
    image_url: Optional[str] = None
    currency: Optional[str] = None

class GroupMemberOut(BaseModel):
    id: int
    user_id: int
    full_name: str
    email: str
    phone: Optional[str] = None
    role: str  # admin, member
    status: str
    joined_at: str

class GroupOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    group_type: str
    image_url: Optional[str] = None
    currency: str
    created_by: int
    created_at: str
    member_count: int
    my_role: str
    total_expense: float
    my_balance: float

class GroupExpenseSplitCreate(BaseModel):
    user_id: int
    owed_amount: Decimal
    percentage: Optional[Decimal] = None

class GroupExpenseCreate(BaseModel):
    title: str
    amount: Decimal
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    paid_by: Optional[int] = None  # None -> current user
    split_type: Optional[str] = "equal"  # equal, custom, single
    expense_date: Optional[str] = None
    payment_method: Optional[str] = "UPI"
    description: Optional[str] = None
    receipt_url: Optional[str] = None
    participant_ids: Optional[List[int]] = None  # for equal split
    splits: Optional[List[GroupExpenseSplitCreate]] = None  # for custom split

class GroupExpenseSplitOut(BaseModel):
    id: int
    user_id: int
    user_name: str
    owed_amount: float
    percentage: Optional[float] = None
    is_settled: bool

class GroupExpenseOut(BaseModel):
    id: int
    group_id: int
    title: str
    amount: float
    paid_by: int
    payer_name: str
    category_id: Optional[int] = None
    category_name: str
    category_icon: str
    split_type: str
    expense_date: str
    payment_method: str
    description: Optional[str] = None
    receipt_url: Optional[str] = None
    splits: List[GroupExpenseSplitOut]
    created_at: str

class GroupSettlementCreate(BaseModel):
    payer_id: int
    receiver_id: int
    amount: Decimal
    payment_method: Optional[str] = "UPI"
    notes: Optional[str] = None

class GroupSettlementOut(BaseModel):
    id: int
    group_id: int
    payer_id: int
    payer_name: str
    receiver_id: int
    receiver_name: str
    amount: float
    payment_method: str
    notes: Optional[str] = None
    settled_at: str

class MemberBalance(BaseModel):
    user_id: int
    user_name: str
    email: str
    phone: Optional[str] = None
    total_paid: float
    total_share: float
    settlements_sent: float
    settlements_received: float
    net_balance: float
    status: str  # 'owed', 'owes', 'settled'

class DebtInstruction(BaseModel):
    from_user_id: int
    from_user_name: str
    to_user_id: int
    to_user_name: str
    amount: float

class GroupBalancesResponse(BaseModel):
    total_expense: float
    member_balances: List[MemberBalance]
    suggested_settlements: List[DebtInstruction]

class GroupDashboardResponse(BaseModel):
    group_id: int
    group_name: str
    group_type: str
    description: Optional[str] = None
    currency: str
    total_expenses: float
    this_month_expenses: float
    member_count: int
    my_total_paid: float
    my_total_share: float
    my_net_balance: float
    pending_inbox_count: int
    category_breakdown: List[Dict[str, Any]]
    member_summaries: List[Dict[str, Any]]
    recent_expenses: List[Dict[str, Any]]

class GroupInviteBatchRequest(BaseModel):
    contacts: List[ContactInviteInput]

class GroupInvitationOut(BaseModel):
    id: int
    group_id: int
    group_name: str
    group_type: str
    invited_by_name: str
    invitee_name: Optional[str] = None
    invitee_email: Optional[str] = None
    invitee_phone: Optional[str] = None
    token: str
    invite_link: str
    status: str
    is_registered: bool
    created_at: str

# Recurring Expense Schemas
class RecurringExpenseCreate(BaseModel):
    title: str
    amount: Decimal
    category_name: Optional[str] = "Bills"
    frequency: Optional[str] = "monthly"
    start_date: Optional[str] = None
    next_due_date: Optional[str] = None
    notes: Optional[str] = None

class RecurringExpenseOut(BaseModel):
    id: int
    user_id: int
    title: str
    amount: float
    category_name: str
    frequency: str
    start_date: str
    next_due_date: str
    is_active: bool
    notes: Optional[str] = None
    created_at: str

