<table>
  <tr>
    <td><img src="https://github.com/james-leatherman/todo-list-xtreme/blob/main/frontend/src/images/tlx-logo.png" alt="TLX Logo" width="64"/></td>
    <td><h1 style="margin-left: 16px;">Todo List Xtreme - LGTM Edition</h1></td>
  </tr>
</table>

A full-stack to-do list application featuring the complete Grafana LGTM observability stack, photo upload capabilities, responsive design, and robust testing utilities.

## MVP Status

This is the enhanced version of Todo List Xtreme, featuring a complete observability stack. It includes all core functionality and is ready for development, testing, and monitoring.

## What's New in v1.6.0 (2025-06-23)

### Observability Enhancements
- **Complete LGTM Stack:** Added Grafana Mimir for long-term metrics storage, completing the LGTM (Loki, Grafana, Tempo, Mimir) observability stack.
- **Enhanced Metrics Storage:** Configured Prometheus remote write to Mimir for durable metrics retention.
- **Grafana Integration:** Added auto-provisioned Mimir data source to Grafana.
- **Unified Observability:** Dashboard improvements to show metrics, logs, and traces in one place.

### Load Testing Improvements
- **Improved Load Testing:** Fixed k6 test script validation for task status values, ensuring all tests run successfully in local and CI environments.
- **Docker Integration:** Enhanced k6 test execution with proper Docker support, fixed path references, and consistent volume mounts.
- **CI Workflow:** Updated GitHub Actions workflow for reliable k6 test execution and results collection.
- **API Compatibility:** Ensured all test scripts use API-valid status values (`todo`, `inProgress`, `blocked`, `done`).

## Previous Updates

- **v1.5.0:** Metrics Module improvements, OAuth enhancements, development tools additions
- **v1.4.0:** Accessibility improvements, development workflow enhancements, security fixes
- **v1.3.0:** TLX Retro 90s theme, UI/UX improvements, code quality fixes

## Grafana LGTM Observability Stack

Todo List Xtreme features a complete Grafana LGTM observability stack:

### L - Loki (Log Aggregation)
- Centralized log collection from all services
- Structured logging with metadata
- Log correlation with traces and metrics
- Query logs with LogQL

### G - Grafana (Visualization)
- Single pane of glass for all observability data
- Pre-configured dashboards for application and system metrics
- Custom dashboard creation
- Alerting capabilities

### T - Tempo (Distributed Tracing)
- End-to-end request tracing
- OpenTelemetry integration
- Trace visualization and analysis
- Service dependency mapping

### M - Mimir (Metrics Storage)
- Long-term metrics storage and querying
- Highly scalable Prometheus-compatible database
- Multi-tenant metrics architecture
- High query performance for historical data

## Features

### Application Features
- Create, read, update, and delete tasks
- Bulk delete all tasks in a column
- Add photos to tasks for visual tracking
- Google OAuth authentication
- Responsive design (works on mobile devices)
- Theme selection, including "TLX Retro 90s"

### Observability Features
- Complete metrics collection via Prometheus and Mimir
- Log aggregation with Loki and Promtail
- Distributed tracing with Tempo and OpenTelemetry
- Custom Grafana dashboards for system and application monitoring
- Load testing with k6 and metrics visualization
- Performance analytics and bottleneck identification

## Tech Stack

### Backend
- Python with FastAPI
- PostgreSQL database
- JWT authentication
- OpenTelemetry instrumentation
- Prometheus metrics
- Docker containerization

### Frontend
- React
- Material-UI components
- Responsive design
- JWT token authentication
- Theme support (including 90s retro)

### Observability
- **Metrics:** Prometheus, Mimir, Pushgateway
- **Logs:** Loki, Promtail
- **Traces:** Tempo, OpenTelemetry Collector
- **Visualization:** Grafana
- **Load Testing:** k6 with Prometheus output

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js and npm
- Python 3.11+

### Quick Setup (Recommended)
```bash
# Set up development environment with one command
./scripts/setup-dev.sh

# Start the full stack including observability components
cd backend
docker-compose up -d
```

### Manual Setup

#### Backend & Observability Stack
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# Create a .env file (see Environment Variables section)
docker-compose up -d
python init_db.py
uvicorn src.todo_api.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Frontend
```bash
cd frontend
npm install
# Create a .env file (see Environment Variables section)
npm start
```

### Accessing Grafana and Observability Tools
- **Grafana:** http://localhost:3001 (default credentials: admin/admin)
- **Prometheus:** http://localhost:9090
- **Tempo:** http://localhost:3200
- **Loki:** http://localhost:3100
- **Mimir:** http://localhost:9009

## Development Scripts

The `scripts/` directory contains utilities for development:

