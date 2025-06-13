# Tempo "Empty Ring" Error - Fix Documentation

## Problem Description

The Grafana Tempo integration was experiencing "empty ring" errors when processing TraceQL metrics queries, specifically:

```
Error finding generators in Querier.queryRangeRecent: empty ring
```

This error occurs when:
1. Grafana tries to execute TraceQL metrics queries (`| rate()`, `| histogram_over_time()`, etc.)
2. Tempo's metrics generator is not properly configured or disabled
3. The metrics generator ring has no active instances

## Root Cause Analysis

Based on GitHub issue [grafana/tempo#4299](https://github.com/grafana/tempo/issues/4299), the problem occurs when:

1. **Metrics Generator Ring Initialization**: Tempo initializes a metrics-generator ring even when metrics generation is disabled
2. **TraceQL Metrics Queries**: Grafana attempts to run metrics queries that require the metrics generator
3. **Empty Ring State**: No metrics generator instances are available in the ring, causing queries to fail

## Solution Implementation

### 1. Updated Tempo Configuration (`tempo.yml`)

The key fixes applied:

```yaml
# Properly configure metrics generator with explicit settings
metrics_generator:
  registry:
    external_labels: {}
  storage:
    path: /var/tempo/generator/wal
    remote_write: []
  traces_storage:
    path: /var/tempo/generator/traces

# Completely disable metrics generation in overrides
overrides:
  defaults:
    metrics_generator:
      disable_collection: true
      processors: []

# Remove problematic frontend worker configuration for monolithic mode
querier:
  max_concurrent_queries: 10
```

### 2. Updated Grafana Datasource Configuration

Modified the Tempo datasource to avoid problematic metrics queries:

```yaml
datasources:
  - name: Tempo
    type: tempo
    access: proxy
    url: http://tempo:3200
    jsonData:
      # Disable service map to avoid metrics queries
      serviceMap:
        datasourceUid: ''
      # Disable node graph and span metrics
      nodeGraph:
        enabled: false
      spanMetrics:
        datasourceUid: ''
```

### 3. Configuration Changes Summary

**Files Modified:**
- `/root/todo-list-xtreme/backend/tempo.yml` - Fixed metrics generator configuration
- `/root/todo-list-xtreme/backend/grafana/provisioning/datasources/tempo.yml` - Disabled problematic features

**Key Changes:**
1. **Added explicit metrics generator configuration** even though it's disabled
2. **Removed frontend_worker configuration** not needed in monolithic mode
3. **Updated Grafana datasource** to disable metrics-dependent features
4. **Enhanced overrides section** with explicit processor disabling

## Verification

### 1. Test Results

After applying the fix:

```bash
# TraceQL queries now work without errors
✓ { .service.name = "todo-list-xtreme-api" } - Found 10 traces
✓ { duration > 100ms } - Found 4 traces  
✓ { .http.method = "GET" } - Found 10 traces

# Metrics queries work without ring errors
✓ {} | rate() - Returns proper response with no errors
```

### 2. Log Analysis

**Before Fix:**
```
level=warn msg="GET /api/metrics/query_range... (500) Response: \"error finding generators in Querier.queryRangeRecent: empty ring\""
```

**After Fix:**
```
level=info msg="query range response" query="{} | rate()" status=200
level=info msg="search response" status_code=200 error=null
```

## Best Practices for Tempo Deployment

### 1. Monolithic Configuration

For simple deployments, avoid distributed-mode configurations:

```yaml
target: all  # Use monolithic mode
# Don't configure frontend_worker for monolithic deployments
```

### 2. Metrics Generator Strategy

Choose one of these approaches:

**Option A - Completely Disabled (Recommended for simple setups):**
```yaml
overrides:
  defaults:
    metrics_generator:
      disable_collection: true
```

**Option B - Enabled with Proper Configuration:**
```yaml
metrics_generator:
  registry:
    external_labels: {}
  storage:
    remote_write:
      - url: http://prometheus:9090/api/v1/write
```

### 3. Grafana Integration

When using Tempo without span metrics:
- Disable `serviceMap` if no Prometheus integration
- Disable `spanMetrics` if no metrics generator
- Focus on trace search and TraceQL queries

## Troubleshooting

### Common Issues and Solutions

1. **Still seeing empty ring errors:**
   - Verify metrics generator is properly configured in both `metrics_generator` section AND `overrides`
   - Check if any custom TraceQL queries use metrics functions

2. **Frontend connection errors:**
   - Remove `frontend_worker` configuration in monolithic mode
   - Ensure `target: all` is set correctly

3. **Service map not working:**
   - Either enable metrics generator with Prometheus integration
   - Or disable service map in Grafana datasource configuration

### Verification Commands

```bash
# Check Tempo health
curl -s http://localhost:3200/ready

# Test basic TraceQL query
curl -s "http://localhost:3200/api/search?q=%7B%7D&limit=10"

# Test metrics query (should not error)
curl -s "http://localhost:3200/api/metrics/query_range?q=%7B%7D%20%7C%20rate()&start=1600000000&end=1600001000"

# Check for ring errors in logs
docker-compose logs tempo | grep -i "empty ring"
```

## Conclusion

The "empty ring" error in Tempo is resolved by:

1. **Proper metrics generator configuration** - Even when disabled, it needs basic structure
2. **Correct monolithic mode setup** - Remove distributed-mode configurations
3. **Grafana datasource tuning** - Disable features that require unavailable services

This fix maintains full TraceQL functionality while eliminating the ring errors that were preventing proper trace analysis and visualization.

## References

- [Grafana Tempo Issue #4299](https://github.com/grafana/tempo/issues/4299)
- [Tempo Configuration Documentation](https://grafana.com/docs/tempo/latest/configuration/)
- [TraceQL Query Language Guide](https://grafana.com/docs/tempo/latest/traceql/)

---

**Status:** ✅ **RESOLVED** - All TraceQL queries working without empty ring errors
**Date:** June 11, 2025
**Impact:** Full distributed tracing functionality restored
