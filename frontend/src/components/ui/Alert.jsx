import React from 'react';
import { clsx } from 'clsx';
import { X } from 'lucide-react';

/**
 * Alert component for displaying messages
 */
export function Alert({
  children,
  variant = 'info',
  dismissible = false,
  onClose,
  className = '',
  ...props
}) {
  const variantClasses = {
    success: 'alert-success',
    warning: 'alert-warning',
    danger: 'alert-danger',
    error: 'alert-danger',
    info: 'alert-info',
  };

  return (
    <div
      className={clsx('alert', variantClasses[variant], className)}
      role="alert"
      {...props}
    >
      <div className="alert-content flex-1 min-w-0">
        {children}
      </div>
      {dismissible && (
        <button
          className="alert-dismiss"
          onClick={onClose}
          aria-label="Dismiss alert"
        >
          <X size={16} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}

export default Alert;