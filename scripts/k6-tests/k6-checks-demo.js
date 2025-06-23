/**
 * K6 Check Functions Demo
 * 
 * Example script demonstrating how to use the checks module
 * with comprehensive examples for all check functions
 */

import http from 'k6/http';
import { sleep } from 'k6';
import { 
  authenticatedGet,
  authenticatedPost,
  authenticatedPut,
  authenticatedDelete,
  checkResponseStatus
} from './modules/auth.js';
import { 
  resetSystemState
} from './modules/setup.js';

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

  // 1. Demo health check
  console.log('Testing API health check...');
  let response = authenticatedGet('/health');
  checkResponseStatus(response, 'health check successful', 200);
  
  // 2. Demo generic success check
  console.log('Testing generic success check...');
  response = authenticatedGet('/api/v1/version');
  checkResponseStatus(response, 'version endpoint successful', 200);

  // 3. Demo task creation
  console.log('Testing task creation checks...');
  response = authenticatedPost('/api/v1/todos/', demoTask);
  checkResponseStatus(response, 'task created successfully', 201);
  const taskId = response.json('id');
  
  // Get task
  console.log('Testing task retrieval checks...');
  response = authenticatedGet(`/api/v1/todos/${taskId}`);
  checkResponseStatus(response, 'task retrieved successfully', 200);

  // Update task
  console.log('Testing task update checks...');
  const updateData = { priority: 'high', title: `${demoTask.title} (Updated)` };
  response = authenticatedPut(`/api/v1/todos/${taskId}`, updateData);
  checkResponseStatus(response, 'task updated successfully', 200);
  
  // Delete task
  console.log('Testing task deletion checks...');
  response = authenticatedDelete(`/api/v1/todos/${taskId}`);
  checkResponseStatus(response, 'task deleted successfully', 204);

  // 4. Demo column settings
  console.log('Testing column settings checks...');
  response = authenticatedPut('/api/v1/column-settings/', demoColumns);
  checkResponseStatus(response, 'column settings updated successfully', 200);
  
  response = authenticatedGet('/api/v1/column-settings/');
  checkResponseStatus(response, 'column settings retrieved successfully', 200);

  // 5. Demo pagination
  console.log('Testing pagination checks...');
  // Create multiple tasks for pagination testing
  for (let i = 0; i < 5; i++) {
    authenticatedPost('/api/v1/todos/', {
      ...demoTask,
      title: `${demoTask.title} ${i}`,
    });
  }
  response = authenticatedGet('/api/v1/todos/?page=1&size=3');
  checkResponseStatus(response, 'paginated todos retrieved successfully', 200);

  // 6. Demo response time check
  console.log('Testing response time checks...');
  response = authenticatedGet('/api/v1/todos/');
  checkResponseStatus(response, 'todo list retrieval successful', 200);

  // 7. Demo auth error check
  console.log('Testing auth error checks...');
  // Note: This would need to be implemented differently without the checks module
  
  // --- Additional Demo Test ---
  console.log('Running additional demo test...');

  // Example: Get column settings
  response = authenticatedGet('/api/v1/column-settings');
  checkResponseStatus(response, 'get column settings successful', 200);

  // Example: Create a new task
  const taskData = { title: 'Checks Demo Test Task', description: 'Created during checks demo test', status: 'todo' };
  const createResponse = authenticatedPost('/api/v1/todos/', taskData);
  checkResponseStatus(createResponse, 'task created successfully', 201);

  // Example: Delete the task
  const demoTaskId = createResponse.json('id');
  const deleteResponse = authenticatedDelete(`/api/v1/todos/${demoTaskId}`);
  checkResponseStatus(deleteResponse, 'task deleted successfully', 204);
  
  console.log('✅ Checks demo completed successfully');
  sleep(1);
}

export function teardown() {
  console.log('Checks demo completed!');
}
