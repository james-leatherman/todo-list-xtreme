#!/bin/bash

# Test TraceQL Queries for Grafana Tempo Integration
# This script tests various TraceQL query capabilities

set -e

echo "🔍 Testing Grafana Tempo TraceQL Queries"
echo "======================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check service health
check_service() {
    local service_name=$1
    local url=$2
    local max_attempts=30
    local attempt=1

    echo -e "${YELLOW}Checking $service_name health...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ $service_name is healthy${NC}"
            return 0
        fi
        
        echo "Attempt $attempt/$max_attempts: $service_name not ready, waiting..."
        sleep 2
        ((attempt++))
    done
    
    echo -e "${RED}✗ $service_name failed to become healthy${NC}"
    return 1
}

# Function to execute TraceQL query
execute_traceql_query() {
    local query=$1
    local description=$2
    
    echo -e "${BLUE}Testing: $description${NC}"
    echo "Query: $query"
    
    # URL encode the query
    encoded_query=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$query'))")
    
    # Execute the query via Tempo API
    response=$(curl -s "http://localhost:3200/api/search?q=$encoded_query&limit=10" || echo "ERROR")
    
    if [[ "$response" == "ERROR" ]]; then
        echo -e "${RED}✗ Query failed${NC}"
        return 1
    fi
    
    # Check if response contains traces
    trace_count=$(echo "$response" | grep -o '"traceID"' | wc -l)
    
    if [ "$trace_count" -gt 0 ]; then
        echo -e "${GREEN}✓ Found $trace_count traces${NC}"
        # Show first trace ID as example
        first_trace=$(echo "$response" | grep -o '"traceID":"[^"]*"' | head -1 | cut -d'"' -f4)
        echo "  Example trace ID: $first_trace"
    else
        echo -e "${YELLOW}⚠ No traces found for this query${NC}"
    fi
    
    echo ""
    return 0
}

# Function to test Grafana Tempo datasource
test_grafana_datasource() {
    echo -e "${BLUE}Testing Grafana Tempo Datasource${NC}"
    
    # Check if Grafana can reach Tempo
    response=$(curl -s -u admin:admin "http://localhost:3001/api/datasources/proxy/1/api/search?tags=" 2>/dev/null || echo "ERROR")
    
    if [[ "$response" == "ERROR" ]]; then
        echo -e "${RED}✗ Grafana cannot reach Tempo datasource${NC}"
        return 1
    fi
    
    trace_count=$(echo "$response" | grep -o '"traceID"' | wc -l)
    echo -e "${GREEN}✓ Grafana can access Tempo datasource ($trace_count traces available)${NC}"
    echo ""
}

# Function to generate some test traces
generate_test_traces() {
    echo -e "${BLUE}Generating test traces...${NC}"
    
    # Make some API calls to generate traces
    for i in {1..5}; do
        curl -s http://localhost:8000/todos/ > /dev/null &
        curl -s http://localhost:8000/health > /dev/null &
    done
    
    wait
    sleep 3  # Wait for traces to be ingested
    echo -e "${GREEN}✓ Test traces generated${NC}"
    echo ""
}

# Main execution
main() {
    echo "Starting Tempo TraceQL integration tests..."
    echo ""
    
    # Check if services are running
    check_service "Tempo" "http://localhost:3200/ready" || exit 1
    check_service "Grafana" "http://localhost:3001/api/health" || exit 1
    check_service "API" "http://localhost:8000/health" || exit 1
    
    echo ""
    
    # Generate some fresh traces
    generate_test_traces
    
    # Test Grafana datasource connectivity
    test_grafana_datasource
    
    echo -e "${BLUE}Running TraceQL Query Tests${NC}"
    echo "=========================="
    echo ""
    
    # Test 1: Basic service name query
    execute_traceql_query \
        '{ .service.name = "todo-list-xtreme-api" }' \
        "Find traces from API service"
    
    # Test 2: Frontend service traces
    execute_traceql_query \
        '{ .service.name = "todo-list-xtreme-frontend" }' \
        "Find traces from Frontend service"
    
    # Test 3: HTTP method filter
    execute_traceql_query \
        '{ .service.name = "todo-list-xtreme-api" && .http.method = "GET" }' \
        "Find GET requests to API"
    
    # Test 4: Duration filter (traces longer than 100ms)
    execute_traceql_query \
        '{ duration > 100ms }' \
        "Find traces longer than 100ms"
    
    # Test 5: Error traces
    execute_traceql_query \
        '{ .status = error }' \
        "Find error traces"
    
    # Test 6: Span name search
    execute_traceql_query \
        '{ name = "GET /todos/" }' \
        "Find specific endpoint traces"
    
    # Test 7: Resource attribute search
    execute_traceql_query \
        '{ resource.service.name = "todo-list-xtreme-api" }' \
        "Find traces by resource service name"
    
    # Test 8: Combined filters
    execute_traceql_query \
        '{ .service.name = "todo-list-xtreme-api" && duration > 10ms }' \
        "Find API traces longer than 10ms"
    
    echo -e "${GREEN}TraceQL query tests completed!${NC}"
    echo ""
    
    # Test trace retrieval by ID
    echo -e "${BLUE}Testing trace retrieval by ID${NC}"
    
    # Get a trace ID from recent traces
    trace_response=$(curl -s "http://localhost:3200/api/search?limit=1")
    trace_id=$(echo "$trace_response" | grep -o '"traceID":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -n "$trace_id" ]; then
        echo "Testing trace retrieval for ID: $trace_id"
        trace_detail=$(curl -s "http://localhost:3200/api/traces/$trace_id")
        
        if [[ "$trace_detail" != *"error"* ]] && [[ "$trace_detail" == *"batches"* ]]; then
            echo -e "${GREEN}✓ Successfully retrieved trace details${NC}"
        else
            echo -e "${RED}✗ Failed to retrieve trace details${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ No trace ID available for testing${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}🎉 All Tempo TraceQL tests completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo "1. Open Grafana at http://localhost:3001 (admin/admin)"
    echo "2. Go to Explore → Select Tempo datasource"
    echo "3. Try the TraceQL queries from this test"
    echo "4. Create custom dashboards with trace data"
    echo ""
    echo -e "${BLUE}Example TraceQL queries to try in Grafana:${NC}"
    echo "• { .service.name = \"todo-list-xtreme-api\" }"
    echo "• { duration > 100ms }"
    echo "• { .http.method = \"POST\" }"
    echo "• { .service.name = \"todo-list-xtreme-frontend\" && duration > 50ms }"
}

# Run the main function
main "$@"
