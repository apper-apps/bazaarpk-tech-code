import '@/index.css';
import React, { useCallback, useEffect, useRef, useState } from "react";
import { BrowserRouter, Route, Routes, useNavigate, Link } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import ApperIcon from "@/components/ApperIcon";
import Header from "@/components/organisms/Header";
import CartDrawer from "@/components/organisms/CartDrawer";
import ErrorComponent, { Error } from "@/components/ui/Error";
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
// Browser detection at module level to avoid re-computation
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

  return browserInfo;
};

// Static browser info - computed once
const BROWSER_INFO = detectBrowser();

function AppContent() {
  const navigate = useNavigate();
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState({});
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [adminLoadProgress, setAdminLoadProgress] = useState(0);
  const [adminError, setAdminError] = useState(null);
  const [showForceExit, setShowForceExit] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Ref to track component mount status
  const isMountedRef = useRef(true);
  // Initialize performance monitoring only once
useEffect(() => {
    console.log('🔍 Browser Compatibility Check:', BROWSER_INFO);
    
    // Track compatibility issues
    if (parseInt(BROWSER_INFO.version) < 80 && BROWSER_INFO.name === 'Chrome') {
      console.warn('⚠️ Chrome version may have compatibility issues');
    }

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

    // Performance monitoring setup
    const initPerformanceMonitoring = () => {
      if ('performance' in window) {
        const navigationTiming = performance.getEntriesByType('navigation')[0];
        if (navigationTiming && isMountedRef.current) {
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
          
          if (isMountedRef.current) {
            setPerformanceMetrics(metrics);
            console.log('📊 Performance Metrics:', metrics);
            
            // Track performance in analytics
            if (typeof window !== 'undefined' && window.gtag) {
              window.gtag('event', 'page_performance', {
                page_load_time: Math.round(metrics.pageLoadTime),
                dom_content_loaded: Math.round(metrics.domContentLoaded),
                first_contentful_paint: Math.round(metrics.firstContentfulPaint),
                browser_name: BROWSER_INFO.name || 'unknown'
              });
            }
          }
        }
      }
    };

    // Initialize performance monitoring
    initPerformanceMonitoring();

    // Cleanup on component unmount
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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
    const intervalDelay = BROWSER_INFO.mobile ? 150 : 100;
    const progressInterval = setInterval(() => {
      if (cleanupRef.current || !isMountedRef.current) {
        clearInterval(progressInterval);
        return;
      }
      setAdminLoadProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, intervalDelay);

    // Browser-specific timeout (longer for mobile/slower browsers)
    const timeoutDuration = BROWSER_INFO.mobile || 
                           (BROWSER_INFO.name === 'Safari' && parseInt(BROWSER_INFO.version) < 14) ? 
                           8000 : 5000;
    
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
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;