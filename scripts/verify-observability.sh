#!/bin/bash

# 🔍 Observability Stack Verification Script
# This script checks the status of all observability components and data flow

set -e

echo "🚀 Observability Stack Verification"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper function for colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "OK") echo -e "${GREEN}✅ $message${NC}" ;;
        "WARN") echo -e "${YELLOW}⚠️  $message${NC}" ;;
        "ERROR") echo -e "${RED}❌ $message${NC}" ;;
        "INFO") echo -e "${BLUE}ℹ️  $message${NC}" ;;
    esac
}

# Check if all containers are running
echo ""
echo "📋 Container Status:"
echo "-------------------"
if docker-compose -f backend/docker-compose.yml ps --format "table {{.Service}}\t{{.Status}}" | grep -q "Up"; then
    container_count=$(docker-compose -f backend/docker-compose.yml ps --services | wc -l)
    running_count=$(docker-compose -f backend/docker-compose.yml ps --format "{{.Service}}" --filter "status=running" | wc -l)
    
    if [ "$container_count" -eq "$running_count" ]; then
        print_status "OK" "All $running_count containers are running"
    else
        print_status "WARN" "$running_count/$container_count containers are running"
    fi
else
    print_status "ERROR" "Some containers are not running"
    exit 1
fi

# Check individual service health
echo ""
echo "🏥 Service Health Checks:"
echo "------------------------"

# Check API
if curl -s http://localhost:8000/health > /dev/null; then
    print_status "OK" "FastAPI service is healthy"
else
    print_status "ERROR" "FastAPI service is not responding"
fi

# Check Grafana
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/login | grep -q "200"; then
    print_status "OK" "Grafana is accessible"
else
    print_status "ERROR" "Grafana is not accessible"
fi

# Check Prometheus
if curl -s http://localhost:9090/-/ready | grep -q "Prometheus is Ready"; then
    print_status "OK" "Prometheus is ready"
else
    print_status "WARN" "Prometheus readiness check failed"
fi

# Check Loki
loki_status=$(curl -s http://localhost:3100/ready)
if echo "$loki_status" | grep -q "ready"; then
    if echo "$loki_status" | grep -q "Ingester not ready"; then
        print_status "WARN" "Loki is ready but ingester is warming up"
    else
        print_status "OK" "Loki is fully ready"
    fi
else
    print_status "ERROR" "Loki is not ready"
fi

# Check Tempo
tempo_status=$(curl -s http://localhost:3200/ready)
if echo "$tempo_status" | grep -q "ready"; then
    if echo "$tempo_status" | grep -q "Ingester not ready"; then
        print_status "WARN" "Tempo is ready but ingester is warming up"
    else
        print_status "OK" "Tempo is fully ready"
    fi
else
    print_status "ERROR" "Tempo is not ready"
fi

# Check metrics availability
echo ""
echo "📊 Metrics Verification:"
echo "-----------------------"

# Check if Prometheus can scrape targets
targets_up=$(curl -s "http://localhost:9090/api/v1/query?query=up" | jq -r '.data.result | length')
if [ "$targets_up" -gt 0 ]; then
    print_status "OK" "$targets_up Prometheus targets are up"
    
    # Show targets
    curl -s "http://localhost:9090/api/v1/query?query=up" | jq -r '.data.result[] | "  - \(.metric.job): \(.metric.instance)"'
else
    print_status "ERROR" "No Prometheus targets are up"
fi

# Check specific application metrics
echo ""
print_status "INFO" "Checking application metrics..."

# Database connections
db_connections=$(curl -s "http://localhost:9090/api/v1/query?query=db_connections_active" | jq -r '.data.result[0].value[1] // "0"')
if [ "$db_connections" != "0" ]; then
    print_status "OK" "Database connections metric available: $db_connections"
else
    print_status "WARN" "Database connections metric not available"
fi

# HTTP requests
http_requests=$(curl -s "http://localhost:9090/api/v1/query?query=sum(http_requests_total)" | jq -r '.data.result[0].value[1] // "0"')
if [ "$http_requests" != "0" ]; then
    print_status "OK" "HTTP requests metric available: $http_requests total requests"
else
    print_status "WARN" "HTTP requests metric not available"
fi

# Check logs availability
echo ""
echo "📝 Logs Verification:"
echo "--------------------"

# Wait a moment for Loki ingester
sleep 2

# Check if labels exist
labels_response=$(curl -s "http://localhost:3100/loki/api/v1/labels" | jq -r '.data // []')
if [ "$labels_response" != "[]" ] && [ "$labels_response" != "null" ]; then
    label_count=$(echo "$labels_response" | jq '. | length')
    print_status "OK" "Loki has $label_count labels available"
    echo "$labels_response" | jq -r '.[] | "  - " + .'
else
    print_status "WARN" "Loki labels not yet available (ingester may still be warming up)"
fi

# Check traces availability  
echo ""
echo "🔍 Traces Verification:"
echo "----------------------"

# Check for recent traces
trace_response=$(curl -s "http://localhost:3200/api/search?tags=")
if echo "$trace_response" | jq -e '.traces | length > 0' > /dev/null 2>&1; then
    trace_count=$(echo "$trace_response" | jq '.traces | length')
    print_status "OK" "Found $trace_count traces in Tempo"
    
    # Show some trace details
    echo "  Recent traces:"
    echo "$trace_response" | jq -r '.traces[0:3][] | "  - \(.rootTraceName) (\(.durationMs)ms)"' 2>/dev/null || echo "  - Multiple traces available"
else
    print_status "WARN" "No traces found in Tempo (may still be ingesting)"
fi

# Dashboard verification
echo ""
echo "📈 Dashboard Links:"
echo "------------------"
print_status "INFO" "Grafana Dashboards:"
echo "  🌐 http://localhost:3001 (admin/admin)"
echo "  📊 Application Overview"
echo "  📊 Database Metrics" 
echo "  📊 Comprehensive Loki Dashboard"
echo "  📊 Comprehensive Tempo Dashboard"
echo "  📊 Distributed Tracing Explorer"
echo "  📊 Prometheus Monitoring Combined"

echo ""
print_status "INFO" "Direct Access:"
echo "  📊 Prometheus: http://localhost:9090"
echo "  📝 Loki: http://localhost:3100"
echo "  🔍 Tempo: http://localhost:3200"

echo ""
print_status "INFO" "Verification completed!"
echo "💡 If Loki/Tempo show warnings, wait 1-2 minutes for ingesters to fully initialize."
