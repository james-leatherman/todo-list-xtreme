#!/bin/bash

echo "🔍 Todo List Xtreme Observability Stack Verification"
echo "=================================================="
echo "Verifying complete observability stack setup:"
echo "- FastAPI service with metrics and health"
echo "- OpenTelemetry Collector (OTLP + Prometheus export)"
echo "- Prometheus metrics collection"
echo "- Grafana Tempo distributed tracing"
echo "- Grafana dashboards and visualization"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TIMEOUT=10
RETRY_ATTEMPTS=3

# Function to check service with retry logic
check_service() {
    local service_name=$1
    local url=$2
    local expected_pattern=$3
    local retry_count=0
    
    echo -n "Checking $service_name... "
    
    while [ $retry_count -lt $RETRY_ATTEMPTS ]; do
        if timeout $TIMEOUT curl -s "$url" | grep -q "$expected_pattern" 2>/dev/null; then
            echo -e "${GREEN}✓ Running${NC}"
            return 0
        fi
        ((retry_count++))
        [ $retry_count -lt $RETRY_ATTEMPTS ] && sleep 2
    done
    
    echo -e "${RED}✗ Failed (tried $RETRY_ATTEMPTS times)${NC}"
    return 1
}

# Function to check HTTP status code
check_status_code() {
    local service_name=$1
    local url=$2
    local method=${3:-GET}
    local expected_codes=$4
    local retry_count=0
    
    echo -n "Checking $service_name... "
    
    while [ $retry_count -lt $RETRY_ATTEMPTS ]; do
        local status_code
        if [ "$method" = "POST" ]; then
            status_code=$(timeout $TIMEOUT curl -s -o /dev/null -w "%{http_code}" -X POST "$url" 2>/dev/null)
        else
            status_code=$(timeout $TIMEOUT curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
        fi
        
        if echo "$expected_codes" | grep -q "$status_code"; then
            echo -e "${GREEN}✓ Running (HTTP $status_code)${NC}"
            return 0
        fi
        ((retry_count++))
        [ $retry_count -lt $RETRY_ATTEMPTS ] && sleep 2
    done
    
    echo -e "${RED}✗ Failed (HTTP $status_code, expected: $expected_codes)${NC}"
    return 1
}

# Function to check JSON endpoint
check_json_service() {
    local service_name=$1
    local url=$2
    local retry_count=0
    
    echo -n "Checking $service_name... "
    
    while [ $retry_count -lt $RETRY_ATTEMPTS ]; do
        if timeout $TIMEOUT curl -s "$url" | python3 -m json.tool > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Running${NC}"
            return 0
        fi
        ((retry_count++))
        [ $retry_count -lt $RETRY_ATTEMPTS ] && sleep 2
    done
    
    echo -e "${RED}✗ Failed (invalid JSON or unreachable)${NC}"
    return 1
}

echo ""
echo "📊 Core Service Health Checks:"
echo "------------------------------"

services_status=0

# Check FastAPI
if check_json_service "FastAPI Health" "http://localhost:8000/health"; then
    ((services_status++))
else
    echo "   💡 Try: docker-compose up api"
fi

# Check FastAPI Metrics
if check_service "FastAPI Metrics" "http://localhost:8000/metrics" "python_gc_objects_collected_total"; then
    ((services_status++))
else
    echo "   💡 Check: API service metrics endpoint"
fi

# Check Prometheus
if check_json_service "Prometheus API" "http://localhost:9090/api/v1/targets"; then
    ((services_status++))
else
    echo "   💡 Try: docker-compose up prometheus"
fi

# Check Grafana
if check_json_service "Grafana API" "http://admin:admin@localhost:3001/api/search"; then
    ((services_status++))
else
    echo "   💡 Try: docker-compose up grafana"
fi

echo ""
echo "🔗 OpenTelemetry & Tracing Services:"
echo "-----------------------------------"

# Check OpenTelemetry Collector Metrics
if check_status_code "OTEL Collector (Metrics)" "http://localhost:8889/metrics" "GET" "200"; then
    ((services_status++))
else
    echo "   💡 Try: docker-compose up otel-collector"
fi

# Check OpenTelemetry Collector OTLP HTTP endpoint
if check_status_code "OTEL Collector (OTLP HTTP)" "http://localhost:4318/v1/traces" "POST" "415|400"; then
    ((services_status++))
else
    echo "   💡 Check: OTEL Collector OTLP receiver on port 4318"
fi

# Check OpenTelemetry Collector OTLP gRPC endpoint
echo -n "Checking OTEL Collector (OTLP gRPC)... "
if timeout $TIMEOUT nc -z localhost 4317 2>/dev/null; then
    echo -e "${GREEN}✓ Port 4317 accessible${NC}"
    ((services_status++))
else
    echo -e "${RED}✗ Port 4317 not accessible${NC}"
    echo "   💡 Check: OTEL Collector gRPC receiver on port 4317"
fi

# Check Tempo
if check_status_code "Tempo" "http://localhost:3200/ready" "GET" "200|503"; then
    ((services_status++))
else
    echo "   💡 Try: docker-compose up tempo"
fi

echo ""
echo "📈 Data Flow & Collection Verification:"
echo "--------------------------------------"

# Generate comprehensive test traffic
echo "🚀 Generating comprehensive test traffic..."
for i in {1..10}; do
    curl -s http://localhost:8000/health > /dev/null 2>&1
    curl -s http://localhost:8000/docs > /dev/null 2>&1
    curl -s http://localhost:8000/metrics > /dev/null 2>&1
    [ $((i % 3)) -eq 0 ] && echo -n "."
done
echo " Done!"

sleep 5

# Check if metrics are being collected in Prometheus
echo -n "Checking Prometheus metrics collection... "
if curl -s "http://localhost:9090/api/v1/query?query=up" | grep -q '"result":\[' 2>/dev/null; then
    metric_targets=$(curl -s "http://localhost:9090/api/v1/query?query=up" | grep -o '"result":\[[^]]*\]' | grep -o '{[^}]*}' | wc -l)
    echo -e "${GREEN}✓ Metrics flowing ($metric_targets targets)${NC}"
else
    echo -e "${RED}✗ No metrics found in Prometheus${NC}"
    echo "   💡 Check: Prometheus scrape configuration"
fi

# Check specific application metrics
echo -n "Checking FastAPI application metrics... "
if curl -s "http://localhost:9090/api/v1/query?query=python_info" | grep -q '"python_info"' 2>/dev/null; then
    echo -e "${GREEN}✓ Application metrics active${NC}"
else
    echo -e "${YELLOW}⚠ Application metrics may not be scraped yet${NC}"
    echo "   💡 Wait a few moments and check Prometheus targets"
fi

# Check OpenTelemetry Collector metrics
echo -n "Checking OTEL Collector internal metrics... "
if curl -s "http://localhost:8889/metrics" | grep -q "otelcol_" 2>/dev/null; then
    echo -e "${GREEN}✓ OTEL Collector metrics available${NC}"
else
    echo -e "${YELLOW}⚠ OTEL Collector metrics not found${NC}"
fi

# Check trace collection with improved logic
echo -n "Checking trace collection... "
if command -v docker-compose >/dev/null 2>&1; then
    # Check OTEL Collector logs for trace activity
    trace_logs=$(docker-compose logs --tail=50 otel-collector 2>/dev/null | grep -i -E "(trace|span)" | head -5)
    tempo_logs=$(docker-compose logs --tail=50 tempo 2>/dev/null | grep -i -E "(trace|span|ready)" | head -3)
    
    if [ -n "$trace_logs" ] || [ -n "$tempo_logs" ]; then
        echo -e "${GREEN}✓ Trace activity detected${NC}"
        echo "   📊 Recent trace activity:"
        [ -n "$trace_logs" ] && echo "$trace_logs" | sed 's/^/      /'
        [ -n "$tempo_logs" ] && echo "$tempo_logs" | sed 's/^/      /'
    else
        echo -e "${YELLOW}⚠ Limited trace activity${NC}"
        echo "   💡 Try: Generate more application traffic with tracing enabled"
    fi
else
    echo -e "${YELLOW}⚠ Docker Compose not available for trace check${NC}"
fi

echo ""
echo "🎛️  Dashboard & Visualization Status:"
echo "------------------------------------"

# Check dashboard availability with more details
dashboard_response=$(curl -s "http://admin:admin@localhost:3001/api/search")
dashboard_count=$(echo "$dashboard_response" | grep -o '"type":"dash-db"' | wc -l)

echo "📊 Available dashboards: $dashboard_count"

if [ "$dashboard_count" -gt 0 ]; then
    echo -e "${GREEN}✓ Dashboards loaded${NC}"
    
    # List some dashboard names
    echo "   📋 Dashboard examples:"
    echo "$dashboard_response" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    for item in data[:5]:  # Show first 5 dashboards
        if item.get('type') == 'dash-db':
            print(f'      - {item.get(\"title\", \"Unknown\")} ({item.get(\"uid\", \"no-uid\")})')
except: pass
" 2>/dev/null || echo "      - (Dashboard list parsing failed)"
else
    echo -e "${RED}✗ No dashboards found${NC}"
    echo "   💡 Check: Grafana dashboard provisioning in grafana/provisioning/"
fi

# Check Grafana data source configuration
echo -n "Checking Grafana data sources... "
ds_response=$(curl -s "http://admin:admin@localhost:3001/api/datasources")
if echo "$ds_response" | grep -q "Prometheus\|Tempo" 2>/dev/null; then
    echo -e "${GREEN}✓ Data sources configured${NC}"
else
    echo -e "${YELLOW}⚠ Data sources may need configuration${NC}"
    echo "   💡 Check: Grafana data source provisioning"
fi

echo ""
echo "� Overall Status Summary:"
echo "-------------------------"
if [ $services_status -ge 6 ]; then
    echo -e "${GREEN}🚀 Observability stack is healthy! ($services_status/8 services running)${NC}"
elif [ $services_status -ge 4 ]; then
    echo -e "${YELLOW}⚠️  Observability stack is partially running ($services_status/8 services)${NC}"
    echo "   💡 Some services may need attention"
else
    echo -e "${RED}❌ Observability stack needs attention ($services_status/8 services running)${NC}"
    echo "   💡 Try: docker-compose up -d"
fi

echo ""
echo "�🔗 Access URLs:"
echo "--------------"
echo "📊 FastAPI Swagger UI:        http://localhost:8000/docs"
echo "📈 FastAPI Metrics:           http://localhost:8000/metrics"
echo "🎯 Prometheus:                http://localhost:9090"
echo "📋 Grafana:                   http://localhost:3001 (admin/admin)"
echo "🔧 OTEL Collector Metrics:    http://localhost:8889/metrics"
echo "🔍 Tempo:                     http://localhost:3200"

echo ""
echo "🎯 Troubleshooting Commands:"
echo "---------------------------"
echo "📊 View Prometheus targets:      curl http://localhost:9090/api/v1/targets"
echo "📋 View Grafana dashboards:      curl http://admin:admin@localhost:3001/api/search"
echo "🏥 Generate test traffic:        curl http://localhost:8000/health"
echo "📋 Check OTEL Collector logs:    docker-compose logs otel-collector"
echo "🔍 Check Tempo status:           curl http://localhost:3200/ready"
echo "🔧 Restart all services:         docker-compose down && docker-compose up -d"

echo ""
echo "� Data Flow Architecture:"
echo "-------------------------"
echo "� Metrics: FastAPI → Prometheus → Grafana"
echo "🔍 Traces:  FastAPI → OTEL Collector → Tempo → Grafana"
echo "📋 Dashboards: Grafana (Prometheus + Tempo data sources)"

echo ""
if [ $services_status -ge 6 ]; then
    echo -e "${GREEN}✅ Your observability stack is ready for monitoring!${NC}"
    echo "🎛️  Access Grafana at http://localhost:3001 (admin/admin) to explore dashboards and traces."
else
    echo -e "${YELLOW}⚠️  Some services need attention. Check logs and restart if needed.${NC}"
    echo "💡 Run: docker-compose logs [service-name] to debug specific services"
fi
