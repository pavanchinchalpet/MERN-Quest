import { render, screen } from '@testing-library/react';
import Quiz from '../pages/Quiz';
import api from '../services/api';

jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn()
  },
  unwrapResponse: (response) => response?.data?.data ?? response?.data,
  getErrorMessage: () => 'error'
}));

test('renders quiz catalog', async () => {
  api.get
    .mockResolvedValueOnce({ data: { data: [{ id: 1, title: 'React' }] } })
    .mockResolvedValueOnce({ data: { data: [{ id: 1, category_id: 1, question_text: 'Q', options: ['A', 'B'] }] } });

  render(<Quiz />);

  expect(await screen.findByText(/practice the mern stack/i)).toBeInTheDocument();
});
