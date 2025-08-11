import React from "react";
import { motion } from "framer-motion";
import RecipeBundleCard from "@/components/organisms/RecipeBundleCard";
import Button from "@/components/atoms/Button";
import ApperIcon from "@/components/ApperIcon";
import { cn } from "@/utils/cn";

const RecipeBundles = ({ 
  bundles = [], 
  title = "🍽️ Recipe Bundles",
  subtitle = "Complete ingredient sets for your favorite recipes",
  showViewAll = true,
  className,
  ...props 
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  if (!bundles || bundles.length === 0) return null;

  return (
    <div className={cn("px-4 md:px-6 lg:px-8 mb-16", className)} {...props}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
<div>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-gray-900 mb-2 product-text-field word-spacing-loose letter-spacing-wide" style={{ wordSpacing: '0.1em', letterSpacing: '0.02em' }}>
            {title}
          </h2>
          <p className="text-gray-600 max-w-lg product-text-field word-spacing-relaxed" style={{ wordSpacing: '0.08em', letterSpacing: '0.015em', lineHeight: '1.65' }}>
            {subtitle}
          </p>
        </div>
        
        {showViewAll && bundles.length > 0 && (
          <Button
            variant="outline" 
            className="hidden md:flex items-center gap-2"
>
            <span className="word-spacing-loose" style={{ wordSpacing: '0.08em', letterSpacing: '0.015em' }}>View All Bundles</span>
            <ApperIcon name="ArrowRight" className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Recipe Bundles Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
      >
        {bundles.map((bundle) => (
          <motion.div
            key={bundle.Id}
            variants={itemVariants}
          >
            <RecipeBundleCard bundle={bundle} />
          </motion.div>
        ))}
      </motion.div>

      {/* Mobile View All Button */}
      {showViewAll && bundles.length > 0 && (
        <div className="flex justify-center md:hidden">
          <Button
            className="px-8"
            size="lg"
>
            <ApperIcon name="ChefHat" className="w-5 h-5 mr-2" />
            <span className="word-spacing-loose" style={{ wordSpacing: '0.08em', letterSpacing: '0.015em' }}>View All Recipe Bundles</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default RecipeBundles;