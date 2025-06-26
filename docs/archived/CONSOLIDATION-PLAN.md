# Scripts Consolidation Plan

## Current Issues
- Many overlapping scripts with similar functionality
- Multiple verification scripts for observability components
- Different token generation methods
- Multiple test runners that could be unified
- Several database management scripts that could be combined
- No unified system reset functionality

## Consolidation Plan

### 1. System Management

#### Consolidated into a single comprehensive script: `system-tools.sh`
- Combines functionality for complete system management:
  - Database reset
  - Backend restart
  - Frontend restart
  - Full system reset
  - Development environment setup
  - Observability stack startup
- Uses command arguments for different operations:
  ```
  ./system-tools.sh --reset-all
  ./system-tools.sh --reset-db
  ./system-tools.sh --restart-backend
  ./system-tools.sh --restart-frontend
  ./system-tools.sh --restart-all
  ./system-tools.sh --start-observability
  ./system-tools.sh --setup-dev
  ```

### 2. Preserved Scripts
The following scripts will remain untouched as they serve specific purposes:
- `restart-backend.sh` - Dedicated script for restarting the backend service
- `restart-frontend.sh` - Dedicated script for restarting the frontend service
- All k6 testing scripts in the k6-tests directory

## Implementation Status

### Completed Scripts
- ✅ `system-tools.sh` - Unified system management tool

### Next Steps
1. Test the system-tools.sh script thoroughly with all options
2. Create symlinks from old script names to the new consolidated script for backward compatibility
3. Update documentation to reflect the new script structure
4. Train team members on using the new consolidated scripts

## Benefits

- Simplified system reset and management with a single command
- Consistent command-line interfaces
- Better maintainability
- Reduced script count while preserving critical individual scripts
- Clearer separation of concerns
