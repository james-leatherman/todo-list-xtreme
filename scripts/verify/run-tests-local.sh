#!/bin/bash
# Script to run backend tests locally with proper auth token
# Usage: ./run-tests-local.sh

set -e

# Set project root and backend directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}" )" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"

# Fix NODE_OPTIONS issue that can cause MODULE_NOT_FOUND errors
if [[ "$NODE_OPTIONS" == *"bootloader.js"* ]]; then
    echo "🔧 Clearing problematic NODE_OPTIONS to fix VS Code debugger conflict..."
    unset NODE_OPTIONS
    export NODE_OPTIONS=""
fi

echo "🔧 Setting up test environment..."

# Load environment variables from .env file if it exists
echo "🔍 Looking for .env file at: $BACKEND_DIR/.env"
if [ -f "$BACKEND_DIR/.env" ]; then
    echo "📁 Loading environment variables from backend/.env"
    set -a  # automatically export all variables
    source "$BACKEND_DIR/.env"
    set +a  # turn off automatic export
    echo "📋 SECRET_KEY loaded: ${SECRET_KEY:0:20}..."
else
    echo "❌ .env file not found at $BACKEND_DIR/.env"
fi

# Navigate to backend directory
cd "$BACKEND_DIR"

# Check if PyJWT is installed
if ! python3 -c "import jwt" 2>/dev/null; then
    echo "📦 Installing PyJWT..."
    pip install PyJWT
fi

# Check if SECRET_KEY is available
if [ -z "$SECRET_KEY" ]; then
    echo "❌ ERROR: SECRET_KEY environment variable is not set"
    echo "💡 Please either:"
    echo "   1. Set SECRET_KEY environment variable: export SECRET_KEY=your_secret_key"
    echo "   2. Create backend/.env file with SECRET_KEY=your_secret_key"
    echo "   3. Source the backend/.env file: source backend/.env"
    exit 1
fi

# Generate test token
echo "🔐 Generating test JWT token..."
export TEST_AUTH_TOKEN=$(python3 -c "
import jwt
from datetime import datetime, timedelta, timezone
import os

# JWT configuration from environment
secret_key = os.environ.get('SECRET_KEY')
if not secret_key:
    print('ERROR: SECRET_KEY environment variable not set')
    exit(1)

algorithm = 'HS256'

# Create token payload
now = datetime.now(timezone.utc)
payload = {
    'sub': 'test@example.com',
    'iat': now,
    'exp': now + timedelta(hours=24),
    'user_id': 1
}

# Generate token
token = jwt.encode(payload, secret_key, algorithm=algorithm)
if isinstance(token, bytes):
    token = token.decode('utf-8')
    
print(token)
")

echo "✅ Test token generated"
echo "🔑 Token (first 50 chars): ${TEST_AUTH_TOKEN:0:50}..."

# Run tests
echo "🧪 Running backend tests..."
source "$BACKEND_DIR/venv/bin/activate"
pytest "$@" -v --tb=short -s

echo "✅ Tests completed!"
