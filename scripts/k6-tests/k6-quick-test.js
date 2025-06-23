/**
 * K6 Quick API Test Script
 * 
 * Simple script to quickly test API operations:
 * - Reset system state (delete all tasks, reset columns)
 * - Add columns
 * - Add tasks
 * - Remove tasks
 * 
 * Usage:
 * k6 run --duration=30s --vus=5 scripts/k6-quick-test.js
 */

import http from 'k6/http';
import { sleep } from 'k6';
import { Counter } from 'k6/metrics';
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
} from './modules/setup.js';

const successfulChecks = new Counter('successful_checks');
const unsuccessfulChecks = new Counter('unsuccessful_checks');

export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    successful_checks: ['count>100'],
    unsuccessful_checks: ['count<10'],
  },
};

// Quick test data
const quickColumnConfig = {
  column_order: ['todo', 'inProgress', 'blocked', 'done'],
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
    'blocked': {
      id: 'blocked',
      title: 'Blocked',
      taskIds: []
    },
    'done': {
      id: 'done',
      title: 'Completed',
      taskIds: []
    }
  }
};

const quickTasks = [
  { title: 'Quick Test Task 1', description: 'Testing API with k6', status: 'todo' },
  { title: 'Quick Test Task 2', description: 'Load testing in progress', status: 'inProgress' },
  { title: 'Quick Test Task 3', description: 'API testing completed', status: 'done' }
];

const SCRIPT_NAME = 'k6-quick-test.js';

export default function () {
  // 1. Add/Update columns
  console.log(`[VU ${__VU}] Updating column configuration...`);
  let response = authenticatedPut('/api/v1/column-settings/', quickColumnConfig);
  checkResponseStatus(response, 'column configuration updated', 200, successfulChecks, unsuccessfulChecks);

  // 2. Add tasks
  console.log(`[VU ${__VU}] Adding tasks...`);
  const tasksCreated = [];

  for (const task of quickTasks) {
    const taskData = {
      ...task,
      title: `${task.title} - VU${__VU}-${Date.now()}`,
      description: `${task.description} (VU ${__VU}, Iteration ${__ITER})`
    };

    response = authenticatedPost('/api/v1/todos/', taskData);
    checkResponseStatus(response, 'task created successfully', 201, successfulChecks, unsuccessfulChecks);

    if (response.status === 201) {
      try {
        const createdTask = JSON.parse(response.body);
        tasksCreated.push(createdTask);
        console.log(`[VU ${__VU}] Created task: ${createdTask.title}`);
      } catch (e) {
        console.log(`[VU ${__VU}] Task created but couldn't parse response`);
      }
    }

    sleep(0.1);
  }

  // 3. Remove some tasks
  if (tasksCreated.length > 0 && Math.random() < 0.5) {
    const taskToRemove = tasksCreated[Math.floor(Math.random() * tasksCreated.length)];
    console.log(`[VU ${__VU}] Removing task: ${taskToRemove.title}`);

    response = authenticatedDelete(`/api/v1/todos/${taskToRemove.id}`);
    checkResponseStatus(response, 'task deleted successfully', 204, successfulChecks, unsuccessfulChecks);
  }

  // 4. Check API health
  response = authenticatedGet('/health');
  checkResponseStatus(response, 'health check successful', 200, successfulChecks, unsuccessfulChecks);

  if (response.status === 200) {
    console.log(`[VU ${__VU}] Health check passed, status: ${JSON.stringify(response.json())}`);
  }

  sleep(1);
}

export function setup() {
  console.log('🚀 Starting quick API test with system reset...');

  // Verify API is reachable
  const response = http.get(`${getBaseURL()}/health`);
  if (response.status !== 200) {
    throw new Error(`API not reachable: ${response.status}`);
  }

  // Verify authentication is working
  if (!verifyAuth()) {
    throw new Error('Authentication verification failed');
  }

  // Perform initial complete system reset
  console.log('🔄 Performing initial system reset...');
  const resetSuccess = resetSystemState(true);
  if (!resetSuccess) {
    console.warn('⚠️  Initial system reset failed, continuing anyway...');
  }

  console.log('✅ Quick test setup complete');
}

export function teardown() {
  console.log('🧹 Performing final cleanup...');

  // Final cleanup - remove all test data
  const cleanupSuccess = resetSystemState(true);
  if (cleanupSuccess) {
    console.log('✅ Quick API test completed with cleanup');
  } else {
    console.log('⚠️  Quick API test completed but cleanup had issues');
  }
}
