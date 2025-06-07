/**
 * ColumnManager - A utility class to handle column management for TodoList
 * Ensures proper persistence of empty columns and column order
 */

import { columnSettingsService } from '../services/api';

class ColumnManager {
  /**
   * Save column settings to both localStorage and the API
   * @param {Object} columns - The columns object
   * @param {Array} columnOrder - The column order array
   * @returns {Promise} - Promise for API operation
   */
  static async saveColumnSettings(columns, columnOrder) {
    // Ensure we have a valid columns object
    if (!columns || typeof columns !== 'object') {
      console.error('Invalid columns object provided to saveColumnSettings');
      return Promise.reject(new Error('Invalid columns object'));
    }

    // Ensure we have a valid columnOrder array
    if (!Array.isArray(columnOrder)) {
      console.error('Invalid columnOrder array provided to saveColumnSettings');
      return Promise.reject(new Error('Invalid columnOrder array'));
    }

    // Make sure all columns (even empty ones) are included in column order
    const allColumnIds = Object.keys(columns);
    let updatedColumnOrder = [...columnOrder];
    
    // Add any columns that are not in the order
    const missingColumns = allColumnIds.filter(id => !updatedColumnOrder.includes(id));
    if (missingColumns.length > 0) {
      updatedColumnOrder = [...updatedColumnOrder, ...missingColumns];
      console.log(`Added missing columns to order: ${missingColumns.join(', ')}`);
    }

    // Make sure all columns in the order exist (this handles deleted columns)
    updatedColumnOrder = updatedColumnOrder.filter(id => columns[id]);

    // Ensure column order is updated if it was modified
    if (JSON.stringify(columnOrder) !== JSON.stringify(updatedColumnOrder)) {
      console.log('Column order was updated to include all columns');
      columnOrder = updatedColumnOrder;
    }
    
    // First, save to localStorage for fast access
    localStorage.setItem('todoColumns', JSON.stringify(columns));
    localStorage.setItem('todoColumnOrder', JSON.stringify(columnOrder));
    
    // Create settings object for the API
    const settings = {
      columns_config: JSON.stringify(columns),
      column_order: JSON.stringify(columnOrder)
    };
    
    console.log('Saving column settings to API:', settings);
    
    try {
      // Try to get existing settings first
      const response = await columnSettingsService.getSettings();
      
      // If settings exist, update them
      if (response.data && response.data.id) {
        return columnSettingsService.updateSettings(settings);
      } else {
        // If no settings exist, create them
        return columnSettingsService.createSettings(settings);
      }
    } catch (error) {
      // If error getting settings or first operation fails, try the other approach
      if (error.response && error.response.status === 404) {
        return columnSettingsService.createSettings(settings);
      } else {
        try {
          return columnSettingsService.updateSettings(settings);
        } catch (secondError) {
          console.error('Failed to save column settings:', secondError);
          throw secondError;
        }
      }
    }
  }
  
  /**
   * Load column settings from the API, falling back to localStorage if needed
   * @returns {Promise<Object>} - Promise resolving to { columns, columnOrder }
   */
  static async loadColumnSettings() {
    const defaultColumns = {
      'todo': { id: 'todo', title: 'To Do', taskIds: [] },
      'inProgress': { id: 'inProgress', title: 'In Progress', taskIds: [] },
      'done': { id: 'done', title: 'Completed', taskIds: [] }
    };
    
    const defaultColumnOrder = ['todo', 'inProgress', 'done'];
    
    try {
      // Try to get settings from the API first
      const response = await columnSettingsService.getSettings();
      const settings = response.data;
      
      if (settings && settings.columns_config && settings.column_order) {
        try {
          // Parse the settings
          const columns = JSON.parse(settings.columns_config);
          const columnOrder = JSON.parse(settings.column_order);
          
          console.log('Loaded from API - columns:', Object.keys(columns));
          console.log('Loaded from API - columnOrder:', columnOrder);
          
          // Perform validation to ensure all columns have the required structure
          let isValid = true;
          Object.keys(columns).forEach(id => {
            if (!columns[id] || !columns[id].id || !columns[id].title || !Array.isArray(columns[id].taskIds)) {
              console.error(`Invalid column structure for ${id}`, columns[id]);
              isValid = false;
            }
          });
          
          if (!isValid) {
            console.error('Invalid column structure detected, falling back to defaults');
            return { columns: defaultColumns, columnOrder: defaultColumnOrder };
          }

          // Ensure all columns are in the order (including empty columns)
          const allColumnIds = Object.keys(columns);
          const missingInOrder = allColumnIds.filter(id => !columnOrder.includes(id));
          
          // Add any missing columns to the order
          const updatedOrder = [...columnOrder, ...missingInOrder];
          
          // Make sure all columns in the order exist
          const finalOrder = updatedOrder.filter(id => columns[id]);
          
          // If we had to update the order, save it back
          if (missingInOrder.length > 0 || finalOrder.length !== updatedOrder.length) {
            console.log('Fixing column order during load:', finalOrder);
            this.saveColumnSettings(columns, finalOrder);
          }
          
          // Also save to localStorage for faster access next time
          localStorage.setItem('todoColumns', settings.columns_config);
          localStorage.setItem('todoColumnOrder', JSON.stringify(finalOrder));
          
          return { columns, columnOrder: finalOrder };
        } catch (parseError) {
          console.error('Error parsing column settings:', parseError);
        }
      }
      
      // If we reach here, API settings were invalid or incomplete
      // Try localStorage as fallback
      return this.loadFromLocalStorage();
    } catch (error) {
      console.error('Error loading column settings from API:', error);
      // API failed, try localStorage
      return this.loadFromLocalStorage();
    }
  }
  
