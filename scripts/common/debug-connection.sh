#!/bin/bash

# Source common authentication functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common-test-functions.sh"

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
echo "6. Testing API connectivity..."
if test_api_connectivity; then
    echo -e "${GREEN}✅ API is accessible${NC}"
else
    echo -e "${RED}❌ API is not accessible${NC}"
fi

echo ""
echo "7. Testing API with authentication..."
if validate_auth_setup; then
    echo -e "${GREEN}✅ Authentication is working${NC}"
else
    echo -e "${RED}❌ Authentication failed${NC}"
fi

echo ""
echo "8. Checking frontend status..."
curl -s "http://localhost:3000" | head -n 5 || echo "Frontend not responding"

echo ""
echo "9. Authentication status:"
show_auth_status

echo ""
echo "Done!"
