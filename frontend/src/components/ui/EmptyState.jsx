import React from 'react';
import { clsx } from 'clsx';
import { Button } from './Button';

/**
 * Empty State component for displaying when no data is available
 * Supports illustration, message, and action button
 */
export function EmptyState({
  title = 'No data available',
  message,
  icon,
  action,
  secondaryAction,
  illustration,
  className = '',
  size = 'md',
  variant = 'default',
  ...props
}) {
  const sizeClasses = {
    sm: 'py-6 px-4',
    md: 'py-12 px-6',
    lg: 'py-16 px-8',
    xl: 'py-20 px-10',
  };

  const variantClasses = {
    default: 'bg-card border border-primary',
    inline: 'bg-transparent border-0 p-0',
    card: 'bg-card border border-primary',
    page: 'min-h-[300px] flex flex-col items-center justify-center',
  };

  // Default icons for common states
  const defaultIcons = {
    search: (
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted opacity-50">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    filter: (
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted opacity-50">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
      </svg>
    ),
    data: (
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted opacity-50">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    chart: (
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted opacity-50">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    user: (
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted opacity-50">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    wallet: (
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted opacity-50">
        <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
        <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
        <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
      </svg>
    ),
    notification: (
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted opacity-50">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
    error: (
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-danger opacity-50">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    success: (
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-success opacity-50">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  };

  // Default messages for common states
  const defaultMessages = {
    search: 'Try adjusting your search terms or filters',
    filter: 'No results match your current filters',
    data: 'There is no data to display at the moment',
    chart: 'Not enough data to render the chart',
    user: 'No users found',
    wallet: 'Your portfolio is empty',
    notification: 'No notifications yet',
    error: 'Something went wrong. Please try again.',
    success: 'Operation completed successfully',
  };

  // Determine illustration
  const renderIllustration = () => {
    if (illustration) {
      return typeof illustration === 'string' 
        ? defaultIcons[illustration] || defaultIcons.data
        : illustration;
    }
    return icon || defaultIcons.data;
  };

  // Determine message
  const renderMessage = () => {
    if (message) return message;
    if (illustration && defaultMessages[illustration]) {
      return defaultMessages[illustration];
    }
    return 'No data available';
  };

  // Render action button
  const renderAction = () => {
    if (!action) return null;
    return (
      <Button
        variant={action.variant || 'primary'}
        size={action.size || 'md'}
        onClick={action.onClick}
        disabled={action.disabled}
        loading={action.loading}
        leftIcon={action.leftIcon}
        rightIcon={action.rightIcon}
        className={action.className}
      >
        {action.label || 'Action'}
      </Button>
    );
  };

  // Render secondary action
  const renderSecondaryAction = () => {
    if (!secondaryAction) return null;
    return (
      <Button
        variant={secondaryAction.variant || 'ghost'}
        size={secondaryAction.size || 'md'}
        onClick={secondaryAction.onClick}
        disabled={secondaryAction.disabled}
        className={secondaryAction.className}
      >
        {secondaryAction.label}
      </Button>
    );
  };

  return (
    <div
      className={clsx(
        'empty-state flex flex-col items-center justify-center text-center',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {/* Illustration/Icon */}
      <div className="empty-state-icon mb-4" aria-hidden="true">
        {renderIllustration()}
      </div>

      {/* Title */}
      {title && (
        <h3 className="empty-state-title text-lg font-semibold text-primary mb-2">
          {title}
        </h3>
      )}

      {/* Message */}
      <p className="empty-state-message text-secondary max-w-md mb-6">
        {renderMessage()}
      </p>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="empty-state-action flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md">
          {renderAction()}
          {renderSecondaryAction()}
        </div>
      )}
    </div>
  );
}

/**
 * Predefined empty state variants for common use cases
 */
export const EmptyStateVariants = {
  // No search results
  search: (onClearFilters, onRetry) => ({
    illustration: 'search',
    title: 'No results found',
    message: 'Try adjusting your search terms or filters',
    action: onClearFilters ? { label: 'Clear Filters', onClick: onClearFilters, variant: 'secondary' } : undefined,
    secondaryAction: onRetry ? { label: 'Retry', onClick: onRetry, variant: 'ghost' } : undefined,
  }),

  // No data after filtering
  filter: (onClearFilters) => ({
    illustration: 'filter',
    title: 'No matches found',
    message: 'No results match your current filters',
    action: onClearFilters ? { label: 'Clear All Filters', onClick: onClearFilters, variant: 'primary' } : undefined,
  }),

  // No data available
  noData: (onRefresh) => ({
    illustration: 'data',
    title: 'No data available',
    message: 'There is no data to display at the moment',
    action: onRefresh ? { label: 'Refresh', onClick: onRefresh, variant: 'primary', leftIcon: <RefreshIcon /> } : undefined,
  }),

  // Empty chart
  chart: (onChangeTimeframe) => ({
    illustration: 'chart',
    title: 'No chart data',
    message: 'Not enough data to render the chart for this timeframe',
    action: onChangeTimeframe ? { label: 'Change Timeframe', onClick: onChangeTimeframe, variant: 'primary' } : undefined,
  }),

  // Empty portfolio
  portfolio: (onAddAsset) => ({
    illustration: 'wallet',
    title: 'Portfolio is empty',
    message: 'Start building your portfolio by adding assets',
    action: onAddAsset ? { label: 'Add Asset', onClick: onAddAsset, variant: 'primary' } : undefined,
  }),

  // Empty watchlist
  watchlist: (onAddCoin) => ({
    illustration: 'star',
    title: 'Watchlist is empty',
    message: 'Add coins to track their price movements',
    action: onAddCoin ? { label: 'Add Coin', onClick: onAddCoin, variant: 'primary' } : undefined,
  }),

  // No notifications
  notifications: () => ({
    illustration: 'notification',
    title: 'No notifications',
    message: 'You\'re all caught up!',
  }),

  // Error state
  error: (onRetry, onGoHome) => ({
    illustration: 'error',
    title: 'Something went wrong',
    message: 'An unexpected error occurred. Please try again.',
    action: onRetry ? { label: 'Try Again', onClick: onRetry, variant: 'primary' } : undefined,
    secondaryAction: onGoHome ? { label: 'Go Home', onClick: onGoHome, variant: 'ghost' } : undefined,
  }),

  // Success state
  success: (onContinue) => ({
    illustration: 'success',
    title: 'Success!',
    message: 'Operation completed successfully',
    action: onContinue ? { label: 'Continue', onClick: onContinue, variant: 'primary' } : undefined,
  }),

  // No users
  users: (onInvite) => ({
    illustration: 'user',
    title: 'No users found',
    message: 'There are no users matching your criteria',
    action: onInvite ? { label: 'Invite User', onClick: onInvite, variant: 'primary' } : undefined,
  }),
};

/**
 * EmptyState with predefined variant
 */
export function EmptyStatePreset({ variant, ...props }) {
  const config = EmptyStateVariants[variant];
  if (!config) {
    console.warn(`EmptyState variant "${variant}" not found`);
    return <EmptyState {...props} />;
  }
  return <EmptyState {...config} {...props} />;
}

/**
 * Refresh icon for reuse
 */
function RefreshIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

export default EmptyState;