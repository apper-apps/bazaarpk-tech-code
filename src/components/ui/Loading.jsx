import React from "react";
import { cn } from "@/utils/cn";

const Loading = ({ className, type = "skeleton", ...props }) => {
  if (type === "spinner") {
    return (
      <div className={cn("flex items-center justify-center p-8", className)} {...props}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (type === "products") {
    return (
      <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6", className)} {...props}>
        {[...Array(12)].map((_, index) => (
          <div key={index} className="bg-white rounded-xl shadow-soft overflow-hidden">
            <div className="aspect-square bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-3/4 animate-pulse" />
              <div className="flex items-center space-x-2">
                <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-20 animate-pulse" />
                <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-16 animate-pulse" />
              </div>
              <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "categories") {
    return (
      <div className={cn("flex space-x-4 overflow-hidden", className)} {...props}>
        {[...Array(8)].map((_, index) => (
          <div key={index} className="flex-shrink-0 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-xl animate-pulse mb-3" />
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-12 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  // Default skeleton
  return (
    <div className={cn("space-y-4 p-4", className)} {...props}>
      <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse" />
      <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse" />
      <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-3/4 animate-pulse" />
    </div>
  );
};

export default Loading;