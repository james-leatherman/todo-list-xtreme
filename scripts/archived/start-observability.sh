#!/bin/bash

echo "🔍 Starting Full Observability Stack"
echo "====================================="

cd /root/todo-list-xtreme/backend

echo "1. Starting core observability services..."
docker-compose up -d loki promtail tempo otel-collector prometheus grafana

echo "2. Waiting for services to start..."
sleep 15

echo "3. Checking service health..."
echo "Loki: $(curl -s http://localhost:3100/ready || echo 'NOT READY')"
echo "Prometheus: $(curl -s http://localhost:9090/-/ready || echo 'NOT READY')"
echo "Grafana: $(curl -s http://localhost:3001/api/health | grep -o '"database":"ok"' || echo 'NOT READY')"

echo ""
echo "4. Testing Loki queries..."
echo "Available labels:"
curl -s "http://localhost:3100/loki/api/v1/labels" || echo "Failed to query labels"

echo ""
echo "Available jobs:"
curl -s "http://localhost:3100/loki/api/v1/label/job/values" || echo "Failed to query jobs"

echo ""
echo "5. Generating some API logs for testing..."
source /root/todo-list-xtreme/.env.development.local
curl -s "http://localhost:8000/api/v1/column-settings/" -H "Authorization: Bearer $TEST_JWT_TOKEN" > /dev/null

echo ""
echo "6. Checking recent logs..."
curl -s "http://localhost:3100/loki/api/v1/query_range?query={job=\"todo-api\"}&start=$(date -d '5 minutes ago' --iso-8601)&end=$(date --iso-8601)" | jq '.data.result | length' || echo "No logs found"

echo ""
echo "✅ Observability stack status:"
echo "  - Grafana: http://localhost:3001 (admin/admin)"
echo "  - Loki: http://localhost:3100"
echo "  - Prometheus: http://localhost:9090"
echo "  - If logs are not showing, check promtail logs: docker-compose logs promtail"
