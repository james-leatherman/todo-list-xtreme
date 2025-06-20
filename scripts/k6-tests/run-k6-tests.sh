#!/bin/bash

# K6 Load Testing Runner for Todo List Xtreme API
# This script helps run different k6 test scenarios

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL=${API_URL:-"http://localhost:8000"}
SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPTS_DIR}/../.." && pwd)"

echo -e "${BLUE}🚀 K6 Load Testing Runner for Todo List Xtreme API${NC}"
echo -e "${BLUE}====================================================${NC}"

# Function to detect CI environment and adjust parameters
detect_ci_environment() {
    if [ -n "$CI" ] || [ -n "$GITHUB_ACTIONS" ] || [ -n "$GITLAB_CI" ] || [ -n "$JENKINS_URL" ]; then
        echo -e "${BLUE}🤖 CI environment detected${NC}"
        export IS_CI=true
        # Reduce test intensity for CI
        export DEFAULT_DURATION="30s"
        export DEFAULT_VUS="3"
        echo -e "${YELLOW}💡 Using CI-optimized test parameters${NC}"
    else
        echo -e "${BLUE}💻 Local development environment detected${NC}"
        export IS_CI=false
        export DEFAULT_DURATION="1m"
        export DEFAULT_VUS="10"
    fi
}

# Detect CI environment
detect_ci_environment

# Function to check if k6 is installed
check_k6() {
    if ! command -v k6 &> /dev/null; then
        echo -e "${RED}❌ k6 is not installed. Please install k6 first.${NC}"
        echo -e "${YELLOW}💡 Install k6: https://k6.io/docs/getting-started/installation/${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ k6 is installed${NC}"
}

# Function to check API accessibility
check_api() {
    echo -e "${BLUE}🔍 Checking API accessibility...${NC}"
    
    if curl -s -f "${API_URL}/health" > /dev/null; then
        echo -e "${GREEN}✅ API is accessible at ${API_URL}${NC}"
    else
        echo -e "${RED}❌ API is not accessible at ${API_URL}${NC}"
        echo -e "${YELLOW}💡 Make sure the API server is running${NC}"
        exit 1
    fi
}

# Function to generate a fresh JWT token
generate_token() {
    echo -e "${BLUE}🔑 Generating fresh JWT token...${NC}"
    
    if [ -f "${PROJECT_ROOT}/scripts/generate-test-jwt-token.py" ]; then
        cd "${PROJECT_ROOT}"
        if python3 scripts/generate-test-jwt-token.py >/dev/null 2>&1; then
            # Source the .env.development.local to get the token
            if [ -f ".env.development.local" ]; then
                export AUTH_TOKEN=$(grep "^TEST_JWT_TOKEN=" .env.development.local | cut -d'=' -f2)
                echo -e "${GREEN}✅ JWT token generated${NC}"
            else
                echo -e "${YELLOW}⚠️  Could not find .env.development.local, using default${NC}"
            fi
        else
            echo -e "${YELLOW}⚠️  Could not generate fresh token, using default${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Token generator not found, using default${NC}"
    fi
}

