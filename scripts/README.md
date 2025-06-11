# Project Scripts

This directory contains various utility scripts for development, testing, and database management.

## Available Scripts

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

### `generate-test-token.sh`
Generates a JWT token for development testing:
- Runs the backend's create_test_user.py script
- Extracts the JWT token
- Saves it to `frontend/.env.development.local`

```bash
./scripts/generate-test-token.sh
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

## Usage Notes

- All scripts should be run from the project root directory
- Make sure the backend services are running when using database-related scripts
- The test token will be valid for 365 days from generation
- Always use with caution in production environments
