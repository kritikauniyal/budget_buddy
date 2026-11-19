@echo off
title Budget Buddy - Frontend Server
color 0B
echo ============================================================
echo   STARTING BUDGET BUDDY REACT FRONTEND (PORT 5173)
echo ============================================================
echo.

cd /d "%~dp0frontend"
set NODE_OPTIONS=--max-old-space-size=4096
npm run dev

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Frontend failed to start.
    echo Press any key to exit...
    pause >nul
)
