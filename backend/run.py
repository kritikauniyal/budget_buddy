
import os
import sys
import shutil
import uvicorn

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from app.config import settings
from app.database import engine, Base
import app.models.models
from init_db import init_database


LOGO_SRC = r"C:\Users\lenovo\.gemini\antigravity\brain\d3415943-9ea8-471d-8312-25c130b003fe\.user_uploaded\media_1794567923554_98249b5d.png"

for target_dir in [
    r"D:\budget_buddy\frontend\public",
    r"D:\budget_buddy\frontend\src\assets"
]:
    try:
        os.makedirs(target_dir, exist_ok=True)

        if os.path.exists(LOGO_SRC):
            shutil.copy2(LOGO_SRC, os.path.join(target_dir, "logo.png"))
            shutil.copy2(LOGO_SRC, os.path.join(target_dir, "favicon.png"))
            print(f"[Logo Setup] Logo copied to {target_dir}")
        else:
            print(f"[Logo Setup] Source logo not found: {LOGO_SRC}")

    except Exception as e:
        print(f"[Logo Setup] {e}")


if __name__ == "__main__":

    try:
        init_database()
        print("[Database Init] Database initialized successfully.")
    except Exception as e:
        print(f"[Database Init] Notice: {e}")

    print(
        f"Starting {settings.APP_NAME} Backend "
        f"on http://{settings.HOST}:{settings.PORT} ..."
    )

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True
    )
