import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import {
  List,
  Button,
  Empty,
  Picker,
  Stepper,
} from 'antd-mobile';
import {
  GiftOutline,
} from 'antd-mobile-icons'
import './Sale.css'
import AttributeSelector from './AttributeSelector';

const Sale = ({ cart, products, onAddToCart, onQuantityChange, onGiftToggle, onClearCart, onCheckout }) => {
  const paymentChannels = useLiveQuery(() => db.paymentChannels.toArray(), []);
  
  const [productPickerVisible, setProductPickerVisible] = useState(false);
  const [paymentPickerVisible, setPaymentPickerVisible] = useState(false);
  const [attributeSelectorVisible, setAttributeSelectorVisible] = useState(false);
  const [productForAttrSelection, setProductForAttrSelection] = useState(null);

  const productColumns = [
    (products || []).map(p => ({ label: p.name, value: p.id })),
  ];
  const paymentChannelColumns = [
    (paymentChannels || []).map(c => ({ label: c.name, value: c.id })),
  ];

  const handleProductSelect = (productId) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (product.attributes && product.attributes.length > 0 && product.attributes[0].value) {
      setProductForAttrSelection(product);
      setAttributeSelectorVisible(true);
    } else {
      onAddToCart(product);
    }
  };

  const calculateTotal = () => {
    return cart
      .reduce((sum, item) => sum + (item.isGift ? 0 : item.price * item.quantity), 0)
      .toFixed(2);
  };

  return (
    <div className="sale-page">
      <div className="page-header">
        <span className="page-title">记账</span>
      </div>

      <div className="cart-summary">
        <div className="total-amount">
          <span>应付</span>
          <span className="amount">¥ {calculateTotal()}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {cart.length > 0 && (
            <Button
              size="small"
              onClick={onClearCart}
            >
              清空
            </Button>
          )}
          <Button
            size="small"
            className="add-product-btn"
            color="primary"
            onClick={() => setProductPickerVisible(true)}
          >
            添加商品
          </Button>
        </div>
      </div>
      
      <div className="cart-items-container">
        {cart.length > 0 ? (
          <List>
            {cart.map(item => (
              <List.Item
                key={item.cartItemId}
                prefix={
                  <GiftOutline
                    fontSize={24}
                    color={item.isGift ? '#ff6a00' : '#cccccc'}
                    onClick={() => onGiftToggle(item.cartItemId, !item.isGift)}
                  />
                }
                extra={
                  <Stepper
                    value={item.quantity}
                    onChange={val => onQuantityChange(item.cartItemId, val)}
                    min={0}
                  />
                }
              >
                {item.name}
              </List.Item>
            ))}
          </List>
        ) : (
          <Empty 
            description={
              <div>
                <p>购物车是空的</p>
                <p>点击“添加商品”按钮，开始第一笔交易吧！</p>
              </div>
            } 
            style={{ padding: '64px 0' }} 
          />
        )}
      </div>

      <Picker
        columns={productColumns}
        visible={productPickerVisible}
        onClose={() => setProductPickerVisible(false)}
        onConfirm={(value) => {
          handleProductSelect(value[0]);
        }}
        title="选择产品"
      />

      <AttributeSelector
        visible={attributeSelectorVisible}
        product={productForAttrSelection}
        onClose={() => setAttributeSelectorVisible(false)}
        onConfirm={(product, selectedAttrs) => {
            onAddToCart(product, selectedAttrs);
        }}
      />

      <Picker
        columns={paymentChannelColumns}
        visible={paymentPickerVisible}
        onClose={() => setPaymentPickerVisible(false)}
        onConfirm={async (value) => {
           await onCheckout(value[0]);
        }}
        title="选择支付方式"
      />
      
      <div className="sale-footer">
        <Button
          block
          color="primary"
          size="large"
          disabled={cart.length === 0}
          onClick={() => setPaymentPickerVisible(true)}
        >
          去结算
        </Button>
      </div>
    </div>
  );
};

export default Sale;
