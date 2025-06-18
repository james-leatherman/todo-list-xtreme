# Running Backend Tests

This document explains how to run the backend tests for Todo List Xtreme.

## Prerequisites

- Python 3.11+
- PostgreSQL running (via Docker Compose)
- Backend API running
- PyJWT library installed

## Quick Start

### Option 1: Use the test script (Recommended)
```bash
# From the project root
./run-tests-local.sh
```

### Option 2: Manual setup
```bash
# Install PyJWT if not already installed
pip install PyJWT

# Load environment variables from .env file
source backend/.env

# Or set SECRET_KEY manually (get this from your backend/.env file)
export SECRET_KEY=your_secret_key_here

# Generate test JWT token
export TEST_AUTH_TOKEN=$(python3 -c "
import jwt
from datetime import datetime, timedelta, timezone
import os

secret_key = os.environ.get('SECRET_KEY')
if not secret_key:
    print('ERROR: SECRET_KEY environment variable not set')
    exit(1)

algorithm = 'HS256'

now = datetime.now(timezone.utc)
payload = {
    'sub': 'test@example.com',
    'iat': now,
    'exp': now + timedelta(hours=24),
    'user_id': 1
}

token = jwt.encode(payload, secret_key, algorithm=algorithm)
if isinstance(token, bytes):
    token = token.decode('utf-8')
print(token)
")

# Run tests from backend directory
cd backend
pytest
```

## Test Types

### Unit Tests
- Location: `tests/unit/`
- No special setup required
- Run with: `pytest tests/unit/`

### Integration Tests
- Location: `tests/integration/`
- Requires `TEST_AUTH_TOKEN` environment variable
- Requires running backend API and database
- Tests API endpoints and database interactions

### Integration Test Files
- `test_comprehensive_column_persistence.py` - Tests column persistence
- `test_empty_column_persistence.py` - Tests empty column handling
- `test_column_settings.py` - Tests column settings API

## GitHub Actions

The CI pipeline automatically:
1. Sets up Python 3.11
2. Installs dependencies
3. Starts PostgreSQL and API services
4. Generates JWT token using the `JWT_SECRET_KEY` secret from GitHub repository settings
5. Runs all tests with proper authentication

### Setting up GitHub Secrets

To run tests in GitHub Actions, you need to set up the `JWT_SECRET_KEY` secret in your repository:

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `JWT_SECRET_KEY`
5. Value: Your JWT secret key (same as `SECRET_KEY` in your backend/.env file)

## Troubleshooting

### "SECRET_KEY environment variable not set"
This error occurs when the JWT secret key is not available.

**Solution**: 
- For local testing: Use `./run-tests-local.sh` which automatically loads from backend/.env
- For manual setup: `source backend/.env` or `export SECRET_KEY=your_secret_key`
- For GitHub Actions: Ensure `JWT_SECRET_KEY` secret is set in repository settings

### "TEST_AUTH_TOKEN environment variable not set"
This error occurs when integration tests can't find the authentication token.

**Solution**: Use the `./run-tests-local.sh` script or manually set the `TEST_AUTH_TOKEN` environment variable as shown above.

### "Authentication failed" errors
This happens when the JWT token is invalid or expired.

**Solution**: Generate a new token using the methods above. Tokens are valid for 24 hours.

### Database connection errors
Integration tests require a running PostgreSQL database and API.

**Solution**: 
```bash
cd backend
docker-compose up -d db api
# Wait for services to start, then run tests
```

## Token Details

The test JWT token includes:
- Subject: `test@example.com`
- User ID: `1`
- Expiration: 24 hours from generation
- Algorithm: HS256
- Secret: Read from `SECRET_KEY` environment variable (never hardcoded)

## Security Notes

- JWT secrets are never hardcoded in the repository
- Local testing reads secrets from backend/.env file
- GitHub Actions uses repository secrets
- Tokens are generated dynamically and expire after 24 hours
