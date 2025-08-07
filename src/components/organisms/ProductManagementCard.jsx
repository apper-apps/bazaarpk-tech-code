import React from "react";
import { motion } from "framer-motion";
import ApperIcon from "@/components/ApperIcon";
import ProductBadges from "@/components/molecules/ProductBadges";
import PriceDisplay from "@/components/molecules/PriceDisplay";
import StockIndicator from "@/components/molecules/StockIndicator";
import Category from "@/components/pages/Category";
import Badge from "@/components/atoms/Badge";
import Button from "@/components/atoms/Button";
import { cn } from "@/utils/cn";
import { formatPrice } from "@/utils/currency";

const ProductManagementCard = ({
  product,
viewMode = 'grid',
  selected = false,
  onSelect,
  onToggleVisibility,
  onToggleFeatured,
  onEdit,
  onView,
  onDelete,
  loading = false
}) => {
  const isVisible = product.visibility === 'published';
  const isFeatured = product.featured;
  const isLowStock = product.stock < 10;
  const isOutOfStock = product.stock === 0;

if (viewMode === 'list') {
    return (
      <motion.div
        className={cn(
          "bg-white rounded-lg shadow-soft border-2 p-3 sm:p-4 relative hover:shadow-lg transition-all duration-200",
          selected ? "border-primary-500 bg-primary-50" : "border-gray-200"
        )}
        layout
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
      >
        {onSelect && (
          <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-10">
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onSelect(product.Id)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4" 
            />
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 pl-8 sm:pl-8">
          {/* Product Image */}
          <div className="flex-shrink-0 self-start sm:self-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-200 rounded-lg overflow-hidden">
              <img
                src={product.images?.[0] || "/api/placeholder/64/64"}
                alt={product.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
          
          {/* Product Info */}
          <div className="flex-1 min-w-0 space-y-2 sm:space-y-1">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 text-sm sm:text-base leading-tight">
                  {product.title}
                </h3>
                <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                  <p>SKU: {product.sku || `PRD-${product.Id.toString().padStart(3, "0")}`}</p>
                  <p>Category: {product.category}</p>
                  <div className="hidden sm:block space-y-0.5">
                    <p>
                      Created: {new Date(product.Id * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric"
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <PriceDisplay price={product.price} oldPrice={product.oldPrice} size="sm" />
                  <StockIndicator stock={product.stock} size="sm" />
                </div>
              </div>
              
              {/* Status Badges - Responsive */}
              <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-2 sm:mt-0 sm:ml-4">
                <Badge
                  variant={isVisible ? "success" : "outline"}
                  size="sm"
                  className="flex items-center text-xs"
                >
                  <ApperIcon name={isVisible ? "Eye" : "EyeOff"} className="w-3 h-3 mr-1" />
                  {isVisible ? "Published" : "Draft"}
                </Badge>
                {product.featured && (
                  <Badge variant="accent" size="sm" className="flex items-center text-xs">
                    <ApperIcon name="Star" className="w-3 h-3 mr-1" />
                    Featured
                  </Badge>
                )}
                {product.stock <= 10 && product.stock > 0 && (
                  <Badge variant="warning" size="sm" className="flex items-center text-xs">
                    <ApperIcon name="AlertTriangle" className="w-3 h-3 mr-1" />
                    Low Stock
                  </Badge>
                )}
                {product.stock === 0 && (
                  <Badge variant="destructive" size="sm" className="flex items-center text-xs">
                    <ApperIcon name="XCircle" className="w-3 h-3 mr-1" />
                    Out of Stock
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Actions - Responsive */}
            <div className="flex items-center justify-start space-x-1 pt-2 border-t border-gray-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleVisibility(product.Id)}
                disabled={loading}
                title={isVisible ? "Hide product" : "Publish product"}
                className="p-2"
              >
                <ApperIcon name={isVisible ? "EyeOff" : "Eye"} className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleFeatured(product.Id)}
                disabled={loading}
                title={isFeatured ? "Remove from featured" : "Mark as featured"}
                className={cn("p-2", isFeatured && "text-yellow-600")}
              >
                <ApperIcon name="Star" className={cn("w-4 h-4", isFeatured && "fill-current")} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onView(product.Id)}
                title="View product"
                className="p-2"
              >
                <ApperIcon name="ExternalLink" className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(product.Id)}
                title="Edit product"
                className="p-2"
              >
                <ApperIcon name="Edit" className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(product)}
                title="Delete product"
                className="text-red-600 hover:text-red-700 p-2"
              >
                <ApperIcon name="Trash2" className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

// Grid view mode - Mobile responsive
return (
  <motion.div
    className={cn(
      "bg-white rounded-lg shadow-soft border-2 p-3 sm:p-4 relative hover:shadow-lg transition-all duration-200",
      selected ? "border-primary-500 bg-primary-50" : "border-gray-200"
    )}
    layout
    whileHover={{ y: -2 }}
    transition={{ duration: 0.2 }}
  >
    {onSelect && (
      <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-10">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(product.Id)}
          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
        />
      </div>
    )}
    
    <div className="pl-7 sm:pl-8">
      {/* Product Image - Responsive aspect ratio */}
      <div className="w-full aspect-square sm:h-48 bg-gray-200 rounded-lg overflow-hidden mb-3 sm:mb-4">
        <img
          src={product.images?.[0] || "/api/placeholder/300/200"}
          alt={product.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
          loading="lazy"
        />
      </div>
      
      {/* Product Info */}
      <div className="space-y-2 sm:space-y-3">
        <div>
          <h3 className="font-medium text-gray-900 text-sm sm:text-base leading-tight">
            {product.title.length > 40 ? `${product.title.substring(0, 40)}...` : product.title}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            SKU: {product.sku || `PRD-${product.Id.toString().padStart(3, "0")}`}
          </p>
          <p className="text-xs text-gray-500">
            Category: {product.category}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <PriceDisplay price={product.price} oldPrice={product.oldPrice} size="sm" />
          <StockIndicator stock={product.stock} size="sm" />
        </div>
        
        {/* Status Badges - Responsive wrapping */}
        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
          <Badge
            variant={isVisible ? "success" : "outline"}
            size="sm"
            className="flex items-center text-xs"
          >
            <ApperIcon name={isVisible ? "Eye" : "EyeOff"} className="w-3 h-3 mr-1" />
            <span className="hidden sm:inline">{isVisible ? "Published" : "Draft"}</span>
            <span className="sm:hidden">{isVisible ? "Pub" : "Draft"}</span>
          </Badge>
          {product.featured && (
            <Badge variant="accent" size="sm" className="flex items-center text-xs">
              <ApperIcon name="Star" className="w-3 h-3 mr-1" />
              <span className="hidden sm:inline">Featured</span>
            </Badge>
          )}
          {product.stock <= 10 && product.stock > 0 && (
            <Badge variant="warning" size="sm" className="flex items-center text-xs">
              <ApperIcon name="AlertTriangle" className="w-3 h-3 mr-1" />
              <span className="hidden sm:inline">Low Stock</span>
              <span className="sm:hidden">Low</span>
            </Badge>
          )}
          {product.stock === 0 && (
            <Badge variant="destructive" size="sm" className="flex items-center text-xs">
              <ApperIcon name="XCircle" className="w-3 h-3 mr-1" />
              <span className="hidden sm:inline">Out of Stock</span>
              <span className="sm:hidden">Out</span>
            </Badge>
          )}
        </div>
        
        {/* Actions - Mobile optimized */}
        <div className="grid grid-cols-5 gap-1 pt-2 border-t border-gray-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleVisibility(product.Id)}
            disabled={loading}
            title={isVisible ? "Hide product" : "Publish product"}
            className="p-2 flex items-center justify-center"
          >
            <ApperIcon name={isVisible ? "EyeOff" : "Eye"} className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleFeatured(product.Id)}
            disabled={loading}
            title={isFeatured ? "Remove from featured" : "Mark as featured"}
            className={cn("p-2 flex items-center justify-center", isFeatured && "text-yellow-600")}
          >
            <ApperIcon name="Star" className={cn("w-4 h-4", isFeatured && "fill-current")} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(product.Id)}
            title="View product"
            className="p-2 flex items-center justify-center"
          >
            <ApperIcon name="ExternalLink" className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(product.Id)}
            title="Edit product"
            className="p-2 flex items-center justify-center"
          >
            <ApperIcon name="Edit" className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(product)}
            title="Delete product"
            className="text-red-600 hover:text-red-700 p-2 flex items-center justify-center"
          >
            <ApperIcon name="Trash2" className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  </motion.div>
);
};

export default ProductManagementCard;