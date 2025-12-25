import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { List, Empty, Modal, Tag, Dialog } from 'antd-mobile';

const Orders = () => {
  const orders = useLiveQuery(
    () => db.orders.orderBy('createdAt').reverse().toArray(),
    []
  );

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [cancelDialogVisible, setCancelDialogVisible] = useState(false);

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setDetailsModalVisible(true);
  };

  const openCancelConfirm = () => {
    // We close the details modal first to show the confirmation dialog underneath
    setDetailsModalVisible(false);
    setCancelDialogVisible(true);
  };
  
  const executeCancelOrder = async () => {
    if (!selectedOrder || selectedOrder.status !== 'completed') return;

    try {
      // 1. Update order status
      await db.orders.update(selectedOrder.id, { status: 'cancelled' });

      // 2. Roll back stock
      await db.transaction('rw', db.products, async () => {
        for (const item of selectedOrder.items) {
          await db.products.where('id').equals(item.productId).modify(p => {
            p.stock += item.quantity;
          });
        }
      });
      
      window.alert('订单已取消');

    } catch (error) {
      console.error('Failed to cancel order:', error);
      window.alert('操作失败，请重试');
    } finally {
      // Clean up state
      setCancelDialogVisible(false);
      setSelectedOrder(null);
    }
  };

  const renderOrderStatus = (status) => {
    switch (status) {
      case 'completed':
        return <Tag color='success'>已完成</Tag>;
      case 'cancelled':
        return <Tag color='danger'>已取消</Tag>;
      default:
        return <Tag color='default'>{status}</Tag>;
    }
  }

  const modalActions = (order) => {
    const actions = [{ key: 'close', text: '关闭', onClick: () => setDetailsModalVisible(false) }];
    if (order && order.status === 'completed') {
      actions.unshift({
        key: 'cancel',
        text: '取消订单',
        danger: true,
        onClick: openCancelConfirm,
      });
    }
    return actions;
  }

  return (
    <div>
      {orders && orders.length > 0 ? (
        <List header="订单历史">
          {orders.map(order => (
            <List.Item
              key={order.id}
              onClick={() => handleOrderClick(order)}
              extra={`¥ ${order.totalAmount.toFixed(2)}`}
              description={renderOrderStatus(order.status)}
            >
              {new Date(order.createdAt).toLocaleString()}
            </List.Item>
          ))}
        </List>
      ) : (
        <Empty description="还没有订单记录" style={{ padding: '64px 0' }} />
      )}

      <Modal
        visible={detailsModalVisible}
        onClose={() => setDetailsModalVisible(false)}
        title="订单详情"
        content={
          selectedOrder && (
            <div>
              <p><strong>订单号:</strong> {selectedOrder.id}</p>
              <p><strong>时间:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
              <p><strong>总金额:</strong> ¥ {selectedOrder.totalAmount.toFixed(2)}</p>
              <p><strong>状态:</strong> {renderOrderStatus(selectedOrder.status)}</p>
              <List header="商品列表">
                {selectedOrder.items.map((item, index) => (
                  <List.Item key={index} extra={`x${item.quantity}`}>
                    {item.name} {item.isGift && <Tag color='warning'>赠品</Tag>}
                  </List.Item>
                ))}
              </List>
            </div>
          )
        }
        actions={modalActions(selectedOrder)}
      />

      <Dialog
        visible={cancelDialogVisible}
        onClose={() => setCancelDialogVisible(false)}
        content={'确定要取消此订单吗？库存将会被回退。'}
        actions={[
          {
            key: 'cancel',
            text: '点错了',
          },
          {
            key: 'confirm',
            text: '确定取消',
            bold: true,
            danger: true,
            onClick: executeCancelOrder,
          },
        ]}
      />
    </div>
  );
};

export default Orders;
