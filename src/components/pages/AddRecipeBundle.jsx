import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ProductService } from "@/services/api/ProductService";
import { RecipeBundleService } from "@/services/api/RecipeBundleService";
import { useToast } from "@/hooks/useToast";
import ApperIcon from "@/components/ApperIcon";
import SearchBar from "@/components/molecules/SearchBar";
import PriceDisplay from "@/components/molecules/PriceDisplay";
import QuantitySelector from "@/components/molecules/QuantitySelector";
import Loading from "@/components/ui/Loading";
import Category from "@/components/pages/Category";
import Input from "@/components/atoms/Input";
import Button from "@/components/atoms/Button";
import Card from "@/components/atoms/Card";
import { cn } from "@/utils/cn";
import { calculateSavings, formatPrice } from "@/utils/currency";
import { announceToScreenReader } from "@/utils/security";

const AddRecipeBundle = () => {
  const navigate = useNavigate();
  const showToast = useToast();
  
  // Bundle Form State
  const [bundleData, setBundleData] = useState({
    name: "",
    description: "",
    image: "",
    category: "Pakistani",
    cookTime: "",
    servings: 4,
    difficulty: "Easy",
    featured: false
  });
  
  // Bundle Components State
  const [bundleComponents, setBundleComponents] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showProductSearch, setShowProductSearch] = useState(false);
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [isBundleEnabled, setIsBundleEnabled] = useState(true);

  // Categories and Difficulty Options
  const categories = ["Pakistani", "Indian", "Chinese", "Italian", "Healthy", "Snacks", "Breakfast", "BBQ", "Desserts"];
  const difficultyLevels = ["Easy", "Medium", "Hard"];

  // Load available products
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoadingProducts(true);
        const products = await ProductService.getAll();
        setAvailableProducts(products || []);
        setSearchResults(products?.slice(0, 10) || []);
      } catch (error) {
        console.error("Error loading products:", error);
        showToast.error("Failed to load products");
      } finally {
        setLoadingProducts(false);
      }
    };

    loadProducts();
  }, []);

  // Search products
  const handleProductSearch = (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults(availableProducts.slice(0, 10));
      return;
    }

    const filtered = availableProducts.filter(product =>
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.category?.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 10);
    
    setSearchResults(filtered);
  };

  // Add product to bundle
  const handleAddProduct = (product) => {
    const existingComponent = bundleComponents.find(c => c.product.Id === product.Id);
    
    if (existingComponent) {
      showToast.warning("Product already added to bundle");
      return;
    }

    const newComponent = {
      product,
      quantity: 1,
      unit: "pc"
    };

    setBundleComponents(prev => [...prev, newComponent]);
    setShowProductSearch(false);
    setSearchQuery("");
    showToast.success(`${product.name} added to bundle`);
  };

  // Remove product from bundle
  const handleRemoveProduct = (productId) => {
    setBundleComponents(prev => prev.filter(c => c.product.Id !== productId));
    showToast.success("Product removed from bundle");
  };

  // Update component quantity
  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveProduct(productId);
      return;
    }

    setBundleComponents(prev =>
      prev.map(c =>
        c.product.Id === productId
          ? { ...c, quantity: newQuantity }
          : c
      )
    );
  };

  // Update component unit
  const handleUnitChange = (productId, newUnit) => {
    setBundleComponents(prev =>
      prev.map(c =>
        c.product.Id === productId
          ? { ...c, unit: newUnit }
          : c
      )
    );
  };

  // Calculate bundle totals
  const calculateBundleTotals = () => {
    const totalOriginalPrice = bundleComponents.reduce(
      (sum, item) => sum + (item.product.oldPrice || item.product.price) * item.quantity, 
      0
    );
    
    const totalBundlePrice = bundleComponents.reduce(
      (sum, item) => sum + item.product.price * item.quantity, 
      0
    );
    
    const savings = calculateSavings(totalOriginalPrice, totalBundlePrice);
    
    return {
      originalPrice: totalOriginalPrice,
      bundlePrice: totalBundlePrice,
      savings
    };
  };

  const totals = calculateBundleTotals();

  // Handle form submission
