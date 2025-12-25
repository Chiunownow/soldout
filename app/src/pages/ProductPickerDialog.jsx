import React from 'react';
import { Dialog, DialogTitle, List, ListItem, ListItemButton, ListItemText } from '@mui/material';

const ProductPickerDialog = ({ open, onClose, products, onSelectProduct }) => {
  const handleSelect = (productId) => {
    onSelectProduct(productId);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>选择产品</DialogTitle>
      <List sx={{ pt: 0 }}>
        {(products || []).map((product) => (
          <ListItem disableGutters key={product.id}>
            <ListItemButton onClick={() => handleSelect(product.id)}>
              <ListItemText primary={product.name} />
            </ListItemButton>
          </ListItem>
        ))}
        {(!products || products.length === 0) && (
            <ListItem>
                <ListItemText primary="没有可供选择的产品" sx={{ textAlign: 'center' }} />
            </ListItem>
        )}
      </List>
    </Dialog>
  );
};

export default ProductPickerDialog;
