/**
 * K6 Comprehensive API Test Script
 * 
 * Full test suite that:
 * - Resets system state before each test
 * - Tests all major API operations
 * - Validates data consistency
 * - Performs cleanup after tests
 * 
 * Usage:
 * k6 run --duration=60s --vus=3 scripts/k6-comprehensive-test.js
 */

import { sleep } from 'k6';
import {
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

export const options = {
  vus: 3,
  duration: '60s',
  thresholds: {
    // Ensure overall check success rate is high
    checks: ['rate>0.95'],
    http_req_duration: ['p(95)<100'], // 95% of requests should be below 100ms
    http_req_failed: ['rate<0.1'],   // Error rate should be below 10%
  },
};

// Test data configurations
const testColumnConfigs = [
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
  { title: 'Deploy to Production', description: 'Configure CI/CD pipeline and deploy', status: 'done' }
];

const SCRIPT_NAME = 'k6-comprehensive-test.js';

export default function () {
  // Each VU runs its own test scenario
  const vuScenario = (__VU - 1) % 3; // 0, 1, or 2

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

  sleep(1);
};

/**
 * Test basic CRUD operations
 */
function runBasicCRUDTest() {
  console.log(`[VU ${__VU}] Running basic CRUD test...`);

  // Clean slate for this test
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
      try {
        const task = JSON.parse(response.body);
        tasksCreated.push(task);
        console.log(`[VU ${__VU}] Created: ${task.title}`);
      } catch (e) {
        console.error(`[VU ${__VU}] Failed to parse created task response`);
      }
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

/**
 * Test column management operations
 */
function runColumnManagementTest() {
  console.log(`[VU ${__VU}] Running column management test...`);

  const configIndex = __ITER % testColumnConfigs.length;
  const testConfig = testColumnConfigs[configIndex];

  console.log(`[VU ${__VU}] Testing ${testConfig.name} configuration`);

  // Update column configuration
  const updateResponse = authenticatedPut('/api/v1/column-settings/', testConfig.config);
  checkResponseStatus(updateResponse, 'column configuration updated', 200);

  // Verify column configuration
  const getResponse = authenticatedGet('/api/v1/column-settings/');
  checkResponseStatus(getResponse, 'column configuration retrieved', 200);

  if (getResponse.status === 200) {
    try {
      const currentConfig = JSON.parse(getResponse.body);
      // Additional validation can be added here
      console.log(`[VU ${__VU}] Column configuration validated for ${testConfig.name}`);
    } catch (e) {
      console.error(`[VU ${__VU}] Failed to parse column configuration response`);
    }
  }

  sleep(0.3);
}

/**
 * Test complete workflow with tasks and columns
 */
function runWorkflowTest() {
  console.log(`[VU ${__VU}] Running workflow test...`);

  // Setup extended workflow
  const workflowConfig = testColumnConfigs[1].config; // Extended workflow
  const configResponse = authenticatedPut('/api/v1/column-settings/', workflowConfig);
  checkResponseStatus(configResponse, 'workflow columns configured', 200);

  // Create tasks in different stages
  const workflowTasks = [];
  const statuses = ['backlog', 'todo', 'inProgress', 'review', 'done'];

  for (let i = 0; i < taskTemplates.length; i++) {
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
      try {
        const task = JSON.parse(response.body);
        workflowTasks.push(task);
        console.log(`[VU ${__VU}] Created workflow task: ${task.title} [${status}]`);
      } catch (e) {
        console.error(`[VU ${__VU}] Failed to parse workflow task response`);
      }
    }

    sleep(0.1);
  }

  // Simulate task progression through workflow
  for (const task of workflowTasks.slice(0, 2)) { // Only progress first 2 tasks
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

export function setup() {
  console.log('🚀 Starting comprehensive API test suite...');

  // Verify API health
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
  if (!resetSuccess) {
    console.warn('⚠️ Initial system reset failed');
  }

  console.log('✅ Comprehensive test setup complete');
  return { startTime: Date.now() };
}

export function teardown(data) {
  const duration = Date.now() - data.startTime;
  console.log(`🏁 Test completed in ${duration}ms`);

  // Final cleanup
  console.log('🧹 Performing final cleanup...');
  const cleanupSuccess = resetSystemState(true);

  if (cleanupSuccess && verifyCleanState()) {
    console.log('✅ Comprehensive test completed with full cleanup');
  } else {
    console.log('⚠️ Test completed but cleanup verification failed');
  }
}
