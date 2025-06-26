# K6 Load Testing Implementation

This document provides a comprehensive overview of the K6 load testing implementation for the Todo List Xtreme project.

## Overview

The project uses K6 for load testing, with scripts organized to test different aspects of the application. These tests are integrated with CI/CD pipelines and support both local and containerized execution.

## Main Components

### 1. Load Testing Scripts

- **`k6-api-load-test.js`**: Comprehensive load test with realistic user scenarios
- **`k6-concurrent-load.js`**: Tests concurrent operations
- **`k6-dashboard-load-test.js`**: Tests specific dashboard functionalities
- **`k6-performance-baseline.js`**: Establishes performance baselines
- **`k6-stress-test.js`**: Validates system behavior under extreme load

### 2. CI/CD Integration

- Configured GitHub Actions workflow for automated load testing
- Set up dedicated K6 test step in CI/CD pipeline
- Added performance regression detection
- Fixed BASE_URL configuration for different environments
- Standardized test output format for CI reporting
- Added thresholds for pass/fail criteria

### 3. Modularization

- Refactored scripts to use shared utility functions
- Created reusable test scenarios
- Implemented consistent configuration approach
- Added environment-specific settings
- Fixed status validation and test values
- Reorganized test structure for better maintenance

- GitHub Actions workflow for automated testing
- Docker-based execution for consistent environment
- Configurable parameters for different test scenarios

### 3. Key Improvements

- **Base URL Fixes**: Standardized base URL handling across all scripts
- **Docker Integration**: Added full Docker support for k6 load testing
  - New k6 service in backend docker-compose.yml
  - Docker-compatible test execution in CI/CD and local environments
  - Results directory for storing test artifacts
- **Test Validation**: Fixed validation errors in k6 load tests
  - Corrected all status values to match API validation pattern (todo, inProgress, blocked, done)
  - Fixed all path references in GitHub Actions workflow
  - Ensured consistent volume mounts between environments
- **Modularization**: Split common functionality into reusable modules
- **Reorganization**: Improved directory structure for better maintainability

### 4. Usage 

All tests can be run using the following command:

```bash
./scripts/run-k6-with-metrics.sh [test-name]
```

## Documentation History

This documentation consolidates information from:
- K6_BASE_URL_FIX_COMPLETE.md
- K6_CI_INTEGRATION.md
- K6_CI_INTEGRATION_COMPLETE.md
- K6_LOAD_TESTING_SUMMARY.md
- K6_MODULARIZATION_COMPLETE.md
- K6_REORGANIZATION_COMPLETE.md

See the project CHANGELOG.md for version-specific improvements.
