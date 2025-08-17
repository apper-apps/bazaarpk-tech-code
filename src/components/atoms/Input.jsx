import React, { forwardRef, useCallback, useState, useRef, useImperativeHandle } from "react";
import { announceToScreenReader, sanitizeEmail, sanitizeInput, sanitizeNumericInput } from "@/utils/security";
import { cn } from "@/utils/cn";

const Input = React.forwardRef(({
  className, 
  type = "text",
  error,
  label,
  description,
  tooltip,
  helpText,
  required = false,
  sanitize = true,
  sanitizeOptions = {},
  ariaLabel,
  ariaDescribedBy,
  autoComplete,
  maxLength,
  pattern,
  onValueChange,
  showValidationIcon = true,
  validationRules = {},
  realTimeValidation = true,
  ...props
}, ref) => {
  const [internalValue, setInternalValue] = useState(props.value || props.defaultValue || '');
  const inputRef = useRef(null);

  // Expose the input element through the forwarded ref
  useImperativeHandle(ref, () => inputRef.current);

  // Generate unique IDs for accessibility
  const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;
const errorId = `${inputId}-error`;
  const descriptionId = `${inputId}-description`;

  // Handle value sanitization and validation
const handleChange = useCallback((e) => {
    let newValue = e.target.value;
    let validationError = null;

    // Store cursor position for restoration after processing
    const cursorPosition = e.target.selectionStart;

    // Real-time validation if enabled
    if (realTimeValidation && validationRules) {
      const validation = validateInput(newValue, validationRules, type);
      if (!validation.isValid) {
        validationError = validation.error;
      }
    }

    // Apply sanitization based on input type with enhanced text processing
    if (sanitize && newValue) {
      switch (type) {
        case 'email':
          newValue = sanitizeEmail(newValue);
          // Additional email validation
          if (realTimeValidation && newValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newValue)) {
            validationError = 'Please enter a valid email address';
          }
          break;
        case 'number':
        case 'tel':
          newValue = sanitizeNumericInput(newValue, sanitizeOptions);
          // Enhanced numeric validation
          if (realTimeValidation && newValue) {
            const numValue = parseFloat(newValue);
            if (isNaN(numValue)) {
              validationError = 'Please enter a valid number';
            } else if (sanitizeOptions?.min !== undefined && numValue < sanitizeOptions.min) {
              validationError = `Value must be at least ${sanitizeOptions.min}`;
            } else if (sanitizeOptions?.max !== undefined && numValue > sanitizeOptions.max) {
              validationError = `Value must not exceed ${sanitizeOptions.max}`;
            }
          }
          break;
        case 'search':
          newValue = sanitizeInput(newValue, {
            ...sanitizeOptions,
            maxLength: maxLength || 100,
            allowSpecialChars: false,
            preserveSpaces: true
          });
          break;
        case 'url':
          newValue = sanitizeInput(newValue, {
            ...sanitizeOptions,
            allowSpecialChars: true
          });
          // Enhanced URL validation
          if (realTimeValidation && newValue) {
            try {
              new URL(newValue.startsWith('http') ? newValue : `https://${newValue}`);
            } catch {
              validationError = 'Please enter a valid URL';
            }
          }
          break;
        case 'password':
          // Password-specific sanitization (minimal to preserve special chars)
          newValue = newValue.replace(/[<>]/g, '');
          if (realTimeValidation && validationRules?.minLength && newValue.length < validationRules.minLength) {
            validationError = `Password must be at least ${validationRules.minLength} characters`;
          }
          break;
case 'text':
        default:
          // Enhanced text processing - preserve natural spaces between words
          newValue = sanitizeInput(newValue, {
            ...sanitizeOptions,
            preserveSpaces: true,
            naturalSpacing: true,
            allowSpaces: true,
            maxLength: sanitizeOptions.maxLength || 1000
          });
      }
      
      // Apply enhanced typography for optimal readability
      if (inputRef.current) {
        inputRef.current.classList.add('product-text-field');
        inputRef.current.style.wordSpacing = '0.08em';
        inputRef.current.style.letterSpacing = '0.02em';
        inputRef.current.style.lineHeight = '1.6';
        inputRef.current.style.textRendering = 'optimizeLegibility';
        inputRef.current.style.fontFeatureSettings = '"kern" 1';
      }
    }

    // Length validation
    if (realTimeValidation && maxLength && newValue.length > maxLength) {
      validationError = `Maximum ${maxLength} characters allowed`;
    }

    // Pattern validation
    if (realTimeValidation && pattern && newValue && !new RegExp(pattern).test(newValue)) {
      validationError = validationRules?.patternError || 'Invalid format';
    }

    // Update internal state
    setInternalValue(newValue);

    // Create sanitized event object with validation info
    const sanitizedEvent = {
      ...e,
      target: { 
        ...e.target, 
        value: newValue,
        validationError,
        isValid: !validationError
      }
    };

    // Call original onChange with sanitized value
    if (props.onChange) {
      props.onChange(sanitizedEvent);
    }

    // Call custom value change handler
    if (onValueChange) {
      onValueChange(newValue, { isValid: !validationError, error: validationError });
    }

// Allow natural text input flow - browser handles cursor positioning
    // Announce validation feedback to screen readers
    if (validationError) {
      announceToScreenReader(`Input validation: ${validationError}`, 'assertive');
    } else if (error) {
      announceToScreenReader(`Input error resolved`, 'polite');
    }
  }, [type, sanitize, sanitizeOptions, maxLength, pattern, validationRules, realTimeValidation, props.onChange, onValueChange, error]);

  // Helper function for input validation
  const validateInput = (value, rules, inputType) => {
    if (!value && rules.required) {
      return { isValid: false, error: `${label || 'Field'} is required` };
    }

    if (value && rules.minLength && value.length < rules.minLength) {
      return { isValid: false, error: `Minimum ${rules.minLength} characters required` };
    }

    if (value && rules.maxLength && value.length > rules.maxLength) {
      return { isValid: false, error: `Maximum ${rules.maxLength} characters allowed` };
    }

    if (value && rules.pattern && !rules.pattern.test(value)) {
      return { isValid: false, error: rules.patternError || 'Invalid format' };
    }

    return { isValid: true, error: null };
  };

// Handle keyboard navigation and accessibility
  const handleKeyDown = useCallback((e) => {
    // Allow natural spacebar and text input - no interference with normal typing
    
    // Only handle special keys, never interfere with text input like spacebar
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
  }, [props.onKeyDown, onValueChange, props.onChange, props.clearable, setInternalValue]);

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

<div className="relative input-wrapper">
        <input
          {...props}
          id={inputId}
          type={type}
          value={internalValue}
onChange={(e) => {
            // Preserve original event and value for proper processing
            handleChange(e);
          }}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          maxLength={maxLength}
          pattern={pattern}
          autoComplete={autoComplete}
className={cn(
            "flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 transition-all duration-200",
            "focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:ring-offset-0",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
            "hover:border-gray-400 disabled:hover:border-gray-300",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
            "aria-[invalid=true]:border-red-500",
            showValidationIcon && internalValue && !error && "pr-10",
            tooltip && "cursor-help",
            className
)}
          style={props.style}
          ref={inputRef}
          {...ariaAttributes}
        />
        {/* Validation Success Icon */}
        {showValidationIcon && internalValue && !error && realTimeValidation && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}

        {/* Tooltip */}
        {tooltip && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10">
            <div className="group relative">
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
                aria-label="Show help"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <div className="invisible group-hover:visible absolute right-0 top-full mt-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-50">
                <div className="absolute -top-1 right-3 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                {tooltip}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div 
          id={errorId}
          className="mt-2 flex items-start space-x-2"
          role="alert"
          aria-live="assertive"
        >
          <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-600 flex-1">{error}</p>
        </div>
      )}


      {/* Help Text */}
      {helpText && !error && (
        <p className="mt-1 text-xs text-gray-500 flex items-center">
          <svg className="w-3 h-3 mr-1 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {helpText}
        </p>
      )}

      {/* Character Count */}
      {maxLength && internalValue && (
        <p className="mt-1 text-xs text-gray-400 text-right">
          {internalValue.length}/{maxLength} characters
          {internalValue.length > maxLength * 0.9 && (
            <span className="text-orange-500 ml-1">⚠️</span>
          )}
        </p>
      )}
    </div>
  );
});

Input.displayName = "Input";
export default Input;