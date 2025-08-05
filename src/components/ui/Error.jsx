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
  ...props 
}) => {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)} {...props}>
      <div className="w-24 h-24 bg-error/10 rounded-full flex items-center justify-center mb-6">
        <ApperIcon name="AlertTriangle" className="w-12 h-12 text-error" />
      </div>
      
      <h3 className="text-xl font-display font-bold text-gray-900 mb-2">
        {title}
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