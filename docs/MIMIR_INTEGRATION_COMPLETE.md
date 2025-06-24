# Mimir Integration

## Overview
[Grafana Mimir](https://grafana.com/oss/mimir/) has been integrated into Todo List Xtreme's observability stack. Mimir is an open-source, horizontally scalable time series database that provides long-term storage for Prometheus metrics.

## Features
- Horizontally scalable, high-performance time series database
- Long-term storage for Prometheus metrics
- Multi-tenant architecture
- Efficient querying of historical metrics data
- Compatible with Prometheus API

## Configuration
Mimir is configured with the following components:
- **Basic storage**: File-system backend for blocks storage
- **HTTP Endpoint**: Accessible on port 9009
- **gRPC Endpoint**: Accessible on port 9095
- **Integration**: Connected to Prometheus via remote_write

## Access
- Mimir HTTP API: http://localhost:9009
- Grafana Data Source: Pre-configured as "Mimir" in Grafana

## Usage
### In Grafana
1. Log in to Grafana at http://localhost:3001
2. The Mimir data source is pre-configured and ready to use
3. When creating dashboards, you can select the Mimir data source for panels that require long-term metrics

### Direct API Access
- Query API: http://localhost:9009/prometheus/api/v1/query
- Query Range API: http://localhost:9009/prometheus/api/v1/query_range

## Docker Configuration
Mimir runs as a Docker container defined in the `docker-compose.yml` file:
```yaml
mimir:
  image: grafana/mimir:latest
  volumes:
    - ./mimir-config.yml:/etc/mimir/config.yml
    - mimir_data:/var/mimir/data
  command: ["-config.file=/etc/mimir/config.yml"]
  ports:
    - "9009:9009"
    - "9095:9095"
  depends_on:
    - prometheus
```

## Data Persistence
All Mimir data is stored in the `mimir_data` Docker volume to persist across container restarts.

---

Added: June 23, 2025
