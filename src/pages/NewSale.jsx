import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { useCart } from '../CartContext';
import { Box, Fab, Badge, Typography, Chip } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PageHeader from '../components/PageHeader';
import ProductCard from '../components/ProductCard';
import PaymentPickerDialog from './PaymentPickerDialog';
import VariantSelector from './VariantSelector';
import CartDrawer from '../components/CartDrawer';

const NewSale = () => {
  const { cart, handleAddToCart, handleCheckout } = useCart();
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');

  const categories = useLiveQuery(() => db.categories.toArray(), []);
  const products = useLiveQuery(() => {
    if (selectedCategoryId === 'all') {
      return db.products.orderBy('createdAt').reverse().toArray();
    }
    return db.products.where('categoryId').equals(selectedCategoryId).reverse().toArray();
  }, [selectedCategoryId]);

  const paymentChannels = useLiveQuery(() => db.paymentChannels.toArray(), []);
  
  const [paymentPickerVisible, setPaymentPickerVisible] = useState(false);
  const [variantSelectorVisible, setVariantSelectorVisible] = useState(false);
  const [productForVariantSelection, setProductForVariantSelection] = useState(null);
  const [cartDrawerVisible, setCartDrawerVisible] = useState(false);

  const handleProductClick = (product) => {
    if (product.variants && product.variants.length > 0) {
      setProductForVariantSelection(product);
      setVariantSelectorVisible(true);
    } else {
      handleAddToCart(product);
    }
  };

  const handleVariantSelect = (product, variant) => {
    handleAddToCart(product, variant);
  };

  const handleCheckoutClick = () => {
    setCartDrawerVisible(false);
    setPaymentPickerVisible(true);
  };

  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Box>
      <PageHeader title="记账" />
      
      {categories && categories.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, p: 2, overflowX: 'auto', flexWrap: 'nowrap' }}>
          <Chip
            label="所有商品"
            variant={selectedCategoryId === 'all' ? 'filled' : 'outlined'}
            onClick={() => setSelectedCategoryId('all')}
          />
          {categories.map(cat => (
            <Chip
              key={cat.id}
              label={cat.name}
              variant={selectedCategoryId === cat.id ? 'filled' : 'outlined'}
              onClick={() => setSelectedCategoryId(cat.id)}
            />
          ))}
        </Box>
      )}

      <Box sx={{ 
        p: 2,
        pt: 0, // Remove top padding as it's now on the filter box
        columnCount: 2,
        columnGap: '16px',
        paddingBottom: '80px' // Add padding for the FAB
       }}>
        {products && products.length > 0 ? (
          products.map(product => (
            <ProductCard 
              key={product.id} 
              product={product}
              onClick={() => handleProductClick(product)}
            />
          ))
        ) : (
          <Box sx={{ columnSpan: 'all', textAlign: 'center', mt: 8, p: 2 }}>
              <Typography variant="subtitle1">还没有产品，快去库存页添加吧</Typography>
              <Typography variant="body2" color="text.secondary">小贴士：产品图片，名称，库存都会在这里显示哦！</Typography>
          </Box>
        )}
      </Box>

      <Fab
        color="primary"
        aria-label="cart"
        disabled={cart.length === 0}
        sx={{
          position: 'fixed',
          bottom: 80,
          right: 24,
        }}
        onClick={() => setCartDrawerVisible(true)}
      >
        <Badge badgeContent={totalQuantity} color="error">
          <ShoppingCartIcon />
        </Badge>
      </Fab>

      <PaymentPickerDialog
        open={paymentPickerVisible}
        onClose={() => setPaymentPickerVisible(false)}
        channels={paymentChannels}
        onSelectChannel={handleCheckout}
      />

      <VariantSelector
        open={variantSelectorVisible}
        product={productForVariantSelection}
        onClose={() => setVariantSelectorVisible(false)}
        onSelect={handleVariantSelect}
      />

      <CartDrawer
        open={cartDrawerVisible}
        onClose={() => setCartDrawerVisible(false)}
        onCheckout={handleCheckoutClick}
      />
    </Box>
  );
};

export default NewSale;
