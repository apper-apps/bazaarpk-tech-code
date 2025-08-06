import React, { useState } from "react";
import { motion } from "framer-motion";
import Card from "@/components/atoms/Card";
import Button from "@/components/atoms/Button";
import ApperIcon from "@/components/ApperIcon";
import PriceDisplay from "@/components/molecules/PriceDisplay";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/utils/cn";
import { formatPrice, calculateSavings } from "@/utils/currency";

const RecipeBundleCard = ({ bundle, className, ...props }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { addToCart } = useCart();
  const showToast = useToast();

  const handleAddBundleToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsLoading(true);
    
    try {
      // Add each product in the bundle to cart
      for (const item of bundle.products) {
        const cartItem = {
          productId: item.product.Id,
          quantity: item.quantity,
          variant: item.variant || null,
          price: item.product.price,
          bundleId: bundle.Id,
          bundleName: bundle.name
        };
        
        await addToCart(cartItem);
      }
      
      showToast(`${bundle.name} bundle added to cart!`, 'success');
    } catch (error) {
      showToast('Failed to add bundle to cart. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const totalOriginalPrice = bundle.products.reduce(
    (sum, item) => sum + (item.product.oldPrice || item.product.price) * item.quantity, 
    0
  );
  
  const totalBundlePrice = bundle.products.reduce(
    (sum, item) => sum + item.product.price * item.quantity, 
    0
  );
  
  const bundleSavings = calculateSavings(totalOriginalPrice, totalBundlePrice);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={cn("group", className)}
      {...props}
    >
      <Card className="overflow-hidden h-full flex flex-col">
        {/* Recipe Image & Header */}
        <div className="relative">
          <div className="aspect-[4/3] bg-gradient-to-br from-primary-100 to-primary-200 p-6 flex items-center justify-center">
            <img
              src={bundle.image}
              alt={bundle.name}
              className="w-full h-full object-cover rounded-lg"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="hidden w-full h-full items-center justify-center bg-primary-50 rounded-lg">
              <ApperIcon name="ChefHat" className="w-16 h-16 text-primary-400" />
            </div>
          </div>
          
          {/* Bundle Badge */}
          <div className="absolute top-3 left-3 bg-gradient-to-r from-accent-500 to-accent-600 text-white px-3 py-1 rounded-full text-sm font-medium">
            Complete Recipe
          </div>
          
          {/* Savings Badge */}
          {bundleSavings > 0 && (
            <div className="absolute top-3 right-3 bg-gradient-to-r from-error to-error/90 text-white px-3 py-1 rounded-full text-sm font-medium">
              Save {formatPrice(bundleSavings)}
            </div>
          )}
        </div>

        {/* Recipe Info */}
        <div className="p-4 flex-1 flex flex-col">
          <div className="mb-4">
            <h3 className="font-display font-bold text-lg text-gray-900 mb-2 line-clamp-2">
              {bundle.name}
            </h3>
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {bundle.description}
            </p>
            
            {/* Recipe Stats */}
            <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
              <div className="flex items-center gap-1">
                <ApperIcon name="Clock" className="w-3 h-3" />
                <span>{bundle.cookTime}</span>
              </div>
              <div className="flex items-center gap-1">
                <ApperIcon name="Users" className="w-3 h-3" />
                <span>{bundle.servings} servings</span>
              </div>
              <div className="flex items-center gap-1">
                <ApperIcon name="ChefHat" className="w-3 h-3" />
                <span>{bundle.difficulty}</span>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-3 text-sm">
              Included Ingredients ({bundle.products.length} items)
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {bundle.products.slice(0, 4).map((item, index) => (
                <div key={item.product.Id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-8 h-8 object-cover rounded"
                    onError={(e) => {
                      e.target.src = `https://images.unsplash.com/photo-1506617564039-2f3b650b7010?w=100&h=100&fit=crop`;
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.quantity} {item.unit || 'pc'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            {bundle.products.length > 4 && (
              <div className="mt-2 text-center">
                <span className="text-xs text-gray-500">
                  +{bundle.products.length - 4} more ingredients
                </span>
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="mt-auto">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-primary-600">
                    {formatPrice(totalBundlePrice)}
                  </span>
                  {bundleSavings > 0 && (
                    <span className="text-sm text-gray-500 line-through">
                      {formatPrice(totalOriginalPrice)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {formatPrice(totalBundlePrice / bundle.servings)} per serving
                </p>
              </div>
            </div>

            {/* Add to Cart Button */}
            <Button
              onClick={handleAddBundleToCart}
              disabled={isLoading}
              className="w-full"
              size="sm"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Adding...
                </>
              ) : (
                <>
                  <ApperIcon name="ShoppingCart" className="w-4 h-4 mr-2" />
                  Get Complete Bundle
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default RecipeBundleCard;