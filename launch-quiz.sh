#!/bin/bash

# Cyber Fortis Quiz Launcher
# This script starts the server and opens the browser

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

SERVER_PID=""
CLEANED_UP=false

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

# Cleanup function to kill server on exit
cleanup() {
    if [ "$CLEANED_UP" = true ]; then
        return
    fi
    CLEANED_UP=true
    if [ -n "$SERVER_PID" ]; then
        echo ""
        echo "Stopping server..."
        kill "$SERVER_PID" 2>/dev/null
        wait "$SERVER_PID" 2>/dev/null
    fi
    exit 0
}

# Trap Ctrl+C and other exit signals
trap cleanup SIGINT SIGTERM EXIT

# Function to kill process on port 3000
kill_port_3000() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        local pid=$(lsof -ti :3000 2>/dev/null)
        if [ -n "$pid" ]; then
            echo "Killing existing process on port 3000 (PID: $pid)..."
            kill -9 $pid 2>/dev/null
            sleep 1
        fi
    else
        # Linux
        local pid=$(ss -tlnp 2>/dev/null | grep ':3000 ' | grep -oP 'pid=\K\d+' | head -1)
        if [ -z "$pid" ]; then
            pid=$(netstat -tlnp 2>/dev/null | grep ':3000 ' | awk '{print $7}' | cut -d'/' -f1 | head -1)
        fi
        if [ -z "$pid" ]; then
            pid=$(fuser 3000/tcp 2>/dev/null)
        fi
        if [ -n "$pid" ]; then
            echo "Killing existing process on port 3000 (PID: $pid)..."
            kill -9 $pid 2>/dev/null
            sleep 1
        fi
    fi
}

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

# Always kill any existing process on port 3000 to ensure clean start
kill_port_3000

# Start server in background
node server.js &
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

echo "Press Ctrl+C to stop the server when done."

# Wait for server process
wait "$SERVER_PID"
