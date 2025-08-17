import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/useToast';
import ProductService from '@/services/api/ProductService';
import { CategoryService } from '@/services/api/CategoryService';
import ApperIcon from '@/components/ApperIcon';
import Input from '@/components/atoms/Input';
import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import FormSection from '@/components/atoms/FormSection';
import Loading from '@/components/ui/Loading';
import Error from '@/components/ui/Error';
import { cn } from '@/utils/cn';
import { formatPrice } from '@/utils/currency';

const AddProduct = () => {
  const navigate = useNavigate();
  const showToast = useToast();

  // Form state with multilingual support
  const [formData, setFormData] = useState({
    productName: { english: '', urdu: '' },
    description: { english: '', urdu: '' },
    category: '',
    sellingPrice: '',
    oldPrice: '',
    stock: '',
    sku: '',
    barcode: '',
    brand: '',
    weight: '',
    dimensions: '',
    images: [],
    tags: '',
    metaTitle: '',
    metaDescription: '',
    featured: false,
    organic: false,
    halal: false,
    discountPercentage: '',
    minOrderQuantity: '1',
    maxOrderQuantity: '',
    status: 'draft'
  });

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [currentLanguage, setCurrentLanguage] = useState('english');
  const [previewMode, setPreviewMode] = useState(false);

  // Load categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCategoriesLoading(true);
        const categoriesData = await CategoryService.getAll();
        setCategories(categoriesData || []);
      } catch (error) {
        console.error('Error loading categories:', error);
        showToast.error('Failed to load categories');
      } finally {
        setCategoriesLoading(false);
      }
    };
    
    loadCategories();
  }, [showToast]);

  // Handle input changes with multilingual support
  const handleInputChange = useCallback((field, value, language = null) => {
    setFormData(prev => {
      if (language && (field === 'productName' || field === 'description')) {
        return {
          ...prev,
          [field]: {
            ...prev[field],
            [language]: value
          }
        };
      }
      return {
        ...prev,
        [field]: value
      };
    });
    
    // Clear field-specific errors
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  }, [errors]);

  // Enhanced form validation
  const validateForm = useCallback(() => {
    const newErrors = {};

    // Multilingual fields validation
    if (!formData.productName.english?.trim()) {
      newErrors.productName = 'Product name (English) is required';
    }

    if (!formData.description.english?.trim()) {
      newErrors.description = 'Description (English) is required';
    }

    // Required fields validation
    if (!formData.category || formData.category === 'select') {
      newErrors.category = 'Category is required';
    }

    if (!formData.sellingPrice || parseFloat(formData.sellingPrice) <= 0) {
      newErrors.sellingPrice = 'Valid selling price is required';
    }

    if (!formData.sku?.trim()) {
      newErrors.sku = 'SKU is required';
    }

    if (!formData.stock || parseInt(formData.stock) < 0) {
      newErrors.stock = 'Valid stock quantity is required';
    }

    // Price validation
    if (formData.oldPrice && parseFloat(formData.oldPrice) <= parseFloat(formData.sellingPrice)) {
      newErrors.oldPrice = 'Original price must be higher than selling price';
    }

    // Stock validation
    if (formData.maxOrderQuantity && parseInt(formData.maxOrderQuantity) < parseInt(formData.minOrderQuantity)) {
      newErrors.maxOrderQuantity = 'Maximum order quantity must be greater than minimum';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle form submission
  const handleSubmit = useCallback(async (e, shouldPublish = false) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showToast.error('Please fix the form errors before submitting');
      return;
    }

    setLoading(true);
    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.sellingPrice),
        sellingPrice: parseFloat(formData.sellingPrice),
        oldPrice: formData.oldPrice ? parseFloat(formData.oldPrice) : null,
        stock: parseInt(formData.stock),
        stockQuantity: parseInt(formData.stock),
        minOrderQuantity: parseInt(formData.minOrderQuantity),
        maxOrderQuantity: formData.maxOrderQuantity ? parseInt(formData.maxOrderQuantity) : null,
        discountPercentage: formData.discountPercentage ? parseFloat(formData.discountPercentage) : 0,
        status: shouldPublish ? 'active' : 'draft',
        visibility: shouldPublish ? 'public' : 'draft',
        badges: [
          ...(formData.organic ? ['ORGANIC'] : []),
          ...(formData.halal ? ['HALAL'] : []),
          ...(formData.featured ? ['FEATURED'] : [])
        ],
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        images: formData.images.length > 0 ? formData.images : ['https://via.placeholder.com/300x300?text=Product+Image']
      };

      const result = await ProductService.create(productData);
      
      const actionText = shouldPublish ? 'published' : 'saved as draft';
      showToast.success(`Product ${actionText} successfully!`);
      
      // Navigate back to manage products with success state
      navigate('/admin/products/manage', { 
        state: { 
          message: `Product "${formData.productName.english}" ${actionText} successfully`,
          type: 'success',
          productId: result.Id
        }
      });
      
    } catch (error) {
      console.error('Error creating product:', error);
      const errorMessage = error.validationErrors 
        ? error.validationErrors.join(', ')
        : error.message || 'Failed to create product';
      showToast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [formData, validateForm, navigate, showToast]);

  // Calculate discount percentage
  const calculatedDiscount = formData.oldPrice && formData.sellingPrice 
    ? Math.round(((parseFloat(formData.oldPrice) - parseFloat(formData.sellingPrice)) / parseFloat(formData.oldPrice)) * 100)
    : 0;

  if (categoriesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading type="form" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin/products/manage')}
                className="flex items-center space-x-2"
              >
                <ApperIcon name="ArrowLeft" className="w-4 h-4" />
                <span>Back to Products</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
                <p className="text-sm text-gray-600 mt-1">Create a new product with multilingual support</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setCurrentLanguage('english')}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                    currentLanguage === 'english' 
                      ? "bg-white text-gray-900 shadow-sm" 
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentLanguage('urdu')}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                    currentLanguage === 'urdu' 
                      ? "bg-white text-gray-900 shadow-sm" 
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  اردو
                </button>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
          {/* Basic Information */}
          <FormSection
            title="Basic Information"
            description="Essential product details and multilingual content"
            icon="Package"
            required
            variant="default"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name ({currentLanguage === 'english' ? 'English' : 'اردو'}) *
                  </label>
                  <Input
                    value={formData.productName[currentLanguage]}
                    onChange={(e) => handleInputChange('productName', e.target.value, currentLanguage)}
                    placeholder={currentLanguage === 'english' 
                      ? "Enter product name in English" 
                      : "اردو میں پروڈکٹ کا نام داخل کریں"
                    }
                    error={errors.productName}
                    dir={currentLanguage === 'urdu' ? 'rtl' : 'ltr'}
                    className="product-text-field"
                  />
                  {currentLanguage === 'english' && formData.productName.urdu && (
                    <p className="text-xs text-gray-500 mt-1">
                      Urdu: {formData.productName.urdu}
                    </p>
                  )}
                  {currentLanguage === 'urdu' && formData.productName.english && (
                    <p className="text-xs text-gray-500 mt-1">
                      English: {formData.productName.english}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className={cn(
                      "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm",
                      "focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20",
                      errors.category && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                    )}
                  >
                    <option value="">Select category</option>
                    {categories.map(category => (
                      <option key={category.Id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="text-xs text-red-600 mt-1">{errors.category}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SKU *
                  </label>
                  <Input
                    value={formData.sku}
                    onChange={(e) => handleInputChange('sku', e.target.value.toUpperCase())}
                    placeholder="PROD-001"
                    error={errors.sku}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description ({currentLanguage === 'english' ? 'English' : 'اردو'}) *
                  </label>
                  <textarea
                    value={formData.description[currentLanguage]}
                    onChange={(e) => handleInputChange('description', e.target.value, currentLanguage)}
                    placeholder={currentLanguage === 'english' 
                      ? "Detailed product description in English" 
                      : "اردو میں تفصیلی پروڈکٹ کی تفصیل"
                    }
                    rows={4}
                    dir={currentLanguage === 'urdu' ? 'rtl' : 'ltr'}
                    className={cn(
                      "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm",
                      "focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20",
                      "product-text-field resize-vertical",
                      errors.description && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                    )}
                  />
                  {errors.description && (
                    <p className="text-xs text-red-600 mt-1">{errors.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Brand
                    </label>
                    <Input
                      value={formData.brand}
                      onChange={(e) => handleInputChange('brand', e.target.value)}
                      placeholder="Brand name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Barcode
                    </label>
                    <Input
                      value={formData.barcode}
                      onChange={(e) => handleInputChange('barcode', e.target.value)}
                      placeholder="1234567890123"
                    />
                  </div>
                </div>
              </div>
            </div>
          </FormSection>

          {/* Pricing & Stock */}
          <FormSection
            title="Pricing & Stock"
            description="Set product pricing and inventory details"
            icon="DollarSign"
            required
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selling Price (PKR) *
                </label>
                <Input
                  type="number"
                  value={formData.sellingPrice}
                  onChange={(e) => handleInputChange('sellingPrice', e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  error={errors.sellingPrice}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Original Price (PKR)
                </label>
                <Input
                  type="number"
                  value={formData.oldPrice}
                  onChange={(e) => handleInputChange('oldPrice', e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  error={errors.oldPrice}
                />
                {calculatedDiscount > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    {calculatedDiscount}% discount
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Quantity *
                </label>
                <Input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => handleInputChange('stock', e.target.value)}
                  placeholder="0"
                  min="0"
                  error={errors.stock}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Order Quantity
                </label>
                <Input
                  type="number"
                  value={formData.minOrderQuantity}
                  onChange={(e) => handleInputChange('minOrderQuantity', e.target.value)}
                  placeholder="1"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Order Quantity
                </label>
                <Input
                  type="number"
                  value={formData.maxOrderQuantity}
                  onChange={(e) => handleInputChange('maxOrderQuantity', e.target.value)}
                  placeholder="No limit"
                  min="1"
                  error={errors.maxOrderQuantity}
                />
              </div>
            </div>
          </FormSection>

          {/* Product Specifications */}
          <FormSection
            title="Specifications"
            description="Physical dimensions and additional details"
            icon="Ruler"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight (kg)
                </label>
                <Input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  placeholder="0.0"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dimensions (L x W x H cm)
                </label>
                <Input
                  value={formData.dimensions}
                  onChange={(e) => handleInputChange('dimensions', e.target.value)}
                  placeholder="10 x 5 x 3"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma separated)
              </label>
              <Input
                value={formData.tags}
                onChange={(e) => handleInputChange('tags', e.target.value)}
                placeholder="organic, fresh, local"
              />
            </div>
          </FormSection>

          {/* Product Properties */}
          <FormSection
            title="Product Properties"
            description="Special characteristics and certifications"
            icon="Award"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => handleInputChange('featured', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">Featured Product</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.organic}
                  onChange={(e) => handleInputChange('organic', e.target.checked)}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm font-medium text-gray-700">Organic</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.halal}
                  onChange={(e) => handleInputChange('halal', e.target.checked)}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm font-medium text-gray-700">Halal Certified</span>
              </label>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </FormSection>

          {/* SEO Settings */}
          <FormSection
            title="SEO Settings"
            description="Search engine optimization settings"
            icon="Search"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Title
                </label>
                <Input
                  value={formData.metaTitle}
                  onChange={(e) => handleInputChange('metaTitle', e.target.value)}
                  placeholder="SEO title for search engines"
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
                  placeholder="Brief description for search engines"
                  rows={3}
                  maxLength={160}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-vertical"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.metaDescription.length}/160 characters
                </p>
              </div>
            </div>
          </FormSection>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/products/manage')}
              className="sm:w-auto w-full"
              disabled={loading}
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              variant="secondary"
              disabled={loading}
              className="sm:w-auto w-full"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <ApperIcon name="Loader2" className="w-4 h-4 animate-spin" />
                  <span>Saving Draft...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <ApperIcon name="Save" className="w-4 h-4" />
                  <span>Save as Draft</span>
                </div>
              )}
            </Button>

            <Button
              type="button"
              variant="primary"
              onClick={(e) => handleSubmit(e, true)}
              disabled={loading}
              className="sm:w-auto w-full"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <ApperIcon name="Loader2" className="w-4 h-4 animate-spin" />
                  <span>Publishing...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <ApperIcon name="CheckCircle" className="w-4 h-4" />
                  <span>Publish Product</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;