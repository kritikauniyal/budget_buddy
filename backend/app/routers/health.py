from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.database import get_db, engine
from app.config import settings
from app.schemas.schemas import HealthResponse

router = APIRouter(prefix="/api", tags=["Health & Status"])

@router.get("/health", response_model=HealthResponse)
def health_check():
    db_status = "connected"
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except SQLAlchemyError:
        db_status = "disconnected"

    return HealthResponse(
        status="success" if db_status == "connected" else "error",
        api="connected",
        database=db_status,
        app_name=settings.APP_NAME,
        environment=settings.APP_ENV
    )

