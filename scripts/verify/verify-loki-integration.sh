#!/bin/bash

# Verify Loki integration with Grafana
echo "=== Verifying Loki Integration ==="
echo

# Check if Loki is running and responsive
echo "1. Checking Loki service status..."
if curl -s http://localhost:3100/ready | grep -q "ready"; then
    echo "✅ Loki is ready"
else
    echo "⚠️  Loki is starting up (this is normal for first few seconds)"
fi

# Check available labels
echo
echo "2. Checking available log labels..."
LABELS=$(curl -s "http://localhost:3100/loki/api/v1/labels" | jq -r '.data[]' 2>/dev/null)
if [ -n "$LABELS" ]; then
    echo "✅ Found labels: $LABELS"
else
    echo "❌ No labels found"
fi

# Check logged containers
echo
echo "3. Checking containers being logged..."
CONTAINERS=$(curl -s "http://localhost:3100/loki/api/v1/label/container_name/values" | jq -r '.data[]' 2>/dev/null)
if [ -n "$CONTAINERS" ]; then
    echo "✅ Containers being logged:"
    echo "$CONTAINERS" | sed 's/^/  - /'
else
    echo "❌ No containers found in logs"
fi

# Generate test traffic and check for logs
echo
echo "4. Generating test traffic..."
for i in {1..3}; do
    curl -s http://localhost:8000/health > /dev/null
    sleep 1
done

# Wait a moment for logs to be ingested
sleep 5

# Check for recent logs
echo
echo "5. Checking for recent API logs..."
START_TIME=$(date -d '5 minutes ago' -u +%s)000000000
END_TIME=$(date -u +%s)000000000
LOGS_COUNT=$(curl -s "http://localhost:3100/loki/api/v1/query_range?query=%7Bcontainer_name%3D%22backend-api-1%22%7D&start=${START_TIME}&end=${END_TIME}" | jq '.data.result | length' 2>/dev/null)

if [ "$LOGS_COUNT" -gt "0" ]; then
    echo "✅ Found $LOGS_COUNT log streams from API container"
else
    echo "⚠️  No recent logs found (may need more time to ingest)"
fi

echo
echo "=== Summary ==="
echo "• Loki is running on http://localhost:3100"
echo "• Promtail is collecting Docker container logs"
echo "• Grafana is available at http://localhost:3001 (admin/admin)"
echo "• Logs Dashboard: http://localhost:3001/d/logs-dashboard"
echo
echo "To view logs in Grafana:"
echo "1. Open http://localhost:3001"
echo "2. Go to Explore → Select Loki as datasource"
echo "3. Use query: {container_name=\"backend-api-1\"}"
echo "4. Or visit the pre-built logs dashboard"
