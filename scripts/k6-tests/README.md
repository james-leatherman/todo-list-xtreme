# K6 Load Tests

This directory contains the unified k6 load testing solution for the Todo List Xtreme API. All testing scenarios have been consolidated into a single, flexible script that supports multiple test modes.

## Directory Structure

```
k6-tests/
├── modules/                    # Shared k6 modules
│   ├── auth.js                # Authentication utilities
│   └── setup.js               # Setup and cleanup utilities
├── k6-unified-test.js         # Single unified test script (all scenarios)
├── legacy/                    # Deprecated individual scripts (backup)
│   ├── k6-quick-test.js       # ➤ Replaced by TEST_MODE=quick
│   ├── k6-api-load-test.js    # ➤ Replaced by TEST_MODE=load
│   ├── k6-comprehensive-test.js # ➤ Replaced by TEST_MODE=comprehensive
│   ├── k6-concurrent-load.js  # ➤ Replaced by TEST_MODE=stress
│   └── k6-checks-demo.js      # ➤ Replaced by unified helpers
├── run-k6-tests.sh           # Test runner script
└── README.md                 # This file
```

## Unified Test Script

The **`k6-unified-test.js`** script replaces all individual test scripts and supports multiple test modes:

### Test Modes

Configure the test scenario via the `TEST_MODE` environment variable:

- **`quick`** (default) - Fast smoke test
  - Duration: 30s, 2 VUs
  - Purpose: Basic API validation
  - Thresholds: p(95)<1000ms, errors<5%

- **`load`** - Load testing with stages
  - Stages: 30s→5 VUs, 2m→10 VUs, 1m→20 VUs, 30s→0 VUs
  - Purpose: Performance under realistic load
  - Thresholds: p(95)<2000ms, errors<10%

- **`comprehensive`** - Complete feature testing
  - Duration: 60s, 3 VUs
  - Purpose: Full workflow validation
  - Thresholds: p(95)<1000ms, errors<10%

- **`stress`** - High-load stress testing
  - Stages: 1m→10 VUs, 3m→50 VUs, 1m→0 VUs
  - Purpose: System limits and stability
  - Thresholds: p(95)<5000ms, errors<20%

### Shared Modules

- **`modules/auth.js`** - Authentication and HTTP utilities
  - `authenticatedGet/Post/Put/Delete()` - HTTP methods with auth
  - `checkResponseStatus()` - Standardized response validation
  - `getBaseURL()`, `verifyAuth()` - Configuration utilities

- **`modules/setup.js`** - System setup and cleanup utilities
  - `resetSystemState()` - Complete system reset
  - `verifyCleanState()` - Validate clean system state
  - `cleanupTasksOnly()` - Task-specific cleanup

## Usage

### Using the Test Runner Script (Recommended)

```bash
# Run from project root
cd scripts/k6-tests

# Quick smoke test
./run-k6-tests.sh quick

# Load test with stages
./run-k6-tests.sh load

# Comprehensive feature test
./run-k6-tests.sh comprehensive

# Stress test
./run-k6-tests.sh stress

# Run all tests sequentially
./run-k6-tests.sh all

# Enable debug mode
./run-k6-tests.sh quick --debug
```

### Direct k6 Execution

```bash
# Set environment variables
export API_URL=http://localhost:8000
export AUTH_TOKEN=your-jwt-token

# Quick test (default mode)
k6 run k6-unified-test.js

# Specific test modes
TEST_MODE=load k6 run k6-unified-test.js
TEST_MODE=comprehensive k6 run k6-unified-test.js
TEST_MODE=stress k6 run k6-unified-test.js

# With debug logging
TEST_MODE=quick DEBUG=true k6 run k6-unified-test.js
```

## Environment Variables

### Required Variables

