// This script helps to set up a test token in localStorage
// You can run this in your browser's console

const setTestToken = () => {
  // The JWT token we got from backend create_test_user.py
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZXhwIjoxNzQ5MTcyMzExfQ.Xwo6PVcoIgchrd3rWlBDKMWofs18yx0QUqzX0CSefLE';
  localStorage.setItem('token', token);
  console.log('Test token has been set in localStorage.');
  console.log('You can now refresh the page to log in as the test user.');
}

// Run the function
setTestToken();
