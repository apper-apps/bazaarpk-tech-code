import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Card from "@/components/atoms/Card";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import ApperIcon from "@/components/ApperIcon";
import SearchBar from "@/components/molecules/SearchBar";
import RecipeBundleCard from "@/components/organisms/RecipeBundleCard";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";
import Empty from "@/components/ui/Empty";
import { RecipeBundleService } from "@/services/api/RecipeBundleService";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/utils/cn";
import { formatPrice } from "@/utils/currency";

const RecipeBundlesPage = () => {
  const navigate = useNavigate();
  const showToast = useToast();

  // State
  const [bundles, setBundles] = useState([]);
  const [filteredBundles, setFilteredBundles] = useState([]);
const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [featuredFilter, setFeaturedFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(null);

  // Filter options
  const categories = ["all", "Pakistani", "Indian", "Chinese", "Italian", "Healthy", "Snacks", "Breakfast", "BBQ", "Desserts"];
  const difficultyLevels = ["all", "Easy", "Medium", "Hard"];

  // Load bundles
  const loadBundles = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await RecipeBundleService.getAll();
      setBundles(data || []);
      setFilteredBundles(data || []);
    } catch (err) {
      console.error("Error loading bundles:", err);
      setError("Failed to load recipe bundles");
      showToast.error("Failed to load recipe bundles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBundles();
  }, []);

// Filter bundles
  useEffect(() => {
    let filtered = [...bundles];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(bundle =>
        bundle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bundle.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bundle.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bundle.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(bundle => bundle.category === selectedCategory);
    }

    // Difficulty filter
    if (selectedDifficulty !== "all") {
      filtered = filtered.filter(bundle => bundle.difficulty === selectedDifficulty);
    }

    // Featured filter
    if (featuredFilter !== "all") {
      if (featuredFilter === "featured") {
        filtered = filtered.filter(bundle => bundle.featured);
      } else if (featuredFilter === "regular") {
        filtered = filtered.filter(bundle => !bundle.featured);
      }
    }

    setFilteredBundles(filtered);
  }, [bundles, searchQuery, selectedCategory, selectedDifficulty, featuredFilter]);

  // Delete bundle
  const handleDeleteBundle = async (bundleId) => {
    if (!confirm("Are you sure you want to delete this recipe bundle?")) {
      return;
    }

    try {
      setDeleteLoading(bundleId);
      await RecipeBundleService.delete(bundleId);
      setBundles(prev => prev.filter(b => b.Id !== bundleId));
      showToast.success("Recipe bundle deleted successfully");
    } catch (error) {
      console.error("Error deleting bundle:", error);
      showToast.error("Failed to delete recipe bundle");
    } finally {
      setDeleteLoading(null);
    }
  };

  // Edit bundle
  const handleEditBundle = (bundle) => {
    // For now, navigate to add page with bundle data
    navigate(`/admin/add-recipe-bundle?edit=${bundle.Id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-64 animate-pulse mb-8" />
          <Loading type="products" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Error
          title="Failed to load recipe bundles"
          message={error}
          onRetry={loadBundles}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-2">
              Recipe Bundles
            </h1>
            <p className="text-gray-600">
              Manage your recipe bundles and meal packages
            </p>
          </div>
          
          <Button
            onClick={() => navigate("/admin/add-recipe-bundle")}
            className="flex items-center gap-2"
            size="lg"
          >
            <ApperIcon name="Plus" className="w-5 h-5" />
            Add New Bundle
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <ApperIcon name="Package" className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Bundles</p>
                <p className="text-xl font-bold text-gray-900">{bundles.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <ApperIcon name="Star" className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Featured</p>
                <p className="text-xl font-bold text-gray-900">
                  {bundles.filter(b => b.featured).length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ApperIcon name="TrendingUp" className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg. Savings</p>
                <p className="text-xl font-bold text-gray-900">15%</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <ApperIcon name="ChefHat" className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Categories</p>
                <p className="text-xl font-bold text-gray-900">
                  {new Set(bundles.map(b => b.category)).size}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search bundles..."
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === "all" ? "All Categories" : category}
                  </option>
                ))}
              </select>
            </div>

<div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty
              </label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {difficultyLevels.map(level => (
                  <option key={level} value={level}>
                    {level === "all" ? "All Levels" : level}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Featured Status
              </label>
              <select
                value={featuredFilter}
                onChange={(e) => setFeaturedFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Bundles</option>
                <option value="featured">Featured Only</option>
                <option value="regular">Regular Bundles</option>
              </select>
            </div>
          </div>

{/* Active Filters */}
          {(searchQuery || selectedCategory !== "all" || selectedDifficulty !== "all" || featuredFilter !== "all") && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t">
              <span className="text-sm text-gray-600">Active filters:</span>
              
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm">
                  Search: {searchQuery}
                  <button onClick={() => setSearchQuery("")}>
                    <ApperIcon name="X" className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedCategory !== "all" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {selectedCategory}
                  <button onClick={() => setSelectedCategory("all")}>
                    <ApperIcon name="X" className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedDifficulty !== "all" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  {selectedDifficulty}
                  <button onClick={() => setSelectedDifficulty("all")}>
                    <ApperIcon name="X" className="w-3 h-3" />
                  </button>
                </span>
              )}

              {featuredFilter !== "all" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                  {featuredFilter === "featured" ? "Featured" : "Regular"}
                  <button onClick={() => setFeaturedFilter("all")}>
                    <ApperIcon name="X" className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                  setSelectedDifficulty("all");
                  setFeaturedFilter("all");
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear all
              </button>
            </div>
          )}
        </Card>

        {/* Results */}
        {filteredBundles.length === 0 ? (
          <Empty
            title="No recipe bundles found"
            message={bundles.length === 0 
              ? "Get started by creating your first recipe bundle"
              : "Try adjusting your search or filters"
            }
            action={
              bundles.length === 0 ? (
                <Button
                  onClick={() => navigate("/admin/add-recipe-bundle")}
                  className="flex items-center gap-2"
                >
                  <ApperIcon name="Plus" className="w-4 h-4" />
                  Create First Bundle
                </Button>
              ) : null
            }
          />
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                Showing {filteredBundles.length} of {bundles.length} bundles
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {filteredBundles.map((bundle) => (
                  <motion.div
                    key={bundle.Id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative group"
                  >
                    <RecipeBundleCard 
                      bundle={bundle}
                      className="h-full"
                    />
                    
                    {/* Admin Actions Overlay */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleEditBundle(bundle)}
                          className="bg-white shadow-lg"
                        >
                          <ApperIcon name="Edit" className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleDeleteBundle(bundle.Id)}
                          disabled={deleteLoading === bundle.Id}
                          className="bg-white shadow-lg text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {deleteLoading === bundle.Id ? (
                            <ApperIcon name="Loader2" className="w-4 h-4 animate-spin" />
                          ) : (
                            <ApperIcon name="Trash2" className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default RecipeBundlesPage;