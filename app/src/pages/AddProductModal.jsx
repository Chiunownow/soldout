import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, IconButton, Typography, FormControlLabel, Checkbox, Autocomplete } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { db } from '../db';
import { useNotification } from '../NotificationContext';

// Helper function to generate cartesian product of attributes
const cartesian = (...a) => a.reduce((acc, val) => acc.flatMap(d => val.map(e => [d, e].flat())));

const AddProductModal = ({ open, onClose }) => {
  const { showNotification } = useNotification();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [stock, setStock] = useState(''); // Reintroduced for simple products
  const [attributes, setAttributes] = useState([]);
  const [variants, setVariants] = useState([]);
  const [showAttributes, setShowAttributes] = useState(false);
  const [showVariants, setShowVariants] = useState(false);

  const attributeNameOptions = ['尺码', '颜色'];
  const predefinedAttributeValues = {
    '尺码': 'S M L XL',
    '颜色': '黑 白',
  };

  useEffect(() => {
    if (open) {
      // Reset state when modal opens
      setName('');
      setPrice('');
      setDescription('');
      setStock(''); // Reset stock
      setAttributes([]);
      setVariants([]);
      setShowAttributes(false);
      setShowVariants(false);
    }
  }, [open]);

  const handleAttributeChange = (index, field, value) => {
    const newAttributes = [...attributes];
    const oldKey = newAttributes[index].key;
    newAttributes[index][field] = value;

    if (field === 'key' && value !== oldKey) {
        if (predefinedAttributeValues[value]) {
            newAttributes[index].value = predefinedAttributeValues[value];
        }
    }
    setAttributes(newAttributes);
    // Hide variants if attributes change
    setShowVariants(false);
  };

  const addAttributeField = () => {
    setAttributes([...attributes, { key: '', value: '' }]);
  };

  const removeAttributeField = (index) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };
  
  const generateVariants = () => {
    const validAttributes = attributes.filter(attr => attr.key && attr.value);
    if (validAttributes.length === 0) {
      showNotification('请至少添加一个有效的子属性', 'warning');
      return;
    }

    const attributeValues = validAttributes.map(attr => 
      attr.value.split(' ').map(val => ({ key: attr.key, value: val }))
    );
    
    const combinations = cartesian(...attributeValues);
    
    const newVariants = combinations.map(combo => {
        const comboArray = Array.isArray(combo) ? combo : [combo];
        const variantName = comboArray.map(c => `${c.key}:${c.value}`).join(' / ');
        return {
            name: variantName,
            attributes: comboArray,
            stock: 0,
        };
    });

    setVariants(newVariants);
    setShowVariants(true);
  };

  const handleVariantStockChange = (index, value) => {
    const newVariants = [...variants];
    newVariants[index].stock = parseInt(value, 10) || 0;
    setVariants(newVariants);
  };
  
  const totalStock = useMemo(() => {
    if (!showAttributes) {
        return parseInt(stock, 10) || 0; // If no attributes, use the simple stock field
    }
    if (showVariants) {
      return variants.reduce((acc, variant) => acc + variant.stock, 0);
    }
    return 0;
  }, [variants, showVariants, showAttributes, stock]);

  const handleSubmit = async () => {
    if (!name || !price) {
      showNotification('请填写产品名称和价格', 'warning');
      return;
    }

    if (!showAttributes) { // For simple products
        if (!stock || parseInt(stock, 10) <= 0) {
            showNotification('请填写产品库存', 'warning');
            return;
        }
    } else { // For products with attributes
        if (!showVariants) {
            showNotification('请生成子属性规格并填写库存', 'warning');
            return;
        }
        if (totalStock <= 0) {
            showNotification('请至少为一种规格填写大于0的库存', 'warning');
            return;
        }
    }

    try {
      const productData = {
        name,
        price: parseFloat(price),
        description,
        attributes: showAttributes ? attributes.filter(attr => attr.key && attr.value) : [],
        variants: showAttributes ? variants : [], // Only save variants if attributes are shown
        stock: totalStock,
        createdAt: new Date(),
      };
      
      await db.products.add(productData);
      showNotification('产品添加成功', 'success');
      onClose();
    } catch (error) {
      console.error('Failed to add product:', error);
      showNotification(`产品添加失败: ${error.message}`, 'error');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>添加新产品</DialogTitle>
      <DialogContent>
        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField label="产品名称" placeholder="例如：T恤" value={name} onChange={e => setName(e.target.value)} fullWidth />
          <TextField label="销售价格" placeholder="例如：99.00" type="number" value={price} onChange={e => setPrice(e.target.value)} fullWidth />
          
          {!showAttributes && ( // Show simple stock field if no attributes
              <TextField label="初始库存" placeholder="例如：100" type="number" value={stock} onChange={e => setStock(e.target.value)} fullWidth />
          )}

          <TextField label="文字描述" placeholder="可选" multiline rows={3} value={description} onChange={e => setDescription(e.target.value)} fullWidth />
          
          <FormControlLabel
            control={<Checkbox checked={showAttributes} onChange={(e) => {
                setShowAttributes(e.target.checked);
                if (!e.target.checked) {
                    setShowVariants(false);
                    setAttributes([]);
                    setVariants([]);
                } else {
                    setStock(''); // Clear simple stock if attributes are enabled
                }
            }} />}
            label="添加子属性 (多规格)"
          />

          {showAttributes && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, border: '1px solid #eee', p: 2, borderRadius: 1 }}>
              <Typography variant="subtitle2">定义属性</Typography>
              {attributes.map((attr, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Autocomplete
                    freeSolo
                    options={attributeNameOptions}
                    value={attr.key}
                    onChange={(event, newValue) => handleAttributeChange(index, 'key', newValue)}
                    onInputChange={(event, newInputValue) => handleAttributeChange(index, 'key', newInputValue)}
                    renderInput={(params) => <TextField {...params} label="属性名称" placeholder="例如: 颜色" sx={{ flex: 1 }} />}
                  />
                  <TextField
                    label="属性值 (用空格分隔)"
                    placeholder="例如: 黑 白"
                    value={attr.value}
                    onChange={e => handleAttributeChange(index, 'value', e.target.value)}
                    sx={{ flex: 1 }}
                  />
                  <IconButton onClick={() => removeAttributeField(index)} aria-label="移除属性"><RemoveCircleOutlineIcon /></IconButton>
                </Box>
              ))}
              <Button onClick={addAttributeField} startIcon={<AddCircleOutlineIcon />} variant="outlined" size="small">添加另一属性</Button>
              <Button onClick={generateVariants} variant="contained" color="secondary" sx={{ mt: 1 }} disabled={attributes.length === 0}>生成规格</Button>
            </Box>
          )}

          {showAttributes && showVariants && ( // Only show variants if attributes are also shown
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, border: '1px solid #ccc', p: 2, borderRadius: 1, mt: 2 }}>
              <Typography variant="subtitle2">库存设置 (总库存: {totalStock})</Typography>
              {variants.map((variant, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Typography sx={{ flex: 1, fontSize: '0.9rem' }}>{variant.name}</Typography>
                  <TextField
                    label="库存"
                    type="number"
                    value={variant.stock}
                    onChange={e => handleVariantStockChange(index, e.target.value)}
                    sx={{ width: '100px' }}
                    size="small"
                  />
                </Box>
              ))}
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
