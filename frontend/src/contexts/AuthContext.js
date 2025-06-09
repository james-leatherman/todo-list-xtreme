import React, { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Verify token and get user info
        const decoded = jwtDecode(token);
        
        // Check if token is expired
        const currentTime = Date.now() / 1000;
        if (decoded.exp < currentTime) {
          // Token expired, logout
          logout();
        } else {
          // Set authorization header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Get user info
          axios.get('/auth/me')
            .then(response => {
              setUser(response.data);
            })
            .catch(() => {
              // If API call fails, logout
              logout();
            })
            .finally(() => {
              setLoading(false);
            });
        }
      } catch (error) {
        // Invalid token, logout
        logout();
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token) => {
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Get user info
    return axios.get('/auth/me')
      .then(response => {
        setUser(response.data);
        return response.data;
      });
  };

  const logout = async () => {
    // Clear user data first
    setUser(null);
    
    // Remove auth header from axios
    delete axios.defaults.headers.common['Authorization'];
    
    // Clear auth token from localStorage
    localStorage.removeItem('token');
    
    // Don't remove column data from localStorage to ensure persistence across sessions
    
    // Return a promise that resolves when cleanup is complete
    return Promise.resolve();
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
