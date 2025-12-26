import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Fab, Typography, Box } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNotification } from '../NotificationContext';
import ProductModal from './ProductModal';
import PageHeader from '../components/PageHeader';

const Inventory = () => {
  const { showNotification } = useNotification();
  const products = useLiveQuery(() => db.products.orderBy('createdAt').reverse().toArray(), []);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await db.products.delete(id);
      showNotification('已删除', 'success');
    } catch (error) {
      console.error('Failed to delete product:', error);
      showNotification('删除失败', 'error');
    }
  };
  
  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
  }

  return (
    <>
      <PageHeader title="库存" />
      <Box sx={{ paddingBottom: '80px' }}> {/* Padding for the FAB */}
        {products && products.length > 0 ? (
          <List>
            {products.map(product => (
              <ListItem 
              key={product.id} 
              divider
              sx={{ pr: '96px' }} // Add padding to the right to avoid overlap with secondary action
            >
                <ListItemText
                  primary={product.name}
                  secondary={
                    <Box component="span">
                      {product.description && (
                        <Typography component="p" variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                          {product.description}
                        </Typography>
                      )}
                      <Typography component="span" variant="body2" color="text.primary">
                        总库存: {product.stock || 0}
                      </Typography>
                      {product.variants && product.variants.length > 0 ? (
                        <Box component="div" sx={{ mt: 1, pl: 1, borderLeft: '2px solid #eee' }}>
                          {product.variants.map((variant, index) => (
                            <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography component="span" variant="body2" color="text.secondary">
                                {variant.name}
                              </Typography>
                              <Typography component="span" variant="body2" color="text.secondary">
                                库存: {variant.stock}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      ) : null}
                    </Box>
                  }
                  secondaryTypographyProps={{ component: 'div' }}
                />
                <ListItemSecondaryAction>
                  <IconButton edge="end" aria-label="edit" onClick={() => handleEdit(product)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(product.id)}>
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        ) : (
          <Box sx={{ textAlign: 'center', mt: 8, p: 2 }}>
              <Typography variant="subtitle1">还没有产品，快去添加吧</Typography>
              <Typography variant="body2" color="text.secondary">小贴士：产品列表支持编辑和删除哦！</Typography>
          </Box>
        )}
      </Box>
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed', // Use fixed to position relative to viewport
          bottom: 80,
          right: 24,
        }}
        onClick={handleAddProduct}
      >
        <AddIcon />
      </Fab>
      
      <ProductModal
        key={editingProduct ? editingProduct.id : 'add-new-product'}
        open={modalOpen}
        onClose={handleCloseModal}
        product={editingProduct}
      />
    </>
  );
};

export default Inventory;