- **`setup-dev.sh`** - Complete development environment setup
- **`create-test-user.sh`** - Create test user and generate JWT tokens for testing
- **`demo_db_restore.sh`** - Restore database from snapshot
- **`wipe_db.sh`** - Clean database
- **`generate_secrets.sh`** - Generate secret keys

Run from project root: `./scripts/[script-name].sh`

## Environment Configuration
- `./generate_secrets.sh` — Generates secure random credentials and .env files for dev/prod.

### Environment Variables

#### Backend (.env)
```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_SERVER=db
POSTGRES_PORT=5432
POSTGRES_DB=todolist
DATABASE_URL=postgresql://postgres:postgres@db:5432/todolist
CORS_ORIGINS=http://localhost:3000
SECRET_KEY=your_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318
OTEL_RESOURCE_ATTRIBUTES=service.name=todo-list-xtreme-api
```

#### Frontend (.env.local)
```
REACT_APP_API_URL=http://localhost:8000
```

## Testing

### Load Testing with k6
- `scripts/k6-tests/k6-unified-test.js`: Unified load testing script that can run different testing scenarios:
  - Quick smoke tests
  - Load tests with stages
  - Comprehensive feature tests
  - Stress tests with high VU count
- **Run load tests:**
  ```bash
  # Run quick smoke test
  ./scripts/k6-tests/run-k6-tests.sh quick
  
  # Run comprehensive test
  ./scripts/k6-tests/run-k6-tests.sh comprehensive
  
  # Run load test using Docker
  ./scripts/k6-tests/run-k6-tests.sh load --docker
  
  # Run stress test
  ./scripts/k6-tests/run-k6-tests.sh stress
  ```

### Backend Tests
```bash
cd backend
source venv/bin/activate
# Run all tests with pytest
pytest
# Or run individual scripts:
python test_api.py
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Observability Guide

### Metrics
- **System Metrics:** Available in the "System Overview" dashboard
- **API Metrics:** Response times, error rates, and request counts in "FastAPI Dashboard"
- **Database Metrics:** Connection pools, query times, and throughput in "PostgreSQL Dashboard"
- **Custom Business Metrics:** Task creation/completion rates in "Business Metrics Dashboard"

### Logs
- **Application Logs:** Filter by service name, log level, or trace ID in Explore > Loki
- **System Logs:** Docker container logs automatically collected
- **Query Examples:**
  - `{container_name="api"} |= "ERROR"` - Show API errors
  - `{job="api"} |~ "user_id=\\d+"` - Show logs with user IDs

### Traces
- **End-to-End Request Tracing:** View in Explore > Tempo
- **Service Graph:** See dependencies and performance in the Service Graph view
- **Trace Search:** Filter by duration, status code, or service name

### Dashboards
- **Overview:** General application health and metrics
- **API Performance:** Endpoint-specific metrics and SLIs
- **User Activity:** User engagement and action metrics
- **System Resources:** CPU, memory, and disk utilization
- **k6 Load Tests:** Visualize performance under load

## Project Structure

```
todo-list-xtreme/
├── backend/
│   ├── src/
│   │   ├── todo_api/
│   │   ├── models/
│   │   └── utils/
│   ├── tests/
│   ├── docker-compose.yml    # Full stack including LGTM components
│   ├── prometheus.yml
│   ├── tempo.yml
│   ├── loki-config.yml
│   ├── mimir-config.yml
│   ├── otel-collector-config.yml
│   ├── grafana/
│   │   └── provisioning/     # Auto-provisioned dashboards and data sources
│   └── requirements.txt
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
├── scripts/
│   ├── setup-dev.sh
│   ├── k6-tests/
│   │   ├── k6-unified-test.js
│   │   └── modules/
│   └── create-test-user.sh
└── docs/
    └── observability/        # Documentation for the LGTM stack
```

## Contributing

Contributions are welcome! Here's how you can contribute:

1. **Fork the repository**
2. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Commit your changes**:
   ```bash
   git commit -m 'Add some feature'
   ```
4. **Push to the branch**:
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Create a Pull Request**

## Roadmap

### Completed in v1.6.0
- [x] Implement complete LGTM observability stack
- [x] Integrate Mimir for long-term metrics storage
- [x] Add k6 load testing with metrics visualization
- [x] Enhance Docker integration for observability tools
- [x] Fix API compatibility in testing scripts

### Previously Completed
- [x] Create custom Grafana dashboards
- [x] Implement OpenTelemetry instrumentation
- [x] Set up log aggregation with Loki
- [x] Add distributed tracing with Tempo
- [x] Add retro UI themes with multiple options

## License

MIT License

## Acknowledgments

- FastAPI for the amazing Python web framework
- React and Material-UI for the frontend components
- Grafana for the incredible LGTM observability stack
- OpenTelemetry for the instrumentation framework
- k6 for the powerful load testing capabilities


