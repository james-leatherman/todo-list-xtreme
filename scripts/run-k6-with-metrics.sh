#!/bin/bash

# Run k6 tests and ensure metrics are pushed to Prometheus via Pushgateway
# This script restarts the observability stack if needed and runs the k6 tests

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPTS_DIR}/.." && pwd)"

echo -e "${BLUE}🚀 K6 Testing with Prometheus Metrics${NC}"
echo -e "${BLUE}=======================================${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Check if observability stack is running
if ! docker ps | grep -q prometheus; then
    echo -e "${YELLOW}⚠️ Prometheus is not running. Starting the observability stack...${NC}"
    cd "${PROJECT_ROOT}/backend"
    docker-compose up -d
    
    # Wait for services to start
    echo -e "${BLUE}⏳ Waiting for services to start (20s)...${NC}"
    sleep 20
fi

# Check if pushgateway is running
if ! docker ps | grep -q pushgateway; then
    echo -e "${RED}❌ Pushgateway is not running. Restart the stack with 'docker-compose down && docker-compose up -d' from the backend directory.${NC}"
    exit 1
fi

# Run the k6 tests
echo -e "${BLUE}🧪 Running k6 tests...${NC}"
cd "${SCRIPTS_DIR}/k6-tests"
./run-k6-tests.sh $@

# Verify that metrics are available in Prometheus
echo -e "${BLUE}🔍 Verifying metrics in Prometheus...${NC}"
METRICS_AVAILABLE=$(curl -s "http://localhost:9090/api/v1/query?query=k6_checks_total" | grep -c "k6_checks_total" || echo "0")
if [ "$METRICS_AVAILABLE" -gt "0" ]; then
    echo -e "${GREEN}✅ k6 metrics are available in Prometheus${NC}"
    echo -e "${GREEN}✅ You can now view the dashboard at: http://localhost:3001/d/k6-load-testing/k6-load-testing-dashboard${NC}"
else
    echo -e "${YELLOW}⚠️ k6 metrics not found in Prometheus yet. They may appear after a short delay.${NC}"
    echo -e "${YELLOW}⚠️ You can check the dashboard at: http://localhost:3001/d/k6-load-testing/k6-load-testing-dashboard${NC}"
fi

echo -e "${BLUE}==========================================${NC}"
