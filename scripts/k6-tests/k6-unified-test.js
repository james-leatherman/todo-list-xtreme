/**
 * K6 Unified API Test Script
 * 
 * Single, flexible test script that can handle different testing scenarios:
 * - Quick smoke test (default)
 * - Load testing with stages  
 * - Comprehensive feature testing
 * - Concurrent stress testing
 * 
 * Environment Variables:
 * - TEST_MODE: 'quick' | 'load' | 'comprehensive' | 'stress' (default: 'quick')
 * - DEBUG: 'true' | 'false' (enables detailed logging)
 * - AUTH_TOKEN: JWT token for authentication
 * - API_URL: Base URL for the API (default: http://localhost:8000)
 * 
 * Usage Examples:
 * # Quick smoke test (default)
 * k6 run k6-unified-test.js
 * 
 * # Load testing
 * TEST_MODE=load k6 run k6-unified-test.js
 * 
 * # Comprehensive testing with debug
 * TEST_MODE=comprehensive DEBUG=true k6 run k6-unified-test.js
 * 
 * # Stress testing
 * TEST_MODE=stress k6 run k6-unified-test.js
 */

import { sleep } from 'k6';
import {
  getBaseURL,
  verifyAuth,
  authenticatedGet,
  authenticatedPost,
  authenticatedPut,
  authenticatedDelete,
  checkResponseStatus
} from './modules/auth.js';
import {
  resetSystemState,
  verifyCleanState,
  cleanupTasksOnly
} from './modules/setup.js';

// Configuration
const TEST_MODE = __ENV.TEST_MODE || 'quick';
const DEBUG = __ENV.DEBUG === 'true' || __ENV.DEBUG === '1';

// Debug logging utility
function debugLog(message, data = null) {
  if (DEBUG) {
    const timestamp = new Date().toISOString();
    if (data) {
      console.log(`[DEBUG ${timestamp}] ${message}: ${JSON.stringify(data)}`);
    } else {
      console.log(`[DEBUG ${timestamp}] ${message}`);
    }
  }
}

// Test configurations for different modes
const testConfigs = {
  quick: {
    vus: 2,
    duration: '30s',
    thresholds: {
      checks: ['rate>0.95'],
      http_req_duration: ['p(95)<1000'],
      http_req_failed: ['rate<0.05'],
    },
    description: 'Quick smoke test'
  },
  load: {
    stages: [
      { duration: '30s', target: 5 },   // Warm up
      { duration: '2m', target: 10 },   // Normal load
      { duration: '1m', target: 20 },   // Peak load
      { duration: '30s', target: 0 },   // Cool down
    ],
    thresholds: {
      checks: ['rate>0.95'],
      http_req_duration: ['p(95)<2000'],
      http_req_failed: ['rate<0.1'],
    },
    description: 'Load testing with stages'
  },
  comprehensive: {
    vus: 3,
    duration: '60s',
    thresholds: {
      checks: ['rate>0.95'],
      http_req_duration: ['p(95)<1000'],
      http_req_failed: ['rate<0.1'],
    },
    description: 'Comprehensive feature testing'
  },
  stress: {
    stages: [
      { duration: '1m', target: 10 },   // Warm up
      { duration: '3m', target: 50 },   // Stress load
      { duration: '1m', target: 0 },    // Cool down
    ],
    thresholds: {
      checks: ['rate>0.90'],  // Lower threshold for stress
      http_req_duration: ['p(95)<5000'],
      http_req_failed: ['rate<0.2'],
    },
    description: 'Stress testing'
  }
};

// Apply configuration based on test mode
const config = testConfigs[TEST_MODE] || testConfigs.quick;
export const options = config;

console.log(`🎯 Running ${config.description} (mode: ${TEST_MODE})`);
if (DEBUG) {
  console.log('🐛 DEBUG MODE ENABLED - Detailed logging will be shown');
}

