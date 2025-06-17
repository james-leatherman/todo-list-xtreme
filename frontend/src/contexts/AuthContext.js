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
    // Check for token in URL parameters (from OAuth callback)
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    
    if (urlToken) {
      // Token from OAuth callback, store it and clear URL
      localStorage.setItem('token', urlToken);
      // Clear the token from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
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
          axios.get('/api/v1/auth/me')
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
    return axios.get('/api/v1/auth/me')
      .then(response => {
        setUser(response.data);
        return response.data;
      });
  };

  const logout = () => {
    localStorage.removeItem('token');
    // Don't remove column data from localStorage to ensure persistence across sessions
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
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
