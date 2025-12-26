import React, { useState, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { List, Fab, Typography, Box } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNotification } from '../NotificationContext';
import ProductModal from './ProductModal';
import PageHeader from '../components/PageHeader';
import ProductListItem from '../components/ProductListItem';

const Inventory = () => {
  const { showNotification } = useNotification();
  const products = useLiveQuery(() => db.products.orderBy('createdAt').reverse().toArray(), []);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const handleAddProduct = useCallback(() => {
    setEditingProduct(null);
    setModalOpen(true);
  }, []);

  const handleEdit = useCallback((product) => {
    setEditingProduct(product);
    setModalOpen(true);
  }, []);

  const handleDelete = useCallback(async (id) => {
    try {
      await db.products.delete(id);
      showNotification('已删除', 'success');
    } catch (error) {
      console.error('Failed to delete product:', error);
      showNotification('删除失败', 'error');
    }
  }, [showNotification]);
  
  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setEditingProduct(null);
  }, []);

  return (
    <>
      <PageHeader title="库存" />
      <Box sx={{ paddingBottom: '80px' }}> {/* Padding for the FAB */}
        {products && products.length > 0 ? (
          <List>
            {products.map(product => (
              <ProductListItem
                key={product.id}
                product={product}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
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
