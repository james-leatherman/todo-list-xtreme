#!/bin/bash

# Common functions for loading environment variables and JWT tokens
# Source this file in other scripts to avoid hardcoding JWT tokens

# Function to load environment variables from .env.development.local
load_test_environment() {
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local env_file="$script_dir/../.env.development.local"
    
    if [ -f "$env_file" ]; then
        echo "📝 Loading environment variables from .env.development.local..."
        
        # Export variables from .env.development.local
        while IFS= read -r line; do
            # Skip comments and empty lines
            if [[ "$line" =~ ^[[:space:]]*# ]] || [[ -z "$line" ]]; then
                continue
            fi
            
            # Export valid variable assignments
            if [[ "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]]; then
                export "$line"
            fi
        done < "$env_file"
        
        echo "✅ Environment variables loaded"
        return 0
    else
        echo "❌ Error: .env.development.local not found at $env_file"
        echo "💡 Please run: python3 scripts/generate-test-jwt-token.py"
        return 1
    fi
}

# Function to get and validate JWT token
get_test_jwt_token() {
    if [ -z "$TEST_JWT_TOKEN" ]; then
        echo "❌ Error: TEST_JWT_TOKEN not found in environment!"
        echo "💡 Please run: python3 scripts/generate-test-jwt-token.py"
        return 1
    fi
    
    echo "$TEST_JWT_TOKEN"
    return 0
}

# Function to check if JWT token is expired (basic check)
check_jwt_token_expiry() {
    local token="$1"
    if [ -z "$token" ]; then
        echo "❌ Error: No token provided"
        return 1
    fi
    
    # Extract expiry from JWT payload (basic base64 decode)
    local payload=$(echo "$token" | cut -d'.' -f2)
    
    # Add padding if needed for base64 decode
    local padding=$((4 - ${#payload} % 4))
    if [ $padding -ne 4 ]; then
        payload="${payload}$(printf '=%.0s' $(seq 1 $padding))"
    fi
    
    # Try to decode and check expiry (if jq is available)
    if command -v jq >/dev/null 2>&1; then
        local exp=$(echo "$payload" | base64 -d 2>/dev/null | jq -r '.exp' 2>/dev/null)
        local now=$(date +%s)
        
        if [ "$exp" != "null" ] && [ "$exp" -gt 0 ] && [ "$now" -gt "$exp" ]; then
            echo "⚠️  Warning: JWT token appears to be expired"
            echo "💡 Please run: python3 scripts/generate-test-jwt-token.py"
            return 1
        fi
    fi
    
    return 0
}

# Function to make authenticated API calls
api_call() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local base_url="${API_BASE_URL:-http://localhost:8000}"
    
    if [ -z "$TEST_JWT_TOKEN" ]; then
        echo "❌ Error: TEST_JWT_TOKEN not available"
        return 1
    fi
    
    if [ -n "$data" ]; then
        curl -s -X "$method" \
             -H "Content-Type: application/json" \
             -H "Authorization: Bearer $TEST_JWT_TOKEN" \
             -d "$data" \
             "$base_url$endpoint"
    else
        curl -s -X "$method" \
             -H "Authorization: Bearer $TEST_JWT_TOKEN" \
             "$base_url$endpoint"
    fi
}

# Function to setup test environment (load env vars and validate token)
setup_test_environment() {
    if ! load_test_environment; then
        return 1
    fi
    
    local token
    if ! token=$(get_test_jwt_token); then
        return 1
    fi
    
    check_jwt_token_expiry "$token"
    
    # Set commonly used variables
    export API_BASE_URL="${API_BASE_URL:-http://localhost:8000}"
    export FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
    
    echo "🔧 Test environment ready"
    echo "   API Base URL: $API_BASE_URL"
    echo "   Frontend URL: $FRONTEND_URL"
    echo "   Token: ${TEST_JWT_TOKEN:0:50}..."
    
    return 0
}

# Example usage:
# source scripts/common-test-functions.sh
# setup_test_environment || exit 1
# result=$(api_call GET "/column-settings/")
