import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';

// Mocking the db for all tests in this file
vi.mock('./db', () => ({
  db: {
    products: {
      toArray: vi.fn().mockResolvedValue([]),
    },
    cart: {
      toArray: vi.fn().mockResolvedValue([]),
    }
  },
}));

describe('App', () => {
  it('renders the bottom navigation bar correctly', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /记账/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /库存/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /订单/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /统计/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /设置/i })).toBeInTheDocument();
  });
});