// Test data configurations
const columnConfigs = [
  {
    name: 'Simple Kanban',
    config: {
      column_order: ['todo', 'doing', 'done'],
      columns_config: {
        'todo': { id: 'todo', title: 'To Do', taskIds: [] },
        'doing': { id: 'doing', title: 'Doing', taskIds: [] },
        'done': { id: 'done', title: 'Done', taskIds: [] }
      }
    }
  },
  {
    name: 'Standard Workflow',
    config: {
      column_order: ['todo', 'inProgress', 'blocked', 'done'],
      columns_config: {
        'todo': { id: 'todo', title: 'To Do', taskIds: [] },
        'inProgress': { id: 'inProgress', title: 'In Progress', taskIds: [] },
        'blocked': { id: 'blocked', title: 'Blocked', taskIds: [] },
        'done': { id: 'done', title: 'Completed', taskIds: [] }
      }
    }
  },
  {
    name: 'Extended Workflow',
    config: {
      column_order: ['backlog', 'todo', 'inProgress', 'review', 'done'],
      columns_config: {
        'backlog': { id: 'backlog', title: 'Backlog', taskIds: [] },
        'todo': { id: 'todo', title: 'To Do', taskIds: [] },
        'inProgress': { id: 'inProgress', title: 'In Progress', taskIds: [] },
        'review': { id: 'review', title: 'Review', taskIds: [] },
        'done': { id: 'done', title: 'Done', taskIds: [] }
      }
    }
  }
];

const taskTemplates = [
  { title: 'Setup Development Environment', description: 'Install and configure development tools', status: 'todo' },
  { title: 'Design API Endpoints', description: 'Plan and document REST API structure', status: 'todo' },
  { title: 'Implement User Authentication', description: 'Add JWT-based authentication system', status: 'inProgress' },
  { title: 'Write Unit Tests', description: 'Create comprehensive test coverage', status: 'review' },
  { title: 'Deploy to Production', description: 'Configure CI/CD pipeline and deploy', status: 'done' },
  { title: 'Monitor Performance', description: 'Set up monitoring and alerting', status: 'todo' },
  { title: 'Optimize Database', description: 'Improve query performance', status: 'inProgress' },
  { title: 'Security Audit', description: 'Conduct security review', status: 'blocked' }
];

export default function () {
  debugLog(`Starting iteration ${__ITER} for VU ${__VU} in ${TEST_MODE} mode`);

  // Choose test scenario based on mode and VU
  switch (TEST_MODE) {
    case 'quick':
      runQuickTest();
      break;
    case 'load':
      runLoadTest();
      break;
    case 'comprehensive':
      runComprehensiveTest();
      break;
    case 'stress':
      runStressTest();
      break;
    default:
      runQuickTest();
  }

  sleep(0.5);
}

function runQuickTest() {
  debugLog('Running quick smoke test');

  // Test basic API operations
  const columnConfig = columnConfigs[1].config; // Standard workflow

  // 1. Update columns
  let response = authenticatedPut('/api/v1/column-settings/', columnConfig);
  checkResponseStatus(response, 'columns updated', 200);
  debugLog('Column update', { status: response.status });

  // 2. Create a few tasks
  const tasksCreated = [];
  for (let i = 0; i < 2; i++) {
    const template = taskTemplates[i];
    const taskData = {
      ...template,
      title: `${template.title} - VU${__VU}-${Date.now()}-${i}`,
      description: `${template.description} (Quick Test)`
    };

    response = authenticatedPost('/api/v1/todos/', taskData);
    checkResponseStatus(response, 'task created', 201);
    debugLog('Task creation', { status: response.status, title: taskData.title });

    if (response.status === 201) {
      const task = JSON.parse(response.body);
      tasksCreated.push(task);
    }
    sleep(0.1);
  }

  // 3. Get tasks
  response = authenticatedGet('/api/v1/todos/');
  checkResponseStatus(response, 'tasks retrieved', 200);

  // 4. Health check
  response = authenticatedGet('/health');
  checkResponseStatus(response, 'health check', 200);

  console.log(`[VU ${__VU}] Quick test completed - created ${tasksCreated.length} tasks`);
}

