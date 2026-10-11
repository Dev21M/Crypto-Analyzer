import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

// Toast context for global toast management
const ToastContext = React.createContext(null);

export function ToastProvider({ children, position = 'bottom-right', maxToasts = 5 }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      duration: 5000,
      dismissible: true,
      ...toast,
    };

    setToasts((prev) => {
      const updated = [newToast, ...prev].slice(0, maxToasts);
      return updated;
    });

    return id;
  }, [maxToasts]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const toast = useCallback((options) => {
    if (typeof options === 'string') {
      return addToast({ message: options });
    }
    return addToast(options);
  }, [addToast]);

  const variants = {
    success: (options) => toast({ ...options, variant: 'success' }),
    error: (options) => toast({ ...options, variant: 'error' }),
    warning: (options) => toast({ ...options, variant: 'warning' }),
    info: (options) => toast({ ...options, variant: 'info' }),
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast: toast, removeToast, clearToasts, ...variants }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} position={position} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

/**
 * Individual Toast Component
 */
function Toast({ toast, onRemove }) {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  const icons = {
    success: <CheckCircle size={20} />,
    error: <AlertCircle size={20} />,
    warning: <AlertTriangle size={20} />,
    info: <Info size={20} />,
  };

  const variantClasses = {
    success: 'toast-success',
    error: 'toast-danger',
    warning: 'toast-warning',
    info: 'toast-info',
  };

  useEffect(() => {
    if (toast.duration > 0) {
      const timer = setTimeout(() => {
        setExiting(true);
        setTimeout(() => {
          setVisible(false);
          onRemove(toast.id);
        }, 200);
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.duration, toast.id, onRemove]);

  if (!visible) return null;

  const handleDismiss = () => {
    if (toast.dismissible) {
      setExiting(true);
      setTimeout(() => {
        setVisible(false);
        onRemove(toast.id);
      }, 200);
    }
  };

  return (
    <div
      className={clsx(
        'toast animate-slideInRight',
        variantClasses[toast.variant] || 'toast-info',
        exiting && 'animate-fadeOut'
      )}
      role="alert"
      aria-live="polite"
    >
      <div className={clsx('toast-icon', toast.variant)}>
        {icons[toast.variant] || icons.info}
      </div>
      <div className="toast-content flex-1 min-w-0">
        {toast.title && (
          <div className="toast-title font-semibold text-sm">{toast.title}</div>
        )}
        {toast.message && (
          <div className="toast-message text-sm text-secondary">{toast.message}</div>
        )}
      </div>
      {toast.dismissible && (
        <button
          className="toast-close"
          onClick={handleDismiss}
          aria-label="Dismiss notification"
        >
          <X size={16} strokeWidth={2} />
        </button>
      )}
      {toast.action && (
        <button
          className="btn btn-ghost btn-sm toast-action"
          onClick={() => {
            toast.action.onClick?.();
            if (toast.action.dismiss !== false) handleDismiss();
          }}
        >
          {toast.action.label}
        </button>
      )}
    </div>
  );
}

/**
 * Toast Container
 */
function ToastContainer({ toasts, onRemove, position }) {
  const positionClasses = {
    'top-left': 'top-6 left-6',
    'top-right': 'top-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'bottom-right': 'bottom-6 right-6',
    'top-center': 'top-6 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2',
  };

  if (toasts.length === 0) return null;

  return createPortal(
    <div
      className={clsx(
        'toast-container fixed z-[800] flex flex-col gap-3 max-w-sm w-full',
        positionClasses[position] || positionClasses['bottom-right']
      )}
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>,
    document.body
  );
}

export default Toast;