import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AddProductModal from './AddProductModal';
import { db } from '../db';
import { NotificationProvider } from '../NotificationContext';

// Mocking the db for all tests in this file
vi.mock('../db', () => ({
  db: {
    products: {
      add: vi.fn(),
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
    expect(screen.queryByText('设置库存')).not.toBeInTheDocument();
  });

  it('renders correctly for product with attributes option selected', async () => {
    renderWithProvider(<AddProductModal open={true} onClose={handleClose} />);
    
    fireEvent.click(screen.getByLabelText('添加子属性 (多规格)'));

    fireEvent.change(screen.getByLabelText('产品名称'), { target: { value: 'Variant Product' } });
    fireEvent.change(screen.getByLabelText('销售价格'), { target: { value: '150' } });
    fireEvent.click(screen.getByRole('button', { name: '下一步' }));

    await waitFor(() => {
        expect(screen.getByText('定义属性')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '添加另一属性' })).toBeInTheDocument();
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

    fireEvent.change(screen.getByLabelText('产品名称'), { target: { value: 'Variant Product' } });
    fireEvent.change(screen.getByLabelText('销售价格'), { target: { value: '150' } });

    fireEvent.click(screen.getByLabelText('添加子属性 (多规格)'));
    fireEvent.click(screen.getByRole('button', { name: '下一步' }));

    await waitFor(() => expect(screen.getByText('定义属性')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: '添加另一属性' }));
    const attributeNameInputs = screen.getAllByLabelText('属性名称');
    const attributeValueInputs = screen.getAllByLabelText('属性值 (用空格分隔)');
    fireEvent.change(attributeNameInputs[0], { target: { value: '颜色' } });
    fireEvent.change(attributeValueInputs[0], { target: { value: '红 蓝' } });
    
    fireEvent.click(screen.getByRole('button', { name: '下一步' }));

    await waitFor(() => {
        expect(screen.getByText('为生成的规格设置库存 (总库存: 0)')).toBeInTheDocument();
        expect(screen.getByText('颜色:红')).toBeInTheDocument();
        expect(screen.getByText('颜色:蓝')).toBeInTheDocument();
    });
    
    const stockInputs = screen.getAllByLabelText('库存');
    fireEvent.change(stockInputs[0], { target: { value: '10' } });
    fireEvent.change(stockInputs[1], { target: { value: '20' } });

    fireEvent.click(screen.getByRole('button', { name: '提交' }));

    await waitFor(() => {
      expect(db.products.add).toHaveBeenCalledTimes(1);
      const addedProduct = db.products.add.mock.calls[0][0];
      expect(addedProduct.name).toBe('Variant Product');
      expect(addedProduct.price).toBe(150);
      expect(addedProduct.stock).toBe(30);
      expect(addedProduct.attributes.length).toBe(1);
      expect(addedProduct.variants.length).toBe(2);
    });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('shows warning if attribute key is duplicated', async () => {
    const { getByText } = renderWithProvider(<AddProductModal open={true} onClose={handleClose} />);

    fireEvent.click(screen.getByLabelText('添加子属性 (多规格)'));
    fireEvent.change(screen.getByLabelText('产品名称'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText('销售价格'), { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: '下一步' }));
    
    await waitFor(() => fireEvent.click(screen.getByRole('button', { name: '添加另一属性' })));
    
    fireEvent.change(screen.getAllByLabelText('属性名称')[0], { target: { value: '颜色' } });
    fireEvent.change(screen.getAllByLabelText('属性值 (用空格分隔)')[0], { target: { value: '红' } });

    fireEvent.click(screen.getByRole('button', { name: '添加另一属性' }));

    fireEvent.change(screen.getAllByLabelText('属性名称')[1], { target: { value: '颜色' } });
    fireEvent.change(screen.getAllByLabelText('属性值 (用空格分隔)')[1], { target: { value: '蓝' } });

    fireEvent.click(screen.getByRole('button', { name: '下一步' }));

    await waitFor(() => {
        expect(getByText('属性名称不能重复')).toBeInTheDocument();
    });
  });

  it('allows adding and removing sub-attribute fields dynamically', async () => {
    renderWithProvider(<AddProductModal open={true} onClose={handleClose} />);
    
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