const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Enhanced bundle validation with comprehensive checks
    const validationErrors = [];
    
    if (!isBundleEnabled) {
      showToast.error("Bundle creation is currently disabled in system settings");
      announceToScreenReader("Bundle creation is disabled", "assertive");
      return;
    }

    // Bundle name validation
    if (!bundleData.name?.trim()) {
      validationErrors.push("Bundle name is required and cannot be empty");
    } else if (bundleData.name.trim().length < 3) {
      validationErrors.push("Bundle name must be at least 3 characters long");
    } else if (bundleData.name.length > 100) {
      validationErrors.push("Bundle name cannot exceed 100 characters");
    }

    // Bundle description validation
    if (!bundleData.description?.trim()) {
      validationErrors.push("Bundle description is required to help customers understand the bundle");
    } else if (bundleData.description.length < 20) {
      validationErrors.push("Bundle description should be at least 20 characters for clarity");
    }

    // Bundle components validation
    if (bundleComponents.length === 0) {
      validationErrors.push("Add at least one product to create a bundle");
    } else if (bundleComponents.length < 2) {
      validationErrors.push("A bundle should contain at least 2 different products");
    } else if (bundleComponents.length > 20) {
      validationErrors.push("Bundle cannot contain more than 20 products for practical purposes");
    }

    // Individual component validation
    bundleComponents.forEach((component, index) => {
      if (!component.product) {
        validationErrors.push(`Product ${index + 1} is missing product information`);
      }
      if (!component.quantity || component.quantity < 1) {
        validationErrors.push(`Product ${index + 1} must have a quantity of at least 1`);
      }
      if (component.quantity > 100) {
        validationErrors.push(`Product ${index + 1} quantity seems excessive (max 100 per item)`);
      }
      if (!component.unit) {
        validationErrors.push(`Product ${index + 1} is missing unit specification`);
      }
    });

    // Bundle pricing validation
    const totalBundlePrice = bundleComponents.reduce((total, component) => {
      return total + (component.product.price * component.quantity);
    }, 0);

    if (!bundleData.price || bundleData.price <= 0) {
      validationErrors.push("Bundle price must be greater than 0");
    } else if (bundleData.price >= totalBundlePrice) {
      validationErrors.push("Bundle price should be less than individual item total to provide customer value");
    }

    // Bundle category validation
    if (!bundleData.category) {
      validationErrors.push("Bundle category is required for proper classification");
    }

    // Bundle image validation
    if (!bundleData.image) {
      validationErrors.push("Bundle image is required for customer appeal");
    }

    // Difficulty and time validation
    if (!bundleData.difficulty) {
      validationErrors.push("Difficulty level is required for customer guidance");
    }

    if (!bundleData.cookTime || bundleData.cookTime < 1) {
      validationErrors.push("Cooking/preparation time must be specified (minimum 1 minute)");
    } else if (bundleData.cookTime > 480) { // 8 hours
      validationErrors.push("Cooking time seems excessive (maximum 8 hours)");
    }

    // Servings validation
    if (!bundleData.servings || bundleData.servings < 1) {
      validationErrors.push("Number of servings must be at least 1");
    } else if (bundleData.servings > 50) {
      validationErrors.push("Number of servings seems excessive (maximum 50)");
    }

    // Display validation errors
    if (validationErrors.length > 0) {
      const errorMessage = `Bundle validation failed:\n• ${validationErrors.join('\n• ')}`;
      showToast.error(`${validationErrors.length} validation error${validationErrors.length > 1 ? 's' : ''} found`);
      announceToScreenReader(`Bundle validation failed with ${validationErrors.length} errors`, "assertive");
      
      // Log detailed errors for debugging
      console.group('🎯 Bundle Validation Errors');
      validationErrors.forEach((error, index) => {
        console.error(`${index + 1}. ${error}`);
      });
      console.groupEnd();
      
      return;
    }

    // Calculate savings amount
    const savingsAmount = totalBundlePrice - bundleData.price;
    const savingsPercentage = (savingsAmount / totalBundlePrice * 100).toFixed(1);

    announceToScreenReader(`Bundle validation successful. Customers will save PKR ${savingsAmount.toFixed(2)} (${savingsPercentage}%)`, "polite");

    try {
      setLoading(true);

      const newBundle = {
        ...bundleData,
        products: bundleComponents,
        totalPrice: totals.bundlePrice,
        originalPrice: totals.originalPrice,
        savings: totals.savings
      };

      await RecipeBundleService.create(newBundle);
      showToast.success("Recipe bundle created successfully!");
      navigate("/admin/recipe-bundles");
    } catch (error) {
      console.error("Error creating bundle:", error);
      showToast.error("Failed to create recipe bundle");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-2">
              Create Recipe Bundle
            </h1>
            <p className="text-gray-600">
              Design complete ingredient packages for delicious recipes
            </p>
          </div>
          
          <Button
            variant="outline"
            onClick={() => navigate("/admin/recipe-bundles")}
            className="flex items-center gap-2"
          >
            <ApperIcon name="ArrowLeft" className="w-4 h-4" />
            Back to Bundles
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Bundle Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Bundle Toggle */}
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Bundle Option
                    </h3>
                    <p className="text-sm text-gray-600">
                      Enable this recipe as a purchasable bundle
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsBundleEnabled(!isBundleEnabled)}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                      isBundleEnabled ? "bg-primary-500" : "bg-gray-300"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        isBundleEnabled ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>
                </div>
              </Card>

              {/* Basic Information */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Basic Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <Input
                    label="Bundle Name"
                    placeholder="e.g., Classic Chicken Biryani Bundle"
                    value={bundleData.name}
                    onChange={(e) => setBundleData(prev => ({
                      ...prev,
                      name: e.target.value
                    }))}
                    disabled={!isBundleEnabled}
                    required
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={bundleData.category}
                      onChange={(e) => setBundleData(prev => ({
                        ...prev,
                        category: e.target.value
                      }))}
                      disabled={!isBundleEnabled}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <Input
                    label="Description"
                    placeholder="Describe what makes this bundle special..."
                    value={bundleData.description}
                    onChange={(e) => setBundleData(prev => ({
                      ...prev,
                      description: e.target.value
                    }))}
                    disabled={!isBundleEnabled}
                    multiline
                    rows={3}
                  />
                </div>

                <Input
                  label="Image URL"
                  placeholder="https://example.com/bundle-image.jpg"
                  value={bundleData.image}
                  onChange={(e) => setBundleData(prev => ({
                    ...prev,
                    image: e.target.value
                  }))}
                  disabled={!isBundleEnabled}
                />
              </Card>

              {/* Bundle Details */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Recipe Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <Input
                    label="Preparation Time"
                    placeholder="e.g., 45 min"
                    value={bundleData.cookTime}
                    onChange={(e) => setBundleData(prev => ({
                      ...prev,
                      cookTime: e.target.value
                    }))}
                    disabled={!isBundleEnabled}
                  />
                  
                  <Input
                    label="Number of Servings"
                    type="number"
                    min="1"
                    max="20"
                    value={bundleData.servings}
                    onChange={(e) => setBundleData(prev => ({
                      ...prev,
                      servings: parseInt(e.target.value) || 1
                    }))}
                    disabled={!isBundleEnabled}
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Difficulty Level
                    </label>
                    <select
                      value={bundleData.difficulty}
                      onChange={(e) => setBundleData(prev => ({
                        ...prev,
                        difficulty: e.target.value
                      }))}
                      disabled={!isBundleEnabled}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {difficultyLevels.map(level => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={bundleData.featured}
                    onChange={(e) => setBundleData(prev => ({
                      ...prev,
                      featured: e.target.checked
                    }))}
                    disabled={!isBundleEnabled}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <label htmlFor="featured" className="ml-2 text-sm text-gray-700">
                    Mark as featured bundle
                  </label>
                </div>
              </Card>

              {/* Bundle Components Table */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Bundle Components ({bundleComponents.length} items)
                  </h3>
                  
                  <Button
                    type="button"
                    onClick={() => setShowProductSearch(true)}
                    disabled={!isBundleEnabled}
                    className="flex items-center gap-2"
                  >
                    <ApperIcon name="Plus" className="w-4 h-4" />
                    Add Product
                  </Button>
                </div>

                {/* Product Search Modal */}
                {showProductSearch && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold">Add Product to Bundle</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowProductSearch(false)}
                        >
                          <ApperIcon name="X" className="w-4 h-4" />
                        </Button>
                      </div>

                      <SearchBar
                        value={searchQuery}
                        onChange={handleProductSearch}
                        placeholder="Search products..."
                        className="mb-4"
                      />

                      <div className="max-h-96 overflow-y-auto space-y-2">
                        {loadingProducts ? (
                          <Loading type="products" />
                        ) : searchResults.length === 0 ? (
                          <p className="text-center text-gray-500 py-8">
                            No products found
                          </p>
                        ) : (
                          searchResults.map(product => (
                            <div
                              key={product.Id}
                              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                            >
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-12 h-12 object-cover rounded"
                                onError={(e) => {
                                  e.target.src = `https://images.unsplash.com/photo-1506617564039-2f3b650b7010?w=100&h=100&fit=crop`;
                                }}
                              />
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-900">{product.name}</h5>
                                <PriceDisplay
                                  price={product.price}
                                  oldPrice={product.oldPrice}
                                  size="sm"
                                />
                              </div>
                              <Button
                                onClick={() => handleAddProduct(product)}
                                size="sm"
                                disabled={bundleComponents.some(c => c.product.Id === product.Id)}
                              >
                                {bundleComponents.some(c => c.product.Id === product.Id) ? "Added" : "Add"}
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                )}

                {/* Components List */}
                {bundleComponents.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                    <ApperIcon name="Package" className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No products added yet</p>
                    <p className="text-sm text-gray-400">Click "Add Product" to start building your bundle</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bundleComponents.map((component, index) => (
                      <motion.div
                        key={component.product.Id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50"
                      >
                        <img
                          src={component.product.image}
                          alt={component.product.name}
                          className="w-16 h-16 object-cover rounded"
                          onError={(e) => {
                            e.target.src = `https://images.unsplash.com/photo-1506617564039-2f3b650b7010?w=100&h=100&fit=crop`;
                          }}
                        />
                        
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 mb-1">
                            {component.product.name}
                          </h5>
                          <PriceDisplay
                            price={component.product.price}
                            oldPrice={component.product.oldPrice}
                            size="sm"
                          />
                        </div>

                        <div className="flex items-center gap-3">
                          <QuantitySelector
                            quantity={component.quantity}
                            onQuantityChange={(newQuantity) => 
                              handleQuantityChange(component.product.Id, newQuantity)
                            }
                            min={0.1}
                            step={0.1}
                            size="sm"
                          />
                          
                          <select
                            value={component.unit}
                            onChange={(e) => handleUnitChange(component.product.Id, e.target.value)}
                            disabled={!isBundleEnabled}
                            className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
                          >
                            <option value="pc">pc</option>
                            <option value="kg">kg</option>
                            <option value="g">g</option>
                            <option value="l">l</option>
                            <option value="ml">ml</option>
                            <option value="pack">pack</option>
                            <option value="box">box</option>
                            <option value="bottle">bottle</option>
                            <option value="jar">jar</option>
                            <option value="bunch">bunch</option>
                            <option value="head">head</option>
                          </select>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveProduct(component.product.Id)}
                            disabled={!isBundleEnabled}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <ApperIcon name="Trash2" className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Right Column - Savings Calculator */}
            <div className="space-y-6">
              <Card className="p-6 sticky top-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <ApperIcon name="Calculator" className="w-5 h-5" />
                  Bundle Savings
                </h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Original Total:</span>
                    <span className="font-medium text-gray-500 line-through">
                      {formatPrice(totals.originalPrice)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Bundle Price:</span>
                    <span className="font-bold text-lg text-primary-600">
                      {formatPrice(totals.bundlePrice)}
                    </span>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-900 font-medium">Total Savings:</span>
                      <div className="text-right">
                        <div className="font-bold text-lg text-green-600">
                          {formatPrice(totals.originalPrice - totals.bundlePrice)}
                        </div>
                        {totals.originalPrice > 0 && (
                          <div className="text-sm text-green-600">
                            {totals.savings}% off
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
                    <div className="flex items-center gap-2 text-green-800">
                      <ApperIcon name="TrendingDown" className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Customers save {formatPrice(totals.originalPrice - totals.bundlePrice)} with this bundle!
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  type="submit"
                  disabled={loading || !isBundleEnabled || bundleComponents.length === 0}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <ApperIcon name="Loader2" className="w-5 h-5 mr-2 animate-spin" />
                      Creating Bundle...
                    </>
                  ) : (
                    <>
                      <ApperIcon name="Package" className="w-5 h-5 mr-2" />
                      Create Recipe Bundle
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/admin/recipe-bundles")}
                  className="w-full"
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRecipeBundle;