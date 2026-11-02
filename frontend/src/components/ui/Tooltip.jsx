import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';

/**
 * Tooltip component with portal rendering and multiple positions
 */
export function Tooltip({
  children,
  content,
  position = 'top',
  delay = 200,
  className = '',
  arrow = true,
  ...props
}) {
  const [visible, setVisible] = useState(false);
  const [triggerRect, setTriggerRect] = useState(null);
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const timeoutRef = useRef(null);

  const show = () => {
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        setTriggerRect(triggerRef.current.getBoundingClientRect());
      }
      setVisible(true);
    }, delay);
  };

  const hide = () => {
    clearTimeout(timeoutRef.current);
    setVisible(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' || e.key === 'Tab') {
      hide();
    }
  };

  // Only render portal when visible
  const tooltipContent = visible && content ? createPortal(
    <div
      ref={tooltipRef}
      className={clsx(
        'tooltip-content',
        `tooltip-${position}`,
        className
      )}
      style={getTooltipStyles(position, triggerRect, arrow)}
      role="tooltip"
      aria-hidden="false"
    >
      {content}
      {arrow && <div className="tooltip-arrow" data-position={position} />}
    </div>,
    document.body
  ) : null;

  return (
    <span
      ref={triggerRef}
      className={clsx('tooltip-trigger inline-block', props.className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onKeyDown={handleKeyDown}
      aria-describedby={visible ? 'tooltip-content' : undefined}
      {...props}
    >
      {children}
      {tooltipContent}
    </span>
  );
}

function getTooltipStyles(position, rect, arrow) {
  if (!rect) return {};

  const offset = arrow ? 12 : 8;
  const styles = {};

  switch (position) {
    case 'top':
      styles.top = `${rect.top - offset}px`;
      styles.left = `${rect.left + rect.width / 2}px`;
      styles.transform = 'translateX(-50%) translateY(-100%)';
      break;
    case 'bottom':
      styles.top = `${rect.bottom + offset}px`;
      styles.left = `${rect.left + rect.width / 2}px`;
      styles.transform = 'translateX(-50%)';
      break;
    case 'left':
      styles.top = `${rect.top + rect.height / 2}px`;
      styles.left = `${rect.left - offset}px`;
      styles.transform = 'translateY(-50%) translateX(-100%)';
      break;
    case 'right':
      styles.top = `${rect.top + rect.height / 2}px`;
      styles.left = `${rect.right + offset}px`;
      styles.transform = 'translateY(-50%)';
      break;
    default:
      styles.top = `${rect.top - offset}px`;
      styles.left = `${rect.left + rect.width / 2}px`;
      styles.transform = 'translateX(-50%) translateY(-100%)';
      break;
  }

  return styles;
}

/**
 * Popover component (similar to tooltip but with interactive content)
 */
export function Popover({
  children,
  content,
  position = 'bottom',
  trigger = 'click',
  className = '',
  closeOnOutsideClick = true,
  ...props
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const contentRef = useRef(null);

  const toggle = () => setOpen(!open);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open || !closeOnOutsideClick) return;

    const handleClickOutside = (e) => {
      if (
        triggerRef.current?.contains(e.target) ||
        contentRef.current?.contains(e.target)
      ) {
        return;
      }
      close();
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, closeOnOutsideClick]);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') close();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open]);

  const popoverContent = open ? createPortal(
    <div
      ref={contentRef}
      className={clsx('popover-content', `popover-${position}`, className)}
      role="dialog"
      aria-modal="false"
    >
      {content}
    </div>,
    document.body
  ) : null;

  const triggerProps = trigger === 'click'
    ? { onClick: toggle }
    : { onMouseEnter: toggle, onMouseLeave: close };

  return (
    <span className="popover-trigger inline-block" {...props}>
      {React.cloneElement(children, {
        ...triggerProps,
        ref: triggerRef,
        'aria-haspopup': 'dialog',
        'aria-expanded': open,
      })}
      {popoverContent}
    </span>
  );
}

export default Tooltip;