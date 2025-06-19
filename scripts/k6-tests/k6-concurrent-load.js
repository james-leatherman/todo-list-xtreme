/**
 * K6 Concurrent Load Script for Todo List Xtreme API
 * 
 * This script creates concurrent load focusing on:
 * - Adding columns (multiple configurations)
 * - Adding tasks in different columns
 * - Moving tasks between columns
 * - Removing tasks from specific columns
 * 
 * Uses modularized auth and setup for consistent testing
 * 
 * Usage:
 * k6 run --duration=2m --vus=20 scripts/k6-concurrent-load.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';
import { getAuthHeaders, authenticatedGet, authenticatedPost, authenticatedPut, authenticatedDelete, getBaseURL } from './modules/auth.js';
import { resetSystemState, verifyCleanState } from './modules/setup.js';

// Custom metrics for better observability
const errorRate = new Rate('api_errors');
const operationDuration = new Trend('operation_duration');
const concurrentUsers = new Gauge('concurrent_users');
const todoOperations = new Counter('todo_operations');
const columnOperations = new Counter('column_operations');

// Test configuration optimized for concurrent load
export const options = {
  stages: [
    { duration: '10s', target: 5 },   // Quick ramp up
    { duration: '20s', target: 15 },  // Build load
    { duration: '30s', target: 25 },  // Peak concurrent load
    { duration: '20s', target: 15 },  // Reduce load
    { duration: '10s', target: 0 },   // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1500'],     // 95% under 1.5s
    http_req_failed: ['rate<0.05'],        // Error rate under 5%
    api_errors: ['rate<0.03'],             // Custom error rate under 3%
    operation_duration: ['p(90)<1000'],    // 90% operations under 1s
  },
};

// Column configurations for testing different scenarios
const columnConfigurations = [
  {
    name: "Basic Kanban",
    config: {
      columns_config: {
        'todo': { name: 'To Do', color: '#e3f2fd' },
        'inProgress': { name: 'In Progress', color: '#fff3e0' },
        'done': { name: 'Done', color: '#e8f5e8' }
      },
      column_order: ['todo', 'inProgress', 'done']
    }
  },
  {
    name: "Extended Workflow",
    config: {
      columns_config: {
        'backlog': { name: 'Backlog', color: '#f3e5f5' },
        'todo': { name: 'To Do', color: '#e3f2fd' },
        'inProgress': { name: 'In Progress', color: '#fff3e0' },
        'review': { name: 'Code Review', color: '#e0f2f1' },
        'testing': { name: 'Testing', color: '#fff8e1' },
        'done': { name: 'Done', color: '#e8f5e8' }
      },
      column_order: ['backlog', 'todo', 'inProgress', 'review', 'testing', 'done']
    }
  },
  {
    name: "Bug Tracking",
    config: {
      columns_config: {
        'reported': { name: 'Reported', color: '#ffebee' },
        'investigating': { name: 'Investigating', color: '#fff3e0' },
        'fixing': { name: 'Fixing', color: '#e3f2fd' },
        'testing': { name: 'Testing Fix', color: '#e0f2f1' },
        'resolved': { name: 'Resolved', color: '#e8f5e8' }
      },
      column_order: ['reported', 'investigating', 'fixing', 'testing', 'resolved']
    }
  },
  {
    name: "Scrum Board",
    config: {
      columns_config: {
        'productBacklog': { name: 'Product Backlog', color: '#f3e5f5' },
        'sprintBacklog': { name: 'Sprint Backlog', color: '#e3f2fd' },
        'inProgress': { name: 'In Progress', color: '#fff3e0' },
        'blocked': { name: 'Blocked', color: '#ffebee' },
        'review': { name: 'Review', color: '#e0f2f1' },
        'done': { name: 'Done', color: '#e8f5e8' }
      },
      column_order: ['productBacklog', 'sprintBacklog', 'inProgress', 'blocked', 'review', 'done']
    }
  }
];

// Task templates for different scenarios
const taskTemplates = [
  { title: 'Implement user authentication', description: 'Add OAuth2 authentication flow', priority: 'high' },
  { title: 'Fix responsive design issues', description: 'Mobile layout needs improvement', priority: 'medium' },
  { title: 'Add unit tests for API', description: 'Increase test coverage to 90%', priority: 'high' },
  { title: 'Update documentation', description: 'API documentation needs updates', priority: 'low' },
  { title: 'Optimize database queries', description: 'Improve query performance', priority: 'medium' },
  { title: 'Implement caching layer', description: 'Add Redis caching for better performance', priority: 'high' },
  { title: 'Setup monitoring alerts', description: 'Configure Grafana alerts for key metrics', priority: 'medium' },
  { title: 'Code review cleanup', description: 'Address technical debt in core modules', priority: 'low' },
  { title: 'Security vulnerability scan', description: 'Run security audit and fix issues', priority: 'high' },
  { title: 'Performance load testing', description: 'Test application under load', priority: 'medium' }
];

// Utility functions
function makeApiCall(method, url, payload = null) {
  const startTime = Date.now();
  
  let response;
  try {
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
  } catch (error) {
    console.error(`API call failed: ${error.message}`);
    errorRate.add(1);
    return null;
  }
  
  const duration = Date.now() - startTime;
  operationDuration.add(duration);
  
  const success = response.status >= 200 && response.status < 300;
  errorRate.add(!success);
  
  return response;
}

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateUniqueId() {
  return `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function getUserId() {
  return `user-${__VU}-${__ITER}`;
}

// Main test scenarios
export default function () {
  const vuId = __VU;
  const iteration = __ITER;
  
  concurrentUsers.add(1);
  
  // Different users focus on different operations to create realistic load
  const scenario = vuId % 4;
  
  switch (scenario) {
    case 0:
      // Column management focused
      performColumnManagement();
      break;
    case 1:
      // Task creation focused
      performTaskCreation();
      break;
    case 2:
      // Task movement focused
      performTaskMovement();
      break;
    case 3:
      // Task cleanup focused
      performTaskCleanup();
      break;
  }
  
  sleep(Math.random() * 1.5 + 0.5); // Random sleep 0.5-2 seconds
}

function performColumnManagement() {
  console.log(`[VU ${__VU}] Performing column management operations...`);
  
  // 1. Get current column settings
  let response = makeApiCall('GET', '/api/v1/column-settings');
  if (!response || response.status !== 200) {
    console.log(`[VU ${__VU}] Failed to get column settings`);
    return;
  }
  
  columnOperations.add(1);
  
  // 2. Choose a random column configuration and apply it
  const configChoice = getRandomElement(columnConfigurations);
  console.log(`[VU ${__VU}] Applying ${configChoice.name} configuration`);
  
  response = makeApiCall('PUT', '/api/v1/column-settings', configChoice.config);
  check(response, {
    'column configuration updated': (r) => r && r.status === 200,
  });
  
  if (response && response.status === 200) {
    columnOperations.add(1);
    console.log(`[VU ${__VU}] Successfully applied ${configChoice.name}`);
  }
  
  sleep(0.5);
  
  // 3. Verify the configuration was applied
  response = makeApiCall('GET', '/api/v1/column-settings');
  check(response, {
    'configuration verification': (r) => r && r.status === 200,
  });
}

function performTaskCreation() {
  console.log(`[VU ${__VU}] Performing task creation operations...`);
  
  // Get available columns first
  const response = makeApiCall('GET', '/api/v1/column-settings');
  if (!response || response.status !== 200) {
    console.log(`[VU ${__VU}] Failed to get column settings for task creation`);
    return;
  }
  
  let availableColumns = ['todo', 'inProgress', 'done']; // Default fallback
  try {
    const settings = JSON.parse(response.body);
    if (settings.column_order) {
      availableColumns = JSON.parse(settings.column_order);
    }
  } catch (e) {
    console.log(`[VU ${__VU}] Using default columns due to parse error`);
  }
  
  // Create multiple tasks in different columns
  const tasksToCreate = 2 + Math.floor(Math.random() * 3); // 2-4 tasks
  
  for (let i = 0; i < tasksToCreate; i++) {
    const template = getRandomElement(taskTemplates);
    const targetColumn = getRandomElement(availableColumns);
    
    const newTask = {
      title: `${template.title} - ${generateUniqueId()}`,
      description: `${template.description} (Created by VU ${__VU}, iteration ${__ITER})`,
      status: targetColumn,
      is_completed: targetColumn === 'done'
    };
    
    const createResponse = makeApiCall('POST', '/api/v1/todos/', newTask);
    const success = check(createResponse, {
      'task created successfully': (r) => r && r.status === 201,
    });
    
    if (success) {
      todoOperations.add(1);
      console.log(`[VU ${__VU}] Created task in ${targetColumn}: ${newTask.title}`);
    }
    
    sleep(0.2); // Small delay between task creations
  }
}

function performTaskMovement() {
  console.log(`[VU ${__VU}] Performing task movement operations...`);
  
  // 1. Get existing tasks
  let response = makeApiCall('GET', '/api/v1/todos/');
  if (!response || response.status !== 200) {
    console.log(`[VU ${__VU}] Failed to get todos for movement`);
    return;
  }
  
  let todos;
  try {
    todos = JSON.parse(response.body);
  } catch (e) {
    console.log(`[VU ${__VU}] Failed to parse todos response`);
    return;
  }
  
  if (todos.length === 0) {
    console.log(`[VU ${__VU}] No todos available for movement`);
    return;
  }
  
  // 2. Get available columns
  response = makeApiCall('GET', '/api/v1/column-settings');
  let availableColumns = ['todo', 'inProgress', 'done'];
  if (response && response.status === 200) {
    try {
      const settings = JSON.parse(response.body);
      if (settings.column_order) {
        availableColumns = JSON.parse(settings.column_order);
      }
    } catch (e) {
      // Use default columns
    }
  }
  
  // 3. Move random tasks between columns
  const tasksToMove = Math.min(3, todos.length);
  for (let i = 0; i < tasksToMove; i++) {
    const todoToMove = getRandomElement(todos);
    const newStatus = getRandomElement(availableColumns.filter(col => col !== todoToMove.status));
    
    const updateData = {
      ...todoToMove,
      status: newStatus,
      is_completed: newStatus === 'done',
      description: `${todoToMove.description} (Moved to ${newStatus} by VU ${__VU})`
    };
    
    const updateResponse = makeApiCall('PUT', `/api/v1/todos/${todoToMove.id}/`, updateData);
    const success = check(updateResponse, {
      'task moved successfully': (r) => r && r.status === 200,
    });
    
    if (success) {
      todoOperations.add(1);
      console.log(`[VU ${__VU}] Moved task ${todoToMove.id} from ${todoToMove.status} to ${newStatus}`);
    }
    
    sleep(0.3);
  }
}

function performTaskCleanup() {
  console.log(`[VU ${__VU}] Performing task cleanup operations...`);
  
  // 1. Get all todos
  let response = makeApiCall('GET', '/api/v1/todos/');
  if (!response || response.status !== 200) {
    console.log(`[VU ${__VU}] Failed to get todos for cleanup`);
    return;
  }
  
  let todos;
  try {
    todos = JSON.parse(response.body);
  } catch (e) {
    console.log(`[VU ${__VU}] Failed to parse todos for cleanup`);
    return;
  }
  
  // 2. Delete some completed tasks
  const completedTodos = todos.filter(todo => todo.status === 'done' || todo.is_completed);
  const tasksToDelete = Math.min(2, completedTodos.length);
  
  for (let i = 0; i < tasksToDelete; i++) {
    const todoToDelete = completedTodos[i];
    
    const deleteResponse = makeApiCall('DELETE', `/api/v1/todos/${todoToDelete.id}`);
    const success = check(deleteResponse, {
      'task deleted successfully': (r) => r && r.status === 204,
    });
    
    if (success) {
      todoOperations.add(1);
      console.log(`[VU ${__VU}] Deleted completed task: ${todoToDelete.title}`);
    }
    
    sleep(0.2);
  }
  
  // 3. Occasionally perform bulk cleanup
  if (Math.random() < 0.1) { // 10% chance
    console.log(`[VU ${__VU}] Performing bulk cleanup of 'done' column`);
    
    const bulkDeleteResponse = makeApiCall('DELETE', '/api/v1/todos/column/done');
    const success = check(bulkDeleteResponse, {
      'bulk delete successful': (r) => r && r.status === 204,
    });
    
    if (success) {
      todoOperations.add(1);
      console.log(`[VU ${__VU}] Bulk deleted all tasks from 'done' column`);
    }
  }
}

// Setup function
export function setup() {
  console.log('Setting up concurrent load test...');
  
  // Verify API accessibility
  const response = http.get(`${getBaseURL()}/health`);
  if (response.status !== 200) {
    throw new Error(`API not accessible: ${response.status} - ${response.body}`);
  }
  
  // Verify authentication using modularized auth
  const authResponse = authenticatedGet('/api/v1/auth/me/');
  if (authResponse.status !== 200) {
    console.warn('Authentication may not be working properly');
  }
  
  // Reset system to clean state for consistent load testing
  console.log('Performing initial system reset for clean load testing...');
  resetSystemState();
  verifyCleanState();
  
  console.log('Concurrent load test setup complete');
  return { setupTime: Date.now() };
}

// Teardown function
export function teardown(data) {
  const duration = Date.now() - data.setupTime;
  console.log(`Concurrent load test completed in ${duration}ms`);
  
  // Clean up after load testing
  console.log('Performing final cleanup after load testing...');
  resetSystemState();
  
  console.log('Final metrics summary will be displayed by k6');
}
