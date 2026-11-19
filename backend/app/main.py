import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
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

# Relative directory paths
APP_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(APP_DIR, "static")
PROJECT_ROOT = os.path.dirname(os.path.dirname(APP_DIR))
FRONTEND_DIST = os.path.join(PROJECT_ROOT, "frontend", "dist")

# Create database tables automatically
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="Professional Personal Expense and Budget Management System",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration - Allow local dev and Render deployments
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=r"https://.*\.onrender\.com",
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
    possible_paths = [
        os.path.join(STATIC_DIR, "logo.png"),
        os.path.join(PROJECT_ROOT, "frontend", "public", "logo.png"),
        os.path.join(PROJECT_ROOT, "frontend", "src", "assets", "logo.png"),
        os.path.join(FRONTEND_DIST, "logo.png")
    ]
    for p in possible_paths:
        if os.path.exists(p):
            return FileResponse(p, media_type="image/png")
    raise HTTPException(status_code=404, detail="Logo not found")

# Serve Frontend SPA on Render if frontend/dist exists
if os.path.exists(FRONTEND_DIST) and os.path.exists(os.path.join(FRONTEND_DIST, "index.html")):
    assets_path = os.path.join(FRONTEND_DIST, "assets")
    if os.path.exists(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

    @app.get("/", tags=["Frontend"])
    async def serve_root_frontend():
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))

    @app.get("/{full_path:path}", tags=["Frontend"])
    async def serve_spa_frontend(full_path: str):
        # Allow API endpoints and OpenAPI docs to be handled normally
        if (
            full_path.startswith("api")
            or full_path.startswith("docs")
            or full_path.startswith("redoc")
            or full_path == "openapi.json"
        ):
            raise HTTPException(status_code=404, detail="API endpoint not found")

        target_file = os.path.join(FRONTEND_DIST, full_path)
        if os.path.isfile(target_file):
            return FileResponse(target_file)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
else:
    @app.get("/", tags=["Root"])
    def root():
        return {
            "app": settings.APP_NAME,
            "status": "online",
            "version": "1.0.0",
            "documentation": "/docs",
            "notice": "Frontend dist build not found. Run 'npm run build' in frontend folder."
        }
