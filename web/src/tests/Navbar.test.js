import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { AuthContext } from '../context/AuthContext';

test('renders navbar links', () => {
  render(
    <AuthContext.Provider value={{ user: { username: 'Pavan', role: 'user' }, logout: jest.fn() }}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Navbar />
      </BrowserRouter>
    </AuthContext.Provider>
  );

  expect(screen.getByText(/quiz center/i)).toBeInTheDocument();
});
