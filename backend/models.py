import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime
from database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    amount = Column(Float, nullable=False)
    type = Column(String(20), default="expense")  # "income" or "expense"
    date = Column(String(50), nullable=False)
    icon = Column(String(10), default="💳")
    description = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

