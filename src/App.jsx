import '@/index.css';
import React, { useCallback, useEffect, useRef, useState } from "react";
import { BrowserRouter, Link, Route, Routes, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import ApperIcon from "@/components/ApperIcon";
import Header from "@/components/organisms/Header";
import CartDrawer from "@/components/organisms/CartDrawer";
import Loading from "@/components/ui/Loading";
import ErrorComponent, { Error } from "@/components/ui/Error";
import Home from "@/components/pages/Home";
import Cart from "@/components/pages/Cart";
import UserManagement from "@/components/pages/UserManagement";
import ManageProducts from "@/components/pages/ManageProducts";
import AddProduct from "@/components/pages/AddProduct";
import AddRecipeBundle from "@/components/pages/AddRecipeBundle";
import ReportsAnalytics from "@/components/pages/ReportsAnalytics";
import ProductDetail from "@/components/pages/ProductDetail";
import RecipeBundlesPage from "@/components/pages/RecipeBundlesPage";
import OrderManagement from "@/components/pages/OrderManagement";
import Category from "@/components/pages/Category";
import productsData from "@/services/mockData/products.json";
import categoriesData from "@/services/mockData/categories.json";
import recipeBundlesData from "@/services/mockData/recipeBundles.json";
import { initializeSecurity } from "@/utils/security";

// Admin Error Boundary Component
class AdminErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Admin Component Error:', error);
    console.error('Error Info:', errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="mb-4">
              <ApperIcon name="AlertTriangle" className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Admin Component Error
</h2>
              <p className="text-gray-600 mb-4">
                Something went wrong in the admin panel. This might be due to:
              </p>
              <ul className="text-left text-sm text-gray-600 mb-6 space-y-1">
                <li>• Network connectivity issues</li>
                <li>• Browser compatibility problems</li>
                <li>• Temporary server errors</li>
              </ul>
              <button
                onClick={this.handleRetry}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mb-3"
              >
                Try Again ({this.state.retryCount}/3)
              </button>
              <Link
                to="/"
                className="block w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-center"
              >
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Safe Admin Component Wrapper
const SafeAdminComponent = ({ children, componentName, fallback }) => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState(null);
  const [spacebarSystemStatus, setSpacebarSystemStatus] = useState('initializing');

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsInitializing(true);
        console.log('🚀 Starting app initialization...');

        // Initialize security
        await initializeSecurity();
        console.log('✅ Security initialized');

        // Browser compatibility check
        const browserInfo = detectBrowser();
        console.log('📱 Browser detected:', browserInfo);

        // Initialize performance monitoring
        initPerformanceMonitoring();
        console.log('📊 Performance monitoring active');

        console.log('🎉 App initialization complete');
        setIsInitializing(false);
      } catch (error) {
        console.error('❌ App initialization failed:', error);
        setInitError(error.message);
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, []);

  const initPerformanceMonitoring = () => {
    if ('performance' in window) {
      console.log('📊 Performance monitoring initialized');
    }
  };

  if (isInitializing) {
    return fallback || <Loading message={`Loading ${componentName}...`} />;
  }

  if (initError) {
    return <Error message={initError} onRetry={() => window.location.reload()} />;
  }

  return (
    <AdminErrorBoundary>
      <React.Suspense fallback={fallback || <Loading message={`Loading ${componentName}...`} />}>
        {children}
      </React.Suspense>
    </AdminErrorBoundary>
  );
};

