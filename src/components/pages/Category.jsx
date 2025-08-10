import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import ApperIcon from "@/components/ApperIcon";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import ProductCard from "@/components/organisms/ProductCard";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";
import Empty from "@/components/ui/Empty";
import productService from "@/services/api/ProductService";
import { CategoryService } from "@/services/api/CategoryService";
import { cn } from "@/utils/cn";

const Category = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter states
const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "featured");
  const [selectedTag, setSelectedTag] = useState(searchParams.get("tag") || "");
  const [featuredStatus, setFeaturedStatus] = useState(searchParams.get("featured") || "all");
  const [priceRange, setPriceRange] = useState({
    min: searchParams.get("minPrice") || "",
    max: searchParams.get("maxPrice") || ""
  });
  const [showFilters, setShowFilters] = useState(false);

const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [productsData, categoriesData] = await Promise.all([
        productService.getAll(),
        CategoryService.getAll()
      ]);

      setProducts(productsData);
      setCategories(categoriesData);

    } catch (err) {
      console.error("Error loading category data:", err);
      setError("Failed to load products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort products
useEffect(() => {
    let filtered = [...products];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        product.badges?.some(badge => badge.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(product =>
        product.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by tag/badge
    if (selectedTag && selectedTag !== "all") {
      filtered = filtered.filter(product =>
        product.badges?.includes(selectedTag) || 
        product.tags?.includes(selectedTag)
      );
    }

    // Filter by featured status
    if (featuredStatus && featuredStatus !== "all") {
      if (featuredStatus === "featured") {
        filtered = filtered.filter(product => 
          product.featured || 
          product.badges?.includes("BESTSELLER") ||
          product.badges?.includes("PREMIUM")
        );
      } else if (featuredStatus === "regular") {
        filtered = filtered.filter(product => 
          !product.featured && 
          !product.badges?.includes("BESTSELLER") &&
          !product.badges?.includes("PREMIUM")
        );
      }
    }

    // Filter by price range
    if (priceRange.min) {
      filtered = filtered.filter(product => product.price >= parseInt(priceRange.min));
    }
    if (priceRange.max) {
      filtered = filtered.filter(product => product.price <= parseInt(priceRange.max));
    }

    // Sort products with enhanced featured logic
    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "name":
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "newest":
        filtered.sort((a, b) => b.Id - a.Id);
        break;
      case "rating":
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "popularity":
        filtered.sort((a, b) => {
          const aPopularity = (a.badges?.length || 0) + (a.featured ? 5 : 0);
          const bPopularity = (b.badges?.length || 0) + (b.featured ? 5 : 0);
          return bPopularity - aPopularity;
        });
        break;
      case "discount":
        filtered.sort((a, b) => {
          const aDiscount = a.oldPrice ? ((a.oldPrice - a.price) / a.oldPrice) * 100 : 0;
          const bDiscount = b.oldPrice ? ((b.oldPrice - b.price) / b.oldPrice) * 100 : 0;
          return bDiscount - aDiscount;
        });
        break;
      default: // featured
        filtered.sort((a, b) => {
          const aScore = (a.featured ? 10 : 0) + 
                        (a.badges?.includes("BESTSELLER") ? 8 : 0) +
                        (a.badges?.includes("PREMIUM") ? 6 : 0) +
                        (a.badges?.includes("FRESH") ? 4 : 0) +
                        (a.badges?.includes("ORGANIC") ? 3 : 0);
          const bScore = (b.featured ? 10 : 0) + 
                        (b.badges?.includes("BESTSELLER") ? 8 : 0) +
                        (b.badges?.includes("PREMIUM") ? 6 : 0) +
                        (b.badges?.includes("FRESH") ? 4 : 0) +
                        (b.badges?.includes("ORGANIC") ? 3 : 0);
          return bScore - aScore;
        });
    }

    setFilteredProducts(filtered);
  }, [products, searchQuery, selectedCategory, selectedTag, featuredStatus, sortBy, priceRange]);

  // Update URL when filters change
useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set("category", selectedCategory);
    if (searchQuery) params.set("search", searchQuery);
    if (sortBy !== "featured") params.set("sort", sortBy);
    if (selectedTag && selectedTag !== "all") params.set("tag", selectedTag);
    if (featuredStatus && featuredStatus !== "all") params.set("featured", featuredStatus);
    if (priceRange.min) params.set("minPrice", priceRange.min);
    if (priceRange.max) params.set("maxPrice", priceRange.max);
    
    setSearchParams(params);
    
    // SEO: Update document title and meta description based on active filters
    let title = "Products";
    let description = "Browse our wide selection of quality products";
    
    if (selectedCategory) {
      title = `${selectedCategory} Products`;
      description = `Discover the best ${selectedCategory.toLowerCase()} products`;
    }
    
    if (selectedTag && selectedTag !== "all") {
      title += ` - ${selectedTag}`;
      description += ` featuring ${selectedTag.toLowerCase()} items`;
    }
    
    if (featuredStatus === "featured") {
      title += " - Featured";
      description += " - premium featured products";
    }
    
    if (searchQuery) {
      title = `Search: ${searchQuery}`;
      description = `Search results for "${searchQuery}"`;
    }
    
    document.title = `${title} | BazaarPK`;
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    }
    
  }, [selectedCategory, searchQuery, sortBy, selectedTag, featuredStatus, priceRange, setSearchParams]);

  useEffect(() => {
    loadData();
  }, []);

