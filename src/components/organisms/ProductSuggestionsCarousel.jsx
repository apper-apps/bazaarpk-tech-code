import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '@/components/organisms/ProductCard';
import Button from '@/components/atoms/Button';
import ApperIcon from '@/components/ApperIcon';
import { productService } from '@/services/api/ProductService';
import { cn } from '@/utils/cn';

const ProductSuggestionsCarousel = ({ cartItems = [], className }) => {
  const [suggestedProducts, setSuggestedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(4);

  // Responsive items per page
  useEffect(() => {
    const updateItemsPerPage = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setItemsPerPage(1); // Mobile: 1 item
      } else if (width < 1024) {
        setItemsPerPage(2); // Tablet: 2 items
      } else if (width < 1280) {
        setItemsPerPage(3); // Small desktop: 3 items
      } else {
        setItemsPerPage(4); // Large desktop: 4 items
      }
    };

    updateItemsPerPage();
    window.addEventListener('resize', updateItemsPerPage);
    return () => window.removeEventListener('resize', updateItemsPerPage);
  }, []);

  // Fetch product suggestions based on cart contents
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!cartItems || cartItems.length === 0) {
          // No cart items, get featured products
          const featured = await productService.getFeaturedProductsAdvanced({ limit: 12 });
          setSuggestedProducts(featured);
          return;
        }

        // Get categories from cart items
        const cartCategories = [...new Set(cartItems.map(item => item.category))];
        const cartProductIds = cartItems.map(item => item.Id);
        
        let allSuggestions = [];

        // Get related products for each category
        for (const category of cartCategories) {
          try {
            const related = await productService.filterProducts({
              category: category,
              status: 'published'
            });
            
            // Filter out products already in cart
            const filtered = related.filter(product => 
              !cartProductIds.includes(product.Id) &&
              product.stock > 0 &&
              product.visibility === 'published'
            );
            
            allSuggestions = [...allSuggestions, ...filtered];
          } catch (err) {
            console.warn(`Error fetching suggestions for category ${category}:`, err);
          }
        }

        // Remove duplicates and prioritize by relevance
        const uniqueSuggestions = allSuggestions
          .filter((product, index, self) => 
            self.findIndex(p => p.Id === product.Id) === index
          )
          .sort((a, b) => {
            // Prioritize featured products
            if (a.featured && !b.featured) return -1;
            if (!a.featured && b.featured) return 1;
            
            // Then by badges (bestseller, premium, etc.)
            const aBadgeScore = (a.badges || []).length;
            const bBadgeScore = (b.badges || []).length;
            if (aBadgeScore !== bBadgeScore) return bBadgeScore - aBadgeScore;
            
            // Finally by stock level
            return b.stock - a.stock;
          })
          .slice(0, 12); // Limit to 12 suggestions

        setSuggestedProducts(uniqueSuggestions);

      } catch (err) {
        console.error('Error fetching product suggestions:', err);
        setError('Failed to load suggestions');
        
        // Fallback to featured products
        try {
          const featured = await productService.getFeaturedProductsAdvanced({ limit: 8 });
          setSuggestedProducts(featured);
        } catch (fallbackErr) {
          console.error('Fallback also failed:', fallbackErr);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [cartItems]);

  // Navigation functions
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex + itemsPerPage < suggestedProducts.length;

  const goToPrevious = () => {
    if (canGoPrevious) {
      setCurrentIndex(Math.max(0, currentIndex - itemsPerPage));
    }
  };

  const goToNext = () => {
    if (canGoNext) {
      setCurrentIndex(Math.min(suggestedProducts.length - itemsPerPage, currentIndex + itemsPerPage));
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft' && canGoPrevious) {
        goToPrevious();
      } else if (e.key === 'ArrowRight' && canGoNext) {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, canGoPrevious, canGoNext]);

  if (loading) {
    return (
      <div className={cn("py-8", className)}>
        <div className="flex items-center justify-center space-x-2 py-12">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
          <span className="text-gray-600 word-spacing-relaxed" style={{ wordSpacing: '0.08em', letterSpacing: '0.015em' }}>
            Loading suggestions...
          </span>
        </div>
      </div>
    );
  }

  if (error || suggestedProducts.length === 0) {
    return null; // Hide component if no suggestions available
  }

  const visibleProducts = suggestedProducts.slice(currentIndex, currentIndex + itemsPerPage);

  return (
    <div className={cn("py-8 bg-gray-50 rounded-lg", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-2">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 word-spacing-loose" style={{ wordSpacing: '0.08em', letterSpacing: '0.015em' }}>
            You Might Also Like
          </h3>
          <p className="text-sm text-gray-600 mt-1 word-spacing-relaxed" style={{ wordSpacing: '0.08em', letterSpacing: '0.015em' }}>
            Based on items in your cart
          </p>
        </div>
        
        {/* Navigation Controls */}
        {suggestedProducts.length > itemsPerPage && (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPrevious}
              disabled={!canGoPrevious}
              className="h-9 w-9 rounded-full p-0 hover:bg-primary-50 disabled:opacity-30"
              aria-label="Previous products"
            >
              <ApperIcon name="ChevronLeft" size={16} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNext}
              disabled={!canGoNext}
              className="h-9 w-9 rounded-full p-0 hover:bg-primary-50 disabled:opacity-30"
              aria-label="Next products"
            >
              <ApperIcon name="ChevronRight" size={16} />
            </Button>
          </div>
        )}
      </div>

      {/* Products Carousel */}
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "grid gap-4",
              itemsPerPage === 1 && "grid-cols-1",
              itemsPerPage === 2 && "grid-cols-2",
              itemsPerPage === 3 && "grid-cols-3",
              itemsPerPage === 4 && "grid-cols-4"
            )}
          >
            {visibleProducts.map((product) => (
              <div key={product.Id} className="flex-shrink-0">
                <ProductCard
                  product={product}
                  mode="suggestion"
                  className="h-full shadow-sm hover:shadow-md transition-shadow duration-200"
                />
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots Indicator */}
      {suggestedProducts.length > itemsPerPage && (
        <div className="flex justify-center mt-6 space-x-2">
          {Array.from({ 
            length: Math.ceil(suggestedProducts.length / itemsPerPage) 
          }).map((_, index) => {
            const isActive = Math.floor(currentIndex / itemsPerPage) === index;
            return (
              <button
                key={index}
                onClick={() => setCurrentIndex(index * itemsPerPage)}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors duration-200",
                  isActive ? "bg-primary-500" : "bg-gray-300 hover:bg-gray-400"
                )}
                aria-label={`Go to page ${index + 1}`}
              />
            );
          })}
        </div>
      )}

      {/* Touch/Swipe Instructions for Mobile */}
      {itemsPerPage === 1 && suggestedProducts.length > 1 && (
        <div className="text-center mt-4">
          <p className="text-xs text-gray-500 word-spacing-relaxed" style={{ wordSpacing: '0.08em', letterSpacing: '0.015em' }}>
            Use arrows or swipe to see more suggestions
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductSuggestionsCarousel;