#!/bin/bash

# Generate continuous API traffic for dashboard testing
echo "🚀 Generating continuous API traffic for dashboard testing..."
echo "This will run for 2 minutes to generate enough data for rate calculations"

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZXhwIjoxNzgxMjMwNjk1fQ.H3HJYE7tUBfBmYklv-IMmwGzt-Vf3hdJzM7OuNlV-RI"

# Function to make API calls
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    if [ -n "$data" ]; then
        curl -s -X "$method" \
             -H "Content-Type: application/json" \
             -H "Authorization: Bearer $TOKEN" \
             -d "$data" \
             "http://localhost:8000$endpoint" > /dev/null
    else
        curl -s -X "$method" \
             -H "Authorization: Bearer $TOKEN" \
             "http://localhost:8000$endpoint" > /dev/null
    fi
}

echo "Starting traffic generation... (Press Ctrl+C to stop)"
echo "Each dot represents a batch of API calls"

counter=0
end_time=$(($(date +%s) + 120))  # Run for 2 minutes

while [ $(date +%s) -lt $end_time ]; do
    counter=$((counter + 1))
    echo -n "."
    
    # Mix of API calls
    api_call GET "/todos/"
    api_call GET "/column-settings/"
    api_call GET "/auth/me"
    
    if [ $((counter % 3)) -eq 0 ]; then
        api_call POST "/todos/" '{"title":"Load Test Todo '$counter'","description":"Generated for load testing","is_completed":false}'
    fi
    
    if [ $((counter % 5)) -eq 0 ]; then
        api_call PUT "/column-settings/" '{"columns_config":"{}","column_order":"[]"}'
    fi
    
    if [ $((counter % 10)) -eq 0 ]; then
        echo " [$counter requests sent, $(( end_time - $(date +%s) ))s remaining]"
    fi
    
    sleep 1
done

echo
echo "✅ Traffic generation complete!"
echo "📊 Total API calls made: approximately $((counter * 3)) calls"
echo
echo "🌐 Now check the dashboard at: http://localhost:3001/d/api-metrics-dashboard"
echo "   You should see active metrics in all panels!"

# Quick verification
echo
echo "🔍 Quick metrics verification:"
echo "Current total requests:"
curl -s "http://localhost:9090/api/v1/query?query=http_requests_total" | grep -o '"value":\[[^]]*\]' | head -3
echo
echo "Testing rate calculation (should have data now):"
rate_result=$(curl -s "http://localhost:9090/api/v1/query?query=rate(http_requests_total[1m])")
rate_count=$(echo "$rate_result" | grep -o '"value":\[[^]]*\]' | wc -l)
echo "Rate query now returns $rate_count data points"
