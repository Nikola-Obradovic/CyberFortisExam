@echo off
echo ========================================
echo   AlemSISTEM Quiz Aplikacija
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Check if database exists
if not exist "quiz.db" (
    echo Initializing database...
    call npm run init-db
    echo.
)

REM Create results directory if it doesn't exist
if not exist "results" (
    echo Creating results directory...
    mkdir results
    echo.
)

echo Starting server...
echo The application will be available at: http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.

npm start
