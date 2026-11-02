import React from 'react';
import { clsx } from 'clsx';

/**
 * Button component with multiple variants and sizes
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  asChild = false,
  className = '',
  onClick,
  type = 'button',
  'aria-label': ariaLabel,
  ...props
}) {
  const baseClasses = 'btn';
  const variantClasses = `btn-${variant}`;
  const sizeClasses = size !== 'md' ? `btn-${size}` : '';
  const widthClass = fullWidth ? 'w-full' : '';

  const classes = clsx(baseClasses, variantClasses, sizeClasses, widthClass, className);

  if (loading) {
    return (
      <button
        className={classes}
        disabled={true}
        aria-busy="true"
        aria-label={ariaLabel || 'Loading'}
        type={type}
        {...props}
      >
        <span className="spinner spinner-inline" aria-hidden="true" />
        <span className="visually-hidden">Loading...</span>
      </button>
    );
  }

  return (
    <button
      className={classes}
      disabled={disabled}
      onClick={onClick}
      type={type}
      aria-label={ariaLabel}
      aria-disabled={disabled}
      {...props}
    >
      {leftIcon && <span className="btn-icon-left" aria-hidden="true">{leftIcon}</span>}
      <span className="btn-text">{children}</span>
      {rightIcon && <span className="btn-icon-right" aria-hidden="true">{rightIcon}</span>}
    </button>
  );
}

/**
 * Button group for grouped actions
 */
export function ButtonGroup({ children, className = '', ...props }) {
  return (
    <div className={clsx('btn-group', className)} role="group" {...props}>
      {children}
    </div>
  );
}

export default Button;