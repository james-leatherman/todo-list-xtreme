#!/bin/bash

# Comprehensive Datasource Verification Script
echo "=== Grafana Datasource Verification ==="
echo "Checking all observability datasources..."
echo

# Function to test datasource connectivity
test_datasource() {
    local name=$1
    local url=$2
    local type=$3
    
    echo "Testing $name ($type)..."
    
    case $type in
        "prometheus")
            if curl -s "$url/api/v1/query?query=up" | grep -q "success"; then
                echo "✅ $name is responding correctly"
            else
                echo "❌ $name is not responding properly"
            fi
            ;;
        "loki")
            if curl -s "$url/ready" | grep -q "ready"; then
                echo "✅ $name is ready"
            else
                if curl -s "$url/loki/api/v1/labels" | grep -q "success"; then
                    echo "✅ $name is responding (still warming up)"
                else
                    echo "❌ $name is not responding properly"
                fi
            fi
            ;;
        "tempo")
            if curl -s "$url/api/search" >/dev/null 2>&1; then
                echo "✅ $name is responding"
            else
                echo "❌ $name is not responding properly"
            fi
            ;;
    esac
}

# Test individual services
echo "1. Testing backend services..."
test_datasource "Prometheus" "http://localhost:9090" "prometheus"
test_datasource "Loki" "http://localhost:3100" "loki"
test_datasource "Tempo" "http://localhost:3200" "tempo"

echo
echo "2. Testing Grafana health..."
if curl -s http://localhost:3001/api/health | grep -q "ok"; then
    echo "✅ Grafana is healthy"
else
    echo "❌ Grafana is not responding"
fi

echo
echo "3. Generating test data..."
# Generate some metrics and logs
for i in {1..5}; do
    curl -s http://localhost:8000/health >/dev/null
    curl -s http://localhost:8000/metrics >/dev/null  
    sleep 1
done

echo "✅ Generated test traffic"

echo
echo "4. Testing log ingestion..."
sleep 5  # Wait for logs to be ingested

# Check if logs are being collected
START_TIME=$(date -d '10 minutes ago' -u +%s)000000000
END_TIME=$(date -u +%s)000000000
LOGS_RESULT=$(curl -s "http://localhost:3100/loki/api/v1/query_range?query=%7Bcontainer_name%3D%22backend-api-1%22%7D&start=${START_TIME}&end=${END_TIME}")

if echo "$LOGS_RESULT" | grep -q "backend-api-1"; then
    echo "✅ Logs are being collected from API container"
else
    echo "⚠️  Logs may still be processing"
fi

echo
echo "5. Testing metrics collection..."
METRICS_RESULT=$(curl -s "http://localhost:9090/api/v1/query?query=up{job=\"todo-list-api\"}")

if echo "$METRICS_RESULT" | grep -q "success"; then
    echo "✅ Metrics are being collected"
else
    echo "⚠️  Metrics collection may need more time"
fi

echo
echo "=== Datasource Access Information ==="
echo "🔗 Access Points:"
echo "• Grafana Dashboard: http://localhost:3001"
echo "  Login: admin / admin"
echo "• Prometheus: http://localhost:9090"
echo "• Loki: http://localhost:3100"
echo "• Tempo: http://localhost:3200"
echo
echo "📊 Configured Datasources in Grafana:"
echo "• Prometheus (prometheus-main) - Default datasource for metrics"
echo "• Loki (loki-main) - Log aggregation and search"  
echo "• Tempo (tempo-main) - Distributed tracing"
echo
echo "🔍 How to use:"
echo "1. Open Grafana at http://localhost:3001"
echo "2. Go to 'Explore' to query data directly"
echo "3. Select datasource from dropdown:"
echo "   - Prometheus: Query metrics like 'up', 'http_requests_total'"
echo "   - Loki: Query logs like '{container_name=\"backend-api-1\"}'"
echo "   - Tempo: Search traces by service name or trace ID"
echo "4. Or use pre-built dashboards in 'Dashboards' section"
echo
echo "✨ Features enabled:"
echo "• Log-to-trace correlation (click trace IDs in logs)"
echo "• Trace-to-log correlation (view logs from trace spans)"
echo "• Metrics-to-trace correlation (jump from metrics to traces)"
echo "• Service maps and dependency graphs"
