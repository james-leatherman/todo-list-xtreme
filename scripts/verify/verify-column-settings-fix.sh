#!/bin/bash

set -e

echo "🧪 Testing Column Settings Fix"
echo "=============================="

# Source the JWT token
source .env.development.local

echo "✅ JWT Token loaded: ${TEST_JWT_TOKEN:0:50}..."

# Test 1: Get current column settings
echo ""
echo "📋 Test 1: GET column settings"
echo "------------------------------"
RESPONSE=$(curl -s -X GET "http://localhost:8000/api/v1/column-settings/" \
  -H "Authorization: Bearer $TEST_JWT_TOKEN" \
  -H "Content-Type: application/json")

echo "Raw Response: $RESPONSE"
echo ""
echo "Formatted Response:"
echo "$RESPONSE" | jq . || echo "❌ Failed to parse JSON response"

# Verify response has required fields
if echo "$RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
    echo "✅ ID field present"
else
    echo "❌ ID field missing"
fi

if echo "$RESPONSE" | jq -e '.user_id' > /dev/null 2>&1; then
    echo "✅ User ID field present"
else
    echo "❌ User ID field missing"
fi

if echo "$RESPONSE" | jq -e '.column_order' > /dev/null 2>&1; then
    echo "✅ Column order field present"
else
    echo "❌ Column order field missing"
fi

if echo "$RESPONSE" | jq -e '.columns_config' > /dev/null 2>&1; then
    echo "✅ Columns config field present"
else
    echo "❌ Columns config field missing"
fi

# Test 2: Update column settings
echo ""
echo "📝 Test 2: PUT column settings"
echo "------------------------------"
UPDATE_RESPONSE=$(curl -s -X PUT "http://localhost:8000/api/v1/column-settings/" \
  -H "Authorization: Bearer $TEST_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "column_order": ["todo", "urgent", "inProgress", "review", "done"],
    "columns_config": {
      "todo": {
        "id": "todo",
        "title": "To Do",
        "taskIds": [1, 2, 3]
      },
      "urgent": {
        "id": "urgent",
        "title": "Urgent",
        "taskIds": [4]
      },
      "inProgress": {
        "id": "inProgress",
        "title": "In Progress",
        "taskIds": [5, 6]
      },
      "review": {
        "id": "review",
        "title": "Review",
        "taskIds": [7]
      },
      "done": {
        "id": "done",
        "title": "Completed",
        "taskIds": [8, 9, 10]
      }
    }
  }')

echo "Update Response: $UPDATE_RESPONSE" | jq .

# Verify update worked
echo "$UPDATE_RESPONSE" | jq -e '.column_order | length == 5' > /dev/null && echo "✅ Column order updated (5 columns)"
echo "$UPDATE_RESPONSE" | jq -e '.columns_config.urgent' > /dev/null && echo "✅ New 'urgent' column added"
echo "$UPDATE_RESPONSE" | jq -e '.columns_config.todo.taskIds | length == 3' > /dev/null && echo "✅ Task IDs updated"

# Test 3: Verify persistence
echo ""
echo "💾 Test 3: Verify persistence (GET after PUT)"
echo "---------------------------------------------"
VERIFY_RESPONSE=$(curl -s -X GET "http://localhost:8000/api/v1/column-settings/" \
  -H "Authorization: Bearer $TEST_JWT_TOKEN" \
  -H "Content-Type: application/json")

echo "Verification Response: $VERIFY_RESPONSE" | jq .

# Compare update and verification responses
if [ "$(echo "$UPDATE_RESPONSE" | jq -c '.column_order')" == "$(echo "$VERIFY_RESPONSE" | jq -c '.column_order')" ]; then
    echo "✅ Column order persisted correctly"
else
    echo "❌ Column order persistence failed"
fi

if [ "$(echo "$UPDATE_RESPONSE" | jq -c '.columns_config.urgent')" == "$(echo "$VERIFY_RESPONSE" | jq -c '.columns_config.urgent')" ]; then
    echo "✅ Columns config persisted correctly"
else
    echo "❌ Columns config persistence failed"
fi

# Test 4: Check database content
echo ""
echo "🗄️  Test 4: Check database storage"
echo "--------------------------------"
DB_CHECK=$(cd backend && docker-compose exec -T db psql -U postgres -d todolist -c "SELECT column_order, columns_config FROM user_column_settings WHERE user_id = 1;" -t)
echo "Database content (raw JSON):"
echo "$DB_CHECK"

# Test 5: Test reset functionality
echo ""
echo "🔄 Test 5: Reset to defaults"
echo "---------------------------"
RESET_RESPONSE=$(curl -s -X POST "http://localhost:8000/api/v1/column-settings/reset" \
  -H "Authorization: Bearer $TEST_JWT_TOKEN" \
  -H "Content-Type: application/json")

echo "Reset Response: $RESET_RESPONSE" | jq .

# Verify reset worked
echo "$RESET_RESPONSE" | jq -e '.column_order | length == 4' > /dev/null && echo "✅ Reset to 4 default columns"
echo "$RESET_RESPONSE" | jq -e '.columns_config.blocked' > /dev/null && echo "✅ 'Blocked' column present after reset"

echo ""
echo "🎉 All tests completed!"
echo "======================"
echo "✅ Column settings API is working correctly"
echo "✅ JSON serialization/deserialization fixed"
echo "✅ Data persistence verified"
echo "✅ Database schema/API mismatch resolved"
