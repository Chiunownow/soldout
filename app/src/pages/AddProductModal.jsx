import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, IconButton, Typography, Checkbox, FormControlLabel, Autocomplete } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { db } from '../db';
import { useNotification } from '../NotificationContext';

const AddProductModal = ({ open, onClose }) => {
  const { showNotification } = useNotification();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');
  const [attributes, setAttributes] = useState([]);
  const [showAttributes, setShowAttributes] = useState(false);

  const attributeNameOptions = ['尺码', '颜色'];
  const predefinedAttributeValues = {
    '尺码': 'S M L XL',
    '颜色': '黑 白',
  };

  useEffect(() => {
    if (open) {
      setName('');
      setPrice('');
      setStock('');
      setDescription('');
      setAttributes([]);
      setShowAttributes(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!name || !price || !stock) {
      showNotification('请填写产品名称、价格和库存', 'warning');
      return;
    }
    try {
      const attributesToSave = showAttributes ? attributes.filter(attr => attr.key && attr.value) : [];
      await db.products.add({
        name,
        price: parseFloat(price),
        stock: parseInt(stock, 10),
        description,
        attributes: attributesToSave,
        createdAt: new Date(),
      });
      showNotification('产品添加成功', 'success');
      onClose();
    } catch (error) {
      console.error('Failed to add product:', error);
      showNotification('产品添加失败', 'error');
    }
  };

  const addAttributeField = () => {
    setAttributes([...attributes, { key: '', value: '' }]);
  };

  const removeAttributeField = (index) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  const handleAttributeChange = (index, field, value) => {
    const newAttributes = [...attributes];
    const oldKey = newAttributes[index].key;
    newAttributes[index][field] = value;

    // Auto-fill values if a predefined key is selected
    if (field === 'key' && value !== oldKey) {
        if (predefinedAttributeValues[value]) {
            newAttributes[index].value = predefinedAttributeValues[value];
        }
    }
    setAttributes(newAttributes);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>添加新产品</DialogTitle>
      <DialogContent>
        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField label="产品名称" placeholder="例如：T恤" value={name} onChange={e => setName(e.target.value)} fullWidth />
          <TextField label="销售价格" placeholder="例如：99.00" type="number" value={price} onChange={e => setPrice(e.target.value)} fullWidth />
          <TextField label="初始库存" placeholder="例如：100" type="number" value={stock} onChange={e => setStock(e.target.value)} fullWidth />
          <TextField label="文字描述" placeholder="可选" multiline rows={3} value={description} onChange={e => setDescription(e.target.value)} fullWidth />
          
          <FormControlLabel
            control={<Checkbox checked={showAttributes} onChange={(e) => setShowAttributes(e.target.checked)} />}
            label="添加子属性"
          />

          {showAttributes && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, border: '1px solid #eee', p: 2, borderRadius: 1 }}>
              {attributes.map((attr, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Autocomplete
                    freeSolo
                    options={attributeNameOptions}
                    value={attr.key}
                    onChange={(event, newValue) => {
                      handleAttributeChange(index, 'key', newValue);
                    }}
                    onInputChange={(event, newInputValue) => {
                        handleAttributeChange(index, 'key', newInputValue);
                    }}
                    renderInput={(params) => (
                      <TextField {...params} label="属性名称" placeholder="例如: 颜色" sx={{ flex: 1 }} />
                    )}
                  />
                  <TextField
                    label="属性值"
                    placeholder="用空格分隔, 例如: 黑 白"
                    value={attr.value}
                    onChange={e => handleAttributeChange(index, 'value', e.target.value)}
                    sx={{ flex: 1 }}
                  />
                  <IconButton onClick={() => removeAttributeField(index)}>
                    <RemoveCircleOutlineIcon />
                  </IconButton>
                </Box>
              ))}
              <Button onClick={addAttributeField} startIcon={<AddCircleOutlineIcon />} variant="outlined" size="small">
                添加另一属性
              </Button>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button onClick={handleSubmit} variant="contained">提交</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddProductModal;
