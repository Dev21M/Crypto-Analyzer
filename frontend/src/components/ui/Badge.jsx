import React from 'react';
import { clsx } from 'clsx';

/**
 * Badge component for status indicators
 */
export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
  ...props
}) {
  const variantClasses = {
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    error: 'badge-danger',
    info: 'badge-info',
    neutral: 'badge-neutral',
    primary: 'badge-primary',
  };

  const sizeClasses = {
    sm: 'badge-sm',
    md: '',
    lg: 'badge-lg',
  };

  const dotColors = {
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
    error: 'bg-danger',
    info: 'bg-info',
    neutral: 'bg-muted',
    primary: 'bg-primary',
  };

  return (
    <span
      className={clsx(
        'badge',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={clsx('badge-dot', dotColors[variant])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

/**
 * Status Badge with semantic variants
 */
export function StatusBadge({ status, className = '', ...props }) {
  const statusConfig = {
    online: { variant: 'success', label: 'Online' },
    offline: { variant: 'neutral', label: 'Offline' },
    connecting: { variant: 'warning', label: 'Connecting' },
    error: { variant: 'danger', label: 'Error' },
    warning: { variant: 'warning', label: 'Warning' },
    success: { variant: 'success', label: 'Success' },
    pending: { variant: 'warning', label: 'Pending' },
    active: { variant: 'success', label: 'Active' },
    inactive: { variant: 'neutral', label: 'Inactive' },
    loading: { variant: 'info', label: 'Loading' },
    bullish: { variant: 'success', label: 'Bullish' },
    bearish: { variant: 'danger', label: 'Bearish' },
    sideways: { variant: 'neutral', label: 'Sideways' },
    high_volatility: { variant: 'warning', label: 'High Volatility' },
    unknown: { variant: 'neutral', label: 'Unknown' },
    up: { variant: 'success', label: 'Up' },
    down: { variant: 'danger', label: 'Down' },
    neutral: { variant: 'neutral', label: 'Neutral' },
  };

  const config = statusConfig[status?.toLowerCase()] || { variant: 'neutral', label: status };
  
  return (
    <Badge variant={config.variant} dot className={className} {...props}>
      {config.label}
    </Badge>
  );
}

/**
 * Pill Badge for tags/categories
 */
export function Pill({
  children,
  variant = 'neutral',
  removable = false,
  onRemove,
  className = '',
  leftIcon,
  rightIcon,
  ...props
}) {
  const variantClasses = {
    success: 'bg-success-bg text-success border-success-border',
    warning: 'bg-warning-bg text-warning border-warning-border',
    danger: 'bg-danger-bg text-danger border-danger-border',
    info: 'bg-info-bg text-info border-info-border',
    neutral: 'bg-tertiary text-secondary border-primary',
    primary: 'bg-primary-bg text-primary border-primary-border',
  };

  return (
    <span
      className={clsx(
        'tag',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {leftIcon && <span className="tag-icon" aria-hidden="true">{leftIcon}</span>}
      <span className="tag-text">{children}</span>
      {rightIcon && <span className="tag-icon" aria-hidden="true">{rightIcon}</span>}
      {removable && (
        <button
          type="button"
          className="tag-remove"
          onClick={onRemove}
          aria-label={`Remove ${children}`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </span>
  );
}

export default Badge;