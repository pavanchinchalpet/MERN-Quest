import { render, screen } from "@testing-library/react";
import Login from "../pages/Login";
import { BrowserRouter } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const mockAuth = {
  user: null,
  loading: false,
  login: jest.fn(() => Promise.resolve({ success: true })),
  sendOTP: jest.fn(() => Promise.resolve({ success: true })),
  verifyOTP: jest.fn(() => Promise.resolve({ success: true })),
  error: null,
  setError: jest.fn()
};

test("renders login page", () => {
  render(
    <AuthContext.Provider value={mockAuth}>
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    </AuthContext.Provider>
  );

  expect(screen.getByText(/sign in/i)).toBeInTheDocument();
});