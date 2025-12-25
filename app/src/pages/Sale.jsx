import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Box, Typography, Button, List, ListItem, ListItemText, IconButton } from '@mui/material';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import ProductPickerDialog from './ProductPickerDialog';
import PaymentPickerDialog from './PaymentPickerDialog';
import VariantSelector from './VariantSelector';

import PageHeader from '../components/PageHeader';

const Sale = ({ cart, products, onAddToCart, onQuantityChange, onGiftToggle, onClearCart, onCheckout }) => {
  const paymentChannels = useLiveQuery(() => db.paymentChannels.toArray(), []);
  
  const [productPickerVisible, setProductPickerVisible] = useState(false);
  const [paymentPickerVisible, setPaymentPickerVisible] = useState(false);
  const [variantSelectorVisible, setVariantSelectorVisible] = useState(false);
  const [productForVariantSelection, setProductForVariantSelection] = useState(null);

  const handleProductSelect = (productId) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (product.variants && product.variants.length > 0) {
      setProductForVariantSelection(product);
      setVariantSelectorVisible(true);
    } else {
      onAddToCart(product, null);
    }
  };

  const handleVariantSelect = (product, variant) => {
    onAddToCart(product, variant);
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
    <>
      <PageHeader title="记账" />

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
            {cart.map(item => {
              const product = products.find(p => p.id === item.productId);
              let currentStock = 0;
              if (product) {
                if (item.variantName) {
                  const variant = product.variants.find(v => v.name === item.variantName);
                  currentStock = variant ? variant.stock : 0;
                } else {
                  currentStock = product.stock;
                }
              }

              const isOverStock = item.quantity > currentStock;

              return (
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
                  <ListItemText
                    primary={item.name}
                    secondary={item.variantName || null}
                    primaryTypographyProps={{ color: isOverStock ? 'error' : 'inherit' }}
                    secondaryTypographyProps={{ color: isOverStock ? 'error' : 'text.secondary' }}
                  />
                </ListItem>
              );
            })}
          </List>
        ) : (
          <Box sx={{ textAlign: 'center', mt: 8, p: 2 }}>
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

      <VariantSelector
        open={variantSelectorVisible}
        product={productForVariantSelection}
        onClose={() => setVariantSelectorVisible(false)}
        onSelect={handleVariantSelect}
      />

      <PaymentPickerDialog
        open={paymentPickerVisible}
        onClose={() => setPaymentPickerVisible(false)}
        channels={paymentChannels}
        onSelectChannel={onCheckout}
      />
    </>
  );
};

export default Sale;