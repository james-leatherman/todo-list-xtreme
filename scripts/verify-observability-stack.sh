#!/bin/bash

echo "🔍 Todo List Xtreme Observability Stack Verification"
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check service
check_service() {
    local service_name=$1
    local url=$2
    local expected_text=$3
    
    echo -n "Checking $service_name... "
    
    if curl -s "$url" | grep -q "$expected_text" 2>/dev/null; then
        echo -e "${GREEN}✓ Running${NC}"
        return 0
    else
        echo -e "${RED}✗ Failed${NC}"
        return 1
    fi
}

# Function to check JSON endpoint
check_json_service() {
    local service_name=$1
    local url=$2
    
    echo -n "Checking $service_name... "
    
    if curl -s "$url" | python3 -m json.tool > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Running${NC}"
        return 0
    else
        echo -e "${RED}✗ Failed${NC}"
        return 1
    fi
}

echo ""
echo "📊 Service Health Checks:"
echo "------------------------"

# Check FastAPI
check_json_service "FastAPI Health" "http://localhost:8000/health"

# Check FastAPI Metrics
check_service "FastAPI Metrics" "http://localhost:8000/metrics" "python_gc_objects_collected_total"

# Check Prometheus
check_json_service "Prometheus API" "http://localhost:9090/api/v1/targets"

# Check Grafana
check_json_service "Grafana API" "http://admin:admin@localhost:3001/api/search"

# Check OpenTelemetry Collector
echo -n "Checking OTEL Collector... "
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8889/metrics | grep -q "200"; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Failed${NC}"
fi

echo ""
echo "📈 Metrics Collection Test:"
echo "--------------------------"

# Generate test traffic
echo "Generating test traffic..."
for i in {1..5}; do
    curl -s http://localhost:8000/health > /dev/null
    curl -s http://localhost:8000/docs > /dev/null
done

sleep 2

# Check if metrics are being collected
echo -n "Checking metrics collection... "
if curl -s "http://localhost:9090/api/v1/query?query=http_requests_total" | grep -q "http_requests_total" 2>/dev/null; then
    echo -e "${GREEN}✓ Metrics flowing${NC}"
else
    echo -e "${RED}✗ No metrics found${NC}"
fi

echo ""
echo "🎛️  Dashboard Status:"
echo "-------------------"

# Check dashboard availability
dashboard_count=$(curl -s "http://admin:admin@localhost:3001/api/search" | grep -o '"type":"dash-db"' | wc -l)
echo "Available dashboards: $dashboard_count"

if [ $dashboard_count -gt 0 ]; then
    echo -e "${GREEN}✓ Dashboards loaded${NC}"
else
    echo -e "${RED}✗ No dashboards found${NC}"
fi

echo ""
echo "🔗 Access URLs:"
echo "--------------"
echo "FastAPI Swagger UI: http://localhost:8000/docs"
echo "FastAPI Metrics:    http://localhost:8000/metrics"
echo "Prometheus:         http://localhost:9090"
echo "Grafana:            http://localhost:3001 (admin/admin)"
echo "OTEL Collector:     http://localhost:8889/metrics"

echo ""
echo "🎯 Quick Actions:"
echo "----------------"
echo "View Prometheus targets: curl http://localhost:9090/api/v1/targets"
echo "View Grafana dashboards: curl http://admin:admin@localhost:3001/api/search"
echo "Generate test traffic:   curl http://localhost:8000/health"

echo ""
echo -e "${GREEN}🚀 Observability stack is ready!${NC}"
echo "Log in to Grafana (admin/admin) to view your dashboards."
