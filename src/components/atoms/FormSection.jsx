import React from "react";
import { cn } from "@/utils/cn";
import ApperIcon from "@/components/ApperIcon";

/**
 * Accessible form section component with WCAG compliance
 */
const FormSection = ({ 
  title, 
  description, 
  icon, 
  variant = "default",
  required = false,
  children, 
  className,
  ...props 
}) => {
  const sectionId = `section-${Math.random().toString(36).substr(2, 9)}`;
  
  const variants = {
    default: "bg-white border border-gray-200",
    info: "bg-blue-50 border border-blue-200", 
    success: "bg-green-50 border border-green-200",
    warning: "bg-yellow-50 border border-yellow-200",
    error: "bg-red-50 border border-red-200"
  };

  return (
    <section 
      className={cn(
        "rounded-lg p-4 space-y-4",
        variants[variant],
        className
      )}
      aria-labelledby={`${sectionId}-title`}
      {...props}
    >
      {(title || icon) && (
        <div className="flex items-center space-x-3">
          {icon && (
            <div className="flex-shrink-0">
              <ApperIcon name={icon} className="w-5 h-5 text-gray-600" aria-hidden="true" />
            </div>
          )}
          <div>
            {title && (
<h3 
                id={`${sectionId}-title`}
                className={cn(
                  "text-sm font-semibold text-gray-900 word-spacing-relaxed",
                  required && "after:content-['*'] after:ml-0.5 after:text-red-500"
                )}
              >
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-gray-600 mt-1 word-spacing-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>
      )}
      
      <div className="space-y-4">
        {children}
      </div>
    </section>
  );
};

FormSection.displayName = "FormSection";
export default FormSection;