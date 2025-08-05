import React from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ApperIcon from "@/components/ApperIcon";
import Button from "@/components/atoms/Button";
import QuantitySelector from "@/components/molecules/QuantitySelector";
import PriceDisplay from "@/components/molecules/PriceDisplay";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/utils/currency";
import { cn } from "@/utils/cn";

const CartDrawer = ({ isOpen, onClose }) => {
  const { 
    cartItems, 
    getTotalPrice, 
    getTotalItems, 
    updateQuantity, 
    removeFromCart 
  } = useCart();

  const totalPrice = getTotalPrice();
  const totalItems = getTotalItems();

  const overlayVariants = {
    closed: { opacity: 0 },
    open: { opacity: 1 }
  };

  const drawerVariants = {
    closed: { x: "100%" },
    open: { x: 0 }
  };

  const itemVariants = {
    closed: { opacity: 0, x: 20 },
    open: { opacity: 1, x: 0 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            variants={overlayVariants}
            initial="closed"
            animate="open"
            exit="closed"
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Drawer */}
          <motion.div
            variants={drawerVariants}
            initial="closed"
            animate="open"
            exit="closed"
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-display font-bold text-gray-900">
                  Shopping Cart
                </h2>
                <p className="text-sm text-gray-600">
                  {totalItems} {totalItems === 1 ? 'item' : 'items'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-2"
              >
                <ApperIcon name="X" className="w-6 h-6" />
              </Button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <ApperIcon name="ShoppingCart" className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Your cart is empty
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Add some products to get started
                  </p>
                  <Button onClick={onClose}>
                    Continue Shopping
                  </Button>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {cartItems.map((item, index) => (
                    <motion.div
                      key={`${item.productId}-${item.variant?.name || 'default'}`}
                      variants={itemVariants}
                      initial="closed"
                      animate="open"
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl"
                    >
                      {/* Product Image */}
                      <div className="w-16 h-16 bg-white rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={item.product?.images?.[0] || "/api/placeholder/64/64"}
                          alt={item.product?.title || "Product"}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">
                          {item.product?.title || "Product"}
                        </h4>
                        
                        {item.variant && (
                          <p className="text-sm text-gray-600">
                            {item.variant.name}
                          </p>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          <PriceDisplay 
                            price={item.price}
                            size="sm"
                            showDiscount={false}
                          />
                          
                          <div className="flex items-center space-x-2">
                            <QuantitySelector
                              quantity={item.quantity}
                              onQuantityChange={(newQuantity) => 
                                updateQuantity(item.productId, item.variant, newQuantity)
                              }
                              size="sm"
                              min={1}
                              max={item.product?.stock || 99}
                            />
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(item.productId, item.variant)}
                              className="p-1 text-error hover:bg-error/10"
                            >
                              <ApperIcon name="Trash2" className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cartItems.length > 0 && (
              <div className="border-t border-gray-200 p-6 space-y-4">
                {/* Subtotal */}
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium text-gray-900">
                    Subtotal
                  </span>
                  <span className="text-xl font-bold price-highlight">
                    {formatPrice(totalPrice)}
                  </span>
                </div>

                {/* Shipping Info */}
                <p className="text-sm text-gray-600 text-center">
                  Shipping and taxes calculated at checkout
                </p>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Link to="/cart" onClick={onClose}>
                    <Button variant="outline" className="w-full">
                      <ApperIcon name="Eye" className="w-4 h-4 mr-2" />
                      View Cart
                    </Button>
                  </Link>
                  
                  <Button className="w-full" size="lg">
                    <ApperIcon name="CreditCard" className="w-5 h-5 mr-2" />
                    Checkout Now
                  </Button>
                </div>

                {/* Continue Shopping */}
                <button
                  onClick={onClose}
                  className="w-full text-center text-primary-600 hover:text-primary-700 font-medium py-2 transition-colors duration-200"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;