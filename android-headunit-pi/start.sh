#!/bin/bash

# Android Head Unit OS UI System Startup Script
# This script starts the backend server and opens the frontend in a browser

echo "Starting Android Head Unit OS UI System..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Navigate to backend directory
cd "$(dirname "$0")/backend"

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi

# Start the backend server in the background
echo "Starting backend server..."
node server.js &
SERVER_PID=$!

# Wait a moment for server to start
sleep 3

# Check if server is running
if ps -p $SERVER_PID > /dev/null; then
    echo "Backend server started successfully (PID: $SERVER_PID)"
    echo "Frontend available at: http://localhost:3000"
    
    # Try to open in browser (works on desktop systems)
    if command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:3000
    elif command -v open &> /dev/null; then
        open http://localhost:3000
    elif command -v chromium-browser &> /dev/null; then
        chromium-browser --kiosk http://localhost:3000 &
    else
        echo "Please open http://localhost:3000 in your browser"
    fi
    
    echo "Press Ctrl+C to stop the server"
    
    # Wait for user to stop the server
    trap "echo 'Stopping server...'; kill $SERVER_PID; exit" INT
    wait $SERVER_PID
else
    echo "Error: Failed to start backend server"
    exit 1
fi
