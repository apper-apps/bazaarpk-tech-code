import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/useToast";
import { CategoryService } from "@/services/api/CategoryService";
import { ProductService } from "@/services/api/ProductService";
import ApperIcon from "@/components/ApperIcon";
import Home from "@/components/pages/Home";
import Category from "@/components/pages/Category";
import Badge from "@/components/atoms/Badge";
import Input from "@/components/atoms/Input";
import Button from "@/components/atoms/Button";
import Card from "@/components/atoms/Card";
import { cn } from "@/utils/cn";
import { formatPrice } from "@/utils/currency";

const AddProduct = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const isInAdminDashboard = location.pathname.startsWith('/admin/');
  
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
    barcode: "",
    mainImage: null,
    additionalImages: [],
    tags: [],
    includeInDeals: false,
    shippingFreeThreshold: "1000",
    returnPolicy: "7-day",
    visibility: "draft",
    moderatorApproved: false,
    requiresApproval: true,
    metaTitle: "",
    metaDescription: "",
    seoKeywords: []
  });

  // Admin/Moderator permissions
  const [currentUser] = useState({
    role: 'admin', // admin, moderator
    permissions: {
      canPublish: true,
      canSchedule: true,
      canApprove: true,
      canBypassApproval: true
    }
  });
  
// UI state
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [lastSaved, setLastSaved] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // Available tags/labels
  const availableTags = [
    "FLASH", "FRESH", "PREMIUM", "BESTSELLER", "DESI", "VEGAN", 
    "GLUTEN-FREE", "HOT 🔥", "BEST", "PERFECT", "HEALTHY", "DOMESTIC",
    "LIMITED STOCK", "BEST OFFER", "PERFECT DEAL", "NEW", "LATEST",
    "SUPER", "OFFICIAL", "ORIGINAL", "HURRY UP", "HALAL", "ORGANIC",
    "DEAL OF THE DAY"
  ];
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

  // Autosave functionality
  useEffect(() => {
    if (unsavedChanges && formData.title) {
      const autoSaveTimer = setTimeout(() => {
        handleAutoSave();
      }, 30000); // Autosave every 30 seconds
      
      return () => clearTimeout(autoSaveTimer);
    }
  }, [formData, unsavedChanges]);

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
    { id: "pricing", label: "Pricing & Variants", icon: "DollarSign" },
    { id: "inventory", label: "Inventory & Stock", icon: "Package" },
    { id: "marketing", label: "Marketing & Deals", icon: "Tag" },
    { id: "media", label: "Media Gallery", icon: "Image" },
    { id: "shipping", label: "Shipping & Policies", icon: "Truck" },
    { id: "seo", label: "SEO Settings", icon: "Search" },
    { id: "approval", label: "Approval Settings", icon: "Shield" }
  ];

