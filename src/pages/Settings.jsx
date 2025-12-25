import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Box, Typography, Card, CardContent, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Button, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Chip, DialogContentText } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import GitHubIcon from '@mui/icons-material/GitHub';
import { useNotification } from '../NotificationContext';
import useLongPress from '../useLongPress';
import PageHeader from '../components/PageHeader';

const Settings = ({ showInstallButton, onInstallClick }) => {
  const { showNotification } = useNotification();
  const channels = useLiveQuery(() => db.paymentChannels.toArray(), []);
  const [addChannelOpen, setAddChannelOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [firstClearConfirmOpen, setFirstClearConfirmOpen] = useState(false);
  const [secondClearConfirmOpen, setSecondClearConfirmOpen] = useState(false);
  const [importConfirmOpen, setImportConfirmOpen] = useState(false);
  const [importData, setImportData] = useState(null);

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
      const headers = ["订单ID", "创建时间", "总金额", "状态", "支付渠道", "商品名称", "规格", "数量", "单价", "是否赠品"];
      csvContent += headers.join(",") + "\r\n";
      allOrders.forEach(order => {
        order.items.forEach(item => {
          const row = [
            order.id,
            new Date(order.createdAt).toLocaleString(),
            order.totalAmount.toFixed(2),
            order.status,
            channelMap.get(order.paymentChannelId) || '未知',
            `"${item.name ? item.name.replace(/"/g, '""') : ''}"`, 
            item.variantName || '',
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

  const handleExportJson = async () => {
    showNotification('正在导出备份...', 'info');
    try {
      const products = await db.products.toArray();
      const orders = await db.orders.toArray();
      const channels = await db.paymentChannels.toArray();
      
      const backupData = {
        products,
        orders,
        paymentChannels: channels,
        __soldout_backup_version__: '1.0', 
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.download = `sold-out-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(href);
      showNotification('备份文件已导出', 'success');

    } catch (error) {
      console.error('Failed to export JSON data:', error);
      showNotification('导出失败', 'error');
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data && data.products && data.orders && data.paymentChannels && data.__soldout_backup_version__) {
          setImportData(data);
          setImportConfirmOpen(true);
        } else {
          showNotification('文件格式无效或已损坏', 'error');
        }
      } catch (error) {
        console.error('Failed to parse import file:', error);
        showNotification('无法解析文件', 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = null;
  };

  const handleConfirmImport = async () => {
    if (!importData) return;

    showNotification('正在导入数据，请稍候...', 'info');
    try {
      await db.transaction('rw', db.products, db.orders, db.paymentChannels, async () => {
        await Promise.all([
          db.products.clear(),
          db.orders.clear(),
          db.paymentChannels.clear(),
        ]);
        await Promise.all([
          db.products.bulkAdd(importData.products),
          db.orders.bulkAdd(importData.orders),
          db.paymentChannels.bulkAdd(importData.paymentChannels),
        ]);
      });
      
      setImportConfirmOpen(false);
      setImportData(null);
      showNotification('数据导入成功，应用将刷新', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error) {
      console.error('Failed to import data:', error);
      showNotification(`导入失败: ${error.message}`, 'error');
      setImportConfirmOpen(false);
      setImportData(null);
    }
  };

  const handleClearAllData = async () => {
    try {
        setSecondClearConfirmOpen(false);
        await db.delete();
        localStorage.removeItem('hasSeenWelcome'); 
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
    <>
      <PageHeader title="设置" />
      <Box sx={{ p: 2 }}>
        {showInstallButton && (
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>安装应用</Typography>
              <Button fullWidth variant="contained" onClick={onInstallClick}>
                添加到主屏幕
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                将此应用安装到您的设备主屏幕，以便快速访问和离线使用。
              </Typography>
            </CardContent>
          </Card>
        )}
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
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Button fullWidth variant="contained" onClick={handleExport}>
                导出订单表格 (CSV)
              </Button>
              <Button fullWidth variant="contained" color="secondary" onClick={handleExportJson}>
                导出备份数据 (JSON)
              </Button>
            </Box>
            <Button fullWidth variant="outlined" component="label">
              导入备份数据 (JSON)
              <input type="file" hidden accept=".json" onChange={handleFileChange} />
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              “导出备份”会生成一个包含所有产品、订单和设置的完整备份文件。“导入备份”会覆盖当前所有数据。
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ mt: 2 }}>
          <CardContent>
              <Typography variant="h6" color="error" gutterBottom>危险区域</Typography>
              <Button fullWidth variant="contained" color="error" {...longPressEvents}>
                  长按清空所有数据
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                此操作将删除本浏览器内所有产品、订单和设置，且无法恢复。
              </Typography>
          </CardContent>
        </Card>

        <Box sx={{ textAlign: 'center', mt: 4, color: 'text.secondary' }}>
          <Typography variant="h6">
            售罄 Sold Out
            <IconButton
              aria-label="GitHub repository"
              onClick={() => window.open('https://github.com/Chiunownow/soldout', '_blank')}
              color="inherit"
              sx={{ ml: 1, verticalAlign: 'middle' }}
            >
              <GitHubIcon fontSize="small" />
            </IconButton>
          </Typography>
          <Typography variant="caption">
            Version: {import.meta.env.VITE_APP_VERSION || 'dev'}
          </Typography>
        </Box>
      </Box>
      
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

      {/* Import Confirmation Dialog */}
      <Dialog open={importConfirmOpen} onClose={() => setImportConfirmOpen(false)}>
        <DialogTitle>确认导入数据</DialogTitle>
        <DialogContent>
            <DialogContentText>
                您确定要导入备份数据吗？这将 **覆盖** 当前应用中的所有产品、订单和设置。此操作无法撤销。
            </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportConfirmOpen(false)}>取消</Button>
          <Button onClick={handleConfirmImport} color="warning">
            确认导入
          </Button>
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
    </>
  );
};

export default Settings;
