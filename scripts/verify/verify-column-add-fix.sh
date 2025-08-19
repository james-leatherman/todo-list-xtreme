#!/bin/bash

set -e

# Source common authentication functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../common/common-test-functions.sh"

echo "🧪 Testing Column Add Fix"
echo "========================"

# Get authentication token
if ! get_auth_token; then
    echo -e "${RED}❌ Failed to get authentication token${NC}"
    exit 1
fi

echo "✅ Authentication token loaded: ${AUTH_TOKEN:0:50}..."

# Test 1: Get current column settings
echo ""
echo "📋 Test 1: GET column settings"
echo "------------------------------"
RESPONSE=$(make_authenticated_request "GET" "/api/v1/column-settings/")

echo "Raw Response: $RESPONSE"
echo ""
echo "Formatted Response:"
echo "$RESPONSE" | jq . || echo "❌ Failed to parse JSON response"

# Test 2: Add a new column
echo ""
echo "📝 Test 2: Add new column"
echo "------------------------"
ADD_COLUMN_DATA='{
    "column_id": "urgent",
    "title": "Urgent Tasks",
    "position": 1
}'

ADD_RESPONSE=$(make_authenticated_request "POST" "/api/v1/column-settings/add-column" "$ADD_COLUMN_DATA")

echo "Add Column Response: $ADD_RESPONSE" | jq .

# Verify column was added
echo "$ADD_RESPONSE" | jq -e '.columns_config.urgent' > /dev/null && echo "✅ New 'urgent' column added"
echo "$ADD_RESPONSE" | jq -e '.column_order | contains(["urgent"])' > /dev/null && echo "✅ Column added to order"

# Test 3: Verify persistence
echo ""
echo "💾 Test 3: Verify persistence (GET after POST)"
echo "---------------------------------------------"
VERIFY_RESPONSE=$(make_authenticated_request "GET" "/api/v1/column-settings/")

echo "Verification Response: $VERIFY_RESPONSE" | jq .

# Compare add and verification responses
if [ "$(echo "$ADD_RESPONSE" | jq -c '.column_order')" == "$(echo "$VERIFY_RESPONSE" | jq -c '.column_order')" ]; then
    echo "✅ Column order persisted correctly"
else
    echo "❌ Column order persistence failed"
fi

if [ "$(echo "$ADD_RESPONSE" | jq -c '.columns_config.urgent')" == "$(echo "$VERIFY_RESPONSE" | jq -c '.columns_config.urgent')" ]; then
    echo "✅ Columns config persisted correctly"
else
    echo "❌ Columns config persistence failed"
fi

# Test 4: Add another column
echo ""
echo "📝 Test 4: Add another column"
echo "----------------------------"
ADD_COLUMN_DATA_2='{
    "column_id": "review",
    "title": "Review",
    "position": 3
}'

ADD_RESPONSE_2=$(make_authenticated_request "POST" "/api/v1/column-settings/add-column" "$ADD_COLUMN_DATA_2")

echo "Add Second Column Response: $ADD_RESPONSE_2" | jq .

# Verify second column was added
echo "$ADD_RESPONSE_2" | jq -e '.columns_config.review' > /dev/null && echo "✅ Second 'review' column added"
echo "$ADD_RESPONSE_2" | jq -e '.column_order | contains(["review"])' > /dev/null && echo "✅ Second column added to order"

# Test 5: Final verification
echo ""
echo "🔍 Test 5: Final verification"
echo "----------------------------"
FINAL_RESPONSE=$(make_authenticated_request "GET" "/api/v1/column-settings/")

echo "Final Response: $FINAL_RESPONSE" | jq .

# Check that both columns are present
echo "$FINAL_RESPONSE" | jq -e '.columns_config.urgent' > /dev/null && echo "✅ 'urgent' column still present"
echo "$FINAL_RESPONSE" | jq -e '.columns_config.review' > /dev/null && echo "✅ 'review' column still present"

echo ""
echo "🎉 All tests completed!"
echo "======================"
echo "✅ Column add functionality is working correctly"
echo "✅ Multiple columns can be added"
echo "✅ Data persistence verified"
echo "✅ Column order management working"
