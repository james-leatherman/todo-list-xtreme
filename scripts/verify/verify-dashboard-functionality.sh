#!/bin/bash

# Source common authentication functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../common/common-test-functions.sh"

echo "🧪 Testing Dashboard Functionality"
echo "=================================="

# Get authentication token
if ! get_auth_token; then
    echo -e "${RED}❌ Failed to get authentication token${NC}"
    exit 1
fi

echo "✅ Authentication token loaded: ${AUTH_TOKEN:0:50}..."

# Test dashboard endpoints
echo ""
echo "📊 Testing dashboard endpoints..."

# Test column settings endpoint
echo "Testing column settings..."
RESPONSE=$(make_authenticated_request "GET" "/api/v1/column-settings/")
if [ $? -eq 0 ]; then
    echo "✅ Column settings endpoint working"
else
    echo "❌ Column settings endpoint failed"
fi

# Test tasks endpoint
echo "Testing tasks..."
RESPONSE=$(make_authenticated_request "GET" "/api/v1/tasks/")
if [ $? -eq 0 ]; then
    echo "✅ Tasks endpoint working"
else
    echo "❌ Tasks endpoint failed"
fi

echo ""
echo "🎉 Dashboard functionality test completed!"
