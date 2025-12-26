import React, { useEffect, useMemo, useReducer } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, IconButton, Typography, FormControlLabel, Checkbox, Autocomplete, Stepper, Step, StepLabel } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { db } from '../db';
import { useNotification } from '../NotificationContext';

const cartesian = (...a) => a.reduce((acc, val) => acc.flatMap(d => val.map(e => [d, e].flat())));

const initialState = {
  step: 0,
  name: '',
  price: '',
  description: '',
  stock: '',
  attributes: [],
  variants: [],
  showAttributes: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'INITIALIZE_FORM':
      return {
        ...initialState,
        ...action.payload,
      };
    case 'SET_FIELD':
      return { ...state, [action.payload.field]: action.payload.value };
    case 'SET_STEP':
      return { ...state, step: action.payload };
    case 'TOGGLE_SHOW_ATTRIBUTES': {
      const show = action.payload;
      return {
        ...state,
        showAttributes: show,
        step: show ? state.step : 0,
        stock: show ? '' : state.stock,
      };
    }
    case 'UPDATE_ATTRIBUTE': {
      const { index, field, value } = action.payload;
      const newAttributes = [...state.attributes];
      newAttributes[index] = { ...newAttributes[index], [field]: value };
      return { ...state, attributes: newAttributes };
    }
    case 'ADD_ATTRIBUTE':
      return { ...state, attributes: [...state.attributes, { key: '', value: '' }] };
    case 'REMOVE_ATTRIBUTE':
      return { ...state, attributes: state.attributes.filter((_, i) => i !== action.payload) };
    case 'SET_VARIANTS':
      return { ...state, variants: action.payload };
    case 'UPDATE_VARIANT_STOCK': {
      const { index, value } = action.payload;
      const newVariants = [...state.variants];
      newVariants[index] = { ...newVariants[index], stock: value };
      return { ...state, variants: newVariants };
    }
    default:
      return state;
  }
}

