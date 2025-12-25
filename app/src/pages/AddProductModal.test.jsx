import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AddProductModal from './AddProductModal';
import { db } from '../db';

// Mock the db.products.add method
vi.mock('../db', () => ({
  db: {
    products: {
      add: vi.fn(),
    },
  },
}));

describe('AddProductModal', () => {
  const handleClose = vi.fn();

  it('renders correctly when visible', () => {
    render(<AddProductModal visible={true} onClose={handleClose} />);
    expect(screen.getByText('添加新产品')).toBeInTheDocument();
  });

  it('allows adding a sub-attribute field when the button is clicked', async () => {
    render(<AddProductModal visible={true} onClose={handleClose} />);
    
    const addAttributeButton = screen.getByText('添加子属性');
    expect(addAttributeButton).toBeInTheDocument();

    // Before clicking, there are no inputs for sub-attributes
    expect(screen.queryByPlaceholderText('属性名称 (如: 颜色)')).not.toBeInTheDocument();

    // Click the button to add a new sub-attribute field
    fireEvent.click(addAttributeButton);

    // After clicking, the new input fields for the sub-attribute should appear
    // Use await findBy... because the DOM update might be asynchronous
    const keyInput = await screen.findByPlaceholderText('属性名称 (如: 颜色)');
    const valueInput = await screen.findByPlaceholderText('属性值 (如: 红色)');

    expect(keyInput).toBeInTheDocument();
    expect(valueInput).toBeInTheDocument();
  });
});
