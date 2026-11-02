const babel = require('@babel/core');

const testCode = `
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// PageSkeleton
function PageSkeleton() {
  return (
    <div className="flex-1 p-6">
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-tertiary rounded w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-tertiary rounded" />
          ))}
        </div>
        <div className="h-96 bg-tertiary rounded" />
      </div>
    </div>
  );
}

// PublicLayout
function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-primary flex flex-col">
      {children}
    </div>
  );
}

// DashboardLayout - simplified without Sidebar or Outlet
function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: 'Home', path: '/dashboard' },
    { id: 'market', label: 'Market Data', icon: 'Activity', path: '/market' },
    { id: 'predictions', label: 'Predictions', icon: 'Zap', path: '/predictions' },
    { id: 'models', label: 'Models', icon: 'Cpu', path: '/models' },
    { id: 'regimes', label: 'Regimes', icon: 'BarChart3', path: '/regimes' },
    { id: 'settings', label: 'Settings', icon: 'Settings', path: '/settings' },
  ];

  return (
    <div className="app">
      <div className="main-content">
        <header className="header" role="banner">
          <div className="header-left">
            <h1 className="page-title">Dashboard</h1>
          </div>
          <div className="header-right">
            <div className="ws-status connected">
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div>Home</div>} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<div>Dashboard</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
  console.log('Simple DashboardLayout parsed successfully');
} catch (e) {
  console.log('Error:', e.message);
  console.log('Line:', e.loc?.line, 'Column:', e.loc?.column);
  if (e.codeFrame) console.log(e.codeFrame);
}