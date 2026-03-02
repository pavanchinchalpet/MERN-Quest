import { render, screen } from "@testing-library/react";

function Hello({ name }) {
  return <h1>Hello {name}</h1>;
}

test("renders greeting", () => {
  render(<Hello name="Pavan" />);
  expect(screen.getByText("Hello Pavan")).toBeInTheDocument();
});