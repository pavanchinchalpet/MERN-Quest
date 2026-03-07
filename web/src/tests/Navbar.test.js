import { render, screen } from "@testing-library/react";
import Navbar from "../components/Navbar";
import { AuthProvider } from "../context/AuthContext";

test("renders navbar", () => {
  render(
    <AuthProvider>
      <Navbar />
    </AuthProvider>
  );

  expect(screen.getByText(/quiz/i)).toBeInTheDocument();
});