function runLoadTest() {
  debugLog('Running load test scenario');

  // Distribute VUs across different operations
  const vuScenario = __VU % 4;

  switch (vuScenario) {
    case 0:
      performCRUDOperations();
      break;
    case 1:
      performColumnOperations();
      break;
    case 2:
      performBulkTaskOperations();
      break;
    case 3:
      performHealthChecks();
      break;
  }
}

function runComprehensiveTest() {
  debugLog('Running comprehensive test scenario');

  // Each VU runs a different test scenario
  const vuScenario = (__VU - 1) % 3;

  switch (vuScenario) {
    case 0:
      runBasicCRUDTest();
      break;
    case 1:
      runColumnManagementTest();
      break;
    case 2:
      runWorkflowTest();
      break;
  }
}

function runStressTest() {
  debugLog('Running stress test scenario');

  // High-volume operations
  const operations = ['create', 'read', 'update', 'delete'];
  const operation = operations[__VU % operations.length];

  performHighVolumeOperation(operation);
}

// Individual test functions
function performCRUDOperations() {
  debugLog('Performing CRUD operations');

  const template = taskTemplates[__ITER % taskTemplates.length];
  const taskData = {
    ...template,
    title: `${template.title} - CRUD-VU${__VU}-${Date.now()}`,
    description: `${template.description} (CRUD Test)`
  };

  // Create
  let response = authenticatedPost('/api/v1/todos/', taskData);
  checkResponseStatus(response, 'CRUD task created', 201);

  if (response.status === 201) {
    const task = JSON.parse(response.body);

    // Read
    response = authenticatedGet(`/api/v1/todos/${task.id}`);
    checkResponseStatus(response, 'CRUD task retrieved', 200);

    // Update
    const updateData = { ...task, title: `${task.title} - UPDATED` };
    response = authenticatedPut(`/api/v1/todos/${task.id}`, updateData);
    checkResponseStatus(response, 'CRUD task updated', 200);

    // Delete (50% chance)
    if (Math.random() < 0.5) {
      response = authenticatedDelete(`/api/v1/todos/${task.id}`);
      checkResponseStatus(response, 'CRUD task deleted', 204);
    }
  }

  sleep(0.2);
}

function performColumnOperations() {
  debugLog('Performing column operations');

  const configIndex = __ITER % columnConfigs.length;
  const columnConfig = columnConfigs[configIndex];

  // Update column configuration
  let response = authenticatedPut('/api/v1/column-settings/', columnConfig.config);
  checkResponseStatus(response, 'column config updated', 200);

  // Verify configuration
  response = authenticatedGet('/api/v1/column-settings/');
  checkResponseStatus(response, 'column config retrieved', 200);

  console.log(`[VU ${__VU}] Updated to ${columnConfig.name} configuration`);
  sleep(0.3);
}

function performBulkTaskOperations() {
  debugLog('Performing bulk task operations');

  const tasksToCreate = 3;
  const tasksCreated = [];

  // Create multiple tasks
  for (let i = 0; i < tasksToCreate; i++) {
    const template = taskTemplates[i % taskTemplates.length];
    const taskData = {
      ...template,
      title: `${template.title} - Bulk-VU${__VU}-${Date.now()}-${i}`,
      description: `${template.description} (Bulk Test)`
    };

    const response = authenticatedPost('/api/v1/todos/', taskData);
    checkResponseStatus(response, 'bulk task created', 201);

    if (response.status === 201) {
      const task = JSON.parse(response.body);
      tasksCreated.push(task);
    }
    sleep(0.1);
  }

  // Get all tasks
  let response = authenticatedGet('/api/v1/todos/');
  checkResponseStatus(response, 'bulk tasks retrieved', 200);

  console.log(`[VU ${__VU}] Bulk operation completed - created ${tasksCreated.length} tasks`);
  sleep(0.2);
}

