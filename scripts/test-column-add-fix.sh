#!/bin/bash

set -e

echo "🔧 Testing Column Settings Fix for Frontend Integration"
echo "====================================================="

# Source the JWT token
source .env.development.local

echo "✅ JWT Token loaded: ${TEST_JWT_TOKEN:0:50}..."

# Test 1: Test adding a column as the frontend would (with JSON strings)
echo ""
echo "📋 Test 1: Add column with JSON strings (frontend format)"
echo "--------------------------------------------------------"
RESPONSE=$(curl -s -X PUT "http://localhost:8000/api/v1/column-settings/" \
  -H "Authorization: Bearer $TEST_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "columns_config": "{\"todo\":{\"id\":\"todo\",\"title\":\"To Do\",\"taskIds\":[]},\"inProgress\":{\"id\":\"inProgress\",\"title\":\"In Progress\",\"taskIds\":[]},\"review\":{\"id\":\"review\",\"title\":\"Review\",\"taskIds\":[]},\"done\":{\"id\":\"done\",\"title\":\"Completed\",\"taskIds\":[]}}",
    "column_order": "[\"todo\",\"inProgress\",\"review\",\"done\"]"
  }')

echo "Response: $RESPONSE" | jq .

# Verify response has required fields
if echo "$RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
    echo "✅ ID field present"
else
    echo "❌ ID field missing"
    exit 1
fi

if echo "$RESPONSE" | jq -e '.column_order[] | select(. == "review")' > /dev/null 2>&1; then
    echo "✅ New 'review' column added to order"
else
    echo "❌ 'review' column not found in order"
    exit 1
fi

if echo "$RESPONSE" | jq -e '.columns_config.review' > /dev/null 2>&1; then
    echo "✅ New 'review' column added to config"
else
    echo "❌ 'review' column not found in config"
    exit 1
fi

# Test 2: Test adding another column (simulating frontend adding columns)
echo ""
echo "📝 Test 2: Add another column (urgent)"
echo "-------------------------------------"
UPDATE_RESPONSE=$(curl -s -X PUT "http://localhost:8000/api/v1/column-settings/" \
  -H "Authorization: Bearer $TEST_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "columns_config": "{\"todo\":{\"id\":\"todo\",\"title\":\"To Do\",\"taskIds\":[]},\"urgent\":{\"id\":\"urgent\",\"title\":\"Urgent\",\"taskIds\":[]},\"inProgress\":{\"id\":\"inProgress\",\"title\":\"In Progress\",\"taskIds\":[]},\"review\":{\"id\":\"review\",\"title\":\"Review\",\"taskIds\":[]},\"done\":{\"id\":\"done\",\"title\":\"Completed\",\"taskIds\":[]}}",
    "column_order": "[\"todo\",\"urgent\",\"inProgress\",\"review\",\"done\"]"
  }')

echo "Update Response: $UPDATE_RESPONSE" | jq .

# Verify update worked
if echo "$UPDATE_RESPONSE" | jq -e '.column_order | length == 5' > /dev/null 2>&1; then
    echo "✅ Column order updated (5 columns)"
else
    echo "❌ Column order not updated correctly"
    exit 1
fi

if echo "$UPDATE_RESPONSE" | jq -e '.columns_config.urgent' > /dev/null 2>&1; then
    echo "✅ New 'urgent' column added"
else
    echo "❌ 'urgent' column not added"
    exit 1
fi

# Test 3: Verify persistence by fetching again
echo ""
echo "💾 Test 3: Verify persistence"
echo "-----------------------------"
VERIFY_RESPONSE=$(curl -s -X GET "http://localhost:8000/api/v1/column-settings/" \
  -H "Authorization: Bearer $TEST_JWT_TOKEN" \
  -H "Content-Type: application/json")

echo "Verification Response: $VERIFY_RESPONSE" | jq .

# Compare update and verification responses
if [ "$(echo "$UPDATE_RESPONSE" | jq -c '.column_order')" == "$(echo "$VERIFY_RESPONSE" | jq -c '.column_order')" ]; then
    echo "✅ Column order persisted correctly"
else
    echo "❌ Column order persistence failed"
    exit 1
fi

if [ "$(echo "$UPDATE_RESPONSE" | jq -c '.columns_config.urgent')" == "$(echo "$VERIFY_RESPONSE" | jq -c '.columns_config.urgent')" ]; then
    echo "✅ New columns persisted correctly"
else
    echo "❌ New columns persistence failed"
    exit 1
fi

# Test 4: Test with native objects (ensure backwards compatibility)
echo ""
echo "🔄 Test 4: Test with native objects (backwards compatibility)"
echo "-----------------------------------------------------------"
NATIVE_RESPONSE=$(curl -s -X PUT "http://localhost:8000/api/v1/column-settings/" \
  -H "Authorization: Bearer $TEST_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "columns_config": {
      "todo": {"id": "todo", "title": "To Do", "taskIds": []},
      "blocked": {"id": "blocked", "title": "Blocked", "taskIds": []},
      "done": {"id": "done", "title": "Completed", "taskIds": []}
    },
    "column_order": ["todo", "blocked", "done"]
  }')

echo "Native Objects Response: $NATIVE_RESPONSE" | jq .

if echo "$NATIVE_RESPONSE" | jq -e '.column_order | length == 3' > /dev/null 2>&1; then
    echo "✅ Native objects work correctly"
else
    echo "❌ Native objects not working"
    exit 1
fi

# Test 5: Test mixed format (some JSON strings, some objects)
echo ""
echo "🔀 Test 5: Test mixed format handling"
echo "------------------------------------"
MIXED_RESPONSE=$(curl -s -X PUT "http://localhost:8000/api/v1/column-settings/" \
  -H "Authorization: Bearer $TEST_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "columns_config": {
      "todo": {"id": "todo", "title": "To Do", "taskIds": []},
      "done": {"id": "done", "title": "Completed", "taskIds": []}
    },
    "column_order": "[\"todo\", \"done\"]"
  }')

echo "Mixed Format Response: $MIXED_RESPONSE" | jq .

if echo "$MIXED_RESPONSE" | jq -e '.column_order | length == 2' > /dev/null 2>&1; then
    echo "✅ Mixed format handled correctly"
else
    echo "❌ Mixed format not handled correctly"
    exit 1
fi

echo ""
echo "🎉 All tests passed!"
echo "==================="
echo "✅ Frontend JSON string format works"
echo "✅ Multiple column additions work"
echo "✅ Data persistence confirmed"
echo "✅ Backwards compatibility maintained"
echo "✅ Mixed format handling works"
echo ""
echo "🔧 The 'Failed to save column settings to the server' error is now FIXED!"
echo "Users can now successfully add columns through the frontend."
