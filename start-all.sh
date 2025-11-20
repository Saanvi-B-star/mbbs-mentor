#!/bin/bash

# MBBS Mentor - Start All Services
# This script starts backend, frontend-user, and frontend-admin concurrently

echo "🚀 Starting MBBS Mentor - All Services"
echo "========================================"
echo ""
echo "📦 Backend:       http://localhost:5001"
echo "👨‍🎓 Frontend User:  http://localhost:3000"
echo "👨‍💼 Frontend Admin: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all services"
echo "========================================"
echo ""

# Function to handle cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    kill 0
    exit
}

# Set up trap to catch Ctrl+C
trap cleanup SIGINT SIGTERM

# Start all services in background
(cd backend && npm run dev) &
(cd frontend-user && npm run dev) &
(cd frontend-admin && npm run dev) &

# Wait for all background processes
wait
