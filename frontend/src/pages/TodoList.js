import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Box, Button, TextField, Checkbox, IconButton, Card, CardContent, Dialog,
  DialogActions, DialogContent, DialogTitle, CircularProgress,
  Paper, Tooltip, Menu, MenuItem
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  PhotoCamera as PhotoCameraIcon,
  Close as CloseIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { todoService } from '../services/api';
import ColumnManager from './ColumnManager';

// Styled components
const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

// Column wrapper styled component
const ColumnContainer = styled(Paper)(({ theme }) => ({
  minHeight: '300px',
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(1),
  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.paper : '#f5f5f5',
  borderRadius: theme.spacing(1),
  height: 'fit-content',
  minWidth: '300px',
  maxWidth: '350px',
}));

// Task card styled component
const TaskCard = styled(Paper)(({ theme, iscompleted }) => ({
  padding: theme.spacing(1.5),
  marginBottom: theme.spacing(1),
  backgroundColor: iscompleted === 'true' 
    ? theme.palette.mode === 'dark' 
      ? 'rgba(76, 175, 80, 0.15)' 
      : 'rgba(76, 175, 80, 0.1)'
    : theme.palette.background.paper,
  borderLeft: `4px solid ${
    iscompleted === 'true' 
      ? theme.palette.success.main
      : theme.palette.primary.main
  }`,
  '&:hover': {
    boxShadow: theme.shadows[3],
  },
  transition: 'all 0.2s',
  cursor: 'grab',
}));

