import React from 'react';
import { Menu, ChevronLeft, ChevronRight } from 'lucide-react';

export function Header({ 
  title, 
  onMenuClick, 
  sidebarCollapsed, 
  onToggleSidebar, 
  wsStatus 
}) {
  return (
    <header className="header" role="banner">
      <div className="header-left">
        <button 
          className="toggle-btn" 
          onClick={onMenuClick}
          aria-label="Toggle menu"
          style={{ display: window.innerWidth < 768 ? 'flex' : 'none' }}
        >
          <Menu size={20} strokeWidth={2} />
        </button>
        
        <button 
          className="toggle-btn" 
          onClick={onToggleSidebar}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{ display: window.innerWidth >= 768 ? 'flex' : 'none' }}
        >
          {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        <h1 className="page-title">{title}</h1>
      </div>

      <div className="header-right">
        <div className={`ws-status ${wsStatus}`}>
          <span className={`status-dot ${wsStatus}`} />
          <span>{wsStatus === 'connected' ? 'Live' : wsStatus === 'connecting' ? 'Connecting...' : 'Offline'}</span>
        </div>
      </div>
    </header>
  );
}

export default Header;