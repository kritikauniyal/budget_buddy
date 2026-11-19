import os
import sys

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from app.main import app

if __name__ == "__main__":
    import uvicorn
    from init_db import init_database
    try:
        init_database()
    except Exception as e:
        print(f"[Init] {e}")

    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
