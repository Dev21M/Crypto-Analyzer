import React from 'react';
import { clsx } from 'clsx';

/**
 * Card component with header, content, and footer slots
 */
export function Card({
  title,
  subtitle,
  children,
  className = '',
  style,
  headerAction,
  footer,
  compact = false,
  bordered = true,
  hoverable = false,
  padding = 'md',
  ...props
}) {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6',
  };

  const headerPadding = compact ? 'px-3 py-3' : 'px-5 py-4';
  const contentPadding = paddingClasses[padding] || paddingClasses.md;
  const footerPadding = compact ? 'px-3 py-3' : 'px-5 py-4';

  return (
    <article
      className={clsx(
        'card',
        bordered && 'border',
        hoverable && 'hover:shadow-md hover:border-secondary transition-all',
        className
      )}
      style={style}
      {...props}
    >
      {(title || subtitle || headerAction) && (
        <header className={clsx('card-header', headerPadding)}>
          <div className="card-header-content">
            {title && (
              <h3 className="card-title">{title}</h3>
            )}
            {subtitle && (
              <p className="card-subtitle">{subtitle}</p>
            )}
          </div>
          {headerAction && (
            <div className="card-header-action flex-shrink-0">
              {headerAction}
            </div>
          )}
        </header>
      )}
      <div className={clsx('card-content', contentPadding)}>
        {children}
      </div>
      {footer && (
        <footer className={clsx('card-footer', footerPadding)}>
          {footer}
        </footer>
      )}
    </article>
  );
}

/**
 * Metric Card for displaying KPIs
 */
export function MetricCard({
  label,
  value,
  change,
  changeLabel,
  trend = 'neutral',
  icon,
  className = '',
  prefix,
  suffix,
  format,
  ...props
}) {
  const trendColors = {
    up: 'text-success',
    down: 'text-danger',
    neutral: 'text-muted',
  };

  const trendIcons = {
    up: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <polyline points="18 15 12 9 6 15" />
      </svg>
    ),
    down: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    ),
    neutral: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
  };

  const formattedValue = format ? format(value) : value;

  return (
    <div className={clsx('metric-card', className)} {...props}>
      <div className="metric-header flex items-center justify-between mb-2">
        <span className="metric-label">{label}</span>
        {icon && (
          <span className="metric-icon" aria-hidden="true">
            {typeof icon === 'string' ? icon : React.cloneElement(icon, { size: 20 })}
          </span>
        )}
      </div>
      <div className={clsx('metric-value font-mono', trendColors[trend])}>
        {prefix && <span className="metric-prefix">{prefix}</span>}
        {formattedValue}
        {suffix && <span className="metric-suffix">{suffix}</span>}
      </div>
      {change !== undefined && change !== null && (
        <div className={clsx('metric-change flex items-center gap-1', trendColors[trend])}>
          {trendIcons[trend]}
          <span>{change}</span>
          {changeLabel && <span className="text-muted">{changeLabel}</span>}
        </div>
      )}
    </div>
  );
}

/**
 * Chart Container wrapper
 */
export function ChartContainer({
  children,
  className = '',
  style,
  height = 300,
  toolbar,
  loading = false,
  error = null,
  onRetry,
  ...props
}) {
  return (
    <div
      className={clsx('chart-container', className)}
      style={{ ...style, height }}
      {...props}
    >
      {loading && (
        <div className="chart-loading flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-3">
            <div className="spinner spinner-lg" aria-hidden="true" />
            <span className="text-sm text-muted">Loading chart...</span>
          </div>
        </div>
      )}
      
      {error && (
        <div className="chart-error flex flex-col items-center justify-center h-full p-6 text-center">
          <svg className="chart-error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-sm text-muted mb-2">{error.message || 'Failed to load chart'}</p>
          {onRetry && (
            <button className="btn btn-secondary btn-sm" onClick={onRetry}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              Retry
            </button>
          )}
        </div>
      )}
      
      {!loading && !error && (
        <>
          {toolbar && (
            <div className="chart-toolbar">
              {toolbar}
            </div>
          )}
          {children}
        </>
      )}
    </div>
  );
}

/**
 * Card Grid for responsive card layouts
 */
export function CardGrid({
  children,
  className = '',
  columns = { base: 1, md: 2, lg: 3, xl: 4 },
  gap = 4,
  ...props
}) {
  const gridClasses = clsx(
    'grid',
    `gap-${gap}`,
    className
  );

  const style = {
    gridTemplateColumns: `
      repeat(${columns.base}, minmax(0, 1fr))
    `,
  };

  return (
    <div className={gridClasses} style={style} {...props}>
      {children}
    </div>
  );
}

export default Card;