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
import { sleep } from 'k6';
import { Counter } from 'k6/metrics';
import {
  authenticatedGet,
  authenticatedPost,
  authenticatedPut,
  authenticatedDelete,
  getBaseURL,
  checkResponseStatus
}
  from './modules/auth.js';
import { resetSystemState, verifyCleanState } from './modules/setup.js';

// Custom metrics
const successfulChecks = new Counter('successful_checks');
const unsuccessfulChecks = new Counter('unsuccessful_checks');

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
    successful_checks: ['count>300'],
    unsuccessful_checks: ['count<30'],
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
  let response = authenticatedGet('/api/v1/column-settings/');
  checkResponseStatus(response, 'get column settings successful', 200, successfulChecks, unsuccessfulChecks);

  // 2. Update column settings (add/modify columns)
  const newConfig = getRandomElement(sampleColumnConfigs);
  response = authenticatedPut('/api/v1/column-settings', newConfig);
  checkResponseStatus(response, 'update column settings successful', 200, successfulChecks, unsuccessfulChecks);

  // 3. Verify the update was successful
  response = authenticatedGet('/api/v1/column-settings/');
  checkResponseStatus(response, 'verify column settings successful', 200, successfulChecks, unsuccessfulChecks);

  // 4. Reset column settings (occasionally)
  if (Math.random() < 0.1) {
    response = authenticatedPost('/api/v1/column-settings/reset');
    checkResponseStatus(response, 'reset column settings successful', 200, successfulChecks, unsuccessfulChecks);
  }
}

function testTodoOperations() {
  console.log('Testing todo operations...');

  // 1. Get all todos
  let response = authenticatedGet('/api/v1/todos/');
  checkResponseStatus(response, 'get todos successful', 200, successfulChecks, unsuccessfulChecks);

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

  response = authenticatedPost('/api/v1/todos/', todoToCreate);
  let createdTodo = null;
  checkResponseStatus(response, 'create todo successful', 201, successfulChecks, unsuccessfulChecks);

  if (response.status === 201) {
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

    response = authenticatedPut(`/api/v1/todos/${todoToUpdate.id}/`, updatedData);
    checkResponseStatus(response, 'update todo successful', 200, successfulChecks, unsuccessfulChecks);

    // 4. Get the specific todo
    response = authenticatedGet(`/api/v1/todos/${todoToUpdate.id}/`);
    checkResponseStatus(response, 'get specific todo successful', 200, successfulChecks, unsuccessfulChecks);

    // 5. Delete the todo
    response = authenticatedDelete(`/api/v1/todos/${todoToUpdate.id}`);
    checkResponseStatus(response, 'delete todo successful', 204, successfulChecks, unsuccessfulChecks);
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

    const response = authenticatedPost('/api/v1/todos/', todoData);
    checkResponseStatus(response, 'bulk create todo successful', 201, successfulChecks, unsuccessfulChecks);

    if (response.status === 201) {
      try {
        createdTodos.push(JSON.parse(response.body));
      } catch (e) {
        // Handle JSON parse error
      }
    }
    sleep(0.1); // Small delay between creations
  }

  console.log(`Created ${createdTodos.length} todos in bulk`);

  // 2. Bulk delete some todos
  if (createdTodos.length > 0) {
    const todosToDelete = createdTodos.slice(0, Math.min(3, createdTodos.length));

    for (const todo of todosToDelete) {
      const response = authenticatedDelete(`/api/v1/todos/${todo.id}`);
      checkResponseStatus(response, 'bulk delete todo successful', 204, successfulChecks, unsuccessfulChecks);
      sleep(0.1);
    }
  }
}

function testHealthEndpoints() {
  console.log('Testing health endpoints...');

  // 1. Basic health check
  let response = authenticatedGet('/health');
  checkResponseStatus(response, 'basic health check successful', 200, successfulChecks, unsuccessfulChecks);

  // 2. Detailed health check
  response = authenticatedGet('/api/v1/health/detailed');
checkResponseStatus(response, 'detailed health check successful', 200, successfulChecks, unsuccessfulChecks);

// 3. Database health check
response = authenticatedGet('/api/v1/health/database');
checkResponseStatus(response, 'database health check successful', 200, successfulChecks, unsuccessfulChecks);

// 4. Auth check
response = authenticatedGet('/api/v1/auth/me/');
checkResponseStatus(response, 'auth check successful', 200, successfulChecks, unsuccessfulChecks);

// 5. API status
response = authenticatedGet('/api/v1/status');
checkResponseStatus(response, 'api status check successful', 200, successfulChecks, unsuccessfulChecks);
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
