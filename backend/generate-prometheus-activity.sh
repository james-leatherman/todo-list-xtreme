#!/bin/bash

# Generate continuous Prometheus query activity to populate internal metrics
echo "Generating Prometheus query activity..."

# Run for 2 minutes with various queries
end_time=$(($(date +%s) + 120))

query_count=0
while [ $(date +%s) -lt $end_time ]; do
    # Basic instant queries
    curl -s -G "http://localhost:9090/api/v1/query" --data-urlencode "query=up" > /dev/null
    curl -s -G "http://localhost:9090/api/v1/query" --data-urlencode "query=prometheus_engine_queries" > /dev/null
    curl -s -G "http://localhost:9090/api/v1/query" --data-urlencode "query=prometheus_tsdb_symbol_table_size_bytes" > /dev/null
    
    # Range queries (more expensive)
    curl -s -G "http://localhost:9090/api/v1/query_range" \
        --data-urlencode "query=up" \
        --data-urlencode "start=$(date -d '1 hour ago' --iso-8601)" \
        --data-urlencode "end=$(date --iso-8601)" \
        --data-urlencode "step=60s" > /dev/null
    
    curl -s -G "http://localhost:9090/api/v1/query_range" \
        --data-urlencode "query=rate(prometheus_engine_queries[5m])" \
        --data-urlencode "start=$(date -d '30 minutes ago' --iso-8601)" \
        --data-urlencode "end=$(date --iso-8601)" \
        --data-urlencode "step=30s" > /dev/null
    
    # Complex aggregation queries
    curl -s -G "http://localhost:9090/api/v1/query" --data-urlencode "query=sum(rate(prometheus_engine_queries[5m])) by (job)" > /dev/null
    curl -s -G "http://localhost:9090/api/v1/query" --data-urlencode "query=histogram_quantile(0.95, rate(prometheus_engine_query_duration_seconds_bucket[5m]))" > /dev/null
    
    query_count=$((query_count + 7))
    echo -ne "\rQueries sent: $query_count"
    
    sleep 0.5
done

echo -e "\nDone! Sent $query_count queries total."
echo "Check Grafana dashboard for updated metrics."
