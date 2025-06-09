import React, { useState } from 'react';
import { 
  Button, Container, Paper, Typography, Box, Alert, Snackbar 
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [error, setError] = useState('');
  useAuth();
  
  const handleGoogleLogin = () => {
    // Redirect to backend endpoint that handles Google OAuth
    window.location.href = `${process.env.REACT_APP_API_URL}/auth/google/login`;
  };

  const handleDevLogin = () => {
    const testToken = process.env.REACT_APP_TEST_TOKEN;
    if (!testToken) {
      const errorMessage = 'Development token not found. Please run ./scripts/generate-test-token.sh from the project root and restart the development server.';
      console.error(errorMessage);
      setError(errorMessage);
      return;
    }
    
    localStorage.setItem('token', testToken);
    window.location.href = '/';
  };

  return (
    <Container maxWidth="sm">
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setError('')} sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
      
      <Box sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" align="center" gutterBottom>
            Todo List Xtreme
          </Typography>
          <Typography variant="body1" align="center" paragraph>
            Sign in to manage your tasks
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<GoogleIcon />}
              fullWidth
              onClick={handleGoogleLogin}
              id="google-signin-button"
              name="google-signin"
            >
              Sign in with Google
            </Button>
            
            {process.env.NODE_ENV === 'development' && (
              <Button
                variant="outlined"
                color="secondary"
                fullWidth
                onClick={handleDevLogin}
                id="dev-login-button"
                name="dev-login"
              >
                Dev: Use Test Account
              </Button>
            )}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
