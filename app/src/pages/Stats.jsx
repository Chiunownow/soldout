import React, { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Card, List, Empty } from 'antd-mobile';

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
    return <Empty description="正在加载统计数据..." style={{ padding: '64px 0' }} />;
  }
  
  const { totalRevenue, totalOrders, channelStats, topProducts, giftedValue } = stats;

  return (
    <div style={{ padding: '12px' }}>
      <Card title="关键指标">
        <List>
          <List.Item extra={`¥ ${totalRevenue.toFixed(2)}`}>总收入</List.Item>
          <List.Item extra={totalOrders}>总订单数</List.Item>
          <List.Item extra={`¥ ${giftedValue.toFixed(2)}`}>赠送总价值</List.Item>
        </List>
      </Card>

      <Card title="渠道统计" style={{ marginTop: '12px' }}>
        <List>
          {channelStats.map(channel => (
            <List.Item key={channel.id} extra={`¥ ${channel.totalAmount.toFixed(2)}`}>
              {channel.name} ({channel.orderCount} 笔)
            </List.Item>
          ))}
        </List>
      </Card>

      <Card title="热销产品 Top 5" style={{ marginTop: '12px' }}>
        {topProducts.length > 0 ? (
          <List>
            {topProducts.map((product, index) => (
              <List.Item key={index} extra={`售出 ${product.quantity} 件`}>
                {product.name}
              </List.Item>
            ))}
          </List>
        ) : (
          <Empty description="暂无销售记录" />
        )}
      </Card>
    </div>
  );
};

export default Stats;
