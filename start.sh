#!/bin/bash

echo "========================================"
echo "  Cyber Fortis Quiz Aplikacija"
echo "========================================"
echo ""

# Load environment variables from .env file if it exists
if [ -f ".env" ]; then
    echo "Loading credentials from .env file..."
    export $(grep -v '^#' .env | xargs)
    echo ""
fi

# Check if CMS credentials are set
if [ -z "$CMS_USERNAME" ] || [ -z "$CMS_PASSWORD" ]; then
    echo "CMS credentials not found."
    echo "Please create a .env file with CMS_USERNAME and CMS_PASSWORD"
    echo "Or set them as environment variables."
    echo ""
    echo "Example .env file:"
    echo "  CMS_USERNAME=cyberfortis"
    echo "  CMS_PASSWORD=YourSecurePassword"
    echo ""
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo ""
fi

# Check if database exists
if [ ! -f "quiz.db" ]; then
    echo "Initializing database..."
    npm run init-db
    echo ""
fi

# Create results directory if it doesn't exist
if [ ! -d "results" ]; then
    echo "Creating results directory..."
    mkdir -p results
    echo ""
fi

echo "Starting server..."
echo "The application will be available at: http://localhost:3000"
echo "CMS available at: http://localhost:3000/cms.html"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm start
