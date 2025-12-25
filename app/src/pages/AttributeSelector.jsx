import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';

const AttributeSelector = ({ open, product, onConfirm, onClose }) => {
  const [selectedAttributes, setSelectedAttributes] = useState({});

  // Reset state when product changes
  useEffect(() => {
    setSelectedAttributes({});
  }, [open, product]);

  const handleConfirm = () => {
    const attributesAsArray = Object.keys(selectedAttributes).map(key => ({
      key: key,
      value: selectedAttributes[key],
    }));
    onConfirm(product, attributesAsArray);
    onClose();
  };

  if (!product || !product.attributes || product.attributes.length === 0) {
    return null;
  }
  
  const allAttributesSelected = product.attributes.every(attr => selectedAttributes[attr.key]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>选择 {product.name} 的属性</DialogTitle>
      <DialogContent>
        <Box component="div" sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          {product.attributes.map(attr => (
            <FormControl fullWidth key={attr.key}>
              <InputLabel id={`${attr.key}-select-label`}>{attr.key}</InputLabel>
              <Select
                labelId={`${attr.key}-select-label`}
                label={attr.key}
                value={selectedAttributes[attr.key] || ''}
                onChange={e => setSelectedAttributes(prev => ({...prev, [attr.key]: e.target.value}))}
              >
                {(attr.value || '').split(',').map(option => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button onClick={handleConfirm} variant="contained" disabled={!allAttributesSelected}>
          确定
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AttributeSelector;
