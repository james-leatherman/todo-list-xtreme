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
BACKEND_DIR="${PROJECT_ROOT}/backend"
USE_DOCKER=false

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
    
    # For Docker mode, check if the API container is running
    if [ "$USE_DOCKER" = true ]; then
        cd "${BACKEND_DIR}"
        if ! docker-compose ps api | grep -q "Up"; then
            echo -e "${YELLOW}⚠️  API container is not running, attempting to start it...${NC}"
            docker-compose up -d api
            echo -e "${BLUE}⏳ Waiting for API container to be ready...${NC}"
            sleep 10
            
            if ! docker-compose ps api | grep -q "Up"; then
                echo -e "${RED}❌ Failed to start API container${NC}"
                echo -e "${YELLOW}💡 Check docker-compose logs for details${NC}"
                exit 1
            fi
        fi
        echo -e "${GREEN}✅ API container is running${NC}"
        return 0
    fi
    
    # For non-Docker mode, check direct API access
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

# Function to run a specific k6 test using the unified script
run_test() {
    local test_name=$1
    local test_mode=$2
    
    echo -e "${BLUE}🧪 Running ${test_name}...${NC}"
    echo -e "${BLUE}🎯 Test Mode: ${test_mode}${NC}"
    echo -e "${BLUE}📊 Script: k6-unified-test.js${NC}"
    
    # Check for debug flag
    if [[ "$*" =~ "--debug" ]] || [[ "${DEBUG}" == "true" ]]; then
        echo -e "${YELLOW}🐛 Debug mode enabled - detailed logging will be shown${NC}"
        export DEBUG=true
    fi
    
    echo ""
    # Set environment variables for k6
    export API_URL="${API_URL}"
    export TEST_MODE="${test_mode}"
    
    if [ "$USE_DOCKER" = true ]; then
        echo -e "${BLUE}🐳 Using Docker mode via docker-compose${NC}"
        
        # Create results directory in backend folder if it doesn't exist
        mkdir -p "${BACKEND_DIR}/k6-results"
        chmod 755 "${BACKEND_DIR}/k6-results"
        
        # Change to backend directory to use docker-compose
        cd "${BACKEND_DIR}"
        
        # When using Docker, API URL should point to the API service name for container-to-container communication
        DOCKER_API_URL="http://api:8000"
        echo -e "${BLUE}ℹ️  Using Docker network API URL: ${DOCKER_API_URL}${NC}"
        
        # Run k6 using docker-compose
        docker-compose run --rm \
            --user "$(id -u):$(id -g)" \
            -e AUTH_TOKEN="${AUTH_TOKEN}" \
            -e API_URL="${DOCKER_API_URL}" \
            -e TEST_MODE="${test_mode}" \
            -e DEBUG="${DEBUG:-false}" \
            -e DURATION="${DURATION:-$DEFAULT_DURATION}" \
            -e VUS="${VUS:-$DEFAULT_VUS}" \
            k6 run \
            --summary-trend-stats="avg,min,med,max,p(90),p(95),p(99)" \
            --summary-time-unit=ms \
            /scripts/k6-tests/k6-unified-test.js
    else
        echo -e "${BLUE}🖥️  Using direct k6 execution${NC}"
        
        # Run k6 with experimental Prometheus remote write output
        k6 run \
            --summary-trend-stats="avg,min,med,max,p(90),p(95),p(99)" \
            --summary-time-unit=ms \
            --out experimental-prometheus-rw="http://localhost:9090/api/v1/write" \
            "${SCRIPTS_DIR}/k6-unified-test.js"
    fi
    
    echo ""
    echo -e "${GREEN}✅ ${test_name} completed${NC}"
    echo ""
}

