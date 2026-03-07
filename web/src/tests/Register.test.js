import { render, screen } from "@testing-library/react";
import Register from "../pages/Register";
import { BrowserRouter } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const mockAuth = {
  user: null,
  loading: false,
  register: jest.fn(() => Promise.resolve({ success: true })),
  error: null,
  setError: jest.fn()
};

test("renders register page", () => {
  render(
    <AuthContext.Provider value={mockAuth}>
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    </AuthContext.Provider>
  );

  expect(screen.getByText(/create account/i)).toBeInTheDocument();
});