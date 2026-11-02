import React from 'react';
import { 
  Home as HomeIcon, 
  Activity as ActivityIcon, 
  Zap as ZapIcon, 
  Cpu as CpuIcon, 
  BarChart3 as BarChart3Icon, 
  Settings as SettingsIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
} from 'lucide-react';

export function Sidebar({ 
  collapsed, 
  open, 
  onClose, 
  navItems, 
  activePage, 
  onNavClick, 
  onToggleCollapse,
  wsStatus 
}) {
  return (
    <>
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${open ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <ActivityIcon size={18} strokeWidth={2.5} color="#0d1117" />
          </div>
          <span className="sidebar-title">CryptoAnalyzer</span>
          {!collapsed && (
            <button 
              className="toggle-btn" 
              onClick={onToggleCollapse}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRightIcon size={18} /> : <ChevronLeftIcon size={18} />}
            </button>
          )}
        </div>

        <nav className="sidebar-nav" role="navigation" aria-label="Main navigation">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activePage === item.id ? 'active' : ''}`}
              onClick={() => {
                onNavClick(item.id);
                if (window.innerWidth < 768) onClose();
              }}
              aria-current={activePage === item.id ? 'page' : undefined}
            >
              <span className="nav-icon">
                <item.icon size={20} strokeWidth={2} />
              </span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className={`connection-status ${wsStatus === 'connected' ? 'connected' : wsStatus === 'connecting' ? 'connecting' : 'disconnected'}`}>
            <span className={`status-dot ${wsStatus}`} />
            <span>{wsStatus === 'connected' ? 'Live' : wsStatus === 'connecting' ? 'Connecting...' : 'Offline'}</span>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;