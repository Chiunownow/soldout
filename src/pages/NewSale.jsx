import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { useCart } from '../CartContext';
import { Box, Fab, Badge } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PageHeader from '../components/PageHeader';
import ProductCard from '../components/ProductCard';
import PaymentPickerDialog from './PaymentPickerDialog';
import VariantSelector from './VariantSelector';
import CartDrawer from '../components/CartDrawer';

const NewSale = () => {
  const { cart, handleAddToCart, handleCheckout } = useCart();
  const products = useLiveQuery(() => db.products.orderBy('createdAt').reverse().toArray(), []);
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
      <Box sx={{ 
        p: 2,
        columnCount: 2,
        columnGap: '16px',
        paddingBottom: '80px' // Add padding for the FAB
       }}>
        {products && products.map(product => (
          <ProductCard 
            key={product.id} 
            product={product}
            onClick={() => handleProductClick(product)}
          />
        ))}
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
