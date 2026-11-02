import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import { X } from 'lucide-react';

/**
 * Modal component with portal rendering, focus trap, and accessibility
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showClose = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className = '',
  headerAction,
  footer,
  ...props
}) {
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      document.body.style.overflow = 'hidden';
      // Focus first focusable element
      setTimeout(() => {
        modalRef.current?.focus();
      }, 0);
    } else {
      document.body.style.overflow = '';
      previousActiveElement.current?.focus();
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleTab = (e) => {
      if (e.key !== 'Tab') return;

      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements?.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-[95vw] max-h-[95vh]',
  };

  const modalContent = (
    <div
      className={clsx('modal-overlay', className)}
      onClick={closeOnOverlayClick ? (e) => {
        if (e.target === e.currentTarget) onClose?.();
      } : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        ref={modalRef}
        className={clsx('modal', sizeClasses[size])}
        tabIndex={-1}
        {...props}
      >
        {(title || showClose) && (
          <header className="modal-header">
            {title && (
              <h2 id="modal-title" className="modal-title">{title}</h2>
            )}
            {showClose && (
              <button
                className="modal-close"
                onClick={onClose}
                aria-label="Close modal"
              >
                <X size={20} strokeWidth={2} />
              </button>
            )}
            {headerAction && (
              <div className="modal-header-action">
                {headerAction}
              </div>
            )}
          </header>
        )}
        <div className="modal-body">
          {children}
        </div>
        {footer && (
          <footer className="modal-footer">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );

  if (typeof window === 'undefined') return null;

  return createPortal(modalContent, document.body);
}

/**
 * Confirmation Dialog
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
  ...props
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      {...props}
    >
      <p className="text-secondary mb-6">{message}</p>
      <div className="modal-footer">
        <button
          className="btn btn-secondary"
          onClick={onClose}
          disabled={loading}
        >
          {cancelText}
        </button>
        <button
          className={clsx('btn', `btn-${variant}`)}
          onClick={() => {
            onConfirm?.();
            onClose?.();
          }}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner spinner-inline" aria-hidden="true" />
              <span className="visually-hidden">Processing...</span>
            </>
          ) : (
            confirmText
          )}
        </button>
      </div>
    </Modal>
  );
}

/**
 * Alert Dialog (simpler than confirm)
 */
export function AlertDialog({
  isOpen,
  onClose,
  title = 'Notice',
  message,
  confirmText = 'OK',
  ...props
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      showClose={false}
      {...props}
    >
      <p className="text-secondary mb-6">{message}</p>
      <div className="modal-footer">
        <button
          className="btn btn-primary"
          onClick={onClose}
          autoFocus
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}

export default Modal;