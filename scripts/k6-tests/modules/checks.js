/**
 * K6 Checks Module
 * 
 * Standardized check functions for API testing with k6
 * These functions simplify test assertions and provide consistent reporting
 * 
 * NOTE: This module is being deprecated in favor of using checkResponseStatus() directly
 * from auth.js for better consistency and metrics aggregation.
 */

import { checkResponseStatus } from './auth.js';

/**
 * Generic success check for any response
 * @param {Object} response - HTTP response from k6
 * @param {string} operationName - Name of the operation (for reporting)
 * @param {number} expectedStatus - Expected HTTP status code (default: 200)
 * @returns {boolean} Whether the check passed
 */
export function checkSuccess(response, operationName, expectedStatus = 200) {
  return check(response, {
    [`${operationName} returned ${expectedStatus}`]: (r) => r.status === expectedStatus,
    [`${operationName} response is valid JSON`]: (r) => {
      try {
        if (r.body) {
          JSON.parse(r.body);
          return true;
        }
        return expectedStatus === 204; // No content
      } catch (e) {
        return false;
      }
    },
  });
}

/**
 * Check task API responses based on operation type
 * @param {Object} response - HTTP response from k6
 * @param {string} operation - One of 'create', 'get', 'update', 'delete', 'list'
 * @returns {boolean} Whether all checks passed
 */
export function checkTaskResponse(response, operation) {
  
  switch (operation.toLowerCase()) {
    case 'create':
      return check(response, {
        'task created successfully': (r) => r.status === 201,
        'created task has ID': (r) => r.json('id') !== undefined,
        'created task has correct title': (r) => r.json('title') !== undefined,
        'created task has correct status': (r) => r.json('status') !== undefined,
      });
    
    case 'get':
      return check(response, {
        'task retrieved successfully': (r) => r.status === 200,
        'task has ID': (r) => r.json('id') !== undefined,
        'task has title': (r) => r.json('title') !== undefined,
        'task has description': (r) => r.json('description') !== undefined,
        'task has status': (r) => r.json('status') !== undefined,
      });
      
    case 'update':
      return check(response, {
        'task updated successfully': (r) => r.status === 200,
        'updated task has correct ID': (r) => r.json('id') !== undefined,
      });
      
    case 'delete':
      return check(response, {
        'task deleted successfully': (r) => r.status === 204,
      });
      
    case 'list':
      return check(response, {
        'task list retrieved successfully': (r) => r.status === 200,
        'task list is an array': (r) => Array.isArray(r.json()),
      });
      
    default:
      console.error(`Invalid operation "${operation}" for checkTaskResponse`);
      return false;
  }
}

/**
 * Check column settings API responses
 * @param {Object} response - HTTP response from k6
 * @param {string} operation - One of 'get', 'update'
 * @returns {boolean} Whether all checks passed
 */
export function checkColumnsResponse(response, operation) {
  
  switch (operation.toLowerCase()) {
    case 'get':
      return check(response, {
        'column settings retrieved successfully': (r) => r.status === 200,
        'column settings have column_order': (r) => Array.isArray(r.json('column_order')),
        'column settings have columns_config': (r) => r.json('columns_config') !== undefined,
      });
      
    case 'update':
      return check(response, {
        'column settings updated successfully': (r) => r.status === 200,
        'updated settings have column_order': (r) => Array.isArray(r.json('column_order')),
        'updated settings have columns_config': (r) => r.json('columns_config') !== undefined,
      });
      
    default:
      console.error(`Invalid operation "${operation}" for checkColumnsResponse`);
      return false;
  }
}

/**
 * Check pagination in list responses
 * @param {Object} response - HTTP response from k6
 * @returns {boolean} Whether all pagination checks passed
 */
export function checkPagination(response) {
  return check(response, {
    'pagination response successful': (r) => r.status === 200,
    'pagination includes total count': (r) => Number.isInteger(r.json('total')),
    'pagination includes items': (r) => Array.isArray(r.json('items')),
    'pagination includes page number': (r) => Number.isInteger(r.json('page')),
    'pagination includes page size': (r) => Number.isInteger(r.json('size')),
  });
}

/**
 * Check authentication errors
 * @param {Object} response - HTTP response from k6
 * @returns {boolean} Whether proper auth error is returned
 */
export function checkAuthError(response) {
  return check(response, {
    'auth error status is 401 or 403': (r) => r.status === 401 || r.status === 403,
    'auth error has detail message': (r) => {
      try {
        const body = JSON.parse(r.body);
        return typeof body.detail === 'string';
      } catch (e) {
        return false;
      }
    },
  });
}

/**
 * Check API health endpoint
 * @param {Object} response - HTTP response from k6
 * @returns {boolean} Whether health check passed
 */
export function checkHealth(response) {
  
  return check(response, {
    'health check is successful': (r) => r.status === 200,
    'health status is "healthy"': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.status === 'healthy';
      } catch (e) {
        return false;
      }
    },
  });
}

/**
 * Check response time against threshold
 * @param {Object} response - HTTP response from k6
 * @param {number} threshold - Maximum acceptable response time (ms)
 * @param {string} operationName - Name of the operation (for reporting)
 * @returns {boolean} Whether response time is acceptable
 */
export function checkResponseTime(response, threshold, operationName) {
  return check(response, {
    [`${operationName} response time < ${threshold}ms`]: (r) => r.timings.duration < threshold,
  });
}
