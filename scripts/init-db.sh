#!/bin/bash

# Database Initialization Wrapper Script
# Initializes the Todo List Xtreme database with all required tables

echo "🗃️  Initializing Todo List Xtreme Database..."
echo "============================================"

# Get project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Navigate to backend directory
cd "$PROJECT_ROOT/backend"

# Check if virtual environment exists and activate it
if [ -d "venv" ]; then
    echo "🔧 Activating virtual environment..."
    source venv/bin/activate
fi

# Check if we're in the right directory
if [ ! -f "src/todo_api/utils/init_db.py" ]; then
    echo "❌ Error: Could not find init_db.py at expected location"
    echo "   Expected: $PROJECT_ROOT/backend/src/todo_api/utils/init_db.py"
    exit 1
fi

echo "📁 Working directory: $(pwd)"
echo "📦 Initializing database tables..."

# Initialize database using the new import structure
python3 -c "
import sys
sys.path.insert(0, 'src')

try:
    from todo_api.utils.init_db import init_db
    init_db()
    print('✅ Database initialization completed successfully!')
except ImportError as e:
    print(f'❌ Import error: {e}')
    print('💡 Make sure all dependencies are installed: pip install -r requirements.txt')
    sys.exit(1)
except Exception as e:
    print(f'❌ Database initialization failed: {e}')
    sys.exit(1)
"

# Check if the command was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Database is ready!"
    echo ""
    echo "📋 Created tables:"
    echo "  - users (user accounts)"
    echo "  - todos (todo items)"
    echo "  - todo_photos (photo attachments)"
    echo "  - column_settings (UI column configuration)"
    echo ""
    echo "💡 Next steps:"
    echo "  1. Create test user: ./create-test-user.sh (creates user and JWT token)"
    echo "  2. Start the backend: cd ../backend && uvicorn src.todo_api.main:app --reload"
    echo "  3. Start the frontend: cd ../frontend && npm start"
else
    echo ""
    echo "❌ Database initialization failed!"
    echo "💡 Please check the error messages above and ensure:"
    echo "  - PostgreSQL is running and accessible"
    echo "  - Database connection settings are correct in .env"
    echo "  - All Python dependencies are installed"
    exit 1
fi
