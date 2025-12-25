import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AddProductModal from './AddProductModal';
import { db } from '../db';

vi.mock('../db', () => ({
  db: {
    products: {
      add: vi.fn(),
    },
  },
}));

describe('AddProductModal with MUI', () => {
  const handleClose = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<AddProductModal open={true} onClose={handleClose} />);
    expect(screen.getByText('添加新产品')).toBeInTheDocument();
  });

  it('submits all form data correctly', async () => {
    render(<AddProductModal open={true} onClose={handleClose} />);

    // Fill in basic fields
    fireEvent.change(screen.getByLabelText('产品名称'), { target: { value: 'Full Product' } });
    fireEvent.change(screen.getByLabelText('销售价格'), { target: { value: '150' } });
    fireEvent.change(screen.getByLabelText('初始库存'), { target: { value: '200' } });
    fireEvent.change(screen.getByLabelText('文字描述'), { target: { value: 'Full description' } });

    // Add and fill a sub-attribute
    fireEvent.click(screen.getByRole('button', { name: /添加子属性/i }));
    await screen.findByLabelText('属性名称');
    fireEvent.change(screen.getByLabelText('属性名称'), { target: { value: 'Color' } });
    fireEvent.change(screen.getByLabelText('属性值'), { target: { value: 'Blue' } });
    
    // Click submit
    fireEvent.click(screen.getByRole('button', { name: '提交' }));

    // Assertions
    await waitFor(() => {
      expect(db.products.add).toHaveBeenCalledTimes(1);
      expect(db.products.add).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Full Product',
        price: 150,
        stock: 200,
        description: 'Full description',
        attributes: [{ key: 'Color', value: 'Blue' }],
      }));
    });

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('allows adding and removing sub-attribute fields', async () => {
    render(<AddProductModal open={true} onClose={handleClose} />);
    
    const addAttributeButton = screen.getByRole('button', { name: /添加子属性/i });
    fireEvent.click(addAttributeButton);

    let keyInput = await screen.findByLabelText('属性名称');
    expect(keyInput).toBeInTheDocument();

    const removeButton = screen.getByTestId('remove-attribute-btn-0');
    fireEvent.click(removeButton);

    expect(screen.queryByLabelText('属性名称')).not.toBeInTheDocument();
  });
});
