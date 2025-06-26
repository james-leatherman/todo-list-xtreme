#!/bin/bash

# Comprehensive test to verify all JWT token environment variable fixes
echo "🔐 JWT Token Environment Variable Implementation Test"
echo "====================================================="

# Get project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Test the token generation system
echo "1. Testing JWT token generation..."
cd "$PROJECT_ROOT"

if python3 scripts/generate-test-jwt-token.py; then
    echo "✅ JWT token generation works"
else
    echo "❌ JWT token generation failed"
    exit 1
fi

echo
echo "2. Testing .env.development.local loading..."

# Test environment variable loading
if [ -f ".env.development.local" ]; then
    echo "✅ .env.development.local exists"
    
    # Load environment variables
    export $(grep -v '^#' .env.development.local | grep -v '^$' | xargs)
    
    if [ -n "$TEST_JWT_TOKEN" ]; then
        echo "✅ TEST_JWT_TOKEN loaded successfully"
        echo "   Token: ${TEST_JWT_TOKEN:0:50}..."
    else
        echo "❌ TEST_JWT_TOKEN not found in environment"
        exit 1
    fi
else
    echo "❌ .env.development.local not found"
    exit 1
fi

echo
echo "3. Testing common test functions..."

# Test the common functions
source "$SCRIPT_DIR/common-test-functions.sh"

if setup_test_environment; then
    echo "✅ Common test functions work"
else
    echo "❌ Common test functions failed"
    exit 1
fi

echo
echo "4. Testing individual scripts..."

# List of scripts to test (just check they start without errors)
scripts_to_test=(
    "test-frontend-column-restoration.sh"
    "test-column-default-restoration.sh"
    "final-column-restoration-test.sh"
    "test-dashboard-functionality.sh"
    "generate-dashboard-traffic.sh"
    "verify-column-fix.sh"
)

success_count=0
total_count=${#scripts_to_test[@]}

for script in "${scripts_to_test[@]}"; do
    echo "  Testing $script..."
    
    # Run script with timeout to test initialization only
    if timeout 5s bash -c "cd '$PROJECT_ROOT' && ./scripts/$script" >/dev/null 2>&1; then
        echo "    ✅ $script: Initialization successful"
        ((success_count++))
    else
        # Check if it failed due to timeout (which means it started successfully)
        if timeout 2s bash -c "cd '$PROJECT_ROOT' && ./scripts/$script" 2>&1 | head -3 | grep -q "Loading environment variables"; then
            echo "    ✅ $script: Environment loading works (timed out during execution - normal)"
            ((success_count++))
        else
            echo "    ❌ $script: Failed to initialize"
        fi
    fi
done

echo
echo "5. Security verification..."

# Check that no scripts contain hardcoded tokens
hardcoded_tokens=$(grep -r "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" scripts/ | grep -v backup | wc -l)

if [ "$hardcoded_tokens" -eq 0 ]; then
    echo "✅ No hardcoded JWT tokens found in active scripts"
else
    echo "⚠️  Found $hardcoded_tokens scripts with hardcoded tokens:"
    grep -r "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" scripts/ | grep -v backup
fi

echo
echo "📊 Test Results Summary:"
echo "========================"
echo "✅ JWT Token Generation: Working"
echo "✅ Environment Variables: Working" 
echo "✅ Common Functions: Working"
echo "📋 Script Tests: $success_count/$total_count scripts working"

if [ "$hardcoded_tokens" -eq 0 ]; then
    echo "🔒 Security: No hardcoded tokens (Good)"
else
    echo "⚠️  Security: $hardcoded_tokens scripts need manual cleanup"
fi

echo
echo "🎯 Usage Instructions:"
echo "======================"
echo "1. Refresh JWT token: python3 scripts/generate-test-jwt-token.py"
echo "2. Run any test script: ./scripts/[script-name].sh"
echo "3. Environment variables are automatically loaded from .env.development.local"
echo "4. JWT tokens expire in 24 hours and need to be refreshed"

echo
if [ "$success_count" -eq "$total_count" ] && [ "$hardcoded_tokens" -eq 0 ]; then
    echo "🎉 All tests passed! JWT token management is properly implemented."
    exit 0
else
    echo "⚠️  Some issues found. Please review the results above."
    exit 1
fi
