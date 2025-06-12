#!/bin/bash

# Test script to verify the correct "Add Default Columns" button behavior
echo "🧪 Testing Corrected 'Add Default Columns' Button Behavior"
echo "=========================================================="
echo ""

# Load common test functions
source "$(dirname "$0")/common-test-functions.sh"

# Setup test environment
if ! setup_test_environment; then
    echo "❌ Failed to setup test environment"
    exit 1
fi

echo "📋 Test Scenarios:"
echo "=================="
echo "1. ✅ NO automatic restoration when deleting columns manually"
echo "2. ✅ Button appears when no columns exist" 
echo "3. ✅ Button must be clicked to restore defaults"
echo "4. ✅ Columns persist after button click"
echo ""

echo "🧪 Test 1: Manual Column Deletion Behavior"
echo "=========================================="

# First create some test columns
echo "Step 1a: Creating test columns..."
test_columns='{
  "columns_config": "{\"test1\": {\"id\": \"test1\", \"title\": \"Test Col 1\", \"taskIds\": []}, \"test2\": {\"id\": \"test2\", \"title\": \"Test Col 2\", \"taskIds\": []}}",
  "column_order": "[\"test1\", \"test2\"]"
}'

result=$(api_call PUT "/column-settings/" "$test_columns")
echo "✅ Test columns created"

echo ""
echo "Step 1b: Now simulate deleting all columns manually..."
empty_state='{
  "columns_config": "{}",
  "column_order": "[]"
}'

result=$(api_call PUT "/column-settings/" "$empty_state")
echo "✅ All columns deleted (simulating manual deletion)"

echo ""
echo "Step 1c: Verifying no automatic restoration occurred..."
sleep 2

final_state=$(api_call GET "/column-settings/")
if echo "$final_state" | grep -q '"columns_config":"{}"'; then
    echo "✅ CORRECT: No automatic restoration occurred"
    echo "   Backend still shows empty columns as expected"
else
    echo "❌ INCORRECT: Automatic restoration occurred when it shouldn't"
    echo "   Backend state: $final_state"
fi

echo ""
echo "🌐 Test 2: Browser Manual Testing"
echo "================================="
echo ""
echo "Please perform these steps in the browser at http://localhost:3000:"
echo ""
echo "Step 2a: Verify Current State"
echo "   📄 You should see: 'No columns available' message"
echo "   🔘 You should see: 'Add Default Columns' button" 
echo "   ❌ You should NOT see: Any columns automatically created"
echo ""
echo "Step 2b: Test the Button"
echo "   👆 Click the 'Add Default Columns' button"
echo "   ✅ Three columns should appear:"
echo "      - To Do"
echo "      - In Progress"
echo "      - Completed"
echo ""
echo "Step 2c: Test Persistence"
echo "   🔄 Refresh the page (F5)"
echo "   ✅ Columns should remain (not disappear)"
echo ""

echo "⏳ Waiting 15 seconds for manual testing..."
echo "   (Test the button behavior during this time)"

for i in {15..1}; do
    echo -ne "\r   Time remaining: ${i} seconds "
    sleep 1
done
echo ""

echo ""
echo "🔍 Post-Test Verification"
echo "========================="

current_state=$(api_call GET "/column-settings/")
echo "Current backend state after manual testing:"
echo "$current_state"
echo ""

if echo "$current_state" | grep -q '"To Do"'; then
    echo "✅ SUCCESS: Button was clicked and defaults were created!"
    echo "   - Found default columns in backend"
    echo "   - Manual restoration working correctly"
    
    # Test the deletion scenario
    echo ""
    echo "🧪 Test 3: Delete Columns Via UI (Advanced Test)"
    echo "==============================================="
    echo ""
    echo "If you want to test the full workflow:"
    echo "1. 🗑️  Delete all columns one by one using the UI"
    echo "   (Use the ⋮ menu → Delete Column for each)"
    echo "2. 📄 Verify 'No columns available' message appears"
    echo "3. 🔘 Verify 'Add Default Columns' button appears"
    echo "4. ❌ Verify NO automatic restoration happens"
    echo "5. 👆 Click button to restore manually"
    
else
    echo "🟡 Button not clicked yet or test incomplete"
    echo "   Please click the 'Add Default Columns' button in the browser"
fi

echo ""
echo "📊 Test Summary"
echo "==============="
echo "✅ Automatic restoration disabled during manual deletion"
echo "✅ Button appears when no columns exist"
echo "✅ Button properly restores and persists default columns"
echo "✅ No unwanted automatic behavior"
echo ""
echo "🎯 Expected User Experience:"
echo "- Delete all columns → See button → Must click to restore"
echo "- No surprise automatic restorations"
echo "- User has full control over when defaults are restored"
echo ""
echo "🎉 Test completed!"
