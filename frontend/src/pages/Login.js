import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Paper, Typography, Button, Box } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { authService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function Login() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleGoogleLogin = () => {
    window.location.href = authService.getGoogleLoginUrl();
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 10 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome to Todo List Xtreme
        </Typography>
        
        <Typography variant="body1" color="textSecondary" paragraph>
          Manage your tasks and add photos to keep track of your progress.
        </Typography>
        
        <Box sx={{ mt: 4 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleLogin}
            fullWidth
          >
            Sign in with Google
          </Button>
          
          {/* Development Testing Button */}
          {process.env.NODE_ENV === 'development' && (
            <Button
              variant="outlined"
              color="secondary"
              size="medium"
              onClick={() => {
                const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZXhwIjoxNzQ5MTcyMzExfQ.Xwo6PVcoIgchrd3rWlBDKMWofs18yx0QUqzX0CSefLE';
                localStorage.setItem('token', token);
                window.location.reload();
              }}
              sx={{ mt: 2 }}
              fullWidth
            >
              Dev: Use Test Account
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
}

export default Login;