function performHealthChecks() {
  debugLog('Performing health checks');

  // Multiple health checks with different intervals
  for (let i = 0; i < 3; i++) {
    const response = authenticatedGet('/health');
    checkResponseStatus(response, 'health check', 200);
    sleep(0.5);
  }
}

function runBasicCRUDTest() {
  debugLog('Running basic CRUD test');

  if (__ITER === 0) {
    cleanupTasksOnly();
  }

  const tasksCreated = [];

  // Create multiple tasks
  for (let i = 0; i < 3; i++) {
    const template = taskTemplates[i % taskTemplates.length];
    const taskData = {
      ...template,
      title: `${template.title} - VU${__VU}-${Date.now()}-${i}`,
      description: `${template.description} (CRUD Test)`
    };

    const response = authenticatedPost('/api/v1/todos/', taskData);
    checkResponseStatus(response, 'task created successfully', 201);

    if (response.status === 201) {
      const task = JSON.parse(response.body);
      tasksCreated.push(task);
      console.log(`[VU ${__VU}] Created: ${task.title}`);
    }
    sleep(0.2);
  }

  // Read and verify tasks
  const getResponse = authenticatedGet('/api/v1/todos/');
  checkResponseStatus(getResponse, 'tasks retrieved successfully', 200);

  // Update a task
  if (tasksCreated.length > 0) {
    const taskToUpdate = tasksCreated[0];
    const updateData = {
      ...taskToUpdate,
      title: `${taskToUpdate.title} - UPDATED`,
      status: 'inProgress'
    };

    const updateResponse = authenticatedPut(`/api/v1/todos/${taskToUpdate.id}`, updateData);
    checkResponseStatus(updateResponse, 'task updated successfully', 200);

    // Delete the task
    const deleteResponse = authenticatedDelete(`/api/v1/todos/${taskToUpdate.id}`);
    checkResponseStatus(deleteResponse, 'task deleted successfully', 204);
  }
}

function runColumnManagementTest() {
  debugLog('Running column management test');

  const configIndex = __ITER % columnConfigs.length;
  const testConfig = columnConfigs[configIndex];

  console.log(`[VU ${__VU}] Testing ${testConfig.name} configuration`);

  // Update column configuration
  const updateResponse = authenticatedPut('/api/v1/column-settings/', testConfig.config);
  checkResponseStatus(updateResponse, 'column configuration updated', 200);

  // Verify column configuration
  const getResponse = authenticatedGet('/api/v1/column-settings/');
  checkResponseStatus(getResponse, 'column configuration retrieved', 200);

  if (getResponse.status === 200) {
    console.log(`[VU ${__VU}] Column configuration validated for ${testConfig.name}`);
  }

  sleep(0.3);
}

function runWorkflowTest() {
  debugLog('Running workflow test');

  // Setup extended workflow
  const workflowConfig = columnConfigs[2].config; // Extended workflow
  const configResponse = authenticatedPut('/api/v1/column-settings/', workflowConfig);
  checkResponseStatus(configResponse, 'workflow columns configured', 200);

  // Create tasks in different stages
  const workflowTasks = [];
  const statuses = ['backlog', 'todo', 'inProgress', 'review', 'done'];

  for (let i = 0; i < taskTemplates.length && i < 5; i++) {
    const template = taskTemplates[i];
    const status = statuses[i % statuses.length];

    const taskData = {
      ...template,
      title: `${template.title} - Workflow-VU${__VU}-${Date.now()}-${i}`,
      status: status
    };

    const response = authenticatedPost('/api/v1/todos/', taskData);
    checkResponseStatus(response, 'workflow task created', 201);

    if (response.status === 201) {
      const task = JSON.parse(response.body);
      workflowTasks.push(task);
      console.log(`[VU ${__VU}] Created workflow task: ${task.title} [${status}]`);
    }
    sleep(0.1);
  }

  // Simulate task progression through workflow
  for (const task of workflowTasks.slice(0, 2)) {
    const currentStatusIndex = statuses.indexOf(task.status);
    if (currentStatusIndex < statuses.length - 1) {
      const nextStatus = statuses[currentStatusIndex + 1];

      const progressData = {
        ...task,
        status: nextStatus,
        title: `${task.title} - PROGRESSED`
      };

      const progressResponse = authenticatedPut(`/api/v1/todos/${task.id}`, progressData);
      checkResponseStatus(progressResponse, 'task progressed in workflow', 200);

      console.log(`[VU ${__VU}] Progressed task from ${task.status} to ${nextStatus}`);
      sleep(0.2);
    }
  }

  // Verify final state
  const finalResponse = authenticatedGet('/api/v1/todos/');
  checkResponseStatus(finalResponse, 'workflow state retrieved', 200);
}

