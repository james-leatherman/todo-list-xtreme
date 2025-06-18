#!/bin/bash

echo "🔍 Debugging Connection Issues"
echo "================================"

echo "1. Checking Docker status..."
systemctl status docker --no-pager || echo "Docker not running"

echo ""
echo "2. Starting Docker if needed..."
sudo systemctl start docker

echo ""
echo "3. Checking if backend services are running..."
cd /root/todo-list-xtreme/backend
docker-compose ps

echo ""
echo "4. Starting backend services..."
docker-compose up -d

echo ""
echo "5. Waiting for services to start..."
sleep 10

echo ""
echo "6. Checking backend health..."
curl -s "http://localhost:8000/health" || echo "Backend not responding"

echo ""
echo "7. Testing API with token..."
source /root/todo-list-xtreme/.env.development.local
curl -s "http://localhost:8000/api/v1/column-settings/" -H "Authorization: Bearer $TEST_JWT_TOKEN" || echo "API not responding"

echo ""
echo "8. Checking frontend status..."
curl -s "http://localhost:3000" | head -n 5 || echo "Frontend not responding"

echo ""
echo "Done!"