const ProductModal = ({ open, onClose, product }) => {
  const { showNotification } = useNotification();
  const isEditMode = !!product;

  const [state, dispatch] = useReducer(reducer, initialState);
  const { step, name, price, description, stock, attributes, variants, showAttributes } = state;

  const stepperSteps = ['基本信息', '定义属性', '设置库存'];
  const attributeNameOptions = ['尺码', '颜色'];
  const predefinedAttributeValues = { '尺码': 'S M L XL', '颜色': '黑 白' };

  useEffect(() => {
    if (open) {
      if (isEditMode && product) {
        const productVariants = (product.variants || []).map(v => ({ ...v, stock: String(v.stock) }));
        const hasAttributes = (product.attributes || []).length > 0;
        dispatch({
          type: 'INITIALIZE_FORM',
          payload: {
            name: product.name || '',
            price: product.price ? String(product.price) : '',
            description: product.description || '',
            attributes: product.attributes || [],
            variants: productVariants,
            showAttributes: hasAttributes,
            stock: hasAttributes ? '' : (product.stock ? String(product.stock) : ''),
          }
        });
      } else {
        dispatch({ type: 'INITIALIZE_FORM', payload: initialState });
      }
    }
  }, [open, product, isEditMode]);

  const handleClose = () => {
    dispatch({ type: 'INITIALIZE_FORM', payload: initialState });
    onClose();
  };

  const handleAttributeChange = (index, field, value) => {
    dispatch({ type: 'UPDATE_ATTRIBUTE', payload: { index, field, value } });
    if (field === 'key') {
      const predefinedValue = predefinedAttributeValues[value] || '';
      dispatch({ type: 'UPDATE_ATTRIBUTE', payload: { index, field: 'value', value: predefinedValue } });
    }
  };

  const generateVariants = () => {
    const validAttributes = attributes.filter(attr => attr.key && attr.value);
    const attributeKeys = validAttributes.map(attr => attr.key);
    const hasDuplicateKeys = new Set(attributeKeys).size !== attributeKeys.length;

    if (hasDuplicateKeys) {
      showNotification('属性名称不能重复', 'error');
      return false;
    }
    if (validAttributes.length === 0) {
      showNotification('请至少添加一个有效的子属性', 'warning');
      return false;
    }

    const attributeValues = validAttributes.map(attr => attr.value.split(' ').map(val => ({ key: attr.key, value: val })));
    const combinations = cartesian(...attributeValues);

    const newVariants = combinations.map(combo => {
      const comboArray = Array.isArray(combo) ? combo : [combo];
      const variantName = comboArray.map(c => `${c.key}:${c.value}`).join(' / ');
      const existingVariant = variants.find(v => v.name === variantName);
      return { name: variantName, attributes: comboArray, stock: existingVariant ? existingVariant.stock : '' };
    });

    dispatch({ type: 'SET_VARIANTS', payload: newVariants });
    return true;
  };

  const totalStock = useMemo(() => {
    if (!showAttributes) return parseInt(stock, 10) || 0;
    return variants.reduce((acc, variant) => acc + (parseInt(variant.stock, 10) || 0), 0);
  }, [variants, showAttributes, stock]);

  const handleNext = () => {
    if (step === 0) {
      if (!name.trim() || !price) {
        showNotification('请填写产品名称和价格', 'warning');
        return;
      }
      if (attributes.length === 0) dispatch({ type: 'ADD_ATTRIBUTE' });
      dispatch({ type: 'SET_STEP', payload: 1 });
    }
    if (step === 1) {
      if (generateVariants()) dispatch({ type: 'SET_STEP', payload: 2 });
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !price) {
        showNotification('请填写产品名称和价格', 'warning');
        return;
    }

    const trimmedName = name.trim();
    const existingProduct = await db.products.where('name').equalsIgnoreCase(trimmedName).first();
    if (existingProduct && (!isEditMode || existingProduct.id !== product.id)) {
        showNotification('已存在同名商品', 'error');
        return;
    }
    
    const validAttributes = attributes.filter(attr => attr.key && attr.value);
    if (showAttributes && validAttributes.length > 0 && variants.length === 0) {
      showNotification('请生成或重新生成子属性规格', 'warning');
      return;
    }

    try {
      const productData = {
        name: trimmedName,
        price: parseFloat(price),
        description,
        attributes: showAttributes ? validAttributes : [],
        variants: showAttributes ? variants.map(v => ({ ...v, stock: parseInt(v.stock, 10) || 0 })) : [],
        stock: showAttributes ? totalStock : (parseInt(stock, 10) || 0),
      };

      if (isEditMode) {
        await db.products.update(product.id, productData);
        showNotification('产品更新成功', 'success');
      } else {
        productData.createdAt = new Date();
        await db.products.add(productData);
        showNotification('产品添加成功', 'success');
      }
      handleClose();
    } catch (error) {
      console.error('Failed to save product:', error);
      showNotification(`产品保存失败: ${error.message}`, 'error');
    }
  };

  const renderStepContent = () => {
    if (!showAttributes) { 
        return (
            <>
                <TextField label="产品名称" placeholder="例如：T恤" value={name} onChange={e => dispatch({ type: 'SET_FIELD', payload: { field: 'name', value: e.target.value } })} fullWidth />
                <TextField label="销售价格" placeholder="例如：99.00" type="number" value={price} onChange={e => dispatch({ type: 'SET_FIELD', payload: { field: 'price', value: e.target.value } })} fullWidth />
                <TextField 
                  label="初始库存" 
                  placeholder="例如：100" 
                  type="number" 
                  value={stock} 
                  onChange={e => { if (/^\d*$/.test(e.target.value)) dispatch({ type: 'SET_FIELD', payload: { field: 'stock', value: e.target.value } }) }}
                  fullWidth 
                  helperText={"设置商品总库存。添加子属性后，此项将无效。"}
                />
                <TextField label="文字描述" placeholder="可选" value={description} onChange={e => dispatch({ type: 'SET_FIELD', payload: { field: 'description', value: e.target.value } })} fullWidth />
            </>
        )
    }
    switch (step) {
      case 0: // Basic Info for stepper
        return (
            <>
                <TextField label="产品名称" placeholder="例如：T恤" value={name} onChange={e => dispatch({ type: 'SET_FIELD', payload: { field: 'name', value: e.target.value } })} fullWidth />
                <TextField label="销售价格" placeholder="例如：99.00" type="number" value={price} onChange={e => dispatch({ type: 'SET_FIELD', payload: { field: 'price', value: e.target.value } })} fullWidth />
                <TextField label="文字描述" placeholder="可选" value={description} onChange={e => dispatch({ type: 'SET_FIELD', payload: { field: 'description', value: e.target.value } })} fullWidth />
            </>
        )
      case 1: // Define Attributes
        return (
            <Box>
                <Typography variant="subtitle2" gutterBottom>定义属性名称和值</Typography>
                {attributes.map((attr, index) => (
                    <Box key={index} sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 2, border: '1px solid #eee', borderRadius: 1, mb: 2, position: 'relative' }}>
                        <Autocomplete 
                            freeSolo 
                            options={attributeNameOptions} 
                            value={attr.key} 
                            onChange={(event, newValue) => handleAttributeChange(index, 'key', newValue)} 
                            onInputChange={(event, newInputValue) => handleAttributeChange(index, 'key', newInputValue)} 
                            renderInput={(params) => <TextField {...params} label="属性名称" fullWidth />} 
                        />
                        <TextField label="属性值 (用空格分隔)" value={attr.value} onChange={e => handleAttributeChange(index, 'value', e.target.value)} fullWidth />
                        <IconButton onClick={() => dispatch({ type: 'REMOVE_ATTRIBUTE', payload: index })} aria-label="移除属性" size="small" sx={{ position: 'absolute', top: -12, right: -12, backgroundColor: 'background.paper', border: '1px solid #eee', '&:hover': { backgroundColor: 'background.paper' } }}>
                            <RemoveCircleOutlineIcon />
                        </IconButton>
                    </Box>
                ))}
                <Button onClick={() => dispatch({ type: 'ADD_ATTRIBUTE' })} startIcon={<AddCircleOutlineIcon />} variant="outlined" size="small">添加另一属性</Button>
            </Box>
        );
      case 2: // Set Stock
        return (
            <Box>
              <Typography variant="subtitle2">为生成的规格设置库存 (总库存: {totalStock})</Typography>
              {variants.map((variant, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1.5 }}>
                  <Typography sx={{ flex: 1, fontSize: '0.9rem' }}>{variant.name}</Typography>
                  <TextField label="库存" type="number" value={variant.stock} onChange={e => { if (/^\d*$/.test(e.target.value)) dispatch({ type: 'UPDATE_VARIANT_STOCK', payload: { index, value: e.target.value } }) }} sx={{ width: '100px' }} size="small" />
                </Box>
              ))}
            </Box>
        );
      default: return null;
    }
  };
  
  const renderActions = () => {
    if (!showAttributes) {
        return <><Button onClick={handleClose}>取消</Button><Button onClick={handleSubmit} variant="contained">{isEditMode ? '保存' : '提交'}</Button></>;
    }
    return <>
        <Button onClick={handleClose}>取消</Button>
        <Box sx={{ flex: '1 1 auto' }} />
        {step > 0 && <Button onClick={() => dispatch({ type: 'SET_STEP', payload: step - 1 })}>上一步</Button>}
        {step < stepperSteps.length - 1 
            ? <Button onClick={handleNext} variant="contained">下一步</Button> 
            : <Button onClick={handleSubmit} variant="contained">{isEditMode ? '保存' : '提交'}</Button>
        }
    </>;
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEditMode ? '编辑产品' : '添加新产品'}</DialogTitle>
      <DialogContent>
        {showAttributes && (
            <Stepper activeStep={step} sx={{ pt: 3, pb: 5 }}>
                {stepperSteps.map(label => (
                    <Step key={label}><StepLabel>{label}</StepLabel></Step>
                ))}
            </Stepper>
        )}
        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: showAttributes ? 0 : 2 }}>
            {renderStepContent()}
            <FormControlLabel
              control={<Checkbox checked={showAttributes} onChange={(e) => dispatch({ type: 'TOGGLE_SHOW_ATTRIBUTES', payload: e.target.checked })} />}
              label={isEditMode ? '编辑子属性 (多规格)' : '添加子属性 (多规格)'}
            />
        </Box>
      </DialogContent>
      <DialogActions>
        {renderActions()}
      </DialogActions>
    </Dialog>
  );
};

export default ProductModal;
