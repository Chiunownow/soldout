import React, { useState } from 'react'
import { TabBar } from 'antd-mobile'
import {
  AppOutline,
  UnorderedListOutline,
  BillOutline,
  CalculatorOutline,
  SetOutline,
} from 'antd-mobile-icons'
import './App.css'
import Sale from './pages/Sale'
import Inventory from './pages/Inventory'
import Orders from './pages/Orders'
import Stats from './pages/Stats'
import Settings from './pages/Settings'

const App = () => {
  const [activeKey, setActiveKey] = useState('sale')

  const tabs = [
    {
      key: 'sale',
      title: '记账',
      icon: <BillOutline />,
    },
    {
      key: 'inventory',
      title: '库存',
      icon: <UnorderedListOutline />,
    },
    {
      key: 'orders',
      title: '订单',
      icon: <AppOutline />,
    },
    {
      key: 'stats',
      title: '统计',
      icon: <CalculatorOutline />,
    },
    {
      key: 'settings',
      title: '设置',
      icon: <SetOutline />,
    },
  ]

  // A simple component to render based on active tab
  const renderContent = () => {
    switch (activeKey) {
      case 'sale':
        return <Sale />
      case 'inventory':
        return <Inventory />
      case 'orders':
        return <Orders />
      case 'stats':
        return <Stats />
      case 'settings':
        return <Settings />
      default:
        return <Sale />
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {renderContent()}
      </div>
      <TabBar activeKey={activeKey} onChange={setActiveKey}>
        {tabs.map(item => (
          <TabBar.Item key={item.key} icon={item.icon} title={item.title} />
        ))}
      </TabBar>
    </div>
  )
}

export default App