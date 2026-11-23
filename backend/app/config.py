import os
from pydantic_settings import BaseSettings

_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_ROOT_DIR = os.path.dirname(_BACKEND_DIR)

class Settings(BaseSettings):
    APP_NAME: str = "Budget Buddy"
    APP_ENV: str = os.getenv("APP_ENV", "production" if os.getenv("RENDER") else "development")
    HOST: str = os.getenv("HOST", "0.0.0.0" if (os.getenv("RENDER") or os.getenv("PORT")) else "127.0.0.1")
    PORT: int = int(os.getenv("PORT", 8000))
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "budget_buddy_super_secret_key_2026_finance_secure_hash_jwt")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

    class Config:
        env_file = [
            os.path.join(_BACKEND_DIR, ".env"),
            os.path.join(_ROOT_DIR, ".env"),
            ".env"
        ]
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()

