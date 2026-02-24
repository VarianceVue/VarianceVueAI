@echo off
title Build VueLogic UI
cd /d "%~dp0"

if not exist "vuelogic-ui\package.json" (
    echo vuelogic-ui folder not found.
    pause
    exit /b 1
)

cd vuelogic-ui
if not exist "node_modules" (
    echo Installing npm dependencies...
    call npm install
    if errorlevel 1 ( echo npm install failed. & pause & exit /b 1 )
)
echo Building VueLogic UI...
call npm run build
if errorlevel 1 ( echo Build failed. & pause & exit /b 1 )

cd ..
echo Copying built UI to schedule_agent_web/static...
if not exist "schedule_agent_web\static" mkdir "schedule_agent_web\static"
xcopy "vuelogic-ui\dist\*" "schedule_agent_web\static\" /E /Y /Q
echo Done. Run run_desktop.bat and open http://localhost:8000
pause