const handleClearFilters = () => {
    setSelectedCategory("");
    setSearchQuery("");
    setSortBy("featured");
    setSelectedTag("");
    setFeaturedStatus("all");
    setPriceRange({ min: "", max: "" });
    setSearchParams({});
    
    // Reset SEO elements
    document.title = "Products | BazaarPK";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', "Browse our wide selection of quality products");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-48 animate-pulse mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-16 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse" />
              ))}
            </div>
            <div className="lg:col-span-3">
              <Loading type="products" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Error
          title="Unable to load products"
          message={error}
          onRetry={loadData}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
              {selectedCategory ? `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Products` : "All Products"}
            </h1>
            <p className="text-gray-600">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
            </p>
          </div>

          {/* Mobile Filter Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden mt-4"
          >
            <ApperIcon name="Filter" className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className={cn(
            "space-y-6",
            "lg:block",
            showFilters ? "block" : "hidden"
          )}>
            <div className="bg-white rounded-xl shadow-soft p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-display font-semibold text-gray-900">
                  Filters
                </h2>
{(selectedCategory || searchQuery || sortBy !== "featured" || selectedTag || featuredStatus !== "all" || priceRange.min || priceRange.max) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="text-primary-600"
                  >
                    Clear All
                  </Button>
                )}
              </div>

              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Products
                </label>
                <Input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Categories</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  <button
                    onClick={() => setSelectedCategory("")}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg transition-colors duration-200",
                      !selectedCategory
                        ? "bg-primary-50 text-primary-700 font-medium"
                        : "text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    All Categories
                  </button>
                  {categories.map(category => (
                    <button
                      key={category.Id}
                      onClick={() => setSelectedCategory(category.name.toLowerCase())}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg transition-colors duration-200 flex items-center justify-between",
                        selectedCategory === category.name.toLowerCase()
                          ? "bg-primary-50 text-primary-700 font-medium"
                          : "text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      <span>{category.name}</span>
                      {category.productCount && (
                        <span className="text-xs text-gray-500">
                          {category.productCount}
</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tag Filter */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Filter by Tags</h3>
                <div className="space-y-2">
                  <select
                    value={selectedTag}
                    onChange={(e) => setSelectedTag(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                  >
                    <option value="">All Tags</option>
                    <option value="BESTSELLER">Bestseller</option>
                    <option value="PREMIUM">Premium</option>
                    <option value="FRESH">Fresh</option>
                    <option value="ORGANIC">Organic</option>
                    <option value="HALAL">Halal</option>
                    <option value="LIMITED">Limited Time</option>
                    <option value="DISCOUNT">On Sale</option>
                  </select>
                </div>
              </div>

              {/* Featured Status Filter */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Featured Status</h3>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="featuredStatus"
                      value="all"
                      checked={featuredStatus === "all"}
                      onChange={(e) => setFeaturedStatus(e.target.value)}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">All Products</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="featuredStatus"
                      value="featured"
                      checked={featuredStatus === "featured"}
                      onChange={(e) => setFeaturedStatus(e.target.value)}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Featured Only</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="featuredStatus"
                      value="regular"
                      checked={featuredStatus === "regular"}
                      onChange={(e) => setFeaturedStatus(e.target.value)}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Regular Products</span>
                  </label>
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Price Range</h3>
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                  />
                </div>
              </div>

              {/* Sort By */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Sort By</h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                >
                  <option value="featured">Featured</option>
                  <option value="popularity">Most Popular</option>
                  <option value="newest">Newest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name">Name: A to Z</option>
                  <option value="rating">Highest Rated</option>
                  <option value="discount">Best Deals</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {filteredProducts.length === 0 ? (
              <Empty
                title="No products found"
                message="We couldn't find any products matching your criteria. Try adjusting your filters or search terms."
                actionText="Clear Filters"
                onAction={handleClearFilters}
                icon="Search"
              />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
              >
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.Id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Category;