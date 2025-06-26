#!/bin/bash
# system-tools.sh - Unified script for system-wide operations
# 
# This script consolidates functionality for resetting and managing the entire system
# including database, frontend, backend, and observability components.
#
# Usage:
#   ./system-tools.sh [options]
#
# Options:
#   --reset-all            Complete system reset (database, backend, frontend)
#   --reset-db             Reset only the database (wipe and re-initialize)
#   --restart-backend      Restart only the backend services
#   --restart-frontend     Restart only the frontend services
#   --restart-all          Restart both frontend and backend
#   --start-observability  Start the observability stack
#   --setup-dev            Set up development environment
#   -h, --help             Show this help message
#
# Examples:
#   ./system-tools.sh --reset-all
#   ./system-tools.sh --restart-backend
#   ./system-tools.sh --setup-dev

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Function to show usage information
usage() {
    echo -e "${BLUE}System Tools - Unified system management for Todo List Xtreme${NC}"
    echo ""
    echo "Usage:"
    echo "  ./system-tools.sh [options]"
    echo ""
    echo "Options:"
    echo "  --reset-all            Complete system reset (database, backend, frontend)"
    echo "  --reset-db             Reset only the database (wipe and re-initialize)"
    echo "  --restart-backend      Restart only the backend services"
    echo "  --restart-frontend     Restart only the frontend services"
    echo "  --restart-all          Restart both frontend and backend"
    echo "  --start-observability  Start the observability stack"
    echo "  --setup-dev            Set up development environment"
    echo "  -h, --help             Show this help message"
}

# Function to initialize the database
init_db() {
    echo -e "${YELLOW}🗃️  Initializing Todo List Xtreme Database...${NC}"
    echo "============================================"
    
    # Navigate to backend directory
    cd "$PROJECT_ROOT/backend"
    
    # Check if virtual environment exists and activate it
    if [ -d "venv" ]; then
        echo "🔧 Activating virtual environment..."
        source venv/bin/activate
    fi
    
    # Check if we're in the right directory
    if [ ! -f "src/todo_api/utils/init_db.py" ]; then
        echo -e "${RED}❌ Error: Could not find init_db.py at expected location${NC}"
        echo "   Expected: $PROJECT_ROOT/backend/src/todo_api/utils/init_db.py"
        return 1
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
        echo -e "${GREEN}✅ Database initialized successfully!${NC}"
        return 0
    else
        echo ""
        echo -e "${RED}❌ Database initialization failed!${NC}"
        return 1
    fi
}

# Function to wipe the database
wipe_db() {
    echo -e "${YELLOW}⚠️  Wiping Todo List Xtreme Database...${NC}"
    echo "============================================"
    
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
    
    echo "Connected to database $DB_NAME at $DB_HOST:$DB_PORT"
    echo -e "${RED}WARNING: About to delete ALL data in the database!${NC}"
    
    # Function to execute SQL command
    execute_sql() {
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "$1"
    }
    
    # Get all tables in the public schema
    TABLES=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public';")
    
    # Drop all tables
    echo "Dropping all tables..."
    for TABLE in $TABLES; do
        echo "  Dropping table: $TABLE"
        execute_sql "DROP TABLE IF EXISTS $TABLE CASCADE;"
    done
    
    echo -e "${GREEN}✅ Database wipe completed.${NC}"
    return 0
}

# Function to reset the database (wipe and initialize)
reset_db() {
    echo -e "${YELLOW}🔄 Resetting database (wipe and initialize)...${NC}"
    
    wipe_db
    if [ $? -ne 0 ]; then
        return 1
    fi
    
    init_db
    return $?
}

# Function to create test user
create_test_user() {
    echo -e "${YELLOW}👤 Creating test user...${NC}"
    echo "====================================="
    
    # Navigate to backend directory
    cd "$PROJECT_ROOT/backend"
    
    # Check if virtual environment exists and activate it
    if [ -d "venv" ]; then
        echo "🔧 Activating virtual environment..."
        source venv/bin/activate
    fi
    
    # Check if we're in the right directory
    if [ ! -f "src/todo_api/utils/create_test_user.py" ]; then
        echo -e "${RED}❌ Error: Could not find create_test_user.py at expected location${NC}"
        echo "   Expected: $PROJECT_ROOT/backend/src/todo_api/utils/create_test_user.py"
        return 1
    fi
    
    echo "📁 Working directory: $(pwd)"
    echo -e "${YELLOW}👤 Creating test user and generating JWT token...${NC}"
    
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
        echo -e "${GREEN}🎉 Test user is ready!${NC}"
        echo ""
        echo "📋 Created:"
        echo "  - Test user account (test@example.com)"
        echo "  - Long-lasting JWT token (365 days)"
        return 0
    else
        echo ""
        echo -e "${RED}❌ Test user creation failed!${NC}"
        return 1
    fi
}

# Function to restart backend services
restart_backend() {
    echo -e "${YELLOW}🔄 Restarting Backend Services${NC}"
    echo "==============================="

    # Change to backend directory
    cd "$PROJECT_ROOT/backend"

    echo "1. Stopping existing services..."
    docker-compose down 2>/dev/null || true

    echo "2. Starting Docker service..."
    sudo systemctl start docker

    echo "3. Waiting for Docker to be ready..."
    sleep 3

    echo "4. Starting backend services..."
    docker-compose up -d

    echo "5. Waiting for services to start..."
    sleep 15

    echo "6. Checking service status..."
    docker-compose ps

    echo "7. Testing backend health..."
    curl -s http://localhost:8000/health | head -n 3 || echo "Backend not ready yet"

    echo ""
    echo -e "${GREEN}✅ Backend services restarted successfully!${NC}"
    return 0
}

