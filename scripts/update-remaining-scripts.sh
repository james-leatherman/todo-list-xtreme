#!/bin/bash

# Script to update all remaining scripts with hardcoded JWT tokens
echo "🔄 Updating all scripts to use environment variables instead of hardcoded JWT tokens"
echo "================================================================================="

# Scripts to update
scripts=(
    "test-column-default-restoration.sh"
    "final-column-restoration-test.sh"
    "test-dashboard-functionality.sh"
)

for script in "${scripts[@]}"; do
    script_path="/root/todo-list-xtreme/scripts/$script"
    
    if [ -f "$script_path" ]; then
        echo "📝 Updating $script..."
        
        # Create backup
        cp "$script_path" "$script_path.backup"
        
        # Replace hardcoded token with environment variable loading
        sed -i 's/TOKEN="eyJ[^"]*"/# Load common test functions\nsource "$(dirname "$0")\/common-test-functions.sh"\n\n# Setup test environment\nif ! setup_test_environment; then\n    exit 1\nfi/' "$script_path"
        
        # Update any remaining TOKEN references to TEST_JWT_TOKEN
        sed -i 's/\$TOKEN/\$TEST_JWT_TOKEN/g' "$script_path"
        
        # Update hardcoded localhost URLs to use environment variables
        sed -i 's/http:\/\/localhost:8000/\$API_BASE_URL/g' "$script_path"
        sed -i 's/http:\/\/localhost:3000/\$FRONTEND_URL/g' "$script_path"
        
        echo "✅ Updated $script"
    else
        echo "⚠️  Script not found: $script"
    fi
done

echo ""
echo "🎯 Summary:"
echo "- Updated scripts to use .env.development.local for JWT tokens"
echo "- Replaced hardcoded URLs with environment variables"
echo "- Created backups with .backup extension"
echo ""
echo "💡 To refresh JWT token: python3 scripts/generate-test-jwt-token.py"
echo "🧪 Test any script: ./scripts/[script-name].sh"
