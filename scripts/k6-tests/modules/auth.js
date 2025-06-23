/**
 * K6 Authentication Module
 * 
 * Provides authentication utilities for K6 tests
 */

import http from 'k6/http';
import { check } from 'k6';

// Configuration
const BASE_URL = __ENV.API_URL || 'http://localhost:8000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN;

// Debug configuration
if (!AUTH_TOKEN) {
  console.warn('⚠️  AUTH_TOKEN environment variable is not set. Authentication may fail.');
} else {
  console.log(`🔑 Using AUTH_TOKEN: ${AUTH_TOKEN.substring(0, 10)}...`);
}

console.log(`🌐 Using BASE_URL: ${BASE_URL}`);
/**
 * Get authentication headers for API requests
 * @returns {Object} Headers object with authorization
 */
export function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AUTH_TOKEN}`,
  };
}

/**
 * Get the base URL for the API
 * @returns {string} Base URL
 */
export function getBaseURL() {
  return BASE_URL;
}

/**
 * Verify authentication is working
 * @returns {boolean} True if authenticated, false otherwise
 */
export function verifyAuth() {
  const response = authenticatedGet('/api/v1/column-settings/');

  const isAuthenticated = checkResponseStatus(response, 'authentication working', 200);

  if (!isAuthenticated) {
    console.error(`Authentication failed: ${response.status} - ${response.body}`);
  }

  return isAuthenticated;
}

/**
 * Make an authenticated GET request
 * @param {string} endpoint - The API endpoint (relative to base URL)
 * @returns {Object} HTTP response
 */
export function authenticatedGet(endpoint, params = {}) {
  params.tags = { url: `${BASE_URL}${endpoint}`, uri: normalizeUri(`${BASE_URL}${endpoint}`) };
  const headers = getAuthHeaders();
  return http.get(`${BASE_URL}${endpoint}`, { headers, ...params });
}

/**
 * Make an authenticated POST request
 * @param {string} endpoint - The API endpoint (relative to base URL)
 * @param {Object} data - Request body data
 * @returns {Object} HTTP response
 */
export function authenticatedPost(endpoint, data, params = {}) {
  params.tags = { url: `${BASE_URL}${endpoint}`, uri: normalizeUri(`${BASE_URL}${endpoint}`) };
  const headers = getAuthHeaders();
  return http.post(`${BASE_URL}${endpoint}`, JSON.stringify(data), { headers, ...params });
}

/**
 * Make an authenticated PUT request
 * @param {string} endpoint - The API endpoint (relative to base URL)
 * @param {Object} data - Request body data
 * @returns {Object} HTTP response
 */
export function authenticatedPut(endpoint, data, params = {}) {
  params.tags = { url: `${BASE_URL}${endpoint}`, uri: normalizeUri(`${BASE_URL}${endpoint}`) };
  const headers = getAuthHeaders();
  return http.put(`${BASE_URL}${endpoint}`, JSON.stringify(data), { headers, ...params });
}

/**
 * Make an authenticated DELETE request
 * @param {string} endpoint - The API endpoint (relative to base URL)
 * @returns {Object} HTTP response
 */
export function authenticatedDelete(endpoint, params = {}) {
  params.tags = { url: `${BASE_URL}${endpoint}`, uri: normalizeUri(`${BASE_URL}${endpoint}`) };
  const headers = getAuthHeaders();
  return http.del(`${BASE_URL}${endpoint}`, null, { headers, ...params });
}

/**
 * Normalize a URL by stripping task IDs or variable path segments
 * @param {string} url - The original URL
 * @returns {string} Normalized URI
 */
export function normalizeUri(url) {
  // Remove host and port
  const trimmedUrl = url.replace(/^https?:\/\/[^/]+/, '');

  // Preserve API version and replace numeric IDs or UUIDs in the URL with a placeholder
  return trimmedUrl.replace(/(\/api\/v\d+)(.*)/, (match, apiVersion, rest) => {
    return apiVersion + rest.replace(/\d+/g, '{todo_id}').replace(/[a-f0-9-]{36}/g, '{uuid}');
  });
}

/**
 * Check the response status and update successful or unsuccessful checks
 * @param {Object} response - The HTTP response object
 * @param {string} checkName - Name for the check (optional)
 * @param {number} expectedStatus - Expected status code (optional, defaults to any 2xx)
 * @param {Set} successfulChecks - A set to track successful checks (optional)
 * @param {Set} unsuccessfulChecks - A set to track unsuccessful checks (optional)
 * @returns {boolean} True if the status matches expectation, false otherwise
 */
export function checkResponseStatus(response,
  checkName = 'request successful',
  expectedStatus = null, successfulChecks = null,
  unsuccessfulChecks = null) {
  const checkObj = {};

  if (expectedStatus !== null) {
    // Check for specific status code
    checkObj[`status is ${expectedStatus}`] = (r) => {
      const result = r.status === expectedStatus;
      if (!result) {
        console.warn(`Expected status ${expectedStatus} but got ${r.status} for ${r.url}. Response: ${r.body ? r.body.substring(0, 200) : 'No body'}`);
      }
      if (successfulChecks && unsuccessfulChecks) {
        result ? successfulChecks.add(1) : unsuccessfulChecks.add(1);
      }
      return result;
    };
  } else {
    // Check for any 2xx success status
    checkObj[checkName] = (r) => {
      const result = r.status >= 200 && r.status < 300;
      if (!result) {
        console.warn(`Expected 2xx status but got ${r.status} for ${r.url}. Response: ${r.body ? r.body.substring(0, 200) : 'No body'}`);
      }
      if (successfulChecks && unsuccessfulChecks) {
        result ? successfulChecks.add(1) : unsuccessfulChecks.add(1);
      }
      return result;
    };
  }

  return check(response, checkObj);
}
