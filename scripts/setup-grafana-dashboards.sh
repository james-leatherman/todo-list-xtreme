#!/bin/bash

# Automated Grafana Dashboard Setup Script
# This script sets up Grafana dashboards automatically for the Todo List Xtreme project

# Get project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
GRAFANA_DIR="$BACKEND_DIR/grafana/provisioning"

echo "🚀 Setting up Grafana dashboards automatically..."

# Ensure directories exist
mkdir -p "$GRAFANA_DIR/datasources"
mkdir -p "$GRAFANA_DIR/dashboards"

echo "✅ Created provisioning directories"

# The dashboard files are already created by our previous commands
# Let's verify they exist
if [ -f "$GRAFANA_DIR/dashboards/prometheus-overview.json" ] && \
   [ -f "$GRAFANA_DIR/dashboards/fastapi-metrics.json" ] && \
   [ -f "$GRAFANA_DIR/dashboards/otel-collector.json" ]; then
    echo "✅ Dashboard files verified"
else
    echo "❌ Some dashboard files are missing"
    exit 1
fi

# Verify data source configuration
if [ -f "$GRAFANA_DIR/datasources/prometheus.yml" ]; then
    echo "✅ Prometheus data source configuration verified"
else
    echo "❌ Prometheus data source configuration missing"
    exit 1
fi

# Verify dashboard provider configuration  
if [ -f "$GRAFANA_DIR/dashboards/dashboard.yml" ]; then
    echo "✅ Dashboard provider configuration verified"
else
    echo "❌ Dashboard provider configuration missing"
    exit 1
fi

echo ""
echo "🎉 Grafana dashboard automation setup complete!"
echo ""
echo "Available dashboards:"
echo "  📊 Prometheus Overview - General Prometheus metrics"
echo "  🚀 FastAPI Application Metrics - Your API performance"
echo "  🔄 OpenTelemetry Collector Metrics - OTEL pipeline health"
echo "  📋 Todo List Xtreme Overview - Custom application dashboard"
echo ""
echo "To access:"
echo "  1. Start your stack: docker compose up"
echo "  2. Open Grafana: http://localhost:3001"
echo "  3. Login: admin/admin"
echo "  4. Navigate to Dashboards → Browse"
echo ""
echo "All dashboards and data sources will be automatically configured!"
