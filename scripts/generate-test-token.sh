#!/bin/bash

# Get the project root directory (where this script is located)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Set up Python path for the new structure and run create_test_user.py
output=$(cd "$PROJECT_ROOT/backend" && PYTHONPATH="src:$PYTHONPATH" python3 -c "
import sys
import os
sys.path.insert(0, 'src')
from todo_api.utils.create_test_user import create_test_user
create_test_user()
")

# Extract the JWT token using grep and sed
token=$(echo "$output" | grep "JWT Token:" | sed 's/JWT Token: //')

# Create or update .env.development.local with the token
echo "REACT_APP_TEST_TOKEN=$token" > "$PROJECT_ROOT/frontend/.env.development.local"

echo "Test token has been written to frontend/.env.development.local"
