#!/bin/bash

# Quick Observability Stack Status Check
echo "🚀 Quick Observability Stack Status"
echo "=================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -n "FastAPI:          "
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Down${NC}"
fi

echo -n "Prometheus:       "
if curl -s http://localhost:9090/-/ready > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Down${NC}"
fi

echo -n "Grafana:          "
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Down${NC}"
fi

echo -n "OTEL Collector:   "
if curl -s http://localhost:8889/metrics > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Down${NC}"
fi

echo -n "Tempo:            "
if curl -s http://localhost:3200/ready > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Down${NC}"
fi

echo ""
echo "📊 Quick Access:"
echo "   Grafana:    http://localhost:3001 (admin/admin)"
echo "   Prometheus: http://localhost:9090"
echo "   API Docs:   http://localhost:8000/docs"
echo ""
echo "🔧 Commands:"
echo "   Full check: bash scripts/verify-observability-stack.sh"
echo "   Restart:    docker-compose down && docker-compose up -d"
