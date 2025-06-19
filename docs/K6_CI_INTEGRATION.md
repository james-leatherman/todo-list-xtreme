# K6 CI Integration Guide

## Overview
K6 load tests have been integrated into the CI/CD pipeline to ensure API performance and reliability.

## CI Workflows

### 1. Main CI Workflow (`ci.yml`)
- **Trigger**: Push to main, Pull Requests
- **Tests**: Quick k6 tests with reduced load
- **Purpose**: Fast feedback for basic API functionality
- **Duration**: ~3-5 minutes for k6 tests

**Tests included:**
- Quick test (30s, 5 VUs)
- Debug test (10s, 1 VU)
- API load test (1m, 3 VUs)
- Comprehensive test (30s, 2 VUs)

### 2. K6 Load Testing Workflow (`k6-load-testing.yml`)
- **Trigger**: Manual dispatch, Weekly schedule (Sundays 2 AM UTC)
- **Tests**: Comprehensive load testing
- **Purpose**: Performance regression detection
- **Duration**: Configurable (default 2m)

**Available test types:**
- `quick` - Basic functionality test
- `debug` - Detailed debugging with logs
- `load` - API load testing
- `comprehensive` - Full feature testing
- `concurrent` - High concurrency testing
- `all` - All tests in sequence

## Manual Workflow Execution

### GitHub Actions UI
1. Go to Actions tab in GitHub
2. Select "K6 Load Testing" workflow
3. Click "Run workflow"
4. Configure parameters:
   - **Test Type**: Choose specific test or 'all'
   - **Duration**: e.g., '30s', '2m', '5m'
   - **VUs**: Number of virtual users (1-50 recommended)

### Via GitHub CLI
```bash
gh workflow run k6-load-testing.yml \
  -f test_type=all \
  -f duration=2m \
  -f vus=10
```

## Environment Variables

The CI workflows automatically set these environment variables:

- `API_URL`: Backend API URL (http://localhost:8000 in CI)
- `AUTH_TOKEN`: Generated JWT token for authentication
- `CI`: Set to 'true' in CI environments
- `GITHUB_ACTIONS`: Set to 'true' in GitHub Actions

## CI-Optimized Test Parameters

When running in CI environments, tests use reduced parameters for faster execution:

| Environment | Duration | VUs | Purpose |
|-------------|----------|-----|---------|
| Local Dev   | 1-5m     | 10-20 | Full performance testing |
| CI/PR       | 10-60s   | 1-5   | Quick validation |
| Scheduled   | 1-10m    | 5-50  | Comprehensive monitoring |

## Test Artifacts

The CI workflows upload test results as artifacts:
- **Name**: `k6-test-results`
- **Contents**: JSON reports, HTML summaries
- **Retention**: 30 days
- **Access**: Available in workflow run details

## Thresholds and Failure Conditions

Tests fail if any of these thresholds are exceeded:

### Quick Test
- 95% of requests < 1000ms
- Error rate < 5%
- All system setup checks pass

### Load Test
- 95% of requests < 2000ms
- Error rate < 10%
- API operations success rate > 95%

### Concurrent Test
- 95% of requests < 1500ms
- Error rate < 5%
- 90% of operations < 1000ms

## Monitoring and Alerts

### Performance Regression Detection
- Compare test results across runs
- Alert on threshold degradation
- Track metrics trends over time

### Key Metrics Tracked
- Response time percentiles (p50, p90, p95, p99)
- Error rates by endpoint
- Throughput (requests/second)
- System resource utilization

## Debugging Failed Tests

### 1. Check Workflow Logs
```bash
# View workflow runs
gh run list --workflow=k6-load-testing.yml

# View specific run logs
gh run view <run-id> --log
```

### 2. Download Test Artifacts
```bash
# Download test results
gh run download <run-id>
```

### 3. Local Reproduction
```bash
# Use same parameters as CI
cd scripts
export API_URL=http://localhost:8000
export AUTH_TOKEN=<your-token>
k6 run --duration=30s --vus=5 k6-quick-test.js
```

## Best Practices

### For CI Integration
1. **Keep CI tests fast** - Use shorter durations for PR validation
2. **Use appropriate VU counts** - Scale based on test purpose
3. **Monitor resource usage** - Don't overwhelm CI runners
4. **Fail fast** - Set reasonable thresholds for quick feedback

### For Load Testing
1. **Run comprehensive tests separately** - Use scheduled or manual workflows
2. **Document performance baselines** - Track expected performance metrics
3. **Test realistic scenarios** - Match production usage patterns
4. **Monitor long-term trends** - Look for gradual performance degradation

## Configuration Files

### Modified Files
- `.github/workflows/ci.yml` - Added k6-load-tests job
- `.github/workflows/k6-load-testing.yml` - New dedicated k6 workflow
- `scripts/run-k6-tests.sh` - Added CI environment detection

### Environment Setup
The workflows automatically:
1. Start PostgreSQL database
2. Start backend API server
3. Initialize database schema
4. Create test user
5. Generate JWT token
6. Install k6
7. Wait for service readiness

## Troubleshooting

### Common Issues

**Backend not ready**
- Solution: Increase wait time in CI workflow
- Check: Database connectivity and initialization

**Authentication failures**
- Solution: Verify JWT token generation
- Check: Secret key consistency between backend and CI

**High error rates**
- Solution: Reduce VU count or increase duration
- Check: Database connection limits

**Timeouts**
- Solution: Adjust k6 thresholds for CI environment
- Check: CI runner resource constraints

### Getting Help
1. Check workflow logs for detailed error messages
2. Review k6 test artifacts for performance data
3. Compare with local test runs using same parameters
4. Verify backend logs for API-specific issues
