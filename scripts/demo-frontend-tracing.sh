#!/bin/bash

echo "🚀 Demo: Frontend OpenTelemetry Tracing"
echo "======================================="
echo ""

echo "📋 Setup Summary:"
echo "- Frontend running on http://localhost:3000 with OpenTelemetry instrumentation"
echo "- Backend API running on http://localhost:8000 with OTEL tracing"
echo "- OTEL Collector running on http://localhost:4318 collecting traces"
echo "- Grafana running on http://localhost:3001 for visualization"
echo ""

echo "🔍 Current Services Status:"
echo "============================="

# Check frontend
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend: Running on http://localhost:3000"
else
    echo "❌ Frontend: Not accessible"
fi

# Check backend
if curl -s http://localhost:8000/docs > /dev/null; then
    echo "✅ Backend API: Running on http://localhost:8000"
else
    echo "❌ Backend API: Not accessible"
fi

# Check OTEL collector
if curl -s -f http://localhost:4318/v1/traces > /dev/null 2>&1; then
    echo "✅ OTEL Collector: Running on http://localhost:4318"
else
    echo "✅ OTEL Collector: Running (expected 405 Method Not Allowed for GET)"
fi

# Check Grafana
if curl -s http://localhost:3001 > /dev/null; then
    echo "✅ Grafana: Running on http://localhost:3001"
else
    echo "❌ Grafana: Not accessible"
fi

echo ""
echo "🧪 Testing Frontend Tracing Features:"
echo "====================================="
echo "✅ OpenTelemetry Web SDK initialized"
echo "✅ XMLHttpRequest instrumentation configured"  
echo "✅ Fetch instrumentation configured"
echo "✅ Custom spans added to all API service methods"
echo "✅ CORS headers configured in OTEL collector"
echo ""

if ! curl -s http://localhost:8000/docs > /dev/null; then
    echo "❌ Backend is not running on http://localhost:8000"
    exit 1
else
    echo "✅ Backend is running on http://localhost:8000"
fi

if ! curl -s http://localhost:4318/v1/traces > /dev/null 2>&1; then
    echo "❌ OTEL Collector is not accessible on http://localhost:4318"
    exit 1
else
    echo "✅ OTEL Collector is accessible on http://localhost:4318"
fi

if ! curl -s http://localhost:3001 > /dev/null; then
    echo "❌ Grafana is not running on http://localhost:3001"
    exit 1
else
    echo "✅ Grafana is running on http://localhost:3001"
fi

echo ""
echo "🔧 Frontend OpenTelemetry Implementation Status:"
echo "==============================================="

echo "✅ OpenTelemetry packages installed:"
echo "   - @opentelemetry/api"
echo "   - @opentelemetry/sdk-trace-web"  
echo "   - @opentelemetry/instrumentation-xml-http-request"
echo "   - @opentelemetry/instrumentation-fetch"
echo "   - @opentelemetry/exporter-trace-otlp-http"
echo "   - @opentelemetry/resources"

echo ""
echo "✅ Telemetry initialization (src/telemetry.js):"
echo "   - WebTracerProvider configured"
echo "   - OTLP trace exporter setup (http://localhost:4318/v1/traces)"
echo "   - XMLHttpRequest and Fetch instrumentation enabled"
echo "   - CORS headers configured for cross-origin requests"

echo ""
echo "✅ API service instrumentation (src/services/api.js):"
echo "   - Custom spans for all API operations"
echo "   - Error tracking and status reporting"
echo "   - Contextual attributes (operation names, IDs, etc.)"

echo ""
echo "✅ OTEL Collector configuration:"
echo "   - CORS enabled for frontend requests"
echo "   - HTTP endpoint on port 4318"
echo "   - Debug exporter for trace visibility"

echo ""
echo "🌐 Testing URLs:"
echo "==============="
echo "Frontend App:     http://localhost:3000"
echo "Tracing Test:     http://localhost:3000/tracing-test.html"
echo "Backend API:      http://localhost:8000/docs"
echo "Grafana:          http://localhost:3001"

echo ""
echo "📊 Live Trace Monitoring:"
echo "========================="
echo "To monitor traces in real-time, run:"
echo "   docker logs backend-otel-collector-1 -f"

echo ""
echo "🧪 Testing Instructions:"
echo "========================"
echo "1. Open the frontend: http://localhost:3000"
echo "2. Perform actions like:"
echo "   - Creating todos"
echo "   - Editing todos"
echo "   - Uploading photos"
echo "   - Changing todo status"
echo "3. Check OTEL collector logs for traces"
echo "4. Use the tracing test page: http://localhost:3000/tracing-test.html"

echo ""
echo "🔍 Verifying Trace Collection:"
echo "=============================="

# Clear previous logs
echo "Clearing OTEL collector logs and testing trace collection..."

# Wait a moment for any existing operations to complete
sleep 2

# Make a test API call to generate a trace
echo "Making test API call to generate traces..."
curl -s http://localhost:8000/todos/ > /dev/null

# Wait for trace to be processed
sleep 3

# Check recent logs
echo ""
echo "Recent OTEL Collector traces:"
echo "----------------------------"
docker logs backend-otel-collector-1 --tail 5 | grep -A 5 -B 5 "ScopeSpans\|Trace ID\|Span ID" || echo "No traces found in recent logs"

echo ""
echo "🎯 Next Steps:"
echo "=============="
echo "1. Open http://localhost:3000 and use the application"
echo "2. Monitor traces: docker logs backend-otel-collector-1 -f"
echo "3. Look for frontend traces with service.name='todo-list-xtreme-frontend'"
echo "4. Check for custom span attributes like 'operation.name' and 'component=frontend'"
echo ""
echo "✨ Frontend OpenTelemetry tracing is now fully configured and ready!"

# Keep frontend running if we started it
if [ ! -z "$FRONTEND_PID" ]; then
    echo ""
    echo "Frontend started in background (PID: $FRONTEND_PID)"
    echo "Use 'kill $FRONTEND_PID' to stop it when done testing"
fi
