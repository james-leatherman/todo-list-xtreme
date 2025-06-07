import React from 'react';
import { useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Brightness4Icon from '@mui/icons-material/Brightness4'; // Moon icon for dark mode
import Brightness7Icon from '@mui/icons-material/Brightness7'; // Sun icon for light mode
import { logo } from '../images';

function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const { mode, toggleMode } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
          <IconButton edge="start" color="inherit" aria-label="logo" onClick={() => navigate('/')} sx={{ p: 0, mr: 1 }}>
            <img src={logo} alt="Todo List Xtreme Logo" style={{ height: 40, width: 40, objectFit: 'contain' }} />
          </IconButton>
        </Box>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          Todo List Xtreme
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title={mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
            <IconButton color="inherit" onClick={toggleMode} sx={{ mr: 1 }}>
              {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Tooltip>

          {isAuthenticated ? (
            <>
              <Typography variant="body1" sx={{ mr: 2 }}>
                {user?.name || user?.email}
              </Typography>
              <Button color="inherit" onClick={handleLogout}>Logout</Button>
            </>
          ) : (
            <Button color="inherit" onClick={() => navigate('/login')}>Login</Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Header;