// Browser detection at module level to avoid re-computation
const detectBrowser = () => {
  try {
    // Initialize all variables with safe defaults first
    const userAgent = navigator?.userAgent || '';
    const connectionStatus = navigator?.connection || null;
    
    const browserInfo = {
      name: 'Unknown',
      version: 'Unknown',
      mobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
      tablet: /iPad|Android(?=.*Tablet)|(?=.*\bTablet\b)/.test(userAgent),
      touch: ('ontouchstart' in window) || (navigator?.maxTouchPoints > 0) || false,
      screenReader: (typeof window !== 'undefined' && window.speechSynthesis !== undefined),
      reducedMotion: (typeof window !== 'undefined' && window.matchMedia) ? 
        window.matchMedia('(prefers-reduced-motion: reduce)').matches : false,
      darkMode: (typeof window !== 'undefined' && window.matchMedia) ? 
        window.matchMedia('(prefers-color-scheme: dark)').matches : false,
      highContrast: (typeof window !== 'undefined' && window.matchMedia) ? 
        window.matchMedia('(prefers-contrast: high)').matches : false,
      viewport: {
        width: (typeof window !== 'undefined') ? window.innerWidth : 1920,
        height: (typeof window !== 'undefined') ? window.innerHeight : 1080,
        ratio: (typeof window !== 'undefined') ? (window.devicePixelRatio || 1) : 1
      },
      connection: null,
      connectionStatus: 'unknown' // Initialize connectionStatus to prevent temporal dead zone
    };

    // Safely handle connection status
    if (connectionStatus) {
      browserInfo.connection = {
        effectiveType: connectionStatus.effectiveType || 'unknown',
        downlink: connectionStatus.downlink || 0,
        rtt: connectionStatus.rtt || 0
      };
      browserInfo.connectionStatus = 'connected';
    }

    // Enhanced browser detection with version checking
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      browserInfo.name = 'Chrome';
      browserInfo.version = userAgent.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
      browserInfo.modern = parseInt(browserInfo.version) >= 88;
    } else if (userAgent.includes('Firefox')) {
      browserInfo.name = 'Firefox';
      browserInfo.version = userAgent.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
      browserInfo.modern = parseInt(browserInfo.version) >= 85;
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      browserInfo.name = 'Safari';
      browserInfo.version = userAgent.match(/Version\/(\d+)/)?.[1] || 'Unknown';
      browserInfo.modern = parseInt(browserInfo.version) >= 14;
    } else if (userAgent.includes('Edg')) {
      browserInfo.name = 'Edge';
      browserInfo.version = userAgent.match(/Edg\/(\d+)/)?.[1] || 'Unknown';
      browserInfo.modern = parseInt(browserInfo.version) >= 88;
    }

    // Device categorization for admin interfaces
    browserInfo.deviceType = browserInfo.mobile ? 'mobile' : 
                            browserInfo.tablet ? 'tablet' : 'desktop';
    browserInfo.adminOptimized = (browserInfo.modern || false) && 
                                (browserInfo.deviceType === 'desktop' || 
                                 browserInfo.deviceType === 'tablet');

    return browserInfo;
  } catch (error) {
    console.warn('Browser detection failed:', error);
    // Return safe defaults if detection fails
    return {
      name: 'Unknown',
      version: 'Unknown',
      mobile: false,
      tablet: false,
      touch: false,
      screenReader: false,
      reducedMotion: false,
      darkMode: false,
      highContrast: false,
      modern: false,
      viewport: { width: 1920, height: 1080, ratio: 1 },
      connection: null,
      connectionStatus: 'unknown',
      deviceType: 'desktop',
      adminOptimized: false
    };
  }
};

// Initialize browser info with error handling
let BROWSER_INFO;
try {
  BROWSER_INFO = detectBrowser();
} catch (error) {
  console.error('Failed to initialize browser info:', error);
  BROWSER_INFO = {
    name: 'Unknown',
    version: 'Unknown',
    mobile: false,
    tablet: false,
    touch: false,
    screenReader: false,
    reducedMotion: false,
    darkMode: false,
    highContrast: false,
    modern: false,
    viewport: { width: 1920, height: 1080, ratio: 1 },
    connection: null,
    connectionStatus: 'unknown',
    deviceType: 'desktop',
    adminOptimized: false
  };
}

