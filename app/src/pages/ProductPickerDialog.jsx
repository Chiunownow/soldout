import React from 'react';
import { Dialog, DialogTitle, List, ListItem, ListItemButton, ListItemText, Typography } from '@mui/material';

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
              <ListItemText 
                primary={product.name} 
                secondary={
                  <React.Fragment>
                    {product.description && <Typography component="span" variant="body2" color="text.secondary">{product.description}</Typography>}
                    <Typography component="span" variant="body2" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      库存: {product.stock || 0}
                    </Typography>
                  </React.Fragment>
                } 
              />
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
