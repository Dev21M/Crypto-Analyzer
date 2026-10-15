import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Activity, 
  Zap, 
  Cpu, 
  BarChart3, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Bell,
} from 'lucide-react';
import { Sidebar } from '../Sidebar';
import { useApi, useWebSocket } from '../../hooks/useApi';
import { DisclaimerBanner } from '../DisclaimerBanner';
import { useTheme } from '../../hooks/useTheme';
import { Header } from '../layout/Header';

export function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [wsStatus, setWsStatus] = useState('connecting');
  const location = useLocation();
  const navigate = useNavigate();
  
  const { data: apiData, loading: apiLoading, error: apiError } = useApi();
  const { 
    connected, 
    connect, 
    disconnect, 
    subscribe, 
    lastMessage,
    subscribeToPredictions,
    subscribeToMarket,
    subscribeToRegimes,
  } = useWebSocket();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (connected) setWsStatus('connected');
    else setWsStatus('disconnected');
  }, [connected]);

  useEffect(() => {
    connect();
    subscribeToPredictions();
    subscribeToMarket();
    subscribeToRegimes();
    return () => disconnect();
  }, [connect, disconnect, subscribeToPredictions, subscribeToMarket, subscribeToRegimes]);

  useEffect(() => {
    if (lastMessage) {
      console.log('WS Message:', lastMessage);
    }
  }, [lastMessage]);

  // Derive active page from current location
  const activePage = useMemo(() => {
    const path = location.pathname.replace('/dashboard', '') || '/';
    if (path === '/' || path === '/dashboard') return 'dashboard';
    return path.replace('/', '');
  }, [location.pathname]);

  const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
    { id: 'market', label: 'Market Data', icon: Activity, path: '/dashboard/market' },
    { id: 'predictions', label: 'Predictions', icon: Zap, path: '/dashboard/predictions' },
    { id: 'models', label: 'Models', icon: Cpu, path: '/dashboard/models' },
    { id: 'regimes', label: 'Regimes', icon: BarChart3, path: '/dashboard/regimes' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/dashboard/settings' },
  ];

  // Page title mapping
  const pageTitles = {
    dashboard: 'Dashboard',
    market: 'Market Data',
    predictions: 'Predictions',
    models: 'Models',
    regimes: 'Regimes',
    settings: 'Settings',
  };

  const handleNavClick = useCallback((itemId) => {
    const item = NAV_ITEMS.find(i => i.id === itemId);
    if (item && item.path) {
      navigate(item.path);
    }
  }, [navigate]);

  const handleToggleSidebar = useCallback(() => setSidebarCollapsed(prev => !prev), []);
  const handleMenuClick = useCallback(() => setSidebarOpen(true), []);

  return (
    <div className="app">
      <Sidebar
        collapsed={sidebarCollapsed}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navItems={NAV_ITEMS}
        activePage={activePage}
        onNavClick={handleNavClick}
        onToggleCollapse={handleToggleSidebar}
        wsStatus={wsStatus}
      />

      <div className="main-content">
        <Header
          title={pageTitles[activePage] || 'Dashboard'}
          onMenuClick={handleMenuClick}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={handleToggleSidebar}
          wsStatus={wsStatus}
          onThemeToggle={toggleTheme}
        />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;