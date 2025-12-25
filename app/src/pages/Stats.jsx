import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Box, Card, CardContent, List, ListItem, ListItemText, Typography, CircularProgress, ToggleButtonGroup, ToggleButton, IconButton } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import PageHeader from '../components/PageHeader';

const Stats = () => {
  const orders = useLiveQuery(() => db.orders.where('status').equals('completed').toArray(), []);
  const products = useLiveQuery(() => db.products.toArray(), []);
  const channels = useLiveQuery(() => db.paymentChannels.toArray(), []);

  const [sortBy, setSortBy] = useState('quantity'); // 'quantity' or 'name'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'

  const stats = useMemo(() => {
    if (!orders || !products || !channels) return null;

    const giftChannelId = channels.find(c => c.name === '赠送')?.id;

    const totalRevenue = orders
      .filter(order => order.paymentChannelId !== giftChannelId)
      .reduce((sum, order) => sum + order.totalAmount, 0);
      
    const totalOrders = orders.length;

    const channelStats = channels.map(channel => {
      const channelOrders = orders.filter(o => o.paymentChannelId === channel.id);
      return {
        id: channel.id,
        name: channel.name,
        orderCount: channelOrders.length,
        totalAmount: channelOrders.reduce((sum, o) => sum + o.totalAmount, 0),
      };
    });

    const productSales = new Map();
    orders.forEach(order => {
      order.items.forEach(item => {
        const name = item.variantName ? `${item.name} (${item.variantName})` : item.name;
        const currentQty = productSales.get(name) || 0;
        productSales.set(name, currentQty + item.quantity);
      });
    });
    
    const allProductSales = [...productSales.entries()].map(([name, quantity]) => ({ name, quantity }));

    const giftedValue = orders.reduce((total, order) => {
      if (order.paymentChannelId === giftChannelId) {
        return total + order.totalAmount;
      }
      if (order.totalAmount === 0) {
        const orderOriginalValue = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        return total + orderOriginalValue;
      }
      const partialGiftValue = order.items
        .filter(item => item.isGift)
        .reduce((sum, item) => sum + item.price * item.quantity, 0);
      return total + partialGiftValue;
    }, 0);

    return {
      totalRevenue,
      totalOrders,
      channelStats,
      allProductSales,
      giftedValue,
    };
  }, [orders, products, channels]);
  
  const sortedProductSales = useMemo(() => {
    if (!stats) return [];
    
    return [...stats.allProductSales].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      let comparison = 0;
      if (typeof aValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else {
        comparison = aValue - bValue;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  }, [stats, sortBy, sortOrder]);

  if (!stats) {
    return (
      <>
        <PageHeader title="统计" />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <CircularProgress />
        </Box>
      </>
    );
  }
  
  const { totalRevenue, totalOrders, channelStats, giftedValue } = stats;

  const handleSortByChange = (event, newSortBy) => {
    if (newSortBy !== null) {
      setSortBy(newSortBy);
    }
  };

  const handleSortOrderToggle = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  return (
    <>
      <PageHeader title="统计" />
      <Box sx={{ p: 2 }}>
        <Card>
          <CardContent>
              <Typography variant="h6" gutterBottom>关键指标</Typography>
              <List dense>
                  <ListItem><ListItemText primary="总收入" /><Typography variant="body1">¥ {totalRevenue.toFixed(2)}</Typography></ListItem>
                  <ListItem><ListItemText primary="总订单数" /><Typography variant="body1">{totalOrders}</Typography></ListItem>
                  <ListItem><ListItemText primary="赠送总价值" /><Typography variant="body1">¥ {giftedValue.toFixed(2)}</Typography></ListItem>
              </List>
          </CardContent>
        </Card>

        <Card sx={{ mt: 2 }}>
          <CardContent>
              <Typography variant="h6" gutterBottom>渠道统计</Typography>
              <List dense>
              {channelStats.map(channel => (
                  <ListItem key={channel.id}><ListItemText primary={`${channel.name} (${channel.orderCount} 笔)`} /><Typography variant="body1">¥ {channel.totalAmount.toFixed(2)}</Typography></ListItem>
              ))}
              </List>
          </CardContent>
        </Card>

        <Card sx={{ mt: 2 }}>
          <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6" gutterBottom component="div">产品销售统计</Typography>
                <Box>
                  <ToggleButtonGroup value={sortBy} exclusive onChange={handleSortByChange} size="small">
                    <ToggleButton value="quantity">销量</ToggleButton>
                    <ToggleButton value="name">名称</ToggleButton>
                  </ToggleButtonGroup>
                  <IconButton onClick={handleSortOrderToggle} size="small" sx={{ ml: 1 }}>
                    {sortOrder === 'desc' ? <ArrowDownwardIcon /> : <ArrowUpwardIcon />}
                  </IconButton>
                </Box>
              </Box>
              {sortedProductSales.length > 0 ? (
                  <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                      {sortedProductSales.map((product, index) => (
                      <ListItem key={index}>
                          <ListItemText primary={product.name} />
                          <Typography variant="body2">售出 {product.quantity} 件</Typography>
                      </ListItem>
                      ))}
                  </List>
              ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>暂无销售记录</Typography>
              )}
          </CardContent>
        </Card>
      </Box>
    </>
  );
};

export default Stats;