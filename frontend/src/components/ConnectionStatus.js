import React, { useState, useEffect } from 'react';
import { Chip, Box } from '@mui/material';
import { columnSettingsService } from '../services/api';

/**
 * ConnectionStatus - Shows the current connection status to the backend
 */
function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const [lastChecked, setLastChecked] = useState(new Date());

  useEffect(() => {
    const checkConnection = async () => {
      try {
        await columnSettingsService.getSettings();
        setIsConnected(true);
      } catch (error) {
        console.log('Connection check failed:', error.message);
        if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
          setIsConnected(false);
        }
      }
      setLastChecked(new Date());
    };

    // Check connection immediately
    checkConnection();

    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);

    return () => clearInterval(interval);
  }, []);

  if (isConnected) {
    return null; // Don't show anything when connected
  }

  return (
    <Box sx={{ position: 'fixed', top: 16, right: 16, zIndex: 1300 }}>
      <Chip
        label="Backend Disconnected"
        color="error"
        variant="filled"
        size="small"
        sx={{ 
          animation: 'pulse 2s infinite',
          '@keyframes pulse': {
            '0%': { opacity: 1 },
            '50%': { opacity: 0.7 },
            '100%': { opacity: 1 }
          }
        }}
      />
    </Box>
  );
}

export default ConnectionStatus;
