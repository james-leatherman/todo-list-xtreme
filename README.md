<table>
  <tr>
    <td><img src="https://github.com/james-leatherman/todo-list-xtreme/blob/main/frontend/src/images/tlx-logo.png" alt="TLX Logo" width="64"/></td>
    <td><h1 style="margin-left: 16px;">Todo List Xtreme - MVP</h1></td>
  </tr>
</table>

A full-stack to-do list application with photo upload capabilities, responsive design, OAuth authentication, and robust testing utilities.

## MVP Status

This is the Minimum Viable Product (MVP) release of Todo List Xtreme. It includes all core functionality and is ready for basic use and testing.

## What's New in v1.3.0 (2025-06-07)

- **TLX Retro 90s Theme:** Selectable, authentic 90s-inspired theme with custom fonts, colors, and jazz-cup header.
- **Header Improvements:** Tagline now randomly chosen from a user-supplied 90s descriptor list; jazz-cup image added.
- **UI/UX Fixes:** Drag-and-drop and theme switching bugs resolved.
- **Code Quality:** All React hook and lint warnings fixed.
- **Cloud References:** All Google Cloud deployment references removed from code and docs.
- **Documentation:** README and setup instructions updated for tests/utilities.

## Features

- Create, read, update, and delete tasks
- Bulk delete all tasks in a column
- Add photos to tasks for visual tracking
- Google OAuth authentication
- Responsive design (works on mobile devices)
- Theme selection, including "TLX Retro 90s"
- PostgreSQL database for data persistence
- AWS infrastructure managed with Terraform

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
- Theme support (including 90s retro)

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
If you're setting up the project on GitHub, configure these secrets:
- **DB_USER** - PostgreSQL username (default: postgres)
- **DB_PASSWORD** - PostgreSQL password (default: postgres)
- **SECRET_KEY** - JWT secret key for authentication
- **DOCKER_HUB_USERNAME** - Docker Hub username for CI/CD pipeline
- **DOCKER_HUB_ACCESS_TOKEN** - Docker Hub access token
- **API_URL** - The URL where your API will be hosted (for production build)

### Local Development

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# Create a .env file (see below)
docker-compose up -d db
python init_db.py
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Frontend
```bash
cd frontend
npm install
# Create a .env file (see below)
npm start
```

### Utilities & Scripts

#### Credential Generation
- `./generate_secrets.sh` — Generates secure random credentials and .env files for dev/prod.

#### Database Utilities
- `backend/wipe_db.sh` — Wipes the development database (use with caution).
- `backend/demo_db_restore.sh` — Restores demo data to the database.
- `backend/init_db.py` — Initializes the database schema.
- `backend/create_test_user.py` — Creates a test user for development.

### Testing

#### Backend Manual API Test
- `backend/test_api.py` — Runs a full suite of API endpoint tests (requires running backend and test user):
  ```bash
  cd backend
  source venv/bin/activate
  python test_api.py
  ```
- Other backend test scripts:
  - `test_column_settings.py`, `test_comprehensive_column_persistence.py`, `test_empty_column_persistence.py`, `test_import.py`, `test_settings.py` — Specialized tests for columns/settings.

#### Backend Automated Tests
- Uses `pytest` (see `backend/conftest.py` for fixtures):
  ```bash
  cd backend
  source venv/bin/activate
  pytest
  ```

#### Frontend Tests
- `frontend/src/App.test.js` — React component tests (Jest):
  ```bash
  cd frontend
  npm test
  ```
- Test output: see `frontend/jest-output.txt` and `frontend/test-output.txt`.

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
terraform init
terraform plan -out=tfplan
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

- [x] Implement Google OAuth authentication
- [x] Add AWS S3 integration for production photo storage
- [x] Create CI/CD pipeline with GitHub Actions
- [x] Add unit and integration tests
- [x] Implement tagging system for todos
- [x] Add user preferences and theme selection
- [x] Add TLX Retro 90s theme

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
