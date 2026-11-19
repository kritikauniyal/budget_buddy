@echo off
title Budget Buddy - Backend Server
color 0A
echo ============================================================
echo   STARTING BUDGET BUDDY FASTAPI BACKEND (PORT 8000)
echo ============================================================
echo.

cd /d "%~dp0backend"

if exist "venv\Scripts\python.exe" (
    echo Using Virtual Environment Python...
    venv\Scripts\python.exe run.py
) else (
    echo Using System Python...
    python run.py
)

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Backend failed to start.
    echo Press any key to exit...
    pause >nul
)

