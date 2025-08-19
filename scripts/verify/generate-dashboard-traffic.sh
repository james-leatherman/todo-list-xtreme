#!/bin/bash

# Source common authentication functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../common/common-test-functions.sh"

echo "🚀 Generating Dashboard Traffic"
echo "=============================="

# Get authentication token
if ! get_auth_token; then
    echo -e "${RED}❌ Failed to get authentication token${NC}"
    exit 1
fi

echo "✅ Authentication token loaded: ${AUTH_TOKEN:0:50}..."

# Generate traffic for 30 seconds
echo "🔄 Generating traffic for 30 seconds..."
end_time=$((SECONDS + 30))

while [ $SECONDS -lt $end_time ]; do
    # Get column settings
    make_authenticated_request "GET" "/api/v1/column-settings/" > /dev/null 2>&1
    
    # Get tasks
    make_authenticated_request "GET" "/api/v1/tasks/" > /dev/null 2>&1
    
    # Small delay between requests
    sleep 0.5
done

echo "✅ Traffic generation completed!"
