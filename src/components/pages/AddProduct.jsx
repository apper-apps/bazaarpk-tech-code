import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/useToast";
import { CategoryService } from "@/services/api/CategoryService";
import { ProductService } from "@/services/api/ProductService";
import ApperIcon from "@/components/ApperIcon";
import { Error } from "@/components/ui/Error";
import Home from "@/components/pages/Home";
import Category from "@/components/pages/Category";
import Badge from "@/components/atoms/Badge";
import Input from "@/components/atoms/Input";
import Button from "@/components/atoms/Button";
import Card from "@/components/atoms/Card";
import { cn } from "@/utils/cn";
import { formatPrice } from "@/utils/currency";
import { announceToScreenReader, generateDataChecksum, getCSRFToken, initializeCSRF, sanitizeInput, sanitizeNumericInput, sanitizeURL, validateDataConsistency, validateFormData } from "@/utils/security";

const AddProduct = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const showToast = useToast();
  
  // Check if we're in admin dashboard context
  const isInAdminDashboard = location.pathname.includes('/admin') || 
                           location.pathname.includes('/dashboard');
  
  // Initialize CSRF protection on component mount
  useEffect(() => {
    initializeCSRF();
    announceToScreenReader("Add product form loaded. Fill in required fields marked with asterisk.", "polite");
  }, []);

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
    discountAmount: "",
    discountType: "percentage", // percentage or fixed
    stockStatus: "In Stock",
    stockQuantity: "",
    lowStockThreshold: "10",
    sku: "",
barcode: "",
    mainImage: null,
    mainImageAltText: "",
    additionalImages: [],
    videoUrl: "",
    tags: [],
    adminRating: 0,
    featured: false,
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
    urlSlug: "",
    seoKeywords: [],
    relatedProducts: [],
    // Inventory management fields
    unitOfMeasurement: "piece",
    minimumOrderQuantity: "1",
    maximumOrderQuantity: "",
    reorderLevel: "",
    supplierInfo: "",
    costPerUnit: "",
    lastRestocked: "",
    expiryDate: "",
    batchNumber: "",
    location: "",
    notes: ""
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
  const [activeTab, setActiveTab] = useState("basic");
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
  const discountAmount = parseFloat(formData.discountAmount) || 0;
  
  // Enhanced profit calculations
  const profit = sellingPrice - buyingPrice;
  const profitMargin = buyingPrice > 0 ? ((profit / buyingPrice) * 100) : 0;
  const markup = buyingPrice > 0 ? (((sellingPrice - buyingPrice) / buyingPrice) * 100) : 0;
  
  // Enhanced discount calculations
  let finalPrice = sellingPrice;
  let discountPercentage = 0;
  let totalSavings = 0;
  
  if (discountedPrice > 0 && discountedPrice < sellingPrice) {
    finalPrice = discountedPrice;
    discountPercentage = ((sellingPrice - discountedPrice) / sellingPrice) * 100;
    totalSavings = sellingPrice - discountedPrice;
  } else if (discountAmount > 0) {
    if (formData.discountType === "percentage") {
      finalPrice = sellingPrice * (1 - discountAmount / 100);
      discountPercentage = discountAmount;
      totalSavings = sellingPrice - finalPrice;
    } else {
      finalPrice = Math.max(0, sellingPrice - discountAmount);
      discountPercentage = sellingPrice > 0 ? (discountAmount / sellingPrice) * 100 : 0;
      totalSavings = discountAmount;
    }
  }
  
  // Profit after discount
  const finalProfit = finalPrice - buyingPrice;
  const finalProfitMargin = buyingPrice > 0 ? ((finalProfit / buyingPrice) * 100) : 0;

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
const handleInputChange = (field, value, validationInfo = {}) => {
    // Input sanitization based on field type with enhanced validation
    let sanitizedValue = value;
    let fieldError = null;
    
    if (typeof value === 'string') {
      switch (field) {
        case 'title':
        case 'brand':
        case 'category':
        case 'subcategory':
          sanitizedValue = sanitizeInput(value, { 
            maxLength: 100, 
            allowNumbers: true, 
            allowSpecialChars: false 
          });
          // Enhanced validation
          if (field === 'title' && sanitizedValue.length < 3) {
            fieldError = "Product name must be at least 3 characters long";
          }
          if (field === 'brand' && sanitizedValue && sanitizedValue.length < 2) {
            fieldError = "Brand name must be at least 2 characters long";
          }
          break;
        case 'description':
        case 'shortDescription':
          sanitizedValue = sanitizeInput(value, { 
            maxLength: field === 'description' ? 2000 : 200, 
            allowNumbers: true, 
            allowSpecialChars: true 
          });
          // Enhanced validation for descriptions
          if (field === 'description' && sanitizedValue && sanitizedValue.length < 20) {
            fieldError = "Product description should be at least 20 characters for better customer understanding";
          }
          if (field === 'shortDescription' && sanitizedValue && sanitizedValue.length < 10) {
            fieldError = "Short description should be at least 10 characters";
          }
          break;
        case 'sku':
        case 'barcode':
          sanitizedValue = sanitizeInput(value, { 
            maxLength: 50, 
            allowNumbers: true, 
            allowSpecialChars: false 
          }).toUpperCase();
          // Enhanced SKU/Barcode validation
          if (field === 'sku' && sanitizedValue && sanitizedValue.length < 3) {
            fieldError = "SKU must be at least 3 characters long";
          }
          if (field === 'barcode' && sanitizedValue && (sanitizedValue.length < 8 || sanitizedValue.length > 18)) {
            fieldError = "Barcode should be between 8-18 characters";
          }
          break;
        case 'sellingPrice':
        case 'buyingPrice':
        case 'discountedPrice':
        case 'discountAmount':
          sanitizedValue = sanitizeNumericInput(value, { 
            min: 0, 
            allowDecimals: true,
            maxDecimalPlaces: 2
          });
          // Enhanced price validation
          const numValue = parseFloat(sanitizedValue);
          if (sanitizedValue && (isNaN(numValue) || numValue < 0)) {
            fieldError = "Price must be a valid positive number";
          }
          if (field === 'sellingPrice' && numValue === 0) {
            fieldError = "Selling price must be greater than 0";
          }
          if (field === 'buyingPrice' && numValue >= parseFloat(formData.sellingPrice || 0)) {
            fieldError = "Cost price should be less than selling price for profitability";
          }
          break;
        case 'stockQuantity':
        case 'lowStockThreshold':
        case 'minimumOrderQuantity':
        case 'maximumOrderQuantity':
        case 'reorderLevel':
          sanitizedValue = sanitizeNumericInput(value, { 
            min: 0, 
            allowDecimals: false
          });
          // Enhanced inventory validation
          const intValue = parseInt(sanitizedValue);
          if (sanitizedValue && (isNaN(intValue) || intValue < 0)) {
            fieldError = "Quantity must be a valid positive number";
          }
          if (field === 'minimumOrderQuantity' && intValue < 1) {
            fieldError = "Minimum order quantity must be at least 1";
          }
          if (field === 'maximumOrderQuantity' && intValue < parseInt(formData.minimumOrderQuantity || 1)) {
            fieldError = "Maximum order quantity must be greater than minimum";
          }
          break;
        case 'mainImageAltText':
          sanitizedValue = sanitizeInput(value, { 
            maxLength: 125, 
            allowNumbers: true, 
            allowSpecialChars: true 
          });
          if (sanitizedValue && sanitizedValue.length < 5) {
            fieldError = "Alt text should be at least 5 characters for accessibility";
          }
          break;
case 'videoUrl':
          sanitizedValue = sanitizeURL(value);
          // Enhanced URL validation
          if (sanitizedValue && !isValidURL(sanitizedValue)) {
            fieldError = "Please enter a valid URL (e.g., https://example.com)";
          }
          break;
        case 'metaTitle':
          sanitizedValue = sanitizeInput(value, { 
            maxLength: 60, 
            allowNumbers: true, 
            allowSpecialChars: true 
          });
          if (sanitizedValue && sanitizedValue.length > 60) {
            fieldError = "Meta title should not exceed 60 characters for SEO";
          }
          break;
        case 'metaDescription':
          sanitizedValue = sanitizeInput(value, { 
            maxLength: 160, 
            allowNumbers: true, 
            allowSpecialChars: true 
          });
          if (sanitizedValue && sanitizedValue.length > 160) {
            fieldError = "Meta description should not exceed 160 characters for SEO";
          }
          break;
        case 'urlSlug':
          // Generate SEO-friendly URL slug
          sanitizedValue = value.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
            .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
            .substring(0, 100); // Limit length for SEO
          
          if (sanitizedValue && sanitizedValue.length < 3) {
            fieldError = "URL slug should be at least 3 characters long";
          }
          
          // Check for valid slug format
          if (sanitizedValue && !/^[a-z0-9-]+$/.test(sanitizedValue)) {
            fieldError = "URL slug can only contain lowercase letters, numbers, and hyphens";
          }
          break;
        case 'bannerText':
          sanitizedValue = sanitizeInput(value, { 
            maxLength: 100, 
            allowNumbers: true, 
            allowSpecialChars: true 
          });
          if (sanitizedValue && sanitizedValue.length > 100) {
            fieldError = "Banner text should not exceed 100 characters for better display";
          }
          break;
        case 'supplierInfo':
        case 'location':
        case 'notes':
          sanitizedValue = sanitizeInput(value, { 
            maxLength: field === 'notes' ? 300 : 100, 
            allowNumbers: true, 
            allowSpecialChars: true 
          });
          break;
        default:
          sanitizedValue = sanitizeInput(value, {
            maxLength: 1000,
            allowNumbers: true,
            allowSpecialChars: true
          });
      }
    }

    // Update form data
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
    setUnsavedChanges(true);
    
    // Update field-specific error
    if (fieldError) {
      setErrors(prev => ({ ...prev, [field]: fieldError }));
    } else if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }

    // Auto-generation and calculation logic with validation
    
    // Auto-generate SKU if title changes
    if (field === 'title' && sanitizedValue && sanitizedValue.length >= 3) {
      const autoSku = `${formData.category?.substring(0,3).toUpperCase() || 'PRD'}-${sanitizedValue.substring(0,3).toUpperCase()}-${Date.now().toString().slice(-3)}`;
      if (!formData.sku) {
        setFormData(prev => ({ ...prev, sku: autoSku }));
        showToast("SKU auto-generated", "info");
      }
    }
    
    // Auto-generate meta fields if not set
