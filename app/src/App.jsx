import React, { useState, useEffect, useCallback } from 'react'
import { Box, Paper, BottomNavigation, BottomNavigationAction, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import InventoryIcon from '@mui/icons-material/Inventory';
import AppsIcon from '@mui/icons-material/Apps';
import CalculateIcon from '@mui/icons-material/Calculate';
import SettingsIcon from '@mui/icons-material/Settings';
import Sale from './pages/Sale'
import Inventory from './pages/Inventory'
import Orders from './pages/Orders'
import Stats from './pages/Stats'
import Settings from './pages/Settings'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'
import { useNotification } from './NotificationContext';

const App = () => {
  const { showNotification } = useNotification();
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

  const handleAddToCart = useCallback((product, variant = null) => {
    // If a variant is selected, the cart item ID is based on the variant's name
    // Otherwise, for simple products, it's based on the product ID
    const cartItemId = variant ? `${product.id}-${variant.name}` : `${product.id}`;

    let newCart;
    const existingItemIndex = cart.findIndex(item => item.cartItemId === cartItemId);

    if (existingItemIndex !== -1) {
      // Increase quantity if item already in cart
      newCart = cart.map((item, index) =>
        index === existingItemIndex ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      // Add new item to cart
      newCart = [...cart, {
        cartItemId,
        productId: product.id,
        name: product.name,
        price: product.price, // Assuming price is the same for all variants
        quantity: 1,
        isGift: false,
        variantName: variant ? variant.name : null, // Store variant name
      }];
    }
    setCart(newCart);
    saveCartToDb(newCart);
  }, [cart, saveCartToDb]);

  const handleQuantityChange = useCallback((cartItemId, quantity) => {
    let newCart;
    if (quantity <= 0) {
      // Remove item if quantity is zero or less
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
      // Save the order
      await db.orders.add({
        items: cart.map(({ cartItemId, ...rest }) => rest), // Remove cartItemId before saving to order
        paymentChannelId,
        totalAmount,
        status: 'completed',
        createdAt: new Date(),
      });

      // Update product stock in a single transaction
      await db.transaction('rw', db.products, async () => {
        for (const item of cart) {
          const product = await db.products.get(item.productId);
          if (product) {
            let newStock = product.stock;
            let newVariants = product.variants;

            if (item.variantName && product.variants) {
              // Product with variants
              let variantFound = false;
              newVariants = product.variants.map(v => {
                if (v.name === item.variantName) {
                  variantFound = true;
                  return { ...v, stock: v.stock - item.quantity };
                }
                return v;
              });

              if (variantFound) {
                 newStock = newVariants.reduce((acc, v) => acc + v.stock, 0);
                 await db.products.update(item.productId, {
                   variants: newVariants,
                   stock: newStock,
                 });
              }
            } else {
              // Simple product
              newStock = product.stock - item.quantity;
              await db.products.update(item.productId, { stock: newStock });
            }
          }
        }
      });

      // Clear the cart
      const newCart = [];
      setCart(newCart);
      saveCartToDb(newCart);
      showNotification('结算成功', 'success');

    } catch (error) {
      console.error('Failed to checkout:', error);
      showNotification(`结算失败: ${error.message}`, 'error');
    }
  };

  const tabs = [
    { key: 'sale', title: '记账', icon: <ReceiptLongIcon /> },
    { key: 'inventory', title: '库存', icon: <InventoryIcon /> },
    { key: 'orders', title: '订单', icon: <AppsIcon /> },
    { key: 'stats', title: '统计', icon: <CalculateIcon /> },
    { key: 'settings', title: '设置', icon: <SettingsIcon /> },
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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {renderContent()}
      </Box>
      <Paper sx={{ position: 'sticky', bottom: 0, left: 0, right: 0 }} elevation={3}>
        <BottomNavigation
          showLabels
          value={activeKey}
          onChange={(event, newValue) => {
            setActiveKey(newValue);
          }}
        >
          {tabs.map(item => (
            <BottomNavigationAction key={item.key} label={item.title} value={item.key} icon={item.icon} />
          ))}
        </BottomNavigation>
      </Paper>

      <Dialog
        open={clearCartDialogVisible}
        onClose={() => setClearCartDialogVisible(false)}
      >
        <DialogTitle>清空购物车</DialogTitle>
        <DialogContent>
          <DialogContentText>
            确定要清空购物车吗？此操作无法撤销。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearCartDialogVisible(false)}>取消</Button>
          <Button onClick={confirmClearCart} color="error">确定</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default App
