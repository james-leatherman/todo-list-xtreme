# K6 Docker Path Fix Complete

## Issue Summary

When running k6 load tests through Docker using the k6 service defined in docker-compose.yml, we encountered a file not found error:

```
time="2025-06-23T13:36:43Z" level=error msg="The moduleSpecifier \"/scripts/k6-unified-test.js\" couldn't be found on local disk."
```

This occurred because the path referenced in the GitHub Actions workflow and run commands did not account for the k6-tests subdirectory within the scripts folder.

## Changes Made

The issue was fixed by updating all path references in the GitHub Actions workflow file (`.github/workflows/k6-load-testing.yml`). We changed all occurrences of:

```bash
/scripts/k6-unified-test.js
```

To the correct path:

```bash 
/scripts/k6-tests/k6-unified-test.js
```

This change ensures that the k6 Docker service can correctly locate the test scripts within the mounted volume.

## File Structure

The correct directory structure is:
```
/scripts
  /k6-tests
    k6-unified-test.js
    /modules
      auth.js
      setup.js
    run-k6-tests.sh
```

## Docker Volume Mount

The volume mount in docker-compose.yml is correctly set to:
```yaml
volumes:
  - ../scripts:/scripts
  - ./k6-results:/results
```

This maps the entire scripts directory (including the k6-tests subdirectory) to the /scripts path in the container.

## Testing the Fix

We verified that the k6 test script now runs correctly with the updated path:

```bash
cd /root/todo-list-xtreme/backend
docker-compose run --rm --user $(id -u):$(id -g) -e AUTH_TOKEN="$AUTH_TOKEN" k6 run -e TEST_MODE=quick /scripts/k6-tests/k6-unified-test.js
```

## Conclusion

The path issue is now resolved. Note that we still need to provide a valid JWT token for the tests to pass authentication, but the file not found error has been fixed.

**Status**: ✅ **COMPLETE** - Path issue resolved
**Date**: June 23, 2025
