import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the tab bar correctly', () => {
    render(<App />);
    // Use a more specific and accessible query to target the tab
    expect(screen.getByRole('tab', { name: /记账/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /库存/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /订单/i })).toBeInTheDocument();
  });
});