const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setUnsavedChanges(true);
    
    // Auto-generate SKU if title changes
    if (field === 'title' && value) {
      const autoSku = `${formData.category?.substring(0,3).toUpperCase() || 'PRD'}-${value.substring(0,3).toUpperCase()}-${Date.now().toString().slice(-3)}`;
      if (!formData.sku) {
        setFormData(prev => ({ ...prev, sku: autoSku }));
      }
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleAutoSave = async () => {
    try {
      await handleSave(false, true); // silent save
      setUnsavedChanges(false);
      setLastSaved(new Date());
      showToast("Changes saved automatically", "info");
    } catch (error) {
      console.error("Autosave failed:", error);
    }
  };

  const getCompletionPercentage = () => {
    const requiredFields = ['title', 'category', 'description', 'sellingPrice', 'stockQuantity', 'sku'];
    const optionalFields = ['brand', 'shortDescription', 'buyingPrice', 'mainImage'];
    
    const requiredCompleted = requiredFields.filter(field => formData[field]).length;
    const optionalCompleted = optionalFields.filter(field => formData[field]).length;
    
    const requiredWeight = 0.7;
    const optionalWeight = 0.3;
    
    const requiredScore = (requiredCompleted / requiredFields.length) * requiredWeight;
    const optionalScore = (optionalCompleted / optionalFields.length) * optionalWeight;
    
    return Math.round((requiredScore + optionalScore) * 100);
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

const handleSave = async (publish = false, silent = false, schedule = null) => {
    if (!validateForm() && !silent) {
      showToast("Please fix the errors before saving", "error");
      return;
    }

    setLoading(true);
    try {
      let visibility = 'draft';
      let requiresApproval = formData.requiresApproval;
      
      if (publish) {
        if (currentUser.permissions.canBypassApproval || currentUser.role === 'admin') {
          visibility = 'published';
          requiresApproval = false;
        } else {
          visibility = 'pending';
          requiresApproval = true;
        }
      }

      const productData = {
        ...formData,
        visibility,
        requiresApproval,
        moderatorApproved: currentUser.permissions.canBypassApproval,
        scheduledPublish: schedule,
        price: sellingPrice,
        oldPrice: discountedPrice > 0 ? sellingPrice : null,
        discountedPrice: discountedPrice > 0 ? discountedPrice : null,
        stock: parseInt(formData.stockQuantity),
        images: [
          ...(formData.mainImage ? [URL.createObjectURL(formData.mainImage)] : []),
          ...formData.additionalImages.map(img => img.preview)
        ],
        badges: formData.tags,
        variants: [],
        barcode: formData.barcode,
        returnPolicy: formData.returnPolicy,
        includeInDeals: formData.includeInDeals,
        seo: {
          metaTitle: formData.metaTitle || formData.title,
          metaDescription: formData.metaDescription || formData.shortDescription,
          keywords: formData.seoKeywords
        },
        createdBy: currentUser.role,
        createdAt: new Date(),
        lastModified: new Date()
      };

      await ProductService.create(productData);
      
      if (!silent) {
        let message = 'Product saved as draft successfully!';
        if (publish) {
          if (requiresApproval) {
            message = 'Product submitted for approval successfully!';
          } else {
            message = 'Product published successfully!';
          }
        }
        if (schedule) {
          message = `Product scheduled for ${schedule} successfully!`;
        }
        
        showToast(message, "success");
      }
      
      setUnsavedChanges(false);
      setLastSaved(new Date());
      
      // Reset form or navigate
      if (publish && !requiresApproval) {
        navigate("/admin/products");
      } else if (!silent) {
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
          barcode: "",
          mainImage: null,
          additionalImages: [],
          tags: [],
          includeInDeals: false,
          shippingFreeThreshold: "1000",
          returnPolicy: "7-day",
          visibility: "draft",
          moderatorApproved: false,
          requiresApproval: true,
          metaTitle: "",
          metaDescription: "",
          seoKeywords: []
        });
        setImagePreview(null);
        setActiveTab("basic");
      }
    } catch (error) {
      console.error("Error saving product:", error);
      if (!silent) {
        showToast("Failed to save product", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  // SEO Tab Render Function
  const renderSEO = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Meta Title
        </label>
        <Input
          value={formData.metaTitle}
          onChange={(e) => handleInputChange('metaTitle', e.target.value)}
          placeholder="SEO-friendly title (60 characters max)"
          maxLength={60}
        />
        <p className="text-xs text-gray-500 mt-1">
          {formData.metaTitle.length}/60 characters
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Meta Description
        </label>
        <textarea
          value={formData.metaDescription}
          onChange={(e) => handleInputChange('metaDescription', e.target.value)}
          placeholder="Brief description for search engines (160 characters max)"
          maxLength={160}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          {formData.metaDescription.length}/160 characters
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          SEO Keywords (comma-separated)
        </label>
        <Input
          value={formData.seoKeywords.join(', ')}
          onChange={(e) => handleInputChange('seoKeywords', e.target.value.split(',').map(k => k.trim()))}
          placeholder="keyword1, keyword2, keyword3"
        />
      </div>
    </div>
  );

  // Approval Settings Tab Render Function
  const renderApproval = () => (
    <div className="space-y-6">
      {currentUser.role === 'admin' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <ApperIcon name="Shield" className="w-5 h-5 text-blue-600 mr-2" />
            <span className="font-medium text-blue-900">Administrator Settings</span>
          </div>
          <p className="text-blue-700 text-sm mt-1">
            As an administrator, you can bypass approval workflows and publish directly.
          </p>
        </div>
      )}

      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.requiresApproval}
            onChange={(e) => handleInputChange('requiresApproval', e.target.checked)}
            disabled={currentUser.permissions.canBypassApproval}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm font-medium text-gray-700">
            Requires moderator approval
          </span>
        </label>
        <p className="text-xs text-gray-500 mt-1">
          {currentUser.permissions.canBypassApproval 
            ? "Admin users can publish directly without approval"
            : "Product will need approval before going live"
          }
        </p>
      </div>

      {(currentUser.role === 'admin' || currentUser.role === 'moderator') && (
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.moderatorApproved}
              onChange={(e) => handleInputChange('moderatorApproved', e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Pre-approve this product
            </span>
          </label>
          <p className="text-xs text-gray-500 mt-1">
            Skip the approval workflow for this product
          </p>
        </div>
      )}
    </div>
  );

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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Barcode
        </label>
        <div className="flex space-x-2">
          <Input
            type="text"
            placeholder="Enter or scan barcode"
            value={formData.barcode}
            onChange={(e) => handleInputChange("barcode", e.target.value)}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => showToast("Barcode scanner feature coming soon", "info")}
            className="px-3"
          >
            <ApperIcon name="Scan" className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderMarketing = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Tags/Labels
        </label>
        
        {/* Selected Tags */}
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 p-3 bg-gray-50 rounded-md">
            {formData.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleInputChange("tags", formData.tags.filter((_, i) => i !== index))}
                  className="ml-2 text-primary-600 hover:text-primary-800"
                >
                  <ApperIcon name="X" className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Available Tags */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
          {availableTags.filter(tag => !formData.tags.includes(tag)).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleInputChange("tags", [...formData.tags, tag])}
              className="px-3 py-2 text-xs border border-gray-300 rounded-md hover:bg-primary-50 hover:border-primary-300 text-left"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Add New Tag */}
        <div className="flex space-x-2">
          <Input
            type="text"
            placeholder="Add new tag"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            className="flex-1"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && newTag.trim()) {
                handleInputChange("tags", [...formData.tags, newTag.trim().toUpperCase()]);
                setNewTag("");
                e.preventDefault();
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (newTag.trim()) {
                handleInputChange("tags", [...formData.tags, newTag.trim().toUpperCase()]);
                setNewTag("");
              }
            }}
            disabled={!newTag.trim()}
          >
            <ApperIcon name="Plus" className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Special Offers
        </label>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.includeInDeals}
              onChange={(e) => handleInputChange("includeInDeals", e.target.checked)}
              className="mr-3 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <div>
              <div className="font-medium">Include in Deals of the Day</div>
              <div className="text-sm text-gray-500">
                Feature this product in today's special deals section
              </div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );

  const handleAdditionalImageUpload = (files) => {
    const fileArray = Array.from(files);
    const validImages = fileArray.filter(file => file.type.startsWith('image/'));
    
    if (validImages.length > 0) {
      const newImages = validImages.map(file => ({
        file,
        preview: URL.createObjectURL(file),
        id: Date.now() + Math.random()
      }));
      
      handleInputChange("additionalImages", [...formData.additionalImages, ...newImages]);
      showToast(`${validImages.length} image(s) uploaded successfully`, "success");
    }
  };

  const removeAdditionalImage = (imageId) => {
    const updatedImages = formData.additionalImages.filter(img => img.id !== imageId);
    handleInputChange("additionalImages", updatedImages);
  };

  const reorderImages = (dragIndex, hoverIndex) => {
    const dragImage = formData.additionalImages[dragIndex];
    const updatedImages = [...formData.additionalImages];
    updatedImages.splice(dragIndex, 1);
    updatedImages.splice(hoverIndex, 0, dragImage);
    handleInputChange("additionalImages", updatedImages);
  };

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

      {/* Additional Images */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Images
        </label>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-400 transition-colors">
          <input
            id="additionalImagesInput"
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleAdditionalImageUpload(e.target.files)}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => document.getElementById('additionalImagesInput').click()}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            <ApperIcon name="Plus" className="w-6 h-6 mx-auto mb-2" />
            Add More Images
          </button>
          <p className="text-sm text-gray-500">
            Upload multiple images (PNG, JPG, JPEG)
          </p>
        </div>
      </div>

      {/* Product Gallery */}
      {formData.additionalImages.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Product Gallery ({formData.additionalImages.length} images)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {formData.additionalImages.map((image, index) => (
              <div key={image.id} className="relative group">
                <img
                  src={image.preview}
                  alt={`Additional ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 flex space-x-2">
                    <button
                      type="button"
                      onClick={() => removeAdditionalImage(image.id)}
                      className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <ApperIcon name="Trash2" className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
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
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Return Policy
        </label>
        <select
          value={formData.returnPolicy}
          onChange={(e) => handleInputChange("returnPolicy", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="7-day">7-day Return</option>
          <option value="14-day">14-day Return</option>
          <option value="30-day">30-day Return</option>
          <option value="no-return">No Returns</option>
        </select>
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
      case "marketing": return renderMarketing();
      case "media": return renderMedia();
      case "shipping": return renderShipping();
      case "seo": return renderSEO();
      case "approval": return renderApproval();
      default: return renderBasicInfo();
    }
  };
const renderPreviewModal = () => {
    if (!showPreview) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Product Preview</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(false)}
              >
                <ApperIcon name="X" className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Product"
                  className="w-full h-64 object-contain rounded-lg border"
                />
              )}
              
              <div>
                <h3 className="text-lg font-semibold">{formData.title || "Product Name"}</h3>
                {formData.brand && <p className="text-gray-600">by {formData.brand}</p>}
              </div>
              
              {formData.sellingPrice && (
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-bold text-primary-600">
                    {formatPrice(parseFloat(formData.sellingPrice))}
                  </span>
                  {formData.discountedPrice && parseFloat(formData.discountedPrice) > 0 && (
                    <span className="text-gray-500 line-through">
                      {formatPrice(parseFloat(formData.discountedPrice))}
                    </span>
                  )}
                </div>
              )}
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              
              {formData.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-gray-600 text-sm">{formData.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

return (
    <div className={cn("min-h-screen", isInAdminDashboard ? "bg-white" : "bg-background")}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              {!isInAdminDashboard && (
                <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                  <button onClick={() => navigate("/")} className="hover:text-primary-600">
                    Home
                  </button>
                  <ApperIcon name="ChevronRight" className="w-4 h-4" />
                  <span className="text-gray-900 font-medium">Add Product</span>
                </nav>
              )}
              
              <h1 className="text-3xl font-display font-bold text-gray-900">
                Add New Product
              </h1>
              <p className="text-gray-600 mt-2">
                Create a comprehensive product listing with all details
              </p>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-600 mb-2">
                Completion: {getCompletionPercentage()}%
              </div>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getCompletionPercentage()}%` }}
                ></div>
              </div>
              {lastSaved && (
                <div className="text-xs text-gray-500 mt-2">
                  Last saved: {lastSaved.toLocaleTimeString()}
                </div>
              )}
              {unsavedChanges && (
                <div className="text-xs text-orange-600 mt-1">
                  Unsaved changes
                </div>
              )}
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
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => navigate(-1)}
                  disabled={loading}
                >
                  <ApperIcon name="ArrowLeft" className="w-4 h-4 mr-2" />
                  Cancel
                </Button>

                {/* Role Badge */}
                <Badge variant={currentUser.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                  {currentUser.role.toUpperCase()}
                </Badge>
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowPreview(true)}
                  disabled={!formData.title}
                >
                  <ApperIcon name="Eye" className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                
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

                {currentUser.permissions.canSchedule && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const scheduleDate = prompt('Enter schedule date (YYYY-MM-DD):');
                      if (scheduleDate) {
                        handleSave(true, false, scheduleDate);
                      }
                    }}
                    disabled={loading}
                  >
                    <ApperIcon name="Clock" className="w-4 h-4 mr-2" />
                    Schedule
                  </Button>
                )}

                <Button
                  onClick={() => handleSave(true)}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <ApperIcon name="Loader2" className="w-4 h-4 mr-2 animate-spin" />
                      {formData.requiresApproval && !currentUser.permissions.canBypassApproval 
                        ? 'Submitting...' 
                        : 'Publishing...'
                      }
                    </>
                  ) : (
                    <>
                      <ApperIcon name="Upload" className="w-4 h-4 mr-2" />
                      {formData.requiresApproval && !currentUser.permissions.canBypassApproval 
                        ? 'Submit for Approval' 
                        : 'Publish Now'
                      }
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
</Card>
      </div>
      
      {renderPreviewModal()}
    </div>
  );
};

export default AddProduct;