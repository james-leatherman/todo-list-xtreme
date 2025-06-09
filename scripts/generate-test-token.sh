#!/bin/bash

# Get the project root directory (where this script is located)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Run create_test_user.py and capture its output
output=$(cd "$PROJECT_ROOT/backend" && python3 create_test_user.py)

# Extract the JWT token using grep and sed
token=$(echo "$output" | grep "JWT Token:" | sed 's/JWT Token: //')

# Create or update .env.development.local with the token
echo "REACT_APP_TEST_TOKEN=$token" > "$PROJECT_ROOT/frontend/.env.development.local"

echo "Test token has been written to frontend/.env.development.local"