function AppContent() {
  const navigate = useNavigate();
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState({});
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [adminLoadProgress, setAdminLoadProgress] = useState(0);
  const [adminError, setAdminError] = useState(null);
  const [showForceExit, setShowForceExit] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [cartAnimationTrigger, setCartAnimationTrigger] = useState(0);

// Ref to track component mount status
  const isMountedRef = useRef(true);

  // Initialize spacebar fixes and performance monitoring only once to prevent re-renders
  useEffect(() => {
    const reactSpacebarHandler = function(e) {
      // Handle spacebar events for React components
      if (e.key === ' ' && e.target && e.target.closest('[data-react-component]')) {
        e.stopPropagation();
      }
    };

    document.addEventListener('keydown', reactSpacebarHandler, false);
    document.addEventListener('keypress', reactSpacebarHandler, false);

    return () => {
      document.removeEventListener('keydown', reactSpacebarHandler, false);
      document.removeEventListener('keypress', reactSpacebarHandler, false);
    };
  }, []);
// Initialize comprehensive spacebar fixes and performance monitoring
  useEffect(() => {
    // Initialize performance monitoring only once to prevent re-renders
    console.log('🔍 Browser Compatibility Check:', BROWSER_INFO);
    
    // Track compatibility issues
    if (parseInt(BROWSER_INFO.version) < 80 && BROWSER_INFO.name === 'Chrome') {
      console.warn('⚠️ Chrome version may have compatibility issues');
    }

    // Browser Extension Detection and Disabling
    const badExtensions = [
      'grammarly', 'languagetool', 'text-enhancer',
      'autocorrect', 'keyboard-manager', 'writing-assistant'
    ];

    console.log('🔧 Checking for problematic browser extensions...');
    
    badExtensions.forEach(ext => {
      // Check body classes
      if (document.body.classList.contains(ext + '-extension')) {
        document.body.classList.remove(ext + '-extension');
        console.warn(`🚫 Disabled ${ext} extension interference from body class`);
      }
      
      // Check for extension-injected elements
      const extElements = document.querySelectorAll(`[class*="${ext}"], [data-${ext}]`);
      extElements.forEach(element => {
        if (element && element.parentNode) {
          element.style.display = 'none';
          element.style.pointerEvents = 'none';
          console.warn(`🚫 Hidden ${ext} extension element`);
        }
      });
    });

    // Add CSS override for extension conflicts
    const extensionOverrideStyle = document.createElement('style');
    extensionOverrideStyle.id = 'extension-conflict-override';
    extensionOverrideStyle.textContent = `
      /* Extension Conflict Overrides */
      .grammarly-extension, .languagetool-extension, 
      ._1Rkub, .gr-tooltip, .gr_overlay,
      [data-grammarly-part], [data-gramm], [data-gramm-editor],
      grammarly-extension, grammarly-popups {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
        z-index: -9999 !important;
      }
      
      /* COMPREHENSIVE WORD SPACING ENFORCEMENT */
      /* Apply enhanced word spacing to ALL text elements */
      *, *::before, *::after {
        word-spacing: 0.08em !important;
        letter-spacing: 0.015em !important;
      }
      
      /* Enhanced spacing for specific text elements */
      p, span, div, h1, h2, h3, h4, h5, h6, 
      button, a, label, li, td, th {
        word-spacing: 0.1em !important;
        letter-spacing: 0.02em !important;
        line-height: 1.6 !important;
      }
      
      /* Product-specific enhanced spacing */
      [class*="product"], [class*="title"], [class*="name"],
      [class*="description"], [class*="text"] {
        word-spacing: 0.12em !important;
        letter-spacing: 0.025em !important;
        line-height: 1.65 !important;
      }
      
      /* Prevent extension CSS from interfering with inputs */
      input, textarea, [contenteditable] {
        -webkit-user-modify: read-write !important;
        -moz-user-modify: read-write !important;
        user-modify: read-write !important;
        white-space: pre-wrap !important;
        word-spacing: 0.1em !important;
        letter-spacing: 0.025em !important;
        line-height: 1.6 !important;
      }
      
      /* Override extension-injected styles */
      input:not([readonly]):not([disabled]), 
      textarea:not([readonly]):not([disabled]),
      [contenteditable="true"] {
        background: inherit !important;
        color: inherit !important;
        font: inherit !important;
        border: inherit !important;
        outline: inherit !important;
        opacity: 1 !important;
        visibility: visible !important;
        pointer-events: auto !important;
        word-spacing: 0.1em !important;
        letter-spacing: 0.025em !important;
      }
    `;
    
    if (!document.head.querySelector('#extension-conflict-override')) {
      document.head.appendChild(extensionOverrideStyle);
      console.log('✅ Extension conflict CSS overrides applied');
    }

    // Nuclear Option - Fallback Spacebar Handler with Enhanced Text Spacing
    const nuclearSpacebarHandler = function(e) {
      if (e.key === ' ' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        // Allow natural keyboard input without interference
        // Ensure proper spacing is maintained in text inputs
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) {
          setTimeout(() => {
            e.target.style.wordSpacing = '0.1em';
            e.target.style.letterSpacing = '0.025em';
          }, 10);
        }
      }
    };

    // Simple keyboard event listener for accessibility
    document.addEventListener('keydown', (e) => {
      // Let browser handle all input naturally with enhanced spacing
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) {
        // Apply enhanced spacing after input
        setTimeout(() => {
          e.target.style.wordSpacing = '0.1em';
          e.target.style.letterSpacing = '0.025em';
          e.target.style.lineHeight = '1.6';
        }, 10);
        return; // Allow natural input behavior
      }
    });
    
    // Enhanced input field initialization with comprehensive spacing
    const initializeInputFields = () => {
      const inputs = document.querySelectorAll('input, textarea, [contenteditable]');
      inputs.forEach(input => {
        // Add enhanced typography attributes
        input.setAttribute('data-spacebar-fixed', 'true');
        input.setAttribute('data-enhanced-typography', 'true');
        input.classList.add('product-text-field', 'word-spacing-loose');
        
        // Apply enhanced spacing styles directly
        input.style.wordSpacing = '0.1em';
        input.style.letterSpacing = '0.025em';
        input.style.lineHeight = '1.6';
        input.style.fontKerning = 'normal';
        input.style.textRendering = 'optimizeLegibility';
        
        // Ensure proper event handling
        input.addEventListener('keydown', function(e) {
          if (e.key === ' ') {
            e.stopPropagation();
          }
        }, { passive: false });
        
        // Maintain spacing on input events
        input.addEventListener('input', function() {
          this.style.wordSpacing = '0.1em';
          this.style.letterSpacing = '0.025em';
        });
        
        // Fix any extension-modified attributes
        if (input.hasAttribute('data-gramm_editor')) {
          input.removeAttribute('data-gramm_editor');
        }
        if (input.hasAttribute('data-gramm')) {
          input.removeAttribute('data-gramm');
        }
      });
      
      // Apply enhanced typography to all text elements
      const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, button, a, label, li');
      textElements.forEach(element => {
        element.style.wordSpacing = '0.08em';
        element.style.letterSpacing = '0.015em';
        element.classList.add('word-spacing-relaxed');
      });
      
      console.log(`✅ Initialized ${inputs.length} input fields and enhanced typography for all text elements`);
    };

    // Initialize existing fields and observe for new ones
    initializeInputFields();
    
    // Observer for dynamically added inputs
    const inputObserver = new MutationObserver((mutations) => {
      let hasNewInputs = false;
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            if (node.matches && node.matches('input, textarea, [contenteditable]')) {
              hasNewInputs = true;
            } else if (node.querySelectorAll) {
              const newInputs = node.querySelectorAll('input, textarea, [contenteditable]');
              if (newInputs.length > 0) {
                hasNewInputs = true;
              }
            }
          }
        });
      });
      
      if (hasNewInputs) {
        initializeInputFields(); // Direct call for immediate response
      }
    });

    inputObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Override mask functions globally
    window.showMask = function() { 
      console.log("Mask disabled"); 
      return null;
    };
    
    window.createOverlay = function() { 
      console.log("Overlay creation disabled");
      return null; 
    };

    window.hideMask = function() {
      console.log("Hide mask called (disabled)");
      return null;
    };

    // Remove event listeners from admin links to prevent conflicts
    const adminLinks = document.querySelectorAll('.admin-access-link, [href*="/admin"]');
    adminLinks.forEach(adminLink => {
      if (adminLink) {
        const newLink = adminLink.cloneNode(true);
        if (adminLink.parentNode) {
          adminLink.parentNode.replaceChild(newLink, adminLink);
        }
      }
    });

    // Performance monitoring setup - run once and cache results
    const initPerformanceMonitoring = () => {
      if ('performance' in window && isMountedRef.current) {
        const navigationTiming = performance.getEntriesByType('navigation')[0];
        if (navigationTiming) {
          const metrics = {
            pageLoadTime: navigationTiming.loadEventEnd - navigationTiming.loadEventStart,
            domContentLoaded: navigationTiming.domContentLoadedEventEnd - navigationTiming.domContentLoadedEventStart,
            firstPaint: 0,
            firstContentfulPaint: 0
          };
          
          // Get paint timings
          const paintTimings = performance.getEntriesByType('paint');
          paintTimings.forEach(timing => {
            if (timing.name === 'first-paint') {
              metrics.firstPaint = timing.startTime;
            } else if (timing.name === 'first-contentful-paint') {
              metrics.firstContentfulPaint = timing.startTime;
            }
          });
          
          setPerformanceMetrics(metrics);
          console.log('📊 Performance Metrics:', metrics);
          
          // Track performance in analytics - only once
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'page_performance', {
              page_load_time: Math.round(metrics.pageLoadTime),
              dom_content_loaded: Math.round(metrics.domContentLoaded),
              first_contentful_paint: Math.round(metrics.firstContentfulPaint),
              browser_name: BROWSER_INFO.name || 'unknown',
              spacebar_fixes_applied: true
            });
          }
        }
      }
    };

    // Initialize performance monitoring with delay to ensure DOM is ready
    const timeoutId = setTimeout(initPerformanceMonitoring, 100);

    console.log('🎯 Comprehensive spacebar fixes initialized successfully');

    // Cleanup on component unmount
    return () => {
      isMountedRef.current = false;
      clearTimeout(timeoutId);
      
      // Remove nuclear option handler
      document.removeEventListener('keydown', nuclearSpacebarHandler, {
        capture: true
      });
      
      // Disconnect input observer
      inputObserver.disconnect();
      
      // Remove extension override styles
      const overrideStyle = document.head.querySelector('#extension-conflict-override');
      if (overrideStyle) {
        overrideStyle.remove();
      }
      
      console.log('🧹 Spacebar fixes cleanup completed');
    };
  }, []); // Empty dependency array to run only once

  const cleanupRef = useRef(false);
