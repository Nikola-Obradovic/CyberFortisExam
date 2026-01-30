@echo off
setlocal enabledelayedexpansion

REM Cyber Fortis Quiz Launcher
REM This script starts the server and opens the browser

cd /d "%~dp0"

REM Load environment variables from .env file
if exist ".env" (
    for /f "usebackq tokens=1,* delims==" %%a in (".env") do (
        if not "%%a"=="" if not "%%a:~0,1%"=="#" (
            set "%%a=%%b"
        )
    )
)

REM Check if CMS credentials are set
if "%CMS_USERNAME%"=="" (
    echo ERROR: CMS_USERNAME not set. Create a .env file with CMS_USERNAME and CMS_PASSWORD
    pause
    exit /b 1
)
if "%CMS_PASSWORD%"=="" (
    echo ERROR: CMS_PASSWORD not set. Create a .env file with CMS_USERNAME and CMS_PASSWORD
    pause
    exit /b 1
)

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

REM Open browser in kiosk mode (fullscreen)
REM Try Chrome first, then Edge, then default browser

REM Check for Chrome in common locations
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --kiosk "http://localhost:3000"
    goto :eof
)
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" --kiosk "http://localhost:3000"
    goto :eof
)
if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    start "" "%LocalAppData%\Google\Chrome\Application\chrome.exe" --kiosk "http://localhost:3000"
    goto :eof
)

REM Check for Edge
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --kiosk "http://localhost:3000"
    goto :eof
)

REM Fallback to default browser
start http://localhost:3000
