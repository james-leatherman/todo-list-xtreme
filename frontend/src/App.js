import React, { useMemo } from 'react';
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
  const { mode, themeName, themes, getActivePalette } = useTheme();
  const themeConfig = themes[themeName] || themes.default;
  const palette = getActivePalette();

  // Always set the palette mode separately from the theme config
  const theme = useMemo(() =>
    createTheme({
      palette: {
        ...palette,
        mode,
      },
    }), [mode, themeName, palette]);

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
