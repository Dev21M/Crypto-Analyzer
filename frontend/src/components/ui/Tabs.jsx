import React, { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';

/**
 * Tabs component with keyboard navigation and animated indicator
 */
export function Tabs({
  tabs = [],
  defaultTab,
  activeTab: controlledActiveTab,
  onChange,
  variant = 'line',
  className = '',
  fullWidth = false,
  ...props
}) {
  const [uncontrolledActiveTab, setUncontrolledActiveTab] = useState(defaultTab || tabs[0]?.key);
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : uncontrolledActiveTab;
  const tabsRef = useRef(null);
  const indicatorRef = useRef(null);

  const handleTabClick = (key) => {
    if (controlledActiveTab === undefined) {
      setUncontrolledActiveTab(key);
    }
    onChange?.(key);
  };

  const handleKeyDown = (e, index) => {
    let newIndex = index;
    if (e.key === 'ArrowRight') {
      newIndex = (index + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      newIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      newIndex = 0;
    } else if (e.key === 'End') {
      newIndex = tabs.length - 1;
    } else {
      return;
    }
    e.preventDefault();
    const newTab = tabs[newIndex];
    if (!newTab.disabled) {
      handleTabClick(newTab.key);
      tabsRef.current?.children[newIndex]?.focus();
    }
  };

  // Update indicator position
  useEffect(() => {
    if (!indicatorRef.current || !tabsRef.current) return;
    
    const activeButton = tabsRef.current.querySelector('[data-active="true"]');
    const indicator = indicatorRef.current;
    
    if (activeButton && indicator) {
      const { left, width } = activeButton.getBoundingClientRect();
      const containerLeft = tabsRef.current.getBoundingClientRect().left;
      indicator.style.transform = `translateX(${left - containerLeft}px)`;
      indicator.style.width = `${width}px`;
      indicator.style.opacity = '1';
    }
  }, [activeTab, tabs]);

  const variantClasses = {
    line: 'tabs-line',
    pill: 'tabs-pill',
    enclosed: 'tabs-enclosed',
    soft: 'tabs-soft',
  };

  return (
    <div className={clsx('tabs-container', className)} {...props}>
      <div
        ref={tabsRef}
        className={clsx(
          'tabs',
          variantClasses[variant],
          fullWidth && 'tabs-full-width'
        )}
        role="tablist"
        aria-label={props['aria-label']}
      >
        {variant === 'line' && (
          <div
            ref={indicatorRef}
            className="tabs-indicator"
            style={{ opacity: 0 }}
            aria-hidden="true"
          />
        )}
        {tabs.map((tab, index) => (
          <button
            key={tab.key}
            role="tab"
            id={`tab-${tab.key}`}
            aria-selected={activeTab === tab.key}
            aria-controls={`panel-${tab.key}`}
            tabIndex={activeTab === tab.key ? 0 : -1}
            disabled={tab.disabled}
            className={clsx(
              'tab',
              activeTab === tab.key && 'tab-active',
              tab.disabled && 'tab-disabled',
              tab.className
            )}
            onClick={() => !tab.disabled && handleTabClick(tab.key)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            data-active={activeTab === tab.key}
          >
            {tab.icon && <span className="tab-icon" aria-hidden="true">{tab.icon}</span>}
            <span className="tab-label">{tab.label}</span>
            {tab.badge && <span className="tab-badge">{tab.badge}</span>}
          </button>
        ))}
      </div>
      <div className="tab-panels">
        {tabs.map((tab) => (
          <div
            key={tab.key}
            role="tabpanel"
            id={`panel-${tab.key}`}
            aria-labelledby={`tab-${tab.key}`}
            hidden={activeTab !== tab.key}
            className="tab-panel"
          >
            {activeTab === tab.key && tab.content}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Simple Tab List for simpler use cases
 */
export function TabList({
  tabs = [],
  activeTab,
  onChange,
  variant = 'line',
  className = '',
  ...props
}) {
  const variantClasses = {
    line: 'tabs-line',
    pill: 'tabs-pill',
    enclosed: 'tabs-enclosed',
    soft: 'tabs-soft',
  };

  return (
    <div
      className={clsx('tabs', variantClasses[variant], className)}
      role="tablist"
      {...props}
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          role="tab"
          aria-selected={activeTab === tab.key}
          disabled={tab.disabled}
          className={clsx(
            'tab',
            activeTab === tab.key && 'tab-active',
            tab.disabled && 'tab-disabled'
          )}
          onClick={() => !tab.disabled && onChange?.(tab.key)}
        >
          {tab.icon && <span className="tab-icon" aria-hidden="true">{tab.icon}</span>}
          <span className="tab-label">{tab.label}</span>
          {tab.badge && <span className="tab-badge">{tab.badge}</span>}
        </button>
      ))}
    </div>
  );
}

/**
 * Tab Panel for manual tab control
 */
export function TabPanel({
  active,
  children,
  className = '',
  ...props
}) {
  if (!active) return null;
  
  return (
    <div
      role="tabpanel"
      className={clsx('tab-panel animate-fadeIn', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export default Tabs;