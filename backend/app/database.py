import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

# Attempt to auto-create MySQL database if it doesn't exist on XAMPP
try:
    import pymysql
    conn = pymysql.connect(host="127.0.0.1", port=3306, user="root", password="")
    with conn.cursor() as cursor:
        cursor.execute("CREATE DATABASE IF NOT EXISTS budget_buddy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
    conn.commit()
    conn.close()
    print("[Database] Verified MySQL database 'budget_buddy' exists.")
except Exception as e:
    # Not using local XAMPP root without password, or custom password
    pass

DATABASE_URL = settings.DATABASE_URL

try:
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL not configured")
    # Test connection
    temp_engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    with temp_engine.connect() as conn:
        pass
    engine = temp_engine
    print("[Database] Successfully connected to MySQL database: budget_buddy")
except Exception as e:
    print(f"[Database] Notice: MySQL not reachable ({e}). Using SQLite (budget_buddy.db) for local execution.")
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
