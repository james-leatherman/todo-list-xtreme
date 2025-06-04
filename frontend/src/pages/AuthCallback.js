import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, CircularProgress, Typography, Box } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [error, setError] = React.useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        
        if (!token) {
          throw new Error('No token received');
        }
        
        // Login with token
        await login(token);
        
        // Redirect to home page
        navigate('/');
      } catch (error) {
        console.error('Authentication error:', error);
        setError('Authentication failed. Please try again.');
      }
    };
    
    handleCallback();
  }, [location, login, navigate]);

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 10, textAlign: 'center' }}>
        <Typography color="error" variant="h6" component="h2">
          {error}
        </Typography>
        <Box mt={2}>
          <Typography>
            <a href="/login">Back to login</a>
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 10, textAlign: 'center' }}>
      <CircularProgress size={60} />
      <Typography variant="h6" component="h2" sx={{ mt: 2 }}>
        Authenticating...
      </Typography>
    </Container>
  );
}

export default AuthCallback;
