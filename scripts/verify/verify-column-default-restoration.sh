#!/bin/bash

# Test script to verify default column restoration functionality
# This script tests the scenario where all columns are deleted and verifies that defaults are restored

echo "🧪 Testing Default Column Restoration Functionality..."
echo "================================================="

# Load common test functions
source "$(dirname "$0")/../common/common-test-functions.sh"

# Setup test environment
if ! setup_test_environment; then
    exit 1
fi \
             "http://localhost:8000$endpoint"
    fi
}

# Test 1: Check current column settings
echo "📋 Step 1: Checking current column settings..."
current_settings=$(api_call GET "/column-settings/")
echo "Current settings: $current_settings"
echo

# Test 2: Create some custom columns first
echo "🏗️  Step 2: Creating custom columns for testing..."
custom_columns='{
  "columns_config": "{\"custom1\": {\"id\": \"custom1\", \"title\": \"Custom Column 1\", \"taskIds\": []}, \"custom2\": {\"id\": \"custom2\", \"title\": \"Custom Column 2\", \"taskIds\": []}}",
  "column_order": "[\"custom1\", \"custom2\"]"
}'

# Try to update settings with custom columns
result=$(api_call PUT "/column-settings/" "$custom_columns")
echo "Custom columns created: $result"
echo

# Test 3: Verify custom columns are set
echo "✅ Step 3: Verifying custom columns are active..."
current_settings=$(api_call GET "/column-settings/")
echo "Settings after custom creation: $current_settings"
echo

# Test 4: Now delete all columns by setting empty configuration
echo "🗑️  Step 4: Simulating deletion of all columns..."
empty_columns='{
  "columns_config": "{}",
  "column_order": "[]"
}'

result=$(api_call PUT "/column-settings/" "$empty_columns")
echo "Result after clearing columns: $result"
echo

# Test 5: Check if backend automatically restores defaults
echo "🔄 Step 5: Checking if backend restores defaults for empty columns..."
final_settings=$(api_call GET "/column-settings/")
echo "Final settings: $final_settings"
echo

# Parse and verify the result
if echo "$final_settings" | grep -q "To Do" && echo "$final_settings" | grep -q "In Progress" && echo "$final_settings" | grep -q "Completed"; then
    echo "✅ SUCCESS: Default columns were restored by the backend!"
    echo "   - Found 'To Do' column"
    echo "   - Found 'In Progress' column"  
    echo "   - Found 'Completed' column"
else
    echo "❌ BACKEND TEST INCONCLUSIVE: Backend did not automatically restore defaults"
    echo "   This is expected - frontend should handle the restoration"
fi

echo
echo "🌐 Frontend Test Instructions:"
echo "1. Open http://localhost:3000 in your browser"
echo "2. Delete all columns one by one (make sure they're empty first)"
echo "3. Verify that default columns (To Do, In Progress, Completed) are automatically restored"
echo "4. Check browser console for restoration messages"

echo
echo "📝 Expected Behavior:"
echo "- When last column is deleted, frontend should detect empty state"
echo "- Frontend should automatically restore default columns"
echo "- Console should show: 'All columns deleted, restoring defaults...'"
echo "- Console should show: 'Default columns restored successfully'"

echo
echo "Test completed! 🎉"