function TodoList() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newTodoDescription, setNewTodoDescription] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editTodo, setEditTodo] = useState(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [columns, setColumns] = useState({
    'todo': { id: 'todo', title: 'To Do', taskIds: [] },
    'inProgress': { id: 'inProgress', title: 'In Progress', taskIds: [] },
    'done': { id: 'done', title: 'Completed', taskIds: [] }
  });
  const [columnOrder, setColumnOrder] = useState(['todo', 'inProgress', 'done']);
  const [isAddColumnDialogOpen, setIsAddColumnDialogOpen] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [columnSettingsAnchorEl, setColumnSettingsAnchorEl] = useState(null);
  const [activeColumn, setActiveColumn] = useState(null);
  const [isEditColumnDialogOpen, setIsEditColumnDialogOpen] = useState(false);
  const [quickAddColumn, setQuickAddColumn] = useState(null);
  const [quickAddTaskTitle, setQuickAddTaskTitle] = useState('');
  // Confirmation dialog state for deleting all tasks in a column
  const [confirmDeleteAllOpen, setConfirmDeleteAllOpen] = useState(false);
  const [columnIdToDeleteAll, setColumnIdToDeleteAll] = useState(null);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [photoDialogUrl, setPhotoDialogUrl] = useState(null);

  // Memoized helper to ensure columns and columnOrder are in sync
  const validateColumnsState = useCallback((columnsArg, columnOrderArg, setColumnOrderArg) => {
    const columnsKeys = Object.keys(columnsArg);
    const validColumnOrder = columnOrderArg.filter(id => columnsKeys.includes(id));
    if (validColumnOrder.length !== columnOrderArg.length) {
      setColumnOrderArg(validColumnOrder);
      return true;
    }
    const missingColumnIds = columnsKeys.filter(id => !columnOrderArg.includes(id));
    if (missingColumnIds.length > 0) {
      setColumnOrderArg(current => [...current, ...missingColumnIds]);
      return true;
    }
    return false;
  }, []);

  // Memoized organizeTodosInColumns
  const organizeTodosInColumns = useCallback((fetchedTodos, columnsArg, columnOrderArg, setColumnsArg, setColumnOrderArg) => {
    const updatedColumns = { ...columnsArg };
    Object.keys(updatedColumns).forEach(columnId => {
      updatedColumns[columnId].taskIds = [];
    });
    const titleMap = new Map();
    const newColumnStatuses = [];
    fetchedTodos.forEach(todo => {
      const todoStatus = todo.status || (todo.is_completed ? 'done' : 'todo');
      const statusLower = todoStatus.toLowerCase();
      const matchingColumnId = Object.keys(updatedColumns).find(
        colId => colId.toLowerCase() === statusLower
      );
      if (matchingColumnId) {
        updatedColumns[matchingColumnId].taskIds.push(todo.id);
        todo.status = matchingColumnId;
      } else {
        const title = todoStatus.charAt(0).toUpperCase() + todoStatus.slice(1).replace(/-/g, ' ');
        const titleLower = title.toLowerCase();
        const existingColumnIdByTitle = titleMap.get(titleLower);
        if (existingColumnIdByTitle) {
          updatedColumns[existingColumnIdByTitle].taskIds.push(todo.id);
          todo.status = existingColumnIdByTitle;
        } else if (todoStatus && todoStatus !== 'todo' && todoStatus !== 'inProgress' && todoStatus !== 'done') {
          updatedColumns[todoStatus] = {
            id: todoStatus,
            title: title,
            taskIds: [todo.id]
          };
          titleMap.set(titleLower, todoStatus);
          if (!columnOrderArg.includes(todoStatus) && !newColumnStatuses.includes(todoStatus)) {
            newColumnStatuses.push(todoStatus);
          }
        } else {
          if (updatedColumns['todo']) {
            updatedColumns['todo'].taskIds.push(todo.id);
          } else {
            updatedColumns['todo'] = {
              id: 'todo',
              title: 'To Do',
              taskIds: [todo.id]
            };
            if (!columnOrderArg.includes('todo') && !newColumnStatuses.includes('todo')) {
              newColumnStatuses.push('todo');
            }
          }
        }
      }
      if (!todo.status) {
        todo.status = todoStatus;
      }
    });
    const missingColumns = Object.keys(updatedColumns).filter(
      colId => !columnOrderArg.includes(colId)
    );
    if (missingColumns.length > 0 || newColumnStatuses.length > 0) {
      const allNewColumns = [...missingColumns, ...newColumnStatuses];
      const uniqueNewColumns = Array.from(new Set(allNewColumns));
      setColumnOrderArg([...columnOrderArg, ...uniqueNewColumns]);
    }
    setColumnsArg(updatedColumns);
    setColumnOrderArg(columnOrderArg);
    Object.keys(columnsArg).forEach(columnId => {
      if (!updatedColumns[columnId]) {
        updatedColumns[columnId] = { ...columnsArg[columnId], taskIds: [] };
      }
    });
  }, []);

  // fetchTodos must be defined here to access state and helpers
  const fetchTodos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await todoService.getAll();
      const fetchedTodos = response.data;
      setTodos(fetchedTodos);
      const { columns: loadedColumns, columnOrder: loadedOrder } = await ColumnManager.loadColumnSettings();
      setColumns(loadedColumns);
      setColumnOrder(loadedOrder);
      validateColumnsState(loadedColumns, loadedOrder, setColumnOrder);
      organizeTodosInColumns(fetchedTodos, loadedColumns, loadedOrder, setColumns, setColumnOrder);
      setError(null);
    } catch (err) {
      console.error('Error fetching todos:', err);
      setError('Failed to load todos');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setTodos, setColumns, setColumnOrder, setError, validateColumnsState, organizeTodosInColumns]);

  // Load columns from API and fetch todos
  useEffect(() => {
    const loadColumns = async () => {
      try {
        setLoading(true);
        const { columns: loadedColumns, columnOrder: loadedOrder } = await ColumnManager.loadColumnSettings();
        setColumns(loadedColumns);
        setColumnOrder(loadedOrder);
        await fetchTodos();
      } catch (error) {
        console.error('Error loading column settings:', error);
        setError('Failed to load column settings');
      } finally {
        setLoading(false);
      }
    };
    loadColumns();
    return () => {
      // This empty cleanup function helps React clean up any pending animations
      // from the DnD library when the component unmounts
    };
  }, [fetchTodos]); // Only run on mount and when fetchTodos changes
  // eslint-disable-next-line react-hooks/exhaustive-deps

  const handleCreateTodo = async (e, columnId = 'todo', quickAddTitle = null) => {
    if (e) e.preventDefault();
    
    const title = quickAddTitle || newTodoTitle;
    if (!title.trim()) return;
    
    // Make sure the column exists, or use 'todo' as fallback
    if (!columns[columnId]) {
      console.warn(`Column ${columnId} not found, using 'todo' as fallback`);
      columnId = 'todo';
      
      // If the 'todo' column doesn't exist either, find the first available column
      if (!columns['todo']) {
        const availableColumns = Object.keys(columns);
        if (availableColumns.length > 0) {
          columnId = availableColumns[0];
          console.warn(`'todo' column not found, using '${columnId}' as fallback`);
        } else {
          setError("No columns available to add tasks to.");
          return;
        }
      }
    }

    try {
      const response = await todoService.create({
        title: title.trim(),
        description: newTodoDescription.trim(),
        is_completed: columnId === 'done',
        status: columnId
      });
      
      const newTodo = response.data;
      setTodos([...todos, newTodo]);
      
      // Add the new todo to the specified column
      const newColumns = { ...columns };
      
      // Make sure the column and taskIds array exist
      if (!newColumns[columnId]) {
        console.error(`Column ${columnId} not found when adding task`);
        return;
      }
      
      if (!Array.isArray(newColumns[columnId].taskIds)) {
        newColumns[columnId].taskIds = [];
      }
      
      newColumns[columnId].taskIds.push(newTodo.id);
      setColumns(newColumns);
      
      setNewTodoTitle('');
      setNewTodoDescription('');
      setQuickAddTaskTitle('');
    } catch (err) {
      console.error('Error creating todo:', err);
      setError('Failed to create todo');
    }
  };

  const handleToggleComplete = async (id, isCompleted) => {
    try {
      const response = await todoService.update(id, {
        is_completed: !isCompleted,
        status: !isCompleted ? 'done' : 'todo',
      });
      
      const updatedTodo = response.data;
      setTodos(todos.map(todo => todo.id === id ? updatedTodo : todo));
      
      // Move the todo to the appropriate column
      const sourceColumn = getColumnForTask(id);
      const destinationColumn = updatedTodo.is_completed ? 'done' : 'todo';
      
      if (sourceColumn !== destinationColumn) {
        const newColumns = { ...columns };
        newColumns[sourceColumn].taskIds = newColumns[sourceColumn].taskIds.filter(taskId => taskId !== id);
        newColumns[destinationColumn].taskIds.push(id);
        setColumns(newColumns);
      }
    } catch (err) {
      console.error('Error updating todo:', err);
      setError('Failed to update todo');
    }
  };

  const handleDeleteTodo = async (id) => {
    try {
      await todoService.delete(id);
      
      // Remove the todo from state
      setTodos(todos.filter(todo => todo.id !== id));
      
      // Remove the todo from its column
      const columnId = getColumnForTask(id);
      if (columnId) {
        const newColumns = { ...columns };
        newColumns[columnId].taskIds = newColumns[columnId].taskIds.filter(taskId => taskId !== id);
        setColumns(newColumns);
      }
    } catch (err) {
      console.error('Error deleting todo:', err);
      setError('Failed to delete todo');
    }
  };
  
  // Helper function to find which column contains a specific task
  const getColumnForTask = (taskId) => {
    for (const columnId of Object.keys(columns)) {
      if (columns[columnId] && columns[columnId].taskIds.includes(taskId)) {
        return columnId;
      }
    }
    return null;
  };

  const handleOpenEditDialog = (todo) => {
    setEditTodo({ ...todo });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditTodo(null);
  };

  const handleUpdateTodo = async () => {
    if (!editTodo.title.trim()) return;

    try {
      // Check if status has changed
      const oldTodo = todos.find(todo => todo.id === editTodo.id);
      const statusChanged = oldTodo && oldTodo.status !== editTodo.status;
      
      const response = await todoService.update(editTodo.id, {
        title: editTodo.title.trim(),
        description: editTodo.description ? editTodo.description.trim() : '',
        status: editTodo.status,
        is_completed: editTodo.status === 'done' // Update is_completed based on status
      });
      
      // Update todos state
      setTodos(todos.map(todo => todo.id === editTodo.id ? response.data : todo));
      
      // If status changed, update the columns
      if (statusChanged) {
        const sourceColumn = getColumnForTask(editTodo.id);
        const destinationColumn = editTodo.status;
        
        if (sourceColumn !== destinationColumn) {
          const newColumns = { ...columns };
          
          // Remove from source column
          if (sourceColumn) {
            newColumns[sourceColumn].taskIds = newColumns[sourceColumn].taskIds.filter(
              taskId => taskId !== editTodo.id
            );
          }
          
          // Add to destination column
          if (newColumns[destinationColumn]) {
            newColumns[destinationColumn].taskIds.push(editTodo.id);
          }
          
          setColumns(newColumns);
        }
      }
      
      handleCloseDialog();
    } catch (err) {
      console.error('Error updating todo:', err);
      setError('Failed to update todo');
    }
  };
  
  // Handle drag end event with improved error handling
  const handleDragEnd = async (result) => {
    const { destination, source, draggableId, type } = result;

    // If there's no destination or if the item was dropped back where it started
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }

    // Handle column reordering
    if (type === 'column') {
      // Use ColumnManager to reorder columns
      (async () => {
        const result = await ColumnManager.reorderColumns(
          columns, 
          columnOrder, 
          source.index, 
          destination.index, 
          draggableId
        );
        
        if (result.error) {
          setError(result.error);
        } else {
          // Update state with the new column order
          setColumnOrder(result.columnOrder);
          
          console.log(`Reordered columns: ${result.columnOrder.join(', ')}`);
        }
      })();
      
      // Update UI immediately for better user experience
      const newColumnOrder = Array.from(columnOrder);
      newColumnOrder.splice(source.index, 1);
      newColumnOrder.splice(destination.index, 0, draggableId);
      setColumnOrder(newColumnOrder);
      
      return;
    }

    // Check if the source and destination columns exist
    const sourceColumn = columns[source.droppableId];
    const destColumn = columns[destination.droppableId];
    
    // Guard against missing columns
    if (!sourceColumn || !destColumn) {
      console.error('Source or destination column not found', { 
        sourceId: source.droppableId,
        destId: destination.droppableId,
        columns: Object.keys(columns)
      });
      return;
    }
    
    try {
      // Validate taskIds arrays
      if (!Array.isArray(sourceColumn.taskIds)) {
        console.error(`Source column ${source.droppableId} has invalid taskIds:`, sourceColumn.taskIds);
        sourceColumn.taskIds = []; // Reset to empty array
      }
      
      if (!Array.isArray(destColumn.taskIds)) {
        console.error(`Destination column ${destination.droppableId} has invalid taskIds:`, destColumn.taskIds);
        destColumn.taskIds = []; // Reset to empty array
      }
      
      // Moving within the same column
      if (sourceColumn === destColumn) {
        // Create a copy of taskIds to avoid direct state mutation
        const newTaskIds = Array.from(sourceColumn.taskIds);
        
        // Ensure we have valid indices
        if (source.index >= 0 && source.index < newTaskIds.length) {
          newTaskIds.splice(source.index, 1);
          newTaskIds.splice(destination.index, 0, draggableId);
          
          const newColumn = {
            ...sourceColumn,
            taskIds: newTaskIds,
          };
          
          setColumns({
            ...columns,
            [newColumn.id]: newColumn,
          });
        }
      } 
      // Moving to a different column
      else {
        // Create copies of taskIds arrays to avoid direct state mutation
        const sourceTaskIds = Array.from(sourceColumn.taskIds);
        const destTaskIds = Array.from(destColumn.taskIds);
        
        // Ensure we have valid indices
        if (source.index >= 0 && source.index < sourceTaskIds.length) {
          sourceTaskIds.splice(source.index, 1);
          destTaskIds.splice(destination.index, 0, draggableId);
          
          const newColumns = {
            ...columns,
            [sourceColumn.id]: {
              ...sourceColumn,
              taskIds: sourceTaskIds,
            },
            [destColumn.id]: {
              ...destColumn,
              taskIds: destTaskIds,
            },
          };
          
          // Update the local state
          setColumns(newColumns);
          
          // Update the task status on the server
          const todoId = parseInt(draggableId, 10);
          const todo = todos.find(t => t.id === todoId);
          
          if (todo) {
            try {
              // Update the todo's status and is_completed flag based on the column
              const isCompleted = destColumn.id === 'done';
          
          const response = await todoService.update(todoId, {
            status: destColumn.id,
            is_completed: isCompleted
          });
          
          // Update the local todos state with the full response including status
          setTodos(todos.map(t => t.id === todoId ? {
            ...response.data,
            status: destColumn.id  // Ensure status is set even if backend doesn't return it
          } : t));
        } catch (err) {
          console.error('Error updating todo status:', err);
          setError('Failed to update task status');
            }
          }
        }
      }
    } catch (err) {
      console.error('Error handling drag end:', err);
      setError('An error occurred while dragging. Please try again.');
    }
  };

  const handlePhotoUpload = async (todoId, event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setPhotoLoading(true);
      const response = await todoService.uploadPhoto(todoId, file);
      
      // Update the todos state with the new photo
      setTodos(todos.map(todo => {
        if (todo.id === todoId) {
          return {
            ...todo,
            photos: [...todo.photos, response.data]
          };
        }
        return todo;
      }));
    } catch (err) {
      console.error('Error uploading photo:', err);
      setError('Failed to upload photo');
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleDeletePhoto = async (todoId, photoId) => {
    try {
      await todoService.deletePhoto(todoId, photoId);
      
      // Update the todos state by removing the deleted photo
      setTodos(todos.map(todo => {
        if (todo.id === todoId) {
          return {
            ...todo,
            photos: todo.photos.filter(photo => photo.id !== photoId)
          };
        }
        return todo;
      }));
    } catch (err) {
      console.error('Error deleting photo:', err);
      setError('Failed to delete photo');
    }
  };
  
  // Column management methods
  const handleAddColumn = async () => {
    if (!newColumnTitle.trim()) return;
    
    // Use ColumnManager to add the column
    const result = await ColumnManager.addColumn(columns, columnOrder, newColumnTitle.trim());
    
    // Handle the result
    if (result.error) {
      setError(result.error);
    } else {
      // Update state
      setColumns(result.columns);
      setColumnOrder(result.columnOrder);
      
      // Reset form
      setNewColumnTitle('');
      setIsAddColumnDialogOpen(false);
      setError(null);
      
      console.log(`Added column: ${newColumnTitle.trim()}`);
      console.log(`Updated columns: ${Object.keys(result.columns).join(', ')}`);
      console.log(`Updated column order: ${result.columnOrder.join(', ')}`);
    }
  };
  
  const handleDeleteColumn = async (columnId) => {
    // Use ColumnManager to delete the column
    const result = await ColumnManager.deleteColumn(columns, columnOrder, columnId);
    
    // Handle the result
    if (result.error) {
      setError(result.error);
    } else {
      // Update state
      setColumns(result.columns);
      setColumnOrder(result.columnOrder);
      
      console.log(`Deleted column: ${columnId}`);
      console.log(`Updated columns: ${Object.keys(result.columns).join(', ')}`);
      console.log(`Updated column order: ${result.columnOrder.join(', ')}`);
    }
    
    setColumnSettingsAnchorEl(null);
  };
  
  const handleRenameColumn = async () => {
    if (!activeColumn || !activeColumn.title.trim()) return;
    
    // Use ColumnManager to rename the column
    const result = await ColumnManager.renameColumn(columns, columnOrder, activeColumn.id, activeColumn.title);
    
    // Handle the result
    if (result.error) {
      setError(result.error);
    } else {
      // Update state
      setColumns(result.columns);
      
      console.log(`Renamed column ${activeColumn.id} to: ${activeColumn.title}`);
      console.log(`Updated columns: ${Object.keys(result.columns).join(', ')}`);
    }
    
    setIsEditColumnDialogOpen(false);
    setActiveColumn(null);
  };
  
  const handleColumnSettingsClick = (event, column) => {
    setActiveColumn(column);
    setColumnSettingsAnchorEl(event.currentTarget);
  };
  
  const handleOpenEditColumnDialog = () => {
    setIsEditColumnDialogOpen(true);
    setColumnSettingsAnchorEl(null);
  };
  
  const handleQuickAddTask = (columnId) => {
    // Make sure we have a valid column ID and title
    if (!columnId || !columns[columnId]) {
      console.error(`Cannot add task: Column with ID ${columnId} not found`);
      setError(`Cannot add task: Invalid column selected`);
      setQuickAddColumn(null);
      setQuickAddTaskTitle('');
      return;
    }
    
    if (quickAddTaskTitle.trim()) {
      handleCreateTodo(null, columnId, quickAddTaskTitle);
      setQuickAddColumn(null);
      setQuickAddTaskTitle('');
    }
  };

  // Remove all tasks from a column (including from the DB)
  const handleDeleteAllTasksInColumn = async (columnId) => {
    if (!columnId || !columns[columnId]) return;
    setConfirmDeleteAllOpen(true);
    setColumnIdToDeleteAll(columnId);
  };

  // Actually perform the deletion after confirmation
  const confirmDeleteAllTasks = async () => {
    const columnId = columnIdToDeleteAll;
    if (!columnId || !columns[columnId]) {
      setConfirmDeleteAllOpen(false);
      setColumnIdToDeleteAll(null);
      return;
    }
    try {
      const taskIds = columns[columnId].taskIds;
      await Promise.all(taskIds.map(async (taskId) => {
        try {
          await todoService.delete(taskId);
        } catch (err) {
          console.error(`Failed to delete task ${taskId}:`, err);
        }
      }));
      const updatedColumns = {
        ...columns,
        [columnId]: {
          ...columns[columnId],
          taskIds: []
        }
      };
      setTodos(todos.filter(todo => !taskIds.includes(todo.id)));
      await ColumnManager.saveColumnSettings(updatedColumns, columnOrder);
      setColumns(updatedColumns);
      setColumnSettingsAnchorEl(null);
    } catch (err) {
      setError('Failed to delete all tasks in column');
    } finally {
      setConfirmDeleteAllOpen(false);
      setColumnIdToDeleteAll(null);
    }
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          My Tasks
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={() => setIsAddColumnDialogOpen(true)}
          id="main-add-column-button"
          name="main-add-column"
        >
          Add Column
        </Button>
      </Box>

      {error && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: (theme) => theme.palette.mode === 'dark' ? '#462c2c' : '#ffebee' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography color="error">{error}</Typography>
            {error.includes("column") && (
              <Button 
                variant="outlined" 
                color="error" 
                size="small"
                onClick={() => {
                  // Reset to default columns
                  const defaultColumns = {
                    'todo': { id: 'todo', title: 'To Do', taskIds: [] },
                    'inProgress': { id: 'inProgress', title: 'In Progress', taskIds: [] },
                    'done': { id: 'done', title: 'Completed', taskIds: [] }
                  };
                  const defaultOrder = ['todo', 'inProgress', 'done'];
                  
                  // Clear localStorage
                  localStorage.removeItem('todoColumns');
                  localStorage.removeItem('todoColumnOrder');
                  
                  // Set state
                  setColumns(defaultColumns);
                  setColumnOrder(defaultOrder);
                  setError(null);
                  
                  // Fetch todos to repopulate columns
                  fetchTodos();
                }}
              >
                Reset Columns
              </Button>
            )}
          </Box>
        </Paper>
      )}

      {/* Add new todo form - collapsible */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" component="h2" gutterBottom>
            Add New Task
          </Typography>
          <Box component="form" onSubmit={handleCreateTodo} noValidate>
            <TextField
              fullWidth
              label="Task Title"
              variant="outlined"
              value={newTodoTitle}
              onChange={(e) => setNewTodoTitle(e.target.value)}
              margin="normal"
              required
              size="small"
              id="new-task-title-input"
              name="new-task-title"
            />
            <TextField
              fullWidth
              label="Description (optional)"
              variant="outlined"
              value={newTodoDescription}
              onChange={(e) => setNewTodoDescription(e.target.value)}
              margin="normal"
              multiline
              rows={2}
              size="small"
              id="new-task-description-input"
              name="new-task-description"
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              sx={{ mt: 2 }}
              disabled={!newTodoTitle.trim()}
              size="small"
              id="add-task-submit-button"
              name="add-task-submit"
            >
              Add Task
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Kanban board */}
      {Object.keys(columns).length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', mt: 2 }}>
          <Typography variant="h6" color="text.secondary">
            No columns available.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            onClick={() => {
              // Reset to default columns
              const defaultColumns = {
                'todo': { id: 'todo', title: 'To Do', taskIds: [] },
                'inProgress': { id: 'inProgress', title: 'In Progress', taskIds: [] },
                'done': { id: 'done', title: 'Completed', taskIds: [] }
              };
              const defaultOrder = ['todo', 'inProgress', 'done'];
              
              setColumns(defaultColumns);
              setColumnOrder(defaultOrder);
            }}
          >
            Reset to Default Columns
          </Button>
        </Paper>
      ) : (
        <DragDropContext 
          onDragEnd={handleDragEnd}
          onBeforeDragStart={() => setError(null)} // Clear any previous errors
          onDragStart={() => {
            // Fix: Always pass columns, columnOrder, setColumnOrder to validateColumnsState
            validateColumnsState(columns, columnOrder, setColumnOrder);
          }}
        >
          <Box sx={{ 
            display: 'flex',
            width: '100%',
            height: 'calc(100vh - 350px)',
            position: 'relative'
          }}>
          <Droppable droppableId="all-columns" direction="horizontal" type="column">
            {(provided) => (
              <Box
                ref={provided.innerRef}
                {...provided.droppableProps}
                sx={{
                  display: 'flex',
                  overflowX: 'auto',
                  overflowY: 'hidden',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  pb: 2,
                  gap: 2
                }}
              >
                {columnOrder.map((columnId, index) => {
                  const column = columns[columnId];
                  if (!column) return null;
                  
                  // Ensure taskIds is an array
                  if (!Array.isArray(column.taskIds)) {
                    console.warn(`Column ${columnId} taskIds is not an array, treating as empty array`);
                    column.taskIds = [];
                  }
                  
                  // Ensure column.taskIds is an array before using it
                  const taskIds = Array.isArray(column.taskIds) ? column.taskIds : [];
                  const tasksForColumn = taskIds.map(taskId =>
                    todos.find(todo => todo.id === parseInt(taskId, 10))
                  ).filter(Boolean);

                  return (
                    <Draggable draggableId={column.id} index={index} key={column.id}>
                      {(provided) => (
                        <Box
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          sx={{
                            minWidth: '300px',
                            maxWidth: '350px',
                          }}
                        >
                          <ColumnContainer elevation={1}>
                            {/* Column header */}
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: 1,
                                p: 1,
                                borderBottom: '1px solid',
                                borderColor: 'divider',
                              }}
                              {...provided.dragHandleProps}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography variant="h6" component="h3">
                                  {column.title} ({tasksForColumn.length})
                                </Typography>
                              </Box>

                              <Box>
                                <Tooltip title="Add task to this column">
                                  <IconButton
                                    size="small"
                                    onClick={() => setQuickAddColumn(column.id)}
                                    id={`quick-add-button-${column.id}`}
                                    name={`quick-add-${column.id}`}
                                  >
                                    <AddIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Column settings">
                                  <IconButton
                                    size="small"
                                    onClick={(e) => handleColumnSettingsClick(e, column)}
                                    id={`column-settings-button-${column.id}`}
                                    name={`column-settings-${column.id}`}
                                  >
                                    <MoreVertIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </Box>

                            {/* Quick add task form */}
                            {quickAddColumn === column.id && (
                              <Box sx={{ p: 1, mb: 1 }}>
                                <TextField
                                  fullWidth
                                  autoFocus
                                  placeholder="Enter task title"
                                  size="small"
                                  value={quickAddTaskTitle}
                                  onChange={(e) => setQuickAddTaskTitle(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleQuickAddTask(column.id);
                                    } else if (e.key === 'Escape') {
                                      setQuickAddColumn(null);
                                      setQuickAddTaskTitle('');
                                    }
                                  }}
                                  id={`quick-add-input-${column.id}`}
                                  name={`quick-add-task-${column.id}`}
                                  InputProps={{
                                    endAdornment: (
                                      <IconButton
                                        size="small"
                                        onClick={() => {
                                          setQuickAddColumn(null);
                                          setQuickAddTaskTitle('');
                                        }}
                                        id={`quick-add-cancel-${column.id}`}
                                        name={`quick-add-cancel-${column.id}`}
                                      >
                                        <CloseIcon fontSize="small" />
                                      </IconButton>
                                    ),
                                  }}
                                />
                              </Box>
                            )}

                            {/* Tasks */}
                            <Droppable droppableId={column.id} type="task">
                              {(provided, snapshot) => (
                                <Box
                                  ref={provided.innerRef}
                                  {...provided.droppableProps}
                                  sx={{
                                    flex: 1,
                                    minHeight: 100,
                                    transition: 'background-color 0.2s ease',
                                    backgroundColor: snapshot.isDraggingOver
                                      ? (theme) => theme.palette.mode === 'dark'
                                        ? 'rgba(255, 255, 255, 0.05)'
                                        : 'rgba(0, 0, 0, 0.03)'
                                      : 'transparent',
                                    borderRadius: 1,
                                    p: 1,
                                    overflowY: 'auto',
                                    maxHeight: 'calc(100vh - 250px)',
                                    className: 'column-content',
                                  }}
                                >
                                  {tasksForColumn.length === 0 ? (
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                      align="center"
                                      sx={{
                                        p: 2,
                                        fontStyle: 'italic',
                                        opacity: 0.7
                                      }}
                                    >
                                      No tasks in this column
                                    </Typography>
                                  ) : (
                                    tasksForColumn.map((todo, index) => (
                                      <Draggable
                                        key={todo.id}
                                        draggableId={todo.id.toString()}
                                        index={index}
                                      >
                                        {(provided, snapshot) => (
                                          <TaskCard
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            iscompleted={todo.is_completed.toString()}
                                            elevation={snapshot.isDragging ? 4 : 1}
                                            sx={{
                                              transform: snapshot.isDragging ? 'rotate(2deg)' : 'none',
                                            }}
                                          >
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                              <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
                                                <Checkbox
                                                  checked={todo.is_completed}
                                                  onChange={() => handleToggleComplete(todo.id, todo.is_completed)}
                                                  color="primary"
                                                  size="small"
                                                  sx={{ mt: -0.5, mr: 1 }}
                                                  id={`task-complete-${todo.id}`}
                                                  name={`task-complete-${todo.id}`}
                                                />
                                                <Box sx={{ width: '100%' }}>
                                                  <Typography
                                                    variant="subtitle1"
                                                    sx={{
                                                      textDecoration: todo.is_completed ? 'line-through' : 'none',
                                                      color: todo.is_completed ? 'text.secondary' : 'text.primary',
                                                      fontWeight: 500,
                                                      mb: todo.description ? 0.5 : 0,
                                                      wordBreak: 'break-word'
                                                    }}
                                                  >
                                                    {todo.title}
                                                  </Typography>
                                                  {todo.description && (
                                                    <Typography
                                                      variant="body2"
                                                      color="text.secondary"
                                                      sx={{
                                                        mt: 0.5,
                                                        fontSize: '0.875rem',
                                                        opacity: 0.8,
                                                        wordBreak: 'break-word'
                                                      }}
                                                    >
                                                      {todo.description.length > 100
                                                        ? `${todo.description.substring(0, 100)}...`
                                                        : todo.description}
                                                    </Typography>
                                                  )}

                                                  {/* Photo thumbnails - compact view */}
                                                  {todo.photos && todo.photos.length > 0 && (
                                                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                      {todo.photos.map((photo) => (
                                                        <Box
                                                          key={photo.id}
                                                          sx={{
                                                            position: 'relative',
                                                            width: 60,
                                                            height: 60,
                                                            borderRadius: 1,
                                                            overflow: 'hidden',
                                                            cursor: 'pointer',
                                                          }}
                                                          onClick={() => {
                                                            setPhotoDialogUrl(photo.url);
                                                            setPhotoDialogOpen(true);
                                                          }}
                                                        >
                                                          <img
                                                            src={photo.url}
                                                            alt={photo.filename}
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                          />
                                                          <IconButton
                                                            size="small"
                                                            sx={{
                                                              position: 'absolute',
                                                              top: 0,
                                                              right: 0,
                                                              bgcolor: 'rgba(0, 0, 0, 0.5)',
                                                              color: 'white',
                                                              padding: '2px',
                                                              zIndex: 2,
                                                              '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' },
                                                            }}
                                                            onClick={e => {
                                                              e.stopPropagation();
                                                              handleDeletePhoto(todo.id, photo.id);
                                                            }}
                                                          >
                                                            <CloseIcon sx={{ fontSize: 14 }} />
                                                          </IconButton>
                                                        </Box>
                                                      ))}
                                                    </Box>
                                                  )}
                                                </Box>
                                              </Box>
                                            </Box>

                                            {/* Actions - now in a footer */}
                                            <Box sx={{
                                              display: 'flex',
                                              justifyContent: 'space-between',
                                              mt: 1,
                                              pt: 1,
                                              borderTop: '1px solid',
                                              borderColor: theme => theme.palette.mode === 'dark'
                                                ? 'rgba(255, 255, 255, 0.1)'
                                                : 'rgba(0, 0, 0, 0.08)',
                                            }}>
                                              <Button
                                                component="label"
                                                size="small"
                                                startIcon={<PhotoCameraIcon fontSize="small" />}
                                                disabled={photoLoading}
                                                sx={{ fontSize: '0.75rem' }}
                                                id={`add-photo-button-${todo.id}`}
                                                name={`add-photo-${todo.id}`}
                                              >
                                                Add Photo
                                                <VisuallyHiddenInput
                                                  type="file"
                                                  accept="image/*"
                                                  onChange={(e) => handlePhotoUpload(todo.id, e)}
                                                  id={`photo-input-${todo.id}`}
                                                  name={`photo-input-${todo.id}`}
                                                />
                                              </Button>
                                              <Box>
                                                <IconButton 
                                                  size="small" 
                                                  onClick={() => handleOpenEditDialog(todo)}
                                                  id={`edit-task-button-${todo.id}`}
                                                  name={`edit-task-${todo.id}`}
                                                >
                                                  <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton 
                                                  size="small" 
                                                  onClick={() => handleDeleteTodo(todo.id)}
                                                  id={`delete-task-button-${todo.id}`}
                                                  name={`delete-task-${todo.id}`}
                                                >
                                                  <DeleteIcon fontSize="small" />
                                                </IconButton>
                                              </Box>
                                            </Box>
                                          </TaskCard>
                                        )}
                                      </Draggable>
                                    ))
                                  )}
                                  {provided.placeholder}
                                </Box>
                              )}
                            </Droppable>
                          </ColumnContainer>
                        </Box>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </Box>
            )}
          </Droppable>
        </Box>
      </DragDropContext>
      )}

      {/* Edit task dialog */}
      <Dialog open={isDialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>Edit Task</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Task Title"
            value={editTodo?.title || ''}
            onChange={(e) => setEditTodo({ ...editTodo, title: e.target.value })}
            margin="dense"
            required
            id="edit-task-title-input"
            name="edit-task-title"
          />
          <TextField
            fullWidth
            label="Description"
            value={editTodo?.description || ''}
            onChange={(e) => setEditTodo({ ...editTodo, description: e.target.value })}
            margin="dense"
            multiline
            rows={3}
            id="edit-task-description-input"
            name="edit-task-description"
          />
          {/* Status/Column selector */}
          <TextField
            select
            fullWidth
            label="Status"
            value={editTodo?.status || 'todo'}
            onChange={(e) => setEditTodo({ ...editTodo, status: e.target.value })}
            margin="dense"
            id="edit-task-status-select"
            name="edit-task-status"
          >
            {Object.values(columns).map((column) => (
              <MenuItem 
                key={column.id} 
                value={column.id}
                id={`edit-task-status-option-${column.id}`}
                name={`edit-task-status-${column.id}`}
              >
                {column.title}
              </MenuItem>
            ))}
          </TextField>
          {/* Created/Modified times */}
          {editTodo?.created_at && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              Created: {new Date(editTodo.created_at).toLocaleString()}
            </Typography>
          )}
          {editTodo?.updated_at && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Last Modified: {new Date(editTodo.updated_at).toLocaleString()}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCloseDialog}
            id="edit-task-cancel-button"
            name="edit-task-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdateTodo}
            color="primary"
            variant="contained"
            disabled={!editTodo?.title?.trim()}
            id="edit-task-save-button"
            name="edit-task-save"
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add column dialog */}
      <Dialog open={isAddColumnDialogOpen} onClose={() => setIsAddColumnDialogOpen(false)}>
        <DialogTitle>Add New Column</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Column Title"
            value={newColumnTitle}
            onChange={(e) => setNewColumnTitle(e.target.value)}
            margin="dense"
            required
            id="add-column-title-input"
            name="add-column-title"
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setIsAddColumnDialogOpen(false)}
            id="add-column-cancel-button"
            name="add-column-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddColumn}
            color="primary"
            variant="contained"
            disabled={!newColumnTitle.trim()}
            id="add-column-submit-button"
            name="add-column-submit"
          >
            Add Column
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit column dialog */}
      <Dialog open={isEditColumnDialogOpen} onClose={() => setIsEditColumnDialogOpen(false)}>
        <DialogTitle>Edit Column</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Column Title"
            value={activeColumn?.title || ''}
            onChange={(e) => setActiveColumn({ ...activeColumn, title: e.target.value })}
            margin="dense"
            required
            id="edit-column-title-input"
            name="edit-column-title"
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setIsEditColumnDialogOpen(false)}
            id="edit-column-cancel-button"
            name="edit-column-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleRenameColumn}
            color="primary"
            variant="contained"
            disabled={!activeColumn?.title?.trim()}
            id="edit-column-save-button"
            name="edit-column-save"
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Column settings menu */}
      <Menu
        anchorEl={columnSettingsAnchorEl}
        open={Boolean(columnSettingsAnchorEl)}
        onClose={() => setColumnSettingsAnchorEl(null)}
        id="column-settings-menu"
      >
        <MenuItem 
          onClick={handleOpenEditColumnDialog}
          id="rename-column-menu-item"
          name="rename-column"
        >
          Rename Column
        </MenuItem>
        <MenuItem 
          onClick={() => handleDeleteColumn(activeColumn?.id)}
          disabled={activeColumn && columns[activeColumn.id]?.taskIds.length > 0}
          id="delete-column-menu-item"
          name="delete-column"
        >
          Delete Column
        </MenuItem>
        <MenuItem
          onClick={() => handleDeleteAllTasksInColumn(activeColumn?.id)}
          disabled={activeColumn && (!columns[activeColumn.id] || columns[activeColumn.id].taskIds.length === 0)}
          id="delete-all-tasks-menu-item"
          name="delete-all-tasks"
        >
          Delete All Tasks in Column
        </MenuItem>
      </Menu>

      {/* Confirm delete all tasks dialog */}
      <Dialog open={confirmDeleteAllOpen} onClose={() => setConfirmDeleteAllOpen(false)}>
        <DialogTitle>Delete All Tasks in Column?</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete all tasks in this column? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConfirmDeleteAllOpen(false)} 
            color="primary"
            id="confirm-delete-cancel-button"
            name="confirm-delete-cancel"
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmDeleteAllTasks} 
            color="error" 
            variant="contained"
            id="confirm-delete-submit-button"
            name="confirm-delete-submit"
          >
            Delete All
          </Button>
        </DialogActions>
      </Dialog>

      {/* Photo dialog */}
      <Dialog open={photoDialogOpen} onClose={() => setPhotoDialogOpen(false)} maxWidth="xl" fullWidth>
        <DialogContent sx={{ p: 0, bgcolor: 'black', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
          {photoDialogUrl && (
            <>
              <img
                src={photoDialogUrl}
                alt="Full Size"
                style={{
                  maxWidth: '100vw',
                  maxHeight: '100vh',
                  display: 'block',
                  margin: 'auto',
                  background: 'black',
                }}
              />
              <IconButton
                aria-label="Maximize"
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 48,
                  color: 'white',
                  zIndex: 2,
                  background: 'rgba(0,0,0,0.4)',
                  '&:hover': { background: 'rgba(0,0,0,0.7)' }
                }}
                onClick={() => {
                  window.open(photoDialogUrl, '_blank', 'noopener,noreferrer');
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14v6h6"/><path d="M20 10V4h-6"/><path d="M14 20h6v-6"/><path d="M10 4H4v6"/></svg>
              </IconButton>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
}

export default TodoList;
