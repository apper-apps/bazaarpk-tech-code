import React from "react";
import { cn } from "@/utils/cn";
import { formatPrice, calculateDiscount } from "@/utils/currency";

const PriceDisplay = ({ 
  price, 
  oldPrice, 
  className,
  size = "md",
  showDiscount = true,
  bulkSavings = 0,
  showBulkDiscount = false,
  ...props 
}) => {
  const discount = oldPrice ? calculateDiscount(oldPrice, price) : 0;

  const sizes = {
    sm: {
      current: "text-lg font-bold",
      old: "text-sm",
      discount: "text-xs"
    },
    md: {
      current: "text-xl font-bold",
      old: "text-base",
      discount: "text-sm"
    },
    lg: {
      current: "text-2xl font-bold",
      old: "text-lg",
      discount: "text-base"
    },
    xl: {
      current: "text-3xl font-bold",
      old: "text-xl",
      discount: "text-lg"
    }
  };

return (
    <div className={cn("space-y-2", className)} {...props}>
      <div className="flex items-center gap-2">
<span className={cn("price-highlight product-text-field", sizes[size].current)} style={{ wordSpacing: '0.06em', letterSpacing: '0.015em' }}>
          {formatPrice(price)}
        </span>
        
        {oldPrice && oldPrice > price && (
          <>
            <span className={cn("text-gray-500 line-through", sizes[size].old)}>
              {formatPrice(oldPrice)}
            </span>
            
            {showDiscount && discount > 0 && (
<span className={cn("text-accent-600 font-medium word-spacing-relaxed", sizes[size].discount)} style={{ wordSpacing: '0.06em', letterSpacing: '0.015em' }}>
                {discount}% OFF
              </span>
            )}
          </>
        )}
      </div>

{showBulkDiscount && bulkSavings > 0 && (
        <div className="flex items-center gap-2">
<span className="text-green-600 font-semibold text-sm word-spacing-relaxed" style={{ wordSpacing: '0.08em', letterSpacing: '0.015em' }}>
            Bulk Savings: {formatPrice(bulkSavings)}
          </span>
<span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium word-spacing-relaxed" style={{ wordSpacing: '0.06em', letterSpacing: '0.015em' }}>
            Extra Discount Applied
          </span>
        </div>
      )}
    </div>
  );
};

export default PriceDisplay;