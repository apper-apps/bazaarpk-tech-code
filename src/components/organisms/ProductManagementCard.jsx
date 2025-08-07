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
        "bg-white rounded-lg shadow-soft border-2 p-4 relative",
        selected ? "border-primary-500 bg-primary-50" : "border-gray-200"
    )}
    layout
    whileHover={{
        y: -2
    }}
    transition={{
        duration: 0.2
    }}>
    {onSelect && <div className="absolute top-4 left-4 z-10">
        <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect(product.Id)}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
    </div>}
    <div className="flex items-center space-x-4 pl-8">
        {/* Product Image */}
        <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                <img
                    src={product.images?.[0] || "/api/placeholder/64/64"}
                    alt={product.title}
                    className="w-full h-full object-cover" />
            </div>
        </div>
        {/* Product Info */}
        <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <h3
                        className={cn(
                            "font-medium text-gray-900",
                            viewMode === "list" ? "text-base" : "text-sm truncate"
                        )}>
                        {viewMode === "list" ? product.title : product.title.length > 50 ? `${product.title.substring(0, 50)}...` : product.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">SKU: {product.sku || `PRD-${product.Id.toString().padStart(3, "0")}`}
                    </p>
                    <p className="text-xs text-gray-500">Category: {product.category}
                    </p>
                    {viewMode === "list" && <>
                        <div className="text-xs text-gray-500 space-y-1">
                            <p><span className="font-medium">SKU:</span> {product.sku || `SKU-${product.Id.toString().padStart(6, "0")}`}</p>
                            <p><span className="font-medium">Category:</span> {product.category || "Uncategorized"}</p>
                        </div>
                        <div className="text-xs text-gray-500 space-y-1">
                            <p><span className="font-medium">Created:</span> {new Date(product.Id * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric"
                                })}</p>
                            <p><span className="font-medium">Updated:</span> {new Date(product.Id * 24 * 60 * 60 * 1000 + 86400000).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric"
                                })}</p>
                        </div>
                    </>}
                    <div className="flex items-center space-x-2 mt-2">
                        <PriceDisplay price={product.price} oldPrice={product.oldPrice} size="sm" />
                        <StockIndicator stock={product.stock} size="sm" />
                    </div>
                </div>
                {/* Status Badges */}
                <div className="flex items-center space-x-2 ml-4">
                    {isFeatured && <Badge variant="warning" size="sm">
                        <ApperIcon name="Star" className="w-3 h-3 mr-1" />Featured
                                          </Badge>}
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge
                            variant={isVisible ? "success" : "outline"}
                            size="sm"
                            className="flex items-center">
                            <ApperIcon name={isVisible ? "Eye" : "EyeOff"} className="w-3 h-3 mr-1" />
                            {isVisible ? "Published" : "Draft"}
                        </Badge>
                        {product.featured && <Badge variant="accent" size="sm" className="flex items-center">
                            <ApperIcon name="Star" className="w-3 h-3 mr-1" />Featured
                                                </Badge>}
                        {viewMode === "list" && product.stock <= 10 && product.stock > 0 && <Badge variant="warning" size="sm" className="flex items-center">
                            <ApperIcon name="AlertTriangle" className="w-3 h-3 mr-1" />Low Stock
                                                </Badge>}
                        {viewMode === "list" && product.stock === 0 && <Badge variant="destructive" size="sm" className="flex items-center">
                            <ApperIcon name="XCircle" className="w-3 h-3 mr-1" />Out of Stock
                                                </Badge>}
                    </div>
                </div>
            </div>
            {/* Actions */}
            <div className="flex items-center space-x-1">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleVisibility(product.Id)}
                    disabled={loading}
                    title={isVisible ? "Hide product" : "Publish product"}>
                    <ApperIcon name={isVisible ? "EyeOff" : "Eye"} className="w-4 h-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleFeatured(product.Id)}
                    disabled={loading}
                    title={isFeatured ? "Remove from featured" : "Mark as featured"}
                    className={cn(isFeatured && "text-yellow-600")}>
                    <ApperIcon name="Star" className={cn("w-4 h-4", isFeatured && "fill-current")} />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(product.Id)}
                    title="View product">
                    <ApperIcon name="ExternalLink" className="w-4 h-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(product.Id)}
                    title="Edit product">
                    <ApperIcon name="Edit" className="w-4 h-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(product)}
                    title="Delete product"
                    className="text-red-600 hover:text-red-700">
                    <ApperIcon name="Trash2" className="w-4 h-4" />
                </Button>
            </div>
        </div>
</div></motion.div>
  );
}

// Grid view mode
return (
  <motion.div
    className={cn(
      "bg-white rounded-lg shadow-soft border-2 p-4 relative",
      selected ? "border-primary-500 bg-primary-50" : "border-gray-200"
    )}
    layout
    whileHover={{ y: -2 }}
    transition={{ duration: 0.2 }}
  >
    {onSelect && (
      <div className="absolute top-4 left-4 z-10">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(product.Id)}
          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
      </div>
    )}
    
    <div className="pl-8">
      {/* Product Image */}
      <div className="w-full h-48 bg-gray-200 rounded-lg overflow-hidden mb-4">
        <img
          src={product.images?.[0] || "/api/placeholder/300/200"}
          alt={product.title}
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Product Info */}
      <div className="space-y-3">
        <div>
          <h3 className="font-medium text-gray-900 text-sm truncate">
            {product.title.length > 50 ? `${product.title.substring(0, 50)}...` : product.title}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            SKU: {product.sku || `PRD-${product.Id.toString().padStart(3, "0")}`}
          </p>
          <p className="text-xs text-gray-500">
            Category: {product.category}
          </p>
        </div>
        
        <div className="flex items-center justify-between">
          <PriceDisplay price={product.price} oldPrice={product.oldPrice} size="sm" />
          <StockIndicator stock={product.stock} size="sm" />
        </div>
        
        {/* Status Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={isVisible ? "success" : "outline"}
            size="sm"
            className="flex items-center"
          >
            <ApperIcon name={isVisible ? "Eye" : "EyeOff"} className="w-3 h-3 mr-1" />
            {isVisible ? "Published" : "Draft"}
          </Badge>
          {product.featured && (
            <Badge variant="accent" size="sm" className="flex items-center">
              <ApperIcon name="Star" className="w-3 h-3 mr-1" />
              Featured
            </Badge>
          )}
          {product.stock <= 10 && product.stock > 0 && (
            <Badge variant="warning" size="sm" className="flex items-center">
              <ApperIcon name="AlertTriangle" className="w-3 h-3 mr-1" />
              Low Stock
            </Badge>
          )}
          {product.stock === 0 && (
            <Badge variant="destructive" size="sm" className="flex items-center">
              <ApperIcon name="XCircle" className="w-3 h-3 mr-1" />
              Out of Stock
            </Badge>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex items-center justify-center space-x-1 pt-2 border-t border-gray-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleVisibility(product.Id)}
            disabled={loading}
            title={isVisible ? "Hide product" : "Publish product"}
          >
            <ApperIcon name={isVisible ? "EyeOff" : "Eye"} className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleFeatured(product.Id)}
            disabled={loading}
            title={isFeatured ? "Remove from featured" : "Mark as featured"}
            className={cn(isFeatured && "text-yellow-600")}
          >
            <ApperIcon name="Star" className={cn("w-4 h-4", isFeatured && "fill-current")} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(product.Id)}
            title="View product"
          >
            <ApperIcon name="ExternalLink" className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(product.Id)}
            title="Edit product"
          >
            <ApperIcon name="Edit" className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(product)}
            title="Delete product"
            className="text-red-600 hover:text-red-700"
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