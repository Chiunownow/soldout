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
        return <div>记账页面</div>
      case 'inventory':
        return <div>库存页面</div>
      case 'orders':
        return <div>订单页面</div>
      case 'stats':
        return <div>统计页面</div>
      case 'settings':
        return <div>设置页面</div>
      default:
        return <div>记账页面</div>
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ flex: 1 }}>
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