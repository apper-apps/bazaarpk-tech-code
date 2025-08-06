import React from 'react';
import { motion } from 'framer-motion';
import ApperIcon from '@/components/ApperIcon';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import ProductBadges from '@/components/molecules/ProductBadges';
import PriceDisplay from '@/components/molecules/PriceDisplay';
import StockIndicator from '@/components/molecules/StockIndicator';
import { cn } from '@/utils/cn';
import { formatPrice } from '@/utils/currency';

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
        <div className="flex items-center space-x-4 pl-8">
          {/* Product Image */}
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
              <img
                src={product.images?.[0] || "/api/placeholder/64/64"}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {product.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
SKU: {product.sku || `PRD-${product.Id.toString().padStart(3, '0')}`}
              </p>
              <p className="text-xs text-gray-500">
                Category: {product.category}
              </p>
              <p className="text-xs text-gray-500">
                Created: {new Date(product.Id * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </p>
              <p className="text-xs text-gray-500">
                Updated: {new Date(product.Id * 24 * 60 * 60 * 1000 + 86400000).toLocaleDateString()}
              </p>
              <div className="flex items-center space-x-2 mt-2">
                  <PriceDisplay price={product.price} oldPrice={product.oldPrice} size="sm" />
                  <StockIndicator stock={product.stock} size="sm" />
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex items-center space-x-2 ml-4">
                {isFeatured && (
                  <Badge variant="warning" size="sm">
                    <ApperIcon name="Star" className="w-3 h-3 mr-1" />
                    Featured
                  </Badge>
                )}
                <Badge
                  variant={isVisible ? "success" : "outline"}
                  size="sm"
                >
                  <ApperIcon 
                    name={isVisible ? "Eye" : "EyeOff"} 
                    className="w-3 h-3 mr-1" 
                  />
{isVisible ? "Published" : "Draft"}
                </Badge>
                {product.featured && (
                  <Badge variant="accent" size="sm">
                    Featured
                  </Badge>
                )}
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
      </motion.div>
    );
  }

  return (
    <motion.div
      className={cn(
        "bg-white rounded-lg shadow-soft border border-gray-200 overflow-hidden",
        !isVisible && "opacity-60"
      )}
      layout
      whileHover={{ y: -4, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
      transition={{ duration: 0.2 }}
    >
{/* Product Image */}
      <div className="relative aspect-square bg-gray-100">
        <img
          src={product.images?.[0] || "/api/placeholder/300/300"}
          alt={product.title}
          className="w-full h-full object-cover"
        />
        
        {/* Selection Checkbox */}
        {onSelect && (
          <div className="absolute top-2 left-2 z-10">
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onSelect(product.Id)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 bg-white shadow-md"
            />
          </div>
        )}
        
        {/* Status Indicators */}
        <div className="absolute top-2 left-2 flex space-x-1">
          {isFeatured && (
            <Badge variant="warning" size="sm">
              <ApperIcon name="Star" className="w-3 h-3" />
            </Badge>
          )}
          {isOutOfStock && (
            <Badge variant="destructive" size="sm">
              Out of Stock
            </Badge>
          )}
          {isLowStock && !isOutOfStock && (
            <Badge variant="warning" size="sm">
              Low Stock
            </Badge>
          )}
        </div>

        {/* Visibility Toggle */}
        <div className="absolute top-2 right-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleVisibility(product.Id)}
            disabled={loading}
            className="bg-white bg-opacity-90 hover:bg-opacity-100"
            title={isVisible ? "Hide product" : "Publish product"}
          >
            <ApperIcon 
              name={isVisible ? "Eye" : "EyeOff"} 
              className={cn("w-4 h-4", isVisible ? "text-green-600" : "text-gray-400")} 
            />
          </Button>
        </div>

        {/* Featured Toggle */}
        <div className="absolute bottom-2 right-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleFeatured(product.Id)}
            disabled={loading}
            className="bg-white bg-opacity-90 hover:bg-opacity-100"
            title={isFeatured ? "Remove from featured" : "Mark as featured"}
          >
            <ApperIcon 
              name="Star" 
              className={cn(
                "w-4 h-4", 
                isFeatured ? "text-yellow-500 fill-current" : "text-gray-400"
              )} 
            />
          </Button>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <div className="mb-2">
          <h3 className="font-medium text-gray-900 line-clamp-2 text-sm leading-tight">
            {product.title.length > 50 
              ? `${product.title.substring(0, 50)}...` 
              : product.title
            }
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            SKU: {product.sku || `PRD-${product.Id.toString().padStart(3, '0')}`}
          </p>
        </div>

        {/* Price and Stock */}
        <div className="space-y-2 mb-3">
          <PriceDisplay 
            price={product.price} 
            oldPrice={product.oldPrice} 
            size="sm" 
          />
          <StockIndicator stock={product.stock} size="sm" />
        </div>

        {/* Badges */}
        {product.badges && product.badges.length > 0 && (
          <div className="mb-3">
            <ProductBadges badges={product.badges} maxDisplay={2} size="sm" />
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-3 gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(product.Id)}
            className="text-xs"
            title="View product"
          >
            <ApperIcon name="ExternalLink" className="w-3 h-3 mr-1" />
            View
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(product.Id)}
            className="text-xs"
            title="Edit product"
          >
            <ApperIcon name="Edit" className="w-3 h-3 mr-1" />
            Edit
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(product)}
            className="text-xs text-red-600 hover:text-red-700"
            title="Delete product"
          >
            <ApperIcon name="Trash2" className="w-3 h-3 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      {/* Visibility Overlay */}
      {!isVisible && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-20 flex items-center justify-center">
          <div className="bg-white rounded-full px-3 py-1 text-sm font-medium text-gray-700">
            Hidden
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ProductManagementCard;