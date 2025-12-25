import React, { useState, useEffect, useCallback } from 'react'
import { TabBar, Dialog, Toast } from 'antd-mobile'
import {
  AppOutline,
  UnorderedListOutline,
  BillOutline,
  CalculatorOutline,
  SetOutline,
} from 'antd-mobile-icons'
import './App.css'
import Sale from './pages/Sale'
import Inventory from './pages/Inventory'
import Orders from './pages/Orders'
import Stats from './pages/Stats'
import Settings from './pages/Settings'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'

const App = () => {
  const [activeKey, setActiveKey] = useState('sale');
  const [cart, setCart] = useState([]);
  const products = useLiveQuery(() => db.products.toArray(), []);
  
  const [clearCartDialogVisible, setClearCartDialogVisible] = useState(false);

  useEffect(() => {
    const loadCart = async () => {
      try {
        const storedCart = await db.cart.toArray();
        setCart(storedCart);
      } catch (error) {
        console.error('Failed to load cart from IndexedDB:', error);
      }
    };
    loadCart();
  }, []);

  const saveCartToDb = useCallback(async (newCart) => {
    try {
      await db.transaction('rw', db.cart, async () => {
        await db.cart.clear();
        if (newCart.length > 0) {
          await db.cart.bulkAdd(newCart);
        }
      });
    } catch (error) {
      console.error('Failed to save cart to IndexedDB:', error);
    }
  }, []);

  const handleAddToCart = useCallback((product, selectedAttributes = []) => {
    const attributesString = selectedAttributes.map(a => `${a.key}:${a.value}`).sort().join('|');
    const cartItemId = `${product.id}-${attributesString}`;

    let newCart;
    const existingItemIndex = cart.findIndex(item => item.cartItemId === cartItemId);

    if (existingItemIndex !== -1) {
      newCart = cart.map((item, index) =>
        index === existingItemIndex ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      const attributeLabels = selectedAttributes.map(a => a.value).join(' ');
      newCart = [...cart, {
        cartItemId,
        productId: product.id,
        name: `${product.name} ${attributeLabels}`,
        price: product.price,
        quantity: 1,
        isGift: false,
        selectedAttributes,
      }];
    }
    setCart(newCart);
    saveCartToDb(newCart);
  }, [cart, saveCartToDb]);

  const handleQuantityChange = useCallback((cartItemId, quantity) => {
    let newCart;
    if (quantity <= 0) {
      newCart = cart.filter(item => item.cartItemId !== cartItemId);
    } else {
      newCart = cart.map(item =>
        item.cartItemId === cartItemId ? { ...item, quantity } : item
      );
    }
    setCart(newCart);
    saveCartToDb(newCart);
  }, [cart, saveCartToDb]);

  const handleGiftToggle = useCallback((cartItemId, isGift) => {
    const newCart = cart.map(item =>
      item.cartItemId === cartItemId ? { ...item, isGift } : item
    );
    setCart(newCart);
    saveCartToDb(newCart);
  }, [cart, saveCartToDb]);
  
  const handleClearCart = () => {
    if (cart.length === 0) return;
    setClearCartDialogVisible(true);
  };
  
  const confirmClearCart = () => {
    const newCart = [];
    setCart(newCart);
    saveCartToDb(newCart);
    setClearCartDialogVisible(false);
  };

  const handleCheckout = async (paymentChannelId) => {
    if (cart.length === 0) return;

    const totalAmount = cart
      .reduce((sum, item) => sum + (item.isGift ? 0 : item.price * item.quantity), 0);

    try {
      await db.orders.add({
        items: cart.map(({ cartItemId, ...rest }) => rest),
        paymentChannelId,
        totalAmount,
        status: 'completed',
        createdAt: new Date(),
      });

      await db.transaction('rw', db.products, async () => {
        for (const item of cart) {
          await db.products.where('id').equals(item.productId).modify(p => {
            p.stock -= item.quantity;
          });
        }
      });

      const newCart = [];
      setCart(newCart);
      saveCartToDb(newCart);
      Toast.show({ icon: 'success', content: '结算成功' });

    } catch (error) {
      console.error('Failed to checkout:', error);
      Toast.show({
        icon: 'fail',
        content: '结算失败，请重试',
      });
    }
  };

  const tabs = [
    { key: 'sale', title: '记账', icon: <BillOutline /> },
    { key: 'inventory', title: '库存', icon: <UnorderedListOutline /> },
    { key: 'orders', title: '订单', icon: <AppOutline /> },
    { key: 'stats', title: '统计', icon: <CalculatorOutline /> },
    { key: 'settings', title: '设置', icon: <SetOutline /> },
  ];

  const renderContent = () => {
    switch (activeKey) {
      case 'sale':
        return <Sale 
          cart={cart}
          products={products}
          onAddToCart={handleAddToCart}
          onQuantityChange={handleQuantityChange}
          onGiftToggle={handleGiftToggle}
          onClearCart={handleClearCart}
          onCheckout={handleCheckout}
        />
      case 'inventory':
        return <Inventory />
      case 'orders':
        return <Orders />
      case 'stats':
        return <Stats />
      case 'settings':
        return <Settings />
      default:
        return <Sale />
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {renderContent()}
      </div>
      <TabBar activeKey={activeKey} onChange={setActiveKey}>
        {tabs.map(item => (
          <TabBar.Item key={item.key} icon={item.icon} title={item.title} />
        ))}
      </TabBar>

      <Dialog
        visible={clearCartDialogVisible}
        onClose={() => setClearCartDialogVisible(false)}
        content={'确定要清空购物车吗？'}
        actions={[[{ key: 'cancel', text: '取消' }, { key: 'confirm', text: '确定', bold: true, danger: true, onClick: confirmClearCart }]]}
      />
    </div>
  )
}

export default App