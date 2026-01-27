#!/bin/bash

echo "========================================"
echo "  Cyber Fortis Quiz Aplikacija"
echo "========================================"
echo ""

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
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm start
