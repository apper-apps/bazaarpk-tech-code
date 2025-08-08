import React, { useCallback, useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, Eye, Headphones, Home, Monitor, RefreshCw, Smartphone, Wifi } from "lucide-react";
import ApperIcon from "@/components/ApperIcon";
import HomePage from "@/components/pages/Home";
import Button from "@/components/atoms/Button";

// Error Boundary for WebSocket and other errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.FallbackComponent 
        ? <this.props.FallbackComponent error={this.state.error} />
        : <div className="p-6 text-center">
            <ApperIcon name="AlertTriangle" size={48} className="mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-4">An unexpected error occurred</p>
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>;
    }

    return this.props.children;
  }
}

// WebSocket specific error fallback
function WebSocketErrorFallback({ error }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
      <div className="flex items-center">
        <ApperIcon name="Wifi" size={20} className="text-red-500 mr-2" />
        <h3 className="text-red-800 font-medium">WebSocket Connection Failed</h3>
      </div>
      <p className="text-red-600 text-sm mt-2">
        {error?.message || 'Unable to establish real-time connection'}
      </p>
      <Button 
        size="sm" 
        variant="outline" 
        className="mt-3"
        onClick={() => window.location.reload()}
      >
        <ApperIcon name="RefreshCw" size={14} className="mr-2" />
        Retry Connection
      </Button>
    </div>
  );
}

const useErrorHandler = () => {
  const [error, setError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  const handleError = useCallback((error) => {
    console.error('Error caught:', error);
    setError(error);
    setIsRetrying(false);
  }, []);

  const retry = useCallback((retryFn) => {
    if (typeof retryFn === 'function') {
      setIsRetrying(true);
      setError(null);
      setRetryCount(prev => prev + 1);
      
      try {
        const result = retryFn();
        
        if (result && typeof result.catch === 'function') {
          result
            .catch(handleError)
            .finally(() => setIsRetrying(false));
        } else {
          setIsRetrying(false);
        }
      } catch (err) {
        handleError(err);
      }
    }
  }, [handleError]);

  const clearError = useCallback(() => {
    setError(null);
    setIsRetrying(false);
    setRetryCount(0);
  }, []);

  return {
    error,
    isRetrying,
    retryCount,
    handleError,
    retry,
    clearError
  };
};

/**
 * Enhanced Error Component with:
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

  // Get base content
  const baseContent = getDefaultContent();

// Enhanced WebSocket error detection
  let errorType = type;
  if (type === 'general' || type === 'network') {
    if (message && (
      message.toLowerCase().includes('websocket') ||
      message.toLowerCase().includes('real-time') ||
      message.toLowerCase().includes('connection failed') ||
      message.toLowerCase().includes('[object object]') ||
      message.toLowerCase().includes('websocket_error') ||
      message.toLowerCase().includes('readystate') ||
      message.includes('{"status":"error"')
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
  const errorTitle = title || content.title;
  const errorMessage = message || content.message;
  const IconComponent = content.icon || AlertTriangle;
  const suggestions = content.suggestions || [];

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
// Variant styles
  const getVariantStyles = () => {
    const styles = {
      card: 'bg-white border border-red-200 rounded-lg p-6 shadow-sm',
      banner: 'bg-red-50 border-l-4 border-red-400 p-4',
      inline: 'p-4 bg-red-50 rounded border border-red-200',
      fullscreen: 'min-h-screen flex items-center justify-center bg-gray-50 px-4 py-16',
      toast: 'fixed top-4 right-4 z-50 max-w-sm bg-white border border-red-200 rounded-lg shadow-lg p-4',
      minimal: 'text-red-600'
    };
    return styles[variant] || styles.card;
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

Error.displayName = 'Error'

// Additional component exports for different error types  
export const NetworkError = (props) => <Error type="network" {...props} />
export const NotFoundError = (props) => <Error type="notFound" {...props} />
export const UnauthorizedError = (props) => <Error type="unauthorized" {...props} />

export { Error as default, useErrorHandler, ErrorBoundary, WebSocketErrorFallback }