import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Button, TextField, List, ListItem,
  ListItemText, Checkbox, IconButton, Card, CardContent, Dialog,
  DialogActions, DialogContent, DialogTitle, Grid, CircularProgress,
  Paper
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  PhotoCamera as PhotoCameraIcon,
  Close as CloseIcon
} from '@mui/icons-material';
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

function TodoList() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newTodoDescription, setNewTodoDescription] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editTodo, setEditTodo] = useState(null);
  const [photoLoading, setPhotoLoading] = useState(false);

  // Fetch todos on component mount
  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const response = await todoService.getAll();
      setTodos(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching todos:', err);
      setError('Failed to load todos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTodo = async (e) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;

    try {
      const response = await todoService.create({
        title: newTodoTitle.trim(),
        description: newTodoDescription.trim(),
        is_completed: false,
      });
      setTodos([...todos, response.data]);
      setNewTodoTitle('');
      setNewTodoDescription('');
    } catch (err) {
      console.error('Error creating todo:', err);
      setError('Failed to create todo');
    }
  };

  const handleToggleComplete = async (id, isCompleted) => {
    try {
      const response = await todoService.update(id, {
        is_completed: !isCompleted,
      });
      setTodos(todos.map(todo => todo.id === id ? response.data : todo));
    } catch (err) {
      console.error('Error updating todo:', err);
      setError('Failed to update todo');
    }
  };

  const handleDeleteTodo = async (id) => {
    try {
      await todoService.delete(id);
      setTodos(todos.filter(todo => todo.id !== id));
    } catch (err) {
      console.error('Error deleting todo:', err);
      setError('Failed to delete todo');
    }
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
      const response = await todoService.update(editTodo.id, {
        title: editTodo.title.trim(),
        description: editTodo.description ? editTodo.description.trim() : '',
      });
      setTodos(todos.map(todo => todo.id === editTodo.id ? response.data : todo));
      handleCloseDialog();
    } catch (err) {
      console.error('Error updating todo:', err);
      setError('Failed to update todo');
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

  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        My Tasks
      </Typography>

      {error && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: '#ffebee' }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      {/* Add new todo form */}
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
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              sx={{ mt: 2 }}
              disabled={!newTodoTitle.trim()}
            >
              Add Task
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Todo list */}
      <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
        {todos.length === 0 ? (
          <Typography sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
            No tasks yet. Add a new task to get started!
          </Typography>
        ) : (
          todos.map((todo) => (
            <Paper key={todo.id} sx={{ mb: 2, overflow: 'hidden' }}>
              <ListItem
                disablePadding
                sx={{
                  p: 2,
                  bgcolor: todo.is_completed ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                }}
                secondaryAction={
                  <Box className="task-actions">
                    <IconButton edge="end" onClick={() => handleOpenEditDialog(todo)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton edge="end" onClick={() => handleDeleteTodo(todo.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemText
                  primary={
                    <Box className="task-title">
                      <Checkbox
                        checked={todo.is_completed}
                        onChange={() => handleToggleComplete(todo.id, todo.is_completed)}
                        color="primary"
                      />
                      <Typography
                        variant="h6"
                        component="span"
                        sx={{
                          textDecoration: todo.is_completed ? 'line-through' : 'none',
                          color: todo.is_completed ? 'text.secondary' : 'text.primary',
                        }}
                      >
                        {todo.title}
                      </Typography>
                    </Box>
                  }
                  secondary={todo.description}
                />
              </ListItem>

              {/* Photos section */}
              {todo.photos && todo.photos.length > 0 && (
                <Box sx={{ p: 2, pt: 0 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1, mb: 1 }}>
                    Photos:
                  </Typography>
                  <div className="photo-container">
                    {todo.photos.map((photo) => (
                      <div key={photo.id} style={{ position: 'relative' }}>
                        <img src={photo.url} alt={photo.filename} className="todo-photo" />
                        <IconButton
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            bgcolor: 'rgba(255, 255, 255, 0.7)',
                            '&:hover': {
                              bgcolor: 'rgba(255, 255, 255, 0.9)',
                            },
                          }}
                          onClick={() => handleDeletePhoto(todo.id, photo.id)}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </div>
                    ))}
                  </div>
                </Box>
              )}

              {/* Photo upload button */}
              <Box sx={{ p: 2, pt: 0 }}>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<PhotoCameraIcon />}
                  className="photo-upload-button"
                  disabled={photoLoading}
                >
                  Add Photo
                  <VisuallyHiddenInput
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload(todo.id, e)}
                  />
                </Button>
                {photoLoading && (
                  <CircularProgress size={24} sx={{ ml: 2 }} />
                )}
              </Box>
            </Paper>
          ))
        )}
      </List>

      {/* Edit todo dialog */}
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
    </Container>
  );
}

export default TodoList;
