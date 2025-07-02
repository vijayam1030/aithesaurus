#!/bin/bash

# AI Thesaurus Server Startup Script
echo "🚀 Starting AI Thesaurus Application..."

# Function to check if port is in use
check_port() {
    local port=$1
    if ss -tlnp 2>/dev/null | grep -q ":$port " || netstat -tlnp 2>/dev/null | grep -q ":$port "; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to start backend
start_backend() {
    echo "📡 Starting backend server..."
    cd /mnt/c/Users/wanth/hharry/models/python/thesaurus
    
    if check_port 3001; then
        echo "✅ Backend already running on port 3001"
    else
        echo "🔄 Starting backend on port 3001..."
        nohup npm run dev > backend.log 2>&1 &
        BACKEND_PID=$!
        echo "Backend PID: $BACKEND_PID"
        
        # Wait for backend to start
        for i in {1..10}; do
            sleep 2
            if check_port 3001; then
                echo "✅ Backend started successfully"
                return 0
            fi
            echo "   Waiting for backend... ($i/10)"
        done
        
        echo "❌ Backend failed to start after 20 seconds"
        echo "Check backend.log for errors"
        return 1
    fi
}

# Function to start frontend
start_frontend() {
    echo "🌐 Starting frontend server..."
    cd /mnt/c/Users/wanth/hharry/models/python/thesaurus/frontend
    
    if check_port 3000; then
        echo "✅ Frontend already running on port 3000"
    else
        echo "🔄 Starting frontend on port 3000..."
        nohup npm run dev > frontend.log 2>&1 &
        FRONTEND_PID=$!
        echo "Frontend PID: $FRONTEND_PID"
        
        # Wait for frontend to start
        for i in {1..15}; do
            sleep 2
            if check_port 3000; then
                echo "✅ Frontend started successfully"
                return 0
            fi
            echo "   Waiting for frontend... ($i/15)"
        done
        
        echo "❌ Frontend failed to start, trying alternative method..."
        # Kill the failed process
        kill $FRONTEND_PID 2>/dev/null
        
        # Try with explicit host binding
        echo "🔄 Trying with host binding 0.0.0.0..."
        nohup npx next dev -H 0.0.0.0 -p 3000 > frontend-alt.log 2>&1 &
        FRONTEND_PID=$!
        
        for i in {1..10}; do
            sleep 2
            if check_port 3000; then
                echo "✅ Frontend started successfully with alternative method"
                return 0
            fi
            echo "   Waiting for frontend (alt)... ($i/10)"
        done
        
        echo "❌ Frontend failed to start with both methods"
        echo "Check frontend.log and frontend-alt.log for errors"
        return 1
    fi
}

# Function to show status
show_status() {
    echo ""
    echo "📊 Server Status:"
    echo "=================="
    
    if check_port 3001; then
        echo "✅ Backend API: http://localhost:3001"
        # Test health endpoint
        if curl -s http://localhost:3001/health > /dev/null 2>&1; then
            echo "   └─ Health check: PASSED"
        else
            echo "   └─ Health check: FAILED"
        fi
    else
        echo "❌ Backend: NOT RUNNING"
    fi
    
    if check_port 3000; then
        echo "✅ Frontend: http://localhost:3000"
    else
        echo "❌ Frontend: NOT RUNNING"
    fi
    
    echo ""
    echo "🔗 Access your application at: http://localhost:3000"
    echo "📖 API documentation at: http://localhost:3001/health"
}

# Function to stop servers
stop_servers() {
    echo "🛑 Stopping servers..."
    
    # Kill processes on ports more thoroughly
    if check_port 3001; then
        echo "Stopping backend on port 3001..."
        pkill -f "tsx watch src/server.ts" 2>/dev/null
        pkill -f "node.*server.ts" 2>/dev/null
        sleep 2
    fi
    
    if check_port 3000; then
        echo "Stopping frontend on port 3000..."
        pkill -f "next dev" 2>/dev/null
        pkill -f "node.*next" 2>/dev/null
        sleep 2
    fi
    
    # Force kill if still running
    lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null || true
    lsof -ti:3001 2>/dev/null | xargs kill -9 2>/dev/null || true
    
    echo "✅ Servers stopped"
}

# Function to show logs
show_logs() {
    echo "📄 Recent Backend Logs:"
    echo "======================"
    if [ -f backend.log ]; then
        tail -10 backend.log
    else
        echo "No backend.log found"
    fi
    
    echo ""
    echo "📄 Recent Frontend Logs:"
    echo "========================"
    if [ -f frontend.log ]; then
        tail -10 frontend.log
    else
        echo "No frontend.log found"
    fi
    
    if [ -f frontend-alt.log ]; then
        echo ""
        echo "📄 Frontend Alternative Logs:"
        echo "============================="
        tail -10 frontend-alt.log
    fi
}

# Main execution
case "${1:-start}" in
    "start")
        start_backend
        start_frontend
        show_status
        ;;
    "stop")
        stop_servers
        ;;
    "restart")
        stop_servers
        sleep 3
        start_backend
        start_frontend
        show_status
        ;;
    "status")
        show_status
        ;;
    "logs")
        show_logs
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs}"
        echo "  start   - Start both servers (default)"
        echo "  stop    - Stop both servers"
        echo "  restart - Restart both servers"
        echo "  status  - Show current status"
        echo "  logs    - Show recent log files"
        ;;
esac