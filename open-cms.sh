#!/bin/bash
# Start server and open CMS in default browser

URL="http://localhost:3000/cms.html"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Start server in background if not already running
if ! ss -tlnp 2>/dev/null | grep -q ':3000 ' && ! netstat -tlnp 2>/dev/null | grep -q ':3000 '; then
    echo "Starting server..."
    cd "$SCRIPT_DIR" && node server.js &
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
