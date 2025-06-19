#!/bin/bash

echo "🔄 Restarting Backend Services"
echo "==============================="

# Change to backend directory
cd /root/todo-list-xtreme/backend

echo "1. Stopping existing services..."
docker-compose down 2>/dev/null || true

echo "2. Starting Docker service..."
sudo systemctl start docker

echo "3. Waiting for Docker to be ready..."
sleep 3

echo "4. Starting backend services..."
docker-compose up -d

echo "5. Waiting for services to start..."
sleep 15

echo "6. Checking service status..."
docker-compose ps

echo "7. Testing backend health..."
curl -s http://localhost:8000/health | head -n 3 || echo "Backend not ready yet"

echo ""
echo "✅ Backend restart complete!"
echo "You can now test the frontend at http://localhost:3000"
