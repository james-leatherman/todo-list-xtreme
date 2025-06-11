import axios from 'axios';
import { tracer } from '../telemetry';

// Create axios instance with base URL from environment variable
// In development, use proxy (empty baseURL), in production use full URL
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || ''
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
  getAll: async () => {
    const span = tracer.startSpan('todoService.getAll');
    try {
      span.setAttributes({
        'operation.name': 'fetch_all_todos',
        'component': 'frontend',
        'service': 'todo-service'
      });
      const result = await api.get('/todos/');
      span.setAttributes({
        'todos.count': result.data.length || 0,
        'http.status_code': result.status
      });
      span.setStatus({ code: 1, message: 'Success' });
      return result;
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: 2, message: error.message });
      throw error;
    } finally {
      span.end();
    }
  },

  // Get a single todo
  getById: async (id) => {
    const span = tracer.startSpan('todoService.getById');
    try {
      span.setAttributes({
        'operation.name': 'fetch_todo_by_id',
        'component': 'frontend',
        'service': 'todo-service',
        'todo.id': id
      });
      const result = await api.get(`/todos/${id}/`);
      span.setAttributes({
        'http.status_code': result.status,
        'todo.title': result.data.title || 'unknown'
      });
      span.setStatus({ code: 1, message: 'Success' });
      return result;
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: 2, message: error.message });
      throw error;
    } finally {
      span.end();
    }
  },

  // Create a new todo
  create: async (todo) => {
    const span = tracer.startSpan('todoService.create');
    try {
      span.setAttributes({
        'operation.name': 'create_todo',
        'component': 'frontend',
        'service': 'todo-service',
        'todo.title': todo.title || 'unknown'
      });
      
      // Ensure we're sending the status field along with the todo
      const todoData = { ...todo };
      if (!todoData.status) {
        todoData.status = todoData.is_completed ? 'done' : 'todo';
      }
      
      const result = await api.post('/todos', todoData);
      span.setAttributes({
        'http.status_code': result.status,
        'todo.created_id': result.data.id
      });
      span.setStatus({ code: 1, message: 'Success' });
      return result;
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: 2, message: error.message });
      throw error;
    } finally {
      span.end();
    }
  },

  // Update a todo
  update: async (id, todo) => {
    const span = tracer.startSpan('todoService.update');
    try {
      span.setAttributes({
        'operation.name': 'update_todo',
        'component': 'frontend',
        'service': 'todo-service',
        'todo.id': id,
        'todo.title': todo.title || 'unknown'
      });
      
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
      
      const result = await api.put(`/todos/${id}/`, todoData);
      span.setAttributes({
        'http.status_code': result.status,
        'todo.status': todoData.status
      });
      span.setStatus({ code: 1, message: 'Success' });
      return result;
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: 2, message: error.message });
      throw error;
    } finally {
      span.end();
    }
  },

  // Delete a todo
  delete: async (id) => {
    const span = tracer.startSpan('todoService.delete');
    try {
      span.setAttributes({
        'operation.name': 'delete_todo',
        'component': 'frontend',
        'service': 'todo-service',
        'todo.id': id
      });
      const result = await api.delete(`/todos/${id}/`);
      span.setAttributes({
        'http.status_code': result.status
      });
      span.setStatus({ code: 1, message: 'Success' });
      return result;
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: 2, message: error.message });
      throw error;
    } finally {
      span.end();
    }
  },

  // Upload a photo to a todo
  uploadPhoto: async (todoId, file) => {
    const span = tracer.startSpan('todoService.uploadPhoto');
    try {
      span.setAttributes({
        'operation.name': 'upload_photo',
        'component': 'frontend',
        'service': 'todo-service',
        'todo.id': todoId,
        'file.size': file.size,
        'file.type': file.type,
        'file.name': file.name
      });
      
      const formData = new FormData();
      formData.append('file', file);
      
      const result = await api.post(`/todos/${todoId}/photos/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      span.setAttributes({
        'http.status_code': result.status,
        'photo.id': result.data.id
      });
      span.setStatus({ code: 1, message: 'Success' });
      return result;
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: 2, message: error.message });
      throw error;
    } finally {
      span.end();
    }
  },

  // Delete a photo from a todo
  deletePhoto: async (todoId, photoId) => {
    const span = tracer.startSpan('todoService.deletePhoto');
    try {
      span.setAttributes({
        'operation.name': 'delete_photo',
        'component': 'frontend',
        'service': 'todo-service',
        'todo.id': todoId,
        'photo.id': photoId
      });
      const result = await api.delete(`/todos/${todoId}/photos/${photoId}/`);
      span.setAttributes({
        'http.status_code': result.status
      });
      span.setStatus({ code: 1, message: 'Success' });
      return result;
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: 2, message: error.message });
      throw error;
    } finally {
      span.end();
    }
  }
};

// Auth service
export const authService = {
  // Get Google OAuth login URL
  getGoogleLoginUrl: () => {
    const span = tracer.startSpan('authService.getGoogleLoginUrl');
    try {
      span.setAttributes({
        'operation.name': 'get_google_login_url',
        'component': 'frontend',
        'service': 'auth-service'
      });
      const result = `/auth/google/login/`;
      span.setStatus({ code: 1, message: 'Success' });
      return result;
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: 2, message: error.message });
      throw error;
    } finally {
      span.end();
    }
  },

  // Get current user
  getCurrentUser: async () => {
    const span = tracer.startSpan('authService.getCurrentUser');
    try {
      span.setAttributes({
        'operation.name': 'get_current_user',
        'component': 'frontend',
        'service': 'auth-service'
      });
      const result = await api.get('/auth/me/');
      span.setAttributes({
        'http.status_code': result.status,
        'user.id': result.data.id,
        'user.email': result.data.email
      });
      span.setStatus({ code: 1, message: 'Success' });
      return result;
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: 2, message: error.message });
      throw error;
    } finally {
      span.end();
    }
  }
};

// Column settings service
export const columnSettingsService = {
  // Get column settings
  getSettings: async () => {
    const span = tracer.startSpan('columnSettingsService.getSettings');
    try {
      span.setAttributes({
        'operation.name': 'get_column_settings',
        'component': 'frontend',
        'service': 'column-settings-service'
      });
      const result = await api.get('/column-settings');
      span.setAttributes({
        'http.status_code': result.status,
        'settings.columns_count': result.data.columns?.length || 0
      });
      span.setStatus({ code: 1, message: 'Success' });
      return result;
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: 2, message: error.message });
      throw error;
    } finally {
      span.end();
    }
  },

  // Create column settings
  createSettings: async (settings) => {
    const span = tracer.startSpan('columnSettingsService.createSettings');
    try {
      span.setAttributes({
        'operation.name': 'create_column_settings',
        'component': 'frontend',
        'service': 'column-settings-service',
        'settings.columns_count': settings.columns?.length || 0
      });
      const result = await api.post('/column-settings', settings);
      span.setAttributes({
        'http.status_code': result.status,
        'settings.id': result.data.id
      });
      span.setStatus({ code: 1, message: 'Success' });
      return result;
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: 2, message: error.message });
      throw error;
    } finally {
      span.end();
    }
  },

  // Update column settings
  updateSettings: async (settings) => {
    const span = tracer.startSpan('columnSettingsService.updateSettings');
    try {
      span.setAttributes({
        'operation.name': 'update_column_settings',
        'component': 'frontend',
        'service': 'column-settings-service',
        'settings.columns_count': settings.columns?.length || 0
      });
      const result = await api.put('/column-settings', settings);
      span.setAttributes({
        'http.status_code': result.status
      });
      span.setStatus({ code: 1, message: 'Success' });
      return result;
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: 2, message: error.message });
      throw error;
    } finally {
      span.end();
    }
  }
};

export default api;
