import React from "react";
import { cn } from "@/utils/cn";

const Input = React.forwardRef(({ 
  className, 
  type = "text",
  error,
  ...props 
}, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 transition-colors duration-200",
        "focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
        error && "border-error focus:border-error focus:ring-error/20",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = "Input";
export default Input;