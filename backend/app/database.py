import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

DATABASE_URL = settings.DATABASE_URL
if DATABASE_URL:
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    elif DATABASE_URL.startswith("mysql://"):
        DATABASE_URL = DATABASE_URL.replace("mysql://", "mysql+pymysql://", 1)

# Configure SSL for remote cloud databases (TiDB Cloud, Aiven, AWS RDS, etc.)
connect_args = {}
if DATABASE_URL and "mysql" in DATABASE_URL:
    is_local = "127.0.0.1" in DATABASE_URL or "localhost" in DATABASE_URL
    if not is_local:
        connect_args["ssl"] = {}

# Attempt to auto-create MySQL database if it doesn't exist on local XAMPP
if not DATABASE_URL or "127.0.0.1" in DATABASE_URL or "localhost" in DATABASE_URL:
    try:
        import pymysql
        conn = pymysql.connect(host="127.0.0.1", port=3306, user="root", password="", connect_timeout=1)
        with conn.cursor() as cursor:
            cursor.execute("CREATE DATABASE IF NOT EXISTS budget_buddy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        conn.commit()
        conn.close()
        print("[Database] Verified local MySQL database 'budget_buddy' exists.")
    except Exception:
        # Not using local XAMPP root without password, or custom password
        pass

try:
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL not configured")
    # Test connection
    temp_engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)
    with temp_engine.connect() as conn:
        pass
    engine = temp_engine
    db_target = DATABASE_URL.split("@")[-1] if "@" in DATABASE_URL else "configured database"
    print(f"[Database] Successfully connected to database: {db_target}")
except Exception as e:
    print(f"[Database] Notice: Configured database not reachable ({e}). Using SQLite (budget_buddy.db) fallback.")
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