if (field === 'title' && sanitizedValue && sanitizedValue.length >= 3 && !formData.metaTitle) {
      setFormData(prev => ({ ...prev, metaTitle: sanitizedValue.substring(0, 60) }));
      showToast("Meta title auto-generated", "info");
    }
    
    if (field === 'shortDescription' && sanitizedValue && sanitizedValue.length >= 10 && !formData.metaDescription) {
      setFormData(prev => ({ ...prev, metaDescription: sanitizedValue.substring(0, 160) }));
      showToast("Meta description auto-generated", "info");
    }
    
    // Auto-generate URL slug from title
    if (field === 'title' && sanitizedValue && sanitizedValue.length >= 3 && !formData.urlSlug) {
      const autoSlug = sanitizedValue.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 100);
      
      if (autoSlug.length >= 3) {
        setFormData(prev => ({ ...prev, urlSlug: autoSlug }));
        showToast("URL slug auto-generated", "info");
      }
    }
    
    // Auto-update main image alt text if not set
    if (field === 'title' && sanitizedValue && sanitizedValue.length >= 3 && !formData.mainImageAltText) {
      setFormData(prev => ({ ...prev, mainImageAltText: `${sanitizedValue} - Product Image` }));
    }
    
    // Enhanced discount calculations with validation
    if (field === 'discountAmount' && sanitizedValue) {
      const discountVal = parseFloat(sanitizedValue) || 0;
      const selling = parseFloat(formData.sellingPrice) || 0;
      
      if (selling > 0) {
        let newDiscountedPrice = 0;
        if (formData.discountType === "percentage") {
          if (discountVal > 100) {
            setErrors(prev => ({ ...prev, discountAmount: "Discount percentage cannot exceed 100%" }));
            return;
          }
          newDiscountedPrice = selling * (1 - discountVal / 100);
        } else {
          if (discountVal >= selling) {
            setErrors(prev => ({ ...prev, discountAmount: "Discount amount cannot be greater than or equal to selling price" }));
            return;
          }
          newDiscountedPrice = Math.max(0, selling - discountVal);
        }
        
        setFormData(prev => ({ 
          ...prev, 
          [field]: sanitizedValue, 
          discountedPrice: newDiscountedPrice.toFixed(2) 
        }));
        showToast("Discount price calculated", "success");
      }
    }
    
    // Auto-calculate discount amount when discounted price changes
    if (field === 'discountedPrice' && sanitizedValue) {
      const discountedVal = parseFloat(sanitizedValue) || 0;
      const selling = parseFloat(formData.sellingPrice) || 0;
      
      if (selling > 0 && discountedVal < selling) {
        const discountAmt = selling - discountedVal;
        const discountPct = (discountAmt / selling) * 100;
        setFormData(prev => ({ 
          ...prev, 
          [field]: sanitizedValue,
          discountAmount: formData.discountType === "percentage" 
            ? discountPct.toFixed(1) 
            : discountAmt.toFixed(2)
        }));
        showToast("Discount amount calculated", "success");
      } else if (discountedVal >= selling) {
        setErrors(prev => ({ ...prev, discountedPrice: "Sale price must be less than selling price" }));
      }
    }
    
    // Auto-set stock status based on quantity with enhanced logic
    if (field === 'stockQuantity' && sanitizedValue) {
      const quantity = parseInt(sanitizedValue) || 0;
      const threshold = parseInt(formData.lowStockThreshold) || 10;
      let status = "In Stock";
      let statusColor = "green";
      
      if (quantity === 0) {
        status = "Out of Stock";
        statusColor = "red";
      } else if (quantity <= threshold) {
        status = "Low Stock";
        statusColor = "orange";
      }
      
      setFormData(prev => ({ ...prev, stockStatus: status }));
      showToast(`Stock status: ${status}`, statusColor === "green" ? "success" : statusColor === "red" ? "error" : "warning");
    }
    
    // Profit margin calculation
    if ((field === 'sellingPrice' || field === 'buyingPrice') && sanitizedValue) {
      const selling = parseFloat(field === 'sellingPrice' ? sanitizedValue : formData.sellingPrice) || 0;
      const buying = parseFloat(field === 'buyingPrice' ? sanitizedValue : formData.buyingPrice) || 0;
      
      if (selling > 0 && buying > 0) {
        const margin = ((selling - buying) / selling * 100).toFixed(1);
        setFormData(prev => ({ ...prev, profitMargin: margin }));
      }
    }

    // Real-time validation feedback
    announceToScreenReader(
      fieldError ? `Validation error in ${field}: ${fieldError}` : `${field} updated successfully`,
      fieldError ? 'assertive' : 'polite'
    );
  };

  // Helper function for URL validation
  const isValidURL = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
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
    const warnings = {};
    
    // Enhanced Basic Information validation
    if (!formData.title?.trim()) {
      newErrors.title = "Product name is required and cannot be empty";
    } else if (formData.title.length < 3) {
      newErrors.title = "Product name must be at least 3 characters for searchability";
    } else if (formData.title.length > 100) {
      newErrors.title = "Product name cannot exceed 100 characters";
    } else if (!/^[a-zA-Z0-9\s\-&.()]+$/.test(formData.title)) {
      newErrors.title = "Product name contains invalid characters. Use only letters, numbers, spaces, and basic punctuation";
    }
    
    if (!formData.category) {
      newErrors.category = "Category selection is required for proper product classification";
    }
    
    if (!formData.description?.trim()) {
      newErrors.description = "Product description is required to help customers understand your product";
    } else if (formData.description.length < 20) {
      newErrors.description = "Description should be at least 20 characters to provide meaningful information to customers";
    } else if (formData.description.length > 2000) {
      newErrors.description = "Description cannot exceed 2000 characters";
    }
    
    if (formData.shortDescription && formData.shortDescription.length < 10) {
      newErrors.shortDescription = "Short description should be at least 10 characters if provided";
    }
    
    // Enhanced Pricing validation with profitability checks
    const sellingPrice = parseFloat(formData.sellingPrice) || 0;
    const buyingPrice = parseFloat(formData.buyingPrice) || 0;
    const discountAmount = parseFloat(formData.discountAmount) || 0;
    const finalPrice = parseFloat(formData.discountedPrice) || sellingPrice;
    
    if (!formData.sellingPrice || sellingPrice <= 0) {
      newErrors.sellingPrice = "Selling price is required and must be greater than 0";
    } else if (sellingPrice < 1) {
      warnings.sellingPrice = "Very low selling price - please verify this is correct";
    } else if (sellingPrice > 1000000) {
      warnings.sellingPrice = "Very high selling price - please verify this is correct";
    }
    
    if (formData.buyingPrice) {
      if (buyingPrice < 0) {
        newErrors.buyingPrice = "Cost price cannot be negative";
      } else if (buyingPrice >= sellingPrice) {
        newErrors.buyingPrice = "Cost price should be less than selling price for profitability";
      } else if (buyingPrice > sellingPrice * 0.9) {
        warnings.buyingPrice = "Low profit margin detected - consider reviewing pricing strategy";
      }
    }
    
    // Enhanced discount validation
    if (formData.discountedPrice) {
      if (finalPrice <= 0) {
        newErrors.discountedPrice = "Sale price must be greater than 0";
      } else if (finalPrice >= sellingPrice) {
        newErrors.discountedPrice = "Sale price must be less than original selling price";
      }
    }
    
    if (formData.discountAmount) {
      if (formData.discountType === "percentage") {
        if (discountAmount <= 0) {
          newErrors.discountAmount = "Discount percentage must be greater than 0";
        } else if (discountAmount > 100) {
          newErrors.discountAmount = "Discount percentage cannot exceed 100%";
        } else if (discountAmount > 50) {
          warnings.discountAmount = "High discount percentage - ensure this is intentional";
        }
      } else if (formData.discountType === "fixed") {
        if (discountAmount <= 0) {
          newErrors.discountAmount = "Discount amount must be greater than 0";
        } else if (discountAmount >= sellingPrice) {
          newErrors.discountAmount = "Discount amount cannot be greater than or equal to selling price";
        }
      }
    }
    
    // Enhanced inventory validation
    const stockQuantity = parseInt(formData.stockQuantity);
    if (formData.stockQuantity === undefined || formData.stockQuantity === null || formData.stockQuantity === '') {
      newErrors.stockQuantity = "Stock quantity is required for inventory management";
    } else if (isNaN(stockQuantity) || stockQuantity < 0) {
      newErrors.stockQuantity = "Stock quantity must be a valid number (0 or greater)";
    } else if (stockQuantity > 100000) {
      warnings.stockQuantity = "Very high stock quantity - please verify this is correct";
    }
    
    // Enhanced SKU validation
    if (!formData.sku?.trim()) {
      newErrors.sku = "SKU (Stock Keeping Unit) is required for inventory tracking and management";
    } else if (formData.sku.length < 3) {
      newErrors.sku = "SKU must be at least 3 characters for uniqueness";
    } else if (formData.sku.length > 50) {
      newErrors.sku = "SKU cannot exceed 50 characters";
    } else if (!/^[A-Z0-9\-_]+$/.test(formData.sku)) {
      newErrors.sku = "SKU should contain only uppercase letters, numbers, hyphens, and underscores";
    }
    
    // Inventory thresholds validation
    const lowStockThreshold = parseInt(formData.lowStockThreshold);
    const minOrderQty = parseInt(formData.minimumOrderQuantity);
    const maxOrderQty = parseInt(formData.maximumOrderQuantity);
    
    if (formData.lowStockThreshold && (isNaN(lowStockThreshold) || lowStockThreshold < 0)) {
      newErrors.lowStockThreshold = "Low stock threshold must be 0 or greater";
    } else if (lowStockThreshold > stockQuantity) {
      warnings.lowStockThreshold = "Low stock threshold is higher than current stock quantity";
    }
    
    if (formData.minimumOrderQuantity && (isNaN(minOrderQty) || minOrderQty < 1)) {
      newErrors.minimumOrderQuantity = "Minimum order quantity must be at least 1";
    }
    
    if (formData.maximumOrderQuantity && (isNaN(maxOrderQty) || maxOrderQty < 1)) {
      newErrors.maximumOrderQuantity = "Maximum order quantity must be at least 1";
    }
    
    if (minOrderQty && maxOrderQty && maxOrderQty < minOrderQty) {
      newErrors.maximumOrderQuantity = "Maximum order quantity must be greater than or equal to minimum order quantity";
    }
    
    // Brand validation
    if (formData.brand) {
      if (formData.brand.length < 2) {
        newErrors.brand = "Brand name must be at least 2 characters if provided";
      } else if (formData.brand.length > 100) {
        newErrors.brand = "Brand name cannot exceed 100 characters";
      }
    }
    
    // Enhanced barcode validation
    if (formData.barcode) {
      if (formData.barcode.length < 8 || formData.barcode.length > 18) {
        newErrors.barcode = "Barcode should be between 8-18 characters (standard barcode formats)";
      } else if (!/^[0-9]+$/.test(formData.barcode)) {
        newErrors.barcode = "Barcode should contain only numbers";
      }
    }
    
    // Image validation
    if (!formData.mainImage) {
      warnings.mainImage = "Adding a main product image will improve customer engagement";
    }
    
    if (formData.mainImageAltText) {
      if (formData.mainImageAltText.length < 5) {
        newErrors.mainImageAltText = "Alt text should be at least 5 characters for accessibility compliance";
      } else if (formData.mainImageAltText.length > 125) {
        newErrors.mainImageAltText = "Alt text should not exceed 125 characters for optimal accessibility";
      }
    } else if (formData.mainImage) {
      warnings.mainImageAltText = "Alt text is recommended for accessibility and SEO benefits";
    }
    
    // Bundle validation
    if (formData.bundleComponents?.length > 0) {
      if (!formData.bundleSavings) {
        newErrors.bundleSavings = "Bundle savings amount is required when creating product bundles";
      }
      if (!formData.preparationTime) {
        newErrors.preparationTime = "Preparation time is required for bundled products";
      }
    }
    
    // Enhanced SEO validation
    if (formData.metaTitle) {
      if (formData.metaTitle.length > 60) {
        newErrors.metaTitle = "Meta title should not exceed 60 characters for optimal SEO performance";
      } else if (formData.metaTitle.length < 10) {
        warnings.metaTitle = "Meta title is quite short - consider adding more descriptive keywords";
      }
    } else if (formData.title) {
      warnings.metaTitle = "Meta title will be auto-generated from product name, but custom titles often perform better";
    }
    
    if (formData.metaDescription) {
      if (formData.metaDescription.length > 160) {
        newErrors.metaDescription = "Meta description should not exceed 160 characters for optimal search engine display";
      } else if (formData.metaDescription.length < 50) {
        warnings.metaDescription = "Meta description is quite short - consider adding more detail";
      }
    }
    
