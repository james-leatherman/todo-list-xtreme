#!/bin/bash
# Run consolidated column tests for Todo List Xtreme
# This script handles running the tests in the correct environment

# Determine if we're running in Docker or locally
if [ -f /.dockerenv ] || [ -f /run/.containerenv ]; then
    echo "Running tests inside Docker container..."
    cd /app && python -m pytest backend/tests/integration/test_columns_consolidated.py "$@"
else
    echo "Running tests using Docker backend container..."
    # Get the backend container ID
    CONTAINER_ID=$(docker ps -qf "name=todo-list-xtreme-backend")
    
    if [ -z "$CONTAINER_ID" ]; then
        echo "Error: Backend container not found or not running."
        echo "Please ensure the Todo List Xtreme backend is running in Docker."
        exit 1
    fi
    
    echo "Using backend container: $CONTAINER_ID"
    docker exec -it $CONTAINER_ID python -m pytest backend/tests/integration/test_columns_consolidated.py "$@"
fi

# Check exit code
EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "\n\033[32mAll tests passed successfully!\033[0m"
else
    echo -e "\n\033[31mTests failed with exit code: $EXIT_CODE\033[0m"
fi

exit $EXIT_CODE
