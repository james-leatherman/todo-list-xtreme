#!/bin/bash

# Comprehensive test for column restoration functionality
echo "🧪 Comprehensive Column Restoration Test"
echo "========================================"

# Load common test functions
source "$(dirname "$0")/common-test-functions.sh"

# Setup test environment
if ! setup_test_environment; then
    exit 1
fi

echo "🔄 Setting up empty column state to trigger frontend restoration..."

# Clear all columns to create the problematic state
empty_columns='{
  "columns_config": "{}",
  "column_order": "[]"
}'

result=$(api_call PUT "/column-settings/" "$empty_columns")
echo "✅ Empty column state created"

echo
echo "🌐 MANUAL TEST REQUIRED:"
echo "========================"
echo "1. Open $FRONTEND_URL in a new browser tab/window"
echo "2. Open browser Developer Tools (F12) and go to Console tab"
echo "3. Refresh the page (F5) to load with empty column state"
echo "4. Look for these console messages:"
echo "   - 'All columns deleted, restoring defaults...'"
echo "   - 'Default columns restored successfully'"
echo "5. Verify that you see three default columns: To Do, In Progress, Completed"
echo
echo "Alternative Test (Delete columns manually):"
echo "1. Create some empty columns in the app"
echo "2. Delete them one by one (they must be empty to delete)"
echo "3. When you delete the last column, defaults should restore automatically"
echo
echo "💡 If the test fails, check browser console for errors"
echo "💡 The fix should prevent the 'No columns available' message"

# Verify current state
echo "📋 Current backend state:"
current_state=$(api_call GET "/column-settings/")
echo "$current_state" | jq . 2>/dev/null || echo "$current_state"

echo
echo "🎯 Expected Result: Frontend should detect empty columns and restore defaults"
echo "Test setup complete! 🚀"
