import React from "react";
import Button from "@/components/atoms/Button";
import ApperIcon from "@/components/ApperIcon";
import { cn } from "@/utils/cn";

const Empty = ({ 
  title = "No items found",
  message = "We couldn't find any items matching your criteria. Try adjusting your search or browse our categories.",
  actionText = "Browse Products",
  onAction,
  icon = "Package",
  className,
  ...props 
}) => {
  return (
    <div className={cn("flex flex-col items-center justify-center p-12 text-center", className)} {...props}>
      <div className="w-32 h-32 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center mb-8">
        <ApperIcon name={icon} className="w-16 h-16 text-primary-500" />
      </div>
      
      <h3 className="text-2xl font-display font-bold text-gray-900 mb-4">
        {title}
      </h3>
      
      <p className="text-gray-600 mb-8 max-w-md leading-relaxed">
        {message}
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        {onAction && (
          <Button onClick={onAction} size="lg">
            <ApperIcon name="ShoppingBag" className="w-5 h-5 mr-2" />
            {actionText}
          </Button>
        )}
        
        <Button variant="outline" size="lg" onClick={() => window.history.back()}>
          <ApperIcon name="ArrowLeft" className="w-5 h-5 mr-2" />
          Go Back
        </Button>
      </div>
      
      {/* Decorative Elements */}
      <div className="mt-12 flex items-center space-x-8 opacity-30">
        <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" />
        <div className="w-3 h-3 bg-primary-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
    </div>
  );
};

export default Empty;