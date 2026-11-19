from typing import Optional, List
from pydantic import BaseModel

class TransactionBase(BaseModel):
    name: str
    category: str
    amount: float
    type: Optional[str] = "expense"
    date: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None

class TransactionCreate(TransactionBase):
    pass

class TransactionOut(TransactionBase):
    id: int
    date: str
    icon: str

    class Config:
        from_attributes = True

class SpendingDataPoint(BaseModel):
    month: str
    expense: float
    income: float

class CategoryDataPoint(BaseModel):
    name: str
    value: float
    color: str

class StatItem(BaseModel):
    title: str
    amount: str
    change: str
    positive: bool
    icon: str
    color: str
    note: str

class DashboardData(BaseModel):
    stats: List[StatItem]
    spendingData: List[SpendingDataPoint]
    categoryData: List[CategoryDataPoint]
    transactions: List[TransactionOut]

