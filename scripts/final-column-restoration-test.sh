#!/bin/bash

# Final comprehensive test for column default restoration functionality
echo "🔬 Final Column Default Restoration Test"
echo "========================================"
echo "Testing both scenarios:"
echo "1. Loading with empty columns (from backend)"
echo "2. Deleting all columns manually (frontend logic)"
echo

# Set proper token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZXhwIjoxNzgxMjMwNjk1fQ.H3HJYE7tUBfBmYklv-IMmwGzt-Vf3hdJzM7OuNlV-RI"

# Function to make API calls
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    if [ -n "$data" ]; then
        curl -s -X "$method" \
             -H "Content-Type: application/json" \
             -H "Authorization: Bearer $TOKEN" \
             -d "$data" \
             "http://localhost:8000$endpoint"
    else
        curl -s -X "$method" \
             -H "Authorization: Bearer $TOKEN" \
             "http://localhost:8000$endpoint"
    fi
}

echo "📋 Test 1: Load Restoration (Backend Empty State)"
echo "================================================"

# Set empty state
empty_columns='{
  "columns_config": "{}",
  "column_order": "[]"
}'

result=$(api_call PUT "/column-settings/" "$empty_columns")
echo "✅ Empty column state set in backend"

echo
echo "🔄 Wait 2 seconds then check if defaults were restored..."
sleep 2

current_state=$(api_call GET "/column-settings/")
echo "Current state after potential restoration:"
echo "$current_state" | jq . 2>/dev/null || echo "$current_state"

# Check if defaults were restored
if echo "$current_state" | grep -q "To Do" && echo "$current_state" | grep -q "In Progress" && echo "$current_state" | grep -q "Completed"; then
    echo "✅ SUCCESS: Defaults appear to be restored!"
else
    echo "⚠️  Defaults not yet restored - this will happen when frontend loads"
fi

echo
echo "📋 Test 2: Manual Test Instructions"  
echo "=================================="
echo "🌐 BROWSER TEST REQUIRED:"
echo
echo "TEST A - Load Restoration:"
echo "1. Open http://localhost:3000 in browser"
echo "2. Open Developer Tools (F12) → Console tab"
echo "3. Refresh page (F5)"
echo "4. Look for console messages:"
echo "   - 'Empty columns detected in API response, restoring defaults...'"
echo "   - 'Default columns restored and saved successfully'"
echo "5. Verify you see: To Do, In Progress, Completed columns"
echo
echo "TEST B - Delete Restoration:"
echo "1. Add some empty columns (use 'Add Column' button)"
echo "2. Delete columns one by one (⋮ menu → Delete Column)"
echo "3. When deleting the LAST column, watch console for:"
echo "   - 'All columns deleted, restoring defaults...'"
echo "   - 'Default columns restored successfully'"
echo "4. Verify defaults appear immediately"
echo

echo "📊 Backend State Verification:"
echo "============================="
current_state=$(api_call GET "/column-settings/")
echo "$current_state" | jq -r '.columns_config' 2>/dev/null | jq . 2>/dev/null || echo "Raw state: $current_state"

echo
echo "🎯 SUCCESS CRITERIA:"
echo "==================="
echo "✅ Load restoration: Page loads with default columns (no 'No columns available' message)"
echo "✅ Delete restoration: Last column deletion triggers immediate default restoration"
echo "✅ Console logging: Clear messages indicating when restoration occurs"
echo "✅ Backend persistence: Restored defaults are saved to backend"
echo

echo "Test setup complete! 🚀"
echo "Ready for manual browser testing at http://localhost:3000"
