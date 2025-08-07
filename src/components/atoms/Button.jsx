import React, { useState, useCallback } from "react";
import { cn } from "@/utils/cn";
import { announceToScreenReader } from "@/utils/security";

const Button = React.forwardRef(({ 
  className, 
  variant = "primary", 
  size = "md", 
  children, 
  disabled,
  loading = false,
  loadingText = "Loading...",
  ariaLabel,
  ariaDescribedBy,
  ariaExpanded,
  ariaControls,
  role,
  type = "button",
  form,
  onClick,
  onKeyDown,
  ...props 
}, ref) => {
  const [isPressed, setIsPressed] = useState(false);

  // Generate unique ID for accessibility if needed
  const buttonId = props.id || `button-${Math.random().toString(36).substr(2, 9)}`;

  const baseStyles = cn(
    "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200",
    "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
    // Enhanced focus styles for accessibility
    "focus-visible:ring-2 focus-visible:ring-offset-2",
    // High contrast mode support
    "@media (prefers-contrast: high) { border: 2px solid currentColor }"
  );
  
  const variants = {
    primary: cn(
      "bg-gradient-to-r from-primary-700 to-primary-600 text-white",
      "hover:from-primary-800 hover:to-primary-700",
      "focus:ring-primary-500 focus-visible:ring-primary-500",
      "shadow-medium hover:shadow-large",
      "active:from-primary-900 active:to-primary-800"
    ),
    secondary: cn(
      "bg-white text-primary-700 border border-primary-200",
      "hover:bg-primary-50 hover:border-primary-300",
      "focus:ring-primary-500 focus-visible:ring-primary-500",
      "shadow-soft hover:shadow-medium",
      "active:bg-primary-100"
    ),
    accent: cn(
      "bg-gradient-to-r from-accent-600 to-accent-500 text-white",
      "hover:from-accent-700 hover:to-accent-600",
      "focus:ring-accent-500 focus-visible:ring-accent-500",
      "shadow-medium hover:shadow-large",
      "active:from-accent-800 active:to-accent-700"
    ),
    outline: cn(
      "border border-gray-300 bg-white text-gray-700",
      "hover:bg-gray-50 hover:border-gray-400",
      "focus:ring-primary-500 focus-visible:ring-primary-500",
      "shadow-soft hover:shadow-medium",
      "active:bg-gray-100"
    ),
    ghost: cn(
      "text-gray-600 bg-transparent",
      "hover:text-primary-700 hover:bg-primary-50",
      "focus:ring-primary-500 focus-visible:ring-primary-500",
      "active:bg-primary-100"
    ),
    destructive: cn(
      "bg-red-600 text-white",
      "hover:bg-red-700",
      "focus:ring-red-500 focus-visible:ring-red-500",
      "shadow-medium hover:shadow-large",
      "active:bg-red-800"
    ),
    success: cn(
      "bg-green-600 text-white",
      "hover:bg-green-700",
      "focus:ring-green-500 focus-visible:ring-green-500",
      "shadow-medium hover:shadow-large",
      "active:bg-green-800"
    )
  };

  const sizes = {
    xs: "px-2 py-1 text-xs",
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
    xl: "px-8 py-4 text-lg",
  };

  // Handle click with accessibility announcements
  const handleClick = useCallback((e) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }

    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 150);

    // Announce action to screen readers for important buttons
    if (variant === 'destructive') {
      announceToScreenReader(`${ariaLabel || children} button activated`, 'assertive');
    }

    if (onClick) {
      onClick(e);
    }
  }, [disabled, loading, onClick, variant, ariaLabel, children]);

  // Handle keyboard interactions
  const handleKeyDown = useCallback((e) => {
    // Space or Enter key activation
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleClick(e);
    }

    if (onKeyDown) {
      onKeyDown(e);
    }
  }, [handleClick, onKeyDown]);

  // Determine if button should be disabled
  const isDisabled = disabled || loading;

  // ARIA attributes for accessibility
  const ariaAttributes = {
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    'aria-expanded': ariaExpanded,
    'aria-controls': ariaControls,
    'aria-disabled': isDisabled,
    'aria-pressed': isPressed || undefined,
    'role': role
  };

  // Loading spinner component
  const LoadingSpinner = () => (
    <svg
      className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  return (
    <button
      {...props}
      id={buttonId}
      type={type}
      form={form}
      className={cn(
        baseStyles,
        variants[variant] || variants.primary,
        sizes[size],
        isDisabled && "transform-none",
        !isDisabled && "hover:scale-105 active:scale-95",
        loading && "cursor-wait",
        className
      )}
      ref={ref}
      disabled={isDisabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      {...ariaAttributes}
    >
      {loading && <LoadingSpinner />}
      {loading ? loadingText : children}
    </button>
  );
});

Button.displayName = "Button";
export default Button;