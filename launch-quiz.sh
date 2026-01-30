#!/bin/bash

# Cyber Fortis Quiz Launcher
# This script starts the server and opens the browser

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Load environment variables from .env file if it exists
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Check if CMS credentials are set
if [ -z "$CMS_USERNAME" ] || [ -z "$CMS_PASSWORD" ]; then
    echo "ERROR: CMS credentials not found."
    echo "Please create a .env file with CMS_USERNAME and CMS_PASSWORD"
    exit 1
fi

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
    if [ -d "/Applications/Google Chrome.app" ]; then
        open -a "Google Chrome" --args --kiosk "http://127.0.0.1:3000"
    elif [ -d "/Applications/Chromium.app" ]; then
        open -a "Chromium" --args --kiosk "http://127.0.0.1:3000"
    else
        open "http://127.0.0.1:3000"
    fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux - try different browsers in kiosk mode
    if command -v google-chrome &> /dev/null; then
        google-chrome --kiosk "http://127.0.0.1:3000" &
    elif command -v chromium-browser &> /dev/null; then
        chromium-browser --kiosk "http://127.0.0.1:3000" &
    elif command -v chromium &> /dev/null; then
        chromium --kiosk "http://127.0.0.1:3000" &
    elif command -v firefox &> /dev/null; then
        firefox --kiosk "http://127.0.0.1:3000" &
    else
        xdg-open "http://127.0.0.1:3000" &
    fi
fi

# Wait for server process
wait $SERVER_PID
