import React, { createContext, useState, useEffect, useContext } from 'react';

// Patch window.matchMedia for Jest/jsdom tests
if (typeof window !== 'undefined' && process.env.JEST_WORKER_ID !== undefined && !window.matchMedia) {
  window.matchMedia = function() {
    return {
      matches: false,
      media: '',
      onchange: null,
      addListener: function() {}, // deprecated
      removeListener: function() {}, // deprecated
      addEventListener: function() {},
      removeEventListener: function() {},
      dispatchEvent: function() {},
    };
  };
}

const ThemeContext = createContext(null);

export function useTheme() {
  return useContext(ThemeContext);
}

// Define available themes
const THEMES = {
  default: {
    name: 'Default Theme',
    palette: {
      light: {
        primary: { main: '#3f51b5' },
        secondary: { main: '#f50057' },
        background: { default: '#fafafa', paper: '#fff' },
      },
      dark: {
        primary: { main: '#7986cb' },
        secondary: { main: '#ff4081' },
        background: { default: '#121212', paper: '#1e1e1e' },
      },
    },
  },
  retro90s: {
    name: 'TLX Retro 90s',
    palette: {
      light: {
        primary: { main: '#00BFFF' }, // Vivid Sky Blue
        secondary: { main: '#FF69B4' }, // Hot Pink
        accent: { main: '#FFD700' }, // Bright Yellow
        background: { default: '#F5F5F5', paper: '#FFFFFF' },
        success: { main: '#39FF14' }, // Neon Green
        warning: { main: '#FFB347' },
        error: { main: '#FF1744' },
        text: { primary: '#23272A', secondary: '#23272A' },
        card: { main: '#FFFFFF' },
      },
      dark: {
        primary: { main: '#00BFFF' },
        secondary: { main: '#FF69B4' },
        accent: { main: '#FFD700' },
        background: { default: '#23272A', paper: '#2C2F33' },
        success: { main: '#39FF14' },
        warning: { main: '#FFB347' },
        error: { main: '#FF1744' },
        text: { primary: '#F5F5F5', secondary: '#F5F5F5' },
        card: { main: '#2C2F33' },
      },
    },
    typography: {
      fontFamily: `'Trebuchet MS', 'Montserrat', 'Verdana', sans-serif`,
      fontFamilyHeading: `'Permanent Marker', 'Orbitron', 'Arial Black', sans-serif`,
    },
    // Optionally, add custom CSS for geometric shapes, neon glows, etc. in index.css
  },
  // Add more themes here if needed
};

export function ThemeProvider({ children }) {
  // Check if the user has a theme preference in localStorage
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('themeMode');
    // Check for system preference if no saved preference
    if (!savedMode) {
      const prefersDarkMode = typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : false;
      return prefersDarkMode ? 'dark' : 'light';
    }
    return savedMode;
  });

  // Toggle between light and dark mode
  const toggleMode = () => {
    setMode((prevMode) => {
      const newMode = prevMode === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', newMode);
      return newMode;
    });
  };

  const [themeName, setThemeName] = useState(() => localStorage.getItem('themeName') || 'default');

  // Theme selection
  const selectTheme = (name) => {
    setThemeName(name);
    localStorage.setItem('themeName', name);
  };

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (!localStorage.getItem('themeMode')) {
        setMode(mediaQuery.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const getActivePalette = () => {
    const theme = THEMES[themeName] || THEMES.default;
    return theme.palette[mode] || theme.palette.light;
  };

  const value = {
    mode,
    toggleMode,
    isDarkMode: mode === 'dark',
    themeName,
    selectTheme,
    themes: THEMES,
    getActivePalette,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
