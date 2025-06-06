import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Button, TextField, List, ListItem,
  ListItemText, Checkbox, IconButton, Card, CardContent, Dialog,
  DialogActions, DialogContent, DialogTitle, Grid, CircularProgress,
  Paper, Tooltip, Divider, Menu, MenuItem, Chip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  PhotoCamera as PhotoCameraIcon,
  Close as CloseIcon,
  MoreVert as MoreVertIcon,
  Add as PlusIcon,
  Settings as SettingsIcon,
  DragIndicator as DragIndicatorIcon
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { todoService } from '../services/api';

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

  // Load columns and fetch todos
  useEffect(() => {
    const savedColumns = localStorage.getItem('todoColumns');
    const savedColumnOrder = localStorage.getItem('todoColumnOrder');
    
    // Check if this is a fresh login (no locally saved columns)
    const isFreshLogin = !savedColumns || !savedColumnOrder;
    
    if (savedColumns && !isFreshLogin) {
      try {
        setColumns(JSON.parse(savedColumns));
      } catch (error) {
        console.error('Error parsing saved columns:', error);
      }
    }
    
    if (savedColumnOrder && !isFreshLogin) {
      try {
        setColumnOrder(JSON.parse(savedColumnOrder));
      } catch (error) {
        console.error('Error parsing saved column order:', error);
      }
    }
    
    // Fetch todos - this will reconstruct columns if needed
    fetchTodos();
    
    // Cleanup function to ensure we don't have dangling animations when component unmounts
    return () => {
      // This empty cleanup function helps React clean up any pending animations
      // from the DnD library when the component unmounts
    };
  }, []);

  // Save columns to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('todoColumns', JSON.stringify(columns));
    localStorage.setItem('todoColumnOrder', JSON.stringify(columnOrder));
  }, [columns, columnOrder]);
  
  // Helper function to ensure columns and columnOrder are in sync
  const validateColumnsState = () => {
    const columnsKeys = Object.keys(columns);
    const validColumnOrder = columnOrder.filter(id => columnsKeys.includes(id));
    
    // If any column IDs were removed, update columnOrder
    if (validColumnOrder.length !== columnOrder.length) {
      setColumnOrder(validColumnOrder);
    }
    
    // Check if all columns in columnOrder exist
    const missingColumnIds = columnsKeys.filter(id => !columnOrder.includes(id));
    
    // If we found columns that aren't in the order, add them
    if (missingColumnIds.length > 0) {
      setColumnOrder(current => [...current, ...missingColumnIds]);
    }
  };

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const response = await todoService.getAll();
      const fetchedTodos = response.data;
      setTodos(fetchedTodos);
      
      // Validate column state before organizing todos
      validateColumnsState();
      
      // Distribute todos into columns
      organizeTodosInColumns(fetchedTodos);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching todos:', err);
      setError('Failed to load todos');
    } finally {
      setLoading(false);
    }
  };
  
  const organizeTodosInColumns = (fetchedTodos) => {
    // Determine if this is the first load after login
    const isFirstLoad = !localStorage.getItem('todoColumns');
    
    // Create a copy of the current columns or initialize with default columns if first load
    const updatedColumns = isFirstLoad 
      ? {
          'todo': { id: 'todo', title: 'To Do', taskIds: [] },
          'inProgress': { id: 'inProgress', title: 'In Progress', taskIds: [] },
          'done': { id: 'done', title: 'Completed', taskIds: [] }
        }
      : { ...columns };
    
    // Create a map for tracking unique column titles (case insensitive)
    const titleMap = new Map();
    
    // Keep track of column status IDs that need to be added to column order
    const newColumnStatuses = [];
    
    // Reset all column taskIds arrays
    Object.keys(updatedColumns).forEach(columnId => {
      if (updatedColumns[columnId]) {
        updatedColumns[columnId].taskIds = [];
        // Store normalized title for later duplicate checking
        const normalizedTitle = updatedColumns[columnId].title.toLowerCase();
        titleMap.set(normalizedTitle, columnId);
      }
    });
    
    // Check for any case-insensitive duplicate columns and fix them
    const normalizedColumns = {};
    const duplicateColumns = {};
    
    // First pass: identify duplicates by ID
    Object.entries(updatedColumns).forEach(([id, column]) => {
      const normId = id.toLowerCase();
      if (normalizedColumns[normId]) {
        if (!duplicateColumns[normId]) {
          duplicateColumns[normId] = [];
        }
        duplicateColumns[normId].push(id);
      } else {
        normalizedColumns[normId] = id;
      }
    });
    
    // Second pass: merge duplicates if any found
    Object.entries(duplicateColumns).forEach(([normId, dupeIds]) => {
      const primaryId = normalizedColumns[normId];
      dupeIds.forEach(dupeId => {
        if (dupeId !== primaryId) {
          // Keep only the first instance and remove others from both columns and columnOrder
          delete updatedColumns[dupeId];
          setColumnOrder(prev => prev.filter(id => id !== dupeId));
        }
      });
    });
    
    // Distribute todos based on status or completion
    fetchedTodos.forEach(todo => {
      // If todo has a status property that matches a column, use it
      const todoStatus = todo.status || (todo.is_completed ? 'done' : 'todo');
      const statusLower = todoStatus.toLowerCase();
      
      // Find an existing column that matches this status, case insensitive
      const matchingColumnId = Object.keys(updatedColumns).find(
        colId => colId.toLowerCase() === statusLower
      );
      
      if (matchingColumnId) {
        // Use the existing column (with its original case)
        updatedColumns[matchingColumnId].taskIds.push(todo.id);
        todo.status = matchingColumnId; // Ensure consistent status naming
      } else {
        // Check if this status might match an existing column title
        const title = todoStatus.charAt(0).toUpperCase() + todoStatus.slice(1).replace(/-/g, ' ');
        const titleLower = title.toLowerCase();
        const existingColumnIdByTitle = titleMap.get(titleLower);
        
        if (existingColumnIdByTitle) {
          // Use the existing column with a matching title
          updatedColumns[existingColumnIdByTitle].taskIds.push(todo.id);
          todo.status = existingColumnIdByTitle; // Ensure consistent status naming
        }
        // Check if we need to create a new column for this status
        else if (todoStatus && todoStatus !== 'todo' && todoStatus !== 'inProgress' && todoStatus !== 'done') {
          // Create a new column for this status
          updatedColumns[todoStatus] = {
            id: todoStatus,
            title: title,
            taskIds: [todo.id]
          };
          
          // Track this title to avoid creating duplicates
          titleMap.set(titleLower, todoStatus);
          
          // Add to our new columns list if not already in column order
          if (!columnOrder.includes(todoStatus) && !newColumnStatuses.includes(todoStatus)) {
            newColumnStatuses.push(todoStatus);
          }
        } else {
          // Fall back to default 'todo' column
          if (updatedColumns['todo']) {
            updatedColumns['todo'].taskIds.push(todo.id);
          } else {
            // Create todo column if it doesn't exist
            updatedColumns['todo'] = {
              id: 'todo',
              title: 'To Do',
              taskIds: [todo.id]
            };
            if (!columnOrder.includes('todo') && !newColumnStatuses.includes('todo')) {
              newColumnStatuses.push('todo');
            }
          }
        }
      }
      
      // Ensure todo has its status stored for future reference
      if (!todo.status) {
        // Update local todo state with correct status
        todo.status = todoStatus;
      }
    });
    
    // Handle column order
    const newColumnOrder = isFirstLoad 
      ? ['todo', 'inProgress', 'done'] 
      : [...columnOrder];
    
    // Add any missing columns to the order
    const missingColumns = Object.keys(updatedColumns).filter(
      colId => !newColumnOrder.includes(colId)
    );
    
    if (missingColumns.length > 0 || newColumnStatuses.length > 0) {
      const allNewColumns = [...missingColumns, ...newColumnStatuses];
      const uniqueNewColumns = Array.from(new Set(allNewColumns));
      setColumnOrder([...newColumnOrder, ...uniqueNewColumns]);
    } else if (isFirstLoad) {
      setColumnOrder(newColumnOrder);
    }
    
    setColumns(updatedColumns);
    
    // Save the cleaned up columns to localStorage
    const updatedColumnOrder = isFirstLoad 
      ? [...newColumnOrder, ...newColumnStatuses] 
      : newColumnStatuses.length > 0 
        ? [...columnOrder, ...newColumnStatuses.filter(id => !columnOrder.includes(id))]
        : columnOrder;
        
    localStorage.setItem('todoColumns', JSON.stringify(updatedColumns));
    localStorage.setItem('todoColumnOrder', JSON.stringify(updatedColumnOrder));
  };

  const handleCreateTodo = async (e, columnId = 'todo', quickAddTitle = null) => {
    if (e) e.preventDefault();
    
    const title = quickAddTitle || newTodoTitle;
    if (!title.trim()) return;

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
      if (columns[columnId].taskIds.includes(taskId)) {
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
      // Moving within the same column
      if (sourceColumn === destColumn) {
        // Create a copy of taskIds to avoid direct state mutation
        const newTaskIds = Array.from(sourceColumn.taskIds || []);
        
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
        const sourceTaskIds = Array.from(sourceColumn.taskIds || []);
        const destTaskIds = Array.from(destColumn.taskIds || []);
        
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
  const handleAddColumn = () => {
    if (!newColumnTitle.trim()) return;
    
    // Convert title to a kebab-case ID to be more consistent with status IDs
    const title = newColumnTitle.trim();
    const columnId = title.toLowerCase().replace(/\s+/g, '-');
    
    // Check if a column with this ID already exists
    if (columns[columnId]) {
      setError(`A column named "${title}" already exists`);
      return;
    }
    
    // Check if a column with this title exists (case insensitive)
    const existingColumnWithSimilarTitle = Object.values(columns).find(
      col => col.title.toLowerCase() === title.toLowerCase()
    );
    
    if (existingColumnWithSimilarTitle) {
      setError(`A column with title "${existingColumnWithSimilarTitle.title}" already exists`);
      return;
    }
    
    // Create the new column
    const newColumn = {
      id: columnId,
      title: title,
      taskIds: []
    };
    
    // Update columns state
    const updatedColumns = {
      ...columns,
      [columnId]: newColumn
    };
    
    // Update state in a batch to avoid race conditions
    setColumns(updatedColumns);
    
    // Add to column order (only if not already in the order)
    if (!columnOrder.includes(columnId)) {
      setColumnOrder(prevOrder => [...prevOrder, columnId]);
    }
    
    // Save to localStorage immediately to prevent duplicates on page refresh
    localStorage.setItem('todoColumns', JSON.stringify({
      ...columns,
      [columnId]: newColumn
    }));
    localStorage.setItem('todoColumnOrder', JSON.stringify(
      columnOrder.includes(columnId) ? columnOrder : [...columnOrder, columnId]
    ));
    
    // Reset form
    setNewColumnTitle('');
    setIsAddColumnDialogOpen(false);
    setError(null);
  };
  
  const handleDeleteColumn = (columnId) => {
    // Don't allow deleting if the column has tasks
    if (columns[columnId].taskIds.length > 0) {
      setError("Cannot delete a column that contains tasks. Move tasks to another column first.");
      return;
    }
    
    // Create a new columns object without the deleted column
    const newColumns = { ...columns };
    delete newColumns[columnId];
    
    // Update column order
    const newColumnOrder = columnOrder.filter(id => id !== columnId);
    
    setColumns(newColumns);
    setColumnOrder(newColumnOrder);
    setColumnSettingsAnchorEl(null);
  };
  
  const handleRenameColumn = () => {
    if (!activeColumn || !activeColumn.title.trim()) return;
    
    // Update the column title
    setColumns({
      ...columns,
      [activeColumn.id]: {
        ...columns[activeColumn.id],
        title: activeColumn.title
      }
    });
    
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
    if (quickAddTaskTitle.trim()) {
      handleCreateTodo(null, columnId, quickAddTaskTitle);
      setQuickAddColumn(null);
      setQuickAddTaskTitle('');
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
        >
          Add Column
        </Button>
      </Box>

      {error && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: (theme) => theme.palette.mode === 'dark' ? '#462c2c' : '#ffebee' }}>
          <Typography color="error">{error}</Typography>
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
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              sx={{ mt: 2 }}
              disabled={!newTodoTitle.trim()}
              size="small"
            >
              Add Task
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Kanban board */}
      <DragDropContext 
        onDragEnd={handleDragEnd}
        onBeforeDragStart={() => setError(null)} // Clear any previous errors
        onDragStart={() => {
          // Validate column state at the start of a drag to ensure consistency
          validateColumnsState();
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          overflowX: 'auto', 
          pb: 2,
          gap: 2,
          minHeight: 'calc(100vh - 350px)'
        }}>
          <Droppable droppableId="all-columns" direction="horizontal" type="column">
            {(provided) => (
              <Box
                ref={provided.innerRef}
                {...provided.droppableProps}
                sx={{
                  display: 'flex',
                  overflowX: 'auto',
                  pb: 2,
                  gap: 2,
                  minHeight: 'calc(100vh - 350px)'
                }}
              >
                {columnOrder.map((columnId, index) => {
                  const column = columns[columnId];
                  const tasksForColumn = column.taskIds.map(taskId =>
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
                                <DragIndicatorIcon sx={{ color: 'text.secondary', mr: 1, opacity: 0.5 }} />
                                <Typography variant="h6" component="h3">
                                  {column.title} ({tasksForColumn.length})
                                </Typography>
                              </Box>

                              <Box>
                                <Tooltip title="Add task to this column">
                                  <IconButton
                                    size="small"
                                    onClick={() => setQuickAddColumn(column.id)}
                                  >
                                    <PlusIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Column settings">
                                  <IconButton
                                    size="small"
                                    onClick={(e) => handleColumnSettingsClick(e, column)}
                                  >
                                    <SettingsIcon fontSize="small" />
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
                                  InputProps={{
                                    endAdornment: (
                                      <IconButton
                                        size="small"
                                        onClick={() => {
                                          setQuickAddColumn(null);
                                          setQuickAddTaskTitle('');
                                        }}
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
                                                            overflow: 'hidden'
                                                          }}
                                                        >
                                                          <img
                                                            src={photo.url}
                                                            alt={photo.filename}
                                                            style={{
                                                              width: '100%',
                                                              height: '100%',
                                                              objectFit: 'cover'
                                                            }}
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
                                                              '&:hover': {
                                                                bgcolor: 'rgba(0, 0, 0, 0.7)'
                                                              },
                                                            }}
                                                            onClick={() => handleDeletePhoto(todo.id, photo.id)}
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
                                              >
                                                Add Photo
                                                <VisuallyHiddenInput
                                                  type="file"
                                                  accept="image/*"
                                                  onChange={(e) => handlePhotoUpload(todo.id, e)}
                                                />
                                              </Button>
                                              <Box>
                                                <IconButton size="small" onClick={() => handleOpenEditDialog(todo)}>
                                                  <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton size="small" onClick={() => handleDeleteTodo(todo.id)}>
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
          />
          <TextField
            fullWidth
            label="Description"
            value={editTodo?.description || ''}
            onChange={(e) => setEditTodo({ ...editTodo, description: e.target.value })}
            margin="dense"
            multiline
            rows={3}
          />
          {/* Status/Column selector */}
          <TextField
            select
            fullWidth
            label="Status"
            value={editTodo?.status || 'todo'}
            onChange={(e) => setEditTodo({ ...editTodo, status: e.target.value })}
            margin="dense"
          >
            {Object.values(columns).map((column) => (
              <MenuItem key={column.id} value={column.id}>
                {column.title}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleUpdateTodo}
            color="primary"
            variant="contained"
            disabled={!editTodo?.title?.trim()}
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
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddColumnDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAddColumn}
            color="primary"
            variant="contained"
            disabled={!newColumnTitle.trim()}
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
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditColumnDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleRenameColumn}
            color="primary"
            variant="contained"
            disabled={!activeColumn?.title?.trim()}
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
      >
        <MenuItem onClick={handleOpenEditColumnDialog}>Rename Column</MenuItem>
        <MenuItem 
          onClick={() => handleDeleteColumn(activeColumn?.id)}
          disabled={activeColumn && columns[activeColumn.id]?.taskIds.length > 0}
        >
          Delete Column
        </MenuItem>
      </Menu>
    </Container>
  );
}

export default TodoList;
