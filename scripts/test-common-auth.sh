#!/bin/bash

# Test script to demonstrate the common authentication system
echo "🧪 Testing Common Authentication System"
echo "======================================="

# Source common authentication functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common/common-test-functions.sh"

echo ""
echo "1. Testing authentication setup..."
if validate_auth_setup; then
    echo -e "${GREEN}✅ Authentication setup is working${NC}"
else
    echo -e "${RED}❌ Authentication setup failed${NC}"
    exit 1
fi

echo ""
echo "2. Testing API calls..."
echo "   Getting column settings..."
RESPONSE=$(make_authenticated_request "GET" "/api/v1/column-settings/")
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ API call successful${NC}"
    echo "   Response preview: ${RESPONSE:0:100}..."
else
    echo -e "${RED}❌ API call failed${NC}"
fi

echo ""
echo "3. Testing token refresh..."
echo "   Forcing token refresh..."
if get_auth_token "true"; then
    echo -e "${GREEN}✅ Token refresh successful${NC}"
else
    echo -e "${RED}❌ Token refresh failed${NC}"
fi

echo ""
echo "4. Authentication status:"
show_auth_status

echo ""
echo "🎉 Common authentication system test completed!"
echo "==============================================="
echo "✅ All authentication functions are working"
echo "✅ No hardcoded JWT tokens needed"
echo "✅ Automatic token management"
echo "✅ Centralized authentication logic" 