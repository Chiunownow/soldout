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

vi.mock('antd-mobile', async (importOriginal) => {
  const antd = await importOriginal();
  return {
    ...antd,
    Toast: {
      show: vi.fn(),
    },
  };
});

describe('AddProductModal with Full Manual Form', () => {
  const handleClose = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<AddProductModal visible={true} onClose={handleClose} />);
    expect(screen.getByText('添加新产品')).toBeInTheDocument();
  });

  it('submits all form data correctly', async () => {
    render(<AddProductModal visible={true} onClose={handleClose} />);

    // Fill in basic fields
    fireEvent.change(screen.getByPlaceholderText('例如：T恤'), { target: { value: 'Full Product' } });
    fireEvent.change(screen.getByPlaceholderText('例如：99.00'), { target: { value: '150' } });
    fireEvent.change(screen.getByPlaceholderText('例如：100'), { target: { value: '200' } });
    fireEvent.change(screen.getByPlaceholderText('可选'), { target: { value: 'Full description' } });

    // Add and fill a sub-attribute
    fireEvent.click(screen.getByText(/添加子属性/));
    await screen.findByPlaceholderText('属性名称 (如: 颜色)');
    fireEvent.change(screen.getByPlaceholderText('属性名称 (如: 颜色)'), { target: { value: 'Color' } });
    fireEvent.change(screen.getByPlaceholderText('属性值 (如: 红色)'), { target: { value: 'Blue' } });
    
    // Click submit
    fireEvent.click(screen.getByText('提交'));

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
    render(<AddProductModal visible={true} onClose={handleClose} />);
    
    const addAttributeButton = screen.getByText(/添加子属性/);
    fireEvent.click(addAttributeButton);

    let keyInput = await screen.findByPlaceholderText('属性名称 (如: 颜色)');
    expect(keyInput).toBeInTheDocument();

    const removeButton = screen.getByTestId('remove-attribute-btn');
    fireEvent.click(removeButton);

    expect(screen.queryByPlaceholderText('属性名称 (如: 颜色)')).not.toBeInTheDocument();
  });
});
