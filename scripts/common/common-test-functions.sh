#!/bin/bash

# Common Authentication Functions for Todo List Xtreme
# This module provides centralized JWT token management for all scripts

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
DEFAULT_API_URL="http://localhost:8000"
DEFAULT_ENV_FILE=".env.development.local"
DEFAULT_TOKEN_GENERATOR="scripts/utils/generate-test-jwt-token.py"

# Global variables
AUTH_TOKEN=""
AUTH_TOKEN_EXPIRY=""
API_URL="${API_URL:-$DEFAULT_API_URL}"
ENV_FILE="${ENV_FILE:-$DEFAULT_ENV_FILE}"
TOKEN_GENERATOR="${TOKEN_GENERATOR:-$DEFAULT_TOKEN_GENERATOR}"

# Function to get the project root directory
get_project_root() {
    # Try to find the project root by looking for key files
    local current_dir="$(pwd)"
    local max_depth=5
    local depth=0
    
    while [ "$depth" -lt "$max_depth" ] && [ "$current_dir" != "/" ]; do
        if [ -f "$current_dir/package.json" ] && [ -f "$current_dir/README.md" ]; then
            echo "$current_dir"
            return 0
        fi
        current_dir="$(dirname "$current_dir")"
        depth=$((depth + 1))
    done
    
    # Fallback to current directory
    echo "$(pwd)"
}

# Function to debug project root discovery (with colors)
debug_project_root() {
    local current_dir="$(pwd)"
    local max_depth=5
    local depth=0
    
    echo -e "${BLUE}🔍 Looking for project root from: $current_dir${NC}"
    
    while [ "$depth" -lt "$max_depth" ] && [ "$current_dir" != "/" ]; do
        if [ -f "$current_dir/package.json" ] && [ -f "$current_dir/README.md" ]; then
            echo -e "${GREEN}✅ Found project root: $current_dir${NC}"
            return 0
        fi
        current_dir="$(dirname "$current_dir")"
        depth=$((depth + 1))
    done
    
    echo -e "${YELLOW}⚠️  Could not find project root, using current directory: $(pwd)${NC}"
}

# Function to load environment variables from .env file
load_env_file() {
    local env_file="$1"
    local project_root="$(get_project_root)"
    local full_path="$project_root/$env_file"
    
    if [ -f "$full_path" ]; then
        echo -e "${BLUE}📁 Loading environment from: $full_path${NC}"
        source "$full_path"
        return 0
    else
        echo -e "${YELLOW}⚠️  Environment file not found: $full_path${NC}"
        return 1
    fi
}

# Function to check if a JWT token is valid
is_token_valid() {
    local token="$1"
    
    if [ -z "$token" ]; then
        return 1
    fi
    
    # Test the token by making a simple API call
    local response=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: Bearer $token" \
        "$API_URL/health" 2>/dev/null)
    
    if [ "$response" = "200" ]; then
        return 0
    else
        return 1
    fi
}

# Function to generate a fresh JWT token
generate_fresh_token() {
    local project_root="$(get_project_root)"
    local generator_path="$project_root/$TOKEN_GENERATOR"
    
    echo -e "${BLUE}🔑 Generating fresh JWT token...${NC}"
    debug_project_root
    echo -e "${BLUE}📁 Project root: $project_root${NC}"
    echo -e "${BLUE}📁 Token generator path: $generator_path${NC}"
    
    if [ ! -f "$generator_path" ]; then
        echo -e "${RED}❌ Token generator not found: $generator_path${NC}"
        echo -e "${YELLOW}💡 Checking if file exists in alternative locations...${NC}"
        
        # Try alternative paths
        local alt_paths=(
            "$project_root/scripts/utils/generate-test-jwt-token.py"
            "$(pwd)/scripts/utils/generate-test-jwt-token.py"
            "$(dirname "$0")/../utils/generate-test-jwt-token.py"
        )
        
        for alt_path in "${alt_paths[@]}"; do
            if [ -f "$alt_path" ]; then
                echo -e "${GREEN}✅ Found token generator at: $alt_path${NC}"
                generator_path="$alt_path"
                break
            fi
        done
        
        if [ ! -f "$generator_path" ]; then
            echo -e "${RED}❌ Token generator not found in any location${NC}"
            return 1
        fi
    fi
    
    # Change to project root and run the generator
    cd "$project_root"
    
    if python3 "$generator_path" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ JWT token generated successfully${NC}"
        
        # Load the new token from the environment file
        if load_env_file "$ENV_FILE"; then
            AUTH_TOKEN="$TEST_JWT_TOKEN"
            echo -e "${GREEN}✅ Token loaded: ${AUTH_TOKEN:0:50}...${NC}"
            return 0
        else
            echo -e "${RED}❌ Failed to load token from environment file${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ Failed to generate JWT token${NC}"
        return 1
    fi
}

