import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import {
  List,
  Button,
  Empty,
  Picker,
  Stepper,
  Toast,
  Switch,
} from 'antd-mobile';
import {
  ShopbagOutline,
  UserCircleOutline
} from 'antd-mobile-icons'
import './Sale.css'
import AttributeSelector from './AttributeSelector';

const Sale = () => {
  const products = useLiveQuery(() => db.products.toArray(), []);
  const paymentChannels = useLiveQuery(() => db.paymentChannels.toArray(), []);
  
  const [cart, setCart] = useState([]);
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

    // Simplified check for attributes. 
    // Assumes attributes array has items and the first one has a non-empty value.
    if (product.attributes && product.attributes.length > 0 && product.attributes[0].value) {
      setProductForAttrSelection(product);
      setAttributeSelectorVisible(true);
    } else {
      handleAddToCart(product);
    }
  };

  const handleAddToCart = (product, selectedAttributes = []) => {
    const attributesString = selectedAttributes.map(a => `${a.key}:${a.value}`).sort().join('|');
    const cartItemId = `${product.id}-${attributesString}`;

    const existingItem = cart.find(item => item.cartItemId === cartItemId);

    if (existingItem) {
      setCart(cart.map(item =>
        item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      const attributeLabels = selectedAttributes.map(a => a.value).join(' ');
      setCart([...cart, {
        cartItemId,
        productId: product.id,
        name: `${product.name} ${attributeLabels}`,
        price: product.price,
        quantity: 1,
        isGift: false,
        selectedAttributes,
      }]);
    }
  };

  const handleQuantityChange = (cartItemId, quantity) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.cartItemId !== cartItemId));
    } else {
      setCart(cart.map(item =>
        item.cartItemId === cartItemId ? { ...item, quantity } : item
      ));
    }
  };

  const handleGiftToggle = (cartItemId, isGift) => {
    setCart(cart.map(item =>
      item.cartItemId === cartItemId ? { ...item, isGift } : item
    ));
  };

  const calculateTotal = () => {
    return cart
      .reduce((sum, item) => sum + (item.isGift ? 0 : item.price * item.quantity), 0)
      .toFixed(2);
  };

  const handleCheckout = async (paymentChannelId) => {
    if (cart.length === 0) return;

    const totalAmount = parseFloat(calculateTotal());

    try {
      await db.orders.add({
        items: cart.map(({ cartItemId, ...rest }) => rest), // Don't store cartItemId in DB
        paymentChannelId,
        totalAmount,
        status: 'completed',
        createdAt: new Date(),
      });

      await db.transaction('rw', db.products, async () => {
        for (const item of cart) {
          // Stock is managed per-product, not per-attribute-variation in this model.
          await db.products.where('id').equals(item.productId).modify(p => {
            p.stock -= item.quantity;
          });
        }
      });

      setCart([]);
      Toast.show({ icon: 'success', content: '结算成功' });

    } catch (error) {
      console.error('Failed to checkout:', error);
      Toast.show({ icon: 'fail', content: '结算失败，请重试' });
    }
  };


  return (
    <div className="sale-page">
      <div className="page-header">
        <ShopbagOutline fontSize={24} />
        <span className="page-title">记账</span>
        <UserCircleOutline fontSize={24} />
      </div>

      <div className="cart-summary">
        <div className="total-amount">
          <span>应付</span>
          <span className="amount">¥ {calculateTotal()}</span>
        </div>
        <Button
          className="add-product-btn"
          color="primary"
          onClick={() => setProductPickerVisible(true)}
        >
          选好了
        </Button>
      </div>
      
      <div className="cart-items-container">
        {cart.length > 0 ? (
          <List>
            {cart.map(item => (
              <List.Item
                key={item.cartItemId}
                prefix={
                  <Switch
                    checked={item.isGift}
                    onChange={checked => handleGiftToggle(item.cartItemId, checked)}
                    style={{'--checked-color': '#00b578'}}
                  />
                }
                extra={
                  <Stepper
                    value={item.quantity}
                    onChange={val => handleQuantityChange(item.cartItemId, val)}
                    min={0}
                  />
                }
              >
                {item.name} {item.isGift && '(赠品)'}
              </List.Item>
            ))}
          </List>
        ) : (
          <Empty description="购物车是空的" style={{ padding: '64px 0' }} />
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
            handleAddToCart(product, selectedAttrs);
        }}
      />

      <Picker
        columns={paymentChannelColumns}
        visible={paymentPickerVisible}
        onClose={() => setPaymentPickerVisible(false)}
        onConfirm={async (value) => {
           await handleCheckout(value[0]);
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
