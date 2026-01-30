#!/bin/bash
# Start server and open CMS in default browser

URL="http://localhost:3000/cms.html"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_PID=""
CLEANED_UP=false

# Load environment variables from .env file if it exists
if [ -f "$SCRIPT_DIR/.env" ]; then
    export $(grep -v '^#' "$SCRIPT_DIR/.env" | xargs)
fi

# Check for required environment variables
if [ -z "$CMS_USERNAME" ] || [ -z "$CMS_PASSWORD" ]; then
    echo "ERROR: CMS_USERNAME and CMS_PASSWORD environment variables must be set."
    echo "Create a .env file with CMS_USERNAME and CMS_PASSWORD"
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
    fi
    exit 0
}

# Trap Ctrl+C and other exit signals
trap cleanup SIGINT SIGTERM EXIT

# Check if port 3000 is in use (cross-platform)
port_in_use() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        lsof -i :3000 >/dev/null 2>&1
    else
        ss -tlnp 2>/dev/null | grep -q ':3000 ' || netstat -tlnp 2>/dev/null | grep -q ':3000 '
    fi
}

# Start server in background if not already running
if ! port_in_use; then
    echo "Starting server..."
    cd "$SCRIPT_DIR" && node server.js &
    SERVER_PID=$!
    sleep 2  # Wait for server to start
fi

# Detect OS and open browser accordingly
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open "$URL"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open "$URL" 2>/dev/null || sensible-browser "$URL" 2>/dev/null || x-www-browser "$URL" 2>/dev/null || gnome-open "$URL" 2>/dev/null
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
    # Windows
    start "$URL"
fi

echo "Opening CMS at $URL"
echo "Press Ctrl+C to stop the server when done."

# Wait for background server process
wait
