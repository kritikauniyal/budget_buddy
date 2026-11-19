import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "Budget Buddy"
    APP_ENV: str = os.getenv("APP_ENV", "production" if os.getenv("RENDER") else "development")
    HOST: str = os.getenv("HOST", "0.0.0.0" if (os.getenv("RENDER") or os.getenv("PORT")) else "127.0.0.1")
    PORT: int = int(os.getenv("PORT", 8000))
    DATABASE_URL: str = os.getenv("DATABASE_URL", "mysql+pymysql://root:@127.0.0.1:3306/budget_buddy?charset=utf8mb4")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "budget_buddy_super_secret_key_2026_finance_secure_hash_jwt")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

