import React, { useState, useEffect, useCallback } from 'react'
import { Box, Paper, BottomNavigation, BottomNavigationAction, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, List, ListItem, ListItemText, Typography } from '@mui/material';
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
import WelcomeDialog from './components/WelcomeDialog'; // Import WelcomeDialog
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'
import { useNotification } from './NotificationContext';

const App = () => {
  const { showNotification } = useNotification();
  const [activeKey, setActiveKey] = useState('sale');
  const [cart, setCart] = useState([]);
  const products = useLiveQuery(() => db.products.toArray(), []);
  
  const [clearCartDialogVisible, setClearCartDialogVisible] = useState(false);
  const [stockWarningDialogOpen, setStockWarningDialogOpen] = useState(false);
  const [outOfStockItems, setOutOfStockItems] = useState([]);
  const [checkoutArgs, setCheckoutArgs] = useState(null);
  const [welcomeDialogOpen, setWelcomeDialogOpen] = useState(false);

  useEffect(() => {
    const checkFirstVisit = async () => {
      const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
      if (!hasSeenWelcome) {
        const productCount = await db.products.count();
        const orderCount = await db.orders.count();
        if (productCount === 0 && orderCount === 0) {
          setWelcomeDialogOpen(true);
        }
      }
    };
    checkFirstVisit();
  }, []);

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

  const handleConfirmWelcome = () => {
    localStorage.setItem('hasSeenWelcome', 'true');
    setWelcomeDialogOpen(false);
  };

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
    const cartItemId = variant ? `${product.id}-${variant.name}` : `${product.id}`;

    let newCart;
    const existingItemIndex = cart.findIndex(item => item.cartItemId === cartItemId);

    if (existingItemIndex !== -1) {
      newCart = cart.map((item, index) =>
        index === existingItemIndex ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      newCart = [...cart, {
        cartItemId,
        productId: product.id,
        name: product.name,
        price: product.price,
        description: product.description, // Add description here
        quantity: 1,
        isGift: false,
        variantName: variant ? variant.name : null,
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

  const proceedWithCheckout = async (paymentChannelId, cartToCheckout) => {
    if (cartToCheckout.length === 0) return;

    const paymentChannel = await db.paymentChannels.get(paymentChannelId);

    const totalAmount = (paymentChannel && paymentChannel.name === '整单赠送')
      ? 0
      : cartToCheckout.reduce((sum, item) => sum + (item.isGift ? 0 : item.price * item.quantity), 0);

    try {
      await db.orders.add({
        items: cartToCheckout.map(({ cartItemId, ...rest }) => rest),
        paymentChannelId,
        totalAmount,
        status: 'completed',
        createdAt: new Date(),
      });

      await db.transaction('rw', db.products, async () => {
        for (const item of cartToCheckout) {
          const product = await db.products.get(item.productId);
          if (product) {
            let newStock = product.stock;
            let newVariants = product.variants;

            if (item.variantName && product.variants) {
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
              newStock = product.stock - item.quantity;
              await db.products.update(item.productId, { stock: newStock });
            }
          }
        }
      });

      const newCart = [];
      setCart(newCart);
      saveCartToDb(newCart);
      showNotification('结算成功', 'success');

    } catch (error) {
      console.error('Failed to checkout:', error);
      showNotification(`结算失败: ${error.message}`, 'error');
    }
  };

  const handleCheckout = async (paymentChannelId) => {
    if (cart.length === 0) return;

    let effectivePaymentChannelId = paymentChannelId;
    if (cart.every(item => item.isGift)) {
      const giftChannel = await db.paymentChannels.where('name').equals('整单赠送').first();
      if (giftChannel) {
        effectivePaymentChannelId = giftChannel.id;
      }
    }

    const paymentChannel = await db.paymentChannels.get(effectivePaymentChannelId);
    let cartForCheckout = [...cart];

    if (paymentChannel && paymentChannel.name === '整单赠送') {
      cartForCheckout = cart.map(item => ({ ...item, isGift: false }));
    }

    const itemsWithStockIssues = [];
    for (const item of cartForCheckout) {
      const product = await db.products.get(item.productId);
      if (!product) continue;

      let availableStock = 0;
      if (item.variantName) {
        const variant = product.variants.find(v => v.name === item.variantName);
        availableStock = variant ? variant.stock : 0;
      } else {
        availableStock = product.stock;
      }

      if (item.quantity > availableStock) {
        itemsWithStockIssues.push({
          name: item.name,
          variantName: item.variantName,
          quantity: item.quantity,
          availableStock: availableStock,
        });
      }
    }

    if (itemsWithStockIssues.length > 0) {
      setOutOfStockItems(itemsWithStockIssues);
      setCheckoutArgs({ paymentChannelId: effectivePaymentChannelId, cartForCheckout });
      setStockWarningDialogOpen(true);
    } else {
      await proceedWithCheckout(effectivePaymentChannelId, cartForCheckout);
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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
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
            <BottomNavigationAction 
              key={item.key} 
              label={item.title} 
              value={item.key} 
              icon={item.icon} 
              sx={{ minWidth: 'auto', padding: '6px 0' }}
            />
          ))}
        </BottomNavigation>
      </Paper>

      <WelcomeDialog open={welcomeDialogOpen} onConfirm={handleConfirmWelcome} />

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

      <Dialog
        open={stockWarningDialogOpen}
        onClose={() => setStockWarningDialogOpen(false)}
      >
        <DialogTitle>库存不足警告</DialogTitle>
        <DialogContent>
          <DialogContentText>
            以下商品库存不足，继续结算将导致库存变为负数。
          </DialogContentText>
          <List dense>
            {outOfStockItems.map((item, index) => (
              <ListItem key={index}>
                <ListItemText
                  primary={`${item.name} ${item.variantName || ''}`}
                  secondary={`需求: ${item.quantity}, 可用: ${item.availableStock}`}
                />
              </ListItem>
            ))}
          </List>
          <DialogContentText>
            是否继续结算？
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStockWarningDialogOpen(false)}>取消</Button>
          <Button onClick={async () => {
            setStockWarningDialogOpen(false);
            await proceedWithCheckout(checkoutArgs.paymentChannelId, checkoutArgs.cartForCheckout);
          }} color="warning">
            继续结算
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default App