import React, { useState, useCallback } from "react";
import { cn } from "@/utils/cn";
import { sanitizeInput, sanitizeNumericInput, sanitizeEmail, announceToScreenReader } from "@/utils/security";

const Input = React.forwardRef(({ 
  className, 
  type = "text",
  error,
  label,
  description,
  required = false,
  sanitize = true,
  sanitizeOptions = {},
  ariaLabel,
  ariaDescribedBy,
  autoComplete,
  maxLength,
  pattern,
  onValueChange,
  ...props 
}, ref) => {
  const [internalValue, setInternalValue] = useState(props.value || props.defaultValue || '');

  // Generate unique IDs for accessibility
  const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${inputId}-error`;
  const descriptionId = `${inputId}-description`;

  // Handle value sanitization and validation
  const handleChange = useCallback((e) => {
    let newValue = e.target.value;

    // Apply sanitization based on input type
    if (sanitize && newValue) {
      switch (type) {
        case 'email':
          newValue = sanitizeEmail(newValue);
          break;
        case 'number':
        case 'tel':
          newValue = sanitizeNumericInput(newValue, sanitizeOptions);
          break;
        case 'search':
          newValue = sanitizeInput(newValue, {
            ...sanitizeOptions,
            maxLength: maxLength || 100,
            allowSpecialChars: false
          });
          break;
        case 'url':
          // Allow URL characters but sanitize
          newValue = sanitizeInput(newValue, {
            ...sanitizeOptions,
            allowSpecialChars: true
          });
          break;
        default:
          newValue = sanitizeInput(newValue, sanitizeOptions);
      }
    }

    // Update internal state
    setInternalValue(newValue);

    // Create sanitized event object
    const sanitizedEvent = {
      ...e,
      target: { ...e.target, value: newValue }
    };

    // Call original onChange with sanitized value
    if (props.onChange) {
      props.onChange(sanitizedEvent);
    }

    // Call custom value change handler
    if (onValueChange) {
      onValueChange(newValue);
    }

    // Announce validation errors to screen readers
    if (error) {
      announceToScreenReader(`Input error: ${error}`, 'assertive');
    }
  }, [type, sanitize, sanitizeOptions, maxLength, props.onChange, onValueChange, error]);

  // Handle keyboard navigation and accessibility
  const handleKeyDown = useCallback((e) => {
    // Escape key clears input
    if (e.key === 'Escape' && props.clearable !== false) {
      setInternalValue('');
      if (onValueChange) onValueChange('');
      if (props.onChange) {
        const clearEvent = { ...e, target: { ...e.target, value: '' } };
        props.onChange(clearEvent);
      }
    }

    // Call original keyDown handler
    if (props.onKeyDown) {
      props.onKeyDown(e);
    }
  }, [props.onKeyDown, onValueChange, props.onChange, props.clearable]);

  // Focus management for accessibility
  const handleFocus = useCallback((e) => {
    // Announce field information to screen readers
    if (label) {
      announceToScreenReader(`Focused on ${label}${required ? ', required' : ''}${description ? `, ${description}` : ''}`);
    }

    if (props.onFocus) {
      props.onFocus(e);
    }
  }, [label, required, description, props.onFocus]);

  // Determine ARIA attributes
  const ariaAttributes = {
    'aria-label': ariaLabel || label,
    'aria-describedby': [
      description ? descriptionId : null,
      error ? errorId : null,
      ariaDescribedBy
    ].filter(Boolean).join(' ') || undefined,
    'aria-invalid': !!error,
    'aria-required': required,
    'role': type === 'search' ? 'searchbox' : undefined
  };

  return (
    <div className="relative">
      {label && (
        <label 
          htmlFor={inputId}
          className={cn(
            "block text-sm font-medium text-gray-700 mb-2",
            required && "after:content-['*'] after:ml-0.5 after:text-red-500"
          )}
        >
          {label}
        </label>
      )}
      
      {description && (
        <p 
          id={descriptionId}
          className="text-xs text-gray-500 mb-1"
        >
          {description}
        </p>
      )}

      <input
        {...props}
        id={inputId}
        type={type}
        value={internalValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        maxLength={maxLength}
        pattern={pattern}
        autoComplete={autoComplete}
        className={cn(
          "flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 transition-colors duration-200",
          "focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:ring-offset-0",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
          "hover:border-gray-400 disabled:hover:border-gray-300",
          error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
          "aria-[invalid=true]:border-red-500",
          className
        )}
        ref={ref}
        {...ariaAttributes}
      />

      {error && (
        <p 
          id={errorId}
          className="mt-1 text-xs text-red-600 flex items-center"
          role="alert"
          aria-live="polite"
        >
          <span className="mr-1">⚠️</span>
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = "Input";
export default Input;