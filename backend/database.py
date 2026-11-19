import os
import logging
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

try:
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL not set")
    # Quick probe test for MySQL
    temp_engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    with temp_engine.connect() as conn:
        pass
    engine = temp_engine
    print("[Database] Successfully connected to MySQL database.")
except Exception as e:
    print(f"[Database] MySQL connection failed ({e}). Falling back to SQLite database budget_buddy.db.")
    engine = create_engine(
        "sqlite:///./budget_buddy.db",
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
