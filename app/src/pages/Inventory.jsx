import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { List, Empty, FloatingBubble, SwipeAction, Toast } from 'antd-mobile';
import { AddOutline } from 'antd-mobile-icons';
import AddProductModal from './AddProductModal';
import EditProductModal from './EditProductModal';

const Inventory = () => {
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
      Toast.show({
        content: '已删除',
        position: 'bottom',
      });
    } catch (error) {
      console.error('Failed to delete product:', error);
      Toast.show({
        content: '删除失败',
        position: 'bottom',
      });
    }
  };

  return (
    <div>
      {products && products.length > 0 ? (
        <List header="产品列表">
          {products.map(product => (
            <SwipeAction
              key={product.id}
              rightActions={[
                {
                  key: 'edit',
                  text: '编辑',
                  color: 'primary',
                  onClick: () => handleEdit(product),
                },
                {
                  key: 'delete',
                  text: '删除',
                  color: 'danger',
                  onClick: () => handleDelete(product.id),
                },
              ]}
            >
              <List.Item
                description={
                  <div>
                    <div>库存: {product.stock || 0}</div>
                    {product.attributes && product.attributes.map(attr => (
                      <div key={attr.key}>{`${attr.key}: ${attr.value}`}</div>
                    ))}
                  </div>
                }
              >
                {product.name}
              </List.Item>
            </SwipeAction>
          ))}
        </List>
      ) : (
        <Empty description="还没有产品，快去添加吧" />
      )}
      <FloatingBubble
        style={{
          '--initial-position-bottom': '80px',
          '--initial-position-right': '24px',
        }}
        onClick={handleAddProduct}
      >
        <AddOutline fontSize={32} />
      </FloatingBubble>
      
      <AddProductModal 
        visible={addModalVisible} 
        onClose={() => setAddModalVisible(false)} 
      />
      
      <EditProductModal
        visible={editModalVisible}
        onClose={() => {
          setEditModalVisible(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
      />
    </div>
  );
};

export default Inventory;
