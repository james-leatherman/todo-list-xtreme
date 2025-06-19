/**
 * K6 Load Testing Script for Todo List Xtreme API
 * 
 * This script performs comprehensive API testing including:
 * - Add columns (column settings)
 * - Add tasks (todos)
 * - Update tasks
 * - Remove tasks
 * 
 * Uses modularized auth and setup for consistent testing
 * 
 * Usage:
 * k6 run --duration=5m --vus=10 scripts/k6-api-load-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { getAuthHeaders, authenticatedGet, authenticatedPost, authenticatedPut, authenticatedDelete, getBaseURL } from './modules/auth.js';
import { resetSystemState, verifyCleanState } from './modules/setup.js';

// Custom metrics
const errorRate = new Rate('errors');
const responseTrend = new Trend('response_time');
const operationCounter = new Counter('api_operations');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 5 },   // Warm up
    { duration: '2m', target: 10 },   // Normal load
    { duration: '1m', target: 20 },   // Peak load
    { duration: '30s', target: 0 },   // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.1'],     // Error rate under 10%
    errors: ['rate<0.05'],             // Custom error rate under 5%
  },
};

// Sample data for testing
const sampleTodos = [
  { title: 'Setup development environment', description: 'Install and configure all necessary tools', status: 'todo' },
  { title: 'Write API tests', description: 'Create comprehensive test suite', status: 'inProgress' },
  { title: 'Review code changes', description: 'Peer review of recent commits', status: 'todo' },
  { title: 'Deploy to staging', description: 'Deploy latest version to staging environment', status: 'blocked' },
  { title: 'Update documentation', description: 'Update API and user documentation', status: 'done' },
];

const sampleColumnConfigs = [
  {
    columns_config: {
      'todo': { name: 'To Do', color: '#e3f2fd' },
      'inProgress': { name: 'In Progress', color: '#fff3e0' },
      'blocked': { name: 'Blocked', color: '#ffebee' },
      'done': { name: 'Done', color: '#e8f5e8' }
    },
    column_order: ['todo', 'inProgress', 'blocked', 'done']
  },
  {
    columns_config: {
      'backlog': { name: 'Backlog', color: '#f3e5f5' },
      'todo': { name: 'To Do', color: '#e3f2fd' },
      'doing': { name: 'Doing', color: '#fff3e0' },
      'review': { name: 'Review', color: '#e0f2f1' },
      'done': { name: 'Done', color: '#e8f5e8' }
    },
    column_order: ['backlog', 'todo', 'doing', 'review', 'done']
  }
];

// Helper functions
function makeRequest(method, url, payload = null) {
  let response;
  
  // Use modularized auth functions
  switch (method.toLowerCase()) {
    case 'get':
      response = authenticatedGet(url);
      break;
    case 'post':
      response = authenticatedPost(url, payload);
      break;
    case 'put':
      response = authenticatedPut(url, payload);
      break;
    case 'delete':
      response = authenticatedDelete(url);
      break;
    default:
      throw new Error(`Unsupported HTTP method: ${method}`);
  }
  
  // Track metrics
  const success = check(response, {
    'status is 200': (r) => r.status >= 200 && r.status < 300,
    'response time < 2000ms': (r) => r.timings.duration < 2000,
  });
  
  errorRate.add(!success);
  responseTrend.add(response.timings.duration);
  operationCounter.add(1);
  
  return response;
}

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateRandomId() {
  return Math.floor(Math.random() * 1000000);
}

// Test scenarios
export default function () {
  // Reset system state at start of each iteration for clean testing
  if (__ITER === 0) {
    console.log(`[VU ${__VU}] Resetting system state for clean iteration...`);
    resetSystemState();
  }
  
  const scenario = Math.random();
  
  if (scenario < 0.3) {
    // 30% - Column operations
    testColumnOperations();
  } else if (scenario < 0.7) {
    // 40% - Todo CRUD operations
    testTodoOperations();
  } else if (scenario < 0.9) {
    // 20% - Bulk operations
    testBulkOperations();
  } else {
    // 10% - Health and status checks
    testHealthEndpoints();
  }
  
  sleep(Math.random() * 2 + 1); // Random sleep 1-3 seconds
}

function testColumnOperations() {
  console.log('Testing column operations...');
  
  // 1. Get current column settings
  let response = makeRequest('GET', '/api/v1/column-settings');
  check(response, {
    'get column settings successful': (r) => r.status === 200,
  });
  
  // 2. Update column settings (add/modify columns)
  const newConfig = getRandomElement(sampleColumnConfigs);
  response = makeRequest('PUT', '/api/v1/column-settings', newConfig);
  check(response, {
    'update column settings successful': (r) => r.status === 200,
  });
  
  // 3. Get default column settings
  response = makeRequest('GET', '/api/v1/column-settings/default');
  check(response, {
    'get default column settings successful': (r) => r.status === 200,
  });
  
  // 4. Reset column settings (occasionally)
  if (Math.random() < 0.1) {
    response = makeRequest('POST', '/api/v1/column-settings/reset');
    check(response, {
      'reset column settings successful': (r) => r.status === 200,
    });
  }
}

function testTodoOperations() {
  console.log('Testing todo operations...');
  
  // 1. Get all todos
  let response = makeRequest('GET', '/api/v1/todos/');
  check(response, {
    'get todos successful': (r) => r.status === 200,
  });
  
  let todos = [];
  if (response.status === 200) {
    try {
      todos = JSON.parse(response.body);
    } catch (e) {
      todos = [];
    }
  }
  
  // 2. Create a new todo (add task)
  const newTodo = getRandomElement(sampleTodos);
  const todoToCreate = {
    ...newTodo,
    title: `${newTodo.title} - ${generateRandomId()}`,
    description: `${newTodo.description} (Created by k6 test at ${new Date().toISOString()})`
  };
  
  response = makeRequest('POST', '/api/v1/todos/', todoToCreate);
  let createdTodo = null;
  if (check(response, {
    'create todo successful': (r) => r.status === 201,
  })) {
    try {
      createdTodo = JSON.parse(response.body);
    } catch (e) {
      // Handle JSON parse error
    }
  }
  
  // 3. Update a todo (if we have todos or just created one)
  let todoToUpdate = createdTodo || (todos.length > 0 ? getRandomElement(todos) : null);
  
  if (todoToUpdate) {
    const updatedData = {
      title: `Updated: ${todoToUpdate.title}`,
      description: `Updated at ${new Date().toISOString()}`,
      status: getRandomElement(['todo', 'inProgress', 'blocked', 'done']),
      is_completed: todoToUpdate.status === 'done'
    };
    
    response = makeRequest('PUT', `/api/v1/todos/${todoToUpdate.id}/`, updatedData);
    check(response, {
      'update todo successful': (r) => r.status === 200,
    });
    
    // 4. Get the specific todo
    response = makeRequest('GET', `/api/v1/todos/${todoToUpdate.id}/`);
    check(response, {
      'get specific todo successful': (r) => r.status === 200,
    });
  }
  
  // 5. Delete a todo (remove task) - occasionally
  if (todoToUpdate && Math.random() < 0.3) {
    response = makeRequest('DELETE', `/api/v1/todos/${todoToUpdate.id}`);
    check(response, {
      'delete todo successful': (r) => r.status === 204,
    });
  }
}

function testBulkOperations() {
  console.log('Testing bulk operations...');
  
  // Create multiple todos first
  const todosToCreate = 3;
  const createdTodos = [];
  
  for (let i = 0; i < todosToCreate; i++) {
    const todo = getRandomElement(sampleTodos);
    const todoData = {
      ...todo,
      title: `Bulk Test ${i + 1} - ${todo.title}`,
      description: `Bulk operation test todo ${i + 1}`,
      status: 'todo'
    };
    
    const response = makeRequest('POST', '/api/v1/todos/', todoData);
    if (response.status === 201) {
      try {
        createdTodos.push(JSON.parse(response.body));
      } catch (e) {
        // Handle JSON parse error
      }
    }
    sleep(0.1); // Small delay between creations
  }
  
  // Bulk delete by status (remove tasks by column)
  if (Math.random() < 0.2) { // 20% chance to do bulk delete
    const statusToDelete = 'todo';
    const response = makeRequest('DELETE', `/api/v1/todos/column/${statusToDelete}`);
    check(response, {
      'bulk delete todos successful': (r) => r.status === 204,
    });
  }
}

function testHealthEndpoints() {
  console.log('Testing health endpoints...');
  
  // 1. Basic health check
  let response = makeRequest('GET', '/health');
  check(response, {
    'health check successful': (r) => r.status === 200,
  });
  
  // 2. Detailed health check
  response = makeRequest('GET', '/api/v1/health/detailed');
  check(response, {
    'detailed health check successful': (r) => r.status === 200,
  });
  
  // 3. Database health check
  response = makeRequest('GET', '/api/v1/health/database');
  check(response, {
    'database health check successful': (r) => r.status === 200,
  });
  
  // 4. Auth check
  response = makeRequest('GET', '/api/v1/auth/me/');
  check(response, {
    'auth check successful': (r) => r.status === 200,
  });
  
  // 5. API status
  response = makeRequest('GET', '/api/v1/status');
  check(response, {
    'api status check successful': (r) => r.status === 200,
  });
}

// Setup function (runs once per VU at the start)
export function setup() {
  console.log('Setting up k6 load test...');
  
  // Verify API is accessible
  const response = http.get(`${getBaseURL()}/health`);
  if (response.status !== 200) {
    throw new Error(`API not accessible: ${response.status}`);
  }
  
  // Reset system to clean state for consistent load testing
  console.log('Performing initial system reset for clean load testing...');
  resetSystemState();
  verifyCleanState();
  
  console.log('K6 load test setup complete - API is accessible and system is clean');
  return { baseUrl: getBaseURL(), setupTime: Date.now() };
}

// Teardown function (runs once after all VUs finish)
export function teardown(data) {
  const duration = Date.now() - data.setupTime;
  console.log(`K6 load test completed in ${duration}ms`);
  
  // Clean up after load testing
  console.log('Performing final cleanup after load testing...');
  resetSystemState();
  
  console.log('K6 load test teardown complete');
}
