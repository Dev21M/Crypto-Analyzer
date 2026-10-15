import React from 'react';
import { clsx } from 'clsx';

/**
 * Skeleton loading component
 */
export function Skeleton({
  className = '',
  variant = 'text',
  width,
  height,
  ...props
}) {
  const variantClasses = {
    text: 'h-4',
    title: 'h-6 w-3/4',
    card: 'h-32',
    avatar: 'rounded-full',
    button: 'h-10 w-24 rounded-lg',
    chart: 'h-64',
    table: 'h-12',
  };

  return (
    <div
      className={clsx(
        'skeleton',
        variantClasses[variant],
        className
      )}
      style={{ width, height }}
      {...props}
    />
  );
}

export default Skeleton;