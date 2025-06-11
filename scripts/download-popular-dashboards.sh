#!/bin/bash

# Download additional popular Grafana dashboards
# Usage: ./download-popular-dashboards.sh

DASHBOARDS_DIR="/root/todo-list-xtreme/backend/grafana/provisioning/dashboards"

echo "📥 Downloading popular community dashboards..."

# Check if jq is available (needed for JSON processing)
if ! command -v jq &> /dev/null; then
    echo "⚠️  jq is required but not installed. Installing..."
    apt-get update && apt-get install -y jq
fi

# Function to download dashboard by ID
download_dashboard() {
    local id=$1
    local name=$2
    local revision=${3:-1}
    
    echo "Downloading $name (ID: $id)..."
    
    curl -s "https://grafana.com/api/dashboards/$id/revisions/$revision/download" \
        -o "/tmp/dashboard_$id.json"
    
    if [ $? -eq 0 ]; then
        # Extract just the dashboard object and save it
        jq '.dashboard' "/tmp/dashboard_$id.json" > "$DASHBOARDS_DIR/$name.json"
        echo "✅ Downloaded $name"
        rm "/tmp/dashboard_$id.json"
    else
        echo "❌ Failed to download $name"
    fi
}

mkdir -p "$DASHBOARDS_DIR"

# Download popular dashboards
download_dashboard 1860 "node-exporter-full" 37
download_dashboard 3662 "prometheus-2-overview" 2  
download_dashboard 12229 "prometheus-stats" 1
download_dashboard 7587 "fastapi-observability" 1

echo ""
echo "🎉 Community dashboards downloaded!"
echo "Restart your Grafana container to see the new dashboards."
echo ""
echo "To restart: docker compose restart grafana"
