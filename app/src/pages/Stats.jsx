import React, { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Box, Card, CardContent, List, ListItem, ListItemText, Typography, CircularProgress } from '@mui/material';

const Stats = () => {
  const orders = useLiveQuery(() => db.orders.where('status').equals('completed').toArray(), []);
  const products = useLiveQuery(() => db.products.toArray(), []);
  const channels = useLiveQuery(() => db.paymentChannels.toArray(), []);

  const stats = useMemo(() => {
    if (!orders || !products || !channels) return null;

    // 1. Key Metrics
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalOrders = orders.length;

    // 2. Channel Stats
    const channelStats = channels.map(channel => {
      const channelOrders = orders.filter(o => o.paymentChannelId === channel.id);
      return {
        id: channel.id,
        name: channel.name,
        orderCount: channelOrders.length,
        totalAmount: channelOrders.reduce((sum, o) => sum + o.totalAmount, 0),
      };
    });

    // 3. Top 5 Products
    const productSales = new Map();
    orders.forEach(order => {
      order.items.forEach(item => {
        const currentQty = productSales.get(item.productId) || 0;
        productSales.set(item.productId, currentQty + item.quantity);
      });
    });
    
    const topProducts = [...productSales.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([productId, quantity]) => {
        const product = products.find(p => p.id === productId);
        return {
          name: product ? product.name : '未知产品',
          quantity,
        };
      });

    // 4. Gifted Value
    const giftedValue = orders
      .flatMap(o => o.items)
      .filter(item => item.isGift)
      .reduce((sum, item) => sum + item.price * item.quantity, 0);

    return {
      totalRevenue,
      totalOrders,
      channelStats,
      topProducts,
      giftedValue,
    };
  }, [orders, products, channels]);

  if (!stats) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
        </Box>
    );
  }
  
  const { totalRevenue, totalOrders, channelStats, topProducts, giftedValue } = stats;

  return (
    <Box sx={{ p: 2 }}>
        <Typography variant="h5" sx={{ mb: 2, textAlign: 'center' }}>
            统计
        </Typography>
      <Card>
        <CardContent>
            <Typography variant="h6" gutterBottom>关键指标</Typography>
            <List dense>
                <ListItem>
                    <ListItemText primary="总收入" />
                    <Typography variant="body1">¥ {totalRevenue.toFixed(2)}</Typography>
                </ListItem>
                <ListItem>
                    <ListItemText primary="总订单数" />
                    <Typography variant="body1">{totalOrders}</Typography>
                </ListItem>
                <ListItem>
                    <ListItemText primary="赠送总价值" />
                    <Typography variant="body1">¥ {giftedValue.toFixed(2)}</Typography>
                </ListItem>
            </List>
        </CardContent>
      </Card>

      <Card sx={{ mt: 2 }}>
        <CardContent>
            <Typography variant="h6" gutterBottom>渠道统计</Typography>
            <List dense>
            {channelStats.map(channel => (
                <ListItem key={channel.id}>
                    <ListItemText primary={`${channel.name} (${channel.orderCount} 笔)`} />
                    <Typography variant="body1">¥ {channel.totalAmount.toFixed(2)}</Typography>
                </ListItem>
            ))}
            </List>
        </CardContent>
      </Card>

      <Card sx={{ mt: 2 }}>
        <CardContent>
            <Typography variant="h6" gutterBottom>热销产品 Top 5</Typography>
            {topProducts.length > 0 ? (
                <List dense>
                    {topProducts.map((product, index) => (
                    <ListItem key={index}>
                        <ListItemText primary={product.name} />
                        <Typography variant="body2">售出 {product.quantity} 件</Typography>
                    </ListItem>
                    ))}
                </List>
            ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>暂无销售记录</Typography>
            )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Stats;
