import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { List, ListItem, ListItemButton, ListItemText, Typography, Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, Chip } from '@mui/material';

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
    setDetailsModalVisible(false);
    setCancelDialogVisible(true);
  };
  
  const executeCancelOrder = async () => {
    if (!selectedOrder || selectedOrder.status !== 'completed') return;

    try {
      await db.orders.update(selectedOrder.id, { status: 'cancelled' });
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
      setCancelDialogVisible(false);
      setSelectedOrder(null);
    }
  };

  const renderOrderStatus = (status) => {
    switch (status) {
      case 'completed':
        return <Chip label="已完成" color="success" size="small" />;
      case 'cancelled':
        return <Chip label="已取消" color="error" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ p: 2, textAlign: 'center' }}>
        订单历史
      </Typography>
      {orders && orders.length > 0 ? (
        <List>
          {orders.map(order => (
            <ListItemButton key={order.id} onClick={() => handleOrderClick(order)}>
              <ListItemText
                primary={new Date(order.createdAt).toLocaleString()}
                secondary={renderOrderStatus(order.status)}
              />
              <Typography variant="body1">¥ {order.totalAmount.toFixed(2)}</Typography>
            </ListItemButton>
          ))}
        </List>
      ) : (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
            <Typography variant="subtitle1">还没有订单记录</Typography>
        </Box>
      )}

      <Dialog open={detailsModalVisible} onClose={() => setDetailsModalVisible(false)} fullWidth maxWidth="xs">
        <DialogTitle>订单详情</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box sx={{ mt: 2 }}>
              <Typography gutterBottom><strong>订单号:</strong> {selectedOrder.id}</Typography>
              <Typography gutterBottom><strong>时间:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</Typography>
              <Typography gutterBottom><strong>总金额:</strong> ¥ {selectedOrder.totalAmount.toFixed(2)}</Typography>
              <Typography component="div" gutterBottom><strong>状态:</strong> {renderOrderStatus(selectedOrder.status)}</Typography>
              <List dense subheader={<Typography variant="subtitle2" sx={{ mt: 2 }}>商品列表</Typography>}>
                {selectedOrder.items.map((item, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={item.name} />
                    <Typography variant="body2">
                      {item.isGift && <Chip label="赠品" size="small" sx={{ mr: 1 }} />}
                      x{item.quantity}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setDetailsModalVisible(false)}>关闭</Button>
            {selectedOrder && selectedOrder.status === 'completed' && (
                <Button onClick={openCancelConfirm} color="error">取消订单</Button>
            )}
        </DialogActions>
      </Dialog>

      <Dialog
        open={cancelDialogVisible}
        onClose={() => setCancelDialogVisible(false)}
      >
        <DialogTitle>确认取消订单</DialogTitle>
        <DialogContent>
            <Typography>确定要取消此订单吗？库存将会被回退。</Typography>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setCancelDialogVisible(false)}>点错了</Button>
            <Button onClick={executeCancelOrder} color="error" variant="contained">确定取消</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Orders;
