import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ProductCard from "@/components/organisms/ProductCard";
import ApperIcon from "@/components/ApperIcon";
import { cn } from "@/utils/cn";

const DealsSection = ({ deals = [] }) => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 45,
    seconds: 30
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          return { hours: 23, minutes: 59, seconds: 59 };
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!deals || deals.length === 0) return null;

  return (
    <div className="px-4 md:px-6 lg:px-8 mb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-accent-500 to-accent-600 rounded-2xl p-6 mb-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center space-x-2 mb-2">
              <ApperIcon name="Zap" className="w-6 h-6" />
              <h2 className="text-2xl md:text-3xl font-display font-bold">
                Deals of the Day
              </h2>
            </div>
            <p className="text-accent-100">
              Limited time offers - grab them before they're gone!
            </p>
          </div>
          
          {/* Countdown Timer */}
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{String(timeLeft.hours).padStart(2, '0')}</div>
              <div className="text-xs text-accent-200">Hours</div>
            </div>
            <div className="text-xl">:</div>
            <div className="text-center">
              <div className="text-2xl font-bold">{String(timeLeft.minutes).padStart(2, '0')}</div>
              <div className="text-xs text-accent-200">Minutes</div>
            </div>
            <div className="text-xl">:</div>
            <div className="text-center">
              <div className="text-2xl font-bold">{String(timeLeft.seconds).padStart(2, '0')}</div>
              <div className="text-xs text-accent-200">Seconds</div>
            </div>
          </div>
        </div>
      </div>

      {/* Deals Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {deals.slice(0, 8).map((product, index) => (
          <div key={product.Id} className="relative">
            {/* Flash Deal Badge */}
            <div className="absolute top-2 left-2 z-10">
              <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1 shadow-lg">
                <ApperIcon name="Flame" className="w-3 h-3" />
                <span>FLASH</span>
              </div>
            </div>
            
            <ProductCard 
              product={{
                ...product,
                badges: [...(product.badges || []), "LIMITED"]
              }}
              className="hover:scale-105 transition-all duration-300"
            />
          </div>
        ))}
      </div>

      {/* View All Deals Button */}
      <div className="flex justify-center">
        <Link to="/deals">
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-medium hover:from-primary-700 hover:to-primary-600 transition-all duration-200 shadow-medium hover:shadow-large">
            <ApperIcon name="Eye" className="w-5 h-5 mr-2" />
            View All Deals
            <ApperIcon name="ArrowRight" className="w-5 h-5 ml-2" />
          </div>
        </Link>
      </div>
    </div>
  );
};

export default DealsSection;