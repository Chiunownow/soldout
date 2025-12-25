import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Fab, Typography, Box } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddProductModal from './AddProductModal';
import { useNotification } from '../NotificationContext';
import EditProductModal from './EditProductModal';

const Inventory = () => {
  const { showNotification } = useNotification();
  const products = useLiveQuery(() => db.products.toArray(), []);
  
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const handleAddProduct = () => {
    setAddModalVisible(true);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setEditModalVisible(true);
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

  return (
    <Box sx={{ paddingBottom: '80px' }}> {/* Add padding to avoid overlap with FAB */}
      {products && products.length > 0 ? (
        <List subheader={<Typography variant="h6" sx={{ padding: 2 }}>产品列表</Typography>}>
          {products.map(product => (
            <ListItem key={product.id} divider>
              <ListItemText
                primary={product.name}
                secondary={
                  <Box component="span">
                    <Typography component="span" variant="body2" color="text.primary">
                      库存: {product.stock || 0}
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
        <Box sx={{ textAlign: 'center', mt: 8 }}>
            <Typography variant="subtitle1">还没有产品，快去添加吧</Typography>
            <Typography variant="body2" color="text.secondary">小贴士：产品列表支持编辑和删除哦！</Typography>
        </Box>
      )}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 80,
          right: 24,
        }}
        onClick={handleAddProduct}
      >
        <AddIcon />
      </Fab>
      
      <AddProductModal 
        open={addModalVisible} 
        onClose={() => setAddModalVisible(false)} 
      />
      
      <EditProductModal
        open={editModalVisible}
        onClose={() => {
          setEditModalVisible(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
      />
    </Box>
  );
};

export default Inventory;
