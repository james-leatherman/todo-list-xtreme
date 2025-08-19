# Common Authentication System

This directory contains the centralized authentication system for all Todo List Xtreme scripts. This system eliminates the need for hardcoded JWT tokens and provides a consistent authentication interface across all scripts.

## Overview

The common authentication system provides:
- **Centralized JWT token management**
- **Automatic token generation and refresh**
- **Consistent API call interface**
- **No hardcoded tokens**
- **Automatic validation and error handling**

## Files

- `common-test-functions.sh` - Main authentication module with all functions
- `debug-connection.sh` - Updated to use common authentication
- `README.md` - This documentation

## Quick Start

### 1. Source the common functions

```bash
# In any script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../common/common-test-functions.sh"
```

### 2. Get an authentication token

```bash
# Get a valid token (loads existing or generates new)
if ! get_auth_token; then
    echo "Failed to get authentication token"
    exit 1
fi
```

### 3. Make authenticated API calls

```bash
# Simple GET request
RESPONSE=$(make_authenticated_request "GET" "/api/v1/column-settings/")

# POST request with data
DATA='{"title": "Test Task", "description": "Test Description"}'
RESPONSE=$(make_authenticated_request "POST" "/api/v1/tasks/" "$DATA")

# PUT request with data
UPDATE_DATA='{"column_order": ["todo", "done"]}'
RESPONSE=$(make_authenticated_request "PUT" "/api/v1/column-settings/" "$UPDATE_DATA")
```

## Available Functions

### Core Functions

#### `get_auth_token([force_refresh])`
Gets a valid JWT token. If no token exists or the current token is invalid, it generates a new one.

**Parameters:**
- `force_refresh` (optional): Set to "true" to force generation of a new token

**Returns:** 0 on success, 1 on failure

**Example:**
```bash
# Get token (loads existing if valid)
get_auth_token

# Force refresh token
get_auth_token "true"
```

#### `make_authenticated_request(method, endpoint, [data], [headers])`
Makes an authenticated API request.

**Parameters:**
- `method`: HTTP method (GET, POST, PUT, DELETE, etc.)
- `endpoint`: API endpoint path (e.g., "/api/v1/tasks/")
- `data` (optional): JSON data for POST/PUT requests
- `headers` (optional): Additional HTTP headers

**Returns:** API response as string

**Example:**
```bash
# GET request
RESPONSE=$(make_authenticated_request "GET" "/api/v1/tasks/")

# POST request with data
DATA='{"title": "New Task"}'
RESPONSE=$(make_authenticated_request "POST" "/api/v1/tasks/" "$DATA")
```

### Utility Functions

#### `validate_auth_setup()`
Validates the entire authentication setup including API connectivity and token validity.

**Returns:** 0 on success, 1 on failure

#### `test_api_connectivity()`
Tests if the API is accessible.

**Returns:** 0 on success, 1 on failure

#### `is_token_valid(token)`
Checks if a JWT token is valid by making a test API call.

**Parameters:**
- `token`: JWT token to validate

**Returns:** 0 if valid, 1 if invalid

#### `show_auth_status()`
Displays current authentication status including token info and API URL.

#### `refresh_token_if_needed()`
Automatically refreshes the token if it's missing or invalid.

## Configuration

The system uses these environment variables (with defaults):

```bash
API_URL="${API_URL:-http://localhost:8000}"
ENV_FILE="${ENV_FILE:-.env.development.local}"
TOKEN_GENERATOR="${TOKEN_GENERATOR:-scripts/utils/generate-test-jwt-token.py}"
```

## Migration Guide

### Before (Old Way)
```bash
# Hardcoded token usage
source .env.development.local
curl -s -X GET "http://localhost:8000/api/v1/tasks/" \
  -H "Authorization: Bearer $TEST_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### After (New Way)
```bash
# Common authentication
source "scripts/common/common-test-functions.sh"
RESPONSE=$(make_authenticated_request "GET" "/api/v1/tasks/")
```

## Error Handling

The system provides comprehensive error handling:

```bash
# Check if authentication setup is valid
if ! validate_auth_setup; then
    echo "Authentication setup failed"
    exit 1
fi

# Check if API call succeeded
RESPONSE=$(make_authenticated_request "GET" "/api/v1/tasks/")
if [ $? -ne 0 ]; then
    echo "API call failed"
    exit 1
fi
```

## Testing

Run the test script to verify the system is working:

```bash
./scripts/test-common-auth.sh
```

## Benefits

1. **Security**: No hardcoded JWT tokens in scripts
2. **Maintainability**: Centralized authentication logic
3. **Reliability**: Automatic token refresh and validation
4. **Consistency**: Same interface across all scripts
5. **Error Handling**: Comprehensive error checking
6. **Flexibility**: Easy to modify authentication behavior

## Troubleshooting

### Common Issues

1. **Token generation fails**
   - Check if `scripts/utils/generate-test-jwt-token.py` exists
   - Verify backend is running and accessible
   - Check if `.env.development.local` is writable

2. **API calls fail**
   - Run `validate_auth_setup` to check connectivity
   - Verify API server is running on correct port
   - Check if token is valid with `is_token_valid`

3. **Environment file not found**
   - Ensure `.env.development.local` exists in project root
   - Check file permissions

### Debug Mode

Enable debug output by setting the `DEBUG` environment variable:

```bash
DEBUG=true ./scripts/test-common-auth.sh
```

## Examples

See the updated scripts in the `scripts/verify/` directory for complete examples of how to use the common authentication system. 