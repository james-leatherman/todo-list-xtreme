#!/bin/bash
# Script to run backend tests locally with proper auth token
# Usage: ./run-tests-local.sh

set -e

echo "🔧 Setting up test environment..."

# Load environment variables from .env file if it exists
if [ -f "../backend/.env" ]; then
    echo "📁 Loading environment variables from backend/.env"
    set -a  # automatically export all variables
    source ../backend/.env
    set +a  # turn off automatic export
fi

# Navigate to backend directory
cd "$(dirname "$0")./backend"

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
source ../backend/venv/bin/activate
pytest "$@" -v

echo "✅ Tests completed!"
