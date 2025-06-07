# Todo List Xtreme - MVP

A full-stack to-do list application with photo upload capabilities, responsive design, and OAuth authentication.

![Todo List Xtreme](https://via.placeholder.com/1200x600?text=Todo+List+Xtreme+MVP)

## MVP Status

This is the Minimum Viable Product (MVP) release of Todo List Xtreme. It includes all core functionality and is ready for basic use and testing.

## What's New in v1.2.0 (2025-06-07)

- **Bulk Delete:** You can now delete all tasks in a column at once from the column context menu (with confirmation dialog).
- **Improved Safety:** Destructive actions are protected by confirmation dialogs and robust error handling.
- **Code Quality:** All ESLint/code quality issues fixed; CI/CD and build checks pass.
- **Documentation:** Changelog and release notes updated for this version.

## Features

- Create, read, update, and delete tasks
- **Bulk delete all tasks in a column (new in v1.2.0)**
- Add photos to tasks for visual tracking
- Google OAuth authentication
- Responsive design (works on mobile devices)
- AWS infrastructure managed with Terraform
- PostgreSQL database for data persistence

## Tech Stack

### Backend
- Python with FastAPI
- PostgreSQL database
- JWT authentication
- AWS S3 integration for photo storage
- Docker containerization

### Frontend
- React
- Material-UI components
- Responsive design
- JWT token authentication
- Photo upload capability

### Infrastructure
- AWS (Amazon Web Services)
- Terraform for Infrastructure as Code
- RDS PostgreSQL
- S3 buckets
- Elastic Beanstalk for deployment
- CloudFront CDN for frontend

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js and npm
- Python 3.11+
- AWS CLI (for deployment)
- Terraform (for infrastructure provisioning)

### GitHub Repository Setup
If you're setting up the project on GitHub, you'll need to configure the following secrets:

1. **DB_USER** - PostgreSQL username (default: postgres)
2. **DB_PASSWORD** - PostgreSQL password (default: postgres)
3. **SECRET_KEY** - JWT secret key for authentication
4. **DOCKER_HUB_USERNAME** - Docker Hub username for CI/CD pipeline
5. **DOCKER_HUB_ACCESS_TOKEN** - Docker Hub access token
6. **API_URL** - The URL where your API will be hosted (for production build)

### Local Development

#### Backend
```bash
# Navigate to the backend directory
cd backend

# Create a virtual environment and activate it
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create a .env file with the environment variables listed below
# Start PostgreSQL database
docker-compose up -d db

# Initialize database
python init_db.py

# Run the FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Frontend
```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Create a .env file with the environment variables listed below
# Start the React development server
npm start
```

#### Quick Testing Setup
```bash
# Create a test user and get JWT token
cd backend
source venv/bin/activate
python create_test_user.py

# Create sample todo items
python test_api.py
```

### Generating Secure Credentials
The project includes a script to generate secure random credentials for development and production:

```bash
# Generate secure random credentials
./generate_secrets.sh
```

This script will:
1. Generate a secure random JWT secret key
2. Create random database credentials for production
3. Set up local development .env files with safe defaults
4. Output the production credentials to add to GitHub Secrets

### Environment Variables

#### Backend (.env)
```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_SERVER=db
POSTGRES_PORT=5432
POSTGRES_DB=todolist
DATABASE_URL=postgresql://postgres:postgres@db:5432/todolist
CORS_ORIGINS=http://localhost:3000
SECRET_KEY=your_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
AWS_S3_BUCKET=your_s3_bucket
```

#### Frontend (.env.local)
```
REACT_APP_API_URL=http://localhost:8000
```

## Deployment with Terraform

```bash
cd terraform

# Initialize Terraform
terraform init

# Plan the deployment
terraform plan -out=tfplan

# Apply the configuration
terraform apply tfplan
```

## Project Structure

```
todo-list-xtreme/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── todos.py
│   ├── tests/
│   ├── alembic/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── requirements.txt
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   ├── package.json
│   └── README.md
└── terraform/
    ├── modules/
    │   └── database/
    │       ├── main.tf
    │       ├── variables.tf
    │       └── outputs.tf
    ├── environments/
    ├── main.tf
    ├── variables.tf
    └── outputs.tf
```

## Contributing

Contributions are welcome! Here's how you can contribute:

1. **Fork the repository**
2. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Commit your changes**:
   ```bash
   git commit -m 'Add some feature'
   ```
4. **Push to the branch**:
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Create a Pull Request**

## Roadmap

- [ ] Implement Google OAuth authentication
- [ ] Add AWS S3 integration for production photo storage
- [ ] Create CI/CD pipeline with GitHub Actions
- [ ] Add unit and integration tests
- [ ] Implement tagging system for todos
- [ ] Add user preferences and theme selection

## License

MIT License

## Acknowledgments

- FastAPI for the amazing Python web framework
- React and Material-UI for the frontend components
- AWS and Terraform for the infrastructure

## Tests & Utilities

### Backend Test Scripts
- `test_api.py`: End-to-end API test for all main endpoints. Run with `python test_api.py` (requires backend running and test user/token).
- `test_column_settings.py`, `simple_test_column_settings.py`, `test_comprehensive_column_persistence.py`, `test_empty_column_persistence.py`: Test column settings and persistence logic. See script headers for usage.
- `test_import.py`: Tests import functionality.
- `test_settings.py`: Tests backend settings/configuration.
- `conftest.py`: Pytest fixtures for backend tests.
- `create_test_user.py`: Creates a test user for development/testing.
- `wipe_db.py` / `wipe_db.sh`: Wipe/reset the development database.
- `demo_db_restore.sh`: Restore demo database from snapshot.
- `init_db.py`: Initialize the database schema.

### Frontend Test Scripts
- `src/App.test.js`: React component tests (run with `npm test` in `frontend`).
- `jest-output.txt`, `test-output.txt`: Output logs from frontend test runs.
- `public/test-token.js`: Example/test JWT token for development.

### Utilities
- `generate_secrets.sh`: Generate secure random credentials and .env files for dev/prod.
- `update_todos_status.py`, `add_column_settings.py`, `add_status_column.py`: Backend utilities for managing todos and columns.

## Running Tests

### Backend (Python/FastAPI)
```bash
cd backend
source venv/bin/activate
# Run all tests with pytest (if using pytest conventions)
pytest
# Or run individual scripts:
python test_api.py
python test_column_settings.py
python simple_test_column_settings.py <auth_token>
```

### Frontend (React)
```bash
cd frontend
npm test
```

## Updated Setup Instructions

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # or use generate_secrets.sh
# Start PostgreSQL (if not running):
docker-compose up -d db
python init_db.py
```

### 2. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local  # or use generate_secrets.sh
npm start
```

### 3. Utilities & Scripts
- To generate secrets and .env files: `./generate_secrets.sh`
- To wipe/reset the database: `cd backend && ./wipe_db.sh`
- To restore demo data: `cd backend && ./demo_db_restore.sh`