const handleAdminAccess = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isAdminLoading || cleanupRef.current || !isMountedRef.current) return;
    
    const startTime = performance.now();
    cleanupRef.current = false;
    setIsAdminLoading(true);
    setAdminLoadProgress(0);
    setAdminError(null);
    setShowForceExit(false);
    
    // Track admin access attempt
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'admin_access_attempt', {
        browser_name: BROWSER_INFO.name || 'unknown',
        browser_version: BROWSER_INFO.version || 'unknown',
        is_mobile: BROWSER_INFO.mobile || false,
        timestamp: Date.now()
      });
    }
    
    // Adaptive progress interval based on device performance
// Responsive performance optimization
    const intervalDelay = BROWSER_INFO.mobile ? 200 : 
                         BROWSER_INFO.tablet ? 150 : 100;
    const progressInterval = setInterval(() => {
      if (cleanupRef.current || !isMountedRef.current) {
        clearInterval(progressInterval);
        return;
      }
      setAdminLoadProgress(prev => {
        if (prev >= 90) return prev;
        const increment = BROWSER_INFO.adminOptimized ? 
          Math.random() * 15 : Math.random() * 10;
        return prev + increment;
      });
    }, intervalDelay);

    // Device and connection aware timeout
    const connectionMultiplier = BROWSER_INFO.connection?.effectiveType === 'slow-2g' ? 2 : 
                                BROWSER_INFO.connection?.effectiveType === '2g' ? 1.5 : 1;
    const baseTimeout = BROWSER_INFO.mobile ? 8000 : 
                       BROWSER_INFO.tablet ? 6000 : 5000;
    const timeoutDuration = Math.round(baseTimeout * connectionMultiplier);
    
    const timeoutId = setTimeout(() => {
      if (cleanupRef.current || !isMountedRef.current) return;
      setShowForceExit(true);
      setAdminError(`Loading timeout - Dashboard taking longer than expected (${timeoutDuration/1000}s timeout)`);
      
      // Track timeout events
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'admin_load_timeout', {
          timeout_duration: timeoutDuration,
          browser_name: BROWSER_INFO.name || 'unknown',
          is_mobile: BROWSER_INFO.mobile || false
        });
      }
    }, timeoutDuration);

    try {
      // Enhanced browser compatibility checks
      if (!window.fetch) {
        throw new Error('Browser does not support fetch API. Please update your browser.');
      }
      
      if (!window.localStorage) {
        throw new Error('Browser does not support localStorage. Please enable cookies and try again.');
      }
// Ensure no overlays are blocking navigation
      document.body.classList.add('admin-accessing');
      document.body.classList.add('content-layer');
      document.body.classList.add('admin-route');
      document.body.classList.add('admin-emergency-cleanup');
      
      // Force remove any existing overlays
      const overlays = document.querySelectorAll('.overlay, .mask, .backdrop, [class*="overlay"], [class*="mask"]');
      overlays.forEach(overlay => {
        if (overlay) {
          overlay.style.display = 'none';
          overlay.style.opacity = '0';
          overlay.style.visibility = 'hidden';
          overlay.style.pointerEvents = 'none';
          overlay.style.zIndex = '-1000';
        }
      });
      
      // Add accessibility attributes
      document.body.setAttribute('aria-busy', 'true');
      document.body.setAttribute('aria-live', 'polite');
      // Browser-optimized loading stages
      if (!cleanupRef.current && isMountedRef.current) setAdminLoadProgress(20);
      await new Promise(resolve => setTimeout(resolve, BROWSER_INFO.mobile ? 300 : 200));
      
      // Preload critical admin resources
      if (!cleanupRef.current && isMountedRef.current) setAdminLoadProgress(40);
      if ('requestIdleCallback' in window) {
        await new Promise(resolve => window.requestIdleCallback(resolve));
      } else {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (!cleanupRef.current && isMountedRef.current) setAdminLoadProgress(60);
      await new Promise(resolve => setTimeout(resolve, BROWSER_INFO.mobile ? 400 : 300));
      
      // Navigate to admin dashboard
      if (!cleanupRef.current && isMountedRef.current) {
        setAdminLoadProgress(80);
        cleanupRef.current = true; // Prevent further state updates
        navigate('/admin');
      }
      
      // Complete loading with smooth transition
      if (!cleanupRef.current && isMountedRef.current) setAdminLoadProgress(100);
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Calculate and log performance metrics
      const endTime = performance.now();
      const loadDuration = endTime - startTime;
      
      console.log('📊 Admin Load Performance:', {
        duration: Math.round(loadDuration),
        browser: BROWSER_INFO.name,
        mobile: BROWSER_INFO.mobile,
        timeout: timeoutDuration
      });
      
      // Track successful admin load
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'admin_load_success', {
          load_duration: Math.round(loadDuration),
          browser_name: BROWSER_INFO.name || 'unknown',
          is_mobile: BROWSER_INFO.mobile || false
        });
      }
      
    } catch (error) {
      if (cleanupRef.current || !isMountedRef.current) return; // Don't process errors after cleanup
      
      console.error('Admin access error:', error);
      
      // Enhanced error categorization
      let errorCategory = 'unknown';
      let userFriendlyMessage = 'Failed to access admin dashboard';
      
      if (error.message.includes('fetch')) {
        errorCategory = 'network';
        userFriendlyMessage = 'Network connection issue. Please check your internet and try again.';
      } else if (error.message.includes('localStorage') || error.message.includes('cookies')) {
        errorCategory = 'storage';
        userFriendlyMessage = 'Browser storage issue. Please enable cookies and refresh the page.';
      } else if (error.message.includes('Browser does not support')) {
        errorCategory = 'compatibility';
        userFriendlyMessage = error.message;
      } else if (error.name === 'TimeoutError') {
        errorCategory = 'timeout';
        userFriendlyMessage = 'Request timed out. The server may be busy. Please try again.';
      }
      
      if (isMountedRef.current) {
        setAdminError(userFriendlyMessage);
      }
      
      // Track admin load errors
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'admin_load_error', {
          error_category: errorCategory,
          error_message: error.message,
          browser_name: BROWSER_INFO.name || 'unknown',
          is_mobile: BROWSER_INFO.mobile || false,
          retry_count: retryCount
        });
      }
      
      // Implement simple retry logic without recursion
      if (retryCount < 3 && errorCategory !== 'compatibility') {
        const baseDelay = BROWSER_INFO.mobile ? 2000 : 1000;
        const delay = Math.pow(2, retryCount) * baseDelay;
        
        setTimeout(() => {
          if (!cleanupRef.current && isMountedRef.current) {
            setRetryCount(prev => prev + 1);
            // Don't call handleAdminAccess recursively - let user manually retry
            setShowForceExit(true);
          }
        }, delay);
      }
      
    } finally {
      // Cleanup resources
      clearInterval(progressInterval);
      clearTimeout(timeoutId);
      
setTimeout(() => {
        if (!cleanupRef.current && isMountedRef.current) {
          setIsAdminLoading(false);
          setAdminLoadProgress(0);
        }
        document.body.classList.remove('admin-accessing');
        document.body.classList.remove('content-layer');
        document.body.classList.remove('admin-route');
        document.body.classList.remove('admin-emergency-cleanup');
        document.body.removeAttribute('aria-busy');
        document.body.removeAttribute('aria-live');
      }, 500);
    }
  }, [isAdminLoading, navigate, retryCount]); // Removed browserInfo from dependencies since it's now static

