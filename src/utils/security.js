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
    allowSpecialChars = true
  } = options;
  
  let sanitized = input;
  
  // Basic XSS protection
  if (!allowHTML) {
    sanitized = sanitized
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
  
// Remove potentially dangerous characters
  sanitized = sanitized.replace(/[<>"']/g, '');
  // Length limitation
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  // Remove script-related content
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+=/gi, '');
  
  // Optional: restrict to alphanumeric + basic punctuation
  if (!allowNumbers && !allowSpecialChars) {
    sanitized = sanitized.replace(/[^a-zA-Z\s]/g, '');
  } else if (!allowSpecialChars) {
    sanitized = sanitized.replace(/[^a-zA-Z0-9\s]/g, '');
  }
  
  return sanitized.trim();
};

// Email sanitization
export const sanitizeEmail = (email) => {
  if (typeof email !== 'string') return '';
  
  // Basic email format check and sanitization
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const sanitized = email.toLowerCase().trim();
  
  if (!emailRegex.test(sanitized)) {
    return '';
  }
return sanitized.replace(/[<>"']/g, '');
};

// URL sanitization
export const sanitizeURL = (url) => {
  if (typeof url !== 'string') return '';
  
  try {
    const sanitized = url.trim();
    
    // Block dangerous protocols
    if (sanitized.match(/^(javascript|data|vbscript):/i)) {
      return '';
    }
    
    // Allow only http, https, and relative URLs
if (sanitized.match(/^(https?:\/\/|\/)/)) {
      return sanitized.replace(/[<>"']/g, '');
    }
    
    return '';
  } catch (error) {
    return '';
  }
};

// Phone number sanitization
export const sanitizePhoneNumber = (phone) => {
  if (typeof phone !== 'string') return '';
  
// Allow only digits, spaces, hyphens, parentheses, and plus sign
  return phone.replace(/[^0-9\s\-()+]/g, '').trim();
};

// SQL injection prevention for search terms
export const sanitizeSearchTerm = (term) => {
  if (typeof term !== 'string') return '';
  
  return term
    .replace(/['"]/g, '') // Remove quotes
    .replace(/[;]/g, '') // Remove semicolons
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove SQL block comments
    .replace(/\*\//g, '')
    .replace(/union/gi, '') // Remove UNION statements
    .replace(/select/gi, '') // Remove SELECT statements
    .replace(/drop/gi, '') // Remove DROP statements
    .replace(/delete/gi, '') // Remove DELETE statements
    .replace(/insert/gi, '') // Remove INSERT statements
    .replace(/update/gi, '') // Remove UPDATE statements
    .trim()
    .substring(0, 100); // Limit length
};

// Validate and sanitize numeric input
export const sanitizeNumericInput = (value, options = {}) => {
  const { min = -Infinity, max = Infinity, allowDecimals = true } = options;
  
  if (value === '' || value === null || value === undefined) return '';
  
  let numericValue = parseFloat(value);
  
  if (isNaN(numericValue)) return '';
  
  if (!allowDecimals) {
    numericValue = Math.floor(numericValue);
  }
  
  if (numericValue < min) numericValue = min;
  if (numericValue > max) numericValue = max;
  
  return numericValue.toString();
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
  
  for (const [field, value] of Object.entries(formData)) {
    const rules = validationRules[field];
    if (!rules) continue;
    
    // Required field validation
    if (rules.required && (!value || value.toString().trim() === '')) {
      errors[field] = `${field} is required`;
      continue;
    }
    
    // Skip other validations if field is empty and not required
    if (!value || value.toString().trim() === '') continue;
    
    // Length validation
    if (rules.minLength && value.length < rules.minLength) {
      errors[field] = `${field} must be at least ${rules.minLength} characters`;
    }
    if (rules.maxLength && value.length > rules.maxLength) {
      errors[field] = `${field} cannot exceed ${rules.maxLength} characters`;
    }
    
    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value)) {
      errors[field] = rules.patternError || `${field} format is invalid`;
    }
    
    // Custom validation
    if (rules.validator && typeof rules.validator === 'function') {
      const customError = rules.validator(value);
      if (customError) {
        errors[field] = customError;
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
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
};