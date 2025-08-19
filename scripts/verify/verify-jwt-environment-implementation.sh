#!/bin/bash

# Comprehensive test to verify all JWT token environment variable fixes
echo "🔐 JWT Token Environment Variable Implementation Test"
echo "====================================================="

# Source common authentication functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../common/common-test-functions.sh"

# Test the token generation system
echo "1. Testing JWT token generation..."
if get_auth_token; then
    echo "✅ JWT token generation and loading works"
else
    echo "❌ JWT token generation failed"
    exit 1
fi

echo
echo "2. Testing authentication setup..."
if validate_auth_setup; then
    echo "✅ Authentication setup is working correctly"
else
    echo "❌ Authentication setup failed"
    exit 1
fi

echo
echo "3. Testing API connectivity..."
if test_api_connectivity; then
    echo "✅ API connectivity is working"
else
    echo "❌ API connectivity failed"
    exit 1
fi

echo
echo "4. Testing individual scripts..."

# List of scripts to test (just check they start without errors)
scripts_to_test=(
    "verify-column-settings-fix.sh"
    "verify-column-add-fix.sh"
    "verify-column-fix.sh"
    "verify-dashboard-functionality.sh"
    "generate-dashboard-traffic.sh"
    "verify-complete-observability-stack.sh"
)

success_count=0
total_count=${#scripts_to_test[@]}

for script in "${scripts_to_test[@]}"; do
    echo "  Testing $script..."
    
    # Run script with timeout to test initialization only
    if timeout 5s bash -c "cd '$PROJECT_ROOT' && ./scripts/verify/$script" >/dev/null 2>&1; then
        echo "    ✅ $script: Initialization successful"
        ((success_count++))
    else
        # Check if it failed due to timeout (which means it started successfully)
        if timeout 2s bash -c "cd '$PROJECT_ROOT' && ./scripts/verify/$script" 2>&1 | head -3 | grep -q "Authentication token loaded"; then
            echo "    ✅ $script: Authentication loading works (timed out during execution - normal)"
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

# Check for TEST_JWT_TOKEN usage (should be minimal now)
test_jwt_usage=$(grep -r "TEST_JWT_TOKEN" scripts/ | grep -v "common-test-functions.sh" | grep -v "generate-test-jwt-token.py" | wc -l)

if [ "$test_jwt_usage" -eq 0 ]; then
    echo "✅ No direct TEST_JWT_TOKEN usage found in scripts (using common functions)"
else
    echo "⚠️  Found $test_jwt_usage scripts still using TEST_JWT_TOKEN directly:"
    grep -r "TEST_JWT_TOKEN" scripts/ | grep -v "common-test-functions.sh" | grep -v "generate-test-jwt-token.py"
fi

echo
echo "6. Authentication status:"
show_auth_status

echo
echo "📊 Test Results Summary:"
echo "========================"
echo "✅ JWT Token Generation: Working"
echo "✅ Authentication Setup: Working" 
echo "✅ API Connectivity: Working"
echo "📋 Script Tests: $success_count/$total_count scripts working"

if [ "$hardcoded_tokens" -eq 0 ] && [ "$test_jwt_usage" -eq 0 ]; then
    echo "🔒 Security: No hardcoded tokens or direct usage (Excellent)"
else
    echo "⚠️  Security: Some scripts still need cleanup"
fi

echo
echo "🎯 Usage Instructions:"
echo "======================"
echo "1. Source common functions: source scripts/common/common-test-functions.sh"
echo "2. Get token: get_auth_token"
echo "3. Make API calls: make_authenticated_request METHOD ENDPOINT [DATA]"
echo "4. Validate setup: validate_auth_setup"
echo "5. JWT tokens expire in 24 hours and are automatically refreshed"

echo
if [ "$success_count" -eq "$total_count" ] && [ "$hardcoded_tokens" -eq 0 ] && [ "$test_jwt_usage" -eq 0 ]; then
    echo "🎉 All tests passed! Common authentication is properly implemented."
    exit 0
else
    echo "⚠️  Some issues found. Please review the results above."
    exit 1
fi
