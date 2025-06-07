import React, { useMemo, useEffect } from 'react';
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
      typography: themeConfig.typography || {},
    }), [mode, palette, themeConfig.typography]);

  // Set body class for retro theme
  useEffect(() => {
    const body = document.body;
    body.classList.remove('tlx-retro90s-light', 'tlx-retro90s-dark', 'tlx-retro80s-light', 'tlx-retro80s-dark');
    if (themeName === 'retro90s') {
      body.classList.add(`tlx-retro90s-${mode}`);
    } else if (themeName === 'retro80s') {
      body.classList.add(`tlx-retro80s-${mode}`);
    }
    // Optionally, remove on cleanup
    return () => {
      body.classList.remove('tlx-retro90s-light', 'tlx-retro90s-dark', 'tlx-retro80s-light', 'tlx-retro80s-dark');
    };
  }, [themeName, mode]);

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
