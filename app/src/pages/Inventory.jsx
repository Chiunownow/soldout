import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { List, Empty, FloatingBubble } from 'antd-mobile';
import { AddOutline } from 'antd-mobile-icons';
import AddProductModal from './AddProductModal';

const Inventory = () => {
  const products = useLiveQuery(() => db.products.toArray(), []);
  const [modalVisible, setModalVisible] = useState(false);

  const handleAddProduct = () => {
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  return (
    <div>
      {products && products.length > 0 ? (
        <List header="产品列表">
          {products.map(product => (
            <List.Item key={product.id} description={`库存: ${product.stock || 0}`}>
              {product.name}
            </List.Item>
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
      <AddProductModal visible={modalVisible} onClose={handleCloseModal} />
    </div>
  );
};

export default Inventory;
