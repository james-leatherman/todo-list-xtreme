# K6 Status Validation Fix

## Issue Fixed
The k6 load tests were failing with a validation error from the API:

```
time="2025-06-23T14:00:03Z" level=warning msg="Expected status 200 but got 422 for http://localhost:8000/api/v1/todos/220. Response: {\"detail\":[{\"type\":\"string_pattern_mismatch\",\"loc\":[\"body\",\"status\"],\"msg\":\"String should match pattern '^(todo|inProgress|blocked|done)$'\",\"input\":\"review\",\"ctx\":{\"pattern\":\"^(todo|inProgress|blocked" 
```

## Root Cause
The API expects the status field to be one of the following values:
- `todo`
- `inProgress`
- `blocked`
- `done`

However, in the legacy comprehensive test script, one task was using an invalid status value (`review`), which doesn't match the API's validation pattern.

## Fix Implemented
1. Updated the status value in the legacy comprehensive test script from `review` to `inProgress`:
```javascript
// Changed:
{ title: 'Write Unit Tests', description: 'Create comprehensive test coverage', status: 'review' },
// To:
{ title: 'Write Unit Tests', description: 'Create comprehensive test coverage', status: 'inProgress' },
```

2. Validated that all status values in the k6 test scripts now comply with the API's validation pattern `^(todo|inProgress|blocked|done)$`.

3. Verified that the k6 tests now run successfully without validation errors.

## Additional Information
This fix ensures that all k6 tests can run successfully, both in local development and in CI/CD environments, without encountering validation errors from the API.

Date: June 23, 2025
