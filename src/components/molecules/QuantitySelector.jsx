import React from "react";
import ApperIcon from "@/components/ApperIcon";
import Button from "@/components/atoms/Button";
import { cn } from "@/utils/cn";

const QuantitySelector = ({ 
  quantity = 1, 
  onQuantityChange, 
  min = 1, 
  max = 99,
  className,
  size = "md",
  ...props 
}) => {
  const handleIncrement = () => {
    if (quantity < max && onQuantityChange) {
      onQuantityChange(quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > min && onQuantityChange) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleInputChange = (e) => {
    const value = parseInt(e.target.value) || min;
    const clampedValue = Math.max(min, Math.min(max, value));
    if (onQuantityChange) {
      onQuantityChange(clampedValue);
    }
  };

  const sizes = {
    sm: "h-8",
    md: "h-10",
    lg: "h-12",
  };

  const buttonSizes = {
    sm: "sm",
    md: "md",
    lg: "lg",
  };

  return (
    <div className={cn("flex items-center border border-gray-300 rounded-lg bg-white", className)} {...props}>
      <Button
        variant="ghost"
        size={buttonSizes[size]}
        onClick={handleDecrement}
        disabled={quantity <= min}
        className="border-0 rounded-r-none hover:bg-gray-50"
      >
        <ApperIcon name="Minus" className="h-4 w-4" />
      </Button>
      
      <input
        type="number"
        min={min}
        max={max}
        value={quantity}
        onChange={handleInputChange}
        className={cn(
          "w-16 text-center border-0 border-l border-r border-gray-300 focus:outline-none focus:ring-0 bg-white text-gray-900",
          sizes[size]
        )}
      />
      
      <Button
        variant="ghost"
        size={buttonSizes[size]}
        onClick={handleIncrement}
        disabled={quantity >= max}
        className="border-0 rounded-l-none hover:bg-gray-50"
      >
        <ApperIcon name="Plus" className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default QuantitySelector;