import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ApperIcon from '@/components/ApperIcon';
import { cn } from '@/utils/cn';

const SearchBar = ({ 
  onSearch, 
  placeholder = "Search products...", 
  className = "",
  autoFocus = false,
  showClearButton = true,
  debounceMs = 300
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  const debounceTimeoutRef = useRef(null);

  // Debounced search effect
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      if (onSearch && typeof onSearch === 'function') {
        onSearch(query.trim());
      }
    }, debounceMs);

    // Cleanup on unmount
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [query, onSearch, debounceMs]);

  // Auto focus effect
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleInputChange = (e) => {
    setQuery(e.target.value);
  };

  const handleClear = () => {
    setQuery('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleClear();
      inputRef.current?.blur();
    }
  };

  return (
    <div className={cn(
      "relative w-full max-w-md",
      className
    )}>
      <motion.div
        className={cn(
          "relative flex items-center",
          "bg-white border border-gray-200 rounded-lg",
          "transition-all duration-200",
          isFocused && "border-primary-500 ring-2 ring-primary-100"
        )}
        whileTap={{ scale: 0.99 }}
      >
        {/* Search Icon */}
        <div className="absolute left-3 pointer-events-none">
          <ApperIcon 
            name="Search" 
            className={cn(
              "w-5 h-5 transition-colors",
              isFocused ? "text-primary-600" : "text-gray-400"
            )}
          />
        </div>

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
className={cn(
            "w-full pl-11 pr-12 py-3",
            "text-sm text-gray-900 placeholder-gray-500",
            "bg-transparent border-0 outline-none",
            "rounded-lg word-spacing-relaxed product-text-field"
          )}
          aria-label="Search products"
        />

        {/* Clear Button */}
        <AnimatePresence>
          {showClearButton && query && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              onClick={handleClear}
              className={cn(
                "absolute right-3 p-1",
                "text-gray-400 hover:text-gray-600",
                "transition-colors duration-150",
                "rounded-full hover:bg-gray-100"
              )}
              aria-label="Clear search"
              type="button"
            >
              <ApperIcon name="X" className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Search Results Indicator */}
      <AnimatePresence>
        {query && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
className="absolute top-full left-0 right-0 mt-1 text-xs text-gray-500 px-3 word-spacing-relaxed"
          >
            Searching for "{query}"...
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;