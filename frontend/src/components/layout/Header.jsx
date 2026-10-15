import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  Zap,
  Cpu,
  LineChart,
  Search,
  Menu,
  X,
  Sun,
  Moon,
  Monitor,
  Wifi,
  WifiOff,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Target,
  Settings,
  BookOpen,
  Star,
  Bell,
  Shield,
} from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export function Header({ 
  title, 
  onMenuClick, 
  sidebarCollapsed, 
  onToggleSidebar, 
  wsStatus,
  onThemeToggle 
}) {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const { theme, toggleTheme } = useTheme();

  const isDashboardRoute = location.pathname.startsWith('/dashboard');
  const isPublicRoute = !isDashboardRoute;

  // Navigation items for dashboard
  const dashboardNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/dashboard/market', label: 'Market Data', icon: BarChart3 },
    { path: '/dashboard/predictions', label: 'Predictions', icon: Zap },
    { path: '/dashboard/models', label: 'Models', icon: Cpu },
    { path: '/dashboard/regimes', label: 'Regimes', icon: LineChart },
    { path: '/dashboard/settings', label: 'Settings', icon: Settings },
  ];

  // Navigation items for public
  const publicNavItems = [
    { path: '/', label: 'Home', icon: LayoutDashboard, exact: true },
    { path: '/markets', label: 'Markets', icon: BarChart3 },
    { path: '/analysis', label: 'Coin Analysis', icon: Search },
    { path: '/predictions', label: 'Predictions', icon: Zap },
    { path: '/learn', label: 'Learn', icon: BookOpen },
  ];

  const navItems = isDashboardRoute ? dashboardNavItems : publicNavItems;

  // Search coins
  const handleSearch = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      setSearchLoading(true);
      const res = await fetch(`/api/v1/market/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.slice(0, 8));
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSearchResults(false);
      const symbol = searchQuery.trim().toUpperCase();
      if (isDashboardRoute) {
        // Navigate to market page with symbol
        window.location.href = `/dashboard/market?symbol=${symbol}`;
      } else {
        window.location.href = `/coin/${symbol}`;
      }
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const wsStatusConfig = {
    connected: { label: 'Live', dotClass: 'status-dot connected', icon: Wifi },
    connecting: { label: 'Connecting...', dotClass: 'status-dot connecting', icon: Wifi },
    disconnected: { label: 'Offline', dotClass: 'status-dot disconnected', icon: WifiOff },
  };

  const statusConfig = wsStatusConfig[wsStatus] || wsStatusConfig.disconnected;
  const StatusIcon = statusConfig.icon;

  return (
    <header className="header" role="banner">
      <div className="header-left">
        {/* Mobile menu toggle */}
        <button 
          className="toggle-btn" 
          onClick={onMenuClick}
          aria-label="Toggle menu"
          style={{ display: window.innerWidth < 768 ? 'flex' : 'none' }}
        >
          <Menu size={20} strokeWidth={2} />
        </button>
        
        {/* Sidebar collapse/expand */}
        <button 
          className="toggle-btn" 
          onClick={onToggleSidebar}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{ display: window.innerWidth >= 768 ? 'flex' : 'none' }}
        >
          {sidebarCollapsed ? <ChevronDown size={18} /> : <Menu size={18} />}
        </button>

        {/* Logo */}
        <Link to={isDashboardRoute ? '/dashboard' : '/'} className="logo-link" aria-label="CryptoAnalyzer Home">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="url(#logo-gradient)"/>
            <path d="M8 16L14 22L24 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <defs>
              <linearGradient id="logo-gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#58a6ff"/>
                <stop offset="100%" stopColor="#a371f7"/>
              </linearGradient>
            </defs>
          </svg>
          {!sidebarCollapsed && <span className="logo-text">CryptoAnalyzer</span>}
        </Link>

        {/* Desktop Navigation */}
        <nav className="main-nav hidden lg:flex" role="navigation" aria-label="Main navigation">
          {navItems.map((item) => {
            const isActive = item.exact 
              ? location.pathname === item.path 
              : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${isActive ? 'active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <item.icon size={16} strokeWidth={2} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="header-center">
        {/* Search */}
        <div className="search-wrapper" ref={dropdownRef}>
          <form onSubmit={handleSearchSubmit} className="search-form">
            <Search className="search-icon" size={18} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search coins (BTC, ETH, SOL...)"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
              className="search-input form-input"
              autoComplete="off"
              aria-label="Search cryptocurrencies"
            />
            <button type="submit" className="search-submit btn btn-primary btn-sm" disabled={!searchQuery.trim()}>
              Search
            </button>
          </form>

          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="search-dropdown animate-fadeIn">
              {searchResults.map((coin) => (
                <Link
                  key={coin.symbol}
                  to={isDashboardRoute ? `/dashboard/market?symbol=${coin.symbol}` : `/coin/${coin.symbol}`}
                  className="search-result-item"
                  onClick={() => setShowSearchResults(false)}
                >
                  <div className="coin-avatar-sm" style={{ background: `hsl(${coin.symbol.charCodeAt(0) * 10} 70% 50%)` }}>
                    {coin.symbol.charAt(0)}
                  </div>
                  <div className="coin-info">
                    <span className="coin-symbol">{coin.symbol}</span>
                    <span className="coin-name">{coin.name}</span>
                  </div>
                </Link>
              ))}
              {searchLoading && (
                <div className="search-loading">
                  <div className="spinner spinner-sm" />
                  <span>Searching...</span>
                </div>
              )}
              {searchResults.length === 0 && !searchLoading && (
                <div className="search-empty">No coins found</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="header-right">
        {/* Theme Toggle */}
        <button 
          className="icon-btn toggle-btn" 
          onClick={onThemeToggle || toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* WebSocket Status */}
        <div className={`ws-status ${wsStatus}`} title={`WebSocket: ${statusConfig.label}`}>
          <StatusIcon size={12} className={statusConfig.dotClass.replace('status-dot ', '')} />
          <span className="ws-status-text hidden sm:inline">{statusConfig.label}</span>
        </div>

        {/* Notifications Bell */}
        <button className="icon-btn toggle-btn relative" aria-label="Notifications">
          <Bell size={18} />
          <span className="notification-badge">3</span>
        </button>

        {/* User Menu (placeholder) */}
        <div className="user-menu">
          <button className="icon-btn toggle-btn" aria-label="User menu">
            <Shield size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;