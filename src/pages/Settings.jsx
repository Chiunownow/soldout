import { blobToDataUrl, dataUrlToBlob } from '../utils/image';
import PageHeader from '../components/PageHeader';
import AddChannelDialog from '../components/settings/AddChannelDialog';
import ImportConfirmDialog from '../components/settings/ImportConfirmDialog';
import ClearDataDialogs from '../components/settings/ClearDataDialogs';

const initialState = {
  activeDialog: null, // 'addChannel', 'importConfirm', 'clearData'
  importData: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'OPEN_DIALOG':
      return { ...state, activeDialog: action.payload };
    case 'CLOSE_DIALOG':
      return { ...state, activeDialog: null, importData: null };
    case 'SET_IMPORT_DATA':
      return { ...state, importData: action.payload };
    default:
      return state;
  }
}

const Settings = ({ showInstallButton, onInstallClick, isDevMode, setActiveKey }) => {
  const { showNotification } = useNotification();
  const channels = useLiveQuery(() => db.paymentChannels.toArray(), []);
  const [state, dispatch] = useReducer(reducer, initialState);

  const longPressEvents = useLongPress(
    () => dispatch({ type: 'OPEN_DIALOG', payload: 'clearData' }),
    () => showNotification('需要长按才能清空数据', 'info')
  );

  const handleAddChannel = useCallback(async (newChannelName) => {
    if (newChannelName.trim()) {
      try {
        await db.paymentChannels.add({ name: newChannelName.trim(), isSystemChannel: false });
        showNotification('添加成功', 'success');
        dispatch({ type: 'CLOSE_DIALOG' });
      } catch (error) {
        console.error('Failed to add channel:', error);
        showNotification('添加失败', 'error');
      }
    }
  }, [showNotification]);

  const handleDeleteChannel = useCallback(async (id) => {
    try {
      await db.paymentChannels.delete(id);
      showNotification('删除成功', 'success');
    } catch (error) {
      console.error('Failed to delete channel:', error);
      showNotification('删除失败', 'error');
    }
  }, [showNotification]);

  const handleExport = useCallback(async () => {
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
  }, [showNotification]);

  const handleExportJson = useCallback(async () => {
    showNotification('正在导出备份...', 'info');
    try {
      const products = await db.products.toArray();
      const orders = await db.orders.toArray();
      const channels = await db.paymentChannels.toArray();
      const images = await db.productImages.toArray();

      const imagePromises = images.map(image =>
        blobToDataUrl(image.imageData).then(dataUrl => ({
          productId: image.productId,
          imageDataUrl: dataUrl,
        }))
      );
      const serializableImages = await Promise.all(imagePromises);
      
      const backupData = {
        products,
        orders,
        paymentChannels: channels,
        productImages: serializableImages,
        __soldout_backup_version__: '1.1', // Bump version for image support
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
  }, [showNotification]);

  const handleFileChange = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data?.__soldout_backup_version__) {
          dispatch({ type: 'SET_IMPORT_DATA', payload: data });
          dispatch({ type: 'OPEN_DIALOG', payload: 'importConfirm' });
        } else {
          showNotification('文件格式无效或已损坏', 'error');
        }
      } catch (error) {
        showNotification('无法解析文件', 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = null;
  }, [showNotification]);

  const handleConfirmImport = useCallback(async () => {
    if (!state.importData) return;
    showNotification('正在导入数据，请稍候...', 'info');
    try {
      await db.transaction('rw', db.products, db.orders, db.paymentChannels, db.productImages, async () => {
        // Clear all tables
        await Promise.all([
          db.products.clear(),
          db.orders.clear(),
          db.paymentChannels.clear(),
          db.productImages.clear(),
        ]);

        // Import images if they exist
        if (state.importData.productImages && state.importData.productImages.length > 0) {
          const imagePromises = state.importData.productImages.map(async (img) => ({
            productId: img.productId,
            imageData: await dataUrlToBlob(img.imageDataUrl),
          }));
          const imageBlobs = await Promise.all(imagePromises);
          await db.productImages.bulkAdd(imageBlobs);
        }

        // Import other data
        await Promise.all([
          db.products.bulkAdd(state.importData.products || []),
          db.orders.bulkAdd(state.importData.orders || []),
          db.paymentChannels.bulkAdd(state.importData.paymentChannels || []),
        ]);
      });
      dispatch({ type: 'CLOSE_DIALOG' });
      showNotification('数据导入成功，应用将刷新', 'success');
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      showNotification(`导入失败: ${error.message}`, 'error');
      dispatch({ type: 'CLOSE_DIALOG' });
    }
  }, [state.importData, showNotification]);

  const handleClearAllData = useCallback(async () => {
    try {
      await db.delete();
      localStorage.removeItem('hasSeenWelcome');
      showNotification('所有数据已清除，应用将刷新', 'success');
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      showNotification('清除数据失败', 'error');
    }
  }, [showNotification]);

  return (
    <>
      <PageHeader title="设置" />
      <Box sx={{ p: 2 }}>
        {showInstallButton && (
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>安装应用</Typography>
              <Button fullWidth variant="contained" onClick={onInstallClick}>添加到主屏幕</Button>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>将此应用安装到您的设备主屏幕，以便快速访问和离线使用。</Typography>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>支付渠道管理</Typography>
            <List>
              {(channels || []).map(channel => (
                <ListItem key={channel.id} secondaryAction={!channel.isSystemChannel && (<IconButton edge="end" aria-label="delete" onClick={() => handleDeleteChannel(channel.id)}><DeleteIcon /></IconButton>)}>
                  <ListItemText primary={channel.name} />
                  {channel.isSystemChannel && <Chip label="系统" size="small" />}
                </ListItem>
              ))}
            </List>
            <Button fullWidth variant="outlined" onClick={() => dispatch({ type: 'OPEN_DIALOG', payload: 'addChannel' })} sx={{ mt: 2 }}>添加新渠道</Button>
          </CardContent>
        </Card>

        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>数据管理</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
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
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>“导出备份”会生成一个包含所有产品、订单和设置的完整备份文件。“导入备份”会覆盖当前所有数据。</Typography>
          </CardContent>
        </Card>

        {isDevMode && (
          <Card sx={{ mt: 2 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>开发者选项</Typography>
                <Button fullWidth variant="outlined" onClick={() => setActiveKey('dev')}>
                  浏览已上传的图片
                </Button>
            </CardContent>
          </Card>
        )}

        <Card sx={{ mt: 2 }}>
          <CardContent>
              <Typography variant="h6" color="error" gutterBottom>危险区域</Typography>
              <Button fullWidth variant="contained" color="error" {...longPressEvents}>长按清空所有数据</Button>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>此操作将删除本浏览器内所有产品、订单和设置，且无法恢复。</Typography>
          </CardContent>
        </Card>

        <Box sx={{ textAlign: 'center', mt: 4, color: 'text.secondary' }}>
          <Typography variant="h6">
            售罄 Sold Out
            <IconButton aria-label="GitHub repository" onClick={() => window.open('https://github.com/Chiunownow/soldout', '_blank')} color="inherit" sx={{ ml: 1, verticalAlign: 'middle' }}>
              <GitHubIcon fontSize="small" />
            </IconButton>
          </Typography>
          <Typography variant="caption">Version: {import.meta.env.VITE_APP_VERSION || 'dev'}</Typography>
        </Box>
      </Box>
      
      <AddChannelDialog open={state.activeDialog === 'addChannel'} onClose={() => dispatch({ type: 'CLOSE_DIALOG' })} onAdd={handleAddChannel} />
      <ImportConfirmDialog open={state.activeDialog === 'importConfirm'} onClose={() => dispatch({ type: 'CLOSE_DIALOG' })} onConfirm={handleConfirmImport} />
      <ClearDataDialogs open={state.activeDialog === 'clearData'} onClose={() => dispatch({ type: 'CLOSE_DIALOG' })} onConfirm={handleClearAllData} />
    </>
  );
};
export default Settings;
