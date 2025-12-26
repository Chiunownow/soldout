import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';
import { NotificationProvider } from './NotificationContext';
import { CartProvider } from './CartContext';

// Mocking the db for all tests in this file
vi.mock('./db', () => ({
  db: {
    products: {
      toArray: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0), // Mock count method
    },
    orders: { // Mock orders table as well
      count: vi.fn().mockResolvedValue(0), // Mock count method
    },
    cart: {
      clear: vi.fn().mockResolvedValue(),
      toArray: vi.fn().mockResolvedValue([]),
      bulkAdd: vi.fn().mockResolvedValue(),
    },
    paymentChannels: {
        toArray: vi.fn().mockResolvedValue([]),
    }
  },
}));

describe('App', () => {
  it('renders the bottom navigation bar correctly', () => {
    render(
      <NotificationProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </NotificationProvider>
    );
    expect(screen.getByRole('button', { name: /记账/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /库存/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /订单/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /统计/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /设置/i })).toBeInTheDocument();
  });
});
