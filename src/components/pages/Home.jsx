import React, { useEffect, useState } from "react";
import { useToast } from "@/hooks/useToast";
import { LocationService } from "@/services/api/LocationService";
import { CategoryService } from "@/services/api/CategoryService";
import { ProductService } from "@/services/api/ProductService";
import { RecipeBundleService } from "@/services/api/RecipeBundleService";
import RecipeBundles from "@/components/organisms/RecipeBundles";
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
  const [recipeBundles, setRecipeBundles] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [seasonalProducts, setSeasonalProducts] = useState([]);
  const [locationMessage, setLocationMessage] = useState("🔥 Trending Now");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const showToast = useToast();
const loadData = async () => {
    try {
      setLoading(true);

      // Get user location first with null check
      const location = await LocationService.getUserLocation();
      if (location) {
        setUserLocation(location);
        setWeatherData(location);
      }

// Initialize all data promises
const [categoriesData, productsData, trendingData, recipeBundlesData] = await Promise.all([
        CategoryService.getAll(),
        ProductService.getAll(),
        ProductService.getTrendingByLocation(location),
        RecipeBundleService.getFeatured(6)
      ]);

      // Set basic data
      setProducts(productsData);
      setCategories(categoriesData);
      setTrendingProducts(trendingData);
      setRecipeBundles(recipeBundlesData);
      
      // Get weather-based seasonal products with null checks
      if (location?.weather) {
        const seasonalProductNames = LocationService.getSeasonalProducts(location.weather) || [];
        const weatherFilteredProducts = productsData?.filter(product => 
          product?.name && seasonalProductNames.some(name => 
            name && product.name.toLowerCase().includes(name.toLowerCase())
          )
        ) || [];
        setSeasonalProducts(weatherFilteredProducts);
        
        // Update location message based on weather
        const weatherMessage = LocationService.getLocationMessage(location);
        if (weatherMessage) {
          setLocationMessage(weatherMessage);
        }
      }
      
      // Filter deals (products with discount) with null checks
      const dealsData = productsData?.filter(product => 
        product?.oldPrice && product?.price && product.oldPrice > product.price
      ) || [];
      setDeals(dealsData);

      setLoading(false);
    } catch (err) {
      console.error("Error loading home data:", err);
      
      // Enhanced error handling with categorized messaging
      let errorMessage = "Failed to load page content. Please try again.";
      let showToastError = true;
      
      // Handle specific error types with improved categorization
      if (err?.message?.includes('Geolocation') || 
          err?.message?.includes('location') || 
          err?.code === 1 || // PERMISSION_DENIED
          err?.message?.includes('denied')) {
        // Location errors are not critical - app works with fallback
        errorMessage = null; // Don't show error state for location issues
        showToastError = false;
        console.info("Using default location settings - location access was denied or unavailable");
      } else if (err?.name === 'NetworkError' || err?.message?.includes('fetch')) {
        errorMessage = "Network connection issue. Please check your internet and try again.";
      } else if (err?.message?.includes('timeout')) {
        errorMessage = "Request timed out. Please try again.";
      } else if (err?.message?.includes('products') || err?.message?.includes('categories')) {
        errorMessage = "Unable to load product data. Please try again.";
      }
      
      // Only set error state for actual failures that affect functionality
      if (errorMessage) {
        setError(errorMessage);
      }
      
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

{/* Weather-Based Seasonal Products */}
      <ProductGrid 
        products={
          seasonalProducts.length > 0 
            ? seasonalProducts.slice(0, 8)
            : trendingProducts.length > 0 
            ? trendingProducts 
            : products.filter(p => p.badges?.includes("BESTSELLER")).slice(0, 8)
        }
        title={locationMessage}
        showLoadMore={false}
        initialCount={8}
      />

      {/* Recipe Bundles */}
      <RecipeBundles 
        bundles={recipeBundles}
        title="🍽️ Complete Recipe Bundles"
        subtitle="Everything you need for delicious homemade meals"
        showViewAll={true}
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