  /**
   * Load column settings from localStorage
   * @returns {Object} - { columns, columnOrder }
   */
  static loadFromLocalStorage() {
    const defaultColumns = {
      'todo': { id: 'todo', title: 'To Do', taskIds: [] },
      'inProgress': { id: 'inProgress', title: 'In Progress', taskIds: [] },
      'done': { id: 'done', title: 'Completed', taskIds: [] }
    };
    
    const defaultColumnOrder = ['todo', 'inProgress', 'done'];
    
    try {
      const savedColumns = localStorage.getItem('todoColumns');
      const savedColumnOrder = localStorage.getItem('todoColumnOrder');
      
      if (savedColumns && savedColumnOrder) {
        const columns = JSON.parse(savedColumns);
        const columnOrder = JSON.parse(savedColumnOrder);
        
        // Validate the data
        if (typeof columns === 'object' && Array.isArray(columnOrder)) {
          // Ensure all columns have required properties
          let isValid = true;
          Object.keys(columns).forEach(id => {
            if (!columns[id] || !columns[id].id || !columns[id].title || !Array.isArray(columns[id].taskIds)) {
              console.error(`Invalid column structure for ${id}`, columns[id]);
              isValid = false;
            }
          });
          
          if (isValid) {
            // Ensure all columns are in the order
            const allColumnIds = Object.keys(columns);
            const missingInOrder = allColumnIds.filter(id => !columnOrder.includes(id));
            
            // Add any missing columns to the order
            const updatedOrder = [...columnOrder, ...missingInOrder];
            
            // If we had to update the order, save it back
            if (missingInOrder.length > 0) {
              localStorage.setItem('todoColumnOrder', JSON.stringify(updatedOrder));
            }
            
            return { columns, columnOrder: updatedOrder };
          }
        }
      }
    } catch (error) {
      console.error('Error loading column settings from localStorage:', error);
    }
    
    // If we reach here, localStorage settings were invalid or missing
    return { columns: defaultColumns, columnOrder: defaultColumnOrder };
  }
  
  /**
   * Add a new column
   * @param {Object} columns - Current columns object
   * @param {Array} columnOrder - Current column order array
   * @param {String} title - New column title
   * @returns {Promise<Object>} - { columns, columnOrder, error }
   */
  static async addColumn(columns, columnOrder, title) {
    if (!title.trim()) {
      return { columns, columnOrder, error: 'Column title cannot be empty' };
    }
    
    // Convert title to a kebab-case ID to be consistent with status IDs
    const columnId = title.trim().toLowerCase().replace(/\s+/g, '-');
    
    // Check if a column with this ID already exists
    if (columns[columnId]) {
      return { 
        columns, 
        columnOrder, 
        error: `A column named "${title}" already exists` 
      };
    }
    
    // Check if a column with this title exists (case insensitive)
    const existingColumnWithSimilarTitle = Object.values(columns).find(
      col => col.title.toLowerCase() === title.toLowerCase()
    );
    
    if (existingColumnWithSimilarTitle) {
      return { 
        columns, 
        columnOrder, 
        error: `A column with title "${existingColumnWithSimilarTitle.title}" already exists` 
      };
    }
    
    // Create the new column
    const newColumn = {
      id: columnId,
      title: title.trim(),
      taskIds: []
    };
    
    // Update columns and column order
    const updatedColumns = { ...columns, [columnId]: newColumn };
    const updatedColumnOrder = columnOrder.includes(columnId) 
      ? columnOrder 
      : [...columnOrder, columnId];
    
    // Save the changes
    try {
      await this.saveColumnSettings(updatedColumns, updatedColumnOrder);
      return { columns: updatedColumns, columnOrder: updatedColumnOrder, error: null };
    } catch (error) {
      console.error('Error adding column:', error);
      return { 
        columns: updatedColumns, 
        columnOrder: updatedColumnOrder, 
        error: 'Failed to save column settings to the server'
      };
    }
  }
  
