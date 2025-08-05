import React from "react";
import { cn } from "@/utils/cn";

const Badge = React.forwardRef(({ 
  className, 
  variant = "default", 
  size = "sm",
  children, 
  ...props 
}, ref) => {
  const baseStyles = "inline-flex items-center justify-center rounded-full font-medium text-white shadow-soft";
  
  const variants = {
    default: "bg-gray-500",
    organic: "badge-organic",
    halal: "badge-halal",
    fresh: "badge-fresh",
    discount: "badge-discount",
    limited: "badge-limited",
    vegan: "bg-gradient-to-r from-green-500 to-green-400",
    premium: "bg-gradient-to-r from-purple-600 to-purple-500",
    bestseller: "bg-gradient-to-r from-yellow-500 to-yellow-400 text-yellow-900",
  };

  const sizes = {
    xs: "px-2 py-0.5 text-xs",
    sm: "px-2.5 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
  };

  return (
    <span
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
      ref={ref}
      {...props}
    >
      {children}
    </span>
  );
});

Badge.displayName = "Badge";
export default Badge;