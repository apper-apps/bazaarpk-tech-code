import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import ApperIcon from "@/components/ApperIcon";
import Button from "@/components/atoms/Button";
import Card from "@/components/atoms/Card";
import QuantitySelector from "@/components/molecules/QuantitySelector";
import PriceDisplay from "@/components/molecules/PriceDisplay";
import Empty from "@/components/ui/Empty";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/useToast";
import { formatPrice } from "@/utils/currency";

const Cart = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { 
    cartItems, 
    getTotalPrice, 
    getTotalItems, 
    updateQuantity, 
    removeFromCart,
    clearCart 
  } = useCart();

  const totalPrice = getTotalPrice();
  const totalItems = getTotalItems();
  const shippingCost = totalPrice >= 1000 ? 0 : 150;
  const finalTotal = totalPrice + shippingCost;

  const handleUpdateQuantity = (productId, variant, newQuantity) => {
    updateQuantity(productId, variant, newQuantity);
    showToast("Cart updated", "success");
  };

  const handleRemoveItem = (productId, variant) => {
    removeFromCart(productId, variant);
    showToast("Item removed from cart", "success");
  };

  const handleClearCart = () => {
    clearCart();
    showToast("Cart cleared", "success");
  };

  const handleCheckout = () => {
    showToast("Redirecting to checkout...", "info");
    // In a real app, this would navigate to checkout
    setTimeout(() => {
      showToast("Checkout feature coming soon!", "info");
    }, 2000);
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Empty
            title="Your cart is empty"
            message="Looks like you haven't added any items to your cart yet. Start shopping to fill it up!"
            actionText="Start Shopping"
            onAction={() => navigate("/")}
            icon="ShoppingCart"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900">
              Shopping Cart
            </h1>
            <p className="text-gray-600 mt-1">
              {totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>
          
          <Button
            variant="outline"
            onClick={handleClearCart}
            className="text-error border-error hover:bg-error hover:text-white"
          >
            <ApperIcon name="Trash2" className="w-4 h-4 mr-2" />
            Clear Cart
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item, index) => (
              <motion.div
                key={`${item.productId}-${item.variant?.name || 'default'}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6">
                  <div className="flex items-start space-x-4">
                    {/* Product Image */}
                    <Link
                      to={`/product/${item.productId}`}
                      className="flex-shrink-0"
                    >
                      <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden hover:opacity-80 transition-opacity duration-200">
                        <img
                          src={item.product?.images?.[0] || "/api/placeholder/96/96"}
                          alt={item.product?.title || "Product"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </Link>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/product/${item.productId}`}
                        className="block hover:text-primary-600 transition-colors duration-200"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {item.product?.title || "Product"}
                        </h3>
                      </Link>
                      
                      {item.variant && (
                        <p className="text-gray-600 mb-2">
                          Variant: {item.variant.name}
                        </p>
                      )}

                      <div className="flex items-center space-x-4 mb-4">
                        <PriceDisplay 
                          price={item.price}
                          size="md"
                          showDiscount={false}
                        />
                        
                        {item.product?.oldPrice && item.product.oldPrice > item.price && (
                          <span className="text-sm text-gray-500 line-through">
                            {formatPrice(item.product.oldPrice)}
                          </span>
                        )}
                      </div>

                      {/* Quantity and Actions */}
                      <div className="flex items-center justify-between">
                        <QuantitySelector
                          quantity={item.quantity}
                          onQuantityChange={(newQuantity) => 
                            handleUpdateQuantity(item.productId, item.variant, newQuantity)
                          }
                          min={1}
                          max={item.product?.stock || 99}
                          size="md"
                        />
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.productId, item.variant)}
                          className="text-error hover:bg-error/10"
                        >
                          <ApperIcon name="Trash2" className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </div>

                    {/* Item Total */}
                    <div className="text-right">
                      <div className="text-lg font-bold price-highlight">
                        {formatPrice(item.price * item.quantity)}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <h2 className="text-xl font-display font-bold text-gray-900 mb-6">
                Order Summary
              </h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal ({totalItems} items)</span>
                  <span className="font-medium">{formatPrice(totalPrice)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">
                    {shippingCost === 0 ? (
                      <span className="text-green-600">Free</span>
                    ) : (
                      formatPrice(shippingCost)
                    )}
                  </span>
                </div>
                
                {totalPrice < 1000 && (
                  <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                    <ApperIcon name="Info" className="w-4 h-4 inline mr-1" />
                    Add {formatPrice(1000 - totalPrice)} more for free shipping
                  </div>
                )}
                
                <hr className="border-gray-200" />
                
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="price-highlight">{formatPrice(finalTotal)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleCheckout}
                  size="lg"
                  className="w-full"
                >
                  <ApperIcon name="CreditCard" className="w-5 h-5 mr-2" />
                  Proceed to Checkout
                </Button>
                
                <Link to="/">
                  <Button variant="outline" className="w-full">
                    <ApperIcon name="ArrowLeft" className="w-4 h-4 mr-2" />
                    Continue Shopping
                  </Button>
                </Link>
              </div>

              {/* Security Icons */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-center space-x-4 text-gray-500">
                  <div className="flex items-center space-x-1">
                    <ApperIcon name="Shield" className="w-4 h-4" />
                    <span className="text-xs">Secure</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <ApperIcon name="Lock" className="w-4 h-4" />
                    <span className="text-xs">Encrypted</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <ApperIcon name="CreditCard" className="w-4 h-4" />
                    <span className="text-xs">Safe Payment</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;