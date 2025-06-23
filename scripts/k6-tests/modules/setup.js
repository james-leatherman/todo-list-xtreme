/**
 * K6 Setup/Cleanup Module
 * 
 * Provides utilities to reset the system state before/after tests
 */

import { sleep } from 'k6';
import { 
  authenticatedGet, 
  authenticatedPost, 
  authenticatedPut, 
  authenticatedDelete,
  checkResponseStatus
} from './auth.js';

/**
 * Default column configuration to restore
 */
const defaultColumnConfig = {
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

/**
 * Get all tasks from the API
 * @returns {Array} Array of task objects
 */
function getAllTasks() {
  const response = authenticatedGet('/api/v1/todos/');
  
  if (response.status !== 200) {
    console.warn(`Failed to get tasks: ${response.status}`);
    return [];
  }
  
  try {
    return JSON.parse(response.body);
  } catch (e) {
    console.warn(`Failed to parse tasks response: ${e.message}`);
    return [];
  }
}

/**
 * Delete all existing tasks
 * @returns {number} Number of tasks deleted
 */
function deleteAllTasks() {
  const tasks = getAllTasks();
  let deletedCount = 0;
  let retryCount = 0;
  const maxRetries = 3;
  
  console.log(`Found ${tasks.length} tasks to delete`);
  
  while (tasks.length > 0 && retryCount < maxRetries) {
    const batchSize = Math.min(tasks.length, 20); // Process in batches of 20
    const batch = tasks.splice(0, batchSize);
    
    console.log(`Processing batch of ${batch.length} tasks (${tasks.length} remaining)`);
    
    for (const task of batch) {
      const response = authenticatedDelete(`/api/v1/todos/${task.id}`);
      
      if (checkResponseStatus(response, 'task deleted', 204)) {
        deletedCount++;
        console.log(`Deleted task: ${task.title}`);
      } else {
        console.warn(`Failed to delete task ${task.id}: ${response.status}`);
      }
      
      // Small delay to avoid overwhelming the API
      sleep(0.05);
    }
    
    if (tasks.length === 0 && retryCount < maxRetries - 1) {
      // Double-check if we need to fetch more tasks
      const remainingTasks = getAllTasks();
      if (remainingTasks.length > 0) {
        console.log(`Found ${remainingTasks.length} additional tasks to delete`);
        tasks.push(...remainingTasks);
        retryCount++;
      }
    }
  }
  
  return deletedCount;
}

/**
 * Get current column configuration
 * @returns {Object|null} Column configuration or null if failed
 */
function getCurrentColumns() {
  const response = authenticatedGet('/api/v1/column-settings/');
  
  if (response.status !== 200) {
    console.warn(`Failed to get column settings: ${response.status}`);
    return null;
  }
  
  try {
    return JSON.parse(response.body);
  } catch (e) {
    console.warn(`Failed to parse column settings: ${e.message}`);
    return null;
  }
}

/**
 * Clear all task IDs from column configurations
 * @param {Object} columnConfig - Column configuration object
 * @returns {Object} Cleaned column configuration
 */
function clearColumnTaskIds(columnConfig) {
  const cleaned = JSON.parse(JSON.stringify(columnConfig)); // Deep clone
  
  if (cleaned.columns_config) {
    for (const columnId in cleaned.columns_config) {
      if (cleaned.columns_config[columnId].taskIds) {
        cleaned.columns_config[columnId].taskIds = [];
      }
    }
  }
  
  return cleaned;
}

/**
 * Reset columns to default configuration
 * @returns {boolean} True if successful, false otherwise
 */
function resetToDefaultColumns() {
  console.log('Resetting to default columns...');
  
  const response = authenticatedPut('/api/v1/column-settings/', defaultColumnConfig);
  
  const success = checkResponseStatus(response, 'default columns restored', 200);
  
  if (success) {
    console.log('Default columns restored successfully');
  } else {
    console.error(`Failed to restore default columns: ${response.status} - ${response.body}`);
  }
  
  return success;
}

/**
 * Perform complete system cleanup and reset
 * @returns {Object} Cleanup results
 */
export function cleanupAndReset() {
  console.log('🧹 Starting complete system cleanup and reset...');
  
  const results = {
    tasksDeleted: 0,
    columnsReset: false,
    success: false
  };
  
  try {
    // Step 1: Delete all tasks
    console.log('Step 1: Deleting all tasks...');
    results.tasksDeleted = deleteAllTasks();
    
    // Step 2: Wait a moment for cleanup to complete
    sleep(0.5);
    
    // Step 3: Clear any remaining task references from columns
    console.log('Step 2: Clearing column task references...');
    const currentColumns = getCurrentColumns();
    if (currentColumns) {
      const cleanedColumns = clearColumnTaskIds(currentColumns);
      const response = authenticatedPut('/api/v1/column-settings/', cleanedColumns);
      checkResponseStatus(response, 'column task references cleared', 200);
    }
    
    // Step 4: Reset to default columns
    console.log('Step 3: Resetting to default columns...');
    results.columnsReset = resetToDefaultColumns();
    
    // Step 5: Final verification
    sleep(0.2);
    const finalTasks = getAllTasks();
    if (finalTasks.length === 0 && results.columnsReset) {
      results.success = true;
      console.log('✅ System cleanup and reset completed successfully');
    } else {
      console.warn(`⚠️  Cleanup incomplete: ${finalTasks.length} tasks remaining, columns reset: ${results.columnsReset}`);
    }
    
  } catch (error) {
    console.error(`❌ Cleanup failed with error: ${error.message}`);
  }
  
  return results;
}

/**
 * Perform lightweight cleanup (tasks only, preserve custom columns)
 * @returns {Object} Cleanup results
 */
export function cleanupTasksOnly() {
  console.log('🧹 Starting task-only cleanup...');
  
  const results = {
    tasksDeleted: 0,
    success: false
  };
  
  try {
    // Delete all tasks
    results.tasksDeleted = deleteAllTasks();
    
    // Clear task references from columns but keep column structure
    const currentColumns = getCurrentColumns();
    if (currentColumns) {
      const cleanedColumns = clearColumnTaskIds(currentColumns);
      const response = authenticatedPut('/api/v1/column-settings/', cleanedColumns);
      const cleared = checkResponseStatus(response, 'column task references cleared', 200);
      
      if (cleared) {
        results.success = true;
        console.log('✅ Task cleanup completed successfully');
      }
    }
    
  } catch (error) {
    console.error(`❌ Task cleanup failed: ${error.message}`);
  }
  
  return results;
}

/**
 * Verify system is in clean state
 * @returns {boolean} True if system is clean, false otherwise
 */
export function verifyCleanState() {
  const tasks = getAllTasks();
  const columns = getCurrentColumns();
  
  let hasTasksInColumns = false;
  let totalTasksInColumns = 0;
  if (columns && columns.columns_config) {
    for (const columnId in columns.columns_config) {
      const column = columns.columns_config[columnId];
      if (column.taskIds && column.taskIds.length > 0) {
        hasTasksInColumns = true;
        totalTasksInColumns += column.taskIds.length;
      }
    }
  }
  
  // If we have tasks in columns but no actual tasks, clear column references
  if (hasTasksInColumns && tasks.length === 0) {
    console.log(`Detected ${totalTasksInColumns} ghost task references in columns. Clearing...`);
    const cleanedColumns = clearColumnTaskIds(columns);
    const response = authenticatedPut('/api/v1/column-settings/', cleanedColumns);
    checkResponseStatus(response, 'ghost references cleared', 200);
    hasTasksInColumns = false;
  }
  
  const isClean = tasks.length === 0 && !hasTasksInColumns;
  
  if (isClean) {
    console.log('✅ System is in clean state');
  } else {
    console.warn(`⚠️  System is not clean: ${tasks.length} tasks, tasks in columns: ${hasTasksInColumns}`);
    // If not clean after cleanup attempts, log details for debugging
    if (tasks.length > 0) {
      console.log(`First 5 tasks: ${JSON.stringify(tasks.slice(0, 5).map(t => ({id: t.id, title: t.title})))}`);
    }
  }
  
  return isClean;
}

/**
 * Reset system to initial state before test execution
 * @param {boolean} fullReset - Whether to do full reset (including columns) or tasks only
 * @returns {boolean} True if reset successful, false otherwise
 */
export function resetSystemState(fullReset = true) {
  console.log(`🔄 Resetting system state (full reset: ${fullReset})...`);
  
  // First attempt
  const results = fullReset ? cleanupAndReset() : cleanupTasksOnly();
  let isClean = results.success && verifyCleanState();
  
  // If first attempt failed, try a more aggressive approach
  if (!isClean) {
    console.log('⚠️  First cleanup attempt incomplete, performing additional cleanup...');
    
    // Try an alternative approach - direct cleanup with verification
    sleep(0.5); // Let API settle
    deleteAllTasks();  // Directly delete tasks
    
    // Force-reset column settings
    if (fullReset) {
      resetToDefaultColumns();
    } else {
      const currentColumns = getCurrentColumns();
      if (currentColumns) {
        const cleanedColumns = clearColumnTaskIds(currentColumns);
        authenticatedPut('/api/v1/column-settings/', cleanedColumns);
      }
    }
    
    // Final verification
    sleep(0.5);
    isClean = verifyCleanState();
  }
  
  return isClean;
}
