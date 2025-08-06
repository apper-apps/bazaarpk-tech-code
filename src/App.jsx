import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Header from "@/components/organisms/Header";
import CartDrawer from "@/components/organisms/CartDrawer";
import Home from "@/components/pages/Home";
import ProductDetail from "@/components/pages/ProductDetail";
import Cart from "@/components/pages/Cart";
import Category from "@/components/pages/Category";
import AddProduct from "@/components/pages/AddProduct";
import AddRecipeBundle from "@/components/pages/AddRecipeBundle";
import RecipeBundlesPage from "@/components/pages/RecipeBundlesPage";
import AdminDashboard from "@/components/pages/AdminDashboard";
import ManageProducts from "@/components/pages/ManageProducts";
function App() {
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  return (
    <BrowserRouter>
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
              <Route path="orders" element={<div className="p-6">Orders Management - Coming Soon</div>} />
              <Route path="customers" element={<div className="p-6">Customer Management - Coming Soon</div>} />
              <Route path="marketing" element={<div className="p-6">Marketing Tools - Coming Soon</div>} />
              <Route path="reports" element={<div className="p-6">Reports & Analytics - Coming Soon</div>} />
              <Route path="settings" element={<div className="p-6">System Settings - Coming Soon</div>} />
            </Route>
            
            {/* Legacy admin routes for backward compatibility */}
            <Route path="/admin/add-product" element={<AddProduct />} />
            <Route path="/admin/recipe-bundles" element={<RecipeBundlesPage />} />
            <Route path="/admin/add-recipe-bundle" element={<AddRecipeBundle />} />
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
      </div>
    </BrowserRouter>
  );
}

export default App;