// Force exit handler for emergency situations
// Force exit handler for emergency situations
  const handleForceExit = useCallback(() => {
    console.warn('🚨 Force exit triggered - Emergency admin access cleanup');
    
    // Set cleanup flag to prevent further operations
    cleanupRef.current = true;
    
    // Track emergency exits
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'admin_force_exit', {
        browser_name: BROWSER_INFO.name || 'unknown',
        error_state: adminError || 'timeout',
        timestamp: Date.now()
      });
    }
    
    // Emergency cleanup
    if (isMountedRef.current) {
      setIsAdminLoading(false);
      setAdminLoadProgress(0);
      setAdminError(null);
      setShowForceExit(false);
      setRetryCount(0);
    }
    
    // Force remove all admin-related classes and overlays
document.body.classList.remove('admin-accessing', 'content-layer', 'admin-route', 'admin-emergency-cleanup');
    document.body.classList.add('admin-emergency-exit');
    document.body.removeAttribute('aria-busy');
    document.body.removeAttribute('aria-live');
    
    // Force clear any remaining overlays
    const allOverlays = document.querySelectorAll('[class*="overlay"], [class*="mask"], [class*="backdrop"]');
    allOverlays.forEach(el => {
      el.style.display = 'none !important';
    });
    
    // Remove emergency class after cleanup
    setTimeout(() => {
      document.body.classList.remove('admin-emergency-exit');
      cleanupRef.current = false; // Reset for next attempt
    }, 1000);
    
    // Navigate to safe route
navigate('/');
}, [navigate, adminError]); // Removed browserInfo from dependencies

  // Application initialization state
  const [isInitializing, setIsInitializing] = useState(false);
  const [initError, setInitError] = useState(null);

  if (isInitializing) {
    return <Loading message="Initializing application..." />;
  }

  if (initError) {
    return <Error message={initError} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Loading Progress Bar */}
      {isAdminLoading && (
        <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
          <div 
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${adminLoadProgress}%` }}
          />
        </div>
      )}
<Header 
        onCartClick={() => setIsCartDrawerOpen(true)}
        cartAnimationTrigger={cartAnimationTrigger}
      />
      <main>
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/category" element={<Category />} />
            <Route path="/deals" element={<Category />} />
            
            {/* Admin Dashboard Routes */}
<Route path="/admin" element={
              <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
                <div className="max-w-7xl mx-auto">
                  <div className="mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Admin Panel</h2>
                    <p className="text-sm sm:text-base text-gray-600 mb-4">
                      Dashboard component has been removed. Use the navigation below to access admin features.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                    <Link 
                      to="/admin/products" 
                      className="block p-4 sm:p-6 bg-white rounded-lg shadow-soft hover:shadow-medium transition-all transform hover:scale-105 hover:bg-primary-50 border border-gray-200 hover:border-primary-200"
                    >
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Manage Products</h3>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">Add, edit, and manage products</p>
                    </Link>
                    <Link 
                      to="/admin/orders" 
                      className="block p-4 sm:p-6 bg-white rounded-lg shadow-soft hover:shadow-medium transition-all transform hover:scale-105 hover:bg-blue-50 border border-gray-200 hover:border-blue-200"
                    >
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Orders</h3>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">View and manage orders</p>
                    </Link>
                    <Link 
                      to="/admin/users" 
                      className="block p-4 sm:p-6 bg-white rounded-lg shadow-soft hover:shadow-medium transition-all transform hover:scale-105 hover:bg-green-50 border border-gray-200 hover:border-green-200"
                    >
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base">User Management</h3>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">Manage user accounts</p>
                    </Link>
                    <Link 
                      to="/admin/reports" 
                      className="block p-4 sm:p-6 bg-white rounded-lg shadow-soft hover:shadow-medium transition-all transform hover:scale-105 hover:bg-purple-50 border border-gray-200 hover:border-purple-200"
                    >
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Reports & Analytics</h3>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">View reports and analytics</p>
                    </Link>
                  </div>
</div>
              </div>
            } />
<Route path="/admin/*" element={
              <SafeAdminComponent componentName="Admin Routes">
                <Routes>
                  <Route index element={
                    <SafeAdminComponent componentName="ManageProducts" fallback={
                      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                        <div className="text-center">
                          <div className="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto mb-4"></div>
                          <p className="text-gray-600">Loading Product Management...</p>
                        </div>
                      </div>
                    }>
                      <ManageProducts />
                    </SafeAdminComponent>
                  } />
                  <Route path="products" element={
                    <SafeAdminComponent componentName="ManageProducts">
                      <ManageProducts />
                    </SafeAdminComponent>
                  } />
                  <Route path="products/manage" element={
                    <SafeAdminComponent componentName="ManageProducts">
                      <ManageProducts />
                    </SafeAdminComponent>
                  } />
                  <Route path="products/add" element={
                    <SafeAdminComponent componentName="AddProduct">
                      <AddProduct />
                    </SafeAdminComponent>
                  } />
                  <Route path="categories" element={<div className="p-6">
                    <div className="max-w-6xl mx-auto">
                      <h2 className="text-2xl font-bold text-gray-900 mb-6">Categories Management</h2>
                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <p className="text-gray-600">Category management system coming soon. This will include:</p>
                        <ul className="mt-4 space-y-2 text-sm text-gray-600">
                          <li>• Multi-level category tree</li>
                          <li>• Drag & drop category ordering</li>
                          <li>• Category image management</li>
                          <li>• SEO settings per category</li>
                          <li>• Product count tracking</li>
                        </ul>
                      </div>
                    </div>
                  </div>} />
                  <Route path="inventory" element={<div className="p-6">
                    <div className="max-w-6xl mx-auto">
                      <h2 className="text-2xl font-bold text-gray-900 mb-6">Inventory Management</h2>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                          <div className="flex items-center">
                            <ApperIcon name="Package" className="w-8 h-8 text-blue-600" />
                            <div className="ml-4">
                              <p className="text-sm font-medium text-gray-600">Total Products</p>
                              <p className="text-2xl font-bold text-gray-900">1,245</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                          <div className="flex items-center">
                            <ApperIcon name="AlertTriangle" className="w-8 h-8 text-orange-600" />
                            <div className="ml-4">
                              <p className="text-sm font-medium text-gray-600">Low Stock</p>
                              <p className="text-2xl font-bold text-gray-900">23</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                          <div className="flex items-center">
                            <ApperIcon name="XCircle" className="w-8 h-8 text-red-600" />
                            <div className="ml-4">
                              <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                              <p className="text-2xl font-bold text-gray-900">8</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <p className="text-gray-600">Advanced inventory management coming soon:</p>
                        <ul className="mt-4 space-y-2 text-sm text-gray-600">
                          <li>• Real-time stock tracking</li>
                          <li>• Low stock alerts & notifications</li>
                          <li>• Bulk stock adjustments</li>
                          <li>• Inventory history & audit trails</li>
                          <li>• Supplier management integration</li>
                        </ul>
                      </div>
                    </div>
                  </div>} />
                  <Route path="orders" element={
                    <SafeAdminComponent componentName="OrderManagement">
                      <OrderManagement />
                    </SafeAdminComponent>
                  } />
                  <Route path="customers" element={<div className="p-6">Customer Management - Coming Soon</div>} />
                  <Route path="users" element={
                    <SafeAdminComponent componentName="UserManagement">
                      <UserManagement />
                    </SafeAdminComponent>
                  } />
                  <Route path="marketing" element={<div className="p-6">Marketing Tools - Coming Soon</div>} />
                  <Route path="reports" element={
                    <SafeAdminComponent componentName="ReportsAnalytics">
                      <ReportsAnalytics />
                    </SafeAdminComponent>
                  } />
                  <Route path="settings" element={<div className="p-6">System Settings - Coming Soon</div>} />
                </Routes>
              </SafeAdminComponent>
            } />
            
            {/* Legacy admin routes for backward compatibility */}
            <Route path="/admin/add-product" element={<AddProduct />} />
            <Route path="/admin/recipe-bundles" element={<RecipeBundlesPage />} />
            <Route path="/admin/add-recipe-bundle" element={<AddRecipeBundle />} />
            
            {/* Extended Admin Routes */}
            <Route path="/admin/users" element={
              <div className="min-h-screen bg-gray-50">
                <Header />
                <main className="container mx-auto px-4 py-8">
                  <UserManagement />
                </main>
              </div>
            } />
            <Route path="/admin/orders-management" element={
              <div className="min-h-screen bg-gray-50">
                <Header />
                <main className="container mx-auto px-4 py-8">
                  <OrderManagement />
                </main>
              </div>
            } />
            <Route path="/admin/analytics" element={
              <div className="min-h-screen bg-gray-50">
                <Header />
                <main className="container mx-auto px-4 py-8">
                  <ReportsAnalytics />
                </main>
              </div>
            } />
          </Routes>
        </main>

<CartDrawer 
          isOpen={isCartDrawerOpen} 
          onClose={() => setIsCartDrawerOpen(false)}
          onCartUpdate={() => setCartAnimationTrigger(prev => prev + 1)}
        />
<ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
        
        {/* Admin Access Portal - Footer Entry Point */}
        <footer className="bg-gray-900 text-white py-8 mt-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 className="font-display font-bold text-lg mb-4">BazaarPK</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Your trusted online marketplace for fresh, organic, and quality products across Pakistan.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-4">Quick Links</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
                </ul>
              </div>
              
<div>
                <h4 className="font-medium mb-4">System</h4>
                <div className="space-y-2">
                  <Link
                    to="/admin"
                    className="admin-access-link text-xs text-gray-500 hover:text-gray-300 transition-colors"
                    aria-label="Access Admin Dashboard"
                  >
                    Admin Access
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-800 mt-6 pt-6 text-center">
              <p className="text-gray-400 text-sm">
                &copy; 2024 BazaarPK. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
  );
}

function App() {
  // Initialize security features on app start
  useEffect(() => {
    initializeSecurity();
  }, []);

  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;