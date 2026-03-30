import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../pages/Login';
import { AuthContext } from '../context/AuthContext';

test('renders login page', () => {
  render(
    <AuthContext.Provider value={{ user: null, loading: false, login: jest.fn() }}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Login />
      </BrowserRouter>
    </AuthContext.Provider>
  );

  expect(screen.getByText(/access dashboard/i)).toBeInTheDocument();
});
