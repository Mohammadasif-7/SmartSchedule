@echo off
title SmartSched AI - Server

cd /d "%~dp0"

echo ========================================
echo       SMARTSCHED AI STARTING
echo ========================================
echo.

echo Starting Backend...
start "SmartSched Backend" cmd /k "cd /d "%~dp0backend" && .venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000"

timeout /t 4 /nobreak >nul

echo Starting Frontend...
start "SmartSched Frontend" cmd /k "cd /d "%~dp0backend" && .venv\Scripts\python.exe -m http.server 5500 --directory "%~dp0frontend""

timeout /t 3 /nobreak >nul

echo Opening SmartSched...
start "" "http://127.0.0.1:5500"

echo.
echo SmartSched started.
echo Backend:  http://127.0.0.1:8000
echo Frontend: http://127.0.0.1:5500
echo.
pause