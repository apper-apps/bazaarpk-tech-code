import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProductCard from "@/components/organisms/ProductCard";
import Button from "@/components/atoms/Button";
import ApperIcon from "@/components/ApperIcon";
import { cn } from "@/utils/cn";

const ProductGrid = ({ 
  products = [], 
  title = "Featured Products",
  showLoadMore = false,
  initialCount = 12,
  gridType = "products", // "products" or "bundles"
  className,
  ...props 
}) => {
const [visibleCount, setVisibleCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile for responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const visibleProducts = products.slice(0, visibleCount);
  const hasMore = visibleCount < products.length;

  const loadMore = async () => {
    setIsLoading(true);
    
    // Performance-optimized loading delay based on device
    const loadDelay = isMobile ? 300 : 200;
    const batchSize = isMobile ? 8 : 12;
    
    await new Promise(resolve => setTimeout(resolve, loadDelay));
    
    setVisibleCount(prev => Math.min(prev + batchSize, products.length));
    setIsLoading(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  if (!products || products.length === 0) return null;

  return (
    <div className={cn("px-4 md:px-6 lg:px-8 mb-12", className)} {...props}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-gray-900 mb-2">
            {title}
          </h2>
          <p className="text-gray-600">
            Showing {visibleProducts.length} of {products.length} products
          </p>
        </div>
        
{products.length > initialCount && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {isMobile ? 
                  `${visibleCount}/${products.length}` :
                  `${Math.round((visibleCount / products.length) * 100)}% loaded`
                }
              </span>
              <div className={`${isMobile ? 'w-16' : 'w-24'} h-2 bg-gray-200 rounded-full overflow-hidden`}>
                <div 
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500"
                  style={{ width: `${(visibleCount / products.length) * 100}%` }}
                />
              </div>
            </div>
            {!isMobile && (
              <span className="text-xs text-gray-400">
                {hasMore ? `${products.length - visibleCount} more` : 'All loaded'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Products Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
className={`grid gap-4 ${
          isMobile 
            ? 'grid-cols-1 sm:grid-cols-2' 
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
        }`}
      >
        <AnimatePresence>
          {visibleProducts.map((product) => (
            <motion.div
              key={product.Id}
              variants={itemVariants}
              layout
              whileHover={isMobile ? {} : { y: -4 }}
              transition={{ duration: isMobile ? 0.1 : 0.2 }}
            >
              <ProductCard 
                product={product} 
                className={isMobile ? 'touch-optimized' : ''}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Load More Button */}
{showLoadMore && hasMore && (
        <div className="flex justify-center mt-8">
          <Button
            onClick={loadMore}
            disabled={isLoading}
            size={isMobile ? "md" : "lg"}
            className={`${isMobile ? 'px-6 py-3 text-sm' : 'px-8 py-4'} 
              transition-all duration-200 transform hover:scale-105`}
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                <span className={isMobile ? 'text-sm' : ''}>
                  Loading{isMobile ? '...' : ' more products...'}
                </span>
              </div>
            ) : (
              <div className="flex items-center">
                <ApperIcon name="Plus" className="w-4 h-4 mr-2" />
                <span className={isMobile ? 'text-sm' : ''}>
                  {isMobile ? 
                    `Load More (${products.length - visibleCount})` :
                    `Load More Products (${products.length - visibleCount} remaining)`
                  }
                </span>
              </div>
            )}
          </Button>
        </div>
      )}

      {/* Show completion message */}
      {showLoadMore && !hasMore && products.length > initialCount && (
        <div className="flex justify-center mt-12">
          <div className="text-center">
            <ApperIcon name="CheckCircle" className="w-8 h-8 text-primary-500 mx-auto mb-2" />
            <p className="text-gray-600 font-medium">
              You've viewed all {products.length} products
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;