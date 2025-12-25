import React from 'react';
import { Dialog, DialogTitle, List, ListItem, ListItemButton, ListItemText, Typography, Box } from '@mui/material';

const VariantSelector = ({ open, product, onSelect, onClose }) => {
  if (!product) {
    return null;
  }

  const handleVariantSelect = (variant) => {
    onSelect(product, variant);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>选择 {product.name} 的规格</DialogTitle>
      <List sx={{ pt: 0 }}>
        {product.variants && product.variants.length > 0 ? (
          product.variants.map((variant, index) => (
            <ListItem disableGutters key={index}>
              <ListItemButton
                onClick={() => handleVariantSelect(variant)}
                disabled={variant.stock <= 0}
              >
                <ListItemText
                  primary={variant.name}
                  secondary={
                    <Typography variant="body2" color={variant.stock <= 0 ? 'error' : 'text.secondary'}>
                      库存: {variant.stock}
                    </Typography>
                  }
                />
              </ListItemButton>
            </ListItem>
          ))
        ) : (
          <ListItem>
            <ListItemText primary="该产品没有可用的规格" sx={{ textAlign: 'center' }} />
          </ListItem>
        )}
      </List>
    </Dialog>
  );
};

export default VariantSelector;
