/**
 * K6 Check Functions Demo
 * 
 * Example script demonstrating how to use the checks module
 * with comprehensive examples for all check functions
 */

import http from 'k6/http';
import { sleep, check } from 'k6';
import { 
  getBaseURL, 
  getAuthHeaders,
  authenticatedGet,
  authenticatedPost,
  authenticatedPut,
  authenticatedDelete,
  normalizeUri
} from './modules/auth.js';
import { 
  resetSystemState
} from './modules/setup.js';
import {
  checkSuccess,
  checkTaskResponse,
  checkColumnsResponse,
  checkPagination,
  checkAuthError,
  checkHealth,
  checkResponseTime
} from './modules/checks.js';

export const options = {
  vus: 2,
  duration: '10s',
  thresholds: {
    // Add thresholds to validate checks
    checks: ['rate>0.95'], // 95% of checks must pass
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
  }
};

// Test data for demonstrations
const demoTask = {
  title: 'Checks Demo Task', 
  description: 'Testing the checks module', 
  status: 'todo',
  priority: 'medium'
};

const demoColumns = {
  column_order: ['todo', 'inProgress', 'done'],
  columns_config: {
    'todo': { 
      id: 'todo', 
      title: 'To Do', 
      taskIds: [] 
    },
    'inProgress': { 
      id: 'inProgress', 
      title: 'In Progress', 
      taskIds: [] 
    },
    'done': { 
      id: 'done', 
      title: 'Completed', 
      taskIds: [] 
    }
  }
};

const SCRIPT_NAME = 'k6-checks-demo.js';

export default function () {
  // Initialize test environment
  if (__VU === 1 && __ITER === 0) {
    console.log('Initializing test environment...');
    resetSystemState(true);
  }

  console.log(`[VU ${__VU}] Running checks module demo...`);

  // 1. Demo checkHealth
  console.log('Testing API health check...');
  let response = http.get(`${getBaseURL()}/health`, { tags: { url: '/health', script: SCRIPT_NAME } });
  checkHealth(response);
  
  // 2. Demo checkSuccess with generic endpoints
  console.log('Testing generic success check...');
  response = http.get(`${getBaseURL()}/api/v1/version`);
  checkSuccess(response, 'version endpoint');

  // 3. Demo checkTaskResponse
  console.log('Testing task creation checks...');
  // Create task
  response = authenticatedPost('/api/v1/todos/', demoTask, { tags: { url: '/api/v1/todos/', script: SCRIPT_NAME } });
  checkTaskResponse(response, 'create');
  const taskId = response.json('id');
  
  // Get task
  console.log('Testing task retrieval checks...');
  response = authenticatedGet(`/api/v1/todos/${taskId}`);
  checkTaskResponse(response, 'get');

  // Update task
  console.log('Testing task update checks...');
  const updateData = { priority: 'high', title: `${demoTask.title} (Updated)` };
  response = authenticatedPut(`/api/v1/todos/${taskId}`, updateData);
  checkTaskResponse(response, 'update');
  
  // Delete task
  console.log('Testing task deletion checks...');
  response = authenticatedDelete(`/api/v1/todos/${taskId}`, { tags: { url: '/api/v1/todos/', script: SCRIPT_NAME } });
  checkTaskResponse(response, 'delete');

  // 4. Demo checkColumnsResponse
  console.log('Testing column settings checks...');
  response = authenticatedPut('/api/v1/column-settings/', demoColumns, { tags: { url: '/api/v1/column-settings/', script: SCRIPT_NAME } });
  checkColumnsResponse(response, 'update');
  
  response = authenticatedGet('/api/v1/column-settings/');
  checkColumnsResponse(response, 'get');

  // 5. Demo checkPagination
  console.log('Testing pagination checks...');
  // Create multiple tasks for pagination testing
  for (let i = 0; i < 5; i++) {
    authenticatedPost('/api/v1/todos/', {
      ...demoTask,
      title: `${demoTask.title} ${i}`,
    });
  }
  response = authenticatedGet('/api/v1/todos/?page=1&size=3');
  checkPagination(response);

  // 6. Demo checkResponseTime with custom thresholds
  console.log('Testing response time checks...');
  response = authenticatedGet('/api/v1/todos/');
  checkResponseTime(response, 1000, 'Todo list retrieval');

  // 7. Demo checkAuthError
  console.log('Testing auth error checks...');
  response = http.get(`${getBaseURL()}/api/v1/todos/`, {
    headers: { 'Content-Type': 'application/json' } // No auth token
  });
  checkAuthError(response);

  // Example usage of normalizeUri
  const uri = normalizeUri('/api/v1/todos/54321');
  console.log(`Normalized URI: ${uri}`);

  // --- Checks Demo Test Function ---
  function checksDemoTest() {
    console.log('Running checks demo test...');

    // Example: Get column settings
    let response = authenticatedGet('/api/v1/column-settings');
    check(response, {
      'get column settings successful': (r) => r.status === 200,
    });

    // Example: Create a new task
    const taskData = { title: 'Checks Demo Test Task', description: 'Created during checks demo test', status: 'todo' };
    const createResponse = authenticatedPost('/api/v1/todos/', taskData);
    check(createResponse, {
      'task created successfully': (r) => r.status === 201,
    });

    // Example: Delete the task
    const taskId = createResponse.json('id');
    const deleteResponse = authenticatedDelete(`/api/v1/todos/${taskId}`);
    check(deleteResponse, {
      'task deleted successfully': (r) => r.status === 204,
    });
  }

  checksDemoTest();

  sleep(1);
}

export function teardown() {
  console.log('Checks demo completed!');
}
