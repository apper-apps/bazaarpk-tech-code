import '@/index.css';
import React, { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import ApperIcon from "@/components/ApperIcon";
import Header from "@/components/organisms/Header";
import CartDrawer from "@/components/organisms/CartDrawer";
import Error from "@/components/ui/Error";
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

  // Error logging setup for debugging
useEffect(() => {
    const handleAdminMaskError = (e) => {
      // Enhanced console logging for debugging
      console.group('🔴 Admin Mask Persistence Error');
      console.error('Error Details:', {
        timestamp: new Date().toISOString(),
        errorType: e.detail?.type || 'unknown',
        errorMessage: e.detail?.message || 'No message provided',
        errorStack: e.detail?.error?.stack,
        currentRoute: window.location.pathname,
        userAgent: navigator.userAgent,
        adminState: {
          isAdminRoute: window.location.pathname.includes('/admin'),
          hasAdminClass: document.body.classList.contains('admin-accessing'),
          adminElements: document.querySelectorAll('.admin-dashboard, [data-admin-content]').length
        }
      });
      
      // Log DOM state for debugging
      console.log('DOM State:', {
        overlayElements: document.querySelectorAll('.overlay-mask, .modal-backdrop, .loading-overlay').length,
        adminElements: document.querySelectorAll('.admin-dashboard, .admin-panel').length,
        zIndexIssues: Array.from(document.querySelectorAll('*')).filter(el => {
          const zIndex = parseInt(window.getComputedStyle(el).zIndex);
          return zIndex > 10000 && !el.closest('.admin-dashboard');
        }).length
      });
      console.groupEnd();
      
      // Enhanced Sentry integration with context
      if (typeof window !== 'undefined' && window.Sentry) {
        window.Sentry.withScope((scope) => {
          scope.setTag('error_category', 'admin_mask_persistence');
          scope.setContext('admin_state', {
            route: window.location.pathname,
            timestamp: new Date().toISOString(),
            adminClassesPresent: document.body.className,
            errorType: e.detail?.type
          });
          scope.setLevel('error');
          window.Sentry.captureException(e.detail?.error || new Error(e.detail?.message || 'Admin mask error'));
        });
      }
      
      // Dispatch custom event for additional error tracking
      window.dispatchEvent(new CustomEvent('admin_debug_log', {
        detail: {
          type: 'mask_error',
          severity: 'high',
          data: e.detail,
          debugInfo: {
            route: window.location.pathname,
            timestamp: Date.now(),
            retryable: e.detail?.retryable !== false
          }
        }
      }));
    };

    // Add event listener for admin mask errors
    window.addEventListener('admin_mask_error', handleAdminMaskError);

    // Cleanup on component unmount
    return () => {
      window.removeEventListener('admin_mask_error', handleAdminMaskError);
    };
  }, []);

const handleAdminAccess = async () => {
    setIsAdminLoading(true);
    setAdminLoadProgress(0);
    setAdminError(null);
    setShowForceExit(false);
    
    // Start progress animation
    const progressInterval = setInterval(() => {
      setAdminLoadProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 100);

    // Timeout detection (5 seconds)
    const timeoutId = setTimeout(() => {
      setShowForceExit(true);
      setAdminError('Loading timeout - Dashboard taking longer than expected');
    }, 5000);

    try {
      // Ensure no overlays are blocking navigation
      document.body.classList.add('admin-accessing');
      document.body.classList.add('content-layer');
      
      // Simulate background loading preparation
      setAdminLoadProgress(25);
      await new Promise(resolve => setTimeout(resolve, 200));
      
      setAdminLoadProgress(50);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Navigate to admin dashboard
      setAdminLoadProgress(75);
      navigate('/admin');
      
      // Complete loading with smooth transition
      setAdminLoadProgress(100);
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Clear states
      clearInterval(progressInterval);
      clearTimeout(timeoutId);
      
    } catch (error) {
      clearInterval(progressInterval);
      clearTimeout(timeoutId);
      console.error('Admin access error:', error);
      setAdminError(error.message || 'Failed to access admin dashboard');
      
      // Implement exponential backoff retry
      const retryWithBackoff = async (attempt) => {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s, 8s
        setTimeout(async () => {
          if (attempt < 3) {
            setRetryCount(prev => prev + 1);
            await handleAdminAccess();
          }
        }, delay);
      };
      
      if (retryCount < 3) {
        retryWithBackoff(retryCount);
      }
      
    } finally {
      setTimeout(() => {
        setIsAdminLoading(false);
        setAdminLoadProgress(0);
        document.body.classList.remove('admin-accessing');
        document.body.classList.remove('content-layer');
        clearInterval(progressInterval);
        clearTimeout(timeoutId);
      }, 500);
    }
  };

  const handleForceExit = () => {
    setIsAdminLoading(false);
    setAdminLoadProgress(0);
    setAdminError(null);
    setShowForceExit(false);
    setRetryCount(0);
    document.body.classList.remove('admin-accessing', 'content-layer', 'admin-dashboard');
    
    // Force navigation back to home
    navigate('/');
  };
  return (
<div className="min-h-screen bg-background content-layer">
      {/* Admin Loading Progress Bar */}
      {isAdminLoading && (
        <>
          <div className="admin-progress-bar">
            <div 
              className="admin-progress-fill" 
              style={{ width: `${adminLoadProgress}%` }}
            />
          </div>
          <div className="admin-loading-overlay">
            <div className="admin-loading-modal">
              <div className="admin-loading-spinner" />
              <p className="admin-loading-text">
                {adminLoadProgress < 25 ? 'Preparing dashboard...' : 
                 adminLoadProgress < 50 ? 'Loading admin content...' :
                 adminLoadProgress < 75 ? 'Securing connection...' :
                 adminLoadProgress < 100 ? 'Finalizing access...' : 'Complete!'}
              </p>
              {adminError && (
                <div className="admin-error-message">
                  <p className="text-red-600 text-sm">{adminError}</p>
                  {retryCount > 0 && (
                    <p className="text-gray-500 text-xs mt-1">
                      Retry attempt {retryCount} of 3...
                    </p>
                  )}
                </div>
              )}
              {showForceExit && (
                <button
                  onClick={handleForceExit}
                  className="admin-force-exit-btn"
                  title="Emergency exit from loading state"
                >
                  Force Exit
                </button>
              )}
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