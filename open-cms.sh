#!/bin/bash
# Open CMS in default browser

URL="http://localhost:3000/cms.html"

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
