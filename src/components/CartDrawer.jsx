import React from 'react';
import { Drawer, Box, Typography, Button, List, ListItem, ListItemText, IconButton } from '@mui/material';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import { useCart } from '../CartContext';

const CustomStepper = ({ value, onChange, cartItemId }) => (
  <Box sx={{ display: 'flex', alignItems: 'center' }}>
    <IconButton size="small" onClick={() => onChange(cartItemId, value - 1)}>
      <RemoveCircleIcon />
    </IconButton>
    <Typography sx={{ mx: 1, minWidth: '20px', textAlign: 'center' }}>{value}</Typography>
    <IconButton size="small" onClick={() => onChange(cartItemId, value + 1)}>
      <AddCircleIcon />
    </IconButton>
  </Box>
);

const CartDrawer = ({ open, onClose, onCheckout }) => {
  const { cart, handleQuantityChange, handleGiftToggle, handleClearCart } = useCart();

  const calculateTotal = () => {
    return cart
      .reduce((sum, item) => sum + (item.isGift ? 0 : item.price * item.quantity), 0)
      .toFixed(2);
  };

  return (
    <Drawer anchor="bottom" open={open} onClose={onClose}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee' }}>
        <Typography variant="h6">购物车</Typography>
        {cart.length > 0 && (
          <Button size="small" onClick={handleClearCart} variant="outlined">
            清空
          </Button>
        )}
      </Box>
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        {cart.length > 0 ? (
          <List>
            {cart.map(item => (
              <ListItem
                key={item.cartItemId}
                secondaryAction={
                  <CustomStepper
                    value={item.quantity}
                    onChange={handleQuantityChange}
                    cartItemId={item.cartItemId}
                  />
                }
              >
                <IconButton onClick={() => handleGiftToggle(item.cartItemId, !item.isGift)} sx={{ mr: 1 }}>
                  <CardGiftcardIcon color={item.isGift ? 'primary' : 'disabled'} />
                </IconButton>
                <ListItemText
                  primary={item.name}
                  secondary={item.variantName}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Box sx={{ textAlign: 'center', mt: 4, p: 2 }}>
            <Typography variant="subtitle1">购物车是空的</Typography>
          </Box>
        )}
      </Box>
      <Box sx={{ p: 2, borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">应付: ¥{calculateTotal()}</Typography>
        <Button
          variant="contained"
          size="large"
          disabled={cart.length === 0}
          onClick={onCheckout}
        >
          去结算
        </Button>
      </Box>
    </Drawer>
  );
};

export default CartDrawer;
