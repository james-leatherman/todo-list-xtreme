# K6 Load Testing Scripts - Summary

## Overview
Created comprehensive k6 load testing scripts for the Todo List Xtreme API that generate realistic traffic patterns for observability testing.

## Scripts Created

### 1. `k6-api-load-test.js` - Comprehensive Load Test
- **Purpose**: Full API testing with realistic user scenarios
- **Duration**: 5 minutes (configurable)
- **Virtual Users**: 10 (configurable)
- **Features**:
  - Column management operations (add/update column configurations)
  - Todo CRUD operations (create, read, update, delete tasks)
  - Bulk operations (bulk delete by status/column)
  - Health check monitoring
  - Custom metrics and thresholds
  - 4 different scenario types with weighted distribution

### 2. `k6-concurrent-load.js` - Concurrent Operations Test
- **Purpose**: High concurrency testing with focused operations
- **Duration**: 2 minutes (configurable)
- **Virtual Users**: 20 (configurable)
- **Features**:
  - Different VUs focus on different operation types
  - Column management (4 different board configurations)
  - Task creation with realistic templates
  - Task movement between columns
  - Task cleanup and bulk operations
  - Advanced metrics tracking
  - Realistic delays and patterns

### 3. `k6-quick-test.js` - Quick API Validation
- **Purpose**: Quick validation of API functionality
- **Duration**: 30 seconds
- **Virtual Users**: 5
- **Features**:
  - Simple column configuration updates
  - Basic task creation and deletion
  - Health check validation
  - Minimal overhead for quick testing

### 4. `run-k6-tests.sh` - Test Runner Script
- **Purpose**: Easy script execution with proper setup
- **Features**:
  - Automatic k6 installation check
  - API accessibility validation
  - JWT token generation
  - Multiple test scenarios:
    - `quick` - Quick validation (30s, 5 VUs)
    - `load` - Comprehensive test (5m, 10 VUs)
    - `concurrent` - Concurrent operations (2m, 20 VUs)
    - `stress` - Stress test (3m, 50 VUs)
    - `all` - Run all tests sequentially
  - Colored output and progress tracking

## API Operations Tested

### Column Operations
- **Add Columns**: Create new column configurations
  - Basic Kanban (To Do, In Progress, Done)
  - Extended Workflow (Backlog, To Do, In Progress, Review, Testing, Done)
  - Bug Tracking (Reported, Investigating, Fixing, Testing Fix, Resolved)
  - Scrum Board (Product Backlog, Sprint Backlog, In Progress, Blocked, Review, Done)
- **Update Columns**: Modify existing configurations
- **Reset Columns**: Reset to default configuration

### Task Operations
- **Add Tasks**: Create new todos with realistic data
  - Various task templates (development, bug fixes, documentation)
  - Different priorities and statuses
  - Unique identifiers for tracking
- **Update Tasks**: Move tasks between columns
  - Status changes (todo → inProgress → done)
  - Description updates with timestamps
  - Completion status changes
- **Remove Tasks**: Delete individual and bulk tasks
  - Individual task deletion
  - Bulk deletion by column/status
  - Cleanup of completed tasks

### Health & Monitoring Operations
- Basic health checks (`/health`)
- Detailed health checks (`/api/v1/health/detailed`)
- Database health checks (`/api/v1/health/database`)
- Authentication validation (`/api/v1/auth/me/`)
- API status checks (`/api/v1/status`)

## Metrics & Observability

### Custom Metrics
- `api_errors`: Custom error rate tracking
- `operation_duration`: Operation-specific timing
- `concurrent_users`: Active user gauge
- `todo_operations`: Todo operation counter
- `column_operations`: Column operation counter

### Thresholds
- 95% of requests under 1.5-2 seconds
- Error rate under 5-10%
- Custom metrics thresholds for performance validation

### Traces Generated
- HTTP request traces for all API endpoints
- Database operation traces
- Authentication flow traces
- Error condition traces (404s, validation errors)
- Performance traces for slow operations

## Usage Examples

```bash
# Quick test
./scripts/run-k6-tests.sh quick

# Full load test
./scripts/run-k6-tests.sh load

# Concurrent operations stress test
./scripts/run-k6-tests.sh concurrent

# Maximum stress test
./scripts/run-k6-tests.sh stress

# Run all tests
./scripts/run-k6-tests.sh all

# Custom API URL
API_URL=http://localhost:8000 ./scripts/run-k6-tests.sh load
```

## Integration with Observability Stack

These scripts are specifically designed to work with the existing observability stack:

1. **Tempo**: Generates distributed traces for all API operations
2. **Prometheus**: Creates metrics data for dashboard visualization
3. **Grafana**: Provides data for dashboard panels and alerting
4. **Loki**: Generates log entries for log-based panels

The scripts create realistic traffic patterns that will populate:
- Slow traces panel (operations >50ms)
- Error traces panel (HTTP 4xx/5xx responses)
- API request rate metrics
- Database connection metrics
- Response time histograms
- Status code distributions

## Benefits

1. **Realistic Load**: Simulates actual user behavior patterns
2. **Comprehensive Coverage**: Tests all major API endpoints
3. **Observability Focus**: Designed to generate meaningful telemetry data
4. **Scalable**: Easy to adjust load patterns and duration
5. **Automated**: Simple script-based execution
6. **Monitoring Ready**: Built-in health checks and metrics validation

This completes the k6 load testing infrastructure for the Todo List Xtreme API, providing powerful tools for testing API performance and validating the observability stack with realistic data.
