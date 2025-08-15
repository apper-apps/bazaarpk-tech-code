import React from "react";
import { Error } from "@/components/ui/Error";
// Removed Error import - using native JavaScript Error class instead
/**
 * Security utilities for input sanitization and CSRF protection
 * Implements WCAG compliance and security best practices
 */
/**
 * Security utilities for input sanitization and CSRF protection
 * Implements WCAG compliance and security best practices
 */

// Generate CSRF token for form protection
export const generateCSRFToken = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Store CSRF token in session
export const setCSRFToken = (token) => {
  try {
    sessionStorage.setItem('csrf_token', token);
    // Also set as meta tag for easier access
    let metaTag = document.querySelector('meta[name="csrf-token"]');
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.setAttribute('name', 'csrf-token');
      document.head.appendChild(metaTag);
    }
    metaTag.setAttribute('content', token);
  } catch (error) {
    console.warn('Failed to store CSRF token:', error);
  }
};

// Get current CSRF token
export const getCSRFToken = () => {
  try {
    return sessionStorage.getItem('csrf_token') || 
           document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  } catch (error) {
    console.warn('Failed to retrieve CSRF token:', error);
    return null;
  }
};

// Initialize CSRF token on app start
export const initializeCSRF = () => {
  if (!getCSRFToken()) {
    const token = generateCSRFToken();
    setCSRFToken(token);
  }
};

