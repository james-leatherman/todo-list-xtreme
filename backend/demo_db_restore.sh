#!/bin/bash
# Demo script to recreate all data from the latest database snapshot
# Usage: ./demo_db_restore.sh

set -e

DB_PATH="app/database.db"
SNAPSHOT="demo_db_snapshot.sql"

if [ ! -f "$SNAPSHOT" ]; then
  echo "Snapshot file $SNAPSHOT not found!"
  exit 1
fi

# Remove the existing database if it exists
if [ -f "$DB_PATH" ]; then
  echo "Removing existing database at $DB_PATH..."
  rm "$DB_PATH"
fi

echo "Restoring database from $SNAPSHOT..."
sqlite3 "$DB_PATH" < "$SNAPSHOT"
echo "Database restored successfully."
