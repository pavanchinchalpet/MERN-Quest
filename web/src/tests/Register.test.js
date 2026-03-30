import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Register from '../pages/Register';
import { AuthContext } from '../context/AuthContext';

test('renders register page', () => {
  render(
    <AuthContext.Provider value={{ user: null, loading: false, register: jest.fn() }}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Register />
      </BrowserRouter>
    </AuthContext.Provider>
  );

  expect(screen.getByText(/create learner account/i)).toBeInTheDocument();
});