  /**
   * Delete a column
   * @param {Object} columns - Current columns object
   * @param {Array} columnOrder - Current column order array
   * @param {String} columnId - ID of the column to delete
   * @returns {Promise<Object>} - { columns, columnOrder, error }
   */
  static async deleteColumn(columns, columnOrder, columnId) {
    // Check if column exists
    if (!columnId || !columns[columnId]) {
      return { 
        columns, 
        columnOrder, 
        error: `Cannot delete column: Column with ID ${columnId} not found` 
      };
    }
    
    // Don't allow deleting if the column has tasks
    if (Array.isArray(columns[columnId].taskIds) && columns[columnId].taskIds.length > 0) {
      return { 
        columns, 
        columnOrder, 
        error: 'Cannot delete a column that contains tasks. Move tasks to another column first.' 
      };
    }
    
    // Create a new columns object without the deleted column
    const updatedColumns = { ...columns };
    delete updatedColumns[columnId];
    
    // Update column order
    const updatedColumnOrder = columnOrder.filter(id => id !== columnId);
    
    // Save the changes
    try {
      await this.saveColumnSettings(updatedColumns, updatedColumnOrder);
      return { columns: updatedColumns, columnOrder: updatedColumnOrder, error: null };
    } catch (error) {
      console.error('Error deleting column:', error);
      return { 
        columns: updatedColumns, 
        columnOrder: updatedColumnOrder, 
        error: 'Failed to save column settings to the server'
      };
    }
  }
  
  /**
   * Rename a column
   * @param {Object} columns - Current columns object
   * @param {Array} columnOrder - Current column order array
   * @param {String} columnId - ID of the column to rename
   * @param {String} newTitle - New column title
   * @returns {Promise<Object>} - { columns, columnOrder, error }
   */
  static async renameColumn(columns, columnOrder, columnId, newTitle) {
    // Check if column exists
    if (!columnId || !columns[columnId]) {
      return { 
        columns, 
        columnOrder, 
        error: `Cannot rename column: Column with ID ${columnId} not found` 
      };
    }
    
    if (!newTitle.trim()) {
      return { 
        columns, 
        columnOrder, 
        error: 'Column title cannot be empty' 
      };
    }
    
    // Update the column title
    const updatedColumns = {
      ...columns,
      [columnId]: {
        ...columns[columnId],
        title: newTitle.trim()
      }
    };
    
    // Save the changes
    try {
      await this.saveColumnSettings(updatedColumns, columnOrder);
      return { columns: updatedColumns, columnOrder, error: null };
    } catch (error) {
      console.error('Error renaming column:', error);
      return { 
        columns: updatedColumns, 
        columnOrder, 
        error: 'Failed to save column settings to the server'
      };
    }
  }
  
  /**
   * Reorder columns
   * @param {Object} columns - Current columns object
   * @param {Array} columnOrder - Current column order array
   * @param {Number} sourceIndex - Source index in columnOrder
   * @param {Number} destinationIndex - Destination index in columnOrder
   * @param {String} draggableId - ID of the dragged column
   * @returns {Promise<Object>} - { columns, columnOrder, error }
   */
  static async reorderColumns(columns, columnOrder, sourceIndex, destinationIndex, draggableId) {
    const updatedColumnOrder = Array.from(columnOrder);
    updatedColumnOrder.splice(sourceIndex, 1);
    updatedColumnOrder.splice(destinationIndex, 0, draggableId);
    
    // Save the changes
    try {
      await this.saveColumnSettings(columns, updatedColumnOrder);
      return { columns, columnOrder: updatedColumnOrder, error: null };
    } catch (error) {
      console.error('Error reordering columns:', error);
      return { 
        columns, 
        columnOrder: updatedColumnOrder, 
        error: 'Failed to save column settings to the server'
      };
    }
  }
}

export default ColumnManager;
