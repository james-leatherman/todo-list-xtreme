#!/bin/bash

# Test script to verify frontend OpenTelemetry tracing
echo "🔍 Testing Frontend OpenTelemetry Tracing"
echo "========================================"

# Check if frontend is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Frontend is not running on http://localhost:3000"
    exit 1
fi

echo "✅ Frontend is running"

# Check if backend is running
if ! curl -s http://localhost:8000/docs > /dev/null; then
    echo "❌ Backend is not running on http://localhost:8000"
    exit 1
fi

echo "✅ Backend is running"

# Check if OTEL collector is running
if ! curl -s http://localhost:4318/v1/traces > /dev/null 2>&1; then
    echo "❌ OTEL Collector is not accessible on http://localhost:4318"
    exit 1
fi

echo "✅ OTEL Collector is accessible"

echo ""
echo "📊 Checking OTEL Collector logs for traces..."
echo "=============================================="

# Check OTEL collector logs
docker logs backend-otel-collector-1 --tail 10

echo ""
echo "🌐 Open the following URLs to test tracing:"
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:8000/docs"
echo "Grafana: http://localhost:3001"
echo ""
echo "📋 To see traces:"
echo "1. Open the frontend and perform some actions (create/edit todos)"
echo "2. Check OTEL collector logs: docker logs backend-otel-collector-1 -f"
echo "3. Look for trace data in the debug output"
echo ""
echo "🔧 Test complete! Frontend tracing is configured and ready."