# Function to get a valid JWT token (loads existing or generates new)
get_auth_token() {
    local force_refresh="${1:-false}"
    
    # If force refresh is requested, generate a new token
    if [ "$force_refresh" = "true" ]; then
        generate_fresh_token
        return $?
    fi
    
    # Try to load existing token from environment
    if load_env_file "$ENV_FILE" && [ -n "$TEST_JWT_TOKEN" ]; then
        AUTH_TOKEN="$TEST_JWT_TOKEN"
        echo -e "${BLUE}📋 Loaded existing token: ${AUTH_TOKEN:0:50}...${NC}"
        
        # Check if the token is still valid
        if is_token_valid "$AUTH_TOKEN"; then
            echo -e "${GREEN}✅ Token is valid${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠️  Token is expired or invalid, generating fresh token...${NC}"
            generate_fresh_token
            return $?
        fi
    else
        echo -e "${YELLOW}⚠️  No existing token found, generating fresh token...${NC}"
        generate_fresh_token
        return $?
    fi
}

# Function to make authenticated API calls
make_authenticated_request() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local headers="$4"
    
    # Ensure we have a valid token
    if ! get_auth_token; then
        echo -e "${RED}❌ Failed to get authentication token${NC}"
        return 1
    fi
    
    # Build the curl command
    local curl_cmd="curl -s -X $method"
    curl_cmd="$curl_cmd -H 'Authorization: Bearer $AUTH_TOKEN'"
    curl_cmd="$curl_cmd -H 'Content-Type: application/json'"
    
    # Add custom headers if provided
    if [ -n "$headers" ]; then
        curl_cmd="$curl_cmd $headers"
    fi
    
    # Add data if provided
    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -d '$data'"
    fi
    
    # Add the URL
    curl_cmd="$curl_cmd '$API_URL$endpoint'"
    
    # Execute the command
    echo -e "${BLUE}🌐 Making $method request to: $endpoint${NC}"
    eval "$curl_cmd"
}

# Function to test API connectivity
test_api_connectivity() {
    echo -e "${BLUE}🔍 Testing API connectivity...${NC}"
    
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health" 2>/dev/null)
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ API is accessible at $API_URL${NC}"
        return 0
    else
        echo -e "${RED}❌ API is not accessible at $API_URL (HTTP $response)${NC}"
        return 1
    fi
}

# Function to validate authentication setup
validate_auth_setup() {
    echo -e "${BLUE}🔐 Validating authentication setup...${NC}"
    
    # Test API connectivity
    if ! test_api_connectivity; then
        echo -e "${RED}❌ API connectivity test failed${NC}"
        return 1
    fi
    
    # Get a valid token
    if ! get_auth_token; then
        echo -e "${RED}❌ Failed to get authentication token${NC}"
        return 1
    fi
    
    # Test the token with an authenticated endpoint
    local response=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        "$API_URL/api/v1/column-settings/" 2>/dev/null)
    
    if [ "$response" = "200" ] || [ "$response" = "404" ]; then
        echo -e "${GREEN}✅ Authentication setup is valid${NC}"
        return 0
    else
        echo -e "${RED}❌ Authentication test failed (HTTP $response)${NC}"
        return 1
    fi
}

# Function to show authentication status
show_auth_status() {
    echo -e "${BLUE}📊 Authentication Status${NC}"
    echo -e "${BLUE}======================${NC}"
    
    echo -e "API URL: $API_URL"
    echo -e "Environment File: $ENV_FILE"
    echo -e "Token Generator: $TOKEN_GENERATOR"
    
    if [ -n "$AUTH_TOKEN" ]; then
        echo -e "Current Token: ${AUTH_TOKEN:0:50}..."
        if is_token_valid "$AUTH_TOKEN"; then
            echo -e "Token Status: ${GREEN}Valid${NC}"
        else
            echo -e "Token Status: ${RED}Invalid${NC}"
        fi
    else
        echo -e "Current Token: ${YELLOW}None${NC}"
    fi
    
    echo ""
}

# Function to refresh token if needed
refresh_token_if_needed() {
    if [ -z "$AUTH_TOKEN" ] || ! is_token_valid "$AUTH_TOKEN"; then
        echo -e "${YELLOW}🔄 Token needs refresh...${NC}"
        get_auth_token "true"
    fi
}

# Export functions for use in other scripts
export -f get_project_root
export -f load_env_file
export -f is_token_valid
export -f generate_fresh_token
export -f get_auth_token
export -f make_authenticated_request
export -f test_api_connectivity
export -f validate_auth_setup
export -f show_auth_status
export -f refresh_token_if_needed

# Auto-initialize if this script is sourced
if [[ "${BASH_SOURCE[0]}" != "${0}" ]]; then
    echo -e "${GREEN}✅ Common authentication functions loaded${NC}"
    echo -e "${BLUE}💡 Use 'get_auth_token' to get a valid JWT token${NC}"
    echo -e "${BLUE}💡 Use 'make_authenticated_request' for API calls${NC}"
    echo -e "${BLUE}💡 Use 'validate_auth_setup' to test everything${NC}"
fi
