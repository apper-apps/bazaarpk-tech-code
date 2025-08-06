import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import ApperIcon from "@/components/ApperIcon";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import Card from "@/components/atoms/Card";
import { useToast } from "@/hooks/useToast";
import { CategoryService } from "@/services/api/CategoryService";
import { ProductService } from "@/services/api/ProductService";
import { cn } from "@/utils/cn";
import { formatPrice } from "@/utils/currency";

const AddProduct = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  // Tab state
  const [activeTab, setActiveTab] = useState("basic");
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    brand: "",
    category: "",
    subcategory: "",
    description: "",
    shortDescription: "",
    sellingPrice: "",
    buyingPrice: "",
    discountedPrice: "",
    stockStatus: "In Stock",
    stockQuantity: "",
    sku: "",
    mainImage: null,
    shippingFreeThreshold: "1000",
    visibility: "draft"
  });
  
  // UI state
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await CategoryService.getAll();
        setCategories(categoriesData);
      } catch (error) {
        console.error("Failed to load categories:", error);
        showToast("Failed to load categories", "error");
      }
    };
    loadCategories();
  }, [showToast]);

  // Load subcategories when category changes
  useEffect(() => {
    if (formData.category) {
      const selectedCategory = categories.find(cat => cat.name === formData.category);
      if (selectedCategory && selectedCategory.subcategories) {
        setSubcategories(selectedCategory.subcategories);
      } else {
        setSubcategories([]);
      }
      // Reset subcategory when category changes
      setFormData(prev => ({ ...prev, subcategory: "" }));
    }
  }, [formData.category, categories]);

  // Calculated values
  const sellingPrice = parseFloat(formData.sellingPrice) || 0;
  const buyingPrice = parseFloat(formData.buyingPrice) || 0;
  const discountedPrice = parseFloat(formData.discountedPrice) || 0;
  
  const profit = sellingPrice - buyingPrice;
  const profitMargin = buyingPrice > 0 ? ((profit / buyingPrice) * 100) : 0;
  const discountPercentage = sellingPrice > 0 && discountedPrice > 0 && discountedPrice < sellingPrice 
    ? (((sellingPrice - discountedPrice) / sellingPrice) * 100) 
    : 0;

  const tabs = [
    { id: "basic", label: "Basic Information", icon: "Info" },
    { id: "pricing", label: "Pricing", icon: "DollarSign" },
    { id: "inventory", label: "Inventory", icon: "Package" },
    { id: "media", label: "Media", icon: "Image" },
    { id: "shipping", label: "Shipping & Settings", icon: "Truck" }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleImageUpload = (file) => {
    if (file && file.type.startsWith('image/')) {
      setFormData(prev => ({ ...prev, mainImage: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
      
      showToast("Image uploaded successfully", "success");
    } else {
      showToast("Please select a valid image file", "error");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    handleImageUpload(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Basic Information validation
    if (!formData.title.trim()) newErrors.title = "Product name is required";
    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    
    // Pricing validation
    if (!formData.sellingPrice || sellingPrice <= 0) {
      newErrors.sellingPrice = "Selling price must be greater than 0";
    }
    if (formData.buyingPrice && buyingPrice >= sellingPrice) {
      newErrors.buyingPrice = "Buying price must be less than selling price";
    }
    if (formData.discountedPrice && (discountedPrice <= 0 || discountedPrice >= sellingPrice)) {
      newErrors.discountedPrice = "Discounted price must be between 0 and selling price";
    }
    
    // Inventory validation
    if (!formData.stockQuantity || parseInt(formData.stockQuantity) < 0) {
      newErrors.stockQuantity = "Stock quantity must be 0 or greater";
    }
    if (!formData.sku.trim()) newErrors.sku = "SKU is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (publish = false) => {
    if (!validateForm()) {
      showToast("Please fix the errors before saving", "error");
      return;
    }

    setLoading(true);
    try {
      const productData = {
        ...formData,
        visibility: publish ? "published" : "draft",
        price: sellingPrice,
        oldPrice: discountedPrice > 0 ? sellingPrice : null,
        discountedPrice: discountedPrice > 0 ? discountedPrice : null,
        stock: parseInt(formData.stockQuantity),
        images: formData.mainImage ? [URL.createObjectURL(formData.mainImage)] : [],
        badges: [],
        variants: []
      };

      await ProductService.create(productData);
      
      showToast(
        `Product ${publish ? 'published' : 'saved as draft'} successfully!`, 
        "success"
      );
      
      // Reset form or navigate
      if (publish) {
        navigate("/category");
      } else {
        // Reset form for another product
        setFormData({
          title: "",
          brand: "",
          category: "",
          subcategory: "",
          description: "",
          shortDescription: "",
          sellingPrice: "",
          buyingPrice: "",
          discountedPrice: "",
          stockStatus: "In Stock",
          stockQuantity: "",
          sku: "",
          mainImage: null,
          shippingFreeThreshold: "1000",
          visibility: "draft"
        });
        setImagePreview(null);
        setActiveTab("basic");
      }
    } catch (error) {
      console.error("Error saving product:", error);
      showToast("Failed to save product", "error");
    } finally {
      setLoading(false);
    }
  };

  const renderBasicInfo = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product Name *
        </label>
        <Input
          type="text"
          placeholder="e.g., Premium Basmati Rice"
          value={formData.title}
          onChange={(e) => handleInputChange("title", e.target.value)}
          className={cn(errors.title && "border-red-500")}
        />
        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Brand/Manufacturer
        </label>
        <Input
          type="text"
          placeholder="e.g., Shan, National, etc."
          value={formData.brand}
          onChange={(e) => handleInputChange("brand", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <select
            value={formData.category}
            onChange={(e) => handleInputChange("category", e.target.value)}
            className={cn(
              "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
              errors.category && "border-red-500"
            )}
          >
            <option value="">Select Category</option>
            {categories.map((category) => (
              <option key={category.Id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subcategory
          </label>
          <select
            value={formData.subcategory}
            onChange={(e) => handleInputChange("subcategory", e.target.value)}
            disabled={!formData.category || subcategories.length === 0}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
          >
            <option value="">Select Subcategory</option>
            {subcategories.map((subcategory, index) => (
              <option key={index} value={subcategory}>
                {subcategory}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description *
        </label>
        <textarea
          rows={4}
          placeholder="Detailed product description..."
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          className={cn(
            "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none",
            errors.description && "border-red-500"
          )}
        />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Short Description
        </label>
        <textarea
          rows={2}
          placeholder="Brief highlights..."
          value={formData.shortDescription}
          onChange={(e) => handleInputChange("shortDescription", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
        />
      </div>
    </div>
  );

  const renderPricing = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selling Price (Rs) *
          </label>
          <Input
            type="number"
            placeholder="0"
            value={formData.sellingPrice}
            onChange={(e) => handleInputChange("sellingPrice", e.target.value)}
            className={cn(errors.sellingPrice && "border-red-500")}
          />
          {errors.sellingPrice && <p className="text-red-500 text-sm mt-1">{errors.sellingPrice}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Buying Price (Rs)
          </label>
          <Input
            type="number"
            placeholder="0"
            value={formData.buyingPrice}
            onChange={(e) => handleInputChange("buyingPrice", e.target.value)}
            className={cn(errors.buyingPrice && "border-red-500")}
          />
          {errors.buyingPrice && <p className="text-red-500 text-sm mt-1">{errors.buyingPrice}</p>}
        </div>
      </div>

      {/* Profit Calculation Display */}
      {buyingPrice > 0 && sellingPrice > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-800 mb-2">Profit Analysis</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Profit: </span>
              <span className={cn(
                "font-semibold",
                profit >= 0 ? "text-green-700" : "text-red-700"
              )}>
                {formatPrice(profit)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Margin: </span>
              <span className={cn(
                "font-semibold",
                profitMargin >= 0 ? "text-green-700" : "text-red-700"
              )}>
                {profitMargin.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Discounted Price (Rs)
        </label>
        <Input
          type="number"
          placeholder="Optional"
          value={formData.discountedPrice}
          onChange={(e) => handleInputChange("discountedPrice", e.target.value)}
          className={cn(errors.discountedPrice && "border-red-500")}
        />
        {errors.discountedPrice && <p className="text-red-500 text-sm mt-1">{errors.discountedPrice}</p>}
      </div>

      {/* Discount Display */}
      {discountPercentage > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h4 className="font-medium text-orange-800 mb-2">Discount Information</h4>
          <div className="text-sm">
            <span className="text-gray-600">Discount: </span>
            <span className="font-semibold text-orange-700">
              {discountPercentage.toFixed(1)}% off
            </span>
            <span className="text-gray-600 ml-2">
              (Save {formatPrice(sellingPrice - discountedPrice)})
            </span>
          </div>
        </div>
      )}
    </div>
  );

  const renderInventory = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Stock Status
        </label>
        <select
          value={formData.stockStatus}
          onChange={(e) => handleInputChange("stockStatus", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="In Stock">In Stock</option>
          <option value="Out of Stock">Out of Stock</option>
          <option value="Pre-order">Pre-order</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Stock Quantity *
        </label>
        <Input
          type="number"
          placeholder="0"
          value={formData.stockQuantity}
          onChange={(e) => handleInputChange("stockQuantity", e.target.value)}
          className={cn(errors.stockQuantity && "border-red-500")}
        />
        {errors.stockQuantity && <p className="text-red-500 text-sm mt-1">{errors.stockQuantity}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          SKU (Stock Keeping Unit) *
        </label>
        <Input
          type="text"
          placeholder="e.g., BR-001, VEG-TOM-001"
          value={formData.sku}
          onChange={(e) => handleInputChange("sku", e.target.value)}
          className={cn(errors.sku && "border-red-500")}
        />
        {errors.sku && <p className="text-red-500 text-sm mt-1">{errors.sku}</p>}
      </div>
    </div>
  );

  const renderMedia = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Main Product Image
        </label>
        
        {/* Image Upload Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200",
            isDragOver 
              ? "border-primary-500 bg-primary-50" 
              : "border-gray-300 hover:border-primary-400"
          )}
        >
          {imagePreview ? (
            <div className="space-y-4">
              <img
                src={imagePreview}
                alt="Product preview"
                className="mx-auto max-h-48 object-contain rounded-lg"
              />
              <div className="flex justify-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setImagePreview(null);
                    setFormData(prev => ({ ...prev, mainImage: null }));
                  }}
                >
                  <ApperIcon name="Trash2" className="w-4 h-4 mr-2" />
                  Remove
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('imageInput').click()}
                >
                  <ApperIcon name="Upload" className="w-4 h-4 mr-2" />
                  Change
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <ApperIcon name="Upload" className="w-12 h-12 text-gray-400 mx-auto" />
              <div>
                <p className="text-gray-600">
                  Drop your image here, or{" "}
                  <button
                    type="button"
                    onClick={() => document.getElementById('imageInput').click()}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    browse
                  </button>
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  PNG, JPG, JPEG up to 5MB
                </p>
              </div>
            </div>
          )}
        </div>
        
        <input
          id="imageInput"
          type="file"
          accept="image/*"
          onChange={(e) => handleImageUpload(e.target.files[0])}
          className="hidden"
        />
      </div>
    </div>
  );

  const renderShipping = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Free Shipping Threshold (Rs)
        </label>
        <Input
          type="number"
          placeholder="1000"
          value={formData.shippingFreeThreshold}
          onChange={(e) => handleInputChange("shippingFreeThreshold", e.target.value)}
        />
        <p className="text-sm text-gray-500 mt-1">
          Orders above this amount will get free shipping
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Visibility
        </label>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="radio"
              name="visibility"
              value="draft"
              checked={formData.visibility === "draft"}
              onChange={(e) => handleInputChange("visibility", e.target.value)}
              className="mr-3"
            />
            <div>
              <div className="font-medium">Draft</div>
              <div className="text-sm text-gray-500">
                Save as draft for later editing
              </div>
            </div>
          </label>
          
          <label className="flex items-center">
            <input
              type="radio"
              name="visibility"
              value="published"
              checked={formData.visibility === "published"}
              onChange={(e) => handleInputChange("visibility", e.target.value)}
              className="mr-3"
            />
            <div>
              <div className="font-medium">Published</div>
              <div className="text-sm text-gray-500">
                Make product visible to customers
              </div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "basic": return renderBasicInfo();
      case "pricing": return renderPricing();
      case "inventory": return renderInventory();
      case "media": return renderMedia();
      case "shipping": return renderShipping();
      default: return renderBasicInfo();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                <button onClick={() => navigate("/")} className="hover:text-primary-600">
                  Home
                </button>
                <ApperIcon name="ChevronRight" className="w-4 h-4" />
                <span className="text-gray-900 font-medium">Add Product</span>
              </nav>
              
              <h1 className="text-3xl font-display font-bold text-gray-900">
                Add New Product
              </h1>
              <p className="text-gray-600 mt-2">
                Create a comprehensive product listing with all details
              </p>
            </div>
          </div>
        </div>

        <Card className="overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200",
                    activeTab === tab.id
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  )}
                >
                  <ApperIcon name={tab.icon} className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderTabContent()}
            </motion.div>
          </div>

          {/* Action Buttons */}
          <div className="border-t border-gray-200 px-6 py-4">
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                <ApperIcon name="ArrowLeft" className="w-4 h-4 mr-2" />
                Cancel
              </Button>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => handleSave(false)}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <ApperIcon name="Loader2" className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <ApperIcon name="Save" className="w-4 h-4 mr-2" />
                      Save as Draft
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => handleSave(true)}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <ApperIcon name="Loader2" className="w-4 h-4 mr-2 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <ApperIcon name="Upload" className="w-4 h-4 mr-2" />
                      Publish Now
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AddProduct;