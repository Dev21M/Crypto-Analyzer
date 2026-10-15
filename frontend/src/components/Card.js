import React from 'react';
import { TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon, Activity as ActivityIcon } from 'lucide-react';

export function Card({ 
  title, 
  subtitle, 
  children, 
  className = '', 
  style = {},
  headerAction 
}) {
  return (
    <div className={`card ${className}`} style={style}>
      {(title || subtitle) && (
        <div className="card-header">
          <div>
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 4 }}>{subtitle}</p>}
          </div>
          {headerAction}
        </div>
      )}
      <div className="card-content">
        {children}
      </div>
    </div>
  );
}

export function MetricCard({ 
  label, 
  value, 
  change, 
  changeLabel, 
  icon, 
  trend = 'neutral' 
}) {
  const trendColors = {
    up: 'var(--accent-success)',
    down: 'var(--accent-danger)',
    neutral: 'var(--text-secondary)',
  };

  return (
    <div className="metric-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span className="metric-label">{label}</span>
        {icon && (
          <span style={{ color: 'var(--text-muted)', fontSize: '20px' }}>
            {typeof icon === 'string' ? icon : React.cloneElement(icon, { size: 20 })}
          </span>
        )}
      </div>
      <div className="metric-value" style={{ color: trendColors[trend] }}>
        {value}
      </div>
      {change && (
        <div className="metric-change" style={{ color: trendColors[trend] }}>
          <TrendingUpIcon size={12} style={{ display: trend === 'up' ? 'inline' : 'none' }} />
          <TrendingDownIcon size={12} style={{ display: trend === 'down' ? 'inline' : 'none' }} />
          <ActivityIcon size={12} style={{ display: trend === 'neutral' ? 'inline' : 'none' }} />
          {change} {changeLabel && <span style={{ color: 'var(--text-muted)' }}>{changeLabel}</span>}
        </div>
      )}
    </div>
  );
}

export function ChartContainer({ 
  children, 
  style = {}, 
  className = '',
  height = 300 
}) {
  return (
    <div 
      className={`chart-container ${className}`} 
      style={{ 
        width: '100%', 
        height, 
        position: 'relative',
        ...style 
      }}
    >
      {children}
    </div>
  );
}

// Re-export for convenience
export { ChartContainer as Chart };