# K6 Load Testing System

## Overview
Todo List Xtreme includes a comprehensive load testing system using [Grafana k6](https://k6.io/). This document explains how to use the k6 load testing tools, which have been fully integrated with both local development and CI/CD pipelines.

## Test Scripts

### Unified Test Script
All load tests use the unified test script located at:
```
/scripts/k6-tests/k6-unified-test.js
```

This script supports multiple testing modes:
- **Quick**: Fast smoke tests (30s, 2 VUs)
- **Load**: Progressive load testing with stages (4m total)
- **Comprehensive**: Feature-focused testing (60s, 3 VUs)
- **Stress**: High-volume stress testing (5m total, up to 50 VUs)

### Supporting Modules
The k6 tests are organized into modules:
- `modules/auth.js`: Authentication utilities
- `modules/setup.js`: System state management

## Running Tests

### Local Execution

Run tests directly on your machine (requires k6 installed):

```bash
# From project root:
./scripts/k6-tests/run-k6-tests.sh quick
./scripts/k6-tests/run-k6-tests.sh load
./scripts/k6-tests/run-k6-tests.sh comprehensive
./scripts/k6-tests/run-k6-tests.sh stress
```

### Docker Execution

Run tests using Docker (no local k6 installation needed):

```bash
# From project root:
./scripts/k6-tests/run-k6-tests.sh quick --docker
./scripts/k6-tests/run-k6-tests.sh load --docker
```

### Options

- `--debug`: Enable detailed logging
- `--docker`: Run using Docker integration
- Environment variables:
  - `API_URL`: API URL (default: http://localhost:8000)
  - `DURATION`: Test duration (default depends on mode)
  - `VUS`: Virtual user count (default depends on mode)

## CI/CD Integration

Tests automatically run in GitHub Actions using the workflow defined in `.github/workflows/k6-load-testing.yml`. The workflow:

1. Sets up the backend API container
2. Runs k6 tests using Docker with proper volume mounts
3. Uploads test results as artifacts

## Recent Improvements

### Fixed in v1.5.1 (2025-06-23)
- **Status Validation**: Corrected all task status values to match API validation pattern
- **Script Path References**: Fixed path inconsistencies between local and Docker environments
- **Docker Integration**: Enhanced Docker support with proper volume mounts and permissions
- **CI Workflow**: Updated GitHub Actions workflow for reliable test execution

## Valid Status Values

The API only accepts these status values:
- `todo`
- `inProgress`
- `blocked`
- `done`

## Test Result Metrics

Tests capture and report:
- HTTP request durations (p95, p99)
- Error rates
- Success/failure checks
- Custom metrics

## Documentation

For more detailed information, see:
- `/docs/K6_DOCKER_INTEGRATION_COMPLETE.md`
- `/docs/K6_STATUS_VALIDATION_FIX_COMPLETE.md`
- `/docs/K6_PATH_FIX_COMPLETE.md`
