import React, { useCallback, useState } from "react";
import { AlertTriangle, ArrowLeft, Home, RefreshCw } from "lucide-react";
import Button from "@/components/atoms/Button";
/**
 * Error Component - Displays various error states with recovery options
 * 
 * @param {Object} props
 * @param {string} props.title - Error title
 * @param {string} props.message - Error message
 * @param {string} props.type - Error type: 'network', 'validation', 'notFound', 'server', 'general'
 * @param {string} props.variant - Display variant: 'inline', 'card', 'fullscreen'
 * @param {Function} props.onRetry - Retry callback function
 * @param {Function} props.onGoBack - Go back callback function
 * @param {Function} props.onGoHome - Go home callback function
 * @param {boolean} props.showRetry - Show retry button
 * @param {boolean} props.showGoBack - Show go back button
 * @param {boolean} props.showGoHome - Show go home button
 * @param {boolean} props.isRetrying - Show loading state on retry
 * @param {string} props.className - Additional CSS classes
 * @param {React.ReactNode} props.children - Custom error content
 */
export const Error = ({
  title,
  message,
  type = 'general',
  variant = 'card',
  onRetry,
  onGoBack,
  onGoHome,
  showRetry = true,
  showGoBack = false,
  showGoHome = false,
  isRetrying = false,
  className = '',
  children
}) => {
  // Default error messages based on type
  const getDefaultContent = () => {
    switch (type) {
      case 'network':
        return {
          title: 'Connection Error',
          message: 'Unable to connect to the server. Please check your internet connection and try again.',
          icon: AlertTriangle
        };
      case 'validation':
        return {
          title: 'Invalid Input',
          message: 'Please check your input and try again.',
          icon: AlertTriangle
        };
      case 'notFound':
        return {
          title: 'Page Not Found',
          message: 'The page you are looking for does not exist or has been moved.',
          icon: AlertTriangle
        };
      case 'server':
        return {
          title: 'Server Error',
          message: 'Something went wrong on our end. Please try again later.',
          icon: AlertTriangle
        };
      default:
        return {
          title: 'Something went wrong',
          message: 'An unexpected error occurred. Please try again.',
          icon: AlertTriangle
        };
    }
  };

  const defaultContent = getDefaultContent();
  const errorTitle = title || defaultContent.title;
  const errorMessage = message || defaultContent.message;
  const IconComponent = defaultContent.icon;

  // Handle retry with loading state
  const handleRetry = () => {
    if (onRetry && !isRetrying) {
      onRetry();
    }
  };

  // Base styles for different variants
  const getVariantStyles = () => {
    switch (variant) {
      case 'inline':
        return 'p-4 bg-red-50 border border-red-200 rounded-lg';
      case 'fullscreen':
        return 'min-h-screen flex items-center justify-content p-6 bg-background';
      default: // card
        return 'p-6 bg-white rounded-xl shadow-soft border border-gray-100';
    }
  };

  const variantStyles = getVariantStyles();
  const textAlign = variant === 'fullscreen' ? 'text-center' : '';

  return (
    <div 
      className={`${variantStyles} ${textAlign} ${className}`}
      role="alert"
      aria-live="polite"
    >
      {variant === 'fullscreen' && (
        <div className="max-w-md mx-auto">
          <div className="mb-6">
            <IconComponent 
              className="w-16 h-16 text-error mx-auto mb-4" 
              aria-hidden="true"
            />
          </div>
        </div>
      )}

      {variant !== 'fullscreen' && (
        <div className="flex items-start space-x-3">
          <IconComponent 
            className="w-6 h-6 text-error mt-0.5 flex-shrink-0" 
            aria-hidden="true"
          />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {errorTitle}
            </h3>
            <p className="text-gray-600 mb-4">
              {errorMessage}
            </p>
          </div>
        </div>
      )}

      {variant === 'fullscreen' && (
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {errorTitle}
          </h1>
          <p className="text-gray-600 mb-8 text-lg">
            {errorMessage}
          </p>
        </div>
      )}

      {/* Custom children content */}
      {children && (
        <div className={variant === 'fullscreen' ? 'max-w-md mx-auto mb-6' : 'mb-4'}>
          {children}
        </div>
      )}

      {/* Action buttons */}
      {(showRetry || showGoBack || showGoHome) && (
        <div className={`flex gap-3 ${variant === 'fullscreen' ? 'justify-center max-w-md mx-auto' : 'justify-start'}`}>
          {showRetry && onRetry && (
            <Button
              onClick={handleRetry}
              disabled={isRetrying}
              variant="primary"
              size="sm"
              className="flex items-center gap-2"
              aria-label="Retry the failed operation"
            >
              <RefreshCw 
                className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} 
                aria-hidden="true"
              />
              {isRetrying ? 'Retrying...' : 'Try Again'}
            </Button>
          )}

          {showGoBack && onGoBack && (
            <Button
              onClick={onGoBack}
              variant="secondary"
              size="sm"
              className="flex items-center gap-2"
              aria-label="Go back to previous page"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              Go Back
            </Button>
          )}

          {showGoHome && onGoHome && (
            <Button
              onClick={onGoHome}
              variant="secondary"
              size="sm"
              className="flex items-center gap-2"
              aria-label="Go to home page"
            >
              <Home className="w-4 h-4" aria-hidden="true" />
              Go Home
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * ErrorBoundary Component - Catches JavaScript errors in component tree
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log error for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Error
          title="Application Error"
          message="Something went wrong in the application. This error has been logged."
          type="server"
          variant="fullscreen"
          onRetry={this.handleRetry}
          showRetry={true}
          showGoHome={true}
          onGoHome={() => window.location.href = '/'}
        >
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-4 p-4 bg-gray-100 rounded-lg text-left">
              <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                Error Details (Development Only)
              </summary>
              <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-auto">
                {this.state.error.toString()}
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </Error>
      );
    }

    return this.props.children;
  }
}

/**
 * useErrorHandler Hook - For handling errors in functional components
 */
export const useErrorHandler = () => {
  const [error, setError] = React.useState(null);
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleError = React.useCallback((error) => {
    console.error('Error caught by useErrorHandler:', error);
    setError(error);
    setIsRetrying(false);
  }, []);

  const retry = React.useCallback((retryFn) => {
    if (typeof retryFn === 'function') {
      setIsRetrying(true);
      setError(null);
      
      try {
        const result = retryFn();
        
        // Handle promise-based retry functions
        if (result && typeof result.catch === 'function') {
          result.catch(handleError).finally(() => setIsRetrying(false));
        } else {
          setIsRetrying(false);
        }
      } catch (err) {
        handleError(err);
      }
    }
  }, [handleError]);

  const clearError = React.useCallback(() => {
    setError(null);
    setIsRetrying(false);
  }, []);

  return {
    error,
    isRetrying,
    handleError,
    retry,
    clearError
  };
};

export default Error;