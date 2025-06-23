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
 * Normal mode:
 *   k6 run --duration=30s --vus=5 scripts/k6-quick-test.js
 * 
 * Debug mode (detailed logging):
 *   DEBUG=true k6 run --duration=30s --vus=5 scripts/k6-quick-test.js
 * 
 * With authentication token:
 *   AUTH_TOKEN="your-jwt-token" k6 run scripts/k6-quick-test.js
 * 
 * Debug mode with auth:
 *   DEBUG=true AUTH_TOKEN="your-jwt-token" k6 run scripts/k6-quick-test.js
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

// Debug configuration
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

// Log debug mode status
if (DEBUG) {
  console.log('🐛 DEBUG MODE ENABLED - Detailed logging will be shown');
} else {
  console.log('ℹ️  Running in normal mode. Set DEBUG=true for detailed logging');
}

const successfulChecks = new Counter('successful_checks');
const unsuccessfulChecks = new Counter('unsuccessful_checks');

export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    // Ensure we have some successful operations (at least 1 per VU per 10 seconds)
    successful_checks: ['count>0'],
    // Keep unsuccessful checks low (less than 10% of total checks)
    unsuccessful_checks: ['count<10'],
    // Ensure overall check success rate is high
    checks: ['rate>0.95'], // 95% of all checks should pass
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
  debugLog(`Starting iteration ${__ITER} for VU ${__VU}`);

  // 1. Add/Update columns
  console.log(`[VU ${__VU}] Updating column configuration...`);
  debugLog('Column configuration payload', quickColumnConfig);
  
  let response = authenticatedPut('/api/v1/column-settings/', quickColumnConfig);
  debugLog(`Column settings response`, { status: response.status, body: response.body });
  
  checkResponseStatus(response, 'column configuration updated', 200, successfulChecks, unsuccessfulChecks);

  // 2. Add tasks
  console.log(`[VU ${__VU}] Adding tasks...`);
  debugLog('Tasks to create', quickTasks);
  
  const tasksCreated = [];

  for (const task of quickTasks) {
    const taskData = {
      ...task,
      title: `${task.title} - VU${__VU}-${Date.now()}`,
      description: `${task.description} (VU ${__VU}, Iteration ${__ITER})`
    };

    debugLog('Creating task with data', taskData);
    response = authenticatedPost('/api/v1/todos/', taskData);
    debugLog(`Task creation response`, { status: response.status, body: response.body });
    
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
    debugLog('Deleting task', { id: taskToRemove.id, title: taskToRemove.title });

    response = authenticatedDelete(`/api/v1/todos/${taskToRemove.id}`);
    debugLog(`Task deletion response`, { status: response.status, body: response.body });
    
    checkResponseStatus(response, 'task deleted successfully', 204, successfulChecks, unsuccessfulChecks);
  }

  // 4. Check API health
  debugLog('Performing health check');
  response = authenticatedGet('/health');
  debugLog(`Health check response`, { status: response.status, body: response.body });
  
  checkResponseStatus(response, 'health check successful', 200, successfulChecks, unsuccessfulChecks);

  if (response.status === 200) {
    console.log(`[VU ${__VU}] Health check passed, status: ${JSON.stringify(response.json())}`);
  }

  sleep(1);
}

export function setup() {
  console.log('🚀 Starting quick API test with system reset...');
  debugLog('Debug mode is enabled');
  debugLog('Test configuration', { vus: options.vus, duration: options.duration });

  // Verify API is reachable
  debugLog('Checking API health');
  const response = http.get(`${getBaseURL()}/health`);
  debugLog(`API health response`, { status: response.status, body: response.body });
  
  if (response.status !== 200) {
    throw new Error(`API not reachable: ${response.status}`);
  }

  // Verify authentication is working
  debugLog('Verifying authentication');
  if (!verifyAuth()) {
    throw new Error('Authentication verification failed');
  }

  // Perform initial complete system reset
  console.log('🔄 Performing initial system reset...');
  debugLog('Starting system reset');
  const resetSuccess = resetSystemState(true);
  debugLog('System reset result', { success: resetSuccess });
  
  if (!resetSuccess) {
    console.warn('⚠️  Initial system reset failed, continuing anyway...');
  }

  console.log('✅ Quick test setup complete');
  debugLog('Setup completed successfully');
}

export function teardown() {
  console.log('🧹 Performing final cleanup...');
  debugLog('Starting teardown and cleanup');

  // Final cleanup - remove all test data
  const cleanupSuccess = resetSystemState(true);
  debugLog('Final cleanup result', { success: cleanupSuccess });
  
  if (cleanupSuccess) {
    console.log('✅ Quick API test completed with cleanup');
    debugLog('Test completed successfully with cleanup');
  } else {
    console.log('⚠️  Quick API test completed but cleanup had issues');
    debugLog('Test completed but cleanup had issues');
  }
}
