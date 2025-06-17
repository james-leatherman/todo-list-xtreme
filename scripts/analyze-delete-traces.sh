#!/bin/bash

# Script to explore DELETE traces in Tempo
# Shows comprehensive information about delete operations

set -e

# Load common test functions
source "$(dirname "$0")/common-test-functions.sh"

echo "🗑️  DELETE Traces Analysis"
echo "=========================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Setup test environment
if ! setup_test_environment; then
    echo "❌ Failed to setup test environment"
    exit 1
fi

# Function to analyze delete traces
analyze_delete_traces() {
    echo -e "${BLUE}📊 Searching for DELETE traces...${NC}"
    
    # Search for DELETE method traces
    delete_response=$(curl -s "http://localhost:3200/api/search?q=%7B%20.http.method%20%3D%20%22DELETE%22%20%7D&limit=50" 2>/dev/null || echo "ERROR")
    
    if [[ "$delete_response" == "ERROR" ]]; then
        echo -e "${RED}❌ Failed to query Tempo${NC}"
        return 1
    fi
    
    # Count delete traces
    delete_count=$(echo "$delete_response" | grep -o '"traceID"' | wc -l)
    
    if [ "$delete_count" -eq 0 ]; then
        echo -e "${YELLOW}⚠️  No DELETE traces found${NC}"
        echo ""
        echo -e "${BLUE}💡 Let's generate some delete operations...${NC}"
        generate_delete_traces
        return 0
    fi
    
    echo -e "${GREEN}✅ Found $delete_count DELETE traces${NC}"
    echo ""
    
    # Show delete trace details
    echo -e "${BLUE}🔍 DELETE Trace Details:${NC}"
    echo "========================"
    
    # Parse and display trace information
    local count=1
    echo "$delete_response" | grep -o '"traceID":"[^"]*"' | head -10 | while read -r trace_line; do
        trace_id=$(echo "$trace_line" | cut -d'"' -f4)
        
        # Get service name
        service_line=$(echo "$delete_response" | grep -A5 -B5 "$trace_id" | grep '"rootServiceName"' | head -1)
        service_name=$(echo "$service_line" | cut -d'"' -f4)
        
        # Get trace name
        trace_name_line=$(echo "$delete_response" | grep -A5 -B5 "$trace_id" | grep '"rootTraceName"' | head -1)
        trace_name=$(echo "$trace_name_line" | cut -d'"' -f4)
        
        # Get duration
        duration_line=$(echo "$delete_response" | grep -A5 -B5 "$trace_id" | grep '"durationMs"' | head -1)
        duration=$(echo "$duration_line" | grep -o '[0-9]*' | head -1)
        
        echo -e "${count}. ${PURPLE}Trace ID:${NC} $trace_id"
        echo -e "   ${BLUE}Service:${NC} $service_name"
        echo -e "   ${BLUE}Operation:${NC} $trace_name"
        if [ -n "$duration" ]; then
            echo -e "   ${BLUE}Duration:${NC} ${duration}ms"
        fi
        echo ""
        
        count=$((count + 1))
    done
}

# Function to generate delete traces for testing
generate_delete_traces() {
    echo -e "${BLUE}🔄 Generating DELETE traces...${NC}"
    
    # Get auth token
    TOKEN_RESPONSE=$(curl -s -X POST "http://localhost:8000/auth/token" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "username=testuser&password=testpass" 2>/dev/null)
    
    if [[ "$TOKEN_RESPONSE" == *"access_token"* ]]; then
        TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
        echo -e "${GREEN}✅ Got authentication token${NC}"
    else
        echo -e "${YELLOW}⚠️  Authentication failed, trying to create test user...${NC}"
        # Try to create test user using relative path
        SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
        PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
        cd "$PROJECT_ROOT/backend" && PYTHONPATH="src:$PYTHONPATH" python3 -c "
import sys
sys.path.insert(0, 'src')
from todo_api.utils.create_test_user import create_test_user
create_test_user()
" >/dev/null 2>&1
        TOKEN_RESPONSE=$(curl -s -X POST "http://localhost:8000/auth/token" \
            -H "Content-Type: application/x-www-form-urlencoded" \
            -d "username=testuser&password=testpass" 2>/dev/null)
        TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    fi
    
    if [ -z "$TOKEN" ]; then
        echo -e "${RED}❌ Could not get authentication token${NC}"
        return 1
    fi
    
    # Create and delete some todos
    echo -e "${BLUE}Creating and deleting todos to generate traces...${NC}"
    
    for i in {1..3}; do
        echo -n "  Creating todo $i... "
        
        # Create todo
        CREATE_RESPONSE=$(curl -s -X POST \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "{\"title\":\"Delete Test Todo $i - $(date +%s)\",\"completed\":false}" \
            "http://localhost:8000/todos/" 2>/dev/null)
        
        TODO_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":[0-9]*' | cut -d':' -f2)
        
        if [ -n "$TODO_ID" ]; then
            echo -e "${GREEN}created (ID: $TODO_ID)${NC}"
            echo -n "  Deleting todo $TODO_ID... "
            
            # Delete todo
            DELETE_RESPONSE=$(curl -s -X DELETE \
                -H "Authorization: Bearer $TOKEN" \
                "http://localhost:8000/todos/$TODO_ID" 2>/dev/null)
            
            echo -e "${GREEN}deleted${NC}"
            sleep 1  # Brief pause between operations
        else
            echo -e "${YELLOW}failed to create${NC}"
        fi
    done
    
    echo ""
    echo -e "${GREEN}✅ Generated delete operations, waiting for trace ingestion...${NC}"
    sleep 3
    
    # Re-run the analysis
    echo ""
    analyze_delete_traces
}

