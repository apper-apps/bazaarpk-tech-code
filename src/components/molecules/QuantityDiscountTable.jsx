import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";
import { formatPrice, calculateSavings } from "@/utils/currency";
import ApperIcon from "@/components/ApperIcon";

const QuantityDiscountTable = ({ 
  variants = [], 
  basePrice = 0,
  selectedTier = null,
  onTierSelect,
  className,
  ...props 
}) => {
  if (!variants || variants.length <= 1) return null;

  const calculateTierData = (variant, index) => {
    const quantity = parseInt(variant.name.split(' ')[0]) || (index + 1);
    const pricePerUnit = variant.price / quantity;
    const basePricePerUnit = basePrice;
    const savings = basePricePerUnit > pricePerUnit ? 
      (basePricePerUnit - pricePerUnit) * quantity : 0;
    const discountPercent = basePricePerUnit > 0 ? 
      Math.round(((basePricePerUnit - pricePerUnit) / basePricePerUnit) * 100) : 0;
    
    return {
      quantity,
      totalPrice: variant.price,
      pricePerUnit,
      savings,
      discountPercent,
      variant
    };
  };

  const tiers = variants.map((variant, index) => calculateTierData(variant, index))
    .sort((a, b) => a.quantity - b.quantity);

  const handleTierClick = (tier) => {
    onTierSelect?.(tier);
  };

  return (
    <div className={cn("w-full", className)} {...props}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
          <ApperIcon name="Calculator" size={20} className="mr-2 text-primary-600" />
          Quantity Discounts
        </h3>
        <p className="text-sm text-gray-600">
          Save more when you buy in bulk! Select a quantity tier below.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-4 gap-0 bg-gray-50 text-sm font-medium text-gray-700">
          <div className="px-4 py-3 border-r border-gray-200">Quantity</div>
          <div className="px-4 py-3 border-r border-gray-200">Price per Unit</div>
          <div className="px-4 py-3 border-r border-gray-200">Total Price</div>
          <div className="px-4 py-3">You Save</div>
        </div>

        {tiers.map((tier, index) => {
          const isSelected = selectedTier?.variant?.name === tier.variant.name;
          const isRecommended = tier.discountPercent >= 15;

          return (
            <motion.div
              key={tier.variant.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "grid grid-cols-4 gap-0 border-t border-gray-200 cursor-pointer transition-all duration-200",
                isSelected ? "bg-primary-50 border-primary-200" : "hover:bg-gray-50",
                isRecommended && !isSelected && "ring-1 ring-accent-200"
              )}
              onClick={() => handleTierClick(tier)}
            >
              {/* Quantity Column */}
              <div className="px-4 py-4 border-r border-gray-200 flex items-center">
                <div className="flex items-center space-x-2">
                  {isSelected && (
                    <ApperIcon name="Check" size={16} className="text-primary-600" />
                  )}
                  <span className={cn(
                    "font-medium",
                    isSelected ? "text-primary-900" : "text-gray-900"
                  )}>
                    {tier.quantity}x
                  </span>
                  {isRecommended && (
                    <span className="text-xs bg-accent-100 text-accent-800 px-2 py-1 rounded-full font-medium">
                      Popular
                    </span>
                  )}
                </div>
              </div>

              {/* Price per Unit Column */}
              <div className="px-4 py-4 border-r border-gray-200">
                <div className="flex flex-col">
                  <span className={cn(
                    "font-semibold",
                    isSelected ? "text-primary-700" : "text-gray-900"
                  )}>
                    {formatPrice(tier.pricePerUnit)}
                  </span>
                  {tier.discountPercent > 0 && (
                    <span className="text-xs text-green-600 font-medium">
                      {tier.discountPercent}% off per unit
                    </span>
                  )}
                </div>
              </div>

              {/* Total Price Column */}
              <div className="px-4 py-4 border-r border-gray-200">
                <span className={cn(
                  "text-lg font-bold",
                  isSelected ? "text-primary-700" : "text-gray-900"
                )}>
                  {formatPrice(tier.totalPrice)}
                </span>
              </div>

              {/* Savings Column */}
              <div className="px-4 py-4">
                {tier.savings > 0 ? (
                  <div className="flex flex-col">
                    <span className="text-green-600 font-semibold">
                      {formatPrice(tier.savings)}
                    </span>
                    <span className="text-xs text-green-500">
                      vs buying individually
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-400 text-sm">
                    Base price
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {selectedTier && selectedTier.savings > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg"
        >
          <div className="flex items-center space-x-2">
            <ApperIcon name="TrendingDown" size={20} className="text-green-600" />
            <div>
              <p className="text-green-800 font-semibold">
                Great choice! You're saving {formatPrice(selectedTier.savings)}
              </p>
              <p className="text-green-600 text-sm">
                That's {selectedTier.discountPercent}% off compared to buying individually
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default QuantityDiscountTable;