import React, { useState } from 'react';
import { clsx } from 'clsx';
import { ChevronLeft, ChevronRight, ChevronDown, LayoutDashboard, Activity, Zap, Cpu, BarChart3, Settings, BookOpen, Star, Briefcase, Home, Search, TrendingUp, Users, Shield } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { Collapse } from '../../utils/animations';
import { Button } from '../ui';

/**
 * Sidebar navigation item
 */
function NavItem({ item, level = 0, isActive, onClick }) {
  const [expanded, setExpanded] = useState(item.defaultExpanded || false);
  const hasChildren = item.children && item.children.length > 0;
  const isItemActive = isActive || (hasChildren && item.children.some(c => c.active));

  const handleClick = (e) => {
    if (hasChildren) {
      e.preventDefault();
      setExpanded(!expanded);
    }
    onClick?.(item);
  };

  const Icon = item.icon || LayoutDashboard;

  return (
    <div className="nav-item-wrapper">
      <button
        className={clsx(
          'nav-item flex items-center gap-3 w-full',
          isItemActive && 'nav-item-active',
          level > 0 && 'nav-item-nested',
          item.disabled && 'nav-item-disabled'
        )}
        onClick={handleClick}
        disabled={item.disabled}
        aria-expanded={hasChildren ? expanded : undefined}
        aria-current={isItemActive && !hasChildren ? 'page' : undefined}
        style={{ paddingLeft: `${12 + level * 16}px` }}
      >
        <span className={clsx('nav-icon flex-shrink-0', level > 0 && 'nav-icon-nested')}>
          <Icon size={level > 0 ? 16 : 20} strokeWidth={2} />
        </span>
        <span className="nav-label flex-1 text-left truncate">{item.label}</span>
        {hasChildren && (
          <ChevronDown
            size={14}
            className={clsx('nav-chevron transition-transform', expanded && 'rotate-180')}
          />
        )}
        {item.badge && (
          <span className="nav-badge ml-auto">{item.badge}</span>
        )}
      </button>
      {hasChildren && (
        <Collapse in={expanded}>
          <div className="nav-children" style={{ paddingLeft: `${12 + (level + 1) * 16}px` }}>
            {item.children.map((child) => (
              <NavItem
                key={child.key}
                item={child}
                level={level + 1}
                isActive={child.active}
                onClick={onClick}
              />
            ))}
          </div>
        </Collapse>
      )}
    </div>
  );
}

/**
 * Main Sidebar component
 */
export function Sidebar({
  navigation = [],
  collapsed = false,
  onToggleCollapse,
  className = '',
  logo,
  footer,
  ...props
}) {
  const location = useLocation();
  const [hovered, setHovered] = useState(false);
  const effectiveCollapsed = collapsed || hovered;

  const isActive = (item) => {
    if (item.href && location.pathname === item.href) return true;
    if (item.children) return item.children.some(isActive);
    return false;
  };

  const renderNav = () => (
    <nav className="sidebar-nav flex-1 overflow-y-auto p-2" role="navigation" aria-label="Main navigation">
      {navigation.map((item) => (
        <NavItem
          key={item.key}
          item={item}
          isActive={isActive(item)}
          onClick={() => {}}
        />
      ))}
    </nav>
  );

  return (
    <aside
      className={clsx(
        'sidebar flex flex-col',
        collapsed && 'sidebar-collapsed',
        className
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      {...props}
    >
      {/* Logo */}
      <div className={clsx('sidebar-header flex items-center gap-3 p-4 border-b border-primary', collapsed && 'justify-center')}>
        <div className="sidebar-logo flex-shrink-0">
          {logo || (
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="url(#sidebar-gradient)"/>
              <path d="M8 16L14 22L24 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="sidebar-gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#58a6ff"/>
                  <stop offset="100%" stopColor="#a371f7"/>
                </linearGradient>
              </defs>
            </svg>
          )}
        </div>
        {!collapsed && (
          <span className="sidebar-title font-semibold text-base truncate">CryptoAnalyzer</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto sidebar-toggle"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>

      {/* Navigation */}
      {!collapsed ? renderNav() : (
        <nav className="sidebar-nav flex-1 overflow-y-auto p-2" role="navigation" aria-label="Main navigation">
          {navigation.map((item) => (
            <button
              key={item.key}
              className={clsx(
                'nav-item flex items-center justify-center gap-3 p-2 rounded-lg',
                isActive(item) && 'nav-item-active',
                item.disabled && 'nav-item-disabled'
              )}
              title={item.label}
              aria-label={item.label}
              aria-current={isActive(item) ? 'page' : undefined}
              disabled={item.disabled}
            >
              <span className="nav-icon">
                {(item.icon || LayoutDashboard).size = 20}
              </span>
            </button>
          ))}
        </nav>
      )}

      {/* Footer */}
      <div className={clsx('sidebar-footer p-4 border-t border-primary', collapsed && 'hidden')}>
        {footer || (
          <div className="flex items-center gap-3 text-sm text-muted">
            <span className="flex-1 truncate">v1.0.0</span>
            <a href="/docs" className="hover:text-primary" target="_blank" rel="noopener">
              Docs
            </a>
            <span className="mx-1">·</span>
            <a href="/changelog" className="hover:text-primary" target="_blank" rel="noopener">
              Changelog
            </a>
          </div>
        )}
      </div>
    </aside>
  );
}

/**
 * Dashboard Sidebar (simpler version for dashboard pages)
 */
export function DashboardSidebar({
  navigation = [],
  activeKey,
  onNavigate,
  collapsed = false,
  onToggleCollapse,
  className = '',
  ...props
}) {
  const [hovered, setHovered] = useState(false);
  const effectiveCollapsed = collapsed || hovered;

  return (
    <aside
      className={clsx('sidebar flex flex-col', collapsed && 'sidebar-collapsed', className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      {...props}
    >
      <div className={clsx('sidebar-header flex items-center gap-3 p-4 border-b border-primary', collapsed && 'justify-center')}>
        <div className="sidebar-logo flex-shrink-0">
          <Activity size={24} strokeWidth={2.5} className="text-primary" />
        </div>
        {!collapsed && <span className="sidebar-title font-semibold text-base">CryptoAnalyzer</span>}
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto sidebar-toggle"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>

      <nav className="sidebar-nav flex-1 overflow-y-auto p-2" role="navigation" aria-label="Dashboard navigation">
        {navigation.map((item) => (
          <button
            key={item.id}
            className={clsx(
              'nav-item flex items-center gap-3 px-3 py-2 rounded-lg w-full',
              activeKey === item.id && 'nav-item-active',
              collapsed && 'justify-center'
            )}
            onClick={() => onNavigate(item.id)}
            title={collapsed ? item.label : undefined}
            aria-current={activeKey === item.id ? 'page' : undefined}
          >
            <span className="nav-icon flex-shrink-0">
              <item.icon size={20} strokeWidth={2} />
            </span>
            {!collapsed && <span className="nav-label truncate">{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className={clsx('sidebar-footer p-4 border-t border-primary', collapsed && 'hidden')}>
        <div className="connection-status flex items-center gap-2 text-xs text-muted">
          <span className="status-dot connected" />
          <span>Connected</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;