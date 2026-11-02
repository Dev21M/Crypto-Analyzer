import React from 'react';
import { clsx } from 'clsx';

/**
 * Avatar component for user/coin images with fallback
 */
export function Avatar({
  src,
  alt,
  name,
  size = 'md',
  shape = 'circle',
  className = '',
  fallbackColor,
  ...props
}) {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl',
  };

  const shapeClasses = {
    circle: 'rounded-full',
    square: 'rounded-lg',
    rounded: 'rounded-md',
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getColor = (name, fallback) => {
    if (fallback) return fallback;
    const colors = [
      'bg-brand-500',
      'bg-success',
      'bg-warning',
      'bg-danger',
      'bg-purple-500',
      'bg-pink-500',
      'bg-cyan-500',
      'bg-lime-500',
      'bg-orange-500',
      'bg-indigo-500',
    ];
    if (!name) return colors[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const hasImage = src && !props.onError; // Assume no error if no onError handler

  return (
    <div
      className={clsx(
        'avatar flex-shrink-0 flex items-center justify-center overflow-hidden',
        sizeClasses[size],
        shapeClasses[shape],
        className
      )}
      {...props}
    >
      {hasImage ? (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className="avatar-image w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextSibling.style.display = 'flex';
          }}
        />
      ) : null}
      <div
        className={clsx(
          'avatar-fallback flex items-center justify-center w-full h-full font-semibold text-white',
          getColor(name, fallbackColor)
        )}
        style={{ display: hasImage ? 'none' : 'flex' }}
        aria-hidden="true"
      >
        {name ? getInitials(name) : '?'}
      </div>
    </div>
  );
}

/**
 * Coin Avatar specifically for cryptocurrency icons
 */
export function CoinAvatar({
  symbol,
  name,
  src,
  size = 'md',
  className = '',
  ...props
}) {
  const sizeClasses = {
    xs: 'w-5 h-5',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12',
  };

  const fallbackColors = {
    BTC: 'bg-orange-500',
    ETH: 'bg-blue-600',
    SOL: 'bg-green-400',
    BNB: 'bg-yellow-500',
    XRP: 'bg-blue-500',
    ADA: 'bg-blue-400',
    DOGE: 'bg-yellow-400',
    MATIC: 'bg-purple-500',
    DOT: 'bg-pink-500',
    AVAX: 'bg-red-500',
    LINK: 'bg-blue-500',
    UNI: 'bg-pink-500',
    LTC: 'bg-gray-400',
    BCH: 'bg-green-500',
    ATOM: 'bg-purple-600',
    NEAR: 'bg-green-500',
    FTX: 'bg-gray-800',
  };

  const getFallbackColor = (sym) => {
    return fallbackColors[sym?.toUpperCase()] || 'bg-brand-500';
  };

  const hasImage = src && !props.onError;

  return (
    <div
      className={clsx(
        'coin-avatar flex-shrink-0 overflow-hidden rounded-full',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {hasImage ? (
        <img
          src={src}
          alt={`${symbol} icon`}
          className="coin-avatar-image w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextSibling.style.display = 'flex';
          }}
        />
      ) : null}
      <div
        className={clsx(
          'coin-avatar-fallback flex items-center justify-center w-full h-full font-bold text-white text-xs uppercase',
          getFallbackColor(symbol)
        )}
        style={{ display: hasImage ? 'none' : 'flex' }}
        aria-hidden="true"
      >
        {symbol?.slice(0, 2).toUpperCase() || '?'}
      </div>
    </div>
  );
}

/**
 * Avatar Group for stacked avatars
 */
export function AvatarGroup({
  children,
  max = 5,
  size = 'md',
  className = '',
  ...props
}) {
  const validChildren = React.Children.toArray(children).filter(Boolean);
  const visibleChildren = validChildren.slice(0, max);
  const remainingCount = validChildren.length - max;

  return (
    <div className={clsx('avatar-group flex -space-x-2', className)} {...props}>
      {visibleChildren.map((child, index) => (
        <span key={index} className="relative z-10">
          {React.cloneElement(child, { size })}
        </span>
      ))}
      {remainingCount > 0 && (
        <Avatar
          size={size}
          name={`+${remainingCount}`}
          className="bg-tertiary text-secondary border-2 border-primary"
        />
      )}
    </div>
  );
}

export default Avatar;