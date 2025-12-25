import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { List, Button, SwipeAction, Dialog, Toast, Tag } from 'antd-mobile';

const Settings = () => {
  const channels = useLiveQuery(() => db.paymentChannels.toArray(), []);

  const handleAddChannel = async () => {
    const result = await Dialog.prompt({
      content: '请输入新的支付渠道名称',
      placeholder: '例如：银行卡',
    });

    if (result && result.text.trim()) {
      const name = result.text.trim();
      try {
        await db.paymentChannels.add({ name, isSystemChannel: false });
        Toast.show({ icon: 'success', content: '添加成功' });
      } catch (error) {
        console.error('Failed to add channel:', error);
        Toast.show({ icon: 'fail', content: '添加失败' });
      }
    }
  };

  const handleDeleteChannel = async (id) => {
    try {
      await db.paymentChannels.delete(id);
      Toast.show({ icon: 'success', content: '删除成功' });
    } catch (error) {
      console.error('Failed to delete channel:', error);
      Toast.show({ icon: 'fail', content: '删除失败' });
    }
  };

  const handleExport = async () => {
    Toast.show({ icon: 'loading', content: '正在导出...', duration: 0 });
    try {
      const allOrders = await db.orders.orderBy('createdAt').toArray();
      if (allOrders.length === 0) {
        Toast.show({ content: '没有订单可导出' });
        return;
      }

      const allChannels = await db.paymentChannels.toArray();
      const channelMap = new Map(allChannels.map(c => [c.id, c.name]));

      let csvContent = "data:text/csv;charset=utf-8,";
      const headers = [
        "订单ID", "创建时间", "总金额", "状态", "支付渠道", 
        "商品名称", "数量", "单价", "是否赠品"
      ];
      csvContent += headers.join(",") + "\r\n";

      allOrders.forEach(order => {
        order.items.forEach(item => {
          const row = [
            order.id,
            new Date(order.createdAt).toLocaleString(),
            order.totalAmount.toFixed(2),
            order.status,
            channelMap.get(order.paymentChannelId) || '未知',
            `"${item.name.replace(/"/g, '""')}"`, // Handle quotes in name
            item.quantity,
            item.price.toFixed(2),
            item.isGift ? '是' : '否'
          ];
          csvContent += row.join(",") + "\r\n";
        });
      });

      Toast.clear();
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `orders_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      Toast.clear();
      console.error('Failed to export data:', error);
      Toast.show({ icon: 'fail', content: '导出失败' });
    }
  };

  return (
    <div style={{ padding: '12px' }}>
      <Card title="支付渠道管理">
        <List>
          {channels && channels.map(channel => (
            <SwipeAction
              key={channel.id}
              rightActions={channel.isSystemChannel ? [] : [
                {
                  key: 'delete',
                  text: '删除',
                  color: 'danger',
                  onClick: () => handleDeleteChannel(channel.id),
                },
              ]}
            >
              <List.Item>
                {channel.name}
                {channel.isSystemChannel && <Tag color='primary' fill='outline' style={{marginLeft: '8px'}}>系统</Tag>}
              </List.Item>
            </SwipeAction>
          ))}
        </List>
        <Button block onClick={handleAddChannel} style={{ marginTop: '12px' }}>
          添加新渠道
        </Button>
      </Card>

      <Card title="数据管理" style={{ marginTop: '12px' }}>
        <Button block color="primary" fill="outline" onClick={handleExport}>
          导出全部订单 (CSV)
        </Button>
      </Card>
    </div>
  );
};

export default Settings;