# Function to show usage
show_usage() {
    echo -e "${YELLOW}Usage: $0 [test_type] [options]${NC}"
    echo ""
    echo -e "  ${GREEN}quick${NC}         - Quick smoke test (30s, 2 VUs)"
    echo -e "  ${GREEN}load${NC}          - Load test with stages (4m total)"
    echo -e "  ${GREEN}comprehensive${NC} - Comprehensive feature test (60s, 3 VUs)"
    echo -e "  ${GREEN}stress${NC}        - Stress test with high load (5m total, up to 50 VUs)"
    echo -e "  ${GREEN}all${NC}           - Run all tests sequentially"
    echo ""
    echo -e "${YELLOW}Options:${NC}"
    echo -e "  ${GREEN}--debug${NC}       - Enable debug mode (detailed logging)"
    echo -e "  ${GREEN}--docker${NC}      - Run tests using Docker via docker-compose"
    echo ""
    echo -e "${YELLOW}Environment variables:${NC}"
    echo -e "  ${GREEN}API_URL${NC}      - Base URL for API (default: http://localhost:8000)"
    echo -e "  ${GREEN}DURATION${NC}     - Test duration (default depends on environment)"
    echo -e "  ${GREEN}VUS${NC}          - Number of virtual users (default depends on environment)"
    echo -e "  ${GREEN}AUTH_TOKEN${NC}   - JWT authentication token"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo -e "  $0 quick"
    echo -e "  $0 quick --debug"
    echo -e "  $0 --docker load"
    echo -e "  $0 stress --docker"
    echo -e "  API_URL=http://localhost:8000 $0 stress"
    echo -e "  DURATION=1m VUS=5 $0 --docker quick"
    echo ""
    echo -e "${YELLOW}Note:${NC} All tests now use the unified k6-unified-test.js script"
    echo -e "      with different TEST_MODE configurations for flexibility."
    echo -e "      Docker mode uses the k6 service defined in backend/docker-compose.yml"
    echo ""
}

# Main execution
main() {
    # Parse arguments for flags
    local args=()
    local debug_flag=""
    local docker_flag=""
    
    # Process command line arguments to extract flags
    for arg in "$@"; do
        if [[ "$arg" == "--debug" ]]; then
            export DEBUG=true
            debug_flag="--debug"
            echo -e "${YELLOW}🐛 Debug mode enabled${NC}"
        elif [[ "$arg" == "--docker" ]]; then
            USE_DOCKER=true
            docker_flag="--docker"
            echo -e "${BLUE}🐳 Docker mode enabled - using docker-compose${NC}"
        elif [[ "$arg" != --* ]]; then
            # If not a flag, keep as a positional argument
            args+=("$arg")
        fi
    done
    
    # If docker mode, we don't need to check for local k6 installation
    if [ "$USE_DOCKER" = true ]; then
        if ! command -v docker-compose &> /dev/null; then
            echo -e "${RED}❌ docker-compose is not installed. Please install docker-compose first.${NC}"
            exit 1
        fi
        echo -e "${GREEN}✅ docker-compose is installed${NC}"
    else
        check_k6
    fi
    
    check_api
    generate_token
    
    # Use the first processed positional argument or default to "quick"
    local test_type="${args[0]:-quick}"
    
    case "$test_type" in
        "quick")
            run_test "Quick API Test" "quick" $debug_flag
            ;;
        "load")
            run_test "Load Test" "load" $debug_flag
            ;;
        "comprehensive")
            run_test "Comprehensive Test" "comprehensive" $debug_flag
            ;;
        "concurrent"|"stress")
            run_test "Stress Test" "stress" $debug_flag
            ;;
        "all")
            echo -e "${BLUE}🎯 Running all k6 tests...${NC}"
            echo ""
            run_test "Quick API Test" "quick" $debug_flag
            run_test "Load Test" "load" $debug_flag
            run_test "Comprehensive Test" "comprehensive" $debug_flag
            run_test "Stress Test" "stress" $debug_flag
            echo -e "${GREEN}🎉 All tests completed!${NC}"
            ;;
        "help"|"-h"|"--help")
            show_usage
            ;;
        *)
            echo -e "${RED}❌ Unknown test type: $test_type${NC}"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
