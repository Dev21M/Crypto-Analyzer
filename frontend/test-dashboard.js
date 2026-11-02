const babel = require('@babel/core');

const testCode = `
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Home, Activity, Zap, Cpu, BarChart3, Settings } from 'lucide-react';

function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
    { id: 'market', label: 'Market Data', icon: Activity, path: '/market' },
    { id: 'predictions', label: 'Predictions', icon: Zap, path: '/predictions' },
    { id: 'models', label: 'Models', icon: Cpu, path: '/models' },
    { id: 'regimes', label: 'Regimes', icon: BarChart3, path: '/regimes' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  ];

  const handleNavClick = (item) => {
    navigate(item.path);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const handleToggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const handleMenuClick = () => setSidebarOpen(true);

  return (
    <div className="app">
      <Sidebar
        collapsed={sidebarCollapsed}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navItems={NAV_ITEMS}
        activePage={'dashboard'}
        onNavClick={handleNavClick}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        wsStatus={'connected'}
      />

      <div className="main-content">
        <header className="header" role="banner">
          <div className="header-left">
            <button 
              className="toggle-btn" 
              onClick={() => setSidebarOpen(true)}
              aria-label="Toggle menu"
              style={{ display: window.innerWidth < 768 ? 'flex' : 'none' }}
            >
              <Menu size={20} strokeWidth={2} />
            </button>
            
            <button 
              className="toggle-btn" 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              style={{ display: window.innerWidth >= 768 ? 'flex' : 'none' }}
            >
              {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>

            <h1 className="page-title">Dashboard</h1>
          </div>

          <div className="header-right">
            <div className={\`ws-status connected\`}>
              <span className="status-dot connected" />
              <span>Live</span>
            </div>
          </div>
        </header>
        
        <main className="content">
          <div>Content</div>
        </main>
    </div>
  );
}

function Sidebar({ collapsed, open, onClose, navItems, activePage, onNavClick, onToggleCollapse, wsStatus }) {
  return (
    <>
      <aside className={\`sidebar \${collapsed ? 'collapsed' : ''} \${open ? 'open' : ''}\`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Activity size={18} strokeWidth={2.5} color="#0d1117" />
          </div>
          <span className="sidebar-title">CryptoAnalyzer</span>
          {!collapsed && (
            <button 
              className="toggle-btn" 
              onClick={onToggleCollapse}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          )}
        </div>

        <nav className="sidebar-nav" role="navigation" aria-label="Main navigation">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={\`nav-item \${activePage === item.id ? 'active' : ''}\`}
              onClick={() => {
                onNavClick(item);
                if (window.innerWidth < 768) onClose();
              }}
              aria-current={activePage === item.id ? 'page' : undefined}
            >
              <span className="nav-item-icon">
                <item.icon size={20} strokeWidth={2} />
              </span>
              <span className="nav-item-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="connection-status connected">
            <span className="status-dot connected" />
            <span>Live</span>
          </div>
        </div>
      </aside>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<div>Dashboard</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
`;

try {
  const result = require('@babel/core').parseSync(testCode, {
    sourceType: 'module',
    filename: 'test.js',
    presets: [
      [require.resolve('babel-preset-react-app'), { runtime: 'automatic' }]
    ]
  });
  console.log('Test with DashboardLayout parsed successfully');
} catch (e) {
  console.log('Error:', e.message);
  console.log('Line:', e.loc?.line, 'Column:', e.loc?.column);
  if (e.codeFrame) console.log(e.codeFrame);
}