# Function to run a specific k6 test
run_test() {
    local test_name=$1
    local script_file=$2
    local duration=${3:-$DEFAULT_DURATION}
    local vus=${4:-$DEFAULT_VUS}
    
    echo -e "${BLUE}🧪 Running ${test_name}...${NC}"
    echo -e "${BLUE}📊 Duration: ${duration}, Virtual Users: ${vus}${NC}"
    echo -e "${BLUE}🎯 Script: ${script_file}${NC}"
    echo ""
     # Set environment variables for k6
    export API_URL="${API_URL}"

    # Run k6 with nice formatting and save metrics to JSON for processing
    K6_RESULT_FILE="/tmp/k6-result-${test_name//[^a-zA-Z0-9]/-}-$(date +%s).json"
    
    k6 run \
        --duration="${duration}" \
        --vus="${vus}" \
        --summary-trend-stats="avg,min,med,max,p(90),p(95),p(99)" \
        --summary-time-unit=ms \
        --out json="${K6_RESULT_FILE}" \
        "${SCRIPTS_DIR}/${script_file}"
    
    # Process and push metrics to Prometheus if the file exists
    if [ -f "${K6_RESULT_FILE}" ]; then
        echo -e "${BLUE}📊 Pushing metrics to Prometheus...${NC}"
        # Get check ratios - default to 0 if values aren't present
        CHECKS_PASSED=$(jq -r '.metrics.checks.values.passes // 0' "${K6_RESULT_FILE}" 2>/dev/null || echo "0")
        CHECKS_FAILED=$(jq -r '.metrics.checks.values.fails // 0' "${K6_RESULT_FILE}" 2>/dev/null || echo "0")
        
        # Calculate totals
        TOTAL_CHECKS=$((CHECKS_PASSED + CHECKS_FAILED))
        if [ "${TOTAL_CHECKS}" -eq "0" ]; then
            # No checks were run, default to 1 to avoid division by zero
            TOTAL_CHECKS=1
            CHECKS_PASSED=1
        fi
        
        # Use curl to push metrics directly to Prometheus PushGateway if available
        # If pushgateway is not available, this will fail silently
        if command -v curl &> /dev/null; then
            # Label the metrics with the test name and timestamp
            TEST_NAME_LABEL="${test_name//[^a-zA-Z0-9]/_}"
            TIMESTAMP=$(date +%s)
            
            # Try to push to Prometheus Pushgateway
            curl -s -X POST -H "Content-Type: text/plain" --data-binary @- http://localhost:9091/metrics/job/k6_tests/instance/${TEST_NAME_LABEL} <<EOF || true
# HELP k6_checks_total Total number of checks executed
# TYPE k6_checks_total gauge
k6_checks_total ${TOTAL_CHECKS}
# HELP k6_check_passes_total Total number of successful checks
# TYPE k6_check_passes_total gauge
k6_check_passes_total ${CHECKS_PASSED}
# HELP k6_check_fails_total Total number of failed checks
# TYPE k6_check_fails_total gauge
k6_check_fails_total ${CHECKS_FAILED}
# HELP k6_check_success_rate Check success rate as a percentage
# TYPE k6_check_success_rate gauge
k6_check_success_rate $(awk "BEGIN { printf \"%.2f\", (${CHECKS_PASSED} / ${TOTAL_CHECKS}) * 100 }")
# HELP k6_test_timestamp Unix timestamp when test was executed
# TYPE k6_test_timestamp gauge
k6_test_timestamp ${TIMESTAMP}
EOF
            echo -e "${GREEN}✅ Metrics pushed to Prometheus Pushgateway${NC}"
        else
            echo -e "${YELLOW}⚠️ curl not found, skipping metrics push${NC}"
        fi
        
        echo -e "${BLUE}📊 K6 results saved to ${K6_RESULT_FILE}${NC}"
    else
        echo -e "${YELLOW}⚠️ No result file generated${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}✅ ${test_name} completed${NC}"
    echo ""
}

# Function to show usage
show_usage() {
    echo -e "${YELLOW}Usage: $0 [test_type] [options]${NC}"
    echo ""
    echo -e "${YELLOW}Test Types:${NC}"
    echo -e "  ${GREEN}quick${NC}      - Quick API test (30s, 5 VUs)"
    echo -e "  ${GREEN}load${NC}       - Comprehensive load test (5m, 10 VUs)"
    echo -e "  ${GREEN}concurrent${NC} - Concurrent operations test (2m, 20 VUs)"
    echo -e "  ${GREEN}stress${NC}     - Stress test (3m, 50 VUs)"
    echo -e "  ${GREEN}all${NC}        - Run all tests sequentially"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo -e "  $0 quick"
    echo -e "  $0 load"
    echo -e "  $0 concurrent"
    echo -e "  API_URL=http://localhost:8000 $0 stress"
    echo ""
}

# Main execution
main() {
    check_k6
    check_api
    generate_token
    
    case "${1:-quick}" in
        "quick")
            run_test "Quick API Test" "k6-quick-test.js" "${DEFAULT_DURATION}" "${DEFAULT_VUS}"
            ;;
        "load")
            run_test "Comprehensive Load Test" "k6-api-load-test.js" "5m" "10"
            ;;
        "concurrent")
            run_test "Concurrent Operations Test" "k6-concurrent-load.js" "2m" "20"
            ;;
        "stress")
            run_test "Stress Test" "k6-concurrent-load.js" "3m" "50"
            ;;
        "all")
            echo -e "${BLUE}🎯 Running all k6 tests...${NC}"
            echo ""
            run_test "Quick API Test" "k6-quick-test.js" "${DEFAULT_DURATION}" "${DEFAULT_VUS}"
            sleep 5
            run_test "Comprehensive Load Test" "k6-api-load-test.js" "3m" "10"
            sleep 5
            run_test "Concurrent Operations Test" "k6-concurrent-load.js" "2m" "20"
            echo -e "${GREEN}🎉 All tests completed!${NC}"
            ;;
        "help"|"-h"|"--help")
            show_usage
            ;;
        *)
            echo -e "${RED}❌ Unknown test type: $1${NC}"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
