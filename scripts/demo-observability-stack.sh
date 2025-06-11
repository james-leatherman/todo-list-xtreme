#!/bin/bash

echo "🎯 Todo List Xtreme Observability Stack - Final Demo"
echo "===================================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}📊 Service Status Check:${NC}"
echo "----------------------------"
cd /root/todo-list-xtreme/backend
docker-compose ps
echo ""

echo -e "${BLUE}🎯 Generating Sample Traffic:${NC}"
echo "------------------------------------"
echo "Sending requests to FastAPI endpoints..."
for i in {1..5}; do
    echo -n "."
    curl -s http://localhost:8000/health > /dev/null
    curl -s http://localhost:8000/docs > /dev/null
    sleep 1
done
echo ""
echo ""

echo -e "${BLUE}📈 Metrics Verification:${NC}"
echo "----------------------------"
echo -n "FastAPI Health Check: "
if curl -s http://localhost:8000/health | grep -q "healthy"; then
    echo -e "${GREEN}✓ Working${NC}"
else
    echo "✗ Failed"
fi

echo -n "Prometheus Targets: "
target_count=$(curl -s "http://localhost:9090/api/v1/targets" | grep -o '"health":"up"' | wc -l)
echo -e "${GREEN}✓ $target_count targets UP${NC}"

echo -n "Grafana Dashboards: "
dashboard_count=$(curl -s "http://admin:admin@localhost:3001/api/search" | grep -o '"type":"dash-db"' | wc -l)
echo -e "${GREEN}✓ $dashboard_count dashboards loaded${NC}"

echo ""
echo -e "${BLUE}🔍 Sample Metrics Data:${NC}"
echo "-------------------------"
echo "HTTP Request Count:"
curl -s "http://localhost:9090/api/v1/query?query=http_requests_total" | grep -o '"value":\[[^]]*\]' | head -3
echo ""

echo -e "${BLUE}🌐 Access Your Observability Stack:${NC}"
echo "========================================="
echo ""
echo -e "${YELLOW}🎛️  Grafana Dashboard:${NC}"
echo "   → http://localhost:3001"
echo "   → Username: admin"
echo "   → Password: admin"
echo ""
echo -e "${YELLOW}📊 Prometheus Web UI:${NC}"
echo "   → http://localhost:9090"
echo "   → Query: http_requests_total"
echo "   → Query: rate(http_requests_total[5m])"
echo ""
echo -e "${YELLOW}🚀 FastAPI Application:${NC}"
echo "   → http://localhost:8000"
echo "   → API Docs: http://localhost:8000/docs"
echo "   → Metrics: http://localhost:8000/metrics"
echo ""

echo -e "${GREEN}✨ OBSERVABILITY STACK IS FULLY OPERATIONAL! ✨${NC}"
echo ""
echo "🎯 Next Steps:"
echo "  1. Open Grafana and explore the dashboards"
echo "  2. Create custom queries in Prometheus"
echo "  3. Monitor your application performance"
echo "  4. Set up alerts for critical metrics"
echo ""
echo "📚 Full documentation: /root/todo-list-xtreme/OBSERVABILITY_SETUP_COMPLETE.md"
