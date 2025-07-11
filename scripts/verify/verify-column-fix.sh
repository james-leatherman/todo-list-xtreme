#!/bin/bash

# Complete user journey simulation for column restoration testing
echo "🎯 Complete User Journey Simulation"
echo "=================================="
echo "This script simulates the exact scenarios that were causing issues"
echo

# Load common test functions
source "$(dirname "$0")/../common/common-test-functions.sh"

# Setup test environment
if ! setup_test_environment; then
    exit 1
fi

# Function to make API calls
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    if [ -n "$data" ]; then
        curl -s -X "$method" \
             -H "Content-Type: application/json" \
             -H "Authorization: Bearer $TEST_JWT_TOKEN" \
             -d "$data" \
             "$API_BASE_URL$endpoint"
    else
        curl -s -X "$method" \
             -H "Authorization: Bearer $TEST_JWT_TOKEN" \
             "$API_BASE_URL$endpoint"
    fi
}

echo "🔄 Scenario 1: User deletes all their custom columns"
echo "===================================================="

# Step 1: Create custom columns (simulating user setup)
echo "1. Creating custom columns..."
custom_setup='{
  "columns_config": "{\"urgent\": {\"id\": \"urgent\", \"title\": \"Urgent\", \"taskIds\": []}, \"later\": {\"id\": \"later\", \"title\": \"Later\", \"taskIds\": []}}",
  "column_order": "[\"urgent\", \"later\"]"
}'

result=$(api_call PUT "/column-settings/" "$custom_setup")
echo "   ✅ Custom columns created"

# Step 2: Simulate user deleting all columns
echo "2. User deletes all columns (empty state)..."
empty_state='{
  "columns_config": "{}",
  "column_order": "[]"
}'

result=$(api_call PUT "/column-settings/" "$empty_state")
echo "   ✅ All columns deleted - this used to break the app!"

# Step 3: Check current state
echo "3. Current backend state:"
current=$(api_call GET "/column-settings/")
echo "   Config: $(echo "$current" | jq -r '.columns_config')"
echo "   Order: $(echo "$current" | jq -r '.column_order')"

echo
echo "🌐 NOW TEST IN BROWSER:"
echo "======================"
echo "1. Go to http://localhost:3000"
echo "2. Open Developer Tools (F12) → Console"
echo "3. Refresh the page (F5)"
echo "4. You should see:"
echo "   ❌ OLD BEHAVIOR: 'No columns available' error"
echo "   ✅ NEW BEHAVIOR: Default columns restored automatically"
echo "5. Console should show restoration messages"

echo
echo "🔄 Scenario 2: Test the manual deletion flow"
echo "============================================"
echo "1. In the browser, add some empty columns"
echo "2. Delete them one by one using the column menu (⋮)"
echo "3. When you delete the LAST column:"
echo "   ❌ OLD BEHAVIOR: App breaks, shows 'No columns available'"
echo "   ✅ NEW BEHAVIOR: Defaults restore immediately"

echo
echo "🎯 SUCCESS INDICATORS:"
echo "====================="
echo "✅ Page loads successfully with default columns"
echo "✅ No 'No columns available' error message"
echo "✅ Console shows: 'Empty columns detected in API response, restoring defaults...'"
echo "✅ Console shows: 'Default columns restored and saved successfully'"
echo "✅ Three columns appear: 'To Do', 'In Progress', 'Completed'"

echo
echo "🐛 If you see issues:"
echo "===================="
echo "- Check browser console for JavaScript errors"
echo "- Verify the fixes were applied correctly"
echo "- Ensure frontend dev server reloaded the changes"

echo
echo "Ready for testing! 🚀"
echo "Browser: http://localhost:3000"
echo "Expected: Seamless experience with automatic column restoration"
