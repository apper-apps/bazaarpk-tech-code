import React, { useEffect } from "react";
import ApperIcon from "@/components/ApperIcon";
import Home from "@/components/pages/Home";
import Button from "@/components/atoms/Button";
import { cn } from "@/utils/cn";

const Error = ({ 
  title = "Something went wrong",
  message = "We encountered an error while loading this content. Please try again.",
  onRetry,
  showRetry = true,
  className,
  errorType,
  ...props 
}) => {
  // Enhanced error message parsing for better UX
  const getErrorIcon = () => {
    if (message?.includes('location') || message?.includes('geolocation')) {
      return "MapPin";
    }
    if (message?.includes('network') || message?.includes('connection')) {
      return "Wifi";
    }
    return "AlertTriangle";
  };
  
  const getErrorTitle = () => {
    if (message?.includes('location') || message?.includes('geolocation')) {
      return "Location Service Notice";
    }
    if (message?.includes('network') || message?.includes('connection')) {
      return "Connection Issue";
    }
    return title;
  };
const errorIcon = getErrorIcon();
  const errorTitle = getErrorTitle();
  const isLocationError = message?.includes('location') || message?.includes('geolocation');
  const isAdminError = message?.includes('admin') || message?.includes('dashboard') || message?.includes('timeout');
  
  // Enhanced error logging and debugging
  React.useEffect(() => {
    if (isAdminError) {
      console.group('🔴 Admin Error Component Mounted');
      console.error('Admin Error Details:', {
        title: getErrorTitle(),
        message,
        errorType,
        timestamp: new Date().toISOString(),
        retryCount: errorType?.retryCount || 0,
        currentRoute: window.location.pathname,
        domState: {
          adminElements: document.querySelectorAll('.admin-dashboard, [data-admin-content]').length,
          overlayElements: document.querySelectorAll('.overlay-mask, .modal-backdrop').length,
          bodyClasses: document.body.className
        }
      });
      console.groupEnd();
console.groupEnd();
      
      // Fire debug event for error tracking
      if (typeof window !== 'undefined' && window.CustomEvent) {
        window.dispatchEvent(new window.CustomEvent('admin_debug_log', {
          detail: {
            type: 'error_component_render',
            severity: 'medium',
            data: { title: getErrorTitle(), message, errorType }
          }
        }));
      }
  }, [message, errorType, isAdminError]);
  
  // Admin-specific error handling with enhanced debugging
  const handleAdminForceExit = () => {
    console.warn('🚨 Admin Force Exit Triggered');
    console.log('Pre-exit DOM state:', {
      bodyClasses: document.body.className,
      adminElements: document.querySelectorAll('.admin-dashboard').length,
      overlayElements: document.querySelectorAll('.overlay-mask, .modal-backdrop').length
    });
    
    document.body.classList.add('admin-emergency-exit');
    
    // Log exit process
    setTimeout(() => {
      console.log('Force exit cleanup completed');
      document.body.classList.remove('admin-emergency-exit', 'admin-accessing', 'content-layer');
      window.location.href = '/';
    }, 100);
  };

// Enhanced retry with exponential backoff and logging
  const handleRetryWithBackoff = () => {
    if (onRetry) {
      const retryCount = errorType?.retryCount || 0;
      const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 8000);
      
      console.group('🔄 Admin Error Retry Initiated');
      console.log('Retry Details:', {
        attempt: retryCount + 1,
        delay: retryDelay,
        maxRetries: 3,
        errorType: errorType?.type,
        timestamp: new Date().toISOString()
      });
      console.groupEnd();
console.groupEnd();
      
      // Log retry attempt
      if (typeof window !== 'undefined' && window.CustomEvent) {
        window.dispatchEvent(new window.CustomEvent('admin_debug_log', {
          detail: {
            type: 'error_retry',
            severity: 'low',
            data: { retryCount: retryCount + 1, delay: retryDelay }
          }
        }));
      }
      setTimeout(() => {
        console.log(`⚡ Executing retry attempt ${retryCount + 1}`);
        onRetry();
      }, retryDelay);
    }
  };
  
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-8 text-center",
      isAdminError && "admin-error-container",
      className
    )} {...props}>
      <div className={cn(
        "w-24 h-24 rounded-full flex items-center justify-center mb-6",
        isLocationError ? "bg-info/10" : 
        isAdminError ? "bg-warning/10" : "bg-error/10"
      )}>
        <ApperIcon 
          name={errorIcon} 
          className={cn(
            "w-12 h-12",
            isLocationError ? "text-info" : 
            isAdminError ? "text-warning" : "text-error"
          )} 
        />
      </div>
      
      <h3 className="text-xl font-display font-bold text-gray-900 mb-2">
        {errorTitle}
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-md">
        {message}
      </p>
      
{/* Admin-specific error actions with debugging info */}
      {isAdminError && (
        <div className="space-y-3 w-full max-w-xs">
{/* Debug information for development */}
          {(typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') && (
            <div className="bg-gray-100 p-3 rounded text-xs text-left">
              <div className="font-semibold mb-1">Debug Info:</div>
              <div>Route: {window.location.pathname}</div>
              <div>Error Type: {errorType?.type || 'unknown'}</div>
              <div>Retry Count: {errorType?.retryCount || 0}</div>
              <div>Admin Elements: {document.querySelectorAll('.admin-dashboard').length}</div>
              <div>Overlay Elements: {document.querySelectorAll('.overlay-mask').length}</div>
            </div>
          )}
          {showRetry && onRetry && (
            <Button onClick={handleRetryWithBackoff} variant="primary" className="w-full">
              <ApperIcon name="RefreshCw" className="w-4 h-4 mr-2" />
              Retry Admin Access
            </Button>
          )}
          <Button onClick={handleAdminForceExit} variant="outline" className="w-full">
            <ApperIcon name="LogOut" className="w-4 h-4 mr-2" />
            Force Exit to Home
          </Button>
          {errorType?.retryCount > 0 && (
            <p className="text-xs text-gray-500 mt-2">
Retry attempt {errorType.retryCount} of 3
              {(typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') && (
                <span className="block text-xs text-blue-600 mt-1">
                  Next delay: {Math.min(1000 * Math.pow(2, errorType.retryCount), 8000)}ms
                </span>
              )}
            </p>
          )}
        </div>
      )}
      
      {/* Standard error actions for non-admin errors */}
      {!isAdminError && (
        <>
          {showRetry && onRetry && (
            <Button onClick={onRetry} variant="primary">
              <ApperIcon name="RefreshCw" className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
          
          {!onRetry && (
            <Button onClick={() => window.location.reload()} variant="outline">
              <ApperIcon name="RotateCcw" className="w-4 h-4 mr-2" />
              Reload Page
            </Button>
          )}
        </>
      )}
    </div>
  );
};

export default Error;