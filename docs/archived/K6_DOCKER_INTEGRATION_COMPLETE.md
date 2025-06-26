# K6 Docker Integration Complete

We have successfully integrated the k6 load testing tool with Docker and GitHub Actions. This document outlines the changes made and how the system now works.

## Changes Made

1. **Added k6 Service to Docker Compose**

   Added a k6 service to the `docker-compose.yml` file in the backend directory, which:
   - Uses the official Grafana k6 Docker image
   - Mounts the scripts directory to access test files
   - Mounts a k6-results directory to store test results
   - Sets environment variables for API_URL and AUTH_TOKEN
   - Uses the correct user permissions via the `--user` flag when running

```yaml
k6:
  image: grafana/k6:latest
  volumes:
    - ../scripts:/scripts
    - ./k6-results:/results
  environment:
    - K6_OUT=json=/results/k6-results.json
    - API_URL=http://api:8000
    - AUTH_TOKEN=${AUTH_TOKEN:-}
  depends_on:
    - api
```

2. **Updated GitHub Actions Workflow**

   Modified the k6-load-testing.yml workflow to:
   - Create and set proper permissions for the k6-results directory
   - Use Docker Compose to run k6 tests instead of direct k6 commands
   - Update artifact paths to collect results from the Docker container
   - Pass environment variables (AUTH_TOKEN, TEST_TYPE, DURATION, VUS) to the container

3. **Validation**

   Verified that:
   - The k6 Docker service can successfully run test scripts
   - Results are properly written to the k6-results directory
   - The Docker service can access the backend API using the correct URL

## How to Use

### Local Testing

To run k6 tests locally using Docker:

```bash
cd backend
export AUTH_TOKEN=your_jwt_token
mkdir -p k6-results
chmod 755 k6-results
docker-compose run --rm --user $(id -u):$(id -g) -e AUTH_TOKEN="$AUTH_TOKEN" -e DURATION="30s" -e VUS="2" k6 run -e TEST_MODE=quick /scripts/k6-tests/k6-unified-test.js
```

### CI/CD Pipeline

The GitHub Actions workflow now uses the Docker approach for running k6 tests in CI:

1. The workflow still sets up the backend and generates a JWT token
2. It creates a k6-results directory with secure permissions (755)
3. It uses docker-compose with the `--user $(id -u):$(id -g)` flag to run the k6 tests with the current user's permissions
4. Environment variables (AUTH_TOKEN, TEST_TYPE, DURATION, VUS) are passed to the container
5. Test results are uploaded as artifacts from the k6-results directory

## Benefits

- **Consistency**: Tests run in the same Docker environment locally and in CI
- **Simplicity**: No need to install k6 directly on the host or CI runner
- **Isolation**: Tests run in a contained environment
- **Integration**: Direct access to the backend API through Docker networking

## Future Enhancements

- Consider adding a Grafana dashboard for visualizing k6 test results
- Extend the k6 tests to include more comprehensive API testing
- Add performance thresholds based on historical test data
