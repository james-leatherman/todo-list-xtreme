#!/bin/bash
# Script to generate secure random tokens for development and production

# Generate a random secret key for JWT
SECRET_KEY=$(openssl rand -hex 32)

# Generate random database credentials for production
DB_USER="dbuser_$(openssl rand -hex 4)"
DB_PASSWORD=$(openssl rand -base64 24)

# Create .env file for local development
echo "Generating .env files with secure random tokens..."

# Backend .env
cat > backend/.env << EOF
# Database configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_SERVER=localhost
POSTGRES_PORT=5432
POSTGRES_DB=todolist
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/todolist

# CORS settings
CORS_ORIGINS="http://localhost:3000"

# JWT settings
SECRET_KEY=$SECRET_KEY
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AWS S3 settings (placeholder values)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=todo-list-xtreme
EOF

# Frontend .env
cat > frontend/.env << EOF
# Backend API URL
REACT_APP_API_URL=http://localhost:8000
EOF

echo ""
echo "===== PRODUCTION CREDENTIALS ====="
echo "Keep these secure and add them to GitHub Secrets"
echo ""
echo "SECRET_KEY=$SECRET_KEY"
echo "DB_USER=$DB_USER"
echo "DB_PASSWORD=$DB_PASSWORD"
echo ""
echo ".env files created successfully with development defaults."
echo "For production, use the credentials above in your GitHub secrets."
