import React, { useEffect, useState } from "react";
import { useToast } from "@/hooks/useToast";
import { LocationService } from "@/services/api/LocationService";
import { CategoryService } from "@/services/api/CategoryService";
import ProductService from "@/services/api/ProductService";
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
  const [featuredProducts, setFeaturedProducts] = useState([]);
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

      // Import cache manager for cache-aware loading
      let cacheManager;
      try {
        const { default: cm } = await import('@/utils/cacheManager');
        cacheManager = cm;
      } catch (importError) {
        console.warn('Cache manager not available, using direct API calls');
      }

      // Get user location first with null check
      const location = await LocationService.getUserLocation();
      if (location) {
        setUserLocation(location);
        setWeatherData(location);
      }

      // Cache-aware data loading
      let categoriesData, productsData, trendingData, featuredData, recipeBundlesData;

      if (cacheManager) {
        // Try to get cached data first
        const cachedProducts = cacheManager.get('homepage_products');
        const cachedCategories = cacheManager.get('categories');
        const cachedFeatured = cacheManager.get('featured_products');
        const cachedTrending = cacheManager.get('trending_products');
        const cachedBundles = cacheManager.get('recipe_bundles');

        // If we have fresh cached data, use it; otherwise fetch from API
        const promises = [];
        
        if (cachedCategories) {
          categoriesData = cachedCategories;
          console.log('📦 Using cached categories');
        } else {
          promises.push(CategoryService.getAll().then(data => {
            categoriesData = data;
            cacheManager.set('categories', data, 10 * 60 * 1000); // 10 minutes
            return data;
          }));
        }

        if (cachedProducts) {
          productsData = cachedProducts;
          console.log('📦 Using cached homepage products');
        } else {
          promises.push(ProductService.getAll().then(data => {
            productsData = data;
            cacheManager.set('homepage_products', data, 5 * 60 * 1000); // 5 minutes
            return data;
          }));
        }

        if (cachedTrending) {
          trendingData = cachedTrending;
          console.log('📦 Using cached trending products');
        } else {
          promises.push(ProductService.getTrendingByLocation(location).then(data => {
            trendingData = data;
            cacheManager.set('trending_products', data, 5 * 60 * 1000);
            return data;
          }));
        }

        if (cachedFeatured) {
          featuredData = cachedFeatured;
          console.log('📦 Using cached featured products');
        } else {
          promises.push(ProductService.getFeaturedProducts().then(data => {
            featuredData = data;
            cacheManager.set('featured_products', data, 15 * 60 * 1000); // 15 minutes
            return data;
          }));
        }

        if (cachedBundles) {
          recipeBundlesData = cachedBundles;
          console.log('📦 Using cached recipe bundles');
        } else {
          promises.push(RecipeBundleService.getFeatured(6).then(data => {
            recipeBundlesData = data;
            cacheManager.set('recipe_bundles', data, 10 * 60 * 1000); // 10 minutes
            return data;
          }));
        }

        // Wait for any remaining API calls
        if (promises.length > 0) {
          await Promise.all(promises);
          console.log(`🔄 Fetched ${promises.length} fresh data sources`);
        }
      } else {
        // Fallback to direct API calls if cache manager is unavailable
        [categoriesData, productsData, trendingData, featuredData, recipeBundlesData] = await Promise.all([
          CategoryService.getAll(),
          ProductService.getAll(),
          ProductService.getTrendingByLocation(location),
          ProductService.getFeaturedProducts(),
          RecipeBundleService.getFeatured(6)
        ]);
      }

      setCategories(categoriesData);
      setProducts(productsData);
      setTrendingProducts(trendingData);
      setFeaturedProducts(featuredData);
      setRecipeBundles(recipeBundlesData);
      
      // Set seasonal products based on weather
      if (weatherData?.main?.temp) {
        const temp = weatherData.main.temp;
        const seasonal = temp > 25 ? 
          productsData.filter(p => ['beverages', 'frozen'].includes(p.category?.toLowerCase())) :
          productsData.filter(p => ['hot-foods', 'snacks'].includes(p.category?.toLowerCase()));
        setSeasonalProducts(seasonal);
        
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
      
      // Enhanced error handling with browser compatibility and categorized messaging
      let errorMessage = "Failed to load page content. Please try again.";
      let showToastError = true;
      let errorCategory = 'unknown';
      
      // Browser compatibility detection
      const userAgent = navigator.userAgent;
      const isOldBrowser = (
        (userAgent.includes('Chrome') && parseInt(userAgent.match(/Chrome\/(\d+)/)?.[1] || '0') < 60) ||
        (userAgent.includes('Firefox') && parseInt(userAgent.match(/Firefox\/(\d+)/)?.[1] || '0') < 55) ||
        (userAgent.includes('Safari') && !userAgent.includes('Chrome') && parseInt(userAgent.match(/Version\/(\d+)/)?.[1] || '0') < 11)
      );
      
      // Handle specific error types with improved categorization
      if (err?.message?.includes('Geolocation') || 
          err?.message?.includes('location') || 
          err?.code === 1 || // PERMISSION_DENIED
          err?.message?.includes('denied')) {
        // Location errors are not critical - app works with fallback
        errorMessage = null; // Don't show error state for location issues
        showToastError = false;
        errorCategory = 'location_permission';
        console.info("Using default location settings - location access was denied or unavailable");
        
      } else if (err?.name === 'NetworkError' || err?.message?.includes('fetch')) {
        errorCategory = 'network';
        if (navigator.onLine === false) {
          errorMessage = "You appear to be offline. Please check your internet connection and try again.";
        } else {
          errorMessage = "Network connection issue. Please check your internet and try again.";
        }
        
      } else if (err?.message?.includes('timeout')) {
        errorCategory = 'timeout';
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
          errorMessage = "Request timed out. Mobile connections may be slower. Please try again.";
        } else {
          errorMessage = "Request timed out. Please try again.";
        }
        
      } else if (err?.message?.includes('products') || err?.message?.includes('categories')) {
        errorCategory = 'data_loading';
        errorMessage = "Unable to load product data. Please try again.";
        
      } else if (err?.message?.includes('localStorage') || err?.message?.includes('storage')) {
        errorCategory = 'storage';
        errorMessage = "Browser storage issue. Please enable cookies and refresh the page.";
        
      } else if (isOldBrowser) {
        errorCategory = 'browser_compatibility';
        errorMessage = "Your browser may not be fully supported. Please update your browser or try Chrome, Firefox, or Safari.";
        
      } else if (err?.message?.includes('CORS')) {
        errorCategory = 'cors';
        errorMessage = "Cross-origin request blocked. This may be a browser security setting.";
        
      } else if (err?.message?.includes('Script')) {
        errorCategory = 'script_loading';
        errorMessage = "Resource loading failed. Please refresh the page and try again.";
      }
      
      // Log detailed error information for analytics
      console.group('🏠 Home Page Load Error');
      console.error('Error details:', {
        category: errorCategory,
        message: err?.message || 'Unknown error',
        stack: err?.stack,
        userAgent: navigator.userAgent,
        online: navigator.onLine,
        timestamp: new Date().toISOString(),
        url: window.location.href
      });
      console.groupEnd();
      
      // Track errors in analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'home_load_error', {
          error_category: errorCategory,
          error_message: err?.message || 'Unknown error',
          browser_name: userAgent.includes('Chrome') ? 'Chrome' : 
                       userAgent.includes('Firefox') ? 'Firefox' : 
                       userAgent.includes('Safari') ? 'Safari' : 'Other',
          is_mobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
          is_online: navigator.onLine
        });
      }
      
      // Only set error state for actual failures that affect functionality
      if (errorMessage) {
        setError(errorMessage);
      }
      
      // Show toast error only for actual failures that affect functionality
      if (showToastError) {
        let toastMessage = "Failed to load products. Please check your connection and try again.";
        
        // Customize toast message based on error category
        switch (errorCategory) {
          case 'network':
            toastMessage = navigator.onLine === false ? 
              "You're offline. Please check your internet connection." :
              "Network error. Please check your connection and try again.";
            break;
          case 'browser_compatibility':
            toastMessage = "Browser compatibility issue. Please update your browser.";
            break;
          case 'timeout':
            toastMessage = "Loading timed out. Please try again.";
            break;
          default:
            toastMessage = "Failed to load products. Please try again.";
        }
        
        showToast.error(toastMessage);
      }
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
    loadData();
    
    // Listen for cache invalidation events from other tabs/admin actions
    let unsubscribe;
    try {
      import('@/utils/cacheManager').then(({ default: cacheManager }) => {
        unsubscribe = cacheManager.onInvalidation((data) => {
          console.log('🔄 Cache invalidated, refreshing home data:', data);
          // Reload data when cache is invalidated by admin actions
          loadData();
        });
      }).catch(error => {
        console.warn('Could not set up cache invalidation listener:', error);
      });
    } catch (error) {
      console.warn('Cache manager not available for event listening:', error);
    }

    // Listen for direct product cache invalidation events (from admin actions)
    const handleProductCacheInvalidate = (event) => {
      const { type, timestamp, productId, cacheHeaders } = event.detail;
      
      console.log('🏠 Homepage received cache invalidation:', {
        type,
        productId,
        timestamp: new Date(timestamp).toISOString(),
        cacheHeaders
      });
      
      // Set cache headers to ensure fresh content
      if (cacheHeaders && typeof document !== 'undefined') {
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Cache-Control';
        meta.content = cacheHeaders['Cache-Control'];
        document.getElementsByTagName('head')[0].appendChild(meta);
        
        // Remove after applying
        setTimeout(() => {
          if (meta.parentNode) {
            meta.parentNode.removeChild(meta);
          }
        }, 1000);
      }
      
      // Reload data immediately for homepage refresh
      console.log('🔄 Reloading homepage data due to product approval/publication');
      loadData();
    };

    window.addEventListener('product-cache-invalidate', handleProductCacheInvalidate);
    
    return () => {
      if (unsubscribe) unsubscribe();
      window.removeEventListener('product-cache-invalidate', handleProductCacheInvalidate);
    };
  }, []);

