import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, IconButton, Typography, FormControlLabel, Checkbox, Autocomplete } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { db } from '../db';
import { useNotification } from '../NotificationContext';

const cartesian = (...a) => a.reduce((acc, val) => acc.flatMap(d => val.map(e => [d, e].flat())));

const EditProductModal = ({ open, onClose, product }) => {
  const { showNotification } = useNotification();
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [stock, setStock] = useState('');
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
    if (open && product) {
      setId(product.id || '');
      setName(product.name || '');
      setPrice(product.price ? String(product.price) : '');
      setDescription(product.description || '');
      
      const productAttributes = product.attributes || [];
      setAttributes(productAttributes);
      
      // Keep stock values as strings for the input fields
      const productVariants = (product.variants || []).map(v => ({ ...v, stock: String(v.stock) }));
      setVariants(productVariants);

      const hasAttributes = productAttributes.length > 0;
      setShowAttributes(hasAttributes);
      
      if (!hasAttributes) {
          setStock(product.stock ? String(product.stock) : '');
      } else {
          setStock('');
      }
      setShowVariants(hasAttributes && productVariants.length > 0);
    }
  }, [open, product]);

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
        const existingVariant = variants.find(v => v.name === variantName);
        return {
            name: variantName,
            attributes: comboArray,
            stock: existingVariant ? existingVariant.stock : '', // Preserve existing stock string
        };
    });

    setVariants(newVariants);
    setShowVariants(true);
  };

  const handleVariantStockChange = (index, value) => {
    if (/^\d*$/.test(value)) {
        const newVariants = [...variants];
        newVariants[index].stock = value;
        setVariants(newVariants);
    }
  };
  
  const totalStock = useMemo(() => {
    if (!showAttributes) {
        return parseInt(stock, 10) || 0;
    }
    if (showVariants) {
      return variants.reduce((acc, variant) => acc + (parseInt(variant.stock, 10) || 0), 0);
    }
    return 0;
  }, [variants, showVariants, showAttributes, stock]);

  const handleSubmit = async () => {
    if (!name || !price) {
      showNotification('请填写产品名称和价格', 'warning');
      return;
    }

    const finalStock = parseInt(stock, 10) || 0;
    if (showAttributes && !showVariants) {
      showNotification('请生成子属性规格', 'warning');
      return;
    }

    try {
      const trimmedName = name.trim();
      const existingProduct = await db.products.where('name').equalsIgnoreCase(trimmedName).first();
      if (existingProduct && existingProduct.id !== id) {
        showNotification('已存在同名商品', 'error');
        return;
      }

      const productData = {
        name: trimmedName,
        price: parseFloat(price),
        description,
        attributes: showAttributes ? attributes.filter(attr => attr.key && attr.value) : [],
        variants: showAttributes ? variants.map(v => ({ ...v, stock: parseInt(v.stock, 10) || 0 })) : [],
        stock: showAttributes ? totalStock : finalStock,
      };
      
      await db.products.update(id, productData);
      showNotification('产品更新成功', 'success');
      onClose();
    } catch (error) {
      console.error('Failed to update product:', error);
      showNotification(`产品更新失败: ${error.message}`, 'error');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>编辑产品</DialogTitle>
      <DialogContent>
        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField label="产品名称" value={name} onChange={e => setName(e.target.value)} fullWidth />
          <TextField label="销售价格" type="number" value={price} onChange={e => setPrice(e.target.value)} fullWidth />
          
          <TextField 
            label="库存"
            type="number"
            value={stock}
            onChange={e => {
                if (/^\d*$/.test(e.target.value)) {
                    setStock(e.target.value);
                }
            }}
            fullWidth
            disabled={showAttributes}
            helperText={showAttributes ? "勾选子属性后，请在下方设置各规格的库存" : "设置商品总库存。添加子属性后，此项将无效。"}
          />

          <TextField label="文字描述" multiline rows={3} value={description} onChange={e => setDescription(e.target.value)} fullWidth />
          
          <FormControlLabel
            control={<Checkbox checked={showAttributes} onChange={(e) => {
                setShowAttributes(e.target.checked);
                if (!e.target.checked) {
                    setShowVariants(false);
                    setAttributes([]);
                    setVariants([]);
                    setStock(product.stock ? String(product.stock) : '');
                } else {
                    setStock('');
                }
            }} />}
            label="编辑子属性 (多规格)"
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
              <Button onClick={generateVariants} variant="contained" color="secondary" sx={{ mt: 1 }} disabled={attributes.length === 0}>
                {showVariants ? '重新生成规格' : '生成规格'}
              </Button>
            </Box>
          )}

          {showAttributes && showVariants && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, border: '1px solid #ccc', p: 2, borderRadius: 1, mt: 2 }}>
              <Typography variant="subtitle2">库存设置 (总库存: {totalStock})</Typography>
              {variants.map((variant, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1.5,
                  borderBottom: index < variants.length - 1 ? '1px solid #eee' : 'none',
                  pb: 1,
                  mb: 1,
                }}>
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
        <Button onClick={handleSubmit} variant="contained">保存</Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditProductModal;
