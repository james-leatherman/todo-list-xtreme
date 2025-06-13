#!/bin/bash

# Script to download and configure Grafana dashboards automatically
# Run this from the backend directory

DASHBOARDS_DIR="./grafana/provisioning/dashboards"
mkdir -p "$DASHBOARDS_DIR"

echo "Downloading popular Grafana dashboards..."

# Download Node Exporter Full dashboard (ID: 1860)
echo "Downloading Node Exporter Full dashboard..."
curl -s "https://grafana.com/api/dashboards/1860/revisions/37/download" | \
  jq '.dashboard' > "$DASHBOARDS_DIR/node-exporter-full.json"

# Download Prometheus 2.0 Overview dashboard (ID: 3662)
echo "Downloading Prometheus 2.0 Overview dashboard..."
curl -s "https://grafana.com/api/dashboards/3662/revisions/2/download" | \
  jq '.dashboard' > "$DASHBOARDS_DIR/prometheus-overview.json"

# Download FastAPI Observability dashboard (ID: 16110)
echo "Downloading FastAPI Observability dashboard..."
curl -s "https://grafana.com/api/dashboards/16110/revisions/1/download" | \
  jq '.dashboard' > "$DASHBOARDS_DIR/fastapi-observability.json"

# Download Docker Container & Host Metrics dashboard (ID: 10619)
echo "Downloading Docker Container & Host Metrics dashboard..."
curl -s "https://grafana.com/api/dashboards/10619/revisions/1/download" | \
  jq '.dashboard' > "$DASHBOARDS_DIR/docker-metrics.json"

echo "Dashboards downloaded successfully!"
echo "They will be automatically imported when Grafana starts."
