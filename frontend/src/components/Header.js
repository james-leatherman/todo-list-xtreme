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
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import PaletteIcon from '@mui/icons-material/Palette';
import tlxLogo80s from '../images/tlx-logo-80s.png';

// List of 90s-style descriptors (user-supplied)
const ORGANIZER_DESCRIPTORS = [
  'Phat',
  'Bomb',
  'Fly',
  'Dope',
  'All That',
  'Tight',
  'Fresh',
  'Sweet',
  'Rad',
  "Bangin'",
  'Off the hook',
  "Slammin'",
  'Wicked',
  'Hype',
  'Booyah',
  'Legit'
];

function getRandomDescriptor() {
  return ORGANIZER_DESCRIPTORS[Math.floor(Math.random() * ORGANIZER_DESCRIPTORS.length)];
}

function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const { mode, toggleMode, themeName, selectTheme, themes } = useTheme();
  const [themeMenuAnchorEl, setThemeMenuAnchorEl] = React.useState(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleThemeMenuOpen = (event) => {
    setThemeMenuAnchorEl(event.currentTarget);
  };
  const handleThemeMenuClose = () => {
    setThemeMenuAnchorEl(null);
  };
  const handleThemeSelect = (name) => {
    selectTheme(name);
    setThemeMenuAnchorEl(null);
  };

  // Memoize so it doesn't change on every render
  const descriptor = React.useMemo(() => getRandomDescriptor(), []);

  return (
    <AppBar position="static">
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
          <IconButton edge="start" color="inherit" aria-label="logo" onClick={() => navigate('/')} sx={{ p: 0, mr: 1 }}>
            <img
              src={themeName === 'retro80s' ? tlxLogo80s : logo}
              alt="Todo List Xtreme Logo"
              style={{ height: 100, width: 100, objectFit: 'fill' }}
            />
          </IconButton>
        </Box>
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          {/* Jazz cup image for retro90s theme only */}
          {themeName === 'retro90s' && (
            <img
              src={require('../images/jazz-cup.png')}
              alt="90s Jazz Cup Design"
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                height: 60,
                opacity: 0.7,
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />
          )}
          <Typography variant="h6" component="div" sx={{ fontStyle: 'italic', zIndex: 1, position: 'relative' }}>
            {`Your ${descriptor} Organizer`}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* Theme selection button */}
          <Tooltip title="Select Theme">
            <IconButton color="inherit" onClick={handleThemeMenuOpen} sx={{ mr: 1 }}>
              <PaletteIcon />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={themeMenuAnchorEl}
            open={Boolean(themeMenuAnchorEl)}
            onClose={handleThemeMenuClose}
          >
            {Object.entries(themes).map(([key, theme]) => (
              <MenuItem
                key={key}
                selected={themeName === key}
                onClick={() => handleThemeSelect(key)}
              >
                {theme.name}
              </MenuItem>
            ))}
          </Menu>
          {/* Dark/Light mode button */}
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
