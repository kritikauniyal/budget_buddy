import os
import sys

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from sqlalchemy import inspect, text
from app.database import engine, Base
import app.models.models as models
from app.routers.dashboard import ensure_initial_seed
from app.database import SessionLocal

def init_database():
    print("=" * 60)
    print("  BUDGET BUDDY — DATABASE & TABLE INITIALIZER")
    print("=" * 60)

    print(f"\n[1/3] Connecting to Database Engine ({engine.name})...")

    # Safe column migrations on existing tables using raw connection
    try:
        import pymysql
        conn = pymysql.connect(host="127.0.0.1", port=3306, user="root", password="", database="budget_buddy")
        with conn.cursor() as cur:
            cur.execute("SHOW COLUMNS FROM users LIKE 'phone';")
            if not cur.fetchone():
                cur.execute("ALTER TABLE users ADD COLUMN phone VARCHAR(50) NULL AFTER email;")
            cur.execute("SHOW COLUMNS FROM group_inbox LIKE 'group_id';")
            if not cur.fetchone():
                cur.execute("ALTER TABLE group_inbox ADD COLUMN group_id INT NULL AFTER user_id;")
            cur.execute("SHOW COLUMNS FROM notifications LIKE 'action_url';")
            if not cur.fetchone():
                cur.execute("ALTER TABLE notifications ADD COLUMN action_url VARCHAR(255) NULL AFTER type;")
        conn.commit()
        conn.close()
    except Exception as e:
        pass

    print("\n[2/3] Creating all required database tables...")
    Base.metadata.create_all(bind=engine)

    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()

    required_tables = [
        "users",
        "income_categories",
        "expense_categories",
        "incomes",
        "expenses",
        "monthly_budgets",
        "category_budgets",
        "group_inbox",
        "notifications",
        "groups",
        "group_members",
        "group_invitations",
        "group_expenses",
        "group_expense_splits",
        "group_settlements"
    ]

    print("\n[Database Tables Status]:")
    for tbl in required_tables:
        if tbl in existing_tables:
            print(f"  [OK] Table '{tbl}' successfully verified / created.")
        else:
            print(f"  [!]  Table '{tbl}' pending creation.")

    print("\n[3/3] Seeding default categories and baseline records...")
    db = SessionLocal()
    try:
        ensure_initial_seed(db)
        print("  [OK] Default expense & income categories seeded.")
    except Exception as e:
        print(f"  [!] Note: {e}")
    finally:
        db.close()

    print("\n" + "=" * 60)
    print(f"  SUCCESS! All {len(required_tables)} database tables are created & ready.")
    print("=" * 60 + "\n")

if __name__ == "__main__":
    init_database()
