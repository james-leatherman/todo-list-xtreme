#!/bin/bash

echo "🔄 Restarting Frontend Services"
echo "==============================="

# Change to frontend directory
cd /root/todo-list-xtreme/frontend

echo "1. Stopping existing frontend processes..."
# Kill any existing npm/node processes for the frontend
pkill -f "node.*frontend" 2>/dev/null || true
pkill -f "npm.*start" 2>/dev/null || true
sleep 2

echo "2. Clearing npm cache and node_modules (if needed)..."
if [ -d "node_modules" ]; then
    echo "   - Node modules directory exists"
else
    echo "   - Installing dependencies..."
    npm install
fi

echo "3. Starting frontend development server..."
# Start in background
npm start &
FRONTEND_PID=$!

echo "4. Waiting for frontend to start..."
sleep 10

echo "5. Testing frontend availability..."
for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "   ✅ Frontend is responding on http://localhost:3000"
        break
    elif [ $i -eq 30 ]; then
        echo "   ⚠️  Frontend may still be starting up..."
        break
    else
        echo "   - Waiting... ($i/30)"
        sleep 2
    fi
done

echo ""
echo "Frontend PID: $FRONTEND_PID"
echo "✅ Frontend restart complete!"
echo ""
echo "📋 Next Steps:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:8000"
echo "   - Grafana: http://localhost:3001 (admin/admin)"
echo ""
echo "To stop frontend: kill $FRONTEND_PID"
echo "To view logs: tail -f ~/.npm/_logs/*.log"