if (loading) {
    return (
      <div className="min-h-screen bg-background" role="main" aria-live="polite" aria-busy="true">
        {/* Screen reader announcement */}
        <div className="sr-only">Loading homepage content, please wait...</div>
        
        {/* Hero Banner Skeleton */}
        <div 
          className="h-64 md:h-80 lg:h-96 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse rounded-2xl mx-4 mt-4 md:mx-6 lg:mx-8"
          aria-label="Loading hero banner"
        />
        
        {/* Categories Skeleton */}
        <div className="px-4 md:px-6 lg:px-8 mt-8 mb-8">
          <div 
            className="h-8 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-48 animate-pulse mb-6"
            aria-label="Loading categories section"
          />
          <Loading type="categories" aria-label="Loading product categories" />
        </div>
        
        {/* Products Skeleton */}
        <div className="px-4 md:px-6 lg:px-8">
          <div 
            className="h-8 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-56 animate-pulse mb-8"
            aria-label="Loading products section"
          />
          <Loading type="products" aria-label="Loading featured products" />
        </div>

        {/* Additional loading states for better UX */}
        <div className="px-4 md:px-6 lg:px-8 mt-8 mb-8">
          {/* Deals Section Skeleton */}
          <div 
            className="h-8 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-32 animate-pulse mb-6"
            aria-label="Loading deals section"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white rounded-xl shadow-soft p-4 animate-pulse">
                <div className="h-32 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded mb-4" />
                <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded mb-2" />
                <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" role="main">
        <Error
          title="Unable to load homepage"
          message={error}
          onRetry={loadData}
          showRetry={true}
          variant="card"
          className="max-w-md mx-4"
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
        products={featuredProducts}
        title="⭐ Featured Products"
        showLoadMore={true}
        initialCount={12}
        onProductsUpdate={(updateInfo) => {
          console.log('🔄 Featured products update requested:', updateInfo);
          loadData(); // Refresh all data when products are updated
        }}
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