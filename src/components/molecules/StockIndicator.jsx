import React from "react";
import { cn } from "@/utils/cn";
import ApperIcon from "@/components/ApperIcon";

const StockIndicator = ({ 
  stock, 
  className,
  showText = true,
  size = "sm",
  ...props 
}) => {
  const getStockStatus = (stock) => {
    if (stock <= 0) {
      return {
        color: "text-error",
        bgColor: "bg-error/10",
        icon: "AlertCircle",
        text: "Out of Stock",
        dotColor: "bg-error"
      };
    } else if (stock < 3) {
      return {
        color: "text-error",
        bgColor: "bg-error/10",
        icon: "AlertTriangle",
        text: `Only ${stock} left!`,
        dotColor: "bg-error"
      };
    } else if (stock < 10) {
      return {
        color: "text-warning",
        bgColor: "bg-warning/10",
        icon: "Clock",
        text: `${stock} in stock`,
        dotColor: "bg-warning"
      };
    } else {
      return {
        color: "text-success",
        bgColor: "bg-success/10",
        icon: "CheckCircle",
        text: "In Stock",
        dotColor: "bg-success"
      };
    }
  };

  const status = getStockStatus(stock);
  
  const sizes = {
    xs: {
      text: "text-xs",
      icon: "h-3 w-3",
      dot: "h-2 w-2",
      padding: "px-2 py-1"
    },
    sm: {
      text: "text-sm",
      icon: "h-4 w-4",
      dot: "h-2.5 w-2.5",
      padding: "px-2.5 py-1.5"
    },
    md: {
      text: "text-base",
      icon: "h-5 w-5",
      dot: "h-3 w-3",
      padding: "px-3 py-2"
    }
  };

  return (
    <div 
      className={cn(
        "inline-flex items-center space-x-2 rounded-full font-medium",
        status.bgColor,
        sizes[size].padding,
        className
      )} 
      {...props}
    >
      <div className={cn("rounded-full", status.dotColor, sizes[size].dot)} />
      
      {showText && (
        <span className={cn(status.color, sizes[size].text, "font-medium")}>
          {status.text}
        </span>
      )}
    </div>
  );
};

export default StockIndicator;