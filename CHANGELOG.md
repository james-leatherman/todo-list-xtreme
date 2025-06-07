# Changelog

All notable changes to the Todo List Xtreme project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2025-06-07
### Added
- Bulk delete: Added "Delete All Tasks in Column" to the column context menu in the Kanban board.
- Confirmation dialog before deleting all tasks in a column.
- All tasks in the selected column are deleted from both the UI and backend database.

### Fixed
- All ESLint warnings and errors in the frontend (unused variables, imports, etc.).
- Ensured all code changes are CI/CD-friendly and pass linting and build checks.

### Improved
- Robust error handling and user feedback for destructive actions.
- CI/CD workflows for test and deploy are up-to-date and pass with the new code.

## [1.0.0-mvp] - 2025-06-04

### Added
- Initial MVP release
- Backend API with FastAPI
  - Todo CRUD operations
  - User authentication with JWT
  - Test user creation
  - Photo upload functionality
- Frontend with React
  - Material UI components
  - Responsive design
  - Todo management interface
  - Photo upload capability
- Database
  - PostgreSQL setup with SQLAlchemy models
  - Docker containerization
- Testing
  - API test script for backend endpoints

### Known Issues
- Google OAuth authentication not fully implemented
- AWS S3 integration configured but not fully implemented
- No automated tests
