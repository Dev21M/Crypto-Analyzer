import React from 'react';
import { clsx } from 'clsx';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, XCircle, HelpCircle, Info } from 'lucide-react';

/**
 * Price Change indicator with color coding
 */
export function PriceChange({
  value,
  prefix = '',
  suffix = '%',
  showIcon = true,
  className = '',
  precision = 2,
  ...props
}) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const isZero = value === 0 || value === null || value === undefined;

  const formattedValue = isZero
    ? '—'
    : `${isPositive ? '+' : ''}${Number(value).toFixed(precision)}${suffix}`;

  return (
    <span
      className={clsx(
        'price-change inline-flex items-center gap-1 font-mono font-medium',
        isPositive && 'text-success',
        isNegative && 'text-danger',
        isZero && 'text-muted',
        className
      )}
      {...props}
    >
      {showIcon && !isZero && (
        <span className="price-change-icon" aria-hidden="true">
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        </span>
      )}
      {showIcon && isZero && <Minus size={12} className="text-muted" />}
      <span className="price-change-value">
        {prefix}{formattedValue}
      </span>
    </span>
  );
}

/**
 * Metric Card for KPIs
 */
export function MetricCard({
  label,
  value,
  change,
  changeLabel,
  trend = 'neutral',
  icon,
  prefix,
  suffix,
  format,
  className = '',
  loading = false,
  error = null,
  ...props
}) {
  const trendColors = {
    up: 'text-success',
    down: 'text-danger',
    neutral: 'text-muted',
    warning: 'text-warning',
  };

  const trendIcons = {
    up: <TrendingUp size={12} />,
    down: <TrendingDown size={12} />,
    neutral: <Minus size={12} />,
    warning: <AlertTriangle size={12} />,
  };

  const displayValue = loading ? (
    <div className="skeleton h-10 w-3/4 mx-auto" />
  ) : error ? (
    <span className="text-danger font-mono">Error</span>
  ) : (
    <>
      {prefix && <span className="metric-prefix">{prefix}</span>}
      <span className="metric-value font-mono text-3xl font-bold">
        {format ? format(value) : value}
      </span>
      {suffix && <span className="metric-suffix">{suffix}</span>}
    </>
  );

  return (
    <article
      className={clsx(
        'metric-card card p-5',
        trend !== 'neutral' && `border-l-4 border-l-${trend === 'up' ? 'success' : trend === 'down' ? 'danger' : 'warning'}`,
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0">
          <p className="metric-label text-xs font-medium uppercase tracking-wider text-muted truncate">
            {label}
          </p>
        </div>
        {icon && (
          <div className={clsx('metric-icon flex-shrink-0 p-2 rounded-lg', trendColors[trend])}>
            {typeof icon === 'string' ? icon : React.cloneElement(icon, { size: 20, className: trendColors[trend] })}
          </div>
        )}
      </div>
      <div className="metric-value-container">
        {displayValue}
      </div>
      {change !== undefined && change !== null && !loading && !error && (
        <div className={clsx('metric-change flex items-center gap-1 mt-3', trendColors[trend])}>
          {trendIcons[trend]}
          <span className="font-medium">{change > 0 ? '+' : ''}{change}{changeLabel ? ` ${changeLabel}` : ''}</span>
        </div>
      )}
    </article>
  );
}

/**
 * Coin Avatar with icon fallback
 */
export function CoinAvatar({
  symbol,
  name,
  src,
  size = 'md',
  className = '',
  showSymbol = true,
  ...props
}) {
  const sizeClasses = {
    xs: 'w-5 h-5 text-[10px]',
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
    xl: 'w-12 h-12 text-lg',
  };

  const coinColors = {
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
  };

  const getColor = (sym) => coinColors[sym?.toUpperCase()] || 'bg-brand-500';
  const initials = symbol?.slice(0, 2).toUpperCase() || '?';

  return (
    <div
      className={clsx('coin-avatar relative flex-shrink-0 overflow-hidden rounded-full', sizeClasses[size], className)}
      {...props}
    >
      {src && (
        <img
          src={src}
          alt={`${symbol} icon`}
          className="w-full h-full object-cover"
        />
      )}
      {!src && (
        <div className={clsx('flex items-center justify-center w-full h-full font-bold text-white', getColor(symbol))}>
          {initials}
        </div>
      )}
      {showSymbol && (
        <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-bg-primary">
          {initials}
        </span>
      )}
    </div>
  );
}

/**
 * Coin Info display (avatar + name + symbol)
 */
export function CoinInfo({
  symbol,
  name,
  src,
  size = 'md',
  className = '',
  showSymbol = true,
  showName = true,
  link,
  ...props
}) {
  const content = (
    <div className={clsx('coin-info flex items-center gap-3', className)}>
      <CoinAvatar symbol={symbol} name={name} src={src} size={size} showSymbol={false} />
      <div className="min-w-0">
        {showName && (
          <span className="coin-name block font-medium truncate">{name || symbol}</span>
        )}
        {showSymbol && (
          <span className="coin-symbol text-sm text-muted">{symbol}</span>
        )}
      </div>
    </div>
  );

  if (link) {
    return (
      <a href={link} className="no-underline" {...props}>
        {content}
      </a>
    );
  }

  return <div {...props}>{content}</div>;
}

/**
 * Indicator Card for technical indicators
 */
export function IndicatorCard({
  label,
  value,
  interpretation,
  period,
  timestamp,
  trend,
  className = '',
  loading = false,
  error = null,
  tooltip,
  ...props
}) {
  const trendColors = {
    bullish: 'text-success',
    bearish: 'text-danger',
    neutral: 'text-muted',
    warning: 'text-warning',
  };

  const trendIcons = {
    bullish: <CheckCircle size={14} className="text-success" />,
    bearish: <XCircle size={14} className="text-danger" />,
    neutral: <Minus size={14} className="text-muted" />,
    warning: <AlertTriangle size={14} className="text-warning" />,
  };

  const trendLabels = {
    bullish: 'Bullish',
    bearish: 'Bearish',
    neutral: 'Neutral',
    warning: 'Caution',
  };

  return (
    <article
      className={clsx('indicator-card card p-4', className)}
      {...props}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p className="indicator-label text-xs font-medium uppercase tracking-wider text-muted">
            {label}
          </p>
          {period && (
            <p className="indicator-period text-xs text-muted mt-0.5">
              Period: {period}
            </p>
          )}
        </div>
        {tooltip && (
          <span className="indicator-tooltip text-muted hover:text-secondary cursor-help" title={tooltip}>
            <Info size={14} />
          </span>
        )}
      </div>
      <div className="indicator-value font-mono text-xl font-semibold mb-2">
        {loading ? (
          <div className="skeleton h-7 w-24" />
        ) : error ? (
          <span className="text-danger">N/A</span>
        ) : (
          <>
            {value !== null && value !== undefined ? (
              typeof value === 'number' ? value.toFixed(4) : value
            ) : (
              <span className="text-muted">—</span>
            )}
          </>
        )}
      </div>
      {interpretation && (
        <p className="indicator-interpretation text-sm text-secondary mb-2">
          {interpretation}
        </p>
      )}
      {(trend || timestamp) && (
        <div className="indicator-meta flex items-center gap-3 text-xs text-muted">
          {trend && (
            <span className={clsx('flex items-center gap-1', trendColors[trend])}>
              {trendIcons[trend]}
              <span className="font-medium">{trendLabels[trend]}</span>
            </span>
          )}
          {timestamp && (
            <span className="flex items-center gap-1">
              <span>Updated:</span>
              <time dateTime={timestamp}>{new Date(timestamp).toLocaleTimeString()}</time>
            </span>
          )}
        </div>
      )}
    </article>
  );
}

/**
 * Regime Badge for market regime display
 */
export function RegimeBadge({
  regime,
  confidence,
  className = '',
  showConfidence = true,
  size = 'md',
  ...props
}) {
  const regimeConfig = {
    bullish: { label: 'Bullish', variant: 'success', icon: <TrendingUp size={12} /> },
    bearish: { label: 'Bearish', variant: 'danger', icon: <TrendingDown size={12} /> },
    sideways: { label: 'Sideways', variant: 'neutral', icon: <Minus size={12} /> },
    high_volatility: { label: 'High Volatility', variant: 'warning', icon: <AlertTriangle size={12} /> },
    unknown: { label: 'Unknown', variant: 'neutral', icon: <HelpCircle size={12} /> },
  };

  const config = regimeConfig[regime?.toLowerCase()] || regimeConfig.unknown;
  const conf = confidence !== undefined ? confidence : 0;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const variantClasses = {
    success: 'bg-success-bg text-success border-success-border',
    danger: 'bg-danger-bg text-danger border-danger-border',
    warning: 'bg-warning-bg text-warning border-warning-border',
    neutral: 'bg-tertiary text-secondary border-primary',
  };

  return (
    <span
      className={clsx(
        'regime-badge inline-flex items-center gap-2 font-medium rounded-full border',
        variantClasses[config.variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {config.icon}
      <span>{config.label}</span>
      {showConfidence && confidence !== undefined && (
        <span className={clsx('regime-confidence ml-1 px-1.5 py-0.5 rounded text-xs font-mono', variantClasses[config.variant])}>
          {Math.round(conf * 100)}%
        </span>
      )}
    </span>
  );
}

/**
 * Sparkline mini chart
 */
export function Sparkline({
  data,
  color = 'currentColor',
  width = 100,
  height = 30,
  className = '',
  ...props
}) {
  if (!data || data.length < 2) {
    return <div className={clsx('sparkline', className)} style={{ width, height }} />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  const isPositive = data[data.length - 1] >= data[0];
  const strokeColor = color === 'currentColor' ? (isPositive ? 'var(--color-success)' : 'var(--color-danger)') : color;

  return (
    <svg
      className={clsx('sparkline', className)}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      {...props}
    >
      <path
        d={`M${points}`}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
    </svg>
  );
}

export default PriceChange;