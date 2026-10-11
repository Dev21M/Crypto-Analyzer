import { useState, useEffect, useRef } from 'react';
import { clsx } from 'clsx';

/**
 * Collapse component for smooth height transitions
 */
export function Collapse({ children, in: open, timeout = 200, className = '', ...props }) {
  const [height, setHeight] = useState(0);
  const [visible, setVisible] = useState(open);
  const contentRef = useRef(null);

  useEffect(() => {
    if (open) {
      setVisible(true);
      requestAnimationFrame(() => {
        if (contentRef.current) {
          setHeight(contentRef.current.scrollHeight);
        }
      });
    } else {
      setHeight(0);
      const timer = setTimeout(() => setVisible(false), timeout);
      return () => clearTimeout(timer);
    }
  }, [open, timeout]);

  return (
    <div
      className={clsx('collapse overflow-hidden transition-all', className)}
      style={{ height: open ? height : 0 }}
      {...props}
    >
      {visible && (
        <div ref={contentRef} style={{ height: open ? 'auto' : 0 }}>
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Fade component for opacity transitions
 */
export function Fade({ children, in: open, timeout = 150, className = '', ...props }) {
  return (
    <div
      className={clsx(
        'fade transition-opacity',
        open ? 'opacity-100' : 'opacity-0',
        className
      )}
      style={{ transitionDuration: `${timeout}ms` }}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Slide component for position transitions
 */
export function Slide({ children, in: open, direction = 'up', timeout = 200, className = '', ...props }) {
  const directions = {
    up: { enter: 'translateY(10px)', exit: 'translateY(0)' },
    down: { enter: 'translateY(-10px)', exit: 'translateY(0)' },
    left: { enter: 'translateX(10px)', exit: 'translateX(0)' },
    right: { enter: 'translateX(-10px)', exit: 'translateX(0)' },
  };

  const { enter, exit } = directions[direction];

  return (
    <div
      className={clsx(
        'slide transition-all',
        open ? 'opacity-100 translate-y-0 translate-x-0' : `opacity-0 ${exit}`,
        className
      )}
      style={{ transitionDuration: `${timeout}ms` }}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Scale component for scale transitions
 */
export function Scale({ children, in: open, timeout = 150, className = '', ...props }) {
  return (
    <div
      className={clsx(
        'scale transition-all',
        open ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
        className
      )}
      style={{ transitionDuration: `${timeout}ms` }}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * AnimatePresence for orchestrating enter/exit animations
 */
export function AnimatePresence({ children, initial = false }) {
  // This is a placeholder for a more complex animation library integration
  // In a real app, you might use framer-motion or similar
  return <>{children}</>;
}

export default Collapse;