@echo off
title Budget Buddy - Full Stack Launcher
color 0E
echo ============================================================
echo   BUDGET BUDDY - FULL STACK APP LAUNCHER
echo ============================================================
echo.
echo [1/2] Starting FastAPI Backend on Port 8000...
start "Budget Buddy - Backend" cmd /k "%~dp0start_backend.bat"

timeout /t 3 /nobreak >nul

echo [2/2] Starting React Vite Frontend on Port 5173...
start "Budget Buddy - Frontend" cmd /k "%~dp0start_frontend.bat"

echo.
echo ============================================================
echo   SUCCESS! Both services launched:
echo   - Backend API & Swagger: http://127.0.0.1:8000/docs
echo   - Frontend Application:  http://localhost:5173
echo ============================================================
echo.
timeout /t 2 /nobreak >nul
