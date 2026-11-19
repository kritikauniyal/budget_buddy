import os
import shutil
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from app.config import settings
from app.database import engine, Base
import app.models.models
from app.routers import (
    health,
    dashboard,
    auth,
    incomes,
    expenses,
    transactions,
    categories,
    budgets,
    group_inbox,
    reports,
    notifications,
    groups,
    invitations
)

# Copy User's Official Budget Buddy Logo into Frontend Assets & Public
LOGO_SRC = r"C:\Users\lenovo\.gemini\antigravity\brain\d3415943-9ea8-471d-8312-25c130b003fe\.user_uploaded\media_1794567923554_98249b5d.png"

for target_dir in [r"d:\budget_buddy\frontend\public", r"d:\budget_buddy\frontend\src\assets"]:
    try:
        os.makedirs(target_dir, exist_ok=True)
        if os.path.exists(LOGO_SRC):
            shutil.copy2(LOGO_SRC, os.path.join(target_dir, "logo.png"))
            shutil.copy2(LOGO_SRC, os.path.join(target_dir, "favicon.png"))
    except Exception as e:
        print(f"[Logo Setup] Notice: {e}")

# Create database tables automatically
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="Professional Personal Expense and Budget Management System",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(incomes.router)
app.include_router(expenses.router)
app.include_router(transactions.router)
app.include_router(categories.router)
app.include_router(budgets.router)
app.include_router(group_inbox.router)
app.include_router(reports.router)
app.include_router(notifications.router)
app.include_router(groups.router)
app.include_router(invitations.router)

@app.get("/api/logo.png", tags=["Branding"])
def get_brand_logo():
    if os.path.exists(LOGO_SRC):
        return FileResponse(LOGO_SRC, media_type="image/png")
    for fallback in [r"d:\budget_buddy\frontend\public\logo.png", r"d:\budget_buddy\frontend\src\assets\logo.png"]:
        if os.path.exists(fallback):
            return FileResponse(fallback, media_type="image/png")
    raise HTTPException(status_code=404, detail="Logo not found")

@app.get("/", tags=["Root"])
def root():
    return {
        "app": settings.APP_NAME,
        "status": "online",
        "version": "1.0.0",
        "documentation": "/docs"
    }
