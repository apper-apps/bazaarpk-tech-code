import React from "react";
import Button from "@/components/atoms/Button";
import ApperIcon from "@/components/ApperIcon";
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
  
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)} {...props}>
      <div className={cn(
        "w-24 h-24 rounded-full flex items-center justify-center mb-6",
        isLocationError ? "bg-info/10" : "bg-error/10"
      )}>
        <ApperIcon 
          name={errorIcon} 
          className={cn(
            "w-12 h-12",
            isLocationError ? "text-info" : "text-error"
          )} 
        />
      </div>
      
      <h3 className="text-xl font-display font-bold text-gray-900 mb-2">
        {errorTitle}
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-md">
        {message}
      </p>
      
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
    </div>
  );
};

export default Error;