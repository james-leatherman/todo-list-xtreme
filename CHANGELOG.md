# Changelog

All notable changes to the Todo List Xtreme project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2025-06-07
### Added
- TLX Retro 90s theme: Authentic 90s-inspired theme with neon colors, geometric shapes, custom fonts, and jazz-cup header art.
- TLX Retro 80s theme: Neon pink, purple, cyan, and yellow palette, bold geometric backgrounds, and 80s-style logo.
- Theme selector: Instantly switch between default, 90s, and 80s themes.
- Header improvements: Tagline now randomly chosen from a user-supplied 90s descriptor list; jazz-cup image for 90s theme; 80s logo for 80s theme.
- Fullscreen photo viewer: Click any photo thumbnail to view it fullscreen in a dialog, with a maximize button to open in a new tab.
- Maximize button: Added to expanded photo dialog for easy full-resolution viewing.
- Utilities & documentation: README and setup instructions updated for all tests/utilities; new theme and UI features documented.

### Changed
- Improved drag-and-drop and theme switching logic for better UX.
- Fixed all React hook and lint warnings in frontend code.
- Updated theme logic to support multiple retro themes and dynamic logo switching.

### Removed
- All references to Google Cloud deployment from codebase and documentation.

### Fixed
- UI/UX bugs related to theme integration and drag-and-drop.
- Unused imports and React hook dependency warnings.

### Improved
- Modernized UI with selectable retro themes and fullscreen photo support.
- Enhanced code quality and maintainability.

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