// Input sanitization functions
export const sanitizeInput = (input, options = {}) => {
  if (typeof input !== 'string') return input;
  
  const {
    allowHTML = false,
    maxLength = 1000,
    allowNumbers = true,
    allowSpecialChars = true,
    preserveSpaces = true,
    strictMode = false,
    allowedChars = null,
    blockedPatterns = [],
    caseSensitive = true
  } = options;
  
  let sanitized = input;
  
  // Preserve original for logging
  const original = input;
  
if (preserveSpaces) {
    // ENHANCED WORD SPACING ENFORCEMENT - Core Functionality
    // Step 1: Auto-detect and fix merged words
    sanitized = autoSpaceWords(sanitized);
    
    // Step 2: International best practice: preserve natural word spacing
    // Only collapse multiple consecutive spaces (2+) to single spaces
    sanitized = sanitized.replace(/[ \t]{2,}/g, ' ');
    
    // Step 3: Preserve line breaks but normalize multiple line breaks
    sanitized = sanitized.replace(/\n\s*\n/g, '\n');
    
    // Step 4: Only trim excessive leading/trailing whitespace, preserve intentional spacing
    sanitized = sanitized.replace(/^[\s\n]+|[\s\n]+$/g, '');
  } else {
    // Standard mode: still apply word spacing but with standard space normalization
    sanitized = autoSpaceWords(sanitized);
    sanitized = sanitized.replace(/[ \t]+/g, ' ').trim();
  }
  
  // Enhanced XSS protection
  if (!allowHTML) {
    sanitized = sanitized
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .replace(/\\/g, '&#x5C;');
  }
  
  // Remove potentially dangerous characters and patterns
  sanitized = sanitized.replace(/[<>"'\\]/g, '');
  
  // Enhanced script injection prevention
  const dangerousPatterns = [
    /javascript:/gi,
    /on\w+=/gi,
    /data:/gi,
    /vbscript:/gi,
    /file:/gi,
    /about:/gi,
    /<script/gi,
    /<\/script/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /<form/gi,
    /eval\(/gi,
    /document\./gi,
    /window\./gi,
    ...blockedPatterns
  ];
  
  dangerousPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  // Character filtering based on options
  if (allowedChars) {
    // Use custom allowed characters
    const allowedRegex = new RegExp(`[^${allowedChars}]`, caseSensitive ? 'g' : 'gi');
    sanitized = sanitized.replace(allowedRegex, '');
  } else {
    // Use predefined filtering
    if (!allowNumbers && !allowSpecialChars) {
      sanitized = sanitized.replace(/[^a-zA-Z\s]/g, '');
    } else if (!allowSpecialChars) {
      sanitized = sanitized.replace(/[^a-zA-Z0-9\s\-_.]/g, '');
    } else if (strictMode) {
      // Strict mode: only allow safe characters
      sanitized = sanitized.replace(/[^a-zA-Z0-9\s\-_.,!?@#$%^&*()+=[]{};:]/g, '');
    }
  }
  
  // Length limitation with graceful truncation
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
    // Try to break at word boundary if possible
    if (maxLength > 20) {
      const lastSpace = sanitized.lastIndexOf(' ');
      if (lastSpace > maxLength * 0.8) {
        sanitized = sanitized.substring(0, lastSpace);
      }
    }
  }
// Log sanitization for security monitoring
  if (original !== sanitized && (import.meta.env?.MODE === 'development' || import.meta.env?.DEV)) {
    console.log('🧹 Input Sanitized:', {
      original: original.substring(0, 100),
      sanitized: sanitized.substring(0, 100),
      changes: original.length - sanitized.length
    });
  }
return sanitized;
};

// CORE FUNCTIONALITY: Auto-insert spaces between merged words
const autoSpaceWords = (text) => {
  if (typeof text !== 'string' || !text) return text;
  
  let result = text;
  
  // ENHANCED PATTERN RECOGNITION for comprehensive word spacing
  
  // Pattern 1: Enhanced camelCase detection with context awareness
  result = result.replace(/([a-z])([A-Z])/g, '$1 $2');
  
  // Pattern 2: Multiple capital letters followed by lowercase (e.g., "HTMLParser" → "HTML Parser")
  result = result.replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
  
  // Pattern 3: Enhanced number-letter boundaries with unit awareness
  result = result.replace(/([0-9])([a-zA-Z])/g, '$1 $2');
  result = result.replace(/([a-zA-Z])([0-9])/g, '$1 $2');
  
  // Pattern 4: Comma-separated words without spaces (e.g., "organic,natural" → "organic, natural")
  result = result.replace(/([a-zA-Z]),([a-zA-Z])/g, '$1, $2');
  
  // Pattern 5: Hyphenated compound words with merged components
  result = result.replace(/([a-z])-([A-Z])/g, '$1-$2'.toLowerCase());
  result = result.replace(/([a-z])([A-Z][a-z])/g, '$1 $2');
  
  // Pattern 6: Enhanced product naming patterns with more coverage
  const commonMergedPatterns = [
    // Food products
    { pattern: /BasmatiRice/gi, replacement: 'Basmati Rice' },
    { pattern: /BrownRice/gi, replacement: 'Brown Rice' },
    { pattern: /WhiteRice/gi, replacement: 'White Rice' },
    { pattern: /OliveOil/gi, replacement: 'Olive Oil' },
    { pattern: /CoconutOil/gi, replacement: 'Coconut Oil' },
    { pattern: /SunflowerOil/gi, replacement: 'Sunflower Oil' },
    { pattern: /GreenTea/gi, replacement: 'Green Tea' },
    { pattern: /BlackTea/gi, replacement: 'Black Tea' },
    { pattern: /BlackPepper/gi, replacement: 'Black Pepper' },
    { pattern: /RedChili/gi, replacement: 'Red Chili' },
    { pattern: /GreenChili/gi, replacement: 'Green Chili' },
    { pattern: /extraVirgin/gi, replacement: 'Extra Virgin' },
    { pattern: /organicFood/gi, replacement: 'Organic Food' },
    { pattern: /wholeWheat/gi, replacement: 'Whole Wheat' },
    { pattern: /seaSalt/gi, replacement: 'Sea Salt' },
    { pattern: /rockSalt/gi, replacement: 'Rock Salt' },
    
    // Common product attributes
    { pattern: /glutenFree/gi, replacement: 'Gluten Free' },
    { pattern: /dairyFree/gi, replacement: 'Dairy Free' },
    { pattern: /sugarFree/gi, replacement: 'Sugar Free' },
    { pattern: /lowFat/gi, replacement: 'Low Fat' },
    { pattern: /highProtein/gi, replacement: 'High Protein' },
    { pattern: /vitaminC/gi, replacement: 'Vitamin C' },
    { pattern: /vitaminD/gi, replacement: 'Vitamin D' },
    
    // Brand and location patterns
    { pattern: /bestPunjab/gi, replacement: 'Best Punjab' },
    { pattern: /freshFarm/gi, replacement: 'Fresh Farm' },
    { pattern: /pureNature/gi, replacement: 'Pure Nature' },
  ];
  
  commonMergedPatterns.forEach(({ pattern, replacement }) => {
    result = result.replace(pattern, replacement);
  });
  
  // Pattern 7: Handle special characters with merged words
  result = result.replace(/([a-zA-Z])([&@#%])/g, '$1 $2');
  result = result.replace(/([&@#%])([a-zA-Z])/g, '$1 $2');
// Clean up excessive spaces but preserve intentional spacing
  result = result.replace(/\s{3,}/g, '  '); // Max 2 consecutive spaces
  result = result.replace(/\s{2,}/g, ' ').trim();
  
  return result;
  result = result.replace(/([a-zA-Z])([.!?])/g, '$1$2');
  result = result.replace(/([.!?])([a-zA-Z])/g, '$1 $2');
  
  return result;
};

// Enhanced email sanitization with comprehensive validation
export const sanitizeEmail = (email) => {
  if (typeof email !== 'string') return '';
  
  // Enhanced email regex with better validation
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  let sanitized = email.toLowerCase().trim();
  
  // Remove dangerous characters
  sanitized = sanitized.replace(/[<>"'\\]/g, '');
  
  // Basic format validation
  if (!emailRegex.test(sanitized)) {
    return '';
  }
  
  // Additional security checks
  if (sanitized.includes('..') || 
      sanitized.startsWith('.') || 
      sanitized.endsWith('.') ||
      sanitized.length > 254) { // RFC 5321 limit
    return '';
  }
  
  // Check for common malicious patterns
  const maliciousPatterns = [
    /script/gi,
    /javascript/gi,
    /vbscript/gi,
    /onload/gi,
    /onerror/gi
  ];
  
  for (const pattern of maliciousPatterns) {
    if (pattern.test(sanitized)) {
      return '';
    }
  }
  
  return sanitized;
};

// Enhanced URL sanitization with comprehensive security checks
export const sanitizeURL = (url) => {
  if (typeof url !== 'string') return '';
  
  try {
    let sanitized = url.trim();
    
    // Remove dangerous characters
    sanitized = sanitized.replace(/[<>"'\\]/g, '');
    
    // Block dangerous protocols
    const dangerousProtocols = [
      /^javascript:/i,
      /^data:/i,
      /^vbscript:/i,
      /^file:/i,
      /^ftp:/i,
      /^mailto:/i,
      /^about:/i,
      /^chrome:/i,
      /^chrome-extension:/i,
      /^moz-extension:/i
    ];
    
    for (const protocol of dangerousProtocols) {
      if (protocol.test(sanitized)) {
        return '';
      }
    }
    
    // Allow only safe protocols
    const safeProtocols = /^(https?:\/\/|\/)/;
    if (!safeProtocols.test(sanitized)) {
      // Try to fix by adding https://
      if (!sanitized.includes('://') && !sanitized.startsWith('/')) {
        sanitized = 'https://' + sanitized;
      } else {
        return '';
      }
    }
    
    // Validate URL structure
    try {
      const urlObj = new URL(sanitized.startsWith('/') ? 'https://example.com' + sanitized : sanitized);
      
      // Additional security checks
      if (urlObj.hostname === 'localhost' || 
          urlObj.hostname.startsWith('127.') ||
          urlObj.hostname.startsWith('192.168.') ||
          urlObj.hostname.startsWith('10.') ||
          urlObj.hostname.includes('..')) {
        return '';
      }
      
      return sanitized;
    } catch (e) {
      return '';
    }
    
  } catch (error) {
    console.warn('URL sanitization error:', error);
    return '';
  }
};

// Enhanced phone number sanitization
export const sanitizePhoneNumber = (phone) => {
  if (typeof phone !== 'string') return '';
  
  // Remove all non-phone characters
  let sanitized = phone.replace(/[^0-9\s\-().+]/g, '').trim();
  
  // Validate phone number patterns
  const phonePatterns = [
    /^\+?[1-9]\d{1,14}$/, // International format
    /^\+92[0-9]{10}$/, // Pakistan format
    /^03[0-9]{9}$/, // Pakistan mobile
    /^\([0-9]{3}\)\s?[0-9]{3}-?[0-9]{4}$/ // US format
  ];
  
  const isValidFormat = phonePatterns.some(pattern => pattern.test(sanitized.replace(/[\s\-().]/g, '')));
  
  return isValidFormat ? sanitized : '';
};

// Enhanced search term sanitization
export const sanitizeSearchTerm = (term) => {
  if (typeof term !== 'string') return '';
  
  let sanitized = term;
  
  // Remove SQL injection patterns
  const sqlPatterns = [
    /['"]/g, // Remove quotes
    /[;]/g, // Remove semicolons
    /--/g, // Remove SQL comments
    /\/\*/g, // Remove SQL block comments
    /\*\//g,
    /\bunion\b/gi, // Remove UNION statements
    /\bselect\b/gi, // Remove SELECT statements
    /\bdrop\b/gi, // Remove DROP statements
    /\bdelete\b/gi, // Remove DELETE statements
    /\binsert\b/gi, // Remove INSERT statements
    /\bupdate\b/gi, // Remove UPDATE statements
    /\bexec\b/gi, // Remove EXEC statements
    /\bxp_\w+/gi, // Remove extended procedures
    /\bsp_\w+/gi // Remove stored procedures
  ];
  
  sqlPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  // Additional XSS protection
  sanitized = sanitized.replace(/[<>"'\\]/g, '');
  
  // Limit length and normalize whitespace
  sanitized = sanitized.trim().replace(/\s+/g, ' ').substring(0, 100);
  
  return sanitized;
};

// Enhanced numeric input sanitization with better validation
export const sanitizeNumericInput = (value, options = {}) => {
  const { 
    min = -Infinity, 
    max = Infinity, 
    allowDecimals = true,
    maxDecimalPlaces = 2,
    allowNegative = true,
    forcePositive = false
  } = options;
  
  if (value === '' || value === null || value === undefined) return '';
  
  // Convert to string for processing
  let stringValue = String(value).trim();
  
  // Remove non-numeric characters except decimal point and minus
  stringValue = stringValue.replace(/[^0-9.-]/g, '');
  
  // Handle multiple decimal points
  const decimalParts = stringValue.split('.');
  if (decimalParts.length > 2) {
    stringValue = decimalParts[0] + '.' + decimalParts.slice(1).join('');
  }
  
  // Handle multiple minus signs
  if (stringValue.indexOf('-') !== stringValue.lastIndexOf('-')) {
    stringValue = stringValue.charAt(0) === '-' ? '-' + stringValue.replace(/-/g, '') : stringValue.replace(/-/g, '');
  }
  
  // Ensure minus is at the beginning
  if (stringValue.includes('-') && !stringValue.startsWith('-')) {
    stringValue = stringValue.replace('-', '');
  }
  
  let numericValue = parseFloat(stringValue);
  
  // Handle invalid numbers
  if (isNaN(numericValue)) return '';
  
  // Force positive if required
  if (forcePositive && numericValue < 0) {
    numericValue = Math.abs(numericValue);
  }
  
  // Handle negative numbers
  if (!allowNegative && numericValue < 0) {
    numericValue = 0;
  }
  
  // Handle decimals
  if (!allowDecimals) {
    numericValue = Math.floor(Math.abs(numericValue)) * (numericValue < 0 ? -1 : 1);
  } else if (maxDecimalPlaces !== undefined) {
    numericValue = Math.round(numericValue * Math.pow(10, maxDecimalPlaces)) / Math.pow(10, maxDecimalPlaces);
  }
  
  // Apply min/max constraints
  if (numericValue < min) numericValue = min;
  if (numericValue > max) numericValue = max;
  
  // Format the output
  let result = numericValue.toString();
  
  // Limit decimal places in output
  if (allowDecimals && maxDecimalPlaces !== undefined && result.includes('.')) {
    const [intPart, decPart] = result.split('.');
    result = intPart + '.' + decPart.substring(0, maxDecimalPlaces);
  }
  
  return result;
};

// Image validation and sanitization
export const validateAndSanitizeImage = (file, options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    minWidth = 100,
    maxWidth = 5000,
    minHeight = 100,
    maxHeight = 5000
  } = options;
  
  return new Promise((resolve, reject) => {
    // File type validation
    if (!allowedTypes.includes(file.type)) {
      reject(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`));
      return;
    }
    
    // File size validation
    if (file.size > maxSize) {
      reject(new Error(`File size too large. Maximum size: ${(maxSize / 1024 / 1024).toFixed(1)}MB`));
      return;
    }
    
    // Image dimension validation
    const img = new Image();
    img.onload = () => {
      if (img.width < minWidth || img.width > maxWidth) {
        reject(new Error(`Image width must be between ${minWidth}px and ${maxWidth}px`));
        return;
      }
      
      if (img.height < minHeight || img.height > maxHeight) {
        reject(new Error(`Image height must be between ${minHeight}px and ${maxHeight}px`));
        return;
      }
      
      resolve({
        file,
        width: img.width,
        height: img.height,
        size: file.size,
        type: file.type,
        isValid: true
      });
    };
    
    img.onerror = () => {
      reject(new Error('Invalid image file or corrupted data'));
    };
    
    img.src = URL.createObjectURL(file);
  });
};

// ARIA live region announcer for screen readers
export const announceToScreenReader = (message, priority = 'polite') => {
  const announcer = document.getElementById('screen-reader-announcer') || createScreenReaderAnnouncer();
  
  announcer.setAttribute('aria-live', priority);
  announcer.textContent = message;
  
  // Clear after announcement
  setTimeout(() => {
    announcer.textContent = '';
  }, 1000);
};

// Create screen reader announcer element
const createScreenReaderAnnouncer = () => {
  const announcer = document.createElement('div');
  announcer.id = 'screen-reader-announcer';
  announcer.setAttribute('aria-live', 'polite');
  announcer.setAttribute('aria-atomic', 'true');
  announcer.style.cssText = `
    position: absolute;
    left: -10000px;
    width: 1px;
    height: 1px;
    overflow: hidden;
  `;
  document.body.appendChild(announcer);
  return announcer;
};

// Validate form data before submission
export const validateFormData = (formData, validationRules = {}) => {
  const errors = {};
  const warnings = {};
  const suggestions = {};
  
  for (const [field, value] of Object.entries(formData)) {
    const rules = validationRules[field];
    if (!rules) continue;
    
    const stringValue = value ? value.toString().trim() : '';
    
// Required field validation with enhanced messaging
    if (rules.required && (!value || stringValue === '')) {
      const fieldDisplayName = formatFieldName(field);
      errors[field] = rules.requiredError || `${fieldDisplayName} is required and cannot be empty`;
      continue;
    }
    // Skip other validations if field is empty and not required
    if (!value || stringValue === '') {
      // Add suggestions for optional but recommended fields
      if (rules.recommended) {
        suggestions[field] = rules.recommendedMessage || `${formatFieldName(field)} is recommended for better results`;
      }
      continue;
    }
    
    // Enhanced length validation
    if (rules.minLength && stringValue.length < rules.minLength) {
      errors[field] = rules.minLengthError || 
        `${formatFieldName(field)} must be at least ${rules.minLength} character${rules.minLength > 1 ? 's' : ''} long`;
    }
    
    if (rules.maxLength && stringValue.length > rules.maxLength) {
      errors[field] = rules.maxLengthError || 
        `${formatFieldName(field)} cannot exceed ${rules.maxLength} character${rules.maxLength > 1 ? 's' : ''}`;
    }
    
    // Optimal length suggestions
    if (rules.optimalLength && Math.abs(stringValue.length - rules.optimalLength) > rules.optimalLength * 0.2) {
      suggestions[field] = `For best results, ${formatFieldName(field)} should be around ${rules.optimalLength} characters`;
    }
    
    // Enhanced pattern validation
    if (rules.pattern) {
      if (Array.isArray(rules.pattern)) {
        // Multiple patterns - must match at least one
        const matched = rules.pattern.some(p => p.test(stringValue));
        if (!matched) {
          errors[field] = rules.patternError || `${formatFieldName(field)} format is invalid`;
        }
      } else {
        // Single pattern
        if (!rules.pattern.test(stringValue)) {
          errors[field] = rules.patternError || `${formatFieldName(field)} format is invalid`;
        }
      }
    }
    
    // Numeric validation
    if (rules.type === 'number') {
      const numValue = parseFloat(stringValue);
      
      if (isNaN(numValue)) {
        errors[field] = `${formatFieldName(field)} must be a valid number`;
      } else {
        // Min/Max validation
        if (rules.min !== undefined && numValue < rules.min) {
          errors[field] = `${formatFieldName(field)} must be at least ${rules.min}`;
        }
        
        if (rules.max !== undefined && numValue > rules.max) {
          errors[field] = `${formatFieldName(field)} cannot exceed ${rules.max}`;
        }
        
        // Warning for unusual values
        if (rules.warningMin !== undefined && numValue < rules.warningMin) {
          warnings[field] = `${formatFieldName(field)} value seems quite low - please verify`;
        }
        
        if (rules.warningMax !== undefined && numValue > rules.warningMax) {
          warnings[field] = `${formatFieldName(field)} value seems quite high - please verify`;
        }
        
        // Decimal places validation
        if (rules.maxDecimals !== undefined) {
          const decimalPlaces = (stringValue.split('.')[1] || '').length;
          if (decimalPlaces > rules.maxDecimals) {
            errors[field] = `${formatFieldName(field)} can have maximum ${rules.maxDecimals} decimal place${rules.maxDecimals > 1 ? 's' : ''}`;
          }
        }
      }
    }
    
    // Email validation
    if (rules.type === 'email') {
      const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      if (!emailRegex.test(stringValue)) {
        errors[field] = `Please enter a valid email address`;
      } else if (stringValue.length > 254) {
        errors[field] = `Email address is too long (maximum 254 characters)`;
      }
    }
    
    // URL validation
    if (rules.type === 'url') {
      try {
        new URL(stringValue.startsWith('http') ? stringValue : `https://${stringValue}`);
      } catch {
        errors[field] = `Please enter a valid URL (e.g., https://example.com)`;
      }
    }
    
    // Custom validation functions
    if (rules.validator && typeof rules.validator === 'function') {
      const customResult = rules.validator(value, formData);
      if (customResult) {
        if (typeof customResult === 'string') {
          errors[field] = customResult;
        } else if (customResult.error) {
          errors[field] = customResult.error;
        }
        
        if (customResult.warning) {
          warnings[field] = customResult.warning;
        }
        
        if (customResult.suggestion) {
          suggestions[field] = customResult.suggestion;
        }
      }
    }
    
    // Cross-field validation
    if (rules.dependencies && Array.isArray(rules.dependencies)) {
      rules.dependencies.forEach(dep => {
        const depValue = formData[dep.field];
        if (dep.condition && dep.condition(depValue) && !dep.validator(value, depValue)) {
          errors[field] = dep.error || `${formatFieldName(field)} is invalid based on ${formatFieldName(dep.field)}`;
        }
      });
    }
    
    // Uniqueness validation (for future use with backend)
    if (rules.unique && rules.checkUnique) {
      // This would typically involve an API call
      // For now, just mark for validation
      if (typeof rules.checkUnique === 'function') {
        const uniqueCheck = rules.checkUnique(stringValue);
        if (uniqueCheck && uniqueCheck.error) {
          errors[field] = uniqueCheck.error;
        }
      }
    }
    
    // Security validation
    if (rules.security) {
      const securityIssues = checkSecurityIssues(stringValue, rules.security);
      if (securityIssues.length > 0) {
        errors[field] = `Security issue detected: ${securityIssues.join(', ')}`;
      }
    }
  }
  
  // Cross-form validation
  if (validationRules._formRules && typeof validationRules._formRules === 'function') {
    const formValidation = validationRules._formRules(formData);
    if (formValidation && formValidation.errors) {
      Object.assign(errors, formValidation.errors);
    }
    if (formValidation && formValidation.warnings) {
      Object.assign(warnings, formValidation.warnings);
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
    suggestions,
    summary: {
      errorCount: Object.keys(errors).length,
      warningCount: Object.keys(warnings).length,
      suggestionCount: Object.keys(suggestions).length
    }
  };
};

// Helper function to format field names for user display
const formatFieldName = (fieldName) => {
  // Handle specific field name mappings
  const fieldMappings = {
    'sellingPrice': 'Selling Price',
    'buyingPrice': 'Buying Price',
    'stockQuantity': 'Stock Quantity',
    'productName': 'Product Name',
    'shortDescription': 'Short Description',
    'detailedDescription': 'Detailed Description',
    'metaTitle': 'Meta Title',
    'metaDescription': 'Meta Description',
    'sku': 'Sku',
    'category': 'Category'
  };
  
  if (fieldMappings[fieldName]) {
    return fieldMappings[fieldName];
  }
  
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .replace(/\b\w/g, l => l.toUpperCase());
};

// Security issue checker
const checkSecurityIssues = (value, securityRules) => {
  const issues = [];
  
  if (securityRules.noScripts && /<script|javascript:|vbscript:/i.test(value)) {
    issues.push('Script content not allowed');
  }
  
  if (securityRules.noHTML && /<[^>]*>/i.test(value)) {
    issues.push('HTML tags not allowed');
  }
  
  if (securityRules.noSQL && /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC)\b)/i.test(value)) {
    issues.push('SQL keywords not allowed');
  }
  
  if (securityRules.maxConsecutiveChars) {
    const regex = new RegExp(`(.)\\1{${securityRules.maxConsecutiveChars},}`, 'i');
    if (regex.test(value)) {
      issues.push(`Too many consecutive identical characters`);
    }
  }
  
  return issues;
};

// Data consistency validation for frontend-backend sync
export const validateDataConsistency = async (formData, options = {}) => {
  const {
    checkDuplicates = true,
    validateReferences = true,
    checkBusinessRules = true
  } = options;
  
  try {
    const issues = [];
    
    // Check for duplicate SKU
    if (checkDuplicates && formData.sku) {
      // This would typically be an API call to check existing SKUs
      // For now, simulate the check
      const isDuplicate = await simulateSkuCheck(formData.sku);
      if (isDuplicate) {
        issues.push('SKU already exists in the system');
      }
    }
    
    // Validate category references
    if (validateReferences && formData.category) {
      const categoryExists = await simulateCategoryCheck(formData.category);
      if (!categoryExists) {
        issues.push('Selected category does not exist');
      }
    }
    
    // Business rule validation
    if (checkBusinessRules) {
      // Price consistency
      if (formData.buyingPrice && formData.sellingPrice && 
          parseFloat(formData.buyingPrice) >= parseFloat(formData.sellingPrice)) {
        issues.push('Buying price should be less than selling price for profitability');
      }
      
      // Discount validation
      if (formData.discountAmount && formData.sellingPrice) {
        const discount = parseFloat(formData.discountAmount);
        const price = parseFloat(formData.sellingPrice);
        
        if (formData.discountType === 'percentage' && discount > 100) {
          issues.push('Discount percentage cannot exceed 100%');
        } else if (formData.discountType === 'fixed' && discount >= price) {
          issues.push('Fixed discount cannot be greater than or equal to selling price');
        }
      }
      
      // Stock validation
      if (formData.stockQuantity && formData.lowStockThreshold) {
        const stock = parseInt(formData.stockQuantity);
        const threshold = parseInt(formData.lowStockThreshold);
        
        if (threshold > stock && stock > 0) {
          issues.push('Low stock threshold is higher than current stock quantity');
        }
      }
    }
    
    return {
      isValid: issues.length === 0,
      error: issues.length > 0 ? issues.join('; ') : null,
      issues
    };
    
  } catch (error) {
    console.error('Data consistency validation error:', error);
    return {
      isValid: false,
      error: 'Unable to validate data consistency. Please try again.',
      issues: ['Validation service temporarily unavailable']
    };
  }
};

// Simulate SKU uniqueness check (replace with actual API call)
const simulateSkuCheck = async (sku) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Mock duplicate check (in real app, this would be an API call)
  const existingSkus = ['PROD-001', 'TECH-002', 'FOOD-003']; // Mock existing SKUs
  return existingSkus.includes(sku.toUpperCase());
};

// Simulate category existence check (replace with actual API call)
const simulateCategoryCheck = async (category) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Mock category validation (in real app, this would be an API call)
  const validCategories = ['electronics', 'clothing', 'food', 'books', 'home']; // Mock valid categories
  return validCategories.includes(category.toLowerCase());
};

// Generate data checksum for integrity validation
export const generateDataChecksum = (data) => {
  try {
    const dataString = JSON.stringify(data, Object.keys(data).sort());
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  } catch (error) {
    console.warn('Failed to generate data checksum:', error);
    return Date.now().toString(36);
  }
};

// Initialize security features
export const initializeSecurity = () => {
  // Initialize CSRF protection
  initializeCSRF();
  
  // Create screen reader announcer
  if (!document.getElementById('screen-reader-announcer')) {
    createScreenReaderAnnouncer();
  }
  
// Set up CSP headers if supported
  if ('SecurityPolicyViolationEvent' in window) {
    document.addEventListener('securitypolicyviolation', (e) => {
      console.warn('CSP Violation:', e.violatedDirective, e.blockedURI);
    });
  }
// Initialize security systems
  initializeInputFields();
  
  // Enhanced spacebar support for natural text input
  if (typeof window !== 'undefined') {
    // Ensure spacebar events are never blocked in form inputs
    document.addEventListener('keydown', function(e) {
      if (e.key === ' ' || e.code === 'Space') {
        const target = e.target;
        if (target && (
          target.tagName === 'INPUT' || 
          target.tagName === 'TEXTAREA' || 
          target.contentEditable === 'true'
        )) {
          // Prevent any interference with natural space insertion
          e.stopImmediatePropagation = () => {};
          e.preventDefault = () => {};
          console.debug('Spacebar protection: Natural space input enabled for', target);
        }
      }
    }, true); // Capture phase to intercept early
  }
  
  // Initialize input field spacing enhancements
const ensureSpacebarWorksInInputs = () => {
    const inputElements = document.querySelectorAll('input, textarea, [contenteditable="true"]');
    
    inputElements.forEach(element => {
      // Mark as spacebar-protected with enhanced attributes
      element.setAttribute('data-spacebar-fixed', 'true');
      element.setAttribute('data-typography-enhanced', 'true');
      
      // ENHANCED INPUT PROPERTIES for optimal typography
// Enhanced text styling for optimal readability
        element.style.whiteSpace = 'normal'; // Allow natural text flow
        element.style.wordSpacing = '0.1em';
        element.style.letterSpacing = '0.025em';
        element.style.lineHeight = '1.65';
        element.style.textTransform = 'none';
        
        // Enhanced font rendering
        element.style.fontKerning = 'normal';
        element.style.textRendering = 'optimizeLegibility';
        element.style.fontFeatureSettings = '"kern" 1';
        
        // User interaction properties - enable natural text input
        element.style.userSelect = 'text';
        element.style.WebkitUserSelect = 'text';
        element.style.MozUserSelect = 'text';
        element.style.pointerEvents = 'auto';
        element.style.touchAction = 'manipulation';
element.style.touchAction = 'manipulation';
        
        // Advanced typography properties for natural text flow
        element.style.wordBreak = 'normal';
        element.style.overflowWrap = 'break-word';
        element.style.hyphens = 'auto';
        
        // Focus enhancement
        element.style.cursor = 'text';
      }
      
      // Special handling for contenteditable elements
      if (element.hasAttribute('contenteditable')) {
        element.style.minHeight = '2.5rem';
        element.style.outline = 'none';
        element.style.wordSpacing = '0.1em';
        element.style.letterSpacing = '0.025em';
        element.style.lineHeight = '1.65';
      }
      
      // Enhanced spacebar support for natural text input
      element.addEventListener('keydown', function(e) {
        if (e.key === ' ' || e.code === 'Space') {
          // Ensure natural space input is never blocked
          console.debug('Natural space input enabled for element:', element);
          // Allow the event to proceed naturally
          return true;
        }
      }, { passive: true }); // Passive listener to avoid blocking
    });
  };

  // Run immediately and on DOM changes
  ensureSpacebarWorksInInputs();
  
  // Monitor for new input fields
  if (typeof MutationObserver !== 'undefined') {
    const inputObserver = new MutationObserver((mutations) => {
      let hasNewInputs = false;
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.matches && node.matches('input, textarea, [contenteditable]')) {
              hasNewInputs = true;
            } else if (node.querySelector) {
              const inputs = node.querySelectorAll('input, textarea, [contenteditable]');
              if (inputs.length > 0) hasNewInputs = true;
            }
          }
        });
      });
      
      if (hasNewInputs) {
        setTimeout(ensureSpacebarWorksInInputs, 0);
      }
    });
    
    inputObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
// Development mode spacebar issue detection
  if (import.meta.env?.MODE === 'development' || import.meta.env?.DEV) {
    let spaceKeyBlocked = false;
    // Global spacebar monitoring
    document.addEventListener('keydown', function(e) {
      if (e.key === ' ' || e.code === 'Space') {
        const target = e.target;
        const isInputField = target && (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.contentEditable === 'true' ||
          target.getAttribute('contenteditable') === 'true'
        );
        
        if (isInputField && (e.defaultPrevented || spaceKeyBlocked)) {
          console.warn('⚠️ SPACEBAR BLOCKED in input field:', {
            element: target,
            tagName: target.tagName,
            type: target.type,
            id: target.id,
            className: target.className,
            defaultPrevented: e.defaultPrevented,
            stackTrace: new Error().stack
          });
          
          // Attempt to restore spacebar functionality
          if (target.value !== undefined) {
            const cursorPos = target.selectionStart;
            target.value = target.value.slice(0, cursorPos) + ' ' + target.value.slice(cursorPos);
            target.setSelectionRange(cursorPos + 1, cursorPos + 1);
          }
        }
      }
}
      }, true); // Capture phase to intercept early
    });
    
    // Natural space input monitoring - removed preventDefault override
    // to allow normal spacebar functionality in all input fields
    
    console.log('✅ Natural spacebar input enabled for all form fields');
  }
  // Initialize performance monitoring
  const checkSpacebarCompatibility = () => {
    const testInput = document.createElement('input');
    testInput.style.position = 'absolute';
    testInput.style.left = '-9999px';
    testInput.style.visibility = 'hidden';
    document.body.appendChild(testInput);
    
    testInput.focus();
    
    // Simulate spacebar keypress
    const spaceEvent = new KeyboardEvent('keydown', {
      key: ' ',
      code: 'Space',
      keyCode: 32,
      which: 32,
      bubbles: true,
      cancelable: true
    });
// Create input event with fallback for older browsers
    let inputEvent;
    try {
      // Check if InputEvent constructor is available in global scope
      if (typeof window !== 'undefined' && window.InputEvent && typeof window.InputEvent === 'function') {
        inputEvent = new window.InputEvent('input', {
          data: ' ',
          bubbles: true,
          cancelable: true
        });
      } else {
        throw new Error('InputEvent constructor not available');
      }
    } catch (e) {
      // Fallback for browsers that don't support InputEvent constructor
      try {
        inputEvent = document.createEvent('InputEvent');
        inputEvent.initEvent('input', true, true);
        inputEvent.data = ' ';
      } catch (fallbackError) {
        // Final fallback using generic Event
        inputEvent = document.createEvent('Event');
        inputEvent.initEvent('input', true, true);
        inputEvent.data = ' ';
      }
    }
    
    testInput.dispatchEvent(spaceEvent);
    if (!spaceEvent.defaultPrevented) {
      testInput.dispatchEvent(inputEvent);
      testInput.value += ' ';
    }
    
    // Check if space was added
    const spaceWorking = testInput.value.includes(' ');
    
    if (!spaceWorking && (import.meta.env?.MODE === 'development' || import.meta.env?.DEV)) {
      console.warn('⚠️ Spacebar functionality test failed - potential issues detected');
    }
    
    document.body.removeChild(testInput);
    return spaceWorking;
  };
  
  // Run compatibility check after a short delay
  setTimeout(checkSpacebarCompatibility, 1000);

  // Announce spacebar protection is active
  if (typeof announceToScreenReader === 'function') {
    announceToScreenReader('Spacebar input protection initialized');
  }
};