# Function to restart frontend services
restart_frontend() {
    echo -e "${YELLOW}🔄 Restarting Frontend Services${NC}"
    echo "==============================="

    # Change to frontend directory
    cd "$PROJECT_ROOT/frontend"

    echo "1. Stopping existing frontend processes..."
    # Kill any existing npm/node processes for the frontend
    pkill -f "node.*frontend" 2>/dev/null || true
    pkill -f "npm.*start" 2>/dev/null || true
    sleep 2

    echo "2. Clearing npm cache and node_modules (if needed)..."
    if [ ! -d "node_modules" ]; then
        echo "   - Installing dependencies..."
        npm install
    fi

    echo "3. Starting frontend development server..."
    # Start in background
    npm start &
    FRONTEND_PID=$!

    echo "4. Waiting for frontend to start..."
    sleep 10

    echo -e "${GREEN}✅ Frontend services restarted successfully!${NC}"
    echo "Frontend server running with PID: $FRONTEND_PID"
    return 0
}

# Function to start observability stack
start_observability() {
    echo -e "${YELLOW}🔍 Starting Full Observability Stack${NC}"
    echo "====================================="

    cd "$PROJECT_ROOT/backend"

    echo "1. Starting core observability services..."
    docker-compose up -d loki promtail tempo otel-collector prometheus grafana

    echo "2. Waiting for services to start..."
    sleep 15

    echo "3. Checking service health..."
    echo "Loki: $(curl -s http://localhost:3100/ready || echo 'NOT READY')"
    echo "Prometheus: $(curl -s http://localhost:9090/-/ready || echo 'NOT READY')"
    echo "Grafana: $(curl -s http://localhost:3001/api/health | grep -o '"database":"ok"' || echo 'NOT READY')"

    echo ""
    echo "4. Testing Loki queries..."
    echo "Available labels:"
    curl -s "http://localhost:3100/loki/api/v1/labels" || echo "Failed to query labels"

    echo ""
    echo -e "${GREEN}✅ Observability stack started successfully!${NC}"
    return 0
}

# Function to setup development environment
setup_dev() {
    echo -e "${YELLOW}🛠️  Setting up Development Environment${NC}"
    echo "====================================="

    # Generate the test token
    echo "Generating test token..."
    create_test_user
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to create test user${NC}"
    fi

    # Check if .env file exists, if not create it
    if [ ! -f "$PROJECT_ROOT/frontend/.env" ]; then
        echo "Creating frontend/.env..."
        echo "REACT_APP_API_URL=http://localhost:8000" > "$PROJECT_ROOT/frontend/.env"
        echo -e "${GREEN}✅ Created frontend/.env file${NC}"
    else
        echo "Frontend .env file already exists"
    fi

    # Restart the development server if it's running
    if pgrep -f "node.*start" > /dev/null; then
        echo "Restarting frontend development server..."
        pkill -f "node.*start"
        cd "$PROJECT_ROOT/frontend" && npm start &
        echo -e "${GREEN}✅ Development server restarted${NC}"
    else
        echo "Note: Development server not running"
    fi

    echo -e "${GREEN}✅ Development environment setup complete!${NC}"
    echo "If the development server is not running, start it with:"
    echo "cd frontend && npm start"
    return 0
}

# Function to perform a complete system reset
reset_all() {
    echo -e "${YELLOW}🔄 Performing Complete System Reset${NC}"
    echo "====================================="
    
    echo "1. Stopping all services..."
    cd "$PROJECT_ROOT/backend"
    docker-compose down 2>/dev/null || true
    
    pkill -f "node.*frontend" 2>/dev/null || true
    pkill -f "npm.*start" 2>/dev/null || true
    sleep 2
    
    echo "2. Resetting database..."
    reset_db
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Database reset failed${NC}"
        return 1
    fi
    
    echo "3. Creating test user..."
    create_test_user
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Test user creation failed${NC}"
    fi
    
    echo "4. Restarting backend services..."
    restart_backend
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Backend restart failed${NC}"
        return 1
    fi
    
    echo "5. Restarting frontend services..."
    restart_frontend
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Frontend restart failed${NC}"
        return 1
    fi
    
    echo -e "${GREEN}🎉 Complete system reset successful!${NC}"
    echo ""
    echo "The Todo List Xtreme system has been reset and is now running with:"
    echo "- Fresh database"
    echo "- Test user account (test@example.com)"
    echo "- Backend services"
    echo "- Frontend development server"
    echo ""
    echo "Access the application at: http://localhost:3000"
    return 0
}

# Parse command line arguments
if [ $# -eq 0 ]; then
    usage
    exit 1
fi

# Process command line arguments
while [ "$1" != "" ]; do
    case $1 in
        --reset-all)
            reset_all
            exit $?
            ;;
        --reset-db)
            reset_db
            exit $?
            ;;
        --restart-backend)
            restart_backend
            exit $?
            ;;
        --restart-frontend)
            restart_frontend
            exit $?
            ;;
        --restart-all)
            restart_backend
            restart_frontend
            exit $?
            ;;
        --start-observability)
            start_observability
            exit $?
            ;;
        --setup-dev)
            setup_dev
            exit $?
            ;;
        -h | --help)
            usage
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Unknown option: $1${NC}"
            usage
            exit 1
            ;;
    esac
    shift
done

exit 0
