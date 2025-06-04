import axios from 'axios';

// Configure axios
axios.defaults.baseURL = process.env.REACT_APP_API_URL || '';

// Set up token if exists
const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Todo service
export const todoService = {
  // Get all todos
  getAll: () => {
    return axios.get('/todos');
  },

  // Get a single todo
  getById: (id) => {
    return axios.get(`/todos/${id}`);
  },

  // Create a new todo
  create: (todo) => {
    return axios.post('/todos', todo);
  },

  // Update a todo
  update: (id, todo) => {
    return axios.put(`/todos/${id}`, todo);
  },

  // Delete a todo
  delete: (id) => {
    return axios.delete(`/todos/${id}`);
  },

  // Upload a photo to a todo
  uploadPhoto: (todoId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return axios.post(`/todos/${todoId}/photos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  // Delete a photo from a todo
  deletePhoto: (todoId, photoId) => {
    return axios.delete(`/todos/${todoId}/photos/${photoId}`);
  }
};

// Auth service
export const authService = {
  // Get Google OAuth login URL
  getGoogleLoginUrl: () => {
    return `/auth/google/login`;
  },

  // Get current user
  getCurrentUser: () => {
    return axios.get('/auth/me');
  }
};
