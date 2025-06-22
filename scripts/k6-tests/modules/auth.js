/**
 * K6 Authentication Module
 * 
 * Provides authentication utilities for K6 tests
 */

import http from 'k6/http';
import { check } from 'k6';

// Configuration
const BASE_URL = __ENV.API_URL || 'http://localhost:8000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNzUwMjk4NDg0LCJleHAiOjE3NTAzODQ4ODQsInVzZXJfaWQiOjF9.cdRfFwSnNIc9FiHAbg2LV2FTem3cM-Iv-FYavD8hHCI';

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
  const headers = getAuthHeaders();
  const response = http.get(`${BASE_URL}/api/v1/column-settings/`, { headers });
  
  const isAuthenticated = check(response, {
    'authentication working': (r) => r.status === 200,
  });
  
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
    return apiVersion + rest.replace(/\d+/g, '{id}').replace(/[a-f0-9-]{36}/g, '{uuid}');
  });
}
