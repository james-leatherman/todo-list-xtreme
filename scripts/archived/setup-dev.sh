#!/bin/bash

# Get the project root directory (where this script is located)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Generate the test token
echo "Generating test token..."
"$PROJECT_ROOT/scripts/create-test-user.sh"

# Check if .env file exists, if not create it
if [ ! -f "$PROJECT_ROOT/frontend/.env" ]; then
    echo "Creating frontend/.env..."
    echo "REACT_APP_API_URL=http://localhost:8000" > "$PROJECT_ROOT/frontend/.env"
fi

# Restart the development server if it's running
if pgrep -f "node.*start" > /dev/null; then
    echo "Restarting development server..."
    pkill -f "node.*start"
    cd "$PROJECT_ROOT/frontend" && npm start &
    echo "Development server restarted"
else
    echo "Note: Development server not running"
fi

echo "Development environment setup complete!"
echo "If the development server is not running, start it with:"
echo "cd frontend && npm start"
