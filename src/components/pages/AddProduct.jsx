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
    lowStockThreshold: "10",
    sku: "",
    barcode: "",
    mainImage: null,
    additionalImages: [],
    tags: [],
    variants: [],
    includeInDeals: false,
    dealOfTheDay: false,
    countdownTimer: "",
    bannerText: "",
    badge: "",
    shippingWeight: "",
    shippingDimensions: { length: "", width: "", height: "" },
    shippingFreeThreshold: "1000",
    returnPolicy: "7-day",
    bundleComponents: [],
    bundleSavings: "",
    preparationTime: "",
    servings: "",
    visibility: "draft",
    moderatorApproved: false,
    requiresApproval: true,
    scheduledPublish: "",
    metaTitle: "",
    metaDescription: "",
    seoKeywords: [],
    relatedProducts: []
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
    { id: "variations", label: "Variations", icon: "Grid3X3" },
    { id: "media", label: "Media Gallery", icon: "Image" },
    { id: "marketing", label: "Marketing & Deals", icon: "Tag" },
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
    
    // Auto-generate meta fields if not set
    if (field === 'title' && value && !formData.metaTitle) {
      setFormData(prev => ({ ...prev, metaTitle: value }));
    }
    
    if (field === 'shortDescription' && value && !formData.metaDescription) {
      setFormData(prev => ({ ...prev, metaDescription: value }));
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
    const optionalFields = ['brand', 'shortDescription', 'buyingPrice', 'mainImage', 'tags', 'metaTitle'];
    const advancedFields = ['variants', 'bundleComponents', 'seoKeywords', 'relatedProducts'];
    
    const requiredCompleted = requiredFields.filter(field => formData[field]).length;
    const optionalCompleted = optionalFields.filter(field => formData[field] && formData[field].length > 0).length;
    const advancedCompleted = advancedFields.filter(field => 
      Array.isArray(formData[field]) ? formData[field].length > 0 : formData[field]
    ).length;
    
    const requiredWeight = 0.5;
    const optionalWeight = 0.3;
    const advancedWeight = 0.2;
    
    const requiredScore = (requiredCompleted / requiredFields.length) * requiredWeight;
    const optionalScore = (optionalCompleted / optionalFields.length) * optionalWeight;
    const advancedScore = (advancedCompleted / advancedFields.length) * advancedWeight;
    
    return Math.round((requiredScore + optionalScore + advancedScore) * 100);
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
    
    // Shipping validation for bundles
    if (formData.bundleComponents.length > 0) {
      if (!formData.bundleSavings) {
        newErrors.bundleSavings = "Bundle savings amount is required for bundles";
      }
      if (!formData.preparationTime) {
        newErrors.preparationTime = "Preparation time is required for bundles";
      }
    }
    
    // SEO validation
    if (formData.metaTitle && formData.metaTitle.length > 60) {
      newErrors.metaTitle = "Meta title should not exceed 60 characters";
    }
    if (formData.metaDescription && formData.metaDescription.length > 160) {
      newErrors.metaDescription = "Meta description should not exceed 160 characters";
    }
    
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
        scheduledPublish: schedule || formData.scheduledPublish,
        price: sellingPrice,
        oldPrice: discountedPrice > 0 ? sellingPrice : null,
        discountedPrice: discountedPrice > 0 ? discountedPrice : null,
        stock: parseInt(formData.stockQuantity),
        lowStockThreshold: parseInt(formData.lowStockThreshold) || 10,
        images: [
          ...(formData.mainImage ? [URL.createObjectURL(formData.mainImage)] : []),
          ...formData.additionalImages.map(img => img.preview)
        ],
        badges: formData.tags,
        variants: formData.variants || [],
        barcode: formData.barcode,
        returnPolicy: formData.returnPolicy,
        includeInDeals: formData.includeInDeals,
        dealOfTheDay: formData.dealOfTheDay,
        countdownTimer: formData.countdownTimer,
        bannerText: formData.bannerText,
        badge: formData.badge,
        shipping: {
          weight: formData.shippingWeight,
          dimensions: formData.shippingDimensions,
          freeThreshold: parseInt(formData.shippingFreeThreshold) || 1000
        },
        bundle: formData.bundleComponents.length > 0 ? {
          components: formData.bundleComponents,
          savings: parseFloat(formData.bundleSavings) || 0,
          preparationTime: formData.preparationTime,
          servings: formData.servings
        } : null,
        seo: {
          metaTitle: formData.metaTitle || formData.title,
          metaDescription: formData.metaDescription || formData.shortDescription,
          keywords: formData.seoKeywords,
          relatedProducts: formData.relatedProducts
        },
        createdBy: currentUser.role,
        createdAt: new Date(),
        lastModified: new Date(),
        featured: false,
        priority: 0
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
          lowStockThreshold: "10",
          sku: "",
          barcode: "",
          mainImage: null,
          additionalImages: [],
          tags: [],
          variants: [],
          includeInDeals: false,
          dealOfTheDay: false,
          countdownTimer: "",
          bannerText: "",
          badge: "",
          shippingWeight: "",
          shippingDimensions: { length: "", width: "", height: "" },
          shippingFreeThreshold: "1000",
          returnPolicy: "7-day",
          bundleComponents: [],
          bundleSavings: "",
          preparationTime: "",
          servings: "",
          visibility: "draft",
          moderatorApproved: false,
          requiresApproval: true,
          scheduledPublish: "",
          metaTitle: "",
          metaDescription: "",
          seoKeywords: [],
          relatedProducts: []
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
// SEO & Advanced Tab Render Function
  const renderSEO = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">🔍 Search Engine Optimization</h3>
        <p className="text-xs text-blue-700">
          Optimize your product for search engines and improve discoverability
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Meta Title
        </label>
        <Input
          value={formData.metaTitle}
          onChange={(e) => handleInputChange('metaTitle', e.target.value)}
          placeholder="SEO-friendly title (60 characters max)"
          maxLength={60}
          className={cn(errors.metaTitle && "border-red-500")}
        />
        <div className="flex justify-between mt-1">
          <p className="text-xs text-gray-500">
            {formData.metaTitle.length}/60 characters
          </p>
          {!formData.metaTitle && formData.title && (
            <button
              type="button"
              onClick={() => handleInputChange('metaTitle', formData.title)}
              className="text-xs text-primary-600 hover:text-primary-700"
            >
              Use product title
            </button>
          )}
        </div>
        {errors.metaTitle && <p className="text-red-500 text-sm mt-1">{errors.metaTitle}</p>}
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
          className={cn(
            "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
            errors.metaDescription && "border-red-500"
          )}
        />
        <div className="flex justify-between mt-1">
          <p className="text-xs text-gray-500">
            {formData.metaDescription.length}/160 characters
          </p>
          {!formData.metaDescription && formData.shortDescription && (
            <button
              type="button"
              onClick={() => handleInputChange('metaDescription', formData.shortDescription)}
              className="text-xs text-primary-600 hover:text-primary-700"
            >
              Use short description
            </button>
          )}
        </div>
        {errors.metaDescription && <p className="text-red-500 text-sm mt-1">{errors.metaDescription}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          SEO Keywords (comma-separated)
        </label>
        <Input
          value={formData.seoKeywords.join(', ')}
          onChange={(e) => handleInputChange('seoKeywords', e.target.value.split(',').map(k => k.trim()).filter(k => k))}
          placeholder="keyword1, keyword2, keyword3"
        />
        <p className="text-xs text-gray-500 mt-1">
          Add relevant keywords to help customers find your product
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Related Products
        </label>
        <div className="border border-gray-300 rounded-lg p-3 min-h-[100px] bg-gray-50">
          {formData.relatedProducts.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">
              No related products selected. Related products will appear here.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {formData.relatedProducts.map((productId, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                >
                  Product #{productId}
                  <button
                    type="button"
                    onClick={() => handleInputChange('relatedProducts', formData.relatedProducts.filter((_, i) => i !== index))}
                    className="ml-2 text-primary-600 hover:text-primary-800"
                  >
                    <ApperIcon name="X" className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Related products feature coming soon - will suggest products based on category and tags
        </p>
      </div>

      {formData.scheduledPublish && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Scheduled Publication
          </label>
          <Input
            type="datetime-local"
            value={formData.scheduledPublish}
            onChange={(e) => handleInputChange('scheduledPublish', e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            Product will be automatically published at the scheduled time
          </p>
        </div>
      )}
    </div>
  );
// Variations Tab Render Function
  const renderVariations = () => (
    <div className="space-y-6">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-purple-900 mb-2">📦 Product Variations</h3>
        <p className="text-xs text-purple-700">
          Create different variations of your product (size, color, weight, etc.)
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Product Variations
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const newVariant = {
                id: Date.now(),
                name: `Variant ${formData.variants.length + 1}`,
                price: parseFloat(formData.sellingPrice) || 0,
                oldPrice: null,
                stock: 0,
                sku: `${formData.sku}-V${formData.variants.length + 1}`,
                image: null,
                attributes: {}
              };
              handleInputChange('variants', [...formData.variants, newVariant]);
            }}
          >
            <ApperIcon name="Plus" className="w-4 h-4 mr-2" />
            Add Variation
          </Button>
        </div>

        {formData.variants.length === 0 ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <ApperIcon name="Package" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No variations created yet</p>
            <p className="text-gray-400 text-sm">
              Add variations like different sizes, colors, or weights for this product
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {formData.variants.map((variant, index) => (
              <div key={variant.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Variation {index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newVariants = formData.variants.filter((_, i) => i !== index);
                      handleInputChange('variants', newVariants);
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    <ApperIcon name="Trash2" className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Variation Name
                    </label>
                    <Input
                      value={variant.name}
                      onChange={(e) => {
                        const newVariants = [...formData.variants];
                        newVariants[index].name = e.target.value;
                        handleInputChange('variants', newVariants);
                      }}
                      placeholder="e.g., Large, Red, 1kg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (PKR)
                    </label>
                    <Input
                      type="number"
                      value={variant.price}
                      onChange={(e) => {
                        const newVariants = [...formData.variants];
                        newVariants[index].price = parseFloat(e.target.value) || 0;
                        handleInputChange('variants', newVariants);
                      }}
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock Quantity
                    </label>
                    <Input
                      type="number"
                      value={variant.stock}
                      onChange={(e) => {
                        const newVariants = [...formData.variants];
                        newVariants[index].stock = parseInt(e.target.value) || 0;
                        handleInputChange('variants', newVariants);
                      }}
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SKU
                    </label>
                    <Input
                      value={variant.sku}
                      onChange={(e) => {
                        const newVariants = [...formData.variants];
                        newVariants[index].sku = e.target.value;
                        handleInputChange('variants', newVariants);
                      }}
                      placeholder="Unique SKU"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-500 mt-2">
          💡 Tip: Variations allow customers to choose different options of the same product
        </p>
      </div>
    </div>
  );

const renderBasicInfo = () => (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-green-900 mb-2">📝 Basic Product Information</h3>
        <p className="text-xs text-green-700">
          Essential details about your product that customers will see first
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product Name *
        </label>
        <Input
          type="text"
          placeholder="e.g., Premium Basmati Rice 5kg"
          value={formData.title}
          onChange={(e) => handleInputChange("title", e.target.value)}
          className={cn(errors.title && "border-red-500")}
        />
        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
        <p className="text-xs text-gray-500 mt-1">
          Use descriptive names that help customers understand what you're selling
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Brand/Manufacturer
        </label>
        <div className="relative">
          <Input
            type="text"
            placeholder="e.g., Shan, National, PureFood, etc."
            value={formData.brand}
            onChange={(e) => handleInputChange("brand", e.target.value)}
            className="pr-10"
          />
          <ApperIcon name="Building" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Brand name helps build trust and recognition
        </p>
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
          {!formData.category && (
            <p className="text-xs text-gray-500 mt-1">Select a category first</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Detailed Description *
        </label>
        <textarea
          rows={4}
          placeholder="Provide comprehensive product details, ingredients, usage instructions, benefits..."
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          className={cn(
            "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none",
            errors.description && "border-red-500"
          )}
        />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
        <p className="text-xs text-gray-500 mt-1">
          Include key features, benefits, and specifications that help customers make informed decisions
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Short Description
        </label>
        <textarea
          rows={2}
          placeholder="Brief highlights that will appear on product cards..."
          value={formData.shortDescription}
          onChange={(e) => handleInputChange("shortDescription", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          maxLength={150}
        />
        <div className="flex justify-between mt-1">
          <p className="text-xs text-gray-500">
            Used in product listings and search results
          </p>
          <p className="text-xs text-gray-400">
            {formData.shortDescription.length}/150
          </p>
        </div>
      </div>
    </div>
  );
const renderPricing = () => (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-green-900 mb-2">💰 Pricing & Variants</h3>
        <p className="text-xs text-green-700">
          Set competitive pricing and create product variants for different options
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selling Price (PKR) *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
              Rs
            </span>
            <Input
              type="number"
              placeholder="0"
              value={formData.sellingPrice}
              onChange={(e) => handleInputChange("sellingPrice", e.target.value)}
              className={cn(errors.sellingPrice && "border-red-500", "pl-8")}
              min="0"
              step="0.01"
            />
          </div>
          {errors.sellingPrice && <p className="text-red-500 text-sm mt-1">{errors.sellingPrice}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cost Price (PKR)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
              Rs
            </span>
            <Input
              type="number"
              placeholder="0"
              value={formData.buyingPrice}
              onChange={(e) => handleInputChange("buyingPrice", e.target.value)}
              className={cn(errors.buyingPrice && "border-red-500", "pl-8")}
              min="0"
              step="0.01"
            />
          </div>
          {errors.buyingPrice && <p className="text-red-500 text-sm mt-1">{errors.buyingPrice}</p>}
          <p className="text-xs text-gray-500 mt-1">Your cost to acquire/produce this product</p>
        </div>
      </div>

      {/* Profit Calculation Display */}
      {buyingPrice > 0 && sellingPrice > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
            <ApperIcon name="TrendingUp" className="w-5 h-5 mr-2 text-green-600" />
            Profit Analysis
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <p className="text-gray-600 mb-1">Profit per Unit</p>
              <p className={cn(
                "text-2xl font-bold",
                profit >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {formatPrice(profit)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-600 mb-1">Profit Margin</p>
              <p className={cn(
                "text-2xl font-bold",
                profitMargin >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {profitMargin.toFixed(1)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-600 mb-1">Markup</p>
              <p className="text-2xl font-bold text-blue-600">
                {buyingPrice > 0 ? (((sellingPrice - buyingPrice) / buyingPrice) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sale Price (PKR)
          <span className="text-gray-500 text-xs ml-1">(Optional - for discounts)</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
            Rs
          </span>
          <Input
            type="number"
            placeholder="Leave empty if no discount"
            value={formData.discountedPrice}
            onChange={(e) => handleInputChange("discountedPrice", e.target.value)}
            className={cn(errors.discountedPrice && "border-red-500", "pl-8")}
            min="0"
            step="0.01"
          />
        </div>
        {errors.discountedPrice && <p className="text-red-500 text-sm mt-1">{errors.discountedPrice}</p>}
      </div>

      {/* Discount Display */}
      {discountPercentage > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4">
          <h4 className="font-semibold text-orange-800 mb-3 flex items-center">
            <ApperIcon name="Percent" className="w-5 h-5 mr-2 text-orange-600" />
            Discount Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <p className="text-gray-600 mb-1">Discount</p>
              <p className="text-2xl font-bold text-orange-600">
                {discountPercentage.toFixed(1)}% OFF
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-600 mb-1">Customer Saves</p>
              <p className="text-2xl font-bold text-red-600">
                {formatPrice(sellingPrice - discountedPrice)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-600 mb-1">Final Price</p>
              <p className="text-2xl font-bold text-green-600">
                {formatPrice(discountedPrice)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Pricing Templates */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-800 mb-3">💡 Quick Pricing Templates</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (buyingPrice > 0) {
                const price = Math.round(buyingPrice * 1.5);
                handleInputChange('sellingPrice', price.toString());
              }
            }}
            disabled={!buyingPrice || buyingPrice <= 0}
            className="text-xs"
          >
            50% Markup
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (buyingPrice > 0) {
                const price = Math.round(buyingPrice * 2);
                handleInputChange('sellingPrice', price.toString());
              }
            }}
            disabled={!buyingPrice || buyingPrice <= 0}
            className="text-xs"
          >
            100% Markup
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (sellingPrice > 0) {
                const discountPrice = Math.round(sellingPrice * 0.9);
                handleInputChange('discountedPrice', discountPrice.toString());
              }
            }}
            disabled={!sellingPrice || sellingPrice <= 0}
            className="text-xs"
          >
            10% Discount
          </Button>
        </div>
      </div>
    </div>
  );
const renderInventory = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">📦 Inventory & Stock Management</h3>
        <p className="text-xs text-blue-700">
          Track your inventory levels and manage stock alerts
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stock Status
          </label>
          <select
            value={formData.stockStatus}
            onChange={(e) => handleInputChange("stockStatus", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="In Stock">✅ In Stock</option>
            <option value="Low Stock">⚠️ Low Stock</option>
            <option value="Out of Stock">❌ Out of Stock</option>
            <option value="Pre-order">📋 Pre-order</option>
            <option value="Discontinued">🚫 Discontinued</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stock Quantity *
          </label>
          <div className="relative">
            <Input
              type="number"
              placeholder="0"
              value={formData.stockQuantity}
              onChange={(e) => handleInputChange("stockQuantity", e.target.value)}
              className={cn(errors.stockQuantity && "border-red-500", "pr-12")}
              min="0"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
              units
            </span>
          </div>
          {errors.stockQuantity && <p className="text-red-500 text-sm mt-1">{errors.stockQuantity}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Low Stock Threshold
        </label>
        <div className="relative max-w-xs">
          <Input
            type="number"
            placeholder="10"
            value={formData.lowStockThreshold}
            onChange={(e) => handleInputChange("lowStockThreshold", e.target.value)}
            className="pr-12"
            min="0"
          />
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
            units
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Get notified when stock falls below this level
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          SKU (Stock Keeping Unit) *
        </label>
        <div className="flex space-x-2">
          <Input
            type="text"
            placeholder="e.g., BR-001, VEG-TOM-001"
            value={formData.sku}
            onChange={(e) => handleInputChange("sku", e.target.value)}
            className={cn(errors.sku && "border-red-500", "flex-1")}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const autoSku = `${formData.category?.substring(0,3).toUpperCase() || 'PRD'}-${Date.now().toString().slice(-6)}`;
              handleInputChange("sku", autoSku);
            }}
            className="px-4"
            title="Generate automatic SKU"
          >
            <ApperIcon name="Shuffle" className="w-4 h-4" />
          </Button>
        </div>
        {errors.sku && <p className="text-red-500 text-sm mt-1">{errors.sku}</p>}
        <p className="text-xs text-gray-500 mt-1">
          Unique identifier for inventory tracking
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Barcode
        </label>
        <div className="flex space-x-2">
          <Input
            type="text"
            placeholder="Enter or scan barcode (EAN-13, UPC, etc.)"
            value={formData.barcode}
            onChange={(e) => handleInputChange("barcode", e.target.value)}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => showToast("Barcode scanner integration coming soon", "info")}
            className="px-3"
            title="Scan barcode with camera"
          >
            <ApperIcon name="Scan" className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          For point-of-sale systems and inventory management
        </p>
      </div>

      {/* Stock Status Indicators */}
      {formData.stockQuantity && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-3">📊 Stock Status</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <p className="text-gray-600 mb-1">Current Stock</p>
              <p className="text-2xl font-bold text-blue-600">
                {formData.stockQuantity}
              </p>
              <p className="text-xs text-gray-500">units available</p>
            </div>
            <div className="text-center">
              <p className="text-gray-600 mb-1">Alert Level</p>
              <p className="text-2xl font-bold text-orange-600">
                {formData.lowStockThreshold || 10}
              </p>
              <p className="text-xs text-gray-500">threshold</p>
            </div>
            <div className="text-center">
              <p className="text-gray-600 mb-1">Status</p>
              <p className={cn(
                "text-lg font-semibold",
                parseInt(formData.stockQuantity) === 0 ? "text-red-600" :
                parseInt(formData.stockQuantity) <= parseInt(formData.lowStockThreshold || 10) ? "text-orange-600" :
                "text-green-600"
              )}>
                {parseInt(formData.stockQuantity) === 0 ? "Out of Stock" :
                 parseInt(formData.stockQuantity) <= parseInt(formData.lowStockThreshold || 10) ? "Low Stock" :
                 "In Stock"}
              </p>
            </div>
          </div>
        </div>
      )}
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

  const renderApproval = () => (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-yellow-900 mb-2">🔒 Approval Settings</h3>
        <p className="text-xs text-yellow-700">
          Configure approval workflow and publication settings
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Publication Settings
        </label>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.requiresApproval}
              onChange={(e) => handleInputChange("requiresApproval", e.target.checked)}
              className="mr-3 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              disabled={!currentUser.permissions.canApprove}
            />
            <div>
              <div className="font-medium">Requires Approval</div>
              <div className="text-sm text-gray-500">
                Product needs moderator approval before going live
              </div>
            </div>
          </label>

          {currentUser.permissions.canApprove && (
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.moderatorApproved}
                onChange={(e) => handleInputChange("moderatorApproved", e.target.checked)}
                className="mr-3 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <div>
                <div className="font-medium">Pre-approve Product</div>
                <div className="text-sm text-gray-500">
                  Bypass approval process (Admin/Moderator only)
                </div>
              </div>
            </label>
          )}
        </div>
      </div>

      {currentUser.permissions.canSchedule && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Scheduled Publication
          </label>
          <Input
            type="datetime-local"
            value={formData.scheduledPublish}
            onChange={(e) => handleInputChange('scheduledPublish', e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
          />
          <p className="text-xs text-gray-500 mt-1">
            Product will be automatically published at the scheduled time
          </p>
        </div>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-800 mb-3">Current User Permissions</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center">
            <div className={cn(
              "w-2 h-2 rounded-full mr-2",
              currentUser.permissions.canPublish ? "bg-green-500" : "bg-red-500"
            )} />
            <span>Can Publish: {currentUser.permissions.canPublish ? "Yes" : "No"}</span>
          </div>
          <div className="flex items-center">
            <div className={cn(
              "w-2 h-2 rounded-full mr-2",
              currentUser.permissions.canApprove ? "bg-green-500" : "bg-red-500"
            )} />
            <span>Can Approve: {currentUser.permissions.canApprove ? "Yes" : "No"}</span>
          </div>
          <div className="flex items-center">
            <div className={cn(
              "w-2 h-2 rounded-full mr-2",
              currentUser.permissions.canSchedule ? "bg-green-500" : "bg-red-500"
            )} />
            <span>Can Schedule: {currentUser.permissions.canSchedule ? "Yes" : "No"}</span>
          </div>
          <div className="flex items-center">
            <div className={cn(
              "w-2 h-2 rounded-full mr-2",
              currentUser.permissions.canBypassApproval ? "bg-green-500" : "bg-red-500"
            )} />
            <span>Bypass Approval: {currentUser.permissions.canBypassApproval ? "Yes" : "No"}</span>
          </div>
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
      case "variations": return renderVariations();
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