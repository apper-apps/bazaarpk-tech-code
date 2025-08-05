import React from "react";
import { cn } from "@/utils/cn";

const Button = React.forwardRef(({ 
  className, 
  variant = "primary", 
  size = "md", 
  children, 
  disabled,
  ...props 
}, ref) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-gradient-to-r from-primary-700 to-primary-600 text-white hover:from-primary-800 hover:to-primary-700 focus:ring-primary-500 shadow-medium hover:shadow-large",
    secondary: "bg-white text-primary-700 border border-primary-200 hover:bg-primary-50 focus:ring-primary-500 shadow-soft hover:shadow-medium",
    accent: "bg-gradient-to-r from-accent-600 to-accent-500 text-white hover:from-accent-700 hover:to-accent-600 focus:ring-accent-500 shadow-medium hover:shadow-large",
    outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-primary-500 shadow-soft hover:shadow-medium",
    ghost: "text-gray-600 hover:text-primary-700 hover:bg-primary-50 focus:ring-primary-500",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
    xl: "px-8 py-4 text-lg",
  };

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        disabled && "transform-none hover:shadow-medium",
        !disabled && "hover:scale-105 active:scale-95",
        className
      )}
      ref={ref}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = "Button";
export default Button;