import "@testing-library/jest-dom";

jest.mock("axios", () => ({
  get: jest.fn(),
  post: jest.fn(),
}));