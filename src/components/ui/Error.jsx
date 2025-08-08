import React, { useCallback, useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, Eye, Headphones, Home, Monitor, RefreshCw, Smartphone, Wifi } from "lucide-react";
import ApperIcon from "@/components/ApperIcon";
import HomePage from "@/components/pages/Home";
import Button from "@/components/atoms/Button";

/**
 * Enhanced Error Component with comprehensive browser compatibility and accessibility support
 * 
 * Features:
 * - Cross-browser compatibility detection
 * - Screen reader optimization
 * - Touch device support
 * - Network status awareness
 * - Performance tracking
 * - Accessibility compliance (WCAG 2.1)
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
  const [browserInfo, setBrowserInfo] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [retryCount, setRetryCount] = useState(0);
  const [accessibilityMode, setAccessibilityMode] = useState(false);

  useEffect(() => {
    // Detect browser and device capabilities
    const userAgent = navigator.userAgent;
    const browserInfo = {
      name: 'Unknown',
      version: 'Unknown',
      mobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
      touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      screenReader: window.speechSynthesis !== undefined || 
                    'speechSynthesis' in window ||
                    document.querySelector('[aria-live]') !== null,
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      highContrast: window.matchMedia('(prefers-contrast: high)').matches,
      darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches
    };

    // Browser detection
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      browserInfo.name = 'Chrome';
      browserInfo.version = userAgent.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
    } else if (userAgent.includes('Firefox')) {
      browserInfo.name = 'Firefox';
      browserInfo.version = userAgent.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      browserInfo.name = 'Safari';
      browserInfo.version = userAgent.match(/Version\/(\d+)/)?.[1] || 'Unknown';
    } else if (userAgent.includes('Edg')) {
      browserInfo.name = 'Edge';
      browserInfo.version = userAgent.match(/Edg\/(\d+)/)?.[1] || 'Unknown';
    }

    setBrowserInfo(browserInfo);
    setAccessibilityMode(browserInfo.screenReader || browserInfo.highContrast || browserInfo.reducedMotion);

    // Network status monitoring
    const handleOnlineStatusChange = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);

    return () => {
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
    };
  }, []);

// Enhanced error content based on type with browser-specific messaging
  const getDefaultContent = () => {
    const baseContent = {
      network: {
        title: 'Connection Error',
        message: isOnline ? 
          'Unable to connect to the server. Please check your internet connection and try again.' :
          'You appear to be offline. Please check your internet connection.',
        icon: Wifi,
        suggestions: [
          'Check your internet connection',
          'Try refreshing the page',
          'Disable VPN if using one',
          'Check firewall settings'
        ]
      },
      websocket: {
        title: 'Real-time Connection Error',
        message: 'Unable to establish real-time connection. Some features may not update automatically.',
        icon: Wifi,
        suggestions: [
          'Check your internet connection stability',
          'Try refreshing the page',
          'Disable browser extensions that might block WebSockets',
          'Check if your network allows WebSocket connections',
          'Contact support if the problem persists'
        ]
      },
      validation: {
        title: 'Invalid Input',
        message: 'Please check your input and try again.',
        icon: AlertTriangle,
        suggestions: [
          'Review form fields for errors',
          'Ensure all required fields are filled',
          'Check data format requirements'
        ]
      },
      notFound: {
        title: 'Page Not Found',
        message: 'The page you are looking for does not exist or has been moved.',
        icon: AlertTriangle,
        suggestions: [
          'Check the URL for typos',
          'Use the navigation menu',
          'Go back to the homepage'
        ]
      },
      server: {
        title: 'Server Error',
        message: 'Something went wrong on our end. Please try again later.',
        icon: AlertTriangle,
        suggestions: [
          'Wait a moment and try again',
          'Clear your browser cache',
          'Contact support if the problem persists'
        ]
      },
      compatibility: {
        title: 'Browser Compatibility Issue',
        message: 'Your browser may not support all features. Please update your browser or try a different one.',
        icon: Monitor,
        suggestions: [
          'Update your browser to the latest version',
          'Try Chrome, Firefox, or Safari',
          'Enable JavaScript if disabled',
          'Clear browser cache and cookies'
        ]
      },
      accessibility: {
        title: 'Accessibility Error',
        message: 'There was an issue with accessibility features. Please try again or contact support.',
        icon: Eye,
        suggestions: [
          'Try using keyboard navigation',
          'Check screen reader settings',
          'Contact support for assistance'
        ]
      },
      default: {
        title: 'Something went wrong',
        message: 'An unexpected error occurred. Please try again.',
        icon: AlertTriangle,
        suggestions: [
          'Refresh the page',
          'Try again in a few moments',
          'Contact support if the issue persists'
        ]
}
    };

    return baseContent;
  };

    // Auto-detect WebSocket errors from message content
    let errorType = type;
    if (type === 'general' || type === 'network') {
      if (message && (
        message.toLowerCase().includes('websocket') ||
        message.toLowerCase().includes('real-time') ||
        message.toLowerCase().includes('connection failed') ||
        message.toLowerCase().includes('[object object]')
      )) {
        errorType = 'websocket';
      }
    }

    let content = baseContent[errorType] || baseContent.default;
    // Browser-specific modifications
    if (browserInfo) {
      if (browserInfo.mobile && type === 'network') {
        content.suggestions.unshift('Switch to Wi-Fi if on mobile data');
      }
      
      if (browserInfo.name === 'Safari' && parseInt(browserInfo.version) < 14) {
        content.message += ' Note: Some features may not work properly in older Safari versions.';
        content.suggestions.push('Update Safari to the latest version');
      }
      
      if (browserInfo.name === 'Chrome' && parseInt(browserInfo.version) < 80) {
        content.suggestions.push('Update Chrome for better security and performance');
      }
    }

    return content;
  };

  const defaultContent = getDefaultContent();
  const errorTitle = title || defaultContent.title;
  const errorMessage = message || defaultContent.message;
  const IconComponent = defaultContent.icon || AlertTriangle;
  const suggestions = defaultContent.suggestions || [];

  // Enhanced retry handler with analytics
  const handleRetry = useCallback(() => {
    if (onRetry && !isRetrying) {
      setRetryCount(prev => prev + 1);
      
      // Track retry attempts
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'error_retry', {
          error_type: type,
          retry_count: retryCount + 1,
          browser_name: browserInfo?.name || 'unknown',
          is_mobile: browserInfo?.mobile || false,
          is_online: isOnline
        });
      }
      
      onRetry();
    }
  }, [onRetry, isRetrying, type, retryCount, browserInfo, isOnline]);

  // Base styles with accessibility enhancements
  const getVariantStyles = () => {
    const baseStyles = accessibilityMode ? 'focus-within:ring-4 focus-within:ring-blue-500' : '';
    
    switch (variant) {
      case 'inline':
        return `p-4 bg-red-50 border-2 border-red-200 rounded-lg ${baseStyles}`;
      case 'fullscreen':
        return `min-h-screen flex items-center justify-center p-6 bg-background ${baseStyles}`;
      default: // card
        return `p-6 bg-white rounded-xl shadow-soft border border-gray-100 ${baseStyles}`;
    }
  };

  const variantStyles = getVariantStyles();
  const textAlign = variant === 'fullscreen' ? 'text-center' : '';

  return (
    <div 
      className={`${variantStyles} ${textAlign} ${className}`}
      role="alert"
      aria-live="assertive"
      aria-labelledby="error-title"
      aria-describedby="error-message"
    >
      {/* Screen reader announcement */}
      <div className="sr-only">
        Error occurred: {errorTitle}. {errorMessage}
        {!isOnline && " You appear to be offline."}
        {retryCount > 0 && ` Retry attempt ${retryCount}.`}
      </div>

      {variant === 'fullscreen' && (
        <div className="max-w-lg mx-auto">
          <div className="mb-6">
            <IconComponent 
              className="w-16 h-16 text-error mx-auto mb-4" 
              aria-hidden="true"
            />
            {/* Browser compatibility indicator */}
            {browserInfo && (
              <div className="flex justify-center items-center space-x-2 text-sm text-gray-500 mb-4">
                {browserInfo.mobile ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                <span>{browserInfo.name} {browserInfo.version}</span>
                {!isOnline && <Wifi className="w-4 h-4 text-red-500" />}
                {accessibilityMode && <Eye className="w-4 h-4 text-blue-500" />}
              </div>
            )}
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
            <h3 id="error-title" className="text-lg font-semibold text-gray-900 mb-2">
              {errorTitle}
            </h3>
            <p id="error-message" className="text-gray-600 mb-4">
              {errorMessage}
            </p>
          </div>
        </div>
      )}

      {variant === 'fullscreen' && (
        <div className="max-w-lg mx-auto">
          <h1 id="error-title" className="text-2xl font-bold text-gray-900 mb-4">
            {errorTitle}
          </h1>
          <p id="error-message" className="text-gray-600 mb-8 text-lg">
            {errorMessage}
          </p>
        </div>
      )}

      {/* Browser and network status indicators */}
      {browserInfo && variant !== 'fullscreen' && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2 text-sm text-blue-800">
            {browserInfo.mobile ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
            <span>Browser: {browserInfo.name} {browserInfo.version}</span>
            <span className={`px-2 py-1 rounded text-xs ${isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">Suggestions to fix this issue:</h4>
          <ul className="text-sm text-yellow-700 space-y-1" role="list">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Custom children content */}
      {children && (
        <div className={variant === 'fullscreen' ? 'max-w-lg mx-auto mb-6' : 'mb-4'}>
          {children}
        </div>
      )}

      {/* Enhanced action buttons */}
      {(showRetry || showGoBack || showGoHome) && (
        <div className={`flex flex-wrap gap-3 ${variant === 'fullscreen' ? 'justify-center max-w-lg mx-auto' : 'justify-start'}`}>
          {showRetry && onRetry && (
            <Button
              onClick={handleRetry}
              disabled={isRetrying}
              variant="default"
              size="sm"
              className="flex items-center gap-2 min-w-[120px]"
              aria-label={`Retry the failed operation${retryCount > 0 ? ` (attempt ${retryCount + 1})` : ''}`}
              title={isRetrying ? 'Retrying...' : `Click to retry${retryCount > 0 ? ` (attempt ${retryCount + 1})` : ''}`}
            >
              <RefreshCw 
                className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} 
                aria-hidden="true"
              />
              {isRetrying ? 'Retrying...' : retryCount > 0 ? `Retry (${retryCount + 1})` : 'Try Again'}
            </Button>
          )}

          {showGoBack && onGoBack && (
            <Button
              onClick={onGoBack}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              aria-label="Go back to previous page"
              title="Navigate back to the previous page"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              Go Back
            </Button>
          )}

          {showGoHome && onGoHome && (
            <Button
              onClick={onGoHome}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              aria-label="Go to home page"
              title="Navigate to the home page"
            >
              <Home className="w-4 h-4" aria-hidden="true" />
              Go Home
            </Button>
          )}

          {/* Contact support button for persistent errors */}
          {retryCount >= 3 && (
            <Button
              onClick={() => {
const mailtoUrl = `mailto:support@bazaarpk.com?subject=Error Report&body=Error Type: ${type}%0ABrowser: ${browserInfo?.name} ${browserInfo?.version}%0AError Message: ${encodeURIComponent(errorMessage)}`;
                window.location.href = mailtoUrl;
              }}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-blue-600 border-blue-600 hover:bg-blue-50"
              aria-label="Contact support for help"
            >
<Headphones className="w-4 h-4" />
              Contact Support
            </Button>
          )}
        </div>
      )}

      {/* Accessibility instructions */}
      {accessibilityMode && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
            <Eye className="w-4 h-4 mr-2" />
            Accessibility Options:
          </h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Use Tab key to navigate between elements</li>
            <li>• Press Enter or Space to activate buttons</li>
            <li>• Use arrow keys in dropdown menus</li>
            {browserInfo?.screenReader && <li>• Screen reader instructions are available</li>}
          </ul>
        </div>
      )}

      {/* Performance impact notice for older browsers */}
      {browserInfo && (
        (browserInfo.name === 'Chrome' && parseInt(browserInfo.version) < 80) ||
        (browserInfo.name === 'Firefox' && parseInt(browserInfo.version) < 75) ||
        (browserInfo.name === 'Safari' && parseInt(browserInfo.version) < 13)
      ) && (
        <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-orange-800">
              <p className="font-medium">Browser Update Recommended</p>
              <p className="mt-1">Your browser version may have compatibility issues. Consider updating for the best experience.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Enhanced ErrorBoundary Component with comprehensive error tracking
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorId: Date.now().toString(36) };
  }

  componentDidCatch(error, errorInfo) {
    const errorDetails = {
      error: error,
      errorInfo: errorInfo,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      errorId: this.state.errorId || Date.now().toString(36)
    };

    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Enhanced error logging with browser context
    console.group('🚨 Error Boundary Caught Error');
    console.error('Error Details:', errorDetails);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Error Stack:', error.stack);
    console.groupEnd();

    // Track in analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'javascript_error', {
        error_message: error.message,
        error_stack: error.stack,
        component_stack: errorInfo.componentStack,
        error_id: errorDetails.errorId,
        browser_name: navigator.userAgent.includes('Chrome') ? 'Chrome' : 
                     navigator.userAgent.includes('Firefox') ? 'Firefox' : 
                     navigator.userAgent.includes('Safari') ? 'Safari' : 'Other'
      });
    }

    // Store error for support
    try {
      localStorage.setItem('last_error', JSON.stringify({
        ...errorDetails,
        componentStack: errorInfo.componentStack
      }));
    } catch (storageError) {
      console.warn('Failed to store error details:', storageError);
    }
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Error
          title="Application Error"
          message="Something went wrong in the application. This error has been logged and our team has been notified."
          type="server"
          variant="fullscreen"
          onRetry={this.handleRetry}
          showRetry={true}
          onGoHome={() => {
            // Clear error state before navigating
            this.setState({ 
              hasError: false, 
              error: null, 
              errorInfo: null,
              errorId: null
            });
            window.location.href = '/';
          }}
          showGoHome={true}
        >
          {/* Error ID for support */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Error ID: <code className="bg-gray-200 px-2 py-1 rounded text-xs">{this.state.errorId}</code>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Please reference this ID when contacting support.
            </p>
          </div>

          {/* Development error details */}
          {import.meta.env.MODE === 'development' && this.state.error && (
            <details className="mt-4 p-4 bg-red-50 rounded-lg text-left border border-red-200">
              <summary className="cursor-pointer font-medium text-red-800 mb-2 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded">
                🔧 Error Details (Development Only)
              </summary>
              <div className="mt-2 space-y-2">
                <div>
                  <h4 className="font-medium text-red-800">Error Message:</h4>
                  <pre className="text-xs text-red-700 bg-red-100 p-2 rounded overflow-auto">
                    {this.state.error.toString()}
                  </pre>
                </div>
                <div>
                  <h4 className="font-medium text-red-800">Component Stack:</h4>
                  <pre className="text-xs text-red-700 bg-red-100 p-2 rounded overflow-auto">
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
                <div>
                  <h4 className="font-medium text-red-800">Error Stack:</h4>
                  <pre className="text-xs text-red-700 bg-red-100 p-2 rounded overflow-auto max-h-40">
                    {this.state.error?.stack}
                  </pre>
                </div>
              </div>
            </details>
          )}
        </Error>
      );
    }

    return this.props.children;
  }
}

/**
 * Enhanced useErrorHandler Hook with browser compatibility and retry logic
 */
export const useErrorHandler = () => {
  const [error, setError] = React.useState(null);
  const [isRetrying, setIsRetrying] = React.useState(false);
  const [retryCount, setRetryCount] = React.useState(0);
  const [browserInfo, setBrowserInfo] = React.useState(null);

  React.useEffect(() => {
    // Detect browser capabilities for error handling
    const userAgent = navigator.userAgent;
    const info = {
      mobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
      online: navigator.onLine,
      name: userAgent.includes('Chrome') ? 'Chrome' : 
            userAgent.includes('Firefox') ? 'Firefox' : 
            userAgent.includes('Safari') ? 'Safari' : 'Other'
    };
    setBrowserInfo(info);
  }, []);

  const handleError = React.useCallback((error) => {
    const errorDetails = {
      message: error?.message || 'Unknown error',
      name: error?.name || 'Error',
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      browserInfo: browserInfo,
      retryCount: retryCount
    };

    console.group('❌ Error Handler');
    console.error('Error caught:', errorDetails);
    console.groupEnd();

    // Track in analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'handled_error', {
        error_type: error?.name || 'Unknown',
        error_message: error?.message || 'Unknown error',
        browser_name: browserInfo?.name || 'unknown',
        is_mobile: browserInfo?.mobile || false,
        retry_count: retryCount
      });
    }

    setError(error);
    setIsRetrying(false);
  }, [browserInfo, retryCount]);

  const retry = React.useCallback((retryFn) => {
    if (typeof retryFn === 'function') {
      setIsRetrying(true);
      setError(null);
      setRetryCount(prev => prev + 1);
      
      try {
        const result = retryFn();
        
        // Handle promise-based retry functions
        if (result && typeof result.catch === 'function') {
          result
            .catch(handleError)
            .finally(() => {
              setIsRetrying(false);
            });
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
    setRetryCount(0);
  }, []);

  return {
    error,
    isRetrying,
    retryCount,
    browserInfo,
    handleError,
    retry,
    clearError
  };
};

export default Error;