function performHighVolumeOperation(operation) {
  debugLog(`Performing high-volume ${operation} operation`);

  switch (operation) {
    case 'create':
      for (let i = 0; i < 5; i++) {
        const template = taskTemplates[i % taskTemplates.length];
        const taskData = {
          ...template,
          title: `${template.title} - Stress-VU${__VU}-${Date.now()}-${i}`,
          description: `${template.description} (Stress Test)`
        };

        const response = authenticatedPost('/api/v1/todos/', taskData);
        checkResponseStatus(response, 'stress task created', 201);
        sleep(0.05);
      }
      break;

    case 'read':
      for (let i = 0; i < 10; i++) {
        const response = authenticatedGet('/api/v1/todos/');
        checkResponseStatus(response, 'stress tasks retrieved', 200);
        sleep(0.02);
      }
      break;

    case 'update':
      const getResponse = authenticatedGet('/api/v1/todos/');
      if (getResponse.status === 200) {
        const tasks = JSON.parse(getResponse.body);
        if (tasks.length > 0) {
          const task = tasks[Math.floor(Math.random() * tasks.length)];
          const updateData = {
            ...task,
            title: `${task.title} - STRESS-UPDATED`,
            description: 'Updated during stress test'
          };

          const response = authenticatedPut(`/api/v1/todos/${task.id}`, updateData);
          checkResponseStatus(response, 'stress task updated', 200);
        }
      }
      break;

    case 'delete':
      const getDelResponse = authenticatedGet('/api/v1/todos/');
      if (getDelResponse.status === 200) {
        const tasks = JSON.parse(getDelResponse.body);
        if (tasks.length > 0) {
          const task = tasks[Math.floor(Math.random() * tasks.length)];
          const response = authenticatedDelete(`/api/v1/todos/${task.id}`);
          checkResponseStatus(response, 'stress task deleted', 204);
        }
      }
      break;
  }

  sleep(0.1);
}

export function setup() {
  console.log(`🚀 Starting ${config.description}...`);
  debugLog('Test configuration', config);

  // Verify API is reachable
  const response = authenticatedGet('/health');
  if (response.status !== 200) {
    throw new Error(`API not reachable: ${response.status}`);
  }

  // Verify authentication
  if (!verifyAuth()) {
    throw new Error('Authentication verification failed');
  }

  // Reset to clean state
  console.log('🔄 Performing initial system reset...');
  const resetSuccess = resetSystemState(true);
  debugLog('System reset result', { success: resetSuccess });

  if (!resetSuccess) {
    console.warn('⚠️ Initial system reset failed, continuing anyway...');
  }

  console.log(`✅ ${config.description} setup complete`);
  return { startTime: Date.now() };
}

export function teardown(data) {
  const duration = Date.now() - data.startTime;
  console.log(`🏁 ${config.description} completed in ${duration}ms`);

  // Final cleanup
  console.log('🧹 Performing final cleanup...');
  const cleanupSuccess = resetSystemState(true);
  debugLog('Final cleanup result', { success: cleanupSuccess });

  if (cleanupSuccess && verifyCleanState()) {
    console.log(`✅ ${config.description} completed with full cleanup`);
  } else {
    console.log(`⚠️ ${config.description} completed but cleanup verification failed`);
  }
}
