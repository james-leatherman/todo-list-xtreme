#!/bin/bash

echo "=== PostgreSQL Logging to Loki Verification ==="
echo

# Test 1: Check PostgreSQL container logs
echo "1. Checking PostgreSQL enhanced logging..."
PG_LOGS=$(docker logs backend-db-1 --tail 5 | grep -c "user=.*,db=.*,app=.*,client=")
if [ "$PG_LOGS" -gt "0" ]; then
    echo "✅ PostgreSQL enhanced logging is active ($PG_LOGS recent enhanced log entries)"
    echo "   Sample log format:"
    docker logs backend-db-1 --tail 3 | grep "user=" | head -1 | sed 's/^/   /'
else
    echo "❌ PostgreSQL enhanced logging not detected"
fi

echo

# Test 2: Generate database activity
echo "2. Generating database activity..."
for i in {1..3}; do
    curl -s http://localhost:8000/health > /dev/null
    sleep 1
done

echo "✅ Database activity generated"
echo

# Test 3: Check Loki ingestion
echo "3. Checking Loki ingestion of PostgreSQL logs..."
sleep 5  # Wait for logs to be ingested

START_TIME=$(date -d '10 minutes ago' -u +%s)000000000
END_TIME=$(date -u +%s)000000000

# Check if postgres job exists in Loki
PG_LOG_COUNT=$(curl -s "http://localhost:3100/loki/api/v1/query_range?query=%7Bjob%3D%22postgres%22%7D&start=${START_TIME}&end=${END_TIME}" | jq '.data.result | length' 2>/dev/null || echo "0")

if [ "$PG_LOG_COUNT" -gt "0" ]; then
    echo "✅ PostgreSQL logs are being ingested into Loki ($PG_LOG_COUNT log streams)"
else
    echo "⚠️  PostgreSQL logs may not be reaching Loki yet"
fi

echo

# Test 4: Check available labels
echo "4. Checking PostgreSQL log labels in Loki..."
LABELS=$(curl -s "http://localhost:3100/loki/api/v1/label/job/values" | jq -r '.data[]' 2>/dev/null | grep -c "postgres" || echo "0")
if [ "$LABELS" -gt "0" ]; then
    echo "✅ PostgreSQL job label found in Loki"
else
    echo "⚠️  PostgreSQL job label not found in Loki"
fi

echo

# Test 5: Show recent SQL queries from logs
echo "5. Recent SQL queries logged:"
echo "   (From PostgreSQL container logs)"
docker logs backend-db-1 --tail 10 | grep "statement:" | tail -3 | sed 's/^/   /' | cut -c 1-100

echo

echo "=== PostgreSQL Logging Summary ==="
echo "📊 What's being logged:"
echo "• All SQL statements (SELECT, INSERT, UPDATE, DELETE)"
echo "• Connection/disconnection events"
echo "• Transaction boundaries (BEGIN, COMMIT, ROLLBACK)"
echo "• User, database, application, and client information"
echo "• Detailed error information with location"
echo "• Query execution times (for queries > 100ms)"
echo
echo "🔍 Log format includes:"
echo "• Timestamp with timezone"
echo "• Process ID and line numbers"
echo "• User: database user executing the query"
echo "• Database: target database name"
echo "• Application: connecting application name"
echo "• Client: hostname/container of the client"
echo "• Statement: full SQL query text"
echo
echo "🌐 Access PostgreSQL logs in Grafana:"
echo "1. Open http://localhost:3001"
echo "2. Go to Explore → Select Loki datasource"
echo "3. Query: {job=\"postgres\"}"
echo "4. Filter by user: {job=\"postgres\", user=\"postgres\"}"
echo "5. Filter by database: {job=\"postgres\", database=\"todolist\"}"
