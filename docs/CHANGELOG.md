# Changelog

All notable changes to the Todo List Xtreme project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.0] - 2025-06-26
### Added
- **Complete LGTM Observability Stack**: Added the final component (Mimir) to complete the LGTM (Loki, Grafana, Tempo, Mimir) observability stack
  - Added Mimir service to docker-compose.yml
  - Created mimir-config.yml with appropriate settings
  - Added persistent mimir_data volume
  - Enhanced metrics storage with Prometheus remote write to Mimir
  - Auto-provisioned Mimir data source to Grafana
  - Added comprehensive observability guide in documentation

- **Script Consolidation System**: Created unified script management system
  - New `system-tools.sh` script with multiple functionality options:
    - `--reset-all`: Complete system reset (database, backend, frontend)
    - `--reset-db`: Reset only the database (wipe and re-initialize)
    - `--restart-backend`: Restart only the backend services
    - `--restart-frontend`: Restart only the frontend services
    - `--restart-all`: Restart both frontend and backend
    - `--start-observability`: Start the observability stack
    - `--setup-dev`: Set up development environment
  - `cleanup-duplicates.sh` tool for managing transition from old scripts
  - Consolidated multiple overlapping scripts for improved maintainability

### Fixed
- **k6 Load Testing**: Fixed validation errors in k6 load tests
  - Corrected all status values to match API validation pattern (todo, inProgress, blocked, done)
  - Fixed all path references in GitHub Actions workflow to correctly target test scripts
  - Ensured consistent volume mounts between local Docker and CI environments
  - Resolved "file not found" errors when running tests in Docker

- **Dashboard Configurations**: Cleaned up and standardized Grafana dashboards
  - Updated all dashboards to use correct Prometheus job labels
  - Fixed datasource configurations with consistent naming and UIDs
  - Updated dashboard titles, legend formats, and query filters
  - Ensured all dashboards are provisioned in the correct folder structure
  - Removed duplicate/empty Grafana dashboard files
  - Merged Prometheus monitoring dashboards into a single comprehensive dashboard

### Improved
- **Observability Integration**: 
  - Fixed Tempo configuration for TraceQL metrics support
  - Enabled `span-metrics` processor with proper configuration
  - Added remote write configuration to send span metrics to Prometheus
  - Fixed metrics generator configuration with proper storage paths
  - Resolved trace export timeout issues
  - Enabled and configured Traces Drilldown plugin in Grafana

- **Security Updates**: 
  - Removed hardcoded JWT secrets
  - Eliminated all hardcoded secrets from CI workflows
  - Updated GitHub Actions to use environment variables from secrets
  - Created secure local testing setup with `.env` file support

- **Load Testing Workflow**: Enhanced k6 test execution and result collection
  - Added clear documentation for each k6 test issue fixed
  - Improved run-k6-tests.sh script with better Docker support
  - Standardized test configuration across all environments
  - Added k6 Docker integration with CI/CD compatibility

- **Script Organization**:
  - Simplified system management with unified command interface
  - Reduced maintenance overhead with fewer scripts
  - Improved discoverability through standardized help options
  - Preserved critical scripts (restart-backend.sh, restart-frontend.sh, k6 test scripts)

## [1.5.0] - 2025-06-17
### Changed
- **BREAKING**: Metrics Module API changes
  - Refactored Prometheus metrics initialization to use safer fallback mechanisms
  - Changed internal metric handling to avoid accessing private attributes
  - Updated metric collection methods to use proper public API
  - Modified error handling patterns for metric operations

### Fixed
- **Metrics Module**: Resolved Pylance errors and unknown attribute issues in `metrics.py`
  - Fixed type safety issues with Prometheus metrics
  - Replaced internal attribute access with proper public API methods
  - Added null safety checks for metric operations
  - Improved error handling and fallback mechanisms
- **OAuth Authentication**: Enhanced Google OAuth flow debugging and error handling
  - Improved callback endpoint routing
  - Enhanced logging for OAuth troubleshooting
  - Added better error messages for OAuth configuration issues
- **Development Tools**: Enhanced debugging and development workflow
  - Added `debug_init.py` script for database initialization debugging
  - Fixed Pylance import resolution errors in debug scripts
  - Improved script path handling and error reporting
  - Fixed import resolution issues in development scripts

### Improved
- **Code Quality**: Enhanced type safety and static analysis compliance
  - Added proper type annotations throughout metrics module
  - Resolved all Pylance import resolution warnings
  - Improved error handling patterns across the codebase
- **Documentation**: Updated development documentation and setup guides
  - Enhanced script usage documentation
  - Improved troubleshooting guides for OAuth setup
  - Added better code comments and type hints

## [1.4.0] - 2025-06-10
### Added
- **Accessibility Enhancements**: Added id/name attributes to all interactive elements including:
  - Main task form elements and buttons
  - Column action buttons and settings menus
  - Task interaction buttons (edit, delete, complete, photo upload)
  - Dialog forms and navigation buttons
  - Menu items and confirmation dialogs
- **Development Scripts System**: Created centralized scripts directory with:
  - `create-test-user.sh`: Creates test users and generates JWT tokens, automatically setting them in frontend environment
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
