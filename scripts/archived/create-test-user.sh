#!/bin/bash

# Test User Creation Wrapper Script
# Creates a test user and generates a JWT token for development/testing

echo "👤 Creating Test User and JWT Token..."
echo "====================================="

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
if [ ! -f "src/todo_api/utils/create_test_user.py" ]; then
    echo "❌ Error: Could not find create_test_user.py at expected location"
    echo "   Expected: $PROJECT_ROOT/backend/src/todo_api/utils/create_test_user.py"
    exit 1
fi

echo "📁 Working directory: $(pwd)"
echo "👤 Creating test user and generating JWT token..."

# Create test user and generate JWT token using the new import structure
python3 -c "
import sys
sys.path.insert(0, 'src')

try:
    from todo_api.utils.create_test_user import create_test_user
    create_test_user()
    print('✅ Test user and JWT token created successfully!')
except ImportError as e:
    print(f'❌ Import error: {e}')
    print('💡 Make sure all dependencies are installed: pip install -r requirements.txt')
    sys.exit(1)
except Exception as e:
    print(f'❌ Test user creation failed: {e}')
    print('💡 Make sure the database is initialized: ./init-db.sh')
    sys.exit(1)
"

# Check if the command was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Test user is ready!"
    echo ""
    echo "📋 Created:"
    echo "  - Test user account (test@example.com)"
    echo "  - Long-lasting JWT token (365 days)"
    echo ""
    echo "💡 The JWT token above can be used for:"
    echo "  - API testing with Authorization: Bearer <token> header"
    echo "  - Frontend local storage with key 'token'"
    echo "  - Postman/curl requests for development"
    echo ""
    echo "🔄 Next steps:"
    echo "  - Start the backend: cd ../backend && uvicorn src.todo_api.main:app --reload"
    echo "  - Start the frontend: cd ../frontend && npm start"
    echo "  - Use the JWT token above for authenticated requests"
else
    echo ""
    echo "❌ Test user creation failed!"
    echo "💡 Please check the error messages above and ensure:"
    echo "  - Database is initialized: ./init-db.sh"
    echo "  - PostgreSQL is running and accessible"
    echo "  - All Python dependencies are installed"
    echo "  - SECRET_KEY is set in environment variables"
    exit 1
fi
