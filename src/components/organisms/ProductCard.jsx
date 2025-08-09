import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Card from "@/components/atoms/Card";
import Button from "@/components/atoms/Button";
import ApperIcon from "@/components/ApperIcon";
import PriceDisplay from "@/components/molecules/PriceDisplay";
import StockIndicator from "@/components/molecules/StockIndicator";
import ProductBadges from "@/components/molecules/ProductBadges";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/utils/cn";

const ProductCard = ({ product, className, ...props }) => {
  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0] || null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

const handleAddToCart = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    
    // Defensive checks to prevent instanceof errors
    if (!product?.Id) {
      showToast?.('Invalid product data. Please try again.', 'error');
      return;
    }

    if (typeof addToCart !== 'function') {
      showToast?.('Cart service unavailable. Please refresh the page.', 'error');
      return;
    }
    
    const cartItem = {
      productId: product.Id,
      quantity: 1,
      variant: selectedVariant || null,
      price: selectedVariant?.price ?? product.price ?? 0
    };

    try {
      addToCart(cartItem);
      showToast?.(`${product.title || 'Product'} added to cart!`, "success");
    } catch (error) {
      console.error('Product add to cart error:', error);
      showToast?.('Failed to add product to cart. Please try again.', 'error');
    }
  };

  const handleVariantSelect = (variant, e) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedVariant(variant);
  };

  const currentPrice = selectedVariant ? selectedVariant.price : product.price;
  const currentOldPrice = selectedVariant ? selectedVariant.oldPrice : product.oldPrice;

  return (
    <Card hover className={cn("product-card group cursor-pointer", className)} {...props}>
      <Link to={`/product/${product.Id}`} className="block">
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden rounded-t-xl bg-gray-100">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
          )}
          
          <img
            src={product.images?.[0] || "/api/placeholder/300/300"}
            alt={product.title}
            className={cn(
              "w-full h-full object-cover transition-all duration-300 group-hover:scale-105",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setImageLoaded(true)}
          />

          {/* Badges */}
          {product.badges && product.badges.length > 0 && (
            <div className="absolute top-2 left-2">
              <ProductBadges badges={product.badges} maxDisplay={2} />
            </div>
          )}

          {/* Stock Indicator */}
          <div className="absolute top-2 right-2">
            <StockIndicator stock={product.stock} showText={false} size="xs" />
          </div>

          {/* Quick Actions Overlay */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate(`/product/${product.Id}`);
              }}
              variant="secondary"
              size="sm"
              className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300"
            >
              <ApperIcon name="Eye" className="w-4 h-4 mr-2" />
              Quick View
            </Button>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4">
          {/* Product Title */}
          <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors duration-200">
            {product.title}
          </h3>

{/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-2">
                {product.variants.slice(0, 3).map((variant, index) => (
                  <button
                    key={index}
                    onClick={(e) => handleVariantSelect(variant, e)}
                    className={cn(
                      "px-2 py-1 text-xs rounded-md border transition-colors duration-200",
                      selectedVariant?.name === variant.name
                        ? "border-primary-500 bg-primary-50 text-primary-700"
                        : "border-gray-200 bg-white text-gray-600 hover:border-primary-300"
                    )}
                  >
                    {variant.name}
                  </button>
                ))}
                {product.variants.length > 3 && (
                  <span className="px-2 py-1 text-xs text-gray-500">
                    +{product.variants.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}
{/* Price */}
          <div className="mb-4">
            <PriceDisplay 
              price={currentPrice}
              oldPrice={currentOldPrice}
              oldPrice={currentOldPrice}
              size="sm"
            />
          </div>

          {/* Stock Status */}
          <div className="mb-4">
            <StockIndicator stock={product.stock} size="xs" />
          </div>

          {/* Add to Cart Button */}
          <Button
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            className="w-full"
            size="sm"
          >
            {product.stock <= 0 ? (
              <>
                <ApperIcon name="AlertCircle" className="w-4 h-4 mr-2" />
                Out of Stock
              </>
            ) : (
              <>
                <ApperIcon name="ShoppingCart" className="w-4 h-4 mr-2" />
                Add to Cart
              </>
            )}
          </Button>
        </div>
      </Link>
    </Card>
  );
};

export default ProductCard;