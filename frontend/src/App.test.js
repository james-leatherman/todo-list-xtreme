// Basic smoke test for React app
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Todo List Xtreme header', () => {
  render(<App />);
  const headers = screen.getAllByText(/todo list xtreme/i);
  expect(headers.length).toBeGreaterThan(0);
});
