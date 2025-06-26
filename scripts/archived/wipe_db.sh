#!/bin/bash
# Script to wipe the Todo List Xtreme database without confirmation
# USE WITH CAUTION: This script will delete all data without confirmation

echo "Starting database wipe for Todo List Xtreme..."

# Get project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load environment variables from .env if it exists
ENV_FILE="$PROJECT_ROOT/.env"
if [ -f "$ENV_FILE" ]; then
    echo "Loading environment variables from $ENV_FILE"
    source "$ENV_FILE"
elif [ -f "$PROJECT_ROOT/backend/.env" ]; then
    echo "Loading environment variables from backend/.env"
    source "$PROJECT_ROOT/backend/.env"
fi

# Default database connection parameters if not set in environment
DB_USER=${POSTGRES_USER:-postgres}
DB_PASSWORD=${POSTGRES_PASSWORD:-postgres}
DB_HOST=${POSTGRES_SERVER:-localhost}
DB_PORT=${POSTGRES_PORT:-5432}
DB_NAME=${POSTGRES_DB:-todolist}

# Function to execute SQL
execute_sql() {
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "$1"
}

echo "Connected to database $DB_NAME at $DB_HOST:$DB_PORT"
echo "WARNING: About to delete ALL data in the database!"

# Get all tables in the public schema
TABLES=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public';")

# Drop all tables
echo "Dropping all tables..."
for TABLE in $TABLES; do
    echo "  Dropping table: $TABLE"
    execute_sql "DROP TABLE IF EXISTS $TABLE CASCADE;"
done

echo "Database wipe completed."
echo "To re-initialize the database, run:"
echo "python init_db.py"

exit 0
