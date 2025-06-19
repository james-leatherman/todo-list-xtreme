# K6 Load Tests

This directory contains all k6 load testing scripts and modules for the Todo List Xtreme API.

## Directory Structure

```
k6-tests/
├── modules/                    # Shared k6 modules
│   ├── auth.js                # Authentication utilities
│   └── setup.js               # Setup and cleanup utilities
├── k6-quick-test.js           # Basic functionality test
├── k6-debug-test.js           # Debug test with detailed logging
├── k6-api-load-test.js        # Comprehensive API load test
├── k6-concurrent-load.js      # High concurrency load test
├── k6-comprehensive-test.js   # Full feature coverage test
├── run-k6-tests.sh           # Test runner script
└── README.md                 # This file
```

## Test Files

### Core Test Scripts

- **`k6-quick-test.js`** - Fast basic functionality test
  - Duration: 30s-1m
  - VUs: 1-5
  - Purpose: Quick validation of core API functions

- **`k6-debug-test.js`** - Debug test with verbose logging
  - Duration: 10s-30s
  - VUs: 1-2
  - Purpose: Detailed API response debugging

- **`k6-api-load-test.js`** - Comprehensive load testing
  - Duration: 1m-5m
  - VUs: 3-20
  - Purpose: Full API performance testing

- **`k6-concurrent-load.js`** - High concurrency testing
  - Duration: 1m-10m
  - VUs: 5-50
  - Purpose: Stress testing with multiple scenarios

- **`k6-comprehensive-test.js`** - Complete feature testing
  - Duration: 30s-2m
  - VUs: 2-10
  - Purpose: Full application workflow testing

### Shared Modules

- **`modules/auth.js`** - Authentication and HTTP utilities
  - `getAuthHeaders()` - Get standardized auth headers
  - `getBaseURL()` - Get configured API base URL
  - `authenticatedGet/Post/Put/Delete()` - HTTP methods with auth

- **`modules/setup.js`** - System setup and cleanup utilities
  - `resetSystemState()` - Complete system reset
  - `cleanupAndReset()` - Full cleanup and default restoration
  - `verifyCleanState()` - Validate clean system state

## Usage

### Local Testing

```bash
# Run from project root
cd scripts/k6-tests

# Quick test
./run-k6-tests.sh quick

# Debug test
./run-k6-tests.sh debug

# Load test
./run-k6-tests.sh load

# All tests
./run-k6-tests.sh all
```

### Manual k6 Execution

```bash
# Set environment variables
export API_URL=http://localhost:8000
export AUTH_TOKEN=your-jwt-token

# Run specific test
k6 run --duration=1m --vus=10 k6-api-load-test.js

# Run with custom parameters
k6 run --duration=30s --vus=5 k6-quick-test.js
```

### CI Integration

The k6 tests are automatically executed in GitHub Actions CI pipeline:

- **Location**: `.github/workflows/ci.yml`
- **Trigger**: Push to main, Pull Requests
- **Working Directory**: `./scripts/k6-tests`
- **Tests Run**: quick, debug, load, comprehensive

## Environment Variables

Required environment variables:

- `API_URL` - Backend API URL (default: http://localhost:8000)
- `AUTH_TOKEN` - JWT token for authentication

Optional variables:

- `CI` - Set to 'true' in CI environments (auto-detected)
- `DEFAULT_DURATION` - Default test duration
- `DEFAULT_VUS` - Default number of virtual users

## Prerequisites

### System Requirements

- **k6** - Load testing tool
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

## Test Scenarios

### Quick Test (`k6-quick-test.js`)
- Basic CRUD operations
- Column management
- Authentication verification
- Health checks

### Debug Test (`k6-debug-test.js`)
- Verbose response logging
- Error condition testing
- API response validation
- System state verification

### Load Test (`k6-api-load-test.js`)
- Multiple test scenarios (30% columns, 40% todos, 20% bulk, 10% health)
- Performance threshold validation
- Error rate monitoring
- Throughput measurement

### Concurrent Load Test (`k6-concurrent-load.js`)
- High concurrency scenarios
- Different VU behaviors
- Column configuration testing
- Task movement operations

### Comprehensive Test (`k6-comprehensive-test.js`)
- Complete workflow testing
- Multi-user scenarios
- Complex task operations
- System integration validation

## Performance Thresholds

Default thresholds for test validation:

```javascript
// Quick Test
http_req_duration: ['p(95)<1000']  // 95% under 1s
http_req_failed: ['rate<0.05']     // Error rate under 5%

// Load Test  
http_req_duration: ['p(95)<2000']  // 95% under 2s
http_req_failed: ['rate<0.1']      // Error rate under 10%

// Concurrent Test
http_req_duration: ['p(95)<1500']  // 95% under 1.5s
operation_duration: ['p(90)<1000'] // 90% operations under 1s
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
python3 scripts/generate-test-jwt-token.py
```

**Module import errors**
```bash
# Verify modules directory exists
ls -la modules/

# Check file permissions
chmod +x run-k6-tests.sh
```

### Getting Help

1. Check test logs for detailed error messages
2. Verify backend and database are running
3. Ensure JWT token is valid and not expired
4. Review k6 documentation: https://k6.io/docs/

## CI Integration Details

### GitHub Actions Workflow

The k6 tests are integrated into the main CI pipeline:

1. **Setup Phase**
   - Start PostgreSQL database
   - Start backend API
   - Initialize database schema  
   - Create test user
   - Generate JWT token

2. **Test Execution Phase**
   - Run k6-quick-test.js (30s, 5 VUs)
   - Run k6-debug-test.js (10s, 1 VU)
   - Run k6-api-load-test.js (1m, 3 VUs)
   - Run k6-comprehensive-test.js (30s, 2 VUs)

3. **Cleanup Phase**
   - Stop all containers
   - Clean up resources

### Path Updates

After moving to dedicated directory, the following paths were updated:

- **CI Workflow**: `working-directory: ./scripts/k6-tests`
- **Test Runner**: Updated paths to reference parent directories
- **Module Imports**: Relative paths remain the same
- **Documentation**: Updated to reflect new structure

## Contributing

When adding new k6 tests:

1. **Use modular approach** - Import auth and setup modules
2. **Follow naming convention** - `k6-[purpose]-test.js`
3. **Include proper setup/teardown** - Reset system state
4. **Set appropriate thresholds** - Match test purpose
5. **Update documentation** - Add to this README
6. **Test locally first** - Verify before CI integration

## Related Documentation

- [K6 Modularization Complete](../../docs/K6_MODULARIZATION_COMPLETE.md)
- [K6 CI Integration Complete](../../docs/K6_CI_INTEGRATION_COMPLETE.md)
- [K6 CI Integration Guide](../../docs/K6_CI_INTEGRATION.md)
