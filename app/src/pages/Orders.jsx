import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { List, ListItem, ListItemButton, ListItemText, Typography, Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, Chip } from '@mui/material';
import PageHeader from '../components/PageHeader';
import { useNotification } from '../NotificationContext';

const Orders = () => {
  const { showNotification } = useNotification();
  const orders = useLiveQuery(() => db.orders.orderBy('createdAt').reverse().toArray(), []);
  const paymentChannels = useLiveQuery(() => db.paymentChannels.toArray(), []); // Fetch payment channels

  const channelMap = paymentChannels ? new Map(paymentChannels.map(c => [c.id, c.name])) : new Map();

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
          const product = await db.products.get(item.productId);
          if (product) {
            let newStock = product.stock;
            let newVariants = product.variants;

            if (item.variantName && product.variants) {
              let variantFound = false;
              newVariants = product.variants.map(v => {
                if (v.name === item.variantName) {
                  variantFound = true;
                  return { ...v, stock: v.stock + item.quantity };
                }
                return v;
              });

              if (variantFound) {
                 newStock = newVariants.reduce((acc, v) => acc + v.stock, 0);
                 await db.products.update(item.productId, {
                   variants: newVariants,
                   stock: newStock,
                 });
              }
            } else {
              newStock = product.stock + item.quantity;
              await db.products.update(item.productId, { stock: newStock });
            }
          }
        }
      });
      showNotification('订单已取消', 'success');
    } catch (error) {
      console.error('Failed to cancel order:', error);
      showNotification('操作失败，请重试', 'error');
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
    <>
      <PageHeader title="订单历史" />
      {orders && orders.length > 0 ? (
        <List>
          {orders.map(order => (
            <ListItemButton key={order.id} onClick={() => handleOrderClick(order)}>
              <ListItemText
                primary={new Date(order.createdAt).toLocaleString()}
                secondary={
                  <Box component="div">
                    {renderOrderStatus(order.status)}
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'block' }}>
                      渠道: {channelMap.get(order.paymentChannelId) || '未知'}
                    </Typography>
                  </Box>
                }
                secondaryTypographyProps={{ component: 'div' }}
              />
              <Typography variant="body1">¥ {order.totalAmount.toFixed(2)}</Typography>
            </ListItemButton>
          ))}
        </List>
      ) : (
        <Box sx={{ textAlign: 'center', mt: 8, p: 2 }}>
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
              <Typography gutterBottom><strong>支付渠道:</strong> {channelMap.get(selectedOrder.paymentChannelId) || '未知'}</Typography>
              <List dense subheader={<Typography variant="subtitle2" sx={{ mt: 2 }}>商品列表</Typography>}>
                {selectedOrder.items.map((item, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={`${item.name} ${item.variantName || ''}`} />
                    <Typography variant="body2" component="div">
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
    </>
  );
};

export default Orders;