import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Box, Typography, Card, CardContent, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Button, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Chip, DialogContentText } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNotification } from '../NotificationContext';
import useLongPress from '../useLongPress';

const Settings = () => {
  const { showNotification } = useNotification();
  const channels = useLiveQuery(() => db.paymentChannels.toArray(), []);
  const [addChannelOpen, setAddChannelOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [firstClearConfirmOpen, setFirstClearConfirmOpen] = useState(false);
  const [secondClearConfirmOpen, setSecondClearConfirmOpen] = useState(false);

  const longPressEvents = useLongPress(() => {
    setFirstClearConfirmOpen(true);
  }, () => {
    showNotification('需要长按才能清空数据', 'info');
  });

  const handleAddChannel = async () => {
    if (newChannelName.trim()) {
      try {
        await db.paymentChannels.add({ name: newChannelName.trim(), isSystemChannel: false });
        showNotification('添加成功', 'success');
        setNewChannelName('');
        setAddChannelOpen(false);
      } catch (error) {
        console.error('Failed to add channel:', error);
        showNotification('添加失败', 'error');
      }
    }
  };

  const handleDeleteChannel = async (id) => {
    try {
      await db.paymentChannels.delete(id);
      showNotification('删除成功', 'success');
    } catch (error) {
      console.error('Failed to delete channel:', error);
      showNotification('删除失败', 'error');
    }
  };

  const handleExport = async () => {
    showNotification('正在导出...', 'info');
    try {
      const allOrders = await db.orders.orderBy('createdAt').toArray();
      if (allOrders.length === 0) {
        showNotification('没有订单可导出', 'warning');
        return;
      }
      const allChannels = await db.paymentChannels.toArray();
      const channelMap = new Map(allChannels.map(c => [c.id, c.name]));
      let csvContent = "data:text/csv;charset=utf-8,";
      const headers = ["订单ID", "创建时间", "总金额", "状态", "支付渠道", "商品名称", "数量", "单价", "是否赠品"];
      csvContent += headers.join(",") + "\r\n";
      allOrders.forEach(order => {
        order.items.forEach(item => {
          const row = [
            order.id,
            new Date(order.createdAt).toLocaleString(),
            order.totalAmount.toFixed(2),
            order.status,
            channelMap.get(order.paymentChannelId) || '未知',
            `"${item.name.replace(/"/g, '""')}"`,
            item.quantity,
            item.price.toFixed(2),
            item.isGift ? '是' : '否'
          ];
          csvContent += row.join(",") + "\r\n";
        });
      });
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `orders_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to export data:', error);
      showNotification('导出失败', 'error');
    }
  };

  const handleClearAllData = async () => {
    try {
        setSecondClearConfirmOpen(false);
        await db.delete();
        showNotification('所有数据已清除，应用将刷新', 'success');
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    } catch (error) {
        console.error('Failed to delete database:', error);
        showNotification('清除数据失败', 'error');
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2, textAlign: 'center' }}>
        设置
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>支付渠道管理</Typography>
          <List>
            {channels && channels.map(channel => (
              <ListItem
                key={channel.id}
                secondaryAction={
                  !channel.isSystemChannel && (
                    <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteChannel(channel.id)}>
                      <DeleteIcon />
                    </IconButton>
                  )
                }
              >
                <ListItemText primary={channel.name} />
                {channel.isSystemChannel && <Chip label="系统" size="small" />}
              </ListItem>
            ))}
          </List>
          <Button fullWidth variant="outlined" onClick={() => setAddChannelOpen(true)} sx={{ mt: 2 }}>
            添加新渠道
          </Button>
        </CardContent>
      </Card>

      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>数据管理</Typography>
          <Button fullWidth variant="contained" onClick={handleExport}>
            导出全部订单 (CSV)
          </Button>
        </CardContent>
      </Card>

      <Card sx={{ mt: 2 }}>
        <CardContent>
            <Typography variant="h6" color="error" gutterBottom>危险区域</Typography>
            <Button fullWidth variant="contained" color="error" {...longPressEvents}>
                长按清空所有数据
            </Button>
        </CardContent>
      </Card>
      
      {/* Add Channel Dialog */}
      <Dialog open={addChannelOpen} onClose={() => setAddChannelOpen(false)}>
        <DialogTitle>添加新支付渠道</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="渠道名称"
            type="text"
            fullWidth
            variant="standard"
            value={newChannelName}
            onChange={(e) => setNewChannelName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddChannelOpen(false)}>取消</Button>
          <Button onClick={handleAddChannel}>添加</Button>
        </DialogActions>
      </Dialog>

      {/* First Clear Confirmation */}
      <Dialog open={firstClearConfirmOpen} onClose={() => setFirstClearConfirmOpen(false)}>
        <DialogTitle>确认操作</DialogTitle>
        <DialogContent>
            <DialogContentText>
                您确定要清空所有数据吗？此操作包括所有产品、订单和设置，且无法撤销。
            </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFirstClearConfirmOpen(false)}>取消</Button>
          <Button onClick={() => { setFirstClearConfirmOpen(false); setSecondClearConfirmOpen(true); }} color="error">
            我确定
          </Button>
        </DialogActions>
      </Dialog>

      {/* Second Clear Confirmation */}
      <Dialog open={secondClearConfirmOpen} onClose={() => setSecondClearConfirmOpen(false)}>
        <DialogTitle>最后确认！</DialogTitle>
        <DialogContent>
            <DialogContentText>
                这是最后一次确认。点击下方按钮将 **立即永久删除** 所有应用数据。
            </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSecondClearConfirmOpen(false)}>我再想想</Button>
          <Button onClick={handleClearAllData} variant="contained" color="error">
            删除所有数据
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;

