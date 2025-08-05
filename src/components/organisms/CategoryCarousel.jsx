import React, { useRef } from "react";
import { Link } from "react-router-dom";
import ApperIcon from "@/components/ApperIcon";
import Button from "@/components/atoms/Button";
import { cn } from "@/utils/cn";

const CategoryCarousel = ({ categories = [] }) => {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  };

  const categoryIcons = {
    "Vegetables": "Carrot",
    "Fruits": "Apple",
    "Meat": "Beef",
    "Milk": "Milk",
    "Oil": "Droplets",
    "Desi Ghee": "Cookie",
    "Groceries": "ShoppingBasket",
    "Pizza": "Pizza",
    "Foods": "UtensilsCrossed",
    "Cosmetics": "Sparkles",
    "Garments": "Shirt",
    "Shoes": "ShirtIcon",
    "School": "BookOpen",
    "Health": "Heart",
    "Agriculture": "Wheat",
    "Care": "Shield",
    "Baby": "Baby",
    "Sports": "Trophy",
    "Electric": "Zap",
    "Electronics": "Smartphone",
    "Mobile": "Phone",
    "Computer": "Laptop",
    "Diet": "Salad",
    "Nuts": "Nut",
    "Dry Fruit": "Grape",
    "Services": "Settings",
    "Toys": "Gamepad2",
    "Books": "Book",
    "Islamic": "Star",
    "Household Items": "Home"
  };

  if (!categories || categories.length === 0) return null;

  return (
    <div className="relative px-4 md:px-6 lg:px-8 mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-display font-bold text-gray-900">
          Shop by Category
        </h2>
        <Link
          to="/category"
          className="text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors duration-200"
        >
          View All Categories
        </Link>
      </div>

      {/* Carousel Container */}
      <div className="relative">
        {/* Left Arrow */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white shadow-medium rounded-full p-2 hover:shadow-large"
        >
          <ApperIcon name="ChevronLeft" className="w-5 h-5" />
        </Button>

        {/* Right Arrow */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white shadow-medium rounded-full p-2 hover:shadow-large"
        >
          <ApperIcon name="ChevronRight" className="w-5 h-5" />
        </Button>

        {/* Categories Scroll Container */}
        <div
          ref={scrollRef}
          className="flex space-x-4 overflow-x-auto scrollbar-hide px-8 py-2"
        >
          {categories.map((category) => (
            <Link
              key={category.Id}
              to={`/category?category=${encodeURIComponent(category.name.toLowerCase())}`}
              className="flex-shrink-0 group"
            >
              <div className="flex flex-col items-center p-4 rounded-2xl bg-white shadow-soft hover:shadow-large transition-all duration-300 hover:-translate-y-1 min-w-[100px]">
                {/* Icon Container */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                  <ApperIcon 
                    name={categoryIcons[category.name] || "Package"} 
                    className="w-6 h-6 text-white" 
                  />
                </div>
                
                {/* Category Name */}
                <span className="text-sm font-medium text-gray-700 text-center group-hover:text-primary-600 transition-colors duration-200">
                  {category.name}
                </span>
                
                {/* Product Count */}
                {category.productCount && (
                  <span className="text-xs text-gray-500 mt-1">
                    {category.productCount} items
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryCarousel;