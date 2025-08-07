/**
 * Frontend Cache Manager
 * Provides cache invalidation functionality similar to server-side middleware
 * Uses browser storage for caching with automatic invalidation
 */

const CACHE_PREFIX = 'bazaar_cache_';
const CACHE_KEYS = {
  HOMEPAGE_PRODUCTS: 'homepage_products',
  STORE_PRODUCTS: 'store_products',
  CATEGORIES: 'categories',
  FEATURED_PRODUCTS: 'featured_products',
  TRENDING_PRODUCTS: 'trending_products',
  RECIPE_BUNDLES: 'recipe_bundles',
  USER_LOCATION: 'user_location'
};

const CACHE_EXPIRY = {
  PRODUCTS: 5 * 60 * 1000, // 5 minutes
  CATEGORIES: 10 * 60 * 1000, // 10 minutes
  LOCATION: 60 * 60 * 1000, // 1 hour
  FEATURED: 15 * 60 * 1000, // 15 minutes
  DEFAULT: 5 * 60 * 1000 // 5 minutes default
};

class CacheManager {
  constructor() {
    this.storage = localStorage;
    this.invalidationLog = [];
    this.maxLogSize = 100;
  }

  /**
   * Generate cache key with prefix
   */
  _generateKey(key) {
    return `${CACHE_PREFIX}${key}`;
  }

  /**
   * Get cache entry with expiry check
   */
  get(key, expiryTime = CACHE_EXPIRY.DEFAULT) {
    try {
      const cacheKey = this._generateKey(key);
      const cached = this.storage.getItem(cacheKey);
      
      if (!cached) return null;
      
      const { data, timestamp } = JSON.parse(cached);
      const now = Date.now();
      
      // Check if cache has expired
      if (now - timestamp > expiryTime) {
        this.storage.removeItem(cacheKey);
        return null;
      }
      
      return data;
    } catch (error) {
      console.warn(`Cache read error for ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cache entry with timestamp
   */
  set(key, data, customExpiry = null) {
    try {
      const cacheKey = this._generateKey(key);
      const timestamp = Date.now();
      const expiryTime = customExpiry || CACHE_EXPIRY.DEFAULT;
      
      const cacheEntry = {
        data,
        timestamp,
        expiryTime,
        key
      };
      
      this.storage.setItem(cacheKey, JSON.stringify(cacheEntry));
      
      // Schedule automatic cleanup
      setTimeout(() => {
        this.remove(key);
      }, expiryTime);
      
      return true;
    } catch (error) {
      console.warn(`Cache write error for ${key}:`, error);
      return false;
    }
  }

  /**
   * Remove specific cache entry
   */
  remove(key) {
    try {
      const cacheKey = this._generateKey(key);
      this.storage.removeItem(cacheKey);
      return true;
    } catch (error) {
      console.warn(`Cache removal error for ${key}:`, error);
      return false;
    }
  }

  /**
   * Clear specific cache keys (equivalent to server-side cache.clear())
   */
  clear(key) {
    if (Array.isArray(key)) {
      // Clear multiple keys
      let cleared = 0;
      key.forEach(k => {
        if (this.remove(k)) cleared++;
      });
      
      this._logInvalidation('bulk_clear', { keys: key, cleared });
      return cleared;
    } else {
      // Clear single key
      const success = this.remove(key);
      this._logInvalidation('single_clear', { key, success });
      return success;
    }
  }

  /**
   * Cache invalidation middleware equivalent
   * Called after admin actions that affect product visibility
   */
invalidateProductCaches(context = {}) {
    const keysToInvalidate = [
      CACHE_KEYS.HOMEPAGE_PRODUCTS,
      CACHE_KEYS.STORE_PRODUCTS,
      CACHE_KEYS.FEATURED_PRODUCTS,
      CACHE_KEYS.TRENDING_PRODUCTS
    ];
    
    const cleared = this.clear(keysToInvalidate);
    
    this._logInvalidation('product_approval', {
      context,
      keysCleared: keysToInvalidate,
      clearedCount: cleared,
      timestamp: new Date().toISOString(),
      cacheHeaders: {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    // Trigger storage event for cross-tab synchronization
    this._triggerStorageEvent('cache_invalidated', {
      keys: keysToInvalidate,
      reason: 'product_approval',
      context,
      cacheHeaders: {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
// Trigger direct DOM event for immediate UI updates
    if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
      window.dispatchEvent(new CustomEvent('product-cache-invalidate', {
        detail: {
          type: 'cache_manager_invalidation',
          keys: keysToInvalidate,
          context,
          timestamp: Date.now(),
          cacheHeaders: {
            'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      }));
    } else if (typeof window !== 'undefined' && window.Event) {
      // Fallback for environments without CustomEvent
      const event = new Event('product-cache-invalidate');
      event.detail = {
        type: 'cache_manager_invalidation',
        keys: keysToInvalidate,
        context,
        timestamp: Date.now(),
        cacheHeaders: {
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      };
      window.dispatchEvent(event);
    }
    return cleared;
  }

  /**
   * Clear all application caches
   */
  clearAll() {
    try {
      const keys = Object.keys(this.storage);
      let cleared = 0;
      
      keys.forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
          this.storage.removeItem(key);
          cleared++;
        }
      });
      
      this._logInvalidation('clear_all', { cleared });
      return cleared;
    } catch (error) {
      console.warn('Error clearing all cache:', error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const keys = Object.keys(this.storage);
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
    
    const stats = {
      totalKeys: cacheKeys.length,
      storageUsed: 0,
      entries: [],
      lastInvalidation: this.invalidationLog[this.invalidationLog.length - 1] || null
    };
    
    cacheKeys.forEach(key => {
      try {
        const value = this.storage.getItem(key);
        const size = new Blob([value]).size;
        stats.storageUsed += size;
        
        const parsed = JSON.parse(value);
        stats.entries.push({
          key: key.replace(CACHE_PREFIX, ''),
          timestamp: parsed.timestamp,
          size,
          expired: Date.now() - parsed.timestamp > parsed.expiryTime
        });
      } catch (error) {
        console.warn(`Error reading cache stats for ${key}:`, error);
      }
    });
    
    return stats;
  }

  /**
   * Check if cache needs invalidation based on admin actions
   */
  shouldInvalidateCache(actionType, path = '') {
    const productActions = [
      'bulk_approve',
      'toggle_visibility',
      'product_update',
      'product_create',
      'product_delete'
    ];
    
    const approvalPaths = [
      '/admin/products/approve',
      '/admin/products/visibility',
      '/admin/products/bulk'
    ];
    
    return productActions.includes(actionType) || 
           approvalPaths.some(p => path.includes(p));
  }

  /**
   * Log invalidation for debugging
   */
  _logInvalidation(action, details) {
    const logEntry = {
      action,
      details,
      timestamp: new Date().toISOString()
    };
    
    this.invalidationLog.push(logEntry);
    
    // Keep log size manageable
    if (this.invalidationLog.length > this.maxLogSize) {
      this.invalidationLog = this.invalidationLog.slice(-this.maxLogSize);
    }
    
    console.log('🗑️ Cache invalidation:', logEntry);
  }

/**
   * Trigger storage event for cross-tab communication
   */
  _triggerStorageEvent(type, data) {
    try {
      const eventData = JSON.stringify({ type, data, timestamp: Date.now() });
      const eventKey = `${CACHE_PREFIX}event`;
      
      // Use localStorage to trigger cross-tab events
      this.storage.setItem(eventKey, eventData);
      
      // Clean up the event key immediately
      setTimeout(() => {
        this.storage.removeItem(eventKey);
      }, 100);
      
    } catch (error) {
      console.warn('Error triggering storage event:', error);
    }
  }

  /**
/**
   * Listen for cache invalidation events from other tabs
   */
  onInvalidation(callback) {
    const handler = (event) => {
      if (event.key === `${CACHE_PREFIX}event` && event.newValue) {
        try {
          const { type, data } = JSON.parse(event.newValue);
          if (type === 'cache_invalidated') {
            // Set cache headers for fresh content
            if (data.cacheHeaders && typeof document !== 'undefined') {
              const meta = document.createElement('meta');
              meta.httpEquiv = 'Cache-Control';
              meta.content = data.cacheHeaders['Cache-Control'];
              document.getElementsByTagName('head')[0].appendChild(meta);
              
              // Clean up after a short delay
              setTimeout(() => {
                if (meta.parentNode) {
                  meta.parentNode.removeChild(meta);
                }
              }, 2000);
            }
            
            callback(data);
          }
        } catch (error) {
          console.warn('Error parsing cache event:', error);
        }
      }
    };
    
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }
}

// Export singleton instance
const cacheManager = new CacheManager();

// Export cache keys for use in components
export { CACHE_KEYS, CACHE_EXPIRY };
export default cacheManager;