#!/bin/bash

# Cyber Fortis Quiz Launcher
# This script starts the server and opens the browser

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Check if database exists
if [ ! -f "quiz.db" ]; then
    echo "Initializing database..."
    npm run init-db
fi

# Create results directory if it doesn't exist
if [ ! -d "results" ]; then
    mkdir -p results
fi

# Start server in background
npm start &
SERVER_PID=$!

# Wait for server to start
sleep 2

# Open browser based on OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS - open in kiosk mode (fullscreen)
    open -a "Google Chrome" --args --kiosk --app="http://localhost:3000" 2>/dev/null || \
    open -a "Safari" "http://localhost:3000" 2>/dev/null || \
    open "http://localhost:3000"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux - try different browsers
    if command -v google-chrome &> /dev/null; then
        google-chrome --kiosk --app="http://localhost:3000" &
    elif command -v chromium-browser &> /dev/null; then
        chromium-browser --kiosk --app="http://localhost:3000" &
    elif command -v chromium &> /dev/null; then
        chromium --kiosk --app="http://localhost:3000" &
    elif command -v firefox &> /dev/null; then
        firefox --kiosk "http://localhost:3000" &
    else
        xdg-open "http://localhost:3000" &
    fi
fi

# Wait for server process
wait $SERVER_PID