- `API_URL` - Backend API URL (default: http://localhost:8000)
- `AUTH_TOKEN` - JWT token for authentication

### Optional Variables

- `TEST_MODE` - Test scenario: `quick|load|comprehensive|stress` (default: `quick`)
- `DEBUG` - Enable detailed logging: `true|false` (default: `false`)

## CI Integration

The unified script is integrated into GitHub Actions workflows:

### Main CI Pipeline (`.github/workflows/ci.yml`)

```yaml
- name: Run k6 quick test
  env:
    TEST_MODE: quick
    DEBUG: true
  run: k6 run k6-unified-test.js

- name: Run k6 load test
  env:
    TEST_MODE: load
  run: k6 run k6-unified-test.js

- name: Run k6 comprehensive test
  env:
    TEST_MODE: comprehensive
  run: k6 run k6-unified-test.js
```

### Load Testing Workflow (`.github/workflows/k6-load-testing.yml`)

Supports all test modes via workflow dispatch inputs.

## Test Scenarios

The unified script automatically runs different test scenarios based on the VU (Virtual User) ID and test mode:

### Quick Mode
- Basic CRUD operations
- Column configuration updates
- Health checks
- Authentication verification

### Load Mode
- Distributed VU scenarios:
  - VU % 4 = 0: CRUD operations
  - VU % 4 = 1: Column operations  
  - VU % 4 = 2: Bulk task operations
  - VU % 4 = 3: Health checks

### Comprehensive Mode
- Per-VU test scenarios:
  - VU % 3 = 0: Basic CRUD test
  - VU % 3 = 1: Column management test
  - VU % 3 = 2: Workflow test

### Stress Mode
- High-volume operations:
  - Create, read, update, delete operations
  - Random task selection for updates/deletes
  - Concurrent access patterns

## Performance Thresholds

```javascript
// Quick Mode
thresholds: {
  checks: ['rate>0.95'],
  http_req_duration: ['p(95)<1000'],
  http_req_failed: ['rate<0.05']
}

// Load Mode  
thresholds: {
  checks: ['rate>0.95'],
  http_req_duration: ['p(95)<2000'],
  http_req_failed: ['rate<0.1']
}

// Comprehensive Mode
thresholds: {
  checks: ['rate>0.95'],
  http_req_duration: ['p(95)<1000'],
  http_req_failed: ['rate<0.1']
}

// Stress Mode
thresholds: {
  checks: ['rate>0.90'],      // Lower threshold for stress
  http_req_duration: ['p(95)<5000'],
  http_req_failed: ['rate<0.2']
}
```

## Migration from Individual Scripts

The following individual scripts have been **deprecated** and replaced:

| Old Script | New Equivalent | Migration |
|------------|---------------|-----------|
| `k6-quick-test.js` | `TEST_MODE=quick` | ✅ Completed |
| `k6-api-load-test.js` | `TEST_MODE=load` | ✅ Completed |
| `k6-comprehensive-test.js` | `TEST_MODE=comprehensive` | ✅ Completed |
| `k6-concurrent-load.js` | `TEST_MODE=stress` | ✅ Completed |
| `k6-checks-demo.js` | Built-in `checkResponseStatus` | ✅ Completed |

**Benefits of the unified approach:**
- ✅ Single script to maintain
- ✅ Consistent modular helpers across all tests
- ✅ Flexible scenario configuration via environment variables
- ✅ Easier CI/CD integration
- ✅ Better code reuse and reduced duplication

## Prerequisites

### System Requirements

- **k6** - Load testing tool (v0.40+)
- **Backend API** - Running Todo List Xtreme API
- **Database** - PostgreSQL instance
- **Authentication** - Valid JWT token

### Installation

```bash
# Install k6 (Ubuntu/Debian)
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Install k6 (macOS)
brew install k6

# Install k6 (Windows)
winget install k6
```

## Troubleshooting

### Common Issues

**Backend not accessible**
```bash
# Check if API is running
curl http://localhost:8000/health

# Start backend if needed
cd ../backend
docker-compose up -d
```

**Authentication failures**
```bash  
# Generate fresh JWT token
cd ..
bash scripts/create-test-user.sh
```

**Test mode not recognized**
```bash
# Valid test modes
TEST_MODE=quick k6 run k6-unified-test.js
TEST_MODE=load k6 run k6-unified-test.js
TEST_MODE=comprehensive k6 run k6-unified-test.js
TEST_MODE=stress k6 run k6-unified-test.js
```

### Debug Mode

Enable detailed logging to troubleshoot issues:

```bash
# Via environment variable
DEBUG=true TEST_MODE=quick k6 run k6-unified-test.js

# Via test runner
./run-k6-tests.sh quick --debug
```

Debug mode shows:
- Detailed request/response information
- API response status codes and bodies
- Test iteration and VU information
- Configuration validation results

## Contributing

When modifying the unified test script:

1. **Maintain backwards compatibility** - Don't break existing test modes
2. **Use modular helpers** - Always use `authenticatedGet/Post/Put/Delete` and `checkResponseStatus`
3. **Add proper debug logging** - Use `debugLog()` for detailed information
4. **Test all modes locally** - Verify `quick`, `load`, `comprehensive`, and `stress` modes
5. **Update thresholds appropriately** - Match performance expectations
6. **Update documentation** - Reflect any new features or changes

## Related Documentation

- [K6 Modularization Complete](../../docs/K6_MODULARIZATION_COMPLETE.md)
- [K6 CI Integration Complete](../../docs/K6_CI_INTEGRATION_COMPLETE.md)
- [K6 Reorganization Complete](../../docs/K6_REORGANIZATION_COMPLETE.md)
