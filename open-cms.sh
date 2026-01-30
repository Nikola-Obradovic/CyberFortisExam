#!/bin/bash
# Start server and open CMS in default browser

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_PID=""
CLEANED_UP=false

# Generate a new UUID for the CMS path each time
CMS_SECRET_PATH=$(cat /proc/sys/kernel/random/uuid 2>/dev/null || uuidgen 2>/dev/null || date +%s%N | sha256sum | head -c 36)
export CMS_SECRET_PATH

URL="http://localhost:3000/${CMS_SECRET_PATH}/cms.html"

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

# Always kill any existing process on port 3000 to ensure clean start
kill_port_3000

# Start server in foreground (but backgrounded so we can track it)
echo "Starting server..."
cd "$SCRIPT_DIR" && node server.js &
SERVER_PID=$!
sleep 2  # Wait for server to start

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

echo ""
echo "============================================"
echo "CMS Admin Panel opened at:"
echo "$URL"
echo "============================================"
echo ""
echo "Press Ctrl+C to stop the server when done."

# Wait for background server process
wait "$SERVER_PID"
