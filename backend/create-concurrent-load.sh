#!/bin/bash

# Create background load for Prometheus to show concurrent queries
echo "Starting background Prometheus query load..."

# Run expensive queries in background to create concurrent load
curl -s -G "http://localhost:9090/api/v1/query_range" \
    --data-urlencode "query=up" \
    --data-urlencode "start=$(date -d '24 hours ago' +%s)" \
    --data-urlencode "end=$(date +%s)" \
    --data-urlencode "step=60s" &

curl -s -G "http://localhost:9090/api/v1/query_range" \
    --data-urlencode "query=prometheus_tsdb_symbol_table_size_bytes" \
    --data-urlencode "start=$(date -d '12 hours ago' +%s)" \
    --data-urlencode "end=$(date +%s)" \
    --data-urlencode "step=30s" &

curl -s -G "http://localhost:9090/api/v1/query_range" \
    --data-urlencode "query=rate(prometheus_notifications_total[5m])" \
    --data-urlencode "start=$(date -d '6 hours ago' +%s)" \
    --data-urlencode "end=$(date +%s)" \
    --data-urlencode "step=15s" &

# Wait a bit then check concurrent queries
sleep 2
echo "Checking concurrent queries while background load is running:"
curl -s -G "http://localhost:9090/api/v1/query" --data-urlencode "query=prometheus_engine_queries" | jq '.data.result[0].value[1]'

# Wait for background jobs to complete
wait
echo "Background load completed."
