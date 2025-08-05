import React, { useEffect, useState } from "react";
import { useToast } from "@/hooks/useToast";
import { LocationService } from "@/services/api/LocationService";
import { CategoryService } from "@/services/api/CategoryService";
import { ProductService } from "@/services/api/ProductService";
import DealsSection from "@/components/organisms/DealsSection";
import HeroBanner from "@/components/organisms/HeroBanner";
import ProductGrid from "@/components/organisms/ProductGrid";
import CategoryCarousel from "@/components/organisms/CategoryCarousel";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";
const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
const [deals, setDeals] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [locationMessage, setLocationMessage] = useState("🔥 Trending Now");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const showToast = useToast();
const loadData = async () => {
    try {
      setLoading(true);
      setError("");

// Get user location with comprehensive error handling
      const location = await LocationService.getUserLocation();
      setUserLocation(location);
      
      // Enhanced debugging for location service (development only)
      if (import.meta.env.DEV && location?.error) {
        console.info('Location service fallback activated:', {
          city: location.city || 'Unknown',
          errorCode: location.error?.code || 'N/A',
          errorMessage: location.error?.message || 'No error message',
          fallbackActive: true
        });
      }
      
      const locationMsg = LocationService.getLocationMessage(location);
      setLocationMessage(locationMsg);
      const [productsData, categoriesData, trendingData] = await Promise.all([
        ProductService.getAll(),
        CategoryService.getAll(),
        ProductService.getTrendingByLocation(location)
      ]);

      setProducts(productsData);
      setCategories(categoriesData);
      setTrendingProducts(trendingData);
      
      // Filter deals (products with discount)
      const dealsData = productsData.filter(product => 
        product.oldPrice && product.oldPrice > product.price
      );
      setDeals(dealsData);

// Show location-based success message (only if location was successfully obtained)
      if (location?.city && location.city !== "Pakistan" && !location.error) {
        showToast.success(`Products tailored for ${location.city}! Showing ${location.weather} weather favorites.`);
      } else if (location?.error && location.error.code === 1) {
        // Quietly handle permission denied - no need to show error toast as fallback works
        console.info('Using default location-based products due to permission settings');
      }
} catch (err) {
      console.error("Error loading home data:", err);
      
      // Enhanced error handling with categorized messaging
      let errorMessage = "Failed to load page content. Please try again.";
      let showToastError = true;
      
      // Handle specific error types
      if (err?.message?.includes('location') || err?.message?.includes('geolocation')) {
        errorMessage = "Products loaded successfully with default location settings.";
        showToastError = false; // Don't show toast for location-related issues as fallback works
      } else if (err?.name === 'NetworkError' || err?.message?.includes('fetch')) {
        errorMessage = "Network connection issue. Please check your internet and try again.";
      } else if (err?.message?.includes('timeout')) {
        errorMessage = "Request timed out. Please try again.";
      }
      
      setError(errorMessage);
      
      // Show toast error only for actual failures that affect functionality
      if (showToastError) {
        showToast.error("Failed to load products. Please check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Hero Banner Skeleton */}
        <div className="h-64 md:h-80 lg:h-96 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse rounded-2xl mx-4 mt-4 md:mx-6 lg:mx-8" />
        
        {/* Categories Skeleton */}
        <div className="px-4 md:px-6 lg:px-8 mt-8 mb-8">
          <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-48 animate-pulse mb-6" />
          <Loading type="categories" />
        </div>
        
        {/* Products Skeleton */}
        <div className="px-4 md:px-6 lg:px-8">
          <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-56 animate-pulse mb-8" />
          <Loading type="products" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Error
          title="Unable to load homepage"
          message={error}
          onRetry={loadData}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner */}
      <HeroBanner />

      {/* Categories Section */}
      <CategoryCarousel categories={categories} />

      {/* Deals Section */}
      {deals.length > 0 && <DealsSection deals={deals} />}

      {/* Featured Products */}
      <ProductGrid 
        products={products}
        title="Featured Products"
        showLoadMore={true}
        initialCount={12}
      />

{/* Location-Based Trending Products */}
      <ProductGrid 
        products={trendingProducts.length > 0 ? trendingProducts : products.filter(p => p.badges?.includes("BESTSELLER")).slice(0, 8)}
        title={locationMessage}
        showLoadMore={false}
        initialCount={8}
      />

      {/* Fresh Arrivals */}
      <ProductGrid 
        products={products.filter(p => p.badges?.includes("FRESH")).slice(0, 8)}
        title="🌱 Fresh Arrivals"
        showLoadMore={false}
        initialCount={8}
      />

      {/* Footer Spacer */}
      <div className="h-16" />
    </div>
  );
};

export default Home;