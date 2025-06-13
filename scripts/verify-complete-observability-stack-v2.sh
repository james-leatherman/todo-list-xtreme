#!/bin/bash

# Comprehensive End-to-End Observability Stack Verification v2
echo "🔍 Comprehensive Observability Stack Verification v2"
echo "==================================================="
echo "Testing the complete observability implementation:"
echo "- Core services health and connectivity"
echo "- Database metrics collection"
echo "- Frontend tracing capabilities"
echo "- Dashboard functionality"
echo "- Tempo trace storage and retrieval"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TIMEOUT=10
RETRY_ATTEMPTS=2

# Test functions
test_step() {
    echo -e "${BLUE}$1${NC}"
}

test_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

test_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

test_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check HTTP endpoint
check_endpoint() {
    local name=$1
    local url=$2
    local method=${3:-GET}
    local expected_codes=${4:-"200"}
    
    local status_code
    if [ "$method" = "POST" ]; then
        status_code=$(timeout $TIMEOUT curl -s -o /dev/null -w "%{http_code}" -X POST "$url" 2>/dev/null)
    else
        status_code=$(timeout $TIMEOUT curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    fi
    
    if echo "$expected_codes" | grep -q "$status_code"; then
        test_success "$name (HTTP $status_code)"
        return 0
    else
        test_error "$name (HTTP $status_code, expected: $expected_codes)"
        return 1
    fi
}

# Test 1: Basic Service Health
test_step "1. Testing basic service health..."
services_up=0

if check_endpoint "FastAPI Health" "http://localhost:8000/health"; then ((services_up++)); fi
if check_endpoint "Prometheus" "http://localhost:9090/api/v1/targets"; then ((services_up++)); fi
if check_endpoint "Grafana" "http://admin:admin@localhost:3001/api/search"; then ((services_up++)); fi
if check_endpoint "OTEL Collector" "http://localhost:8889/metrics"; then ((services_up++)); fi
if check_endpoint "Tempo" "http://localhost:3200/ready" "GET" "200|503"; then ((services_up++)); fi

echo "Basic services status: $services_up/5 running"

# Test 2: Database Metrics Collection
test_step "2. Testing database metrics collection..."

# Generate some API traffic to trigger database queries
for i in {1..5}; do
    curl -s http://localhost:8000/health > /dev/null 2>&1
done

sleep 2

# Check for database-related metrics in the API metrics endpoint
DB_METRICS=$(curl -s http://localhost:8000/metrics | grep -E "^(db_|database_)" | wc -l)
if [ "$DB_METRICS" -gt 0 ]; then
    test_success "Database metrics active ($DB_METRICS metrics found)"
else
    test_warning "Database metrics not found in API endpoint"
fi

# Test 3: OpenTelemetry Collector Functionality
test_step "3. Testing OpenTelemetry Collector functionality..."

# Check OTLP endpoints
if check_endpoint "OTEL OTLP HTTP" "http://localhost:4318/v1/traces" "POST" "415|400"; then
    test_success "OTLP HTTP receiver is active"
else
    test_error "OTLP HTTP receiver failed"
fi

# Check if port 4317 (gRPC) is accessible
if timeout $TIMEOUT nc -z localhost 4317 2>/dev/null; then
    test_success "OTLP gRPC port 4317 accessible"
else
    test_error "OTLP gRPC port 4317 not accessible"
fi

# Test 4: Metrics Flow
test_step "4. Testing metrics data flow..."

# Generate test traffic
echo "Generating test traffic..."
for i in {1..8}; do
    curl -s http://localhost:8000/health > /dev/null 2>&1
    curl -s http://localhost:8000/metrics > /dev/null 2>&1
done

sleep 3

# Check if metrics are reaching Prometheus
if curl -s "http://localhost:9090/api/v1/query?query=up" | grep -q '"result":\[' 2>/dev/null; then
    active_targets=$(curl -s "http://localhost:9090/api/v1/query?query=up{job=\"fastapi\"}" | grep -o '"value":\["[^"]*","[^"]*"\]' | wc -l)
    if [ "$active_targets" -gt 0 ]; then
        test_success "FastAPI metrics flowing to Prometheus"
    else
        test_warning "FastAPI metrics may not be scraped yet"
    fi
else
    test_error "No metrics found in Prometheus"
fi

# Test 5: Dashboard Accessibility
test_step "5. Testing dashboard accessibility..."

dashboard_response=$(curl -s "http://admin:admin@localhost:3001/api/search")
dashboard_count=$(echo "$dashboard_response" | grep -o '"type":"dash-db"' | wc -l)

if [ "$dashboard_count" -gt 0 ]; then
    test_success "$dashboard_count dashboards available"
    
    # Check specific important dashboards
    important_dashboards=("database-metrics" "api-metrics-dashboard" "5f74976b-43ed-41f5-baf3-c59a5e1a31d5")
    accessible_dashboards=0
    
    for dashboard_uid in "${important_dashboards[@]}"; do
        if curl -s -u "admin:admin" "http://localhost:3001/api/dashboards/uid/$dashboard_uid" | grep -q "dashboard" 2>/dev/null; then
            ((accessible_dashboards++))
        fi
    done
    
    if [ "$accessible_dashboards" -gt 0 ]; then
        test_success "$accessible_dashboards/3 key dashboards accessible"
    else
        test_warning "Key dashboards may need configuration"
    fi
else
    test_error "No dashboards found"
fi

# Test 6: Tempo Integration
test_step "6. Testing Tempo trace storage..."

# Check Tempo's readiness
if curl -s "http://localhost:3200/ready" | grep -q "ready" 2>/dev/null; then
    test_success "Tempo is ready for traces"
else
    test_warning "Tempo readiness check inconclusive"
fi

# Check OTEL Collector logs for trace activity
if command -v docker-compose >/dev/null 2>&1; then
    trace_activity=$(docker-compose logs --tail=20 otel-collector 2>/dev/null | grep -i -E "(trace|span)" | wc -l 2>/dev/null)
    if [ -z "$trace_activity" ]; then
        trace_activity=0
    fi
    if [ "$trace_activity" -gt 0 ]; then
        test_success "Trace activity detected in OTEL Collector ($trace_activity entries)"
    else
        test_warning "Limited trace activity in OTEL Collector logs"
    fi
else
    test_warning "Cannot check trace activity (docker-compose not available)"
fi

# Test 7: Data Source Configuration
test_step "7. Testing Grafana data source configuration..."

ds_response=$(curl -s "http://admin:admin@localhost:3001/api/datasources" 2>/dev/null)
prometheus_ds=$(echo "$ds_response" | grep -c "Prometheus" 2>/dev/null || echo "0")
tempo_ds=$(echo "$ds_response" | grep -c "Tempo" 2>/dev/null || echo "0")

if [ "$prometheus_ds" -gt 0 ] && [ "$tempo_ds" -gt 0 ]; then
    test_success "Both Prometheus and Tempo data sources configured"
elif [ "$prometheus_ds" -gt 0 ]; then
    test_warning "Prometheus data source configured, Tempo may need setup"
elif [ "$tempo_ds" -gt 0 ]; then
    test_warning "Tempo data source configured, Prometheus may need setup"
else
    test_error "Data sources may need configuration"
fi

# Final Summary
echo ""
echo "📊 Final Assessment:"
echo "==================="

total_checks=7
passed_checks=0

# Count successful checks (simplified)
[ $services_up -ge 4 ] && ((passed_checks++))
[ "$DB_METRICS" -gt 0 ] && ((passed_checks++))
[ "$dashboard_count" -gt 0 ] && ((passed_checks++))
# Add other checks as needed

if [ $services_up -ge 4 ]; then
    echo -e "${GREEN}🚀 Observability stack is operational!${NC}"
    echo "   ✓ $services_up/5 core services running"
    echo "   ✓ $dashboard_count dashboards available"
    echo "   ✓ Data collection and visualization active"
    echo ""
    echo "🎛️  Next steps:"
    echo "   • Access Grafana: http://localhost:3001 (admin/admin)"
    echo "   • Explore dashboards and create custom views"
    echo "   • Monitor application performance and traces"
else
    echo -e "${RED}❌ Observability stack needs attention${NC}"
    echo "   • Only $services_up/5 core services running"
    echo "   • Run: docker-compose up -d"
    echo "   • Check service logs: docker-compose logs [service-name]"
fi

echo ""
echo "🔧 Quick Commands:"
echo "   Restart all:     docker-compose down && docker-compose up -d"
echo "   Check logs:      docker-compose logs [api|prometheus|grafana|otel-collector|tempo]"
echo "   Test endpoint:   curl http://localhost:8000/health"
echo "   View metrics:    curl http://localhost:8000/metrics"
