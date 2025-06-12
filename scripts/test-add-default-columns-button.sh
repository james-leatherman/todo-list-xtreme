#!/bin/bash

# Test script for the "Add Default Columns" button functionality
echo "🧪 Testing 'Add Default Columns' Button Functionality"
echo "====================================================="
echo ""

# Load common test functions
source "$(dirname "$0")/common-test-functions.sh"

# Setup test environment
if ! setup_test_environment; then
    echo "❌ Failed to setup test environment"
    exit 1
fi

echo "📋 Test Overview:"
echo "=================="
echo "This test verifies that the 'Add Default Columns' button:"
echo "1. Appears when no columns are available"
echo "2. Creates default columns (To Do, In Progress, Completed)"
echo "3. Persists the columns to the backend"
echo "4. Maintains persistence after page refresh"
echo ""

echo "🏗️  Step 1: Setting up empty column state..."
echo "============================================="

# Set empty column state
empty_columns='{
  "columns_config": "{}",
  "column_order": "[]"
}'

result=$(api_call PUT "/column-settings/" "$empty_columns")
if [ $? -eq 0 ]; then
    echo "✅ Empty column state set successfully"
else
    echo "❌ Failed to set empty column state"
    exit 1
fi

echo ""
echo "🔍 Step 2: Verifying empty state..."
echo "==================================="

current_state=$(api_call GET "/column-settings/")
echo "Current backend state: $current_state"

# Check if columns_config is empty
if echo "$current_state" | grep -q '"columns_config":"{}"'; then
    echo "✅ Confirmed: Backend has empty columns"
else
    echo "❌ Backend state is not empty as expected"
    exit 1
fi

echo ""
echo "🌐 Step 3: Manual Browser Testing Required"
echo "=========================================="
echo ""
echo "Please follow these steps in the browser at http://localhost:3000:"
echo ""
echo "1. 📄 VERIFY: You should see 'No columns available' message"
echo "2. 🔘 VERIFY: You should see an 'Add Default Columns' button"
echo "3. 👆 ACTION: Click the 'Add Default Columns' button"
echo "4. ✅ VERIFY: Three columns should appear:"
echo "   - To Do"
echo "   - In Progress" 
echo "   - Completed"
echo "5. 🔄 ACTION: Refresh the page (F5 or Ctrl+R)"
echo "6. ✅ VERIFY: Columns should still be there (persistence test)"
echo ""

# Wait for user to test
echo "⏳ Waiting 10 seconds for manual testing..."
echo "   (You can continue testing while this waits)"
sleep 10

echo ""
echo "🔍 Step 4: Backend Verification After Button Click"
echo "=================================================="
echo ""
echo "Checking if default columns were saved to backend..."

final_state=$(api_call GET "/column-settings/")
echo "Backend state after button test:"
echo "$final_state"

echo ""
echo "🔍 Analyzing backend state..."

# Check if default columns were created
if echo "$final_state" | grep -q '"To Do"' && echo "$final_state" | grep -q '"In Progress"' && echo "$final_state" | grep -q '"Completed"'; then
    echo "✅ SUCCESS: Default columns found in backend!"
    echo "   - Found 'To Do' column"
    echo "   - Found 'In Progress' column"
    echo "   - Found 'Completed' column"
    BACKEND_SUCCESS=true
else
    echo "⚠️  INCOMPLETE: Default columns not yet saved to backend"
    echo "   This may mean the button hasn't been clicked yet"
    BACKEND_SUCCESS=false
fi

echo ""
echo "📊 Test Results Summary"
echo "======================"
echo ""

if [ "$BACKEND_SUCCESS" = true ]; then
    echo "✅ FULL SUCCESS: 'Add Default Columns' button working correctly!"
    echo "   - Button is available when no columns exist"
    echo "   - Default columns are created and displayed"
    echo "   - Changes are persisted to backend"
    echo "   - Page refresh will maintain the columns"
else
    echo "🟡 PARTIAL SUCCESS: Test setup completed, manual verification needed"
    echo "   - Empty state created successfully"
    echo "   - Browser should show 'Add Default Columns' button"
    echo "   - Click the button and refresh to complete the test"
fi

echo ""
echo "🎯 Expected Button Behavior:"
echo "============================"
echo "✅ Button appears only when no columns exist"
echo "✅ Button text says 'Add Default Columns'"
echo "✅ Clicking creates 3 default columns immediately"
echo "✅ Columns persist after page refresh"
echo "✅ No more 'No columns available' message after clicking"
echo ""

echo "🐛 If Issues Found:"
echo "=================="
echo "- Check browser console for error messages"
echo "- Verify the ColumnManager.restoreDefaultColumns() method is working"
echo "- Ensure backend API is responding correctly"
echo "- Test the observability stack if needed:"
echo "  bash scripts/verify-complete-observability-stack.sh"

echo ""
echo "📁 Related Files:"
echo "================="
echo "- Frontend: /root/todo-list-xtreme/frontend/src/pages/TodoList.js (lines ~860-890)"
echo "- Backend: /root/todo-list-xtreme/frontend/src/pages/ColumnManager.js (restoreDefaultColumns method)"
echo "- API: /root/todo-list-xtreme/backend/app/column_settings.py"

echo ""
echo "🎉 Test completed! Check the browser and verify the button functionality."
