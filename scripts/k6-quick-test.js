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
import { check, sleep } from 'k6';
import { 
  getBaseURL, 
  verifyAuth,
  authenticatedGet,
  authenticatedPost,
  authenticatedPut,
  authenticatedDelete
} from './modules/auth.js';
import { 
  resetSystemState, 
  verifyCleanState 
} from './modules/setup.js';

export const options = {
  vus: 5,
  duration: '30s',
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

export default function () {
  // 0. Reset system state at the start of each iteration for VU 1
  if (__VU === 1 && __ITER === 0) {
    console.log(`[VU ${__VU}] Performing initial system reset...`);
    const resetSuccess = resetSystemState(true); // Full reset including columns
    if (!resetSuccess) {
      console.error(`[VU ${__VU}] Failed to reset system state`);
    }
  }
  
  // 1. Add/Update columns
  console.log(`[VU ${__VU}] Updating column configuration...`);
  let response = authenticatedPut('/api/v1/column-settings/', quickColumnConfig);
  check(response, {
    'columns updated': (r) => r.status === 200,
  });
  
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
    const success = check(response, {
      'task created': (r) => r.status === 201,
    });
    
    if (success) {
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
    check(response, {
      'task removed': (r) => r.status === 204,
    });
  }
  
  // 4. Check API health
  response = http.get(`${getBaseURL()}/health`);
  check(response, {
    'API healthy': (r) => r.status === 200,
  });
  
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
    console.warn('⚠️ Initial system reset failed, continuing anyway...');
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
    console.log('⚠️ Quick API test completed but cleanup had issues');
  }
}
