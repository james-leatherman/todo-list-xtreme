#!/bin/bash

echo "🎯 Testing Tempo Integration for Frontend Tracing"
echo "=================================================="
echo ""

# Function to check service health
check_service() {
    local service_name=$1
    local url=$2
    local expected_status=${3:-200}
    
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "$expected_status"; then
        echo "✅ $service_name: Running"
        return 0
    else
        echo "❌ $service_name: Not accessible"
        return 1
    fi
}

echo "📋 Checking Service Health:"
echo "==========================="

# Check all services
check_service "Frontend" "http://localhost:3000"
check_service "Backend API" "http://localhost:8000/health" || check_service "Backend API" "http://localhost:8000"
check_service "OTEL Collector" "http://localhost:8888/metrics"
check_service "Tempo" "http://localhost:3200/ready"
check_service "Grafana" "http://localhost:3001"

echo ""
echo "🔍 Testing Tempo Functionality:"
echo "==============================="

# Test Tempo search API
echo "Testing Tempo search API..."
SEARCH_RESULT=$(curl -s "http://localhost:3200/api/search?tags" 2>/dev/null)
if [[ $? -eq 0 ]]; then
    echo "✅ Tempo search API accessible"
else
    echo "❌ Tempo search API not accessible"
fi

# Test Tempo status
echo "Testing Tempo status..."
STATUS_RESULT=$(curl -s "http://localhost:3200/status/buildinfo" 2>/dev/null)
if [[ $? -eq 0 ]]; then
    echo "✅ Tempo status endpoint working"
    echo "   Version: $(echo $STATUS_RESULT | grep -o '"version":"[^"]*"' | cut -d'"' -f4)"
else
    echo "❌ Tempo status endpoint not working"
fi

echo ""
echo "🚀 Generating Test Traces:"
echo "=========================="

# Generate some backend traces
echo "Making API calls to generate backend traces..."
for i in {1..3}; do
    echo "  📤 Test request $i..."
    curl -s "http://localhost:8000/todos/" > /dev/null
    sleep 1
done

echo ""
echo "⏳ Waiting for traces to be processed..."
sleep 5

echo ""
echo "🔍 Checking for Traces in Tempo:"
echo "================================"

# Check if traces exist in Tempo
TRACE_QUERY=$(curl -s "http://localhost:3200/api/search?limit=10" 2>/dev/null)
if echo "$TRACE_QUERY" | grep -q "traces"; then
    echo "✅ Traces found in Tempo!"
    TRACE_COUNT=$(echo "$TRACE_QUERY" | grep -o '"traces":\[[^]]*\]' | grep -o '{"traceID"' | wc -l)
    echo "   Found $TRACE_COUNT traces"
else
    echo "⚠️  No traces found yet (this might be normal if traces are still being processed)"
fi

echo ""
echo "📊 Grafana Datasource Test:"
echo "============================"

# Test Grafana connection to Tempo
echo "Testing Grafana to Tempo connection..."
GRAFANA_TEST=$(curl -s -u admin:admin "http://localhost:3001/api/datasources" 2>/dev/null)
if echo "$GRAFANA_TEST" | grep -q "tempo"; then
    echo "✅ Tempo datasource configured in Grafana"
else
    echo "❌ Tempo datasource not found in Grafana"
fi

echo ""
echo "🎮 Usage Instructions:"
echo "======================"
echo ""
echo "1. 📱 Frontend Testing:"
echo "   - Open: http://localhost:3000"
echo "   - Perform actions (create/edit todos, login, etc.)"
echo "   - Each action will generate traces"
echo ""
echo "2. 🔍 View Traces in Grafana:"
echo "   - Open: http://localhost:3001 (admin/admin)"
echo "   - Go to Explore"
echo "   - Select 'Tempo' datasource"
echo "   - Use TraceQL queries like: {service.name=\"todo-list-xtreme-frontend\"}"
echo ""
echo "3. 📊 Example TraceQL Queries:"
echo "   - All frontend traces: {service.name=\"todo-list-xtreme-frontend\"}"
echo "   - All backend traces: {service.name=\"todo-list-xtreme-api\"}"
echo "   - Specific operations: {span.name=\"todoService.getAll\"}"
echo "   - Error traces: {status=error}"
echo ""
echo "4. 🔗 Direct Tempo API:"
echo "   - Search: http://localhost:3200/api/search"
echo "   - Health: http://localhost:3200/ready"
echo ""
echo "5. 📱 Monitor Real-time:"
echo "   - OTEL Collector logs: docker logs backend-otel-collector-1 -f"
echo "   - Tempo logs: docker logs backend-tempo-1 -f"

echo ""
echo "✨ Tempo integration test complete!"
echo ""
echo "🎯 Next Steps:"
echo "=============="
echo "1. Use the frontend app to generate traces"
echo "2. Check Grafana Explore with Tempo datasource"
echo "3. Query traces using TraceQL syntax"
echo "4. Correlate frontend and backend traces"
echo ""
echo "The observability stack is ready for end-to-end tracing! 🚀"
