#!/bin/bash

# Quick Start Script for AI Thesaurus (No Database Required)
echo "🚀 Starting AI Thesaurus (Simplified Version)"
echo "==============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if port is in use
check_port() {
    local port=$1
    if ss -tlnp 2>/dev/null | grep -q ":$port " || netstat -tlnp 2>/dev/null | grep -q ":$port "; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to wait for service
wait_for_service() {
    local url=$1
    local name=$2
    local max_attempts=$3
    
    echo -e "${YELLOW}Waiting for $name to start...${NC}"
    
    for i in $(seq 1 $max_attempts); do
        if curl -s "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $name is ready!${NC}"
            return 0
        fi
        echo -n "."
        sleep 2
    done
    
    echo -e "${RED}❌ $name failed to start after $((max_attempts * 2)) seconds${NC}"
    return 1
}

# Stop any existing processes
echo -e "${BLUE}🛑 Stopping existing processes...${NC}"
pkill -f "tsx watch src/server" 2>/dev/null
pkill -f "next dev" 2>/dev/null
sleep 2

# Start simplified backend
echo -e "${BLUE}📡 Starting simplified backend server...${NC}"
cd /mnt/c/Users/wanth/hharry/models/python/thesaurus

if check_port 3001; then
    echo -e "${YELLOW}⚠️ Port 3001 still in use, trying to kill process...${NC}"
    lsof -ti:3001 2>/dev/null | xargs kill -9 2>/dev/null || true
    sleep 2
fi

nohup npm run dev:simple > backend-simple.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to start
if wait_for_service "http://localhost:3001/health" "Backend" 10; then
    echo -e "${GREEN}✅ Backend API ready at http://localhost:3001${NC}"
else
    echo -e "${RED}❌ Backend failed to start. Check backend-simple.log${NC}"
    exit 1
fi

# Start frontend
echo -e "${BLUE}🌐 Starting frontend server...${NC}"
cd frontend

if check_port 3000; then
    echo -e "${YELLOW}⚠️ Port 3000 still in use, trying to kill process...${NC}"
    lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null || true
    sleep 2
fi

nohup npm run dev > frontend-simple.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

# Wait for frontend to start
if wait_for_service "http://localhost:3000" "Frontend" 15; then
    echo -e "${GREEN}✅ Frontend ready at http://localhost:3000${NC}"
else
    echo -e "${RED}❌ Frontend failed to start. Check frontend-simple.log${NC}"
    echo -e "${YELLOW}You can still access the backend API directly${NC}"
fi

# Test Ollama connection
echo -e "${BLUE}🤖 Testing Ollama connection...${NC}"
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Ollama is running with models available${NC}"
    
    # Show available models
    echo -e "${BLUE}📋 Available models:${NC}"
    curl -s http://localhost:11434/api/tags | jq -r '.models[] | "  - " + .name' 2>/dev/null || echo "  Could not list models"
else
    echo -e "${RED}❌ Ollama not responding. Make sure it's running with: ollama serve${NC}"
fi

# Final status
echo ""
echo -e "${GREEN}🎉 AI Thesaurus is ready!${NC}"
echo "================================"
echo -e "Frontend:  ${BLUE}http://localhost:3000${NC}"
echo -e "Backend:   ${BLUE}http://localhost:3001${NC}" 
echo -e "Health:    ${BLUE}http://localhost:3001/health${NC}"
echo ""
echo -e "${YELLOW}💡 Features available:${NC}"
echo "  ✅ Word Analysis (fast with tinyllama model)"
echo "  ✅ Semantic Search" 
echo "  ✅ Embedding Provider Selection"
echo "  ✅ Real-time AI processing"
echo ""
echo -e "${BLUE}🔧 To stop servers:${NC}"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo "  or run: pkill -f \"tsx watch\"; pkill -f \"next dev\""
echo ""
echo -e "${GREEN}📱 Open http://localhost:3000 in your browser to get started!${NC}"