# Project Scripts

This directory contains various utility scripts for development, testing, database management, and observability verification.

## Observability Verification Scripts

### 🚀 `quick-status-check.sh`
**Quick 5-second health check of all services**
- Fastest way to check if all services are running
- Shows basic service status with color coding
- Provides quick access URLs and common commands

```bash
bash scripts/quick-status-check.sh
```

### 🔍 `verify-observability-stack.sh`
**Comprehensive observability stack verification (recommended)**
- Updated and improved primary verification script
- Tests all core services with retry logic and timeouts
- Verifies data flow from API → OTEL Collector → Prometheus/Tempo → Grafana
- Generates test traffic and validates metrics/traces collection
- Provides detailed troubleshooting hints and access URLs
- Tests dashboard availability and data source configuration

```bash
bash scripts/verify-observability-stack.sh
```

### 📊 `verify-complete-observability-stack.sh`
**Original comprehensive end-to-end verification**
- Tests database metrics, JWT tokens, and dashboard functionality
- Includes frontend OpenTelemetry integration checks
- More detailed testing of specific components
- Useful for development and debugging

```bash
bash scripts/verify-complete-observability-stack.sh
```

### 📈 `verify-complete-observability-stack-v2.sh`
**Modern comprehensive verification (alternative)**
- Streamlined version of comprehensive testing
- Focus on core functionality without external dependencies
- Better error handling and integer expression fixes

```bash
bash scripts/verify-complete-observability-stack-v2.sh
```

## What Gets Tested in Observability Scripts

### Core Services
- ✅ **FastAPI** - Health endpoint and metrics endpoint
- ✅ **Prometheus** - API accessibility and target scraping
- ✅ **Grafana** - Dashboard access and data source configuration
- ✅ **OpenTelemetry Collector** - OTLP HTTP/gRPC receivers and metrics export
- ✅ **Tempo** - Trace storage and readiness

### Data Flow
- ✅ **Metrics Collection** - API metrics → Prometheus → Grafana
- ✅ **Trace Collection** - API traces → OTEL Collector → Tempo → Grafana
- ✅ **Dashboard Functionality** - Grafana dashboard provisioning and accessibility

### Expected Output
All scripts provide:
- ✅ **Green checkmarks** for successful tests
- ⚠️ **Yellow warnings** for minor issues
- ❌ **Red errors** for critical failures
- 💡 **Blue hints** for troubleshooting

## Other Available Scripts

### `setup-grafana-dashboards.sh`
Sets up automated Grafana dashboard configuration:
- Verifies all dashboard files are in place
- Checks data source and provider configurations
- Provides access instructions

```bash
./scripts/setup-grafana-dashboards.sh
```

### `download-popular-dashboards.sh`
Downloads popular community dashboards from Grafana.com:
- Node Exporter Full (ID: 1860)
- Prometheus 2.0 Overview (ID: 3662)  
- Prometheus Stats (ID: 12229)
- FastAPI Observability (ID: 7587)

```bash
./scripts/download-popular-dashboards.sh
```

### `setup-dev.sh`
Sets up the development environment:
- Generates a test token
- Creates necessary environment files
- Restarts the development server if running

```bash
./scripts/setup-dev.sh
```

### `create-test-user.sh`
Creates a test user and generates a JWT token for development testing:
- Creates a test user account (test@example.com)
- Generates a long-lasting JWT token (365 days)
- Automatically saves the token to `frontend/.env.development.local`
- Provides comprehensive authentication setup for development

```bash
./scripts/create-test-user.sh
```

### `demo_db_restore.sh`
Restores the database from a snapshot for demo purposes.

```bash
./scripts/demo_db_restore.sh
```

### `wipe_db.sh`
Wipes the database clean. Use with caution!

```bash
./scripts/wipe_db.sh
```

### `generate_secrets.sh`
Generates necessary secret keys for the application.

```bash
./scripts/generate_secrets.sh
```

## Load Testing

### 🧪 `k6-tests/`
**Dedicated k6 load testing directory**
- All k6 load testing scripts and modules
- Modularized authentication and setup utilities
- Multiple test scenarios (quick, debug, load, comprehensive, concurrent)
- CI integration with automated performance testing
- See [k6-tests/README.md](k6-tests/README.md) for detailed documentation

```bash
cd scripts/k6-tests
./run-k6-tests.sh quick    # Quick functionality test
./run-k6-tests.sh load     # Comprehensive load test
./run-k6-tests.sh all      # Run all test scenarios
```

## Usage Notes

- All scripts should be run from the project root directory
- Make sure the backend services are running when using database-related scripts
- The test token will be valid for 365 days from generation
- Always use with caution in production environments
