@echo off
title VueLogic - Schedule Agent
cd /d "%~dp0"

REM Check for Python
python --version >nul 2>&1
if errorlevel 1 (
    echo Python not found. Please install Python 3.10+ from https://www.python.org/
    pause
    exit /b 1
)

REM Use venv if it exists
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
)

REM Ensure uvicorn is available
python -c "import uvicorn" >nul 2>&1
if errorlevel 1 (
    echo Installing dependencies (first run may take a minute)...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo Failed to install. Run: pip install -r requirements.txt
        pause
        exit /b 1
    )
    echo.
)

REM Open browser after 3 seconds so server has time to start
start cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:8000"

echo Starting VueLogic on http://localhost:8000
echo.
echo If the site cannot be reached:
echo   1. Wait a few seconds and refresh the browser.
echo   2. Install dependencies: pip install -r requirements.txt
echo   3. Close this window to stop the server.
echo.
python -m uvicorn schedule_agent_web.main:app --host 127.0.0.1 --port 8000
if errorlevel 1 (
    echo.
    echo Server failed. Try: pip install -r requirements.txt
    echo Then run this script again.
)
pause
