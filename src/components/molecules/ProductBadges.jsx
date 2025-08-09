import React from "react";
import Badge from "@/components/atoms/Badge";
import { cn } from "@/utils/cn";

const ProductBadges = ({ 
  badges = [], 
  className,
  maxDisplay = 3,
  ...props 
}) => {
  const badgeVariants = {
    "ORGANIC": "organic",
    "HALAL": "halal",
    "FRESH": "fresh",
    "DISCOUNT": "discount",
    "LIMITED": "limited",
    "VEGAN": "vegan",
    "PREMIUM": "premium",
    "BESTSELLER": "bestseller",
    "GLUTEN FREE": "fresh",
    "IMPORTED": "premium",
    "DESI": "halal",
  };

  const displayBadges = badges.slice(0, maxDisplay);
  const remainingCount = badges.length - maxDisplay;

if (badges.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-2", className)} {...props}>
      {displayBadges.map((badge, index) => (
        <Badge
          key={index}
          variant={badgeVariants[badge.toUpperCase()] || "default"}
          size="xs"
        >
          {badge}
        </Badge>
      ))}
      
      {remainingCount > 0 && (
        <Badge variant="default" size="xs">
          +{remainingCount}
        </Badge>
      )}
    </div>
  );
};

export default ProductBadges;