# Function to show detailed trace information
show_trace_details() {
    local trace_id=$1
    
    echo -e "${BLUE}🔍 Detailed view of trace: $trace_id${NC}"
    echo "=================================================="
    
    trace_detail=$(curl -s "http://localhost:3200/api/traces/$trace_id" 2>/dev/null)
    
    if [[ "$trace_detail" == *"batches"* ]]; then
        echo -e "${GREEN}✅ Trace retrieved successfully${NC}"
        
        # Extract key information
        echo ""
        echo -e "${PURPLE}Spans in this trace:${NC}"
        span_count=$(echo "$trace_detail" | grep -o '"spanId"' | wc -l)
        echo "Total spans: $span_count"
        
        # Show HTTP method occurrences
        delete_spans=$(echo "$trace_detail" | grep -c '"stringValue":"DELETE"' 2>/dev/null || echo "0")
        echo "DELETE method spans: $delete_spans"
        
        echo ""
        echo -e "${BLUE}💡 You can view this trace in Grafana at:${NC}"
        echo "http://localhost:3001/explore?left=%7B%22queries%22:%5B%7B%22query%22:%22$trace_id%22,%22queryType%22:%22traceID%22%7D%5D,%22datasource%22:%22tempo%22%7D"
    else
        echo -e "${RED}❌ Failed to retrieve trace details${NC}"
    fi
}

# Function to show TraceQL examples for delete operations
show_traceql_examples() {
    echo -e "${PURPLE}📚 TraceQL Examples for DELETE Operations${NC}"
    echo "========================================"
    echo ""
    echo -e "${BLUE}Basic DELETE queries:${NC}"
    echo "• { .http.method = \"DELETE\" }"
    echo "• { .http.method = \"DELETE\" && .service.name = \"todo-list-xtreme-api\" }"
    echo "• { .http.method = \"DELETE\" && duration > 50ms }"
    echo ""
    echo -e "${BLUE}Advanced DELETE analysis:${NC}"
    echo "• { .http.method = \"DELETE\" && .http.status_code >= 400 }"
    echo "• { name =~ \".*DELETE.*\" }"
    echo "• { .http.method = \"DELETE\" && resource.service.name = \"todo-list-xtreme-api\" }"
    echo ""
    echo -e "${BLUE}Try these in Grafana:${NC}"
    echo "1. Go to http://localhost:3001 (admin/admin)"
    echo "2. Navigate to Explore → Select Tempo datasource"
    echo "3. Use TraceQL query type"
    echo "4. Copy and paste any of the queries above"
}

# Main execution
main() {
    echo ""
    
    # Analyze current delete traces
    analyze_delete_traces
    
    echo ""
    
    # Show TraceQL examples
    show_traceql_examples
    
    echo ""
    
    # If traces were found, offer to show details
    delete_response=$(curl -s "http://localhost:3200/api/search?q=%7B%20.http.method%20%3D%20%22DELETE%22%20%7D&limit=5" 2>/dev/null || echo "ERROR")
    
    if [[ "$delete_response" != "ERROR" ]]; then
        first_trace=$(echo "$delete_response" | grep -o '"traceID":"[^"]*"' | head -1 | cut -d'"' -f4)
        
        if [ -n "$first_trace" ]; then
            echo -e "${BLUE}🔍 Showing details for most recent DELETE trace:${NC}"
            echo ""
            show_trace_details "$first_trace"
        fi
    fi
    
    echo ""
    echo -e "${GREEN}🎉 DELETE trace analysis complete!${NC}"
    echo ""
    echo -e "${BLUE}💡 Next steps:${NC}"
    echo "• Use the TraceQL queries above in Grafana"
    echo "• Run this script again to generate more delete traces"
    echo "• Check the frontend app to perform delete operations manually"
}

# Run the analysis
main "$@"
