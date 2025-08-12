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

const ProductCard = ({ product, mode = 'default', className, ...props }) => {
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
<div className="relative aspect-square overflow-hidden rounded-t-xl bg-gray-100 group/image">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
          )}
          
          <img
            src={product.images?.[0] || "/api/placeholder/300/300"}
            alt={product.title}
            className={cn(
              "w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group/image:hover:scale-125 cursor-zoom-in",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setImageLoaded(true)}
          />
          
          {/* Zoom overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group/image:hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center">
            <ApperIcon 
              name="ZoomIn" 
              className="w-8 h-8 text-white opacity-0 group/image:hover:opacity-100 transition-opacity duration-300" 
            />
          </div>

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
              <span className="word-spacing-loose" style={{ wordSpacing: '0.08em', letterSpacing: '0.015em' }}>Quick View</span>
            </Button>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4">
          {/* Product Title */}
<h3 className="font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors duration-200 product-text-field enhanced-product-title" style={{ wordSpacing: '0.1em', letterSpacing: '0.025em', lineHeight: '1.4' }}>
            {product.title}
          </h3>

{/* Variants */}
{product.variants && product.variants.length > 0 && mode !== 'suggestion' && (
            <div className="mb-3">
              <select
                value={selectedVariant?.name || ''}
                onChange={(e) => {
                  const variant = product.variants.find(v => v.name === e.target.value);
                  if (variant) handleVariantSelect(variant, e);
                }}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:border-primary-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="">Select Size</option>
                {product.variants.map((variant, index) => (
                  <option key={index} value={variant.name}>
                    {variant.name} - {variant.price ? `Rs ${variant.price}` : 'Same Price'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Price */}
          <div className="mb-3">
            <PriceDisplay 
              price={currentPrice}
              oldPrice={currentOldPrice}
              size={mode === 'suggestion' ? 'xs' : 'sm'}
            />
          </div>

          {/* Stock Status - only show for default mode */}
          {mode !== 'suggestion' && (
            <div className="mb-4">
              <StockIndicator stock={product.stock} size="xs" />
            </div>
          )}

          {/* Add to Cart Button */}
          {mode === 'suggestion' ? (
            <Button
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              variant="outline"
              size="sm"
              className="w-full h-8 p-0 hover:bg-primary-50 hover:border-primary-300 group"
            >
              {product.stock <= 0 ? (
                <ApperIcon name="AlertCircle" size={14} className="text-gray-400" />
              ) : (
                <ApperIcon name="Plus" size={14} className="text-primary-600 group-hover:text-primary-700 transition-colors" />
              )}
            </Button>
          ) : (
            <Button
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className="w-full"
              size="sm"
            >
              {product.stock <= 0 ? (
                <>
                  <ApperIcon name="AlertCircle" className="w-4 h-4 mr-2" />
                  <span className="word-spacing-relaxed" style={{ wordSpacing: '0.08em', letterSpacing: '0.015em' }}>Out of Stock</span>
                </>
              ) : (
                <>
                  <ApperIcon name="ShoppingCart" className="w-4 h-4 mr-2" />
                  <span className="word-spacing-loose" style={{ wordSpacing: '0.08em', letterSpacing: '0.015em' }}>Add to Cart</span>
                </>
              )}
            </Button>
          )}
        </div>
      </Link>
    </Card>
  );
};

export default ProductCard;