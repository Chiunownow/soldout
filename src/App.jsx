import React, { useState, useEffect } from 'react'
import { Box, Paper, BottomNavigation, BottomNavigationAction } from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import InventoryIcon from '@mui/icons-material/Inventory';
import AppsIcon from '@mui/icons-material/Apps';
import CalculateIcon from '@mui/icons-material/Calculate';
import SettingsIcon from '@mui/icons-material/Settings';
import Sale from './pages/Sale'
import NewSale from './pages/NewSale'
import Inventory from './pages/Inventory'
import Orders from './pages/Orders'
import Stats from './pages/Stats'
import Settings from './pages/Settings'
import WelcomeDialog from './components/WelcomeDialog';
import DevImageViewer from './pages/DevImageViewer';
import { db } from './db'

const App = () => {
  const [activeKey, setActiveKey] = useState('sale');
  const [isNewHome] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('newhome') === 'true';
  });
  const [welcomeDialogOpen, setWelcomeDialogOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isDevMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('devmode') === 'true';
  });

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallButton(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const checkFirstVisit = async () => {
      const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
      if (!hasSeenWelcome) {
        const productCount = await db.products.count();
        const orderCount = await db.orders.count();
        if (productCount === 0 && orderCount === 0) {
          setWelcomeDialogOpen(true);
        }
      }
    };
    checkFirstVisit();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleConfirmWelcome = () => {
    localStorage.setItem('hasSeenWelcome', 'true');
    setWelcomeDialogOpen(false);
  };

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    const result = await installPrompt.prompt();
    console.log(`Install prompt result: ${result.outcome}`);
    setInstallPrompt(null);
    setShowInstallButton(false);
  };

  const tabs = [
    { key: 'sale', title: '记账', icon: <ReceiptLongIcon /> },
    { key: 'inventory', title: '库存', icon: <InventoryIcon /> },
    { key: 'orders', title: '订单', icon: <AppsIcon /> },
    { key: 'stats', title: '统计', icon: <CalculateIcon /> },
    { key: 'settings', title: '设置', icon: <SettingsIcon /> },
  ];

  const renderContent = () => {
    switch (activeKey) {
      case 'sale': return isNewHome ? <NewSale /> : <Sale />;
      case 'inventory': return <Inventory />;
      case 'orders': return <Orders />;
      case 'stats': return <Stats />;
      case 'settings': return <Settings 
          showInstallButton={showInstallButton}
          onInstallClick={handleInstallClick}
          isDevMode={isDevMode}
          setActiveKey={setActiveKey}
        />;
      case 'dev': return isDevMode ? <DevImageViewer /> : <Sale />;
      default: return <Sale />;
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {renderContent()}
</Box>
      <Paper sx={{ position: 'sticky', bottom: 0, left: 0, right: 0 }} elevation={3}>
        <BottomNavigation
          showLabels
          value={activeKey}
          onChange={(event, newValue) => setActiveKey(newValue)}
        >
          {tabs.map(item => (
            <BottomNavigationAction 
              key={item.key} 
              label={item.title} 
              value={item.key} 
              icon={item.icon} 
              sx={{ minWidth: 'auto', padding: '6px 0' }}
            />
          ))}
        </BottomNavigation>
      </Paper>
      <WelcomeDialog open={welcomeDialogOpen} onConfirm={handleConfirmWelcome} />
    </Box>
  )
}

export default App