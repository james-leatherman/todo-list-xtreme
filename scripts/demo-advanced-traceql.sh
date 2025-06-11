#!/bin/bash

# Advanced TraceQL Demonstration Script
# Shows practical TraceQL query examples for real-world observability

set -e

echo "🚀 Advanced TraceQL Queries Demonstration"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Function to execute and explain TraceQL query
demo_traceql_query() {
    local query=$1
    local description=$2
    local explanation=$3
    
    echo -e "${BLUE}📋 Query: $description${NC}"
    echo -e "${PURPLE}TraceQL: $query${NC}"
    echo -e "${YELLOW}Purpose: $explanation${NC}"
    
    # URL encode the query
    encoded_query=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$query'))")
    
    # Execute the query via Tempo API
    response=$(curl -s "http://localhost:3200/api/search?q=$encoded_query&limit=5" || echo "ERROR")
    
    if [[ "$response" == "ERROR" ]]; then
        echo -e "${RED}❌ Query failed${NC}"
        return 1
    fi
    
    # Parse results
    trace_count=$(echo "$response" | grep -o '"traceID"' | wc -l)
    
    if [ "$trace_count" -gt 0 ]; then
        echo -e "${GREEN}✅ Found $trace_count traces${NC}"
        
        # Show trace details
        first_trace=$(echo "$response" | grep -o '"traceID":"[^"]*"' | head -1 | cut -d'"' -f4)
        service_name=$(echo "$response" | grep -o '"rootServiceName":"[^"]*"' | head -1 | cut -d'"' -f4)
        trace_name=$(echo "$response" | grep -o '"rootTraceName":"[^"]*"' | head -1 | cut -d'"' -f4)
        
        echo "   📍 Example: $service_name → $trace_name"
        echo "   🆔 Trace ID: $first_trace"
    else
        echo -e "${YELLOW}⚠️  No traces found for this query${NC}"
    fi
    
    echo ""
    return 0
}

# Function to generate some trace activity
generate_activity() {
    echo -e "${BLUE}🔄 Generating trace activity...${NC}"
    
    # Create various types of requests to generate diverse traces
    curl -s http://localhost:8000/todos/ > /dev/null &
    curl -s http://localhost:8000/health > /dev/null &
    curl -s -X POST http://localhost:8000/todos/ -H "Content-Type: application/json" -d '{"title":"Test TraceQL","completed":false}' > /dev/null &
    
    # Add some delay to create longer traces
    curl -s "http://localhost:8000/todos/?delay=100" > /dev/null &
    
    wait
    sleep 2  # Wait for traces to be ingested
    echo -e "${GREEN}✅ Activity generated${NC}"
    echo ""
}