// URL validation
    // URL slug validation
    if (formData.videoUrl && !isValidURL(formData.videoUrl)) {
      newErrors.videoUrl = "Please enter a valid video URL (e.g., https://youtube.com/watch?v=...)";
    }
    
    // Set errors and warnings
    setErrors(newErrors);
    
    // Announce validation results for accessibility
    const errorCount = Object.keys(newErrors).length;
    const warningCount = Object.keys(warnings).length;
    
    if (errorCount > 0) {
      announceToScreenReader(
        `Form validation failed with ${errorCount} error${errorCount > 1 ? 's' : ''}. Please review and correct the highlighted fields.`, 
        'assertive'
      );
      showToast(`${errorCount} validation error${errorCount > 1 ? 's' : ''} found. Please review the form.`, "error");
    } else if (warningCount > 0) {
      showToast(`Form is valid with ${warningCount} suggestion${warningCount > 1 ? 's' : ''} for improvement.`, "warning");
    } else {
      announceToScreenReader("Form validation successful. All required fields are properly filled.", 'polite');
    }
    
return errorCount === 0;
  };
const handleSave = async (publish = false, silent = false, schedule = null) => {
    // Enhanced security validation
    const csrfToken = getCSRFToken();
    if (!csrfToken) {
      showToast("Security session expired. Please refresh the page to continue.", "error");
      announceToScreenReader("Security session expired. Page refresh required.", "assertive");
      return;
    }

    // Pre-save validation with comprehensive checks
    if (!validateForm() && !silent) {
      showToast("Please fix the validation errors before saving", "error");
      announceToScreenReader("Form contains validation errors. Please review all highlighted fields.", "assertive");
      
      // Scroll to first error
      const firstErrorElement = document.querySelector('.border-red-500, [aria-invalid="true"]');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstErrorElement.focus();
      }
      return;
    }

    // Frontend-Backend consistency validation
    const consistencyCheck = await validateDataConsistency(formData);
    if (!consistencyCheck.isValid) {
      showToast(`Data consistency error: ${consistencyCheck.error}`, "error");
      announceToScreenReader(`Data validation failed: ${consistencyCheck.error}`, "assertive");
      return;
    }
    setLoading(true);
    
    try {
      // Enhanced visibility and approval logic
      let visibility = 'draft';
      let requiresApproval = formData.requiresApproval;
      let workflowStatus = 'draft';
      
      if (publish) {
        if (currentUser.permissions.canBypassApproval || currentUser.role === 'admin') {
          visibility = 'published';
          requiresApproval = false;
          workflowStatus = 'published';
        } else {
          visibility = 'pending';
          requiresApproval = true;
          workflowStatus = 'pending_approval';
        }
      }

      // Comprehensive data sanitization and validation
      const sanitizedData = {
        ...formData,
        // Enhanced field sanitization with validation
        title: sanitizeInput(formData.title, { 
          maxLength: 100, 
          allowNumbers: true, 
          allowSpecialChars: false 
        }),
        description: sanitizeInput(formData.description, { 
          maxLength: 2000, 
          allowNumbers: true, 
          allowSpecialChars: true 
        }),
        shortDescription: sanitizeInput(formData.shortDescription, { 
          maxLength: 200, 
          allowNumbers: true, 
          allowSpecialChars: true 
        }),
        brand: sanitizeInput(formData.brand, { 
          maxLength: 100, 
          allowNumbers: true, 
          allowSpecialChars: false 
        }),
        sku: sanitizeInput(formData.sku, { 
          maxLength: 50, 
          allowNumbers: true, 
          allowSpecialChars: false 
        }).toUpperCase(),
        barcode: sanitizeInput(formData.barcode, { 
          maxLength: 20, 
          allowNumbers: true, 
          allowSpecialChars: false 
        }),
metaTitle: sanitizeInput(formData.metaTitle, { 
          maxLength: 60, 
          allowNumbers: true, 
          allowSpecialChars: true 
        }),
        metaDescription: sanitizeInput(formData.metaDescription, { 
          maxLength: 160, 
          allowNumbers: true, 
          allowSpecialChars: true 
        }),
        urlSlug: formData.urlSlug.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
          .substring(0, 100),
        mainImageAltText: sanitizeInput(formData.mainImageAltText, { 
          maxLength: 125, 
          allowNumbers: true, 
          allowSpecialChars: true 
        }),
        videoUrl: sanitizeURL(formData.videoUrl),
        
        // Enhanced numeric field sanitization
        sellingPrice: sanitizeNumericInput(formData.sellingPrice, { 
          min: 0, 
          max: 10000000,
          allowDecimals: true 
        }),
        buyingPrice: sanitizeNumericInput(formData.buyingPrice, { 
          min: 0, 
          max: 10000000,
          allowDecimals: true 
        }),
        discountedPrice: sanitizeNumericInput(formData.discountedPrice, { 
          min: 0, 
          allowDecimals: true 
        }),
        discountAmount: sanitizeNumericInput(formData.discountAmount, { 
          min: 0, 
          allowDecimals: true 
        }),
        stockQuantity: sanitizeNumericInput(formData.stockQuantity, { 
          min: 0, 
          max: 1000000,
          allowDecimals: false 
        }),
        lowStockThreshold: sanitizeNumericInput(formData.lowStockThreshold || "10", { 
          min: 0, 
          max: 10000,
          allowDecimals: false 
        }),
        minimumOrderQuantity: sanitizeNumericInput(formData.minimumOrderQuantity || "1", { 
          min: 1, 
          max: 1000,
          allowDecimals: false 
        }),
        maximumOrderQuantity: sanitizeNumericInput(formData.maximumOrderQuantity, { 
          min: 1, 
          allowDecimals: false 
        }),
        
        // System fields with validation
        visibility,
        workflowStatus,
        requiresApproval,
        lastModified: new Date().toISOString(),
        modifiedBy: currentUser.id || currentUser.email || 'system',
        version: (formData.version || 0) + 1,
        
        // Data integrity fields
        dataChecksum: generateDataChecksum(formData),
        validationTimestamp: new Date().toISOString(),
        
        // Audit trail
        auditLog: [
          ...(formData.auditLog || []),
{
            action: publish ? 'publish_attempt' : 'save',
            timestamp: new Date().toISOString(),
            user: currentUser.id || currentUser.email || 'system',
            changes: {},
            validation: 'passed'
          }
        ]
      };

      // Final validation before submission
      const finalValidation = validateFormData(sanitizedData, {
        title: { required: true, minLength: 3, maxLength: 100 },
        description: { required: true, minLength: 20, maxLength: 2000 },
        category: { required: true },
        sellingPrice: { required: true, validator: (v) => parseFloat(v) > 0 ? null : 'Must be greater than 0' },
        sku: { required: true, minLength: 3, maxLength: 50 }
      });

      if (!finalValidation.isValid) {
        throw new Error(`Final validation failed: ${Object.values(finalValidation.errors).join(', ')}`);
      }

      const productData = {
        ...sanitizedData,
        visibility,
        requiresApproval,
        moderatorApproved: currentUser.permissions.canBypassApproval,
        scheduledPublish: schedule || sanitizedData.scheduledPublish,
        price: parseFloat(sanitizedData.sellingPrice) || 0,
        oldPrice: parseFloat(sanitizedData.discountedPrice) > 0 ? parseFloat(sanitizedData.sellingPrice) : null,
        discountedPrice: parseFloat(sanitizedData.discountedPrice) > 0 ? parseFloat(sanitizedData.discountedPrice) : null,
        stock: parseInt(sanitizedData.stockQuantity) || 0,
        lowStockThreshold: parseInt(sanitizedData.lowStockThreshold) || 10,
        images: [
          ...(sanitizedData.mainImage ? [{ 
            url: URL.createObjectURL(sanitizedData.mainImage), 
            altText: sanitizeInput(sanitizedData.mainImageAltText || sanitizedData.title, { maxLength: 125 }),
            isMain: true 
          }] : []),
          ...sanitizedData.additionalImages.map(img => ({
            url: img.preview,
            altText: sanitizeInput(img.altText || sanitizedData.title, { maxLength: 125 }),
            isMain: false
          }))
        ],
        videoUrl: sanitizedData.videoUrl,
        adminRating: parseInt(sanitizedData.adminRating) || 0,
        badges: Array.isArray(sanitizedData.tags) ? sanitizedData.tags.map(tag => sanitizeInput(tag, { maxLength: 20 })) : [],
        variants: Array.isArray(sanitizedData.variants) ? sanitizedData.variants : [],
        barcode: sanitizedData.barcode,
        returnPolicy: sanitizedData.returnPolicy,
        includeInDeals: Boolean(sanitizedData.includeInDeals),
        dealOfTheDay: Boolean(sanitizedData.dealOfTheDay),
        countdownTimer: sanitizeInput(sanitizedData.countdownTimer, { maxLength: 50 }),
        bannerText: sanitizeInput(sanitizedData.bannerText, { maxLength: 100 }),
        badge: sanitizeInput(sanitizedData.badge, { maxLength: 20 }),
        shipping: {
          weight: sanitizeNumericInput(sanitizedData.shippingWeight, { min: 0 }),
          dimensions: {
            length: sanitizeNumericInput(sanitizedData.shippingDimensions?.length, { min: 0 }),
            width: sanitizeNumericInput(sanitizedData.shippingDimensions?.width, { min: 0 }),
            height: sanitizeNumericInput(sanitizedData.shippingDimensions?.height, { min: 0 })
          },
          freeThreshold: parseInt(sanitizedData.shippingFreeThreshold) || 1000
        },
        bundle: Array.isArray(sanitizedData.bundleComponents) && sanitizedData.bundleComponents.length > 0 ? {
          components: sanitizedData.bundleComponents,
          savings: parseFloat(sanitizedData.bundleSavings) || 0,
          preparationTime: sanitizeInput(sanitizedData.preparationTime, { maxLength: 50 }),
          servings: sanitizeInput(sanitizedData.servings, { maxLength: 20 })
        } : null,
seo: {
          metaTitle: sanitizedData.metaTitle || sanitizedData.title,
          metaDescription: sanitizedData.metaDescription || sanitizedData.shortDescription,
          urlSlug: sanitizedData.urlSlug || sanitizedData.title?.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').substring(0, 100),
          keywords: Array.isArray(sanitizedData.seoKeywords) ? sanitizedData.seoKeywords : [],
          relatedProducts: Array.isArray(sanitizedData.relatedProducts) ? sanitizedData.relatedProducts : []
        },
        // Security and audit fields
        createdBy: currentUser.role,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        csrfToken: csrfToken,
        sessionId: sessionStorage.getItem('sessionId') || 'unknown',
userAgent: navigator.userAgent,
        featured: Boolean(sanitizedData.featured),
        priority: sanitizedData.featured ? Date.now() : 0
      };

      // Submit with CSRF protection
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
        announceToScreenReader(message, "polite");
      }
      
      setUnsavedChanges(false);
      setLastSaved(new Date());
      
      // Reset form or navigate
      if (publish && !requiresApproval) {
        navigate("/admin/products");
      } else if (!silent) {
        // Reset form for another product with sanitized defaults
        const cleanFormData = {
          title: "",
          brand: "",
          category: "",
          subcategory: "",
          description: "",
          shortDescription: "",
          sellingPrice: "",
          buyingPrice: "",
          discountedPrice: "",
          discountAmount: "",
          discountType: "percentage",
          stockStatus: "In Stock",
          stockQuantity: "",
          lowStockThreshold: "10",
          sku: "",
          barcode: "",
          mainImage: null,
          mainImageAltText: "",
          additionalImages: [],
          videoUrl: "",
          tags: [],
          adminRating: 0,
          featured: false,
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
          urlSlug: "",
          seoKeywords: [],
          relatedProducts: [],
          unitOfMeasurement: "piece",
          minimumOrderQuantity: "1",
          maximumOrderQuantity: "",
          reorderLevel: "",
          supplierInfo: "",
          costPerUnit: "",
          lastRestocked: "",
          expiryDate: "",
          batchNumber: "",
          location: "",
          notes: ""
        };
        
        setFormData(cleanFormData);
        setImagePreview(null);
        setActiveTab("basic");
        setErrors({});
        
        announceToScreenReader("Form has been reset for new product entry", "polite");
      }
    } catch (error) {
      console.error("Error saving product:", error);
      const errorMessage = error.message || "Failed to save product";
      
      if (!silent) {
        showToast(errorMessage, "error");
        announceToScreenReader(`Error: ${errorMessage}`, "assertive");
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
          URL Slug
          <span className="text-xs text-gray-500 ml-1">(SEO-friendly URL)</span>
        </label>
        <div className="space-y-2">
          <Input
            value={formData.urlSlug}
            onChange={(e) => handleInputChange('urlSlug', e.target.value)}
            placeholder="product-name-url-slug"
            maxLength={100}
            className={cn(errors.urlSlug && "border-red-500")}
          />
          <div className="flex justify-between items-start mt-1">
            <div className="text-xs text-gray-500">
              <p>{formData.urlSlug.length}/100 characters</p>
              {formData.urlSlug && (
                <p className="mt-1">
                  <span className="font-medium">Preview URL:</span>{' '}
                  <span className="text-primary-600 font-mono">
                    /products/{formData.urlSlug}
                  </span>
                </p>
              )}
            </div>
            {!formData.urlSlug && formData.title && (
              <button
                type="button"
                onClick={() => {
                  const autoSlug = formData.title.toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-|-$/g, '')
                    .substring(0, 100);
                  handleInputChange('urlSlug', autoSlug);
                }}
                className="text-xs text-primary-600 hover:text-primary-700 whitespace-nowrap"
              >
                Generate from title
              </button>
            )}
          </div>
        </div>
        {errors.urlSlug && <p className="text-red-500 text-sm mt-1">{errors.urlSlug}</p>}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-2">
          <p className="text-xs text-yellow-800">
            <strong>Tips:</strong> Use lowercase letters, numbers, and hyphens only. 
            Keep it short and descriptive for better SEO.
          </p>
        </div>
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
        <h3 className="text-sm font-semibold text-green-900 mb-2 flex items-center">
          <ApperIcon name="Package" className="w-5 h-5 mr-2" />
          📝 Basic Product Information
        </h3>
        <p className="text-xs text-green-700">
          Essential details about your product that customers will see first. Complete information builds trust and improves search visibility.
        </p>
      </div>

<div>
<Input
            label="Product Name"
            type="text"
            placeholder="e.g., Premium Organic Basmati Rice 5kg Pack"
            value={formData.title}
            onChange={(e) => handleInputChange("title", e.target.value, e.target.validationInfo)}
            error={errors.title}
            required={true}
            maxLength={100}
            description="Use descriptive names with brand, type, size, and key features. This will be used for SEO and search."
            tooltip="Product names should be descriptive and include key details like brand, type, size, and main features. This helps customers find your product and improves search engine visibility. Avoid using special characters or excessive punctuation."
            helpText="Include brand, type, size, and key features for better discoverability"
            sanitize={true}
            sanitizeOptions={{ 
              maxLength: 100, 
              allowNumbers: true, 
              allowSpecialChars: false 
            }}
            validationRules={{
              required: true,
              minLength: 3,
              maxLength: 100,
              pattern: /^[a-zA-Z0-9\s\-&.()]+$/,
              patternError: "Use only letters, numbers, spaces, and basic punctuation"
            }}
            realTimeValidation={true}
            showValidationIcon={true}
            ariaLabel="Product name, required field for customer display and search"
          />
        </div>

      <div>
<div className="relative">
          <Input
            label="Brand/Manufacturer"
            type="text"
            placeholder="Type to search or enter new brand: Shan, National, PureFood..."
            value={formData.brand}
            onChange={(e) => handleInputChange("brand", e.target.value)}
            error={errors.brand}
            list="brand-suggestions"
            description="Brand name builds trust, enables filtering, and helps with customer recognition. Searchable by customers."
            sanitize={true}
            sanitizeOptions={{ maxLength: 50, allowNumbers: true, allowSpecialChars: false }}
            ariaLabel="Brand or manufacturer name"
            autoComplete="organization"
          />
          <datalist id="brand-suggestions">
            <option value="Shan Foods" />
            <option value="National Foods" />
            <option value="PureFood" />
            <option value="Laziza" />
            <option value="Ahmed Foods" />
            <option value="Organic Choice" />
            <option value="Fresh Valley" />
            <option value="Green Mart" />
          </datalist>
        </div>
      </div>

<div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center">
          <ApperIcon name="FolderTree" className="w-5 h-5 mr-2 text-blue-600" />
          Category Classification
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Main Category *
              <span className="text-gray-500 text-xs ml-1">(Primary classification)</span>
            </label>
            <div className="relative">
              <select
                value={formData.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
                className={cn(
                  "w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white",
                  errors.category && "border-red-500"
                )}
              >
                <option value="">Choose main category...</option>
                {categories.map((category) => (
                  <option key={category.Id} value={category.name}>
                    📁 {category.name}
                  </option>
                ))}
              </select>
              <ApperIcon name="ChevronDown" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
            {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subcategory
              <span className="text-gray-500 text-xs ml-1">(Specific type)</span>
            </label>
            <div className="relative">
              <select
                value={formData.subcategory}
                onChange={(e) => handleInputChange("subcategory", e.target.value)}
                disabled={!formData.category || subcategories.length === 0}
                className={cn(
                  "w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none",
                  !formData.category || subcategories.length === 0 ? "bg-gray-50 cursor-not-allowed" : "bg-white"
                )}
              >
                <option value="">
                  {!formData.category ? "Select main category first" : "Choose subcategory..."}
                </option>
                {subcategories.map((subcategory, index) => (
                  <option key={index} value={subcategory}>
                    📂 {subcategory}
                  </option>
                ))}
              </select>
              <ApperIcon name="ChevronDown" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
            {!formData.category && (
              <p className="text-xs text-gray-500 mt-1 flex items-center">
                <ApperIcon name="Info" className="w-3 h-3 mr-1" />
                Select main category to enable subcategories
              </p>
            )}
            {formData.category && subcategories.length === 0 && (
              <p className="text-xs text-yellow-600 mt-1 flex items-center">
                <ApperIcon name="AlertCircle" className="w-3 h-3 mr-1" />
                No subcategories available for this category
              </p>
            )}
</div>
        </div>
        <div className="mt-3 text-xs text-gray-500">
          <strong>Category helps with:</strong> Customer navigation, search filtering, and product organization
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Detailed Description *
          <span className="text-gray-500 text-xs ml-1">(WYSIWYG ready - supports rich formatting)</span>
        </label>
        <div className="border border-gray-300 rounded-lg">
          <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 text-xs text-gray-600 flex items-center">
            <ApperIcon name="Type" className="w-4 h-4 mr-2" />
            <span>Use clear, detailed descriptions with benefits, ingredients, usage, and specifications</span>
          </div>
          <textarea
            rows={6}
            placeholder="Example: Premium quality Organic Basmati Rice sourced from the foothills of Himalayas. 
            
Key Features:
• 100% Organic - No pesticides or chemicals
• Extra-long grain variety (8.2mm average)
• Aged for 2 years for enhanced aroma
• Low GI - Suitable for diabetics
• Rich in fiber and essential minerals

Usage: Perfect for biryanis, pulavs, and daily meals. Cooking time: 15-20 minutes.
Storage: Store in cool, dry place. Best before 12 months from packaging."
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            className={cn(
              "w-full px-3 py-2 border-0 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none rounded-b-lg",
              errors.description && "border-red-500"
            )}
            maxLength={2000}
          />
        </div>
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
        <div className="flex justify-between mt-1">
          <p className="text-xs text-gray-500">
            Include features, benefits, ingredients, usage instructions, and storage tips
          </p>
          <p className="text-xs text-gray-400">
            {formData.description.length}/2000
          </p>
        </div>
      </div>

<div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Short Description
          <span className="text-gray-500 text-xs ml-1">(For product cards and listings)</span>
        </label>
        <div className="relative">
          <textarea
            rows={3}
            placeholder="Example: Premium Organic Basmati Rice - Extra long grain, aged 2 years, perfect aroma and texture. Ideal for special occasions and daily meals. 100% natural and chemical-free."
            value={formData.shortDescription}
            onChange={(e) => handleInputChange("shortDescription", e.target.value)}
            className={cn(
              "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none",
              errors.shortDescription && "border-red-500"
            )}
            maxLength={200}
          />
          <div className="absolute top-2 right-2 text-xs text-gray-400 bg-white px-1">
            {formData.shortDescription.length}/200
          </div>
        </div>
        {errors.shortDescription && <p className="text-red-500 text-sm mt-1">{errors.shortDescription}</p>}
        <div className="flex justify-between mt-1">
          <p className="text-xs text-gray-500 flex items-center">
            <ApperIcon name="Eye" className="w-3 h-3 mr-1" />
            This appears on product cards, search results, and social media shares
          </p>
          <div className="text-xs text-gray-500">
            {formData.shortDescription.length > 150 ? "⚠️ May be truncated on mobile" : "✅ Good length"}
          </div>
        </div>
      </div>
    </div>
  );
const renderPricing = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-green-900 mb-2 flex items-center">
          <ApperIcon name="DollarSign" className="w-5 h-5 mr-2" />
          💰 Pricing & Inventory Management
        </h3>
        <p className="text-xs text-green-700">
          Set competitive pricing with automatic profit calculations and create discount strategies that boost sales
        </p>
      </div>

      {/* Core Pricing Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
          <ApperIcon name="Calculator" className="w-5 h-5 mr-2 text-blue-600" />
          Core Pricing
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selling Price (PKR) *
              <span className="text-gray-500 text-xs ml-1">(Customer pays this)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">
                Rs
              </span>
              <Input
type="number"
                placeholder="0.00"
                value={formData.sellingPrice}
                onChange={(e) => handleInputChange("sellingPrice", e.target.value, e.target.validationInfo)}
                className={cn(
                  errors.sellingPrice && "border-red-500", 
                  "pl-8 text-lg font-semibold pr-10 focus:ring-2 focus:ring-primary-500/20"
                )}
                min="0"
                step="0.01"
                max="10000000"
                tooltip="Set the price customers will pay. This should cover your costs plus desired profit margin. Consider market rates and competitor pricing."
                validationRules={{
                  required: true,
                  min: 0.01,
                  max: 10000000,
                  validator: (v) => {
                    const num = parseFloat(v);
                    if (isNaN(num)) return "Please enter a valid price";
                    if (num <= 0) return "Price must be greater than 0";
                    if (num > 1000000) return "Please verify this high price is correct";
                    return null;
                  }
                }}
                realTimeValidation={true}
                showValidationIcon={true}
                ariaLabel="Product selling price in PKR, required for customer purchases"
              />
              
              {/* Price indicators */}
              <div className="absolute right-8 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                {formData.sellingPrice && formData.buyingPrice && (
                  <span className={cn(
                    "text-xs px-1 py-0.5 rounded text-white font-medium",
                    parseFloat(formData.sellingPrice) > parseFloat(formData.buyingPrice) * 1.2 ? "bg-green-500" : 
                    parseFloat(formData.sellingPrice) > parseFloat(formData.buyingPrice) ? "bg-yellow-500" : "bg-red-500"
                  )}>
                    {((parseFloat(formData.sellingPrice) - parseFloat(formData.buyingPrice)) / parseFloat(formData.sellingPrice) * 100).toFixed(0)}%
                  </span>
                )}
                <ApperIcon name="Tag" className="w-4 h-4 text-gray-400" />
              </div>
            </div>
            
            {/* Enhanced error display */}
            {errors.sellingPrice && (
              <div className="mt-2 flex items-start space-x-2">
                <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-600">{errors.sellingPrice}</p>
              </div>
            )}
            
            {/* Pricing guidance */}
            {formData.sellingPrice && !errors.sellingPrice && (
              <div className="mt-2 text-xs text-gray-500 space-y-1">
                {formData.buyingPrice && (
                  <div className="flex justify-between">
                    <span>Profit Margin:</span>
                    <span className={cn(
                      "font-medium",
                      parseFloat(formData.sellingPrice) > parseFloat(formData.buyingPrice) * 1.2 ? "text-green-600" : 
                      parseFloat(formData.sellingPrice) > parseFloat(formData.buyingPrice) ? "text-yellow-600" : "text-red-600"
                    )}>
                      PKR {(parseFloat(formData.sellingPrice) - parseFloat(formData.buyingPrice)).toFixed(2)}
                      ({((parseFloat(formData.sellingPrice) - parseFloat(formData.buyingPrice)) / parseFloat(formData.sellingPrice) * 100).toFixed(1)}%)
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>With Tax (17%):</span>
                  <span className="font-medium">PKR {(parseFloat(formData.sellingPrice) * 1.17).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cost Price (PKR)
              <span className="text-gray-500 text-xs ml-1">(Your purchase/production cost)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">
                Rs
              </span>
              <Input
                type="number"
                placeholder="0.00"
                value={formData.buyingPrice}
                onChange={(e) => handleInputChange("buyingPrice", e.target.value)}
                className={cn(errors.buyingPrice && "border-red-500", "pl-8")}
                min="0"
                step="0.01"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <ApperIcon name="Receipt" className="w-4 h-4 text-gray-400" />
              </div>
            </div>
            {errors.buyingPrice && <p className="text-red-500 text-sm mt-1">{errors.buyingPrice}</p>}
            <p className="text-xs text-gray-500 mt-1 flex items-center">
              <ApperIcon name="Info" className="w-3 h-3 mr-1" />
              Include shipping, taxes, and handling costs
            </p>
          </div>
        </div>
      </div>

      {/* Enhanced Profit Analysis */}
      {buyingPrice > 0 && sellingPrice > 0 && (
        <div className="bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 border border-green-200 rounded-lg p-5">
          <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
            <ApperIcon name="TrendingUp" className="w-5 h-5 mr-2 text-green-600" />
            📊 Profit Analysis Dashboard
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center bg-white rounded-lg p-3 shadow-sm">
              <p className="text-gray-600 mb-1 font-medium">Profit per Unit</p>
              <p className={cn(
                "text-2xl font-bold",
                profit >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {formatPrice(profit)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {profit >= 0 ? "✅ Profitable" : "❌ Loss"}
              </p>
            </div>
            <div className="text-center bg-white rounded-lg p-3 shadow-sm">
              <p className="text-gray-600 mb-1 font-medium">Profit Margin</p>
              <p className={cn(
                "text-2xl font-bold",
                profitMargin >= 20 ? "text-green-600" : 
                profitMargin >= 10 ? "text-yellow-600" : "text-red-600"
              )}>
                {profitMargin.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {profitMargin >= 20 ? "🎯 Excellent" : 
                 profitMargin >= 10 ? "⚠️ Fair" : "📉 Low"}
              </p>
            </div>
            <div className="text-center bg-white rounded-lg p-3 shadow-sm">
              <p className="text-gray-600 mb-1 font-medium">Markup</p>
              <p className="text-2xl font-bold text-blue-600">
                {markup.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Price increase</p>
            </div>
            <div className="text-center bg-white rounded-lg p-3 shadow-sm">
              <p className="text-gray-600 mb-1 font-medium">Break-even</p>
              <p className="text-lg font-bold text-purple-600">
                {Math.ceil(50 / Math.max(profit, 1))} units
              </p>
              <p className="text-xs text-gray-500 mt-1">To earn Rs 50</p>
            </div>
          </div>
          
          {/* Profit Recommendations */}
          <div className="mt-4 p-3 bg-white rounded-lg">
            <h5 className="font-medium text-gray-800 mb-2 flex items-center">
              <ApperIcon name="Lightbulb" className="w-4 h-4 mr-2 text-yellow-500" />
              💡 Pricing Recommendations
            </h5>
            <div className="text-xs text-gray-600 space-y-1">
              {profitMargin < 10 && (
                <p className="flex items-center text-red-600">
                  <ApperIcon name="AlertTriangle" className="w-3 h-3 mr-1" />
                  Low profit margin. Consider reducing costs or increasing price.
                </p>
              )}
              {profitMargin >= 50 && (
                <p className="flex items-center text-blue-600">
                  <ApperIcon name="Target" className="w-3 h-3 mr-1" />
                  High margin - you could offer discounts to boost sales volume.
                </p>
              )}
              {profitMargin >= 15 && profitMargin < 30 && (
                <p className="flex items-center text-green-600">
                  <ApperIcon name="CheckCircle" className="w-3 h-3 mr-1" />
                  Healthy profit margin - good balance of profit and competitiveness.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Discount Management Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
          <ApperIcon name="Percent" className="w-5 h-5 mr-2 text-orange-600" />
          🏷️ Discount & Sale Pricing
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discount Type
            </label>
            <select
              value={formData.discountType}
              onChange={(e) => handleInputChange("discountType", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="percentage">📊 Percentage (%)</option>
              <option value="fixed">💰 Fixed Amount (Rs)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discount {formData.discountType === "percentage" ? "Percentage" : "Amount"}
            </label>
            <div className="relative">
              <Input
                type="number"
                placeholder={formData.discountType === "percentage" ? "0" : "0.00"}
                value={formData.discountAmount}
                onChange={(e) => handleInputChange("discountAmount", e.target.value)}
                className={cn(errors.discountAmount && "border-red-500")}
                min="0"
                max={formData.discountType === "percentage" ? "100" : undefined}
                step={formData.discountType === "percentage" ? "1" : "0.01"}
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                {formData.discountType === "percentage" ? "%" : "Rs"}
              </span>
            </div>
            {errors.discountAmount && <p className="text-red-500 text-sm mt-1">{errors.discountAmount}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Final Sale Price
              <span className="text-gray-500 text-xs ml-1">(Auto-calculated)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                Rs
              </span>
              <Input
                type="number"
                placeholder="Calculated automatically"
                value={formData.discountedPrice}
                onChange={(e) => handleInputChange("discountedPrice", e.target.value)}
                className={cn(errors.discountedPrice && "border-red-500", "pl-8 bg-gray-50")}
                min="0"
                step="0.01"
              />
            </div>
            {errors.discountedPrice && <p className="text-red-500 text-sm mt-1">{errors.discountedPrice}</p>}
          </div>
        </div>
      </div>

      {/* Enhanced Discount Display */}
      {discountPercentage > 0 && finalPrice < sellingPrice && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4">
          <h4 className="font-semibold text-orange-800 mb-3 flex items-center">
            <ApperIcon name="Tag" className="w-5 h-5 mr-2 text-orange-600" />
            🔥 Discount Impact Analysis
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center bg-white rounded-lg p-3">
              <p className="text-gray-600 mb-1">Discount</p>
              <p className="text-2xl font-bold text-orange-600">
                {discountPercentage.toFixed(1)}% OFF
              </p>
            </div>
            <div className="text-center bg-white rounded-lg p-3">
              <p className="text-gray-600 mb-1">Customer Saves</p>
              <p className="text-2xl font-bold text-red-600">
                {formatPrice(totalSavings)}
              </p>
            </div>
            <div className="text-center bg-white rounded-lg p-3">
              <p className="text-gray-600 mb-1">Final Price</p>
              <p className="text-2xl font-bold text-green-600">
                {formatPrice(finalPrice)}
              </p>
            </div>
            <div className="text-center bg-white rounded-lg p-3">
              <p className="text-gray-600 mb-1">Final Profit</p>
              <p className={cn(
                "text-xl font-bold",
                finalProfit >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {formatPrice(finalProfit)}
                <span className="text-sm block">
                  ({finalProfitMargin.toFixed(1)}%)
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Pricing Templates */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-800 mb-3 flex items-center">
          <ApperIcon name="Zap" className="w-5 h-5 mr-2 text-purple-600" />
          ⚡ Quick Pricing Templates
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (buyingPrice > 0) {
                const price = Math.round(buyingPrice * 1.5);
                handleInputChange('sellingPrice', price.toString());
                showToast("Applied 50% markup", "success");
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
                showToast("Applied 100% markup", "success");
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
              handleInputChange('discountType', 'percentage');
              handleInputChange('discountAmount', '10');
              showToast("Applied 10% discount", "success");
            }}
            disabled={!sellingPrice || sellingPrice <= 0}
            className="text-xs"
          >
            10% OFF
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              handleInputChange('discountType', 'percentage');
              handleInputChange('discountAmount', '25');
              showToast("Applied 25% discount", "success");
            }}
            disabled={!sellingPrice || sellingPrice <= 0}
            className="text-xs"
          >
            25% OFF
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (buyingPrice > 0) {
                const price = Math.round(buyingPrice * 3);
                handleInputChange('sellingPrice', price.toString());
                showToast("Applied 200% markup", "success");
              }
            }}
            disabled={!buyingPrice || buyingPrice <= 0}
            className="text-xs"
          >
            200% Markup
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              // Clear all discounts
              handleInputChange('discountAmount', '');
              handleInputChange('discountedPrice', '');
              showToast("Cleared discount", "info");
            }}
            className="text-xs text-gray-600"
          >
            Clear Discount
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2 flex items-center">
          <ApperIcon name="Info" className="w-3 h-3 mr-1" />
          Quick templates help you price competitively. You can always adjust manually.
        </p>
      </div>
    </div>
  );
const renderInventory = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
          <ApperIcon name="Package" className="w-5 h-5 mr-2" />
          📦 Inventory & Stock Management
        </h3>
        <p className="text-xs text-blue-700">
          Comprehensive inventory tracking with automated alerts, SKU management, and stock optimization tools
        </p>
      </div>

      {/* Stock Management Grid */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
          <ApperIcon name="BarChart3" className="w-5 h-5 mr-2 text-blue-600" />
          📊 Stock Levels & Status
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Stock Quantity *
              <span className="text-gray-500 text-xs ml-1">(Available units)</span>
            </label>
            <div className="relative">
              <Input
                type="number"
                placeholder="0"
                value={formData.stockQuantity}
                onChange={(e) => handleInputChange("stockQuantity", e.target.value)}
                className={cn(errors.stockQuantity && "border-red-500", "pr-16 text-lg font-semibold")}
                min="0"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                <span className="text-gray-500 text-sm">{formData.unitOfMeasurement}</span>
                <ApperIcon name="Package" className="w-4 h-4 text-gray-400" />
              </div>
            </div>
            {errors.stockQuantity && <p className="text-red-500 text-sm mt-1">{errors.stockQuantity}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Low Stock Alert Level
              <span className="text-gray-500 text-xs ml-1">(Notification trigger)</span>
            </label>
            <div className="relative">
              <Input
                type="number"
                placeholder="10"
                value={formData.lowStockThreshold}
                onChange={(e) => handleInputChange("lowStockThreshold", e.target.value)}
                className={cn(errors.lowStockThreshold && "border-red-500", "pr-16")}
                min="0"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                <span className="text-gray-500 text-sm">{formData.unitOfMeasurement}</span>
                <ApperIcon name="AlertTriangle" className="w-4 h-4 text-orange-400" />
              </div>
            </div>
            {errors.lowStockThreshold && <p className="text-red-500 text-sm mt-1">{errors.lowStockThreshold}</p>}
            <p className="text-xs text-gray-500 mt-1 flex items-center">
              <ApperIcon name="Bell" className="w-3 h-3 mr-1" />
              You'll be notified when stock reaches this level
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stock Status
              <span className="text-gray-500 text-xs ml-1">(Current availability)</span>
            </label>
            <select
              value={formData.stockStatus}
              onChange={(e) => handleInputChange("stockStatus", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="In Stock">✅ In Stock - Available</option>
              <option value="Low Stock">⚠️ Low Stock - Limited</option>
              <option value="Out of Stock">❌ Out of Stock - Unavailable</option>
              <option value="Pre-order">📋 Pre-order - Coming Soon</option>
              <option value="Discontinued">🚫 Discontinued - No Longer Available</option>
            </select>
          </div>
        </div>
      </div>

      {/* SKU and Barcode Management */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
          <ApperIcon name="Hash" className="w-5 h-5 mr-2 text-purple-600" />
          🔢 Product Identification
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SKU (Stock Keeping Unit) *
              <span className="text-gray-500 text-xs ml-1">(Unique identifier)</span>
            </label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="e.g., BR-RIC-001, VEG-TOM-500G"
                  value={formData.sku}
                  onChange={(e) => handleInputChange("sku", e.target.value)}
                  className={cn(errors.sku && "border-red-500", "pr-8")}
                  maxLength={20}
                />
                <ApperIcon name="Tag" className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const categoryPrefix = formData.category?.substring(0,3).toUpperCase() || 'PRD';
                  const titlePrefix = formData.title?.substring(0,3).toUpperCase() || 'ITM';
                  const timestamp = Date.now().toString().slice(-4);
                  const autoSku = `${categoryPrefix}-${titlePrefix}-${timestamp}`;
                  handleInputChange("sku", autoSku);
                  showToast("SKU auto-generated", "success");
                }}
                className="px-4"
                title="Generate automatic SKU"
              >
                <ApperIcon name="Shuffle" className="w-4 h-4" />
              </Button>
            </div>
            {errors.sku && <p className="text-red-500 text-sm mt-1">{errors.sku}</p>}
            <p className="text-xs text-gray-500 mt-1 flex items-center">
              <ApperIcon name="Info" className="w-3 h-3 mr-1" />
              Used for inventory tracking, ordering, and warehouse management
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Barcode
              <span className="text-gray-500 text-xs ml-1">(EAN-13, UPC, Code128)</span>
            </label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="123456789012 or scan existing barcode"
                  value={formData.barcode}
                  onChange={(e) => handleInputChange("barcode", e.target.value)}
                  className={cn(errors.barcode && "border-red-500", "pr-8")}
                />
                <ApperIcon name="BarChart" className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => showToast("Camera barcode scanning will be available soon", "info")}
                className="px-3"
                title="Scan barcode with camera (Coming Soon)"
              >
                <ApperIcon name="ScanLine" className="w-4 h-4" />
              </Button>
            </div>
            {errors.barcode && <p className="text-red-500 text-sm mt-1">{errors.barcode}</p>}
            <p className="text-xs text-gray-500 mt-1 flex items-center">
              <ApperIcon name="Smartphone" className="w-3 h-3 mr-1" />
              For point-of-sale systems and quick product identification
            </p>
          </div>
        </div>
      </div>

      {/* Order Management */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
          <ApperIcon name="ShoppingCart" className="w-5 h-5 mr-2 text-green-600" />
          🛒 Order Management
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unit of Measurement
            </label>
            <select
              value={formData.unitOfMeasurement}
              onChange={(e) => handleInputChange("unitOfMeasurement", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="piece">Piece (pcs)</option>
              <option value="kg">Kilogram (kg)</option>
              <option value="gram">Gram (g)</option>
              <option value="liter">Liter (L)</option>
              <option value="pack">Pack</option>
              <option value="box">Box</option>
              <option value="bottle">Bottle</option>
              <option value="meter">Meter (m)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Order Qty
            </label>
            <Input
              type="number"
              placeholder="1"
              value={formData.minimumOrderQuantity}
              onChange={(e) => handleInputChange("minimumOrderQuantity", e.target.value)}
              className={cn(errors.minimumOrderQuantity && "border-red-500")}
              min="1"
            />
            {errors.minimumOrderQuantity && <p className="text-red-500 text-sm mt-1">{errors.minimumOrderQuantity}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Order Qty
              <span className="text-gray-500 text-xs ml-1">(Optional)</span>
            </label>
            <Input
              type="number"
              placeholder="No limit"
              value={formData.maximumOrderQuantity}
              onChange={(e) => handleInputChange("maximumOrderQuantity", e.target.value)}
              className={cn(errors.maximumOrderQuantity && "border-red-500")}
              min="1"
            />
            {errors.maximumOrderQuantity && <p className="text-red-500 text-sm mt-1">{errors.maximumOrderQuantity}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reorder Level
              <span className="text-gray-500 text-xs ml-1">(Purchase trigger)</span>
            </label>
            <Input
              type="number"
              placeholder="0"
              value={formData.reorderLevel}
              onChange={(e) => handleInputChange("reorderLevel", e.target.value)}
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">When to restock</p>
          </div>
        </div>
      </div>

      {/* Enhanced Stock Status Dashboard */}
      {formData.stockQuantity && (
        <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-lg p-5">
          <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
            <ApperIcon name="Activity" className="w-5 h-5 mr-2 text-blue-600" />
            📊 Live Stock Status Dashboard
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center bg-white rounded-lg p-4 shadow-sm border">
              <div className="flex justify-center mb-2">
                <ApperIcon name="Package" className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-gray-600 mb-1 font-medium">Current Stock</p>
              <p className="text-3xl font-bold text-blue-600 mb-1">
                {formData.stockQuantity}
              </p>
              <p className="text-xs text-gray-500">{formData.unitOfMeasurement} available</p>
            </div>
            
            <div className="text-center bg-white rounded-lg p-4 shadow-sm border">
              <div className="flex justify-center mb-2">
                <ApperIcon name="AlertTriangle" className="w-8 h-8 text-orange-600" />
              </div>
              <p className="text-gray-600 mb-1 font-medium">Alert Level</p>
              <p className="text-3xl font-bold text-orange-600 mb-1">
                {formData.lowStockThreshold || 10}
              </p>
              <p className="text-xs text-gray-500">warning threshold</p>
            </div>
            
            <div className="text-center bg-white rounded-lg p-4 shadow-sm border">
              <div className="flex justify-center mb-2">
                <ApperIcon name="TrendingUp" className={cn("w-8 h-8",
                  parseInt(formData.stockQuantity) === 0 ? "text-red-600" :
                  parseInt(formData.stockQuantity) <= parseInt(formData.lowStockThreshold || 10) ? "text-orange-600" :
                  "text-green-600"
                )} />
              </div>
              <p className="text-gray-600 mb-1 font-medium">Status</p>
              <p className={cn(
                "text-lg font-semibold mb-1",
                parseInt(formData.stockQuantity) === 0 ? "text-red-600" :
                parseInt(formData.stockQuantity) <= parseInt(formData.lowStockThreshold || 10) ? "text-orange-600" :
                "text-green-600"
              )}>
                {parseInt(formData.stockQuantity) === 0 ? "❌ Out of Stock" :
                 parseInt(formData.stockQuantity) <= parseInt(formData.lowStockThreshold || 10) ? "⚠️ Low Stock" :
                 "✅ In Stock"}
              </p>
              <p className="text-xs text-gray-500">current status</p>
            </div>

            <div className="text-center bg-white rounded-lg p-4 shadow-sm border">
              <div className="flex justify-center mb-2">
                <ApperIcon name="Clock" className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-gray-600 mb-1 font-medium">Days Supply</p>
              <p className="text-3xl font-bold text-purple-600 mb-1">
                {Math.floor(parseInt(formData.stockQuantity) / Math.max(parseInt(formData.minimumOrderQuantity) || 1, 1))}
              </p>
              <p className="text-xs text-gray-500">at min order rate</p>
            </div>
          </div>

          {/* Stock Warnings */}
          <div className="mt-4 space-y-2">
            {parseInt(formData.stockQuantity) === 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center">
                <ApperIcon name="AlertCircle" className="w-5 h-5 text-red-600 mr-2" />
                <div>
                  <p className="text-red-800 font-medium text-sm">Critical: Out of Stock</p>
                  <p className="text-red-600 text-xs">Product is unavailable for customers. Restock immediately.</p>
                </div>
              </div>
            )}
            
            {parseInt(formData.stockQuantity) > 0 && 
             parseInt(formData.stockQuantity) <= parseInt(formData.lowStockThreshold || 10) && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center">
                <ApperIcon name="AlertTriangle" className="w-5 h-5 text-orange-600 mr-2" />
                <div>
                  <p className="text-orange-800 font-medium text-sm">Warning: Low Stock Alert</p>
                  <p className="text-orange-600 text-xs">Stock is below threshold. Consider reordering soon.</p>
                </div>
              </div>
            )}
            
            {parseInt(formData.stockQuantity) > parseInt(formData.lowStockThreshold || 10) && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center">
                <ApperIcon name="CheckCircle" className="w-5 h-5 text-green-600 mr-2" />
                <div>
                  <p className="text-green-800 font-medium text-sm">Good: Stock Levels Healthy</p>
                  <p className="text-green-600 text-xs">Sufficient inventory available for orders.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Additional Inventory Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
          <ApperIcon name="FileText" className="w-5 h-5 mr-2 text-gray-600" />
          📝 Additional Inventory Details
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Storage Location/Warehouse
            </label>
            <Input
              type="text"
              placeholder="e.g., Warehouse A, Shelf B-3, Cold Storage"
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supplier Information
            </label>
            <Input
              type="text"
              placeholder="e.g., ABC Suppliers, Contact: +92-XXX-XXXXXXX"
              value={formData.supplierInfo}
              onChange={(e) => handleInputChange("supplierInfo", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Restocked Date
            </label>
            <Input
              type="date"
              value={formData.lastRestocked}
              onChange={(e) => handleInputChange("lastRestocked", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expiry Date
              <span className="text-gray-500 text-xs ml-1">(If applicable)</span>
            </label>
            <Input
              type="date"
              value={formData.expiryDate}
              onChange={(e) => handleInputChange("expiryDate", e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Inventory Notes
            </label>
            <textarea
              rows={3}
              placeholder="Any special handling instructions, batch information, or notes about this product's inventory..."
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              maxLength={300}
            />
            <div className="text-xs text-gray-400 mt-1 text-right">
              {formData.notes.length}/300
            </div>
          </div>
        </div>
      </div>
    </div>
  );

const renderMarketing = () => (
    <div className="space-y-6">
      {/* Admin Rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          ⭐ Admin Quality Rating
        </label>
        <div className="flex items-center space-x-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleInputChange("adminRating", star)}
              className={`text-2xl transition-colors ${
                star <= formData.adminRating 
                  ? "text-yellow-500 hover:text-yellow-600" 
                  : "text-gray-300 hover:text-yellow-400"
              }`}
            >
              ⭐
            </button>
          ))}
          <span className="text-sm text-gray-600">
            ({formData.adminRating}/5 stars)
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Admin-only quality rating for internal reference and customer sorting
        </p>
      </div>

      {/* Featured Product Toggle */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          🌟 Featured Product
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.featured}
            onChange={(e) => handleInputChange("featured", e.target.checked)}
            className="mr-3 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <div>
            <div className="font-medium">Mark as Featured Product</div>
            <div className="text-sm text-gray-500">
              Featured products appear prominently on the homepage and in search results
            </div>
          </div>
        </label>
      </div>

      {/* Marketing Tags Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          🏷️ Marketing Tags
        </label>
        
        {/* Selected Tags */}
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 p-3 bg-gray-50 rounded-md">
            {formData.tags.map((tag, index) => (
              <span
                key={index}
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  tag === 'FLASH' ? 'bg-red-100 text-red-800' :
                  tag === 'FRESH' ? 'bg-green-100 text-green-800' :
                  tag === 'PREMIUM' ? 'bg-purple-100 text-purple-800' :
                  'bg-primary-100 text-primary-800'
                }`}
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleInputChange("tags", formData.tags.filter((_, i) => i !== index))}
                  className="ml-2 text-current hover:text-opacity-80"
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
              className={`px-3 py-2 text-xs border rounded-md text-left transition-colors ${
                tag === 'FLASH' ? 'border-red-300 hover:bg-red-50 hover:border-red-400 text-red-700' :
                tag === 'FRESH' ? 'border-green-300 hover:bg-green-50 hover:border-green-400 text-green-700' :
                tag === 'PREMIUM' ? 'border-purple-300 hover:bg-purple-50 hover:border-purple-400 text-purple-700' :
                'border-gray-300 hover:bg-primary-50 hover:border-primary-300'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Add New Tag */}
        <div className="flex space-x-2">
          <Input
            type="text"
            placeholder="Add custom tag"
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

      {/* Deal of the Day with Timer */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          ⚡ Deal of the Day
        </label>
        <div className="space-y-4">
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
          
          {/* Countdown Timer Settings */}
          {formData.includeInDeals && (
            <div className="ml-6 space-y-3 p-4 bg-accent-50 rounded-lg border border-accent-200">
              <h4 className="font-medium text-accent-800">Flash Sale Timer Settings</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Hours</label>
                  <Input
                    type="number"
                    placeholder="24"
                    min="0"
                    max="48"
                    value={formData.countdownHours || ''}
                    onChange={(e) => handleInputChange("countdownHours", e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Minutes</label>
                  <Input
                    type="number"
                    placeholder="0"
                    min="0"
                    max="59"
                    value={formData.countdownMinutes || ''}
                    onChange={(e) => handleInputChange("countdownMinutes", e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Seconds</label>
                  <Input
                    type="number"
                    placeholder="0"
                    min="0"
                    max="59"
                    value={formData.countdownSeconds || ''}
                    onChange={(e) => handleInputChange("countdownSeconds", e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>
              
              <div className="flex items-center text-xs text-accent-700">
                <ApperIcon name="Info" className="w-4 h-4 mr-1" />
                Timer will start when product goes live. Leave empty for default 24-hour countdown.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Banner Text Editor */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          📢 Promotional Banner Text
        </label>
        <Input
          type="text"
          placeholder="e.g., Limited Time Offer! Get 50% Off Today Only!"
          value={formData.bannerText || ''}
          onChange={(e) => handleInputChange("bannerText", e.target.value)}
          className="w-full"
        />
        <div className="flex justify-between items-center mt-2">
          <p className="text-xs text-gray-500">
            This text will appear as a promotional banner on the product card
          </p>
          <span className="text-xs text-gray-400">
            {(formData.bannerText || '').length}/100
          </span>
        </div>
      </div>

      {/* Badge Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          🏅 Product Badges
        </label>
        
        {/* Selected Badges */}
        {formData.badges && formData.badges.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 p-3 bg-gray-50 rounded-md">
            {formData.badges.map((badge, index) => (
              <span
                key={index}
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  badge === 'BESTSELLER' ? 'bg-yellow-100 text-yellow-800' :
                  badge === 'NEW' ? 'bg-blue-100 text-blue-800' :
                  badge === 'LIMITED' ? 'bg-red-100 text-red-800' :
                  badge === 'TRENDING' ? 'bg-pink-100 text-pink-800' :
                  'bg-gray-100 text-gray-800'
                }`}
              >
                {badge}
                <button
                  type="button"
                  onClick={() => handleInputChange("badges", formData.badges.filter((_, i) => i !== index))}
                  className="ml-2 text-current hover:text-opacity-80"
                >
                  <ApperIcon name="X" className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Available Badges */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {['BESTSELLER', 'NEW', 'LIMITED', 'TRENDING', 'EXCLUSIVE', 'SEASONAL'].filter(badge => !(formData.badges || []).includes(badge)).map((badge) => (
            <button
              key={badge}
              type="button"
              onClick={() => handleInputChange("badges", [...(formData.badges || []), badge])}
              className={`px-3 py-2 text-xs border rounded-md text-left transition-colors ${
                badge === 'BESTSELLER' ? 'border-yellow-300 hover:bg-yellow-50 text-yellow-700' :
                badge === 'NEW' ? 'border-blue-300 hover:bg-blue-50 text-blue-700' :
                badge === 'LIMITED' ? 'border-red-300 hover:bg-red-50 text-red-700' :
                badge === 'TRENDING' ? 'border-pink-300 hover:bg-pink-50 text-pink-700' :
                'border-gray-300 hover:bg-gray-50 text-gray-700'
              }`}
            >
              {badge}
            </button>
          ))}
        </div>
        
        <p className="text-xs text-gray-500 mt-2">
          Badges help highlight special qualities of your product to customers
        </p>
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
        id: Date.now() + Math.random(),
        altText: `${formData.title || 'Product'} - Additional Image`,
        order: formData.additionalImages.length
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
          📸 Main Product Image
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
{/* Main Image Alt Text */}
        {formData.mainImage && (
          <div className="mt-4">
            <Input
              label="Alt Text (for accessibility)"
              type="text"
              value={formData.mainImageAltText}
              onChange={(e) => handleInputChange("mainImageAltText", e.target.value)}
              placeholder="Describe the main image for screen readers"
              description="Improves SEO and accessibility. Describe what's shown in the image."
              maxLength={125}
              sanitize={true}
              sanitizeOptions={{ maxLength: 125, allowNumbers: true, allowSpecialChars: true }}
              ariaLabel="Alternative text for main product image"
            />
          </div>
        )}
      </div>

{/* Video URL */}
      <div>
        <Input
          label="🎥 Product Video URL (Optional)"
          type="url"
          value={formData.videoUrl}
          onChange={(e) => handleInputChange("videoUrl", e.target.value)}
          placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
          description="YouTube, Vimeo, or direct video URLs. Videos help increase conversion rates."
          sanitize={true}
          ariaLabel="Product video URL"
          autoComplete="url"
        />
        {formData.videoUrl && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg" role="status">
            <div className="flex items-center text-green-700">
              <ApperIcon name="Video" className="w-4 h-4 mr-2" aria-hidden="true" />
              <span className="text-sm font-medium">Video URL Added</span>
            </div>
            <p className="text-xs text-green-600 mt-1">
              Video will be embedded in the product page
            </p>
          </div>
        )}
      </div>

{/* Product Gallery with Enhanced Features */}
      {formData.additionalImages.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Product Gallery ({formData.additionalImages.length} images)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
{formData.additionalImages.map((image, index) => (
              <div key={image.id} className="relative group bg-white rounded-lg border-2 border-dashed border-gray-300 hover:border-primary-400 transition-colors">
                <img
                  src={image.preview}
                  alt={image.altText || `Additional ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 flex space-x-2">
                    {/* Move Up */}
                    <button
                      type="button"
                      onClick={() => {
                        if (index > 0) {
                          const newImages = [...formData.additionalImages];
                          [newImages[index], newImages[index - 1]] = [newImages[index - 1], newImages[index]];
                          handleInputChange("additionalImages", newImages);
                        }
                      }}
                      disabled={index === 0}
                      className="p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50"
                      title="Move up"
                    >
                      <ApperIcon name="ChevronUp" className="w-4 h-4" />
                    </button>
                    
                    {/* Move Down */}
                    <button
                      type="button"
                      onClick={() => {
                        if (index < formData.additionalImages.length - 1) {
                          const newImages = [...formData.additionalImages];
                          [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
                          handleInputChange("additionalImages", newImages);
                        }
                      }}
                      disabled={index === formData.additionalImages.length - 1}
                      className="p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50"
                      title="Move down"
                    >
                      <ApperIcon name="ChevronDown" className="w-4 h-4" />
                    </button>
                    
                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => removeAdditionalImage(image.id)}
                      className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      title="Remove image"
                    >
                      <ApperIcon name="Trash2" className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Image Order Badge */}
                <div className="absolute top-2 left-2 bg-primary-500 text-white px-2 py-1 rounded text-xs font-medium">
                  #{index + 1}
                </div>
                
                {/* Alt Text Input */}
<div className="absolute bottom-0 left-0 right-0 bg-white bg-opacity-95 p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-all">
                  <Input
                    type="text"
                    value={image.altText || ""}
                    onChange={(e) => {
                      const newImages = [...formData.additionalImages];
                      newImages[index] = { ...newImages[index], altText: e.target.value };
                      handleInputChange("additionalImages", newImages);
                    }}
                    placeholder="Alt text for this image"
                    className="text-xs h-6 text-gray-700"
                    maxLength={125}
                    sanitize={true}
                    sanitizeOptions={{ maxLength: 125, allowNumbers: true, allowSpecialChars: true }}
                    ariaLabel={`Alternative text for additional image ${index + 1}`}
                  />
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