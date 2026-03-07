import { render, screen } from "@testing-library/react";
import Quiz from "../pages/Quiz";
import { AuthProvider } from "../context/AuthContext";

test("renders quiz page", () => {
  render(
    <AuthProvider>
      <Quiz />
    </AuthProvider>
  );

  expect(screen.getByText(/quiz/i)).toBeInTheDocument();
});