# Main demonstration
main() {
    echo "This script demonstrates advanced TraceQL queries for practical observability scenarios."
    echo ""
    
    # Generate some activity first
    generate_activity
    
    echo -e "${BLUE}🎯 PERFORMANCE ANALYSIS QUERIES${NC}"
    echo "================================"
    echo ""
    
    # Performance-focused queries
    demo_traceql_query \
        '{ duration > 100ms }' \
        "Find slow requests" \
        "Identify performance bottlenecks by finding traces that take longer than 100ms to complete"
    
    demo_traceql_query \
        '{ duration > 50ms && .service.name = "todo-list-xtreme-api" }' \
        "Find slow API requests" \
        "Focus on API performance issues by filtering slow traces from the backend service"
    
    demo_traceql_query \
        '{ .http.method = "POST" && duration > 10ms }' \
        "Analyze POST request performance" \
        "Check if write operations (POST requests) are performing well"
    
    echo -e "${BLUE}🔍 SERVICE-SPECIFIC ANALYSIS${NC}"
    echo "============================"
    echo ""
    
    # Service analysis queries
    demo_traceql_query \
        '{ .service.name = "todo-list-xtreme-frontend" }' \
        "Frontend service traces" \
        "Analyze all traces originating from the React frontend application"
    
    demo_traceql_query \
        '{ .service.name = "todo-list-xtreme-api" && .http.status_code > 400 }' \
        "API error responses" \
        "Find API requests that returned error status codes (4xx, 5xx)"
    
    demo_traceql_query \
        '{ resource.service.name = "todo-list-xtreme-api" && .http.method = "GET" }' \
        "API read operations" \
        "Analyze all GET requests to understand read patterns and performance"
    
    echo -e "${BLUE}📊 BUSINESS LOGIC ANALYSIS${NC}"
    echo "=========================="
    echo ""
    
    # Business logic queries
    demo_traceql_query \
        '{ name =~ ".*todo.*" }' \
        "Todo-related operations" \
        "Find all traces related to todo operations using regex pattern matching"
    
    demo_traceql_query \
        '{ .http.route = "/todos/" }' \
        "Todo list endpoint analysis" \
        "Analyze performance and usage of the main todo list endpoint"
    
    demo_traceql_query \
        '{ .service.name = "todo-list-xtreme-api" && .http.method = "DELETE" }' \
        "Todo deletion operations" \
        "Track delete operations to understand data modification patterns"
    
    echo -e "${BLUE}🔧 DEBUGGING QUERIES${NC}"
    echo "===================="
    echo ""
    
    # Debugging-focused queries
    demo_traceql_query \
        '{ .status = error }' \
        "Error traces" \
        "Find all traces that ended in an error state for debugging"
    
    demo_traceql_query \
        '{ .http.status_code >= 500 }' \
        "Server errors" \
        "Identify server-side errors (5xx status codes) that need immediate attention"
    
    demo_traceql_query \
        '{ .service.name = "todo-list-xtreme-api" && .db.statement != nil }' \
        "Database operations" \
        "Find traces that include database operations for database performance analysis"
    
    echo -e "${BLUE}📈 METRICS-STYLE QUERIES${NC}"
    echo "======================="
    echo ""
    
    # Note about metrics queries
    echo -e "${YELLOW}Note: The following demonstrate TraceQL metrics syntax (may return empty results without span metrics enabled)${NC}"
    echo ""
    
    # Test a simple metrics query
    echo -e "${PURPLE}Testing metrics query: {} | rate()${NC}"
    metrics_response=$(curl -s "http://localhost:3200/api/metrics/query_range?q=%7B%7D%20%7C%20rate()&start=1749670000&end=1749672000")
    
    if [[ "$metrics_response" == *"series"* ]]; then
        echo -e "${GREEN}✅ Metrics queries are working (no empty ring errors)${NC}"
    else
        echo -e "${YELLOW}⚠️  Metrics queries disabled (this is normal for our configuration)${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}🎉 TraceQL Demonstration Complete!${NC}"
    echo ""
    echo -e "${BLUE}💡 GRAFANA USAGE TIPS:${NC}"
    echo "====================="
    echo "1. Open Grafana at http://localhost:3001 (admin/admin)"
    echo "2. Go to Explore → Select 'Tempo' datasource"
    echo "3. Use the 'TraceQL' query type"
    echo "4. Try any of the queries demonstrated above"
    echo "5. Click on trace IDs to see detailed trace visualization"
    echo ""
    echo -e "${BLUE}🔗 USEFUL TRACEQL PATTERNS:${NC}"
    echo "=========================="
    echo "• Service filtering: { .service.name = \"service-name\" }"
    echo "• Duration filtering: { duration > 100ms }"
    echo "• HTTP status: { .http.status_code >= 400 }"
    echo "• HTTP method: { .http.method = \"POST\" }"
    echo "• Error states: { .status = error }"
    echo "• Regex matching: { name =~ \".*pattern.*\" }"
    echo "• Combined filters: { .service.name = \"api\" && duration > 50ms }"
    echo "• Resource attributes: { resource.service.name = \"service\" }"
    echo ""
    echo -e "${PURPLE}📚 Learn more: https://grafana.com/docs/tempo/latest/traceql/${NC}"
}

# Run the demonstration
main "$@"
