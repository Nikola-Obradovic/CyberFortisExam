@echo off
setlocal enabledelayedexpansion

REM Cyber Fortis Quiz Launcher
REM This script starts the server and opens the browser

cd /d "%~dp0"

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

REM Check if database exists
if not exist "quiz.db" (
    echo Initializing database...
    call npm run init-db
)

REM Create results directory if it doesn't exist
if not exist "results" (
    mkdir results
)

REM Start server in a new minimized window
start /min cmd /c "npm start"

REM Wait for server to start
timeout /t 3 /nobreak >nul

REM Open browser in kiosk/app mode
REM Try Chrome first, then Edge, then default browser
where chrome >nul 2>nul
if %errorlevel%==0 (
    start chrome --kiosk --app="http://localhost:3000"
    goto :eof
)

where msedge >nul 2>nul
if %errorlevel%==0 (
    start msedge --kiosk --app="http://localhost:3000"
    goto :eof
)

REM Fallback to default browser
start http://localhost:3000
