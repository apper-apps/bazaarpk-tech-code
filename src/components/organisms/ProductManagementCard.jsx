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
loading = false,
  currentUser,
  showApprovalStatus = false
}) => {
const isVisible = product.visibility === 'published';
  const isFeatured = product.featured;
  const isLowStock = product.stock < 10;
  
  // Enhanced status handling
  const approvalStatus = product.status || 'pending';
  const isApproved = approvalStatus === 'approved';
  const isPending = approvalStatus === 'pending' || !product.status;
  const isRejected = approvalStatus === 'rejected';
  
  // Product can only be featured if approved AND published
  const isActuallyVisible = isVisible && isApproved;
  const canBeFeatured = isApproved && isVisible;
const needsApproval = isPending && !isVisible;
  const isOutOfStock = product.stock === 0;
  const adminRating = product.adminRating || 0;

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
{/* Admin Rating Stars */}
            {adminRating > 0 && (
              <div className="flex items-center mb-2">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={`text-sm ${i < adminRating ? 'text-yellow-500' : 'text-gray-300'}`}
                  >
                    ⭐
                  </span>
                ))}
                <span className="text-xs text-gray-500 ml-1">({adminRating}/5)</span>
              </div>
            )}
            
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
{/* Approval Status Badge */}
                {showApprovalStatus && (
                  <Badge
                    variant={isApproved ? "success" : isPending ? "warning" : "error"}
                    size="sm"
                    className="flex items-center text-xs"
                  >
                    <ApperIcon 
                      name={isApproved ? "CheckCircle" : isPending ? "Clock" : "XCircle"} 
                      className="w-3 h-3 mr-1" 
                    />
                    {isApproved ? "Approved" : isPending ? "Pending" : "Rejected"}
                  </Badge>
                )}
                
                {/* Visibility Badge */}
                <Badge
                  variant={isActuallyVisible ? "success" : "outline"}
                  size="sm"
                  className="flex items-center text-xs"
                >
                  <ApperIcon name={isActuallyVisible ? "Eye" : "EyeOff"} className="w-3 h-3 mr-1" />
                  {isActuallyVisible ? "Live" : isVisible ? "Published*" : "Draft"}
                </Badge>
                
                {/* Featured Badge */}
{product.featured && canBeFeatured && (
                  <Badge variant="accent" size="sm" className="flex items-center text-xs bg-gradient-to-r from-yellow-400 to-yellow-600 text-white">
                    <ApperIcon name="Star" className="w-3 h-3 mr-1 fill-current" />
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
                disabled={loading || (isVisible && !isApproved)}
                title={
                  needsApproval ? "Approve and publish product - will appear on homepage immediately" :
                  isActuallyVisible ? "Hide product from customers and homepage" : 
                  isVisible ? "Product needs approval to be visible" :
                  "Publish product to homepage and customer view"
                }
                className={cn(
                  "p-2",
                  needsApproval && "text-primary-600 bg-primary-50 hover:bg-primary-100",
                  isVisible && !isApproved && "text-orange-600 opacity-75"
                )}
              >
                <ApperIcon name={
                  needsApproval ? "CheckCircle" :
                  isActuallyVisible ? "EyeOff" : "Eye"
                } className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleFeatured(product.Id)}
                disabled={loading || !canBeFeatured}
                title={
                  !canBeFeatured ? "Product must be approved and published to be featured" :
                  isFeatured ? "Remove from featured section" : 
                  "Feature on homepage"
                }
                className={cn(
                  "p-2 transition-colors", 
                  isFeatured && canBeFeatured && "text-yellow-500 hover:text-yellow-600",
                  !canBeFeatured && "opacity-40 cursor-not-allowed"
                )}
              >
                <ApperIcon name="Star" className={cn(
                  "w-4 h-4 transition-all", 
                  isFeatured && canBeFeatured && "fill-current text-yellow-500"
                )} />
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
      selected ? "border-primary-500 bg-primary-50" : "border-gray-200",
      needsApproval && "border-orange-200 bg-orange-50/30",
      isRejected && "border-red-200 bg-red-50/30"
    )}
    layout
    whileHover={{ y: -2 }}
    transition={{ duration: 0.2 }}
  >
    {/* Status Indicators */}
    {needsApproval && (
      <div className="absolute top-2 right-2 z-10">
        <div className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center shadow-md">
          <ApperIcon name="Clock" className="w-3 h-3 mr-1" />
          NEEDS APPROVAL
        </div>
      </div>
    )}
    
    {isRejected && (
      <div className="absolute top-2 right-2 z-10">
        <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center shadow-md">
          <ApperIcon name="XCircle" className="w-3 h-3 mr-1" />
          REJECTED
        </div>
      </div>
    )}
    
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
      {/* Featured Star Badge - only show for live products */}
      {isFeatured && isActuallyVisible && (
        <div className="absolute top-2 left-2 z-10">
          <div className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center shadow-lg">
            <span className="mr-1">⭐</span>
            FEATURED
          </div>
        </div>
      )}

      {/* Admin Rating Badge */}
      {adminRating > 0 && (
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs flex items-center">
            <span className="text-yellow-400 mr-1">⭐</span>
            {adminRating}/5
          </div>
        </div>
      )}

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
          {/* Approval Status Badge */}
          {showApprovalStatus && (
            <Badge
              variant={isApproved ? "success" : isPending ? "warning" : "error"}
              size="sm"
              className="flex items-center text-xs"
            >
              <ApperIcon 
                name={isApproved ? "CheckCircle" : isPending ? "Clock" : "XCircle"} 
                className="w-3 h-3 mr-1" 
              />
              <span className="hidden sm:inline">
                {isApproved ? "Approved" : isPending ? "Pending" : "Rejected"}
              </span>
              <span className="sm:hidden">
                {isApproved ? "✓" : isPending ? "⏳" : "✗"}
              </span>
            </Badge>
          )}
          
          {/* Visibility Badge */}
          <Badge
            variant={isActuallyVisible ? "success" : "outline"}
            size="sm"
            className="flex items-center text-xs"
          >
            <ApperIcon name={isActuallyVisible ? "Eye" : "EyeOff"} className="w-3 h-3 mr-1" />
            <span className="hidden sm:inline">
              {isActuallyVisible ? "Live" : isVisible ? "Published*" : "Draft"}
            </span>
            <span className="sm:hidden">
              {isActuallyVisible ? "Live" : isVisible ? "Pub*" : "Draft"}
            </span>
          </Badge>
          
          {/* Featured Badge - only for live products */}
{product.featured && canBeFeatured && (
            <Badge variant="accent" size="sm" className="flex items-center text-xs bg-gradient-to-r from-yellow-400 to-yellow-600 text-white">
              <ApperIcon name="Star" className="w-3 h-3 mr-1 fill-current" />
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
            disabled={loading || (isVisible && !isApproved)}
            title={
              needsApproval ? "Approve and publish product - will appear on homepage immediately" :
              isActuallyVisible ? "Hide product from customers and homepage" : 
              isVisible ? "Product needs approval to be visible" :
              "Publish product to homepage and customer view"
            }
            className={cn(
              "p-2 flex items-center justify-center",
              needsApproval && "text-primary-600 bg-primary-50 hover:bg-primary-100",
              isVisible && !isApproved && "text-orange-600 opacity-75"
            )}
          >
            <ApperIcon name={
              needsApproval ? "CheckCircle" :
              isActuallyVisible ? "EyeOff" : "Eye"
            } className="w-4 h-4" />
          </Button>
          <Button
variant="ghost"
            size="sm"
            onClick={() => onToggleFeatured(product.Id)}
            disabled={loading || !canBeFeatured}
            title={
              !canBeFeatured ? "Product must be approved and published to be featured" :
              isFeatured ? "Remove from featured section" : 
              "Feature on homepage"
            }
            className={cn(
              "p-2 flex items-center justify-center transition-colors", 
              isFeatured && canBeFeatured && "text-yellow-500 hover:text-yellow-600",
              !canBeFeatured && "opacity-40 cursor-not-allowed"
            )}
          >
            <ApperIcon name="Star" className={cn(
              "w-4 h-4 transition-all", 
              isFeatured && canBeFeatured && "fill-current text-yellow-500"
            )} />
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