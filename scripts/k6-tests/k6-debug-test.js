/**
 * K6 Debug Test Script
 * 
 * Debug version to see actual API response details
 * Uses modularized auth and setup for consistent testing
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { getAuthHeaders, authenticatedPut, authenticatedPost, authenticatedGet, authenticatedDelete, getBaseURL } from './modules/auth.js';
import { resetSystemState, verifyCleanState } from './modules/setup.js';
import { Counter } from 'k6/metrics';

const successfulChecks = new Counter('successful_checks');
const unsuccessfulChecks = new Counter('unsuccessful_checks');

export const options = {
  vus: 1,
  duration: '10s',
  thresholds: {
    successful_checks: ['count>50'],
    unsuccessful_checks: ['count<5'],
  },
};

const SCRIPT_NAME = 'k6-debug-test.js';

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

const quickTask = { 
  title: 'Debug Test Task', 
  description: 'Testing API responses', 
  status: 'todo' 
};

export default function () {
  console.log(`[DEBUG] Starting iteration ${__ITER} for VU ${__VU}`);

  // Reset system state at start of each iteration for clean testing
  console.log(`[DEBUG] Resetting system state...`);
  resetSystemState();
  
  // 1. Test column settings update
  console.log(`[DEBUG] Testing column settings update...`);
  let response = authenticatedPut('/api/v1/column-settings/', quickColumnConfig);
  console.log(`[DEBUG] Column settings response: Status=${response.status}, Body=${response.body}`);
  
  check(response, {
    'columns updated': (r) => {
      if (r.status !== 200) {
        console.log(`[ERROR] Column update failed: ${r.status} - ${r.body}`);
        return false;
      }
      return true;
    }
  });
  
  sleep(0.5);
  
  // 2. Test task creation
  console.log(`[DEBUG] Testing task creation...`);
  const taskData = {
    ...quickTask,
    title: `${quickTask.title} - VU${__VU}-${Date.now()}`,
    description: `${quickTask.description} (VU ${__VU}, Iteration ${__ITER})`
  };
  
  console.log(`[DEBUG] Task payload: ${JSON.stringify(taskData)}`);
  response = authenticatedPost('/api/v1/todos/', taskData);
  console.log(`[DEBUG] Task creation response: Status=${response.status}, Body=${response.body}`);
  
  check(response, {
    'task created': (r) => {
      if (r.status !== 201) {
        console.log(`[ERROR] Task creation failed: ${r.status} - ${r.body}`);
        return false;
      }
      return true;
    }
  });
  
  sleep(0.5);
  
  // 3. Check API health
  response = authenticatedGet('/health');
  console.log(`[DEBUG] Health check response: Status=${response.status}`);
  
  check(response, {
    'API healthy': (r) => r.status === 200,
  });
  
  sleep(1);
}

export function setup() {
  console.log('[DEBUG] Starting debug API test...');
  
  // Verify API is reachable
  const response = http.get(`${getBaseURL()}/health`);
  if (response.status !== 200) {
    throw new Error(`API not reachable: ${response.status}`);
  }
  
  // Reset system to clean state for testing
  console.log('[DEBUG] Performing initial system reset...');
  resetSystemState();
  verifyCleanState();
  
  console.log('[DEBUG] Setup complete');
}

export function teardown() {
  console.log('[DEBUG] Performing final cleanup...');
  resetSystemState();
  console.log('[DEBUG] Debug test completed');
}
