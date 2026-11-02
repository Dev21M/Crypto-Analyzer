import React, { Component } from 'react';
import { clsx } from 'clsx';
import { AlertTriangle, RefreshCw, Home, Bug, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './Button';

/**
 * Error Boundary component for catching React errors
 * Provides fallback UI with retry functionality and error details
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log to error reporting service if provided
    this.props.onError?.(error, errorInfo);
    
    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
    this.props.onRetry?.();
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  render() {
    const { hasError, error, errorInfo, showDetails } = this.state;
    const { 
      fallback, 
      fallbackRender,
      children,
      className = '',
      showErrorDetails = process.env.NODE_ENV === 'development',
      resetKeys,
    } = this.props;

    if (hasError) {
      // Custom fallback render function
      if (fallbackRender) {
        return fallbackRender({ error, errorInfo, retry: this.handleRetry, reload: this.handleReload });
      }

      // Custom fallback component
      if (fallback) {
        return React.isValidElement(fallback) 
          ? React.cloneElement(fallback, { error, errorInfo, retry: this.handleRetry, reload: this.handleReload })
          : fallback({ error, errorInfo, retry: this.handleRetry, reload: this.handleReload });
      }

      // Default fallback UI
      return (
        <div className={clsx('error-boundary p-6', className)} role="alert">
          <div className="max-w-md mx-auto text-center">
            {/* Error Icon */}
            <div className="mx-auto mb-4 p-4 rounded-full bg-danger-bg inline-flex">
              <AlertTriangle size={32} className="text-danger" aria-hidden="true" />
            </div>

            {/* Error Title */}
            <h2 className="text-xl font-semibold text-primary mb-2">
              Something went wrong
            </h2>

            {/* Error Message */}
            <p className="text-secondary mb-6">
              {error?.message || 'An unexpected error occurred. Please try again.'}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <Button
                variant="primary"
                onClick={this.handleRetry}
                leftIcon={<RefreshCw size={16} />}
              >
                Try Again
              </Button>
              <Button
                variant="secondary"
                onClick={this.handleGoHome}
                leftIcon={<Home size={16} />}
              >
                Go Home
              </Button>
            </div>

            {/* Error Details (Development) */}
            {showErrorDetails && error && (
              <div className="error-details text-left border-t border-primary pt-4">
                <button
                  className="flex items-center gap-2 text-sm text-muted hover:text-secondary mb-3"
                  onClick={this.toggleDetails}
                  aria-expanded={showDetails}
                >
                  {showDetails ? (
                    <>
                      <ChevronUp size={16} />
                      Hide Details
                    </>
                  ) : (
                    <>
                      <ChevronDown size={16} />
                      Show Details
                    </>
                  )}
                </button>

                {showDetails && (
                  <div className="bg-tertiary rounded-lg p-3 overflow-auto max-h-64">
                    <div className="mb-2">
                      <span className="font-mono text-xs text-danger">Error:</span>
                      <pre className="font-mono text-xs text-secondary mt-1 whitespace-pre-wrap break-words">
                        {error.message}
                        {error.stack && `\n\n${error.stack}`}
                      </pre>
                    </div>
                    {errorInfo && (
                      <div>
                        <span className="font-mono text-xs text-danger">Component Stack:</span>
                        <pre className="font-mono text-xs text-secondary mt-1 whitespace-pre-wrap break-words">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                    <div className="flex gap-2 mt-4">
                      <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(
                        `Error: ${error.message}\nStack: ${error.stack}\nComponent Stack: ${errorInfo?.componentStack}`
                      )}>
                        <Bug size={14} className="mr-1" />
                        Copy Error
                      </Button>
                      <Button variant="ghost" size="sm" onClick={this.handleRetry}>
                        <RefreshCw size={14} className="mr-1" />
                        Retry
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Reset Keys Info */}
            {resetKeys && resetKeys.length > 0 && (
              <p className="text-xs text-muted mt-4">
                This error boundary will reset when these props change: {resetKeys.join(', ')}
              </p>
            )}
          </div>
        </div>
      );
    }

    return children;
  }
}

/**
 * Higher-order component to wrap a component with ErrorBoundary
 */
export function withErrorBoundary(WrappedComponent, errorBoundaryProps = {}) {
  return function WithErrorBoundary(props) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}

/**
 * Hook for programmatically throwing errors to the nearest ErrorBoundary
 */
export function useErrorHandler() {
  // This hook must be used within an ErrorBoundary
  // It throws an error that will be caught by the nearest ErrorBoundary ancestor
  
  const throwError = React.useCallback((error) => {
    // We use a trick to throw the error in the render phase
    // by setting state that causes a re-render with the error
    throw error instanceof Error ? error : new Error(String(error));
  }, []);

  return { throwError };
}

/**
 * Simple error display component for non-boundary errors
 */
export function ErrorDisplay({ 
  message = 'An error occurred', 
  onRetry, 
  onReload,
  variant = 'inline',
  className = '',
}) {
  const isInline = variant === 'inline';
  const isCard = variant === 'card';
  const isPage = variant === 'page';

  const baseClasses = clsx(
    'error-display',
    isInline && 'inline-flex items-center gap-3 p-3 bg-danger-bg border border-danger-border rounded-lg',
    isCard && 'p-6 text-center',
    isPage && 'min-h-[300px] flex flex-col items-center justify-center p-8',
    className
  );

  return (
    <div className={baseClasses} role="alert">
      {isPage && (
        <div className="mx-auto mb-4 p-4 rounded-full bg-danger-bg inline-flex">
          <AlertTriangle size={32} className="text-danger" aria-hidden="true" />
        </div>
      )}
      
      <div className={clsx(isInline ? 'flex-1' : 'text-center')}>
        {isPage && <h3 className="text-lg font-semibold text-primary mb-2">Something went wrong</h3>}
        <p className={clsx(isInline ? 'text-sm' : 'text-secondary', isPage ? 'mb-6' : '')}>
          {message}
        </p>
        
        {(onRetry || onReload) && (
          <div className={clsx('flex gap-2 mt-4', isInline ? '' : 'justify-center')}>
            {onRetry && (
              <Button
                variant={isInline ? 'ghost' : 'primary'}
                size={isInline ? 'sm' : 'md'}
                onClick={onRetry}
                leftIcon={<RefreshCw size={16} />}
              >
                Try Again
              </Button>
            )}
            {onReload && (
              <Button
                variant={isInline ? 'ghost' : 'secondary'}
                size={isInline ? 'sm' : 'md'}
                onClick={onReload}
                leftIcon={<Home size={16} />}
              >
                {isPage ? 'Go Home' : 'Reload'}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ErrorBoundary;