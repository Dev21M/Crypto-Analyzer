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
import { DashboardSidebar as Sidebar } from './Sidebar';
import { useApi } from '../../hooks/useApi';
import { useWebSocketService } from '../../services/websocket';
import { DisclaimerBanner } from '../DisclaimerBanner';
import { useTheme } from '../../hooks/useTheme';
import { Header } from '../layout/Header';

export function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [wsStatus, setWsStatus] = useState('connecting');
  const location = useLocation();
  const navigate = useNavigate();
  
  // Derive active page from current location
  const activePage = useMemo(() => {
    const path = location.pathname.replace('/dashboard', '') || '/';
    if (path === '/' || path === '/dashboard') return 'dashboard';
    return path.replace(/^\//, '').split('/')[0];
  }, [location.pathname]);
   
  const { data: apiData, loading: apiLoading, error: apiError } = useApi();
  const wsService = useWebSocketService();
  const { theme, toggleTheme } = useTheme();

  // WebSocket connection management
  useEffect(() => {
    const connect = async () => {
      await wsService.connect();
      wsService.subscribeToPredictions();
      wsService.subscribeToMarket();
      wsService.subscribeToRegimes();
      setWsStatus('connected');
    };

    connect();

    // Listen for connection changes
    const unsubscribeOpen = wsService.on('open', () => setWsStatus('connected'));
    const unsubscribeClose = wsService.on('close', () => setWsStatus('disconnected'));
    const unsubscribeError = wsService.on('error', () => setWsStatus('disconnected'));

    return () => {
      unsubscribeOpen();
      unsubscribeClose();
      unsubscribeError();
    };
  }, [wsService]);

  // Listen for messages (optional - for debugging)
  useEffect(() => {
    const unsubscribe = wsService.on('message', (message) => {
      console.log('WS Message:', message);
    });
    return () => unsubscribe();
  }, [wsService]);

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
      // Close mobile sidebar after navigation
      setSidebarOpen(false);
    }
  }, [navigate]);

  const handleToggleSidebar = useCallback(() => setSidebarCollapsed(prev => !prev), []);
  const handleMenuClick = useCallback(() => setSidebarOpen(true), []);

  return (
    <div className="app">
      <Sidebar
        navigation={NAV_ITEMS}
        activeKey={activePage}
        onNavigate={handleNavClick}
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
        className={sidebarOpen ? 'open' : ''}
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
        <main id="main-content" className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;