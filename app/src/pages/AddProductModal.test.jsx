import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AddProductModal from './AddProductModal';
import { db } from '../db';
import { NotificationProvider } from '../NotificationContext';

// Mocking the db for all tests in this file
vi.mock('../db', () => ({
  db: {
    products: {
      add: vi.fn(),
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

describe('AddProductModal', () => {
  const handleClose = vi.fn();

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  it('renders correctly for simple product (no attributes)', () => {
    renderWithProvider(<AddProductModal open={true} onClose={handleClose} />);
    expect(screen.getByText('添加新产品')).toBeInTheDocument();
    expect(screen.getByLabelText('初始库存')).toBeInTheDocument();
    expect(screen.queryByText('定义属性')).not.toBeInTheDocument();
    expect(screen.queryByText('库存设置')).not.toBeInTheDocument();
  });

  it('renders correctly for product with attributes option selected', async () => {
    renderWithProvider(<AddProductModal open={true} onClose={handleClose} />);
    
    // Check "添加子属性 (多规格)"
    fireEvent.click(screen.getByLabelText('添加子属性 (多规格)'));

    await waitFor(() => {
        expect(screen.queryByLabelText('初始库存')).not.toBeInTheDocument();
        expect(screen.getByText('定义属性')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '添加另一属性' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '生成规格' })).toBeInTheDocument();
    });
  });

  it('submits simple product data correctly', async () => {
    renderWithProvider(<AddProductModal open={true} onClose={handleClose} />);

    fireEvent.change(screen.getByLabelText('产品名称'), { target: { value: 'Simple Product' } });
    fireEvent.change(screen.getByLabelText('销售价格'), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText('初始库存'), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText('文字描述'), { target: { value: 'Simple description' } });

    fireEvent.click(screen.getByRole('button', { name: '提交' }));

    await waitFor(() => {
      expect(db.products.add).toHaveBeenCalledTimes(1);
      expect(db.products.add).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Simple Product',
        price: 50,
        description: 'Simple description',
        stock: 100,
        attributes: [],
        variants: [],
      }));
    });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('submits product with variants data correctly', async () => {
    renderWithProvider(<AddProductModal open={true} onClose={handleClose} />);

    // Fill in basic fields
    fireEvent.change(screen.getByLabelText('产品名称'), { target: { value: 'Variant Product' } });
    fireEvent.change(screen.getByLabelText('销售价格'), { target: { value: '150' } });

    // Enable attributes
    fireEvent.click(screen.getByLabelText('添加子属性 (多规格)'));
    await waitFor(() => expect(screen.queryByLabelText('初始库存')).not.toBeInTheDocument());

    // Add first attribute: Color: Red Blue
    fireEvent.click(screen.getByRole('button', { name: '添加另一属性' }));
    fireEvent.change(screen.getByLabelText('属性名称'), { target: { value: '颜色' } });
    fireEvent.change(screen.getByLabelText('属性值 (用空格分隔)'), { target: { value: '红 蓝' } });

    // Add second attribute: Size: S M
    fireEvent.click(screen.getByRole('button', { name: '添加另一属性' }));
    fireEvent.change(screen.getAllByLabelText('属性名称')[1], { target: { value: '尺码' } });
    fireEvent.change(screen.getAllByLabelText('属性值 (用空格分隔)')[1], { target: { value: 'S M' } });

    // Generate variants
    fireEvent.click(screen.getByRole('button', { name: '生成规格' }));
    
    await waitFor(() => {
        expect(screen.getByText('库存设置 (总库存: 0)')).toBeInTheDocument();
        expect(screen.getByText('颜色:红 / 尺码:S')).toBeInTheDocument();
        expect(screen.getByText('颜色:红 / 尺码:M')).toBeInTheDocument();
        expect(screen.getByText('颜色:蓝 / 尺码:S')).toBeInTheDocument();
        expect(screen.getByText('颜色:蓝 / 尺码:M')).toBeInTheDocument();
    });

    // Set stock for variants
    const stockInputs = screen.getAllByLabelText('库存');
    fireEvent.change(stockInputs[0], { target: { value: '10' } }); // first variant
    fireEvent.change(stockInputs[1], { target: { value: '20' } }); // second variant
    fireEvent.change(stockInputs[2], { target: { value: '5' } });  // third variant
    fireEvent.change(stockInputs[3], { target: { value: '15' } }); // fourth variant


    await waitFor(() => {
        expect(screen.getByText('库存设置 (总库存: 50)')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByRole('button', { name: '提交' }));

    await waitFor(() => {
      expect(db.products.add).toHaveBeenCalledTimes(1);
      const addedProduct = db.products.add.mock.calls[0][0];
      expect(addedProduct.name).toBe('Variant Product');
      expect(addedProduct.price).toBe(150);
      expect(addedProduct.stock).toBe(50); // 10 + 20 + 5 + 15
      expect(addedProduct.attributes).toEqual([
        { key: '颜色', value: '红 蓝' },
        { key: '尺码', value: 'S M' },
      ]);
      expect(addedProduct.variants.length).toBe(4);
      expect(addedProduct.variants[0].stock).toBe(10);
      expect(addedProduct.variants[1].stock).toBe(20);
      expect(addedProduct.variants[2].stock).toBe(5);
      expect(addedProduct.variants[3].stock).toBe(15);
    });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('shows warning if attributes enabled but variants not generated before submit', async () => {
    renderWithProvider(<AddProductModal open={true} onClose={handleClose} />);

    fireEvent.change(screen.getByLabelText('产品名称'), { target: { value: 'Product' } });
    fireEvent.change(screen.getByLabelText('销售价格'), { target: { value: '100' } });
    fireEvent.click(screen.getByLabelText('添加子属性 (多规格)'));
    fireEvent.click(screen.getByRole('button', { name: '添加另一属性' }));
    fireEvent.change(screen.getByLabelText('属性名称'), { target: { value: '颜色' } });
    fireEvent.change(screen.getByLabelText('属性值 (用空格分隔)'), { target: { value: '黑' } });

    fireEvent.click(screen.getByRole('button', { name: '提交' }));

    await waitFor(() => {
        expect(screen.getByText('请生成子属性规格并填写库存')).toBeInTheDocument();
    });
    expect(db.products.add).not.toHaveBeenCalled();
    expect(handleClose).not.toHaveBeenCalled();
  });

  it('allows adding and removing sub-attribute fields dynamically', async () => {
    renderWithProvider(<AddProductModal open={true} onClose={handleClose} />);
    
    fireEvent.click(screen.getByLabelText('添加子属性 (多规格)'));
    await waitFor(() => expect(screen.getByText('定义属性')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: '添加另一属性' })); // Add first
    expect(screen.getAllByLabelText('属性名称').length).toBe(1);

    fireEvent.click(screen.getByRole('button', { name: '添加另一属性' })); // Add second
    expect(screen.getAllByLabelText('属性名称').length).toBe(2);

    // Remove the first attribute field
    fireEvent.click(screen.getAllByRole('button', { name: /移除属性/i })[0]);
    expect(screen.getAllByLabelText('属性名称').length).toBe(1);
  });
});