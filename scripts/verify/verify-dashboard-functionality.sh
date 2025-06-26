#!/bin/bash

# Dashboard functionality test - generate traffic and verify metrics
echo "📊 Dashboard Functionality Test"
echo "==============================="
echo "This script will:"
echo "1. Generate API traffic to create metrics data"
echo "2. Verify metrics are being collected"
echo "3. Test dashboard queries"
echo

# Set proper token
# Load common test functions
source "$(dirname "$0")/../common/common-test-functions.sh"

# Setup test environment
if ! setup_test_environment; then
    exit 1
fi

# Function to make API calls
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    if [ -n "$data" ]; then
        curl -s -X "$method" \
             -H "Content-Type: application/json" \
             -H "Authorization: Bearer $TEST_JWT_TOKEN" \
             -d "$data" \
             "$API_BASE_URL$endpoint" > /dev/null
    else
        curl -s -X "$method" \
             -H "Authorization: Bearer $TEST_JWT_TOKEN" \
             "$API_BASE_URL$endpoint" > /dev/null
    fi
}

echo "🔄 Step 1: Generating API traffic..."
echo "Calling various endpoints to create metrics data..."

for i in {1..10}; do
    echo -n "."
    # Get todos
    api_call GET "/todos/"
    # Get column settings
    api_call GET "/column-settings/"
    # Create a todo
    api_call POST "/todos/" '{"title":"Test Todo '$i'","description":"Test description","is_completed":false}'
    # Update column settings
    api_call PUT "/column-settings/" '{"columns_config":"{}","column_order":"[]"}'
    sleep 0.5
done

echo
echo "✅ Generated API traffic"

echo
echo "🔍 Step 2: Verifying metrics collection..."

# Check if metrics are available
echo "Checking http_requests_total metric:"
requests_metric=$(curl -s "http://localhost:9090/api/v1/query?query=http_requests_total" | grep -o '"result":\[[^]]*\]' | grep -c "metric")
echo "Found $requests_metric different request metrics"

echo "Checking http_request_duration_highr_seconds_bucket metric:"
duration_metric=$(curl -s "http://localhost:9090/api/v1/query?query=http_request_duration_highr_seconds_bucket" | grep -o '"result":\[[^]]*\]' | grep -c "metric")
echo "Found $duration_metric duration bucket metrics"

if [ "$requests_metric" -gt 0 ] && [ "$duration_metric" -gt 0 ]; then
    echo "✅ Metrics are being collected successfully"
else
    echo "❌ Issue with metrics collection"
    echo "   Requests metric count: $requests_metric"
    echo "   Duration metric count: $duration_metric"
fi

echo
echo "📈 Step 3: Testing dashboard queries..."

# Test the main dashboard queries
echo "Testing API Request Rate query:"
rate_query="rate(http_requests_total[5m])"
rate_result=$(curl -s "http://localhost:9090/api/v1/query?query=$(echo $rate_query | sed 's/ /%20/g')")
rate_count=$(echo "$rate_result" | grep -o '"value":\[[^]]*\]' | wc -l)
echo "Rate query returned $rate_count data points"

echo "Testing API Response Time query:"
duration_query="histogram_quantile(0.95, rate(http_request_duration_highr_seconds_bucket[5m]))"
duration_result=$(curl -s "http://localhost:9090/api/v1/query?query=$(echo $duration_query | sed 's/ /%20/g;s/(/%28/g;s/)/%29/g;s/,/%2C/g')")
duration_count=$(echo "$duration_result" | grep -o '"value":\[[^]]*\]' | wc -l)
echo "Duration query returned $duration_count data points"

echo "Testing Total Request Rate query:"
total_rate_query="sum(rate(http_requests_total[5m]))"
total_result=$(curl -s "http://localhost:9090/api/v1/query?query=$(echo $total_rate_query | sed 's/ /%20/g;s/(/%28/g;s/)/%29/g')")
total_count=$(echo "$total_result" | grep -o '"value":\[[^]]*\]' | wc -l)
echo "Total rate query returned $total_count data points"

echo "Testing Error Rate query:"
error_query="rate(http_requests_total{status=~\"5..\"}[5m]) / rate(http_requests_total[5m])"
error_result=$(curl -s "http://localhost:9090/api/v1/query?query=$(echo $error_query | sed 's/ /%20/g;s/(/%28/g;s/)/%29/g;s/{/%7B/g;s/}/%7D/g;s/~/%7E/g;s/"/%22/g')")
error_count=$(echo "$error_result" | grep -o '"value":\[[^]]*\]' | wc -l)
echo "Error rate query returned $error_count data points"

if [ "$rate_count" -gt 0 ] && [ "$duration_count" -gt 0 ] && [ "$total_count" -gt 0 ]; then
    echo "✅ All dashboard queries are working"
else
    echo "⚠️  Some dashboard queries may have issues"
    echo "   Rate query: $rate_count results"
    echo "   Duration query: $duration_count results"  
    echo "   Total query: $total_count results"
    echo "   Error query: $error_count results"
fi

echo
echo "🌐 Dashboard URLs:"
echo "=================="
echo "Main API Metrics Dashboard: http://localhost:3001/d/api-metrics-dashboard"
echo "Grafana Home: http://localhost:3001"
echo "All Dashboards: http://localhost:3001/dashboards"
echo
echo "Login credentials:"
echo "Username: admin"
echo "Password: admin"
echo
echo "💡 The dashboard should now show real data!"
echo "   Refresh the dashboard to see the metrics from the traffic we just generated."
echo
echo "🎯 Expected Dashboard Panels:"
echo "1. API Request Rate - Line graph showing requests/second by method and handler"
echo "2. API Response Time - Line graph showing 95th and 50th percentile response times"
echo "3. Total Request Rate - Single stat showing overall request rate"
echo "4. Error Rate - Single stat showing error percentage"
echo "5. Requests by HTTP Method - Pie chart breaking down by HTTP method"
echo "6. API Endpoints Summary - Table showing all endpoints with their metrics"

echo
echo "Test completed! 🎉"
