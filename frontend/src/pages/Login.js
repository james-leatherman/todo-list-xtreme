import React from 'react';
import { 
  Button, Container, Paper, Typography, Box 
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  useAuth();
  
  const handleGoogleLogin = () => {
    // Redirect to backend endpoint that handles Google OAuth
    window.location.href = `${process.env.REACT_APP_API_URL}/auth/google/login`;
  };

  // Update the handleDevLogin function with the new token
  const handleDevLogin = () => {
    // Use the newly generated token
    const testToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZXhwIjoxNzgwNjU4ODE4fQ.LTQHkvhqBWpFxR7SC9nrOz0mVp9-xEhbr69m6WwHZqs";
    
    localStorage.setItem('token', testToken);
    window.location.href = '/';
  };

  return (
    <Container maxWidth="sm">
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
