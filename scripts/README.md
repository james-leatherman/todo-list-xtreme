# Scripts Directory

This directory contains all scripts for managing the Todo List Xtreme system.

## Consolidated Scripts

### System Tools
```
./system-tools.sh [options]
```

**Options:**
- `--reset-all` - Complete system reset (database, backend, frontend)
- `--reset-db` - Reset only the database (wipe and re-initialize) 
- `--restart-backend` - Restart only the backend services
- `--restart-frontend` - Restart only the frontend services
- `--restart-all` - Restart both frontend and backend
- `--start-observability` - Start the observability stack
- `--setup-dev` - Set up development environment

### Cleanup Duplicates
```
./cleanup-duplicates.sh [options]
```

**Options:**
- No options: Create symbolic links without changing original files
- `--archive` - Move duplicate scripts to an 'archived' directory and create symlinks
- `--remove` - Delete duplicate scripts and create symlinks (use with caution)

### Examples

Reset the entire system (useful when you want to start fresh):
```bash
./system-tools.sh --reset-all
```

## Quick Start

For a new developer getting started with the project:

1. Clone the repository
2. Run `./scripts/system-tools.sh --reset-all` to set up everything
3. Access the application at http://localhost:3000

## Reserved Scripts

The following scripts are kept separate as they serve specific purposes:

- `restart-backend.sh` - Dedicated script for restarting only the backend
- `restart-frontend.sh` - Dedicated script for restarting only the frontend
- All k6 testing scripts

## Directory Structure

```
scripts/
├── common/                    # Shared utilities and functions
├── k6-tests/                  # K6 load testing scripts
├── utils/                     # Utility scripts 
├── verify/                    # Verification scripts
├── system-tools.sh            # Consolidated system management tool
├── cleanup-duplicates.sh      # Script to clean up duplicate scripts
├── archived/                  # Created when using cleanup-duplicates.sh --archive
│   ├── verification/        # Setup verification
│   └── README.md            # Setup documentation
├── maintenance/             # Maintenance and utility scripts
│   └── README.md            # Maintenance documentation
└── README.md                # This file
```

## Quick Start

1. **Setup Environment**: `cd scripts/setup/environment && ./setup-dev.sh`
2. **Start Observability**: `cd scripts/setup/observability && ./start-observability.sh`
3. **Run Tests**: `cd scripts/test/api && ./test-column-settings-fix.sh`
4. **Generate Traffic**: `cd scripts/demo/traffic && ./generate-dashboard-traffic.sh`

## Common Functions

All scripts can use the common functions by sourcing:

```bash
source scripts/common/functions.sh
source scripts/common/api.sh
source scripts/common/observability.sh
```

## Migration Notes

- Old script paths have been updated to use the new structure
- Common functions are now centralized in `scripts/common/`
- Each category has its own README with usage instructions
- Legacy scripts are preserved in their respective categories
