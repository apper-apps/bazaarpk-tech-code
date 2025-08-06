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
            <Route path="/admin/add-product" element={<AddProduct />} />
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