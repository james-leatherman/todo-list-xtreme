import axios from 'axios';

// Create axios instance with base URL from environment variable
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000'
});

// Add a request interceptor to include token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Todo service
export const todoService = {
  // Get all todos
  getAll: () => {
    return api.get('/todos/');
  },

  // Get a single todo
  getById: (id) => {
    return api.get(`/todos/${id}/`);
  },

  // Create a new todo
  create: (todo) => {
    // Ensure we're sending the status field along with the todo
    const todoData = { ...todo };
    if (!todoData.status) {
      todoData.status = todoData.is_completed ? 'done' : 'todo';
    }
    return api.post('/todos', todoData);
  },

  // Update a todo
  update: (id, todo) => {
    // Ensure we're sending the status field along with the todo
    const todoData = { ...todo };
    if (!todoData.status) {
      todoData.status = todoData.is_completed ? 'done' : 'todo';
    }
    
    // When updating status, also update is_completed appropriately
    if (todoData.status === 'done' && todoData.is_completed === undefined) {
      todoData.is_completed = true;
    } else if (todoData.status && todoData.status !== 'done' && todoData.is_completed === undefined) {
      todoData.is_completed = false;
    }
    
    return api.put(`/todos/${id}/`, todoData);
  },

  // Delete a todo
  delete: (id) => {
    return api.delete(`/todos/${id}/`);
  },

  // Upload a photo to a todo
  uploadPhoto: (todoId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post(`/todos/${todoId}/photos/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  // Delete a photo from a todo
  deletePhoto: (todoId, photoId) => {
    return api.delete(`/todos/${todoId}/photos/${photoId}/`);
  }
};

// Auth service
export const authService = {
  // Get Google OAuth login URL
  getGoogleLoginUrl: () => {
    return `/auth/google/login/`;
  },

  // Get current user
  getCurrentUser: () => {
    return api.get('/auth/me/');
  }
};

// Column settings service
export const columnSettingsService = {
  // Get column settings
  getSettings: () => {
    return api.get('/column-settings');
  },

  // Create column settings
  createSettings: (settings) => {
    return api.post('/column-settings', settings);
  },

  // Update column settings
  updateSettings: (settings) => {
    return api.put('/column-settings', settings);
  }
};

export default api;
