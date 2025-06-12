#!/bin/bash

# Database Metrics Integration Test
# This script tests all database metrics functionality

set -e

echo "🔍 Database Metrics Integration Test"
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test functions
test_step() {
    echo -e "${YELLOW}$1${NC}"
}

test_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

test_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 1. Check if metrics endpoint is accessible
test_step "1. Checking metrics endpoint availability..."
if curl -s http://localhost:8000/metrics > /dev/null; then
    test_success "Metrics endpoint is accessible"
else
    test_error "Metrics endpoint is not accessible"
    exit 1
fi

# 2. Check database metrics presence
test_step "2. Verifying database metrics are exposed..."
DB_METRICS=$(curl -s http://localhost:8000/metrics | grep -E "^db_" | wc -l)
if [ "$DB_METRICS" -gt 0 ]; then
    test_success "Found $DB_METRICS database metric lines"
else
    test_error "No database metrics found"
    exit 1
fi

# 3. Test connection pool metrics
test_step "3. Testing connection pool metrics..."
CONN_ACTIVE=$(curl -s http://localhost:8000/metrics | grep "db_connections_active" | grep -v "# " | awk '{print $2}')
CONN_TOTAL=$(curl -s http://localhost:8000/metrics | grep "db_connections_total" | grep -v "# " | awk '{print $2}')
CONN_IDLE=$(curl -s http://localhost:8000/metrics | grep "db_connections_idle" | grep -v "# " | awk '{print $2}')

echo "  - Active connections: $CONN_ACTIVE"
echo "  - Total pool size: $CONN_TOTAL" 
echo "  - Idle connections: $CONN_IDLE"

if [[ "$CONN_TOTAL" =~ ^[0-9]+\.?[0-9]*$ ]] && (( $(echo "$CONN_TOTAL > 0" | bc -l) )); then
    test_success "Connection pool metrics are working"
else
    test_error "Connection pool metrics not working properly"
fi

# 4. Generate database activity and measure metrics changes
test_step "4. Testing metrics responsiveness..."
INITIAL_QUERIES=$(curl -s http://localhost:8000/metrics | grep "db_query_duration_seconds_count" | awk '{print $2}')
echo "  - Initial query count: $INITIAL_QUERIES"

# Generate some database activity
echo "  - Generating database activity..."
for i in {1..5}; do
    curl -s http://localhost:8000/db-test > /dev/null
    sleep 0.2
done

# Check if metrics increased
FINAL_QUERIES=$(curl -s http://localhost:8000/metrics | grep "db_query_duration_seconds_count" | awk '{print $2}')
echo "  - Final query count: $FINAL_QUERIES"

if (( $(echo "$FINAL_QUERIES > $INITIAL_QUERIES" | bc -l) )); then
    test_success "Query metrics are incrementing correctly"
else
    test_error "Query metrics are not incrementing"
fi

# 5. Test query operation labeling
test_step "5. Testing query operation labeling..."
SELECT_QUERIES=$(curl -s http://localhost:8000/metrics | grep 'db_query_total{operation="select"}' | awk '{print $2}')
if [[ "$SELECT_QUERIES" =~ ^[0-9]+\.?[0-9]*$ ]] && (( $(echo "$SELECT_QUERIES > 0" | bc -l) )); then
    test_success "Query operation labeling is working (SELECT queries: $SELECT_QUERIES)"
else
    test_error "Query operation labeling not working"
fi

# 6. Test query duration histogram
test_step "6. Testing query duration histogram..."
HISTOGRAM_BUCKETS=$(curl -s http://localhost:8000/metrics | grep "db_query_duration_seconds_bucket" | wc -l)
if [ "$HISTOGRAM_BUCKETS" -gt 0 ]; then
    test_success "Query duration histogram has $HISTOGRAM_BUCKETS buckets"
else
    test_error "Query duration histogram not found"
fi

# 7. Check Grafana dashboard accessibility
test_step "7. Testing Grafana dashboard accessibility..."
if curl -s http://localhost:3000/api/dashboards/uid/database-metrics > /dev/null; then
    test_success "Database metrics dashboard is accessible in Grafana"
else
    echo "  - Database dashboard may not be loaded yet (this is okay)"
fi

if curl -s http://localhost:3000/api/dashboards/uid/api-metrics-dashboard > /dev/null; then
    test_success "API metrics dashboard (with DB panels) is accessible"
else
    test_error "API metrics dashboard not accessible"
fi

# 8. Summary of current metrics
test_step "8. Current Database Metrics Summary:"
echo "=================================="
curl -s http://localhost:8000/metrics | grep -E "^db_" | grep -v "# " | while read line; do
    echo "  $line"
done

echo ""
echo "🎉 Database Metrics Integration Test Complete!"
echo "============================================="
echo ""
echo "📊 View your metrics in Grafana:"
echo "  - Database Metrics Dashboard: http://localhost:3000/d/database-metrics"
echo "  - API Dashboard (with DB panels): http://localhost:3000/d/api-metrics-dashboard"
echo ""
echo "🔗 Metrics endpoint: http://localhost:8000/metrics"
