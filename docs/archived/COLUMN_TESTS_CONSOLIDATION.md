# Column Tests Consolidation

This document outlines the consolidation of multiple column-related test files into a single comprehensive test suite.

## Consolidated Test File

The consolidated test file `test_columns_consolidated.py` includes the following functionality:

- **Column Settings CRUD** - Tests the basic CRUD operations for column settings
- **Empty Column Persistence** - Tests that empty columns are properly persisted
- **Comprehensive Column Persistence** - Tests complex scenarios with todos and column ordering
- **Blocked Column Functionality** - Tests the functionality of the "blocked" column for todos

## Original Files Consolidated

The following test files have been consolidated:

1. `test_comprehensive_column_persistence.py` - Test for column persistence with todos
2. `test_empty_column_persistence.py` - Test for empty column persistence
3. `test_column_settings.py` - Test for column settings CRUD operations
4. `test_blocked_column.py` - Test for blocked column functionality

## Running the Tests

### Using pytest

Make sure to activate your virtual environment or Docker container with the proper dependencies installed before running the tests.

To run the entire test suite:

```bash
cd /root/todo-list-xtreme
python -m pytest backend/tests/integration/test_columns_consolidated.py -v
```

To run a specific test:

```bash
cd /root/todo-list-xtreme
python -m pytest backend/tests/integration/test_columns_consolidated.py::test_blocked_column_functionality -v
```

### Using Docker

If using Docker, you can run the tests within the backend container:

```bash
docker exec -it todo-list-xtreme-backend pytest backend/tests/integration/test_columns_consolidated.py -v
```

### Using the Convenience Script

For ease of use, a convenience script has been created that automatically detects whether you're running inside a Docker container or on the host, and executes the tests in the right environment:

```bash
# Run all tests
./run-column-tests.sh -v

# Run a specific test
./run-column-tests.sh -v -k test_blocked_column_functionality
```

The script will take care of finding the correct Docker container and executing the tests with the proper environment.

## Benefits of Consolidation

- Reduced duplication of code across multiple test files
- Standardized testing approach for all column-related functionality
- Improved maintainability and readability of tests
- Sequential test execution for better isolation and debugging
- Comprehensive coverage of column functionality in a single file

## Test Functions

1. `test_column_settings_crud(auth_token)`: Tests basic CRUD operations for column settings
2. `test_empty_column_persistence(auth_token)`: Tests that empty columns are persisted correctly
3. `test_comprehensive_column_persistence(auth_token)`: Tests complex persistence scenarios with todos
4. `test_blocked_column_functionality(auth_token)`: Tests the blocked column implementation

Each test function cleans up after itself to ensure test isolation.
