import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Button from "@/components/atoms/Button";
import ApperIcon from "@/components/ApperIcon";
import { cn } from "@/utils/cn";

const HeroBanner = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const banners = [
    {
      id: 1,
      title: "Fresh Groceries Delivered",
      subtitle: "Get farm-fresh vegetables and fruits delivered to your door",
      ctaText: "Shop Now",
      ctaLink: "/category?category=vegetables",
      backgroundGradient: "from-green-600 via-green-500 to-green-400",
      image: "🥬",
      offer: "Up to 30% OFF"
    },
    {
      id: 2,
      title: "Premium Electronics",
      subtitle: "Latest smartphones, laptops and gadgets at best prices",
      ctaText: "Explore Tech",
      ctaLink: "/category?category=electronics",
      backgroundGradient: "from-blue-600 via-blue-500 to-blue-400",
      image: "📱",
      offer: "Special Deals"
    },
    {
      id: 3,
      title: "Fashion & Beauty",
      subtitle: "Discover trending fashion and premium beauty products",
      ctaText: "Shop Fashion",
      ctaLink: "/category?category=fashion",
      backgroundGradient: "from-pink-600 via-pink-500 to-pink-400",
      image: "👗",
      offer: "Flat 25% OFF"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [banners.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  return (
    <div className="relative h-64 md:h-80 lg:h-96 overflow-hidden rounded-2xl mx-4 mt-4 md:mx-6 lg:mx-8">
      {/* Banner Slides */}
      <div 
        className="flex h-full transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={cn(
              "min-w-full h-full relative overflow-hidden",
              "bg-gradient-to-br",
              banner.backgroundGradient
            )}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 organic-pattern opacity-10" />
            
            {/* Content */}
            <div className="relative h-full flex items-center justify-between px-8 md:px-12 lg:px-16">
              <div className="flex-1 text-white">
                {/* Offer Badge */}
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-sm font-medium mb-4">
                  <ApperIcon name="Zap" className="w-4 h-4 mr-2" />
                  {banner.offer}
                </div>
                
                {/* Title */}
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold mb-3 leading-tight">
                  {banner.title}
                </h1>
                
                {/* Subtitle */}
                <p className="text-base md:text-lg text-white/90 mb-6 max-w-md leading-relaxed">
                  {banner.subtitle}
                </p>
                
                {/* CTA Button */}
                <Link to={banner.ctaLink}>
                  <Button 
                    size="lg" 
                    className="bg-white text-gray-900 hover:bg-gray-100 shadow-large font-semibold"
                  >
                    {banner.ctaText}
                    <ApperIcon name="ArrowRight" className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
              
              {/* Image */}
              <div className="hidden md:flex items-center justify-center">
                <div className="text-6xl lg:text-8xl opacity-80">
                  {banner.image}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 transition-colors duration-200"
      >
        <ApperIcon name="ChevronLeft" className="w-6 h-6 text-white" />
      </button>
      
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 transition-colors duration-200"
      >
        <ApperIcon name="ChevronRight" className="w-6 h-6 text-white" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              index === currentSlide
                ? "bg-white w-6"
                : "bg-white/50 hover:bg-white/70"
            )}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroBanner;