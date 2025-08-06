import '@/index.css';
import React, { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import ApperIcon from "@/components/ApperIcon";
import Header from "@/components/organisms/Header";
import CartDrawer from "@/components/organisms/CartDrawer";
import ErrorComponent from "@/components/ui/Error";
import UserManagement from "@/components/pages/UserManagement";
import AddRecipeBundle from "@/components/pages/AddRecipeBundle";
import Home from "@/components/pages/Home";
import AddProduct from "@/components/pages/AddProduct";
import ProductDetail from "@/components/pages/ProductDetail";
import OrderManagement from "@/components/pages/OrderManagement";
import Category from "@/components/pages/Category";
import RecipeBundlesPage from "@/components/pages/RecipeBundlesPage";
import ManageProducts from "@/components/pages/ManageProducts";
import Cart from "@/components/pages/Cart";
import AdminDashboard from "@/components/pages/AdminDashboard";
import ReportsAnalytics from "@/components/pages/ReportsAnalytics";

function AppContent() {
  const navigate = useNavigate();
const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [adminLoadProgress, setAdminLoadProgress] = useState(0);
  const [adminError, setAdminError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showForceExit, setShowForceExit] = useState(false);
  const [browserInfo, setBrowserInfo] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState({});

  // Error logging setup for debugging
useEffect(() => {
    // Initialize browser compatibility detection
    const detectBrowser = () => {
      const userAgent = navigator.userAgent;
      const browserInfo = {
        name: 'Unknown',
        version: 'Unknown',
        mobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
        touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        screenReader: window.speechSynthesis !== undefined,
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
        highContrast: window.matchMedia('(prefers-contrast: high)').matches
      };

      // Browser detection
      if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
        browserInfo.name = 'Chrome';
        browserInfo.version = userAgent.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
      } else if (userAgent.includes('Firefox')) {
        browserInfo.name = 'Firefox';
        browserInfo.version = userAgent.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
      } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
        browserInfo.name = 'Safari';
        browserInfo.version = userAgent.match(/Version\/(\d+)/)?.[1] || 'Unknown';
      } else if (userAgent.includes('Edg')) {
        browserInfo.name = 'Edge';
        browserInfo.version = userAgent.match(/Edg\/(\d+)/)?.[1] || 'Unknown';
      }

      setBrowserInfo(browserInfo);
      
      // Log browser compatibility info
      console.log('🔍 Browser Compatibility Check:', browserInfo);
      
      // Track compatibility issues
      if (parseInt(browserInfo.version) < 80 && browserInfo.name === 'Chrome') {
        console.warn('⚠️ Chrome version may have compatibility issues');
      }
    };

    const handleAdminMaskError = (e) => {
      // Enhanced console logging for debugging with browser context
      console.group('🔴 Admin Mask Persistence Error');
      console.error('Error Details:', {
        timestamp: new Date().toISOString(),
        errorType: e.detail?.type || 'unknown',
        errorMessage: e.detail?.message || 'No message provided',
        errorStack: e.detail?.error?.stack,
        currentRoute: window.location.pathname,
        userAgent: navigator.userAgent,
        browserInfo: browserInfo,
        screenInfo: {
          width: window.screen.width,
          height: window.screen.height,
          availWidth: window.screen.availWidth,
          availHeight: window.screen.availHeight,
          devicePixelRatio: window.devicePixelRatio
        },
        adminState: {
          isAdminRoute: window.location.pathname.includes('/admin'),
          hasAdminClass: document.body.classList.contains('admin-accessing'),
          adminElements: document.querySelectorAll('.admin-dashboard, [data-admin-content]').length
        }
      });
      
      // Enhanced DOM state analysis
      console.log('DOM State Analysis:', {
        overlayElements: document.querySelectorAll('.overlay-mask, .modal-backdrop, .loading-overlay').length,
        adminElements: document.querySelectorAll('.admin-dashboard, .admin-panel').length,
        zIndexIssues: Array.from(document.querySelectorAll('*')).filter(el => {
          const zIndex = parseInt(window.getComputedStyle(el).zIndex);
          return zIndex > 10000 && !el.closest('.admin-dashboard');
        }).length,
        accessibilityFeatures: {
          ariaLabels: document.querySelectorAll('[aria-label]').length,
          focusableElements: document.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])').length,
          headings: document.querySelectorAll('h1, h2, h3, h4, h5, h6').length
        }
      });
      console.groupEnd();
      
      // Track mask persistence errors in analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'admin_mask_persistence_error', {
          error_type: e.detail?.type || 'unknown',
          browser_name: browserInfo?.name || 'unknown',
          browser_version: browserInfo?.version || 'unknown',
          is_mobile: browserInfo?.mobile || false,
          route: window.location.pathname,
          timestamp: Date.now()
        });
      }
      
      // Enhanced Sentry integration with browser context
      if (typeof window !== 'undefined' && window.Sentry) {
        window.Sentry.withScope((scope) => {
          scope.setTag('error_category', 'admin_mask_persistence');
          scope.setTag('browser_name', browserInfo?.name || 'unknown');
          scope.setTag('browser_version', browserInfo?.version || 'unknown');
          scope.setTag('is_mobile', browserInfo?.mobile || false);
          scope.setContext('admin_state', {
            route: window.location.pathname,
            timestamp: new Date().toISOString(),
            adminClassesPresent: document.body.className,
            errorType: e.detail?.type,
            browserInfo: browserInfo
          });
          scope.setContext('device_info', {
            userAgent: navigator.userAgent,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio,
            orientation: window.screen.orientation?.type || 'unknown'
          });
          scope.setLevel('error');
          window.Sentry.captureException(e.detail?.error || new Error(e.detail?.message || 'Admin mask error'));
        });
      }
      
      // Dispatch enhanced custom event for error tracking
      window.dispatchEvent(new CustomEvent('admin_debug_log', {
        detail: {
          type: 'mask_error',
          severity: 'high',
          data: e.detail,
          debugInfo: {
            route: window.location.pathname,
            timestamp: Date.now(),
            retryable: e.detail?.retryable !== false,
            browserInfo: browserInfo,
            performanceMetrics: performanceMetrics
          }
        }
      }));
    };

    // Performance monitoring setup
    const initPerformanceMonitoring = () => {
      if ('performance' in window) {
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
          
          // Log performance metrics
          console.log('📊 Performance Metrics:', metrics);
          
          // Track performance in analytics
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'page_performance', {
              page_load_time: Math.round(metrics.pageLoadTime),
              dom_content_loaded: Math.round(metrics.domContentLoaded),
              first_contentful_paint: Math.round(metrics.firstContentfulPaint),
              browser_name: browserInfo?.name || 'unknown'
            });
          }
        }
      }
    };

    // Initialize browser detection and monitoring
    detectBrowser();
    initPerformanceMonitoring();
    
    // Add event listeners
    window.addEventListener('admin_mask_error', handleAdminMaskError);
    
    // Monitor console errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      originalConsoleError.apply(console, args);
      
      // Track console errors in analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'console_error', {
          error_message: args[0]?.toString() || 'Unknown error',
          browser_name: browserInfo?.name || 'unknown',
          route: window.location.pathname,
          timestamp: Date.now()
        });
      }
    };

    // Cleanup on component unmount
    return () => {
      window.removeEventListener('admin_mask_error', handleAdminMaskError);
      console.error = originalConsoleError;
    };
}, []); // Run only once on mount - browser detection and performance monitoring initialization

const handleAdminAccess = async () => {
    const startTime = performance.now();
    setIsAdminLoading(true);
    setAdminLoadProgress(0);
    setAdminError(null);
    setShowForceExit(false);
    
    // Track admin access attempt
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'admin_access_attempt', {
        browser_name: browserInfo?.name || 'unknown',
        browser_version: browserInfo?.version || 'unknown',
        is_mobile: browserInfo?.mobile || false,
        timestamp: Date.now()
      });
    }
    
    // Adaptive progress interval based on device performance
    const intervalDelay = browserInfo?.mobile ? 150 : 100;
    const progressInterval = setInterval(() => {
      setAdminLoadProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, intervalDelay);

    // Browser-specific timeout (longer for mobile/slower browsers)
    const timeoutDuration = browserInfo?.mobile || 
                           (browserInfo?.name === 'Safari' && parseInt(browserInfo?.version) < 14) ? 
                           8000 : 5000;
    
    const timeoutId = setTimeout(() => {
      setShowForceExit(true);
      setAdminError(`Loading timeout - Dashboard taking longer than expected (${timeoutDuration/1000}s timeout)`);
      
      // Track timeout events
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'admin_load_timeout', {
          timeout_duration: timeoutDuration,
          browser_name: browserInfo?.name || 'unknown',
          is_mobile: browserInfo?.mobile || false
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
      
      // Add accessibility attributes
      document.body.setAttribute('aria-busy', 'true');
      document.body.setAttribute('aria-live', 'polite');
      
      // Browser-optimized loading stages
      setAdminLoadProgress(20);
      await new Promise(resolve => setTimeout(resolve, browserInfo?.mobile ? 300 : 200));
      
      // Preload critical admin resources
      setAdminLoadProgress(40);
      if ('requestIdleCallback' in window) {
        await new Promise(resolve => window.requestIdleCallback(resolve));
      } else {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      setAdminLoadProgress(60);
      await new Promise(resolve => setTimeout(resolve, browserInfo?.mobile ? 400 : 300));
      
      // Navigate to admin dashboard
      setAdminLoadProgress(80);
      navigate('/admin');
      
      // Complete loading with smooth transition
      setAdminLoadProgress(100);
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Calculate and log performance metrics
      const endTime = performance.now();
      const loadDuration = endTime - startTime;
      
      console.log('📊 Admin Load Performance:', {
        duration: Math.round(loadDuration),
        browser: browserInfo?.name,
        mobile: browserInfo?.mobile,
        timeout: timeoutDuration
      });
      
      // Track successful admin load
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'admin_load_success', {
          load_duration: Math.round(loadDuration),
          browser_name: browserInfo?.name || 'unknown',
          is_mobile: browserInfo?.mobile || false
        });
      }
      
      // Clear states
      clearInterval(progressInterval);
      clearTimeout(timeoutId);
      
    } catch (error) {
      clearInterval(progressInterval);
      clearTimeout(timeoutId);
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
      
      setAdminError(userFriendlyMessage);
      
      // Track admin load errors
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'admin_load_error', {
          error_category: errorCategory,
          error_message: error.message,
          browser_name: browserInfo?.name || 'unknown',
          is_mobile: browserInfo?.mobile || false,
          retry_count: retryCount
        });
      }
      
      // Implement exponential backoff retry with browser-specific delays
      const retryWithBackoff = async (attempt) => {
        const baseDelay = browserInfo?.mobile ? 2000 : 1000;
        const delay = Math.pow(2, attempt) * baseDelay; // Longer delays for mobile
        setTimeout(async () => {
          if (attempt < 3) {
            setRetryCount(prev => prev + 1);
            await handleAdminAccess();
          }
        }, delay);
      };
      
      if (retryCount < 3 && errorCategory !== 'compatibility') {
        retryWithBackoff(retryCount);
      }
      
    } finally {
      setTimeout(() => {
        setIsAdminLoading(false);
        setAdminLoadProgress(0);
        document.body.classList.remove('admin-accessing');
        document.body.classList.remove('content-layer');
        document.body.removeAttribute('aria-busy');
        document.body.removeAttribute('aria-live');
        clearInterval(progressInterval);
        clearTimeout(timeoutId);
      }, 500);
    }
  };

  // Force exit handler for emergency situations
  const handleForceExit = () => {
    console.warn('🚨 Force exit triggered - Emergency admin access cleanup');
    
    // Track emergency exits
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'admin_force_exit', {
        browser_name: browserInfo?.name || 'unknown',
        error_state: adminError || 'timeout',
        timestamp: Date.now()
      });
    }
    
    // Emergency cleanup
    setIsAdminLoading(false);
    setAdminLoadProgress(0);
    setAdminError(null);
    setShowForceExit(false);
    setRetryCount(0);
    
    // Force remove all admin-related classes and overlays
    document.body.classList.remove('admin-accessing', 'content-layer');
    document.body.classList.add('admin-emergency-exit');
    document.body.removeAttribute('aria-busy');
    document.body.removeAttribute('aria-live');
    
    // Remove emergency class after cleanup
    setTimeout(() => {
      document.body.classList.remove('admin-emergency-exit');
    }, 1000);
    
    // Navigate to safe route
    navigate('/');
  };

  return (
<div className="min-h-screen bg-background content-layer">
      {/* Admin Loading Progress Bar */}
{isAdminLoading && (
        <>
          <div className="admin-progress-bar" role="progressbar" aria-valuenow={adminLoadProgress} aria-valuemin="0" aria-valuemax="100">
            <div 
              className="admin-progress-fill" 
              style={{ width: `${adminLoadProgress}%` }}
            />
          </div>
          <div className="admin-loading-overlay" role="dialog" aria-modal="true" aria-labelledby="admin-loading-title">
            <div className="admin-loading-modal">
              <div className="admin-loading-spinner" aria-hidden="true" />
              <p id="admin-loading-title" className="admin-loading-text" aria-live="polite">
                {adminLoadProgress < 20 ? 'Initializing dashboard...' : 
                 adminLoadProgress < 40 ? 'Checking browser compatibility...' :
                 adminLoadProgress < 60 ? 'Loading admin content...' :
                 adminLoadProgress < 80 ? 'Securing connection...' :
                 adminLoadProgress < 100 ? 'Finalizing access...' : 'Complete!'}
              </p>
              
              {/* Browser compatibility info */}
              {browserInfo && (
                <div className="text-xs text-gray-500 mt-2" aria-live="polite">
                  {browserInfo.name} {browserInfo.version} {browserInfo.mobile ? '(Mobile)' : '(Desktop)'}
                </div>
              )}
              
              {adminError && (
                <div className="admin-error-message" role="alert" aria-live="assertive">
                  <div className="flex items-start space-x-2">
                    <ApperIcon name="AlertTriangle" className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-red-600 text-sm font-medium">{adminError}</p>
                      {retryCount > 0 && (
                        <p className="text-gray-500 text-xs mt-1">
                          Retry attempt {retryCount} of 3...
                        </p>
                      )}
                      
                      {/* Browser-specific help */}
                      {browserInfo?.name === 'Safari' && adminError.includes('timeout') && (
                        <p className="text-blue-600 text-xs mt-1">
                          Safari may take longer to load. Consider using Chrome or Firefox for better performance.
                        </p>
                      )}
                      
                      {browserInfo?.mobile && adminError.includes('timeout') && (
                        <p className="text-blue-600 text-xs mt-1">
                          Mobile connections may be slower. Please ensure you have a stable internet connection.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {showForceExit && (
                <button
                  onClick={handleForceExit}
                  className="admin-force-exit-btn focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  title="Emergency exit from loading state"
                  aria-label="Force exit from admin loading state"
                  tabIndex={0}
                >
                  <ApperIcon name="X" className="w-3 h-3 mr-1 inline" />
                  Force Exit
                </button>
              )}
              
              {/* Accessibility instructions */}
              <div className="sr-only" aria-live="polite">
                Admin dashboard is loading. Progress: {adminLoadProgress}%. 
                {adminError ? `Error occurred: ${adminError}` : ''}
                {showForceExit ? 'Press Force Exit button if loading fails to complete.' : ''}
              </div>
            </div>
          </div>
        </>
      )}
        <Header />
        
<main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/category" element={<Category />} />
            <Route path="/deals" element={<Category />} />
            
            {/* Admin Dashboard Routes */}
<Route path="/admin" element={
              <div className="admin-dashboard fade-in-admin">
                <AdminDashboard />
              </div>
            }>
              <Route index element={<ManageProducts />} />
              <Route path="products" element={<ManageProducts />} />
              <Route path="products/manage" element={<ManageProducts />} />
              <Route path="products/add" element={<AddProduct />} />
              <Route path="orders" element={<OrderManagement />} />
              <Route path="customers" element={<div className="p-6">Customer Management - Coming Soon</div>} />
              <Route path="users" element={<UserManagement />} />
              <Route path="marketing" element={<div className="p-6">Marketing Tools - Coming Soon</div>} />
              <Route path="reports" element={<ReportsAnalytics />} />
              <Route path="settings" element={<div className="p-6">System Settings - Coming Soon</div>} />
            </Route>
            
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
                  <a
                    href="/admin-dashboard"
                    className="admin-access-link"
                    data-role="admin-entry"
                    aria-label="Access admin dashboard"
onClick={(e) => {
                      e.preventDefault();
                      handleAdminAccess();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleAdminAccess();
                      }
                    }}
                    aria-label="Access Admin Dashboard"
                    tabIndex={0}
                  >
                    <button
                      disabled={isAdminLoading}
                      className="text-xs text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50 flex items-center space-x-1"
                      title="Administrator Access"
                    >
                      {isAdminLoading && (
                        <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                      )}
                      <span>Admin Access</span>
                    </button>
                  </a>
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
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;