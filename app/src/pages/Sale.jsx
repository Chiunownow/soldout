import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Box, Typography, Button, List, ListItem, ListItemText, IconButton } from '@mui/material';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import AttributeSelector from './AttributeSelector';
import ProductPickerDialog from './ProductPickerDialog';
import PaymentPickerDialog from './PaymentPickerDialog';


const Sale = ({ cart, products, onAddToCart, onQuantityChange, onGiftToggle, onClearCart, onCheckout }) => {
  const paymentChannels = useLiveQuery(() => db.paymentChannels.toArray(), []);
  
  const [productPickerVisible, setProductPickerVisible] = useState(false);
  const [paymentPickerVisible, setPaymentPickerVisible] = useState(false);
  const [attributeSelectorVisible, setAttributeSelectorVisible] = useState(false);
  const [productForAttrSelection, setProductForAttrSelection] = useState(null);

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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Typography variant="h5" sx={{ p: 2, textAlign: 'center' }}>
        记账
      </Typography>

      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', mb: 1 }}>
        <Box>
          <Typography variant="body1">应付</Typography>
          <Typography variant="h4" color="primary">¥ {calculateTotal()}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {cart.length > 0 && (
            <Button size="small" onClick={onClearCart} variant="outlined">
              清空
            </Button>
          )}
          <Button
            size="small"
            variant="contained"
            onClick={() => setProductPickerVisible(true)}
          >
            添加商品
          </Button>
        </Box>
      </Box>
      
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {cart.length > 0 ? (
          <List>
            {cart.map(item => (
              <ListItem
                key={item.cartItemId}
                secondaryAction={
                  <CustomStepper
                    value={item.quantity}
                    onChange={onQuantityChange}
                    cartItemId={item.cartItemId}
                  />
                }
              >
                <IconButton onClick={() => onGiftToggle(item.cartItemId, !item.isGift)} sx={{ mr: 1 }}>
                  <CardGiftcardIcon color={item.isGift ? 'primary' : 'disabled'} />
                </IconButton>
                <ListItemText primary={item.name} />
              </ListItem>
            ))}
          </List>
        ) : (
          <Box sx={{ textAlign: 'center', mt: 8 }}>
            <Typography variant="subtitle1">购物车是空的</Typography>
            <Typography variant="body2" color="text.secondary">
              点击“添加商品”按钮，开始第一笔交易吧！
            </Typography>
          </Box>
        )}
      </Box>
      
      <Box sx={{ p: 2, borderTop: '1px solid #eee' }}>
        <Button
          fullWidth
          variant="contained"
          size="large"
          disabled={cart.length === 0}
          onClick={() => setPaymentPickerVisible(true)}
        >
          去结算
        </Button>
      </Box>
      
      <ProductPickerDialog
        open={productPickerVisible}
        onClose={() => setProductPickerVisible(false)}
        products={products}
        onSelectProduct={handleProductSelect}
      />

      <AttributeSelector
        open={attributeSelectorVisible}
        product={productForAttrSelection}
        onClose={() => setAttributeSelectorVisible(false)}
        onConfirm={(product, selectedAttrs) => {
            onAddToCart(product, selectedAttrs);
        }}
      />

      <PaymentPickerDialog
        open={paymentPickerVisible}
        onClose={() => setPaymentPickerVisible(false)}
        channels={paymentChannels}
        onSelectChannel={onCheckout}
      />
    </Box>
  );
};

export default Sale;
