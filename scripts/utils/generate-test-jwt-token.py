#!/usr/bin/env python3
"""
Generate a test JWT token for development and testing purposes.
This script reads the JWT configuration from the backend .env file
and generates a valid token for testing API endpoints.
"""

import os
import sys
from datetime import datetime, timedelta, timezone
import jwt
from pathlib import Path

def load_env_file(env_path):
    """Load environment variables from a .env file"""
    env_vars = {}
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key] = value.strip('"').strip("'")
    return env_vars

def generate_test_token():
    """Generate a test JWT token"""
    # Load backend environment variables
    # Get the project root (two levels up from scripts/utils/)
    project_root = Path(__file__).parent.parent.parent
    backend_env_path = project_root / "backend" / ".env"
    
    print(f"🔍 Looking for backend .env at: {backend_env_path}")
    
    env_vars = load_env_file(backend_env_path)
    
    if not env_vars.get('SECRET_KEY'):
        print(f"❌ Error: SECRET_KEY not found in {backend_env_path}", file=sys.stderr)
        print(f"Available keys: {list(env_vars.keys())}", file=sys.stderr)
        sys.exit(1)
    
    # Token configuration
    secret_key = env_vars['SECRET_KEY']
    algorithm = env_vars.get('ALGORITHM', 'HS256')
    
    # Create token payload
    now = datetime.now(timezone.utc)
    expire_hours = 24  # 24 hours for testing
    
    payload = {
        'sub': 'test@example.com',  # Subject (user email)
        'iat': now,                 # Issued at
        'exp': now + timedelta(hours=expire_hours),  # Expiration
        'user_id': 1               # Test user ID
    }
    
    # Generate token
    token = jwt.encode(payload, secret_key, algorithm=algorithm)
    
    # Ensure it's a string (PyJWT sometimes returns bytes)
    if isinstance(token, bytes):
        token = token.decode('utf-8')
    
    return token, payload['exp']

def update_env_development_local(token):
    """Update the .env.development.local file with the new token"""
    env_file_path = Path(__file__).parent.parent / ".env.development.local"
    
    if not os.path.exists(env_file_path):
        print(f"❌ Error: {env_file_path} not found", file=sys.stderr)
        sys.exit(1)
    
    # Read current content
    with open(env_file_path, 'r') as f:
        content = f.read()
    
    # Update or add the token
    lines = content.split('\n')
    token_line_found = False
    
    for i, line in enumerate(lines):
        if line.startswith('TEST_JWT_TOKEN='):
            lines[i] = f'TEST_JWT_TOKEN={token}'
            token_line_found = True
            break
    
    if not token_line_found:
        # Add token line before the last empty line or at the end
        lines.append(f'TEST_JWT_TOKEN={token}')
    
    # Write back to file
    with open(env_file_path, 'w') as f:
        f.write('\n'.join(lines))

def main():
    """Main function"""
    print("🔐 Generating test JWT token...")
    
    try:
        token, expiry = generate_test_token()
        
        print(f"✅ Token generated successfully!")
        print(f"📅 Expires: {expiry.strftime('%Y-%m-%d %H:%M:%S')} UTC")
        print(f"🔑 Token (first 50 chars): {token[:50]}...")
        
        # Update the .env.development.local file
        update_env_development_local(token)
        print("✅ Updated .env.development.local with new token")
        
        print("\n💡 Usage:")
        print("   Source the environment: source .env.development.local")
        print("   Or use in scripts: TOKEN=${TEST_JWT_TOKEN}")
        
        return token
        
    except Exception as e:
        print(f"❌ Error generating token: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
