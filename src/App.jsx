import '@/index.css';
import React, { useState } from "react";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import ApperIcon from "@/components/ApperIcon";
import Header from "@/components/organisms/Header";
import CartDrawer from "@/components/organisms/CartDrawer";
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

  const handleAdminAccess = async () => {
    setIsAdminLoading(true);
    
    try {
      // Ensure no overlays are blocking navigation
      document.body.classList.add('admin-accessing');
      
      // Navigate to admin dashboard
      navigate('/admin');
      
      // Brief delay to ensure navigation completes
      await new Promise(resolve => setTimeout(resolve, 300));
      
    } catch (error) {
      console.error('Admin access error:', error);
    } finally {
      setIsAdminLoading(false);
      document.body.classList.remove('admin-accessing');
    }
  };
  return (
    <div className="min-h-screen bg-background">
        <Header />
        
<main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/category" element={<Category />} />
            <Route path="/deals" element={<Category />} />
            
            {/* Admin Dashboard Routes */}
            <Route path="/admin" element={<AdminDashboard />}>
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-500 rounded-lg flex items-center justify-center">
                    <ApperIcon name="ShoppingBag" className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-display font-bold">BazaarPK</span>
                </div>
                <p className="text-gray-400 mt-2">Your trusted online marketplace</p>
              </div>
              
              <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
                <div className="flex space-x-6 text-sm">
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">About</a>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy</a>
                </div>
                
{/* Discreet Admin Access */}
                <div className="border-l border-gray-700 pl-6 ml-6">
                  <button
                    onClick={handleAdminAccess}
                    disabled={isAdminLoading}
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50 flex items-center space-x-1"
                    title="Administrator Access"
                  >
                    {isAdminLoading && (
                      <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                    )}
                    <span>Admin Access</span>
                  </button>
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