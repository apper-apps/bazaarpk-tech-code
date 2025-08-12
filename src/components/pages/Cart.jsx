import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/useToast";
import ApperIcon from "@/components/ApperIcon";
import QuantitySelector from "@/components/molecules/QuantitySelector";
import PriceDisplay from "@/components/molecules/PriceDisplay";
import Empty from "@/components/ui/Empty";
import Button from "@/components/atoms/Button";
import Card from "@/components/atoms/Card";
import ProductSuggestionsCarousel from "@/components/organisms/ProductSuggestionsCarousel";
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
  const [giftWrapping, setGiftWrapping] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [estimatedDelivery, setEstimatedDelivery] = useState('');

const totalPrice = getTotalPrice();
  const totalItems = getTotalItems();
  const shippingCost = totalPrice >= 1000 ? 0 : 150;
  const giftWrappingCost = giftWrapping ? 50 : 0;
  const finalTotal = totalPrice + shippingCost + giftWrappingCost - promoDiscount;
  const freeShippingProgress = Math.min((totalPrice / 1000) * 100, 100);

  // Set estimated delivery date
  useEffect(() => {
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + (shippingCost === 0 ? 2 : 5));
    setEstimatedDelivery(deliveryDate.toLocaleDateString('en-PK', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }));
  }, [shippingCost]);

  const handlePromoCode = () => {
    if (promoCode.toLowerCase() === 'save10') {
      setPromoDiscount(totalPrice * 0.1);
      showToast.success('Promo code applied! 10% discount');
    } else if (promoCode.toLowerCase() === 'welcome50') {
      setPromoDiscount(50);
      showToast.success('Welcome discount applied! Rs 50 off');
    } else if (promoCode.trim()) {
      showToast.error('Invalid promo code');
    }
  };
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
<Card className="p-6 border-l-4 border-l-primary-200 hover:border-l-primary-400 transition-all duration-300">
                  <div className="flex items-start space-x-4">
                    {/* Enhanced Product Image with Zoom */}
                    <Link
                      to={`/product/${item.productId}`}
                      className="flex-shrink-0 group"
                    >
                      <div className="w-32 h-32 bg-gray-100 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 relative">
                        <img
                          src={item.product?.images?.[0] || "/api/placeholder/128/128"}
                          alt={item.product?.title || "Product"}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center">
                          <ApperIcon name="Eye" className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                      </div>
                    </Link>

                    {/* Enhanced Product Details */}
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/product/${item.productId}`}
                        className="block hover:text-primary-600 transition-colors duration-200"
                      >
                        <h3 className="text-xl font-semibold text-gray-900 mb-2 leading-tight">
                          {item.product?.title || "Product"}
                        </h3>
                      </Link>
                      
                      {item.variant && (
                        <div className="mb-3">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-50 text-primary-700 border border-primary-200">
                            <ApperIcon name="Package" className="w-4 h-4 mr-1" />
                            {item.variant.name}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center space-x-4 mb-4">
                        <PriceDisplay 
                          price={item.price}
                          oldPrice={item.product?.oldPrice}
                          size="lg"
                          showDiscount={true}
                        />
                        
                        {item.product?.oldPrice && item.product.oldPrice > item.price && (
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-500 line-through">
                              {formatPrice(item.product.oldPrice)}
                            </span>
                            <span className="text-xs text-green-600 font-medium">
                              Save {formatPrice(item.product.oldPrice - item.price)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Enhanced Quantity and Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <QuantitySelector
                            quantity={item.quantity}
                            onQuantityChange={(newQuantity) => 
                              handleUpdateQuantity(item.productId, item.variant, newQuantity)
                            }
                            min={1}
                            max={item.product?.stock || 99}
                            size="lg"
                            className="border-2 border-gray-200 hover:border-primary-300"
                          />
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(item.productId, item.variant)}
                            className="text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
                          >
                            <ApperIcon name="Trash2" className="w-4 h-4 mr-2" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Item Total */}
                    <div className="text-right">
                      <div className="text-2xl font-bold price-highlight mb-1">
                        {formatPrice(item.price * item.quantity)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatPrice(item.price)} × {item.quantity}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Order Summary */}
<div className="lg:col-span-1">
            <Card className="p-6 sticky top-24 border-t-4 border-t-primary-500">
              <h2 className="text-2xl font-display font-bold text-gray-900 mb-6 flex items-center">
                <ApperIcon name="ShoppingBag" className="w-6 h-6 mr-2 text-primary-600" />
                Order Summary
              </h2>

              {/* Free Shipping Progress */}
              {totalPrice < 1000 && (
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-primary-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-700">Free Shipping Progress</span>
                    <span className="text-xs text-blue-600">{Math.round(freeShippingProgress)}%</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-primary-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${freeShippingProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-blue-600">
                    Add {formatPrice(1000 - totalPrice)} more for FREE shipping!
                  </p>
                </div>
              )}

              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal ({totalItems} items)</span>
                  <span className="font-medium">{formatPrice(totalPrice)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">
                    {shippingCost === 0 ? (
                      <span className="text-green-600 font-semibold">FREE</span>
                    ) : (
                      formatPrice(shippingCost)
                    )}
                  </span>
                </div>

                {/* Gift Wrapping Option */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="giftWrapping"
                      checked={giftWrapping}
                      onChange={(e) => setGiftWrapping(e.target.checked)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <label htmlFor="giftWrapping" className="text-sm text-gray-600 flex items-center">
                      <ApperIcon name="Gift" className="w-4 h-4 mr-1" />
                      Gift Wrapping
                    </label>
                  </div>
                  <span className="font-medium">{giftWrappingCost > 0 ? formatPrice(giftWrappingCost) : 'Free'}</span>
                </div>

                {/* Promo Code */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      placeholder="Enter promo code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                    />
                    <Button
                      onClick={handlePromoCode}
                      variant="outline"
                      size="sm"
                      className="px-4"
                    >
                      Apply
                    </Button>
                  </div>
                  {promoDiscount > 0 && (
                    <div className="flex justify-between text-green-600 text-sm">
                      <span>Promo Discount</span>
                      <span>-{formatPrice(promoDiscount)}</span>
                    </div>
                  )}
                </div>
                
                <hr className="border-gray-200" />
                
                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span className="price-highlight">{formatPrice(finalTotal)}</span>
                </div>
              </div>

              {/* Estimated Delivery */}
              <div className="mb-6 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <ApperIcon name="Truck" className="w-5 h-5 text-primary-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Estimated Delivery</p>
                    <p className="text-xs text-gray-600">{estimatedDelivery}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleCheckout}
                  size="lg"
                  className="w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 transform hover:scale-105 transition-all duration-200"
                >
                  <ApperIcon name="CreditCard" className="w-5 h-5 mr-2" />
                  Proceed to Checkout • {formatPrice(finalTotal)}
                </Button>
                
                <Link to="/">
                  <Button variant="outline" className="w-full hover:bg-primary-50">
                    <ApperIcon name="ArrowLeft" className="w-4 h-4 mr-2" />
                    Continue Shopping
                  </Button>
                </Link>
              </div>

              {/* Enhanced Security Icons */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="flex flex-col items-center space-y-1">
                    <ApperIcon name="Shield" className="w-6 h-6 text-green-600" />
                    <span className="text-xs text-gray-600 font-medium">256-bit SSL</span>
                  </div>
                  <div className="flex flex-col items-center space-y-1">
                    <ApperIcon name="Lock" className="w-6 h-6 text-blue-600" />
                    <span className="text-xs text-gray-600 font-medium">Secure Payments</span>
                  </div>
                  <div className="flex flex-col items-center space-y-1">
                    <ApperIcon name="Award" className="w-6 h-6 text-purple-600" />
                    <span className="text-xs text-gray-600 font-medium">Trusted Store</span>
                  </div>
                </div>
                
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500">
                    Your payment information is processed securely. We do not store credit card details.
                  </p>
                </div>
              </div>
            </Card>
          </div>
</div>

        {/* Product Suggestions Carousel */}
        <ProductSuggestionsCarousel 
          cartItems={cartItems}
          className="mt-8"
        />
      </div>
    </div>
  );
};

export default Cart;