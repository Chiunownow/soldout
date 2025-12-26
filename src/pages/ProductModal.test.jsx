import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProductModal from './ProductModal';
import { db } from '../db';
import { NotificationProvider } from '../NotificationContext';

// Mocking the db for all tests in this file
vi.mock('../db', () => ({
  db: {
    products: {
      add: vi.fn(),
      update: vi.fn(),
      where: vi.fn().mockReturnThis(),
      equalsIgnoreCase: vi.fn().mockReturnThis(),
      first: vi.fn().mockResolvedValue(null),
    },
  },
}));

// Helper to render with NotificationProvider
const renderWithProvider = (ui, { providerProps, ...renderOptions } = {}) => {
    return render(
        <NotificationProvider {...providerProps}>{ui}</NotificationProvider>,
        renderOptions
    );
};

describe('ProductModal', () => {
  const handleClose = vi.fn();
  const mockProduct = {
    id: 1,
    name: 'Existing Product',
    price: 100,
    description: 'An existing product.',
    stock: 50,
    attributes: [],
    variants: [],
  };

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    db.products.where().equalsIgnoreCase().first.mockResolvedValue(null);
  });
  
  // Test Suite for "Add Mode"
  describe('in Add Mode', () => {
    it('renders correctly for adding a simple product', () => {
      renderWithProvider(<ProductModal open={true} onClose={handleClose} />);
      expect(screen.getByText('添加新产品')).toBeInTheDocument();
      expect(screen.getByLabelText('产品名称')).toHaveValue('');
      expect(screen.getByLabelText('初始库存')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '提交' })).toBeInTheDocument();
    });

    it('submits a new simple product data correctly', async () => {
      renderWithProvider(<ProductModal open={true} onClose={handleClose} />);
      fireEvent.change(screen.getByLabelText('产品名称'), { target: { value: 'New Simple Product' } });
      fireEvent.change(screen.getByLabelText('销售价格'), { target: { value: '50' } });
      fireEvent.change(screen.getByLabelText('初始库存'), { target: { value: '100' } });
      fireEvent.click(screen.getByRole('button', { name: '提交' }));

      await waitFor(() => {
        expect(db.products.add).toHaveBeenCalledTimes(1);
        expect(db.products.add).toHaveBeenCalledWith(expect.objectContaining({ name: 'New Simple Product', stock: 100 }));
        expect(db.products.update).not.toHaveBeenCalled();
      });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('shows error if product name already exists', async () => {
      db.products.where().equalsIgnoreCase().first.mockResolvedValue({ id: 2, name: 'Existing Name' });
      renderWithProvider(<ProductModal open={true} onClose={handleClose} />);

      fireEvent.change(screen.getByLabelText('产品名称'), { target: { value: 'Existing Name' } });
      fireEvent.change(screen.getByLabelText('销售价格'), { target: { value: '10' } });

      // For simple product
      fireEvent.click(screen.getByRole('button', { name: '提交' }));
      await waitFor(() => {
        expect(screen.getByText('已存在同名商品')).toBeInTheDocument();
      });
      expect(db.products.add).not.toHaveBeenCalled();
    });
  });

  // Test Suite for "Edit Mode"
  describe('in Edit Mode', () => {
    it('renders correctly with pre-filled product data', () => {
      renderWithProvider(<ProductModal open={true} onClose={handleClose} product={mockProduct} />);
      expect(screen.getByText('编辑产品')).toBeInTheDocument();
      expect(screen.getByLabelText('产品名称')).toHaveValue(mockProduct.name);
      expect(screen.getByLabelText('销售价格')).toHaveValue(mockProduct.price);
      expect(screen.getByLabelText('初始库存')).toHaveValue(mockProduct.stock);
      expect(screen.getByRole('button', { name: '保存' })).toBeInTheDocument();
    });

    it('submits updated product data correctly', async () => {
      renderWithProvider(<ProductModal open={true} onClose={handleClose} product={mockProduct} />);
      const newName = 'Updated Product Name';
      fireEvent.change(screen.getByLabelText('产品名称'), { target: { value: newName } });
      fireEvent.click(screen.getByRole('button', { name: '保存' }));

      await waitFor(() => {
        expect(db.products.update).toHaveBeenCalledTimes(1);
        expect(db.products.update).toHaveBeenCalledWith(mockProduct.id, expect.objectContaining({ name: newName }));
        expect(db.products.add).not.toHaveBeenCalled();
      });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
    
    it('shows error if trying to update to a name that already exists for another product', async () => {
        // Mock that a product with the name 'Another Product' already exists.
        db.products.where().equalsIgnoreCase().first.mockResolvedValue({ id: 999, name: 'Another Product' });
  
        renderWithProvider(<ProductModal open={true} onClose={handleClose} product={mockProduct} />);
  
        fireEvent.change(screen.getByLabelText('产品名称'), { target: { value: 'Another Product' } });
        fireEvent.click(screen.getByRole('button', { name: '保存' }));
        
        await waitFor(() => {
            expect(screen.getByText('已存在同名商品')).toBeInTheDocument();
        });
        expect(db.products.update).not.toHaveBeenCalled();
    });

    it('allows saving if the product name is unchanged', async () => {
        // Mock that the current product is found by its name.
        db.products.where().equalsIgnoreCase().first.mockResolvedValue(mockProduct);

        renderWithProvider(<ProductModal open={true} onClose={handleClose} product={mockProduct} />);
        
        fireEvent.change(screen.getByLabelText('销售价格'), { target: { value: '110' } });
        fireEvent.click(screen.getByRole('button', { name: '保存' }));

        await waitFor(() => {
            expect(db.products.update).toHaveBeenCalledTimes(1);
            expect(db.products.update).toHaveBeenCalledWith(mockProduct.id, expect.objectContaining({ price: 110 }));
        });
    });
  });

  // Common functionality tests
  it('allows adding and removing sub-attribute fields dynamically', async () => {
    renderWithProvider(<ProductModal open={true} onClose={handleClose} />);
    fireEvent.click(screen.getByLabelText('添加子属性 (多规格)'));
    fireEvent.change(screen.getByLabelText('产品名称'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText('销售价格'), { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: '下一步' }));

    await waitFor(() => expect(screen.getByText('定义属性')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: '添加另一属性' }));
    expect(screen.getAllByLabelText('属性名称').length).toBe(2);

    fireEvent.click(screen.getAllByRole('button', { name: /移除属性/i })[0]);
    expect(screen.getAllByLabelText('属性名称').length).toBe(1);
  });
});