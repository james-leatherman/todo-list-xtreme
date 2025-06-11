#!/bin/bash

# Grafana Tempo Integration - Quick Status Check
# Shows current status and provides next steps

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}🎯 Grafana Tempo Integration - Status Check${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""

# Function to check service health
check_service() {
    local service_name=$1
    local url=$2
    local expected_content=$3
    
    echo -n "Checking $service_name... "
    
    if response=$(curl -s -f "$url" 2>/dev/null); then
        if [[ -z "$expected_content" ]] || [[ "$response" == *"$expected_content"* ]]; then
            echo -e "${GREEN}✅ HEALTHY${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠️  PARTIAL${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ DOWN${NC}"
        return 1
    fi
}

# Check all services
echo -e "${BLUE}📊 Service Health Status${NC}"
echo "========================"

check_service "Tempo" "http://localhost:3200/ready" || tempo_down=1
check_service "Grafana" "http://localhost:3001/api/health" || grafana_down=1
check_service "OTEL Collector" "http://localhost:8888/metrics" || collector_down=1
check_service "Prometheus" "http://localhost:9090/-/healthy" || prometheus_down=1
check_service "API Backend" "http://localhost:8000/health" || api_down=1

echo ""

# Check trace functionality
echo -e "${BLUE}🔍 Trace Functionality${NC}"
echo "======================"

echo -n "Testing TraceQL queries... "
if response=$(curl -s "http://localhost:3200/api/search?q=%7B%7D&limit=3" 2>/dev/null); then
    trace_count=$(echo "$response" | grep -o '"traceID"' | wc -l)
    if [ "$trace_count" -gt 0 ]; then
        echo -e "${GREEN}✅ WORKING ($trace_count traces found)${NC}"
        traceql_working=1
    else
        echo -e "${YELLOW}⚠️  NO TRACES${NC}"
    fi
else
    echo -e "${RED}❌ FAILED${NC}"
fi

echo -n "Testing metrics queries... "
if response=$(curl -s "http://localhost:3200/api/metrics/query_range?q=%7B%7D%20%7C%20rate()&start=1749670000&end=1749672000" 2>/dev/null); then
    if [[ "$response" == *"series"* ]] && [[ "$response" != *"empty ring"* ]]; then
        echo -e "${GREEN}✅ WORKING (no empty ring errors)${NC}"
        metrics_working=1
    else
        echo -e "${YELLOW}⚠️  LIMITED${NC}"
    fi
else
    echo -e "${RED}❌ FAILED${NC}"
fi

echo -n "Testing Grafana → Tempo connection... "
if response=$(curl -s -u admin:admin "http://localhost:3001/api/datasources/proxy/1/api/search?tags=" 2>/dev/null); then
    if [[ "$response" == *"traces"* ]]; then
        echo -e "${GREEN}✅ CONNECTED${NC}"
        grafana_tempo_connected=1
    else
        echo -e "${YELLOW}⚠️  PARTIAL${NC}"
    fi
else
    echo -e "${RED}❌ FAILED${NC}"
fi

echo ""

# Show integration status
echo -e "${BLUE}📈 Integration Status${NC}"
echo "===================="

# Reset variables to ensure clean evaluation
tempo_status="ok"
grafana_status="ok" 
traceql_status="ok"
metrics_status="ok"
grafana_tempo_status="ok"

# Check if any services are down
[[ -n "$tempo_down" ]] && tempo_status="down"
[[ -n "$grafana_down" ]] && grafana_status="down"
[[ "$traceql_working" != "1" ]] && traceql_status="down"
[[ "$metrics_working" != "1" ]] && metrics_status="down"
[[ "$grafana_tempo_connected" != "1" ]] && grafana_tempo_status="down"

if [[ "$tempo_status" == "ok" ]] && [[ "$grafana_status" == "ok" ]] && [[ "$traceql_status" == "ok" ]] && [[ "$metrics_status" == "ok" ]] && [[ "$grafana_tempo_status" == "ok" ]]; then
    echo -e "${GREEN}🎉 FULLY OPERATIONAL${NC}"
    echo -e "${GREEN}   All services running and integrated successfully${NC}"
    echo -e "${GREEN}   TraceQL queries working without 'empty ring' errors${NC}"
    echo -e "${GREEN}   Grafana can access Tempo datasource${NC}"
    integration_status="complete"
else
    echo -e "${YELLOW}⚠️  PARTIAL OPERATION${NC}"
    echo -e "${YELLOW}   Some services may need attention${NC}"
    integration_status="partial"
fi

echo ""

# Show current trace statistics
echo -e "${BLUE}📊 Current Trace Statistics${NC}"
echo "=========================="

if [[ "$traceql_working" == "1" ]]; then
    # Get trace counts by service
    api_traces=$(curl -s "http://localhost:3200/api/search?q=%7B%20.service.name%20%3D%20%22todo-list-xtreme-api%22%20%7D&limit=100" 2>/dev/null | grep -o '"traceID"' | wc -l)
    frontend_traces=$(curl -s "http://localhost:3200/api/search?q=%7B%20.service.name%20%3D%20%22todo-list-xtreme-frontend%22%20%7D&limit=100" 2>/dev/null | grep -o '"traceID"' | wc -l)
    slow_traces=$(curl -s "http://localhost:3200/api/search?q=%7B%20duration%20%3E%20100ms%20%7D&limit=100" 2>/dev/null | grep -o '"traceID"' | wc -l)
    
    echo "• API Service Traces: $api_traces"
    echo "• Frontend Service Traces: $frontend_traces"
    echo "• Slow Traces (>100ms): $slow_traces"
else
    echo "• Unable to retrieve trace statistics"
fi

echo ""

# Show next steps
echo -e "${CYAN}🚀 What You Can Do Now${NC}"
echo "======================"

if [[ "$integration_status" == "complete" ]]; then
    echo -e "${GREEN}✨ Ready for Advanced Usage!${NC}"
    echo ""
    echo -e "1. ${BLUE}Explore Grafana Interface:${NC}"
    echo "   • Open: http://localhost:3001 (admin/admin)"
    echo "   • Go to Explore → Select 'Tempo' datasource"
    echo "   • Try TraceQL queries like: { .service.name = \"todo-list-xtreme-api\" }"
    echo ""
    echo -e "2. ${BLUE}Run Demonstration Scripts:${NC}"
    echo "   • Basic tests: ./scripts/test-traceql-queries.sh"
    echo "   • Advanced demos: ./scripts/demo-advanced-traceql.sh"
    echo "   • Full integration test: ./scripts/test-tempo-final.sh"
    echo ""
    echo -e "3. ${BLUE}Create Custom Dashboards:${NC}"
    echo "   • Performance monitoring dashboards"
    echo "   • Error tracking and alerting"
    echo "   • Service topology visualization"
    echo ""
    echo -e "4. ${BLUE}Useful TraceQL Patterns:${NC}"
    echo "   • Find slow requests: { duration > 100ms }"
    echo "   • Filter by HTTP method: { .http.method = \"POST\" }"
    echo "   • Error analysis: { .http.status_code >= 400 }"
    echo "   • Service-specific: { .service.name = \"service-name\" }"
else
    echo -e "${YELLOW}🔧 Troubleshooting Steps:${NC}"
    echo ""
    echo -e "1. ${BLUE}Check Service Logs:${NC}"
    echo "   • docker-compose logs tempo --tail=20"
    echo "   • docker-compose logs grafana --tail=20"
    echo ""
    echo -e "2. ${BLUE}Restart Services:${NC}"
    echo "   • docker-compose restart tempo grafana"
    echo ""
    echo -e "3. ${BLUE}Verify Configuration:${NC}"
    echo "   • Check tempo.yml for correct settings"
    echo "   • Verify Grafana datasource configuration"
fi

echo ""

# Show documentation
echo -e "${PURPLE}📚 Documentation Available${NC}"
echo "=========================="
echo "• TEMPO_INTEGRATION_FINAL_REPORT.md - Complete status and capabilities"
echo "• TEMPO_EMPTY_RING_FIX.md - Details on the empty ring error fix"
echo "• TEMPO_INTEGRATION_COMPLETE.md - Original integration guide"
echo ""

# Show support information
echo -e "${CYAN}💡 Need Help?${NC}"
echo "============"
echo "• All integration scripts are in the 'scripts/' directory"
echo "• Configuration files are in 'backend/' directory"
echo "• Check the detailed documentation files for troubleshooting"
echo ""

if [[ "$integration_status" == "complete" ]]; then
    echo -e "${GREEN}🎉 Tempo Integration Complete - Happy Tracing! 🕵️‍♂️${NC}"
else
    echo -e "${YELLOW}⚠️  Integration needs attention - check logs and restart services${NC}"
fi

echo ""
