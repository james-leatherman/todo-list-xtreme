# Changelog

All notable changes to the Todo List Xtreme project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2025-06-10
### Added
- **Accessibility Enhancements**: Added id/name attributes to all interactive elements including:
  - Main task form elements and buttons
  - Column action buttons and settings menus
  - Task interaction buttons (edit, delete, complete, photo upload)
  - Dialog forms and navigation buttons
  - Menu items and confirmation dialogs
- **Development Scripts System**: Created centralized scripts directory with:
  - `generate-test-token.sh`: Automatically generates JWT tokens from backend
  - `setup-dev.sh`: Complete development environment setup
  - `demo_db_restore.sh`: Database restoration utility
  - `wipe_db.sh`: Database cleanup utility
  - `generate_secrets.sh`: Secret key generation
- **Script Documentation**: Comprehensive README for all development utilities
- **Environment Management**: Dynamic test token loading from environment variables

### Changed
- **Asset Organization**: Moved PWA icons to public folder and cleaned up image imports
- **Navigation System**: Improved logout flow with proper state cleanup and React Router navigation
- **Token Management**: Replaced hardcoded test tokens with environment-based system
- **File Structure**: Reorganized scripts to root-level directory for better project organization
- **Error Handling**: Enhanced user feedback for missing development tokens

### Fixed
- **Logo File References**: Fixed broken logo imports and organized asset structure
- **Navigation Caching**: Resolved logout navigation issues that caused state caching problems
- **ESLint Issues**: Fixed 'navigate' undefined error in Login component
- **Path Resolution**: Updated script paths to work from project root directory

### Improved
- **Developer Experience**: Streamlined setup process with automated token generation
- **Code Security**: Removed hardcoded credentials in favor of environment variables
- **Maintainability**: Better organized file structure and documentation
- **User Interface**: Removed unnecessary maximize button from photo dialog

### Technical
- **Build Process**: Enhanced development workflow with proper environment file management
- **Script Robustness**: Scripts now work from any directory using absolute paths
- **Documentation**: Updated all references to reflect new script locations and usage

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
