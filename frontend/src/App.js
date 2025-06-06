import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Pages
import Login from './pages/Login';
import TodoList from './pages/TodoList';
import AuthCallback from './pages/AuthCallback';

// Components
import Header from './components/Header';

// Contexts
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

function AppContent() {
  const { mode } = useTheme();

  // Create a theme instance based on the current mode
  const theme = useMemo(() => 
    createTheme({
      palette: {
        mode,
        primary: {
          main: mode === 'dark' ? '#7986cb' : '#3f51b5', // Lighter blue in dark mode
        },
        secondary: {
          main: mode === 'dark' ? '#ff4081' : '#f50057', // Brighter pink in dark mode
        },
        background: {
          default: mode === 'dark' ? '#121212' : '#fafafa',
          paper: mode === 'dark' ? '#1e1e1e' : '#fff',
        },
      },
    }), [mode]);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Header />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route
              path="/"
              element={
                <RequireAuth>
                  <TodoList />
                </RequireAuth>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </MuiThemeProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

// Authentication wrapper component
function RequireAuth({ children }) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

export default App;
