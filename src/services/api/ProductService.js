import mockProducts from "../mockData/products.json";
import { calculateProfitMargin } from "@/utils/currency";

// Enhanced product service with admin capabilities
let productsData = mockProducts || [];

// Validation helper functions
const validateProductData = async (product) => {
  const errors = [];
  
  if (!product.title || product.title.trim().length < 3) {
    errors.push('Title must be at least 3 characters long');
  }
  if (!product.sellingPrice || isNaN(parseFloat(product.sellingPrice)) || parseFloat(product.sellingPrice) <= 0) {
    errors.push('Selling price must be a positive number');
  }
  if (!product.category) {
    errors.push('Category is required');
  }
  if (!product.description || product.description.trim().length < 20) {
    errors.push('Description must be at least 20 characters long');
  }
  if (product.stockQuantity === undefined || isNaN(parseInt(product.stockQuantity)) || parseInt(product.stockQuantity) < 0) {
    errors.push('Stock quantity must be a non-negative number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

const sanitizeAndValidateText = (text, options = {}) => {
  if (!text && options.required !== false) {
    if (options.required === false) return '';
    throw new Error('Text is required');
  }
  
  if (!text) return options.defaultValue || '';
  
  const sanitized = text.toString().trim();
  
  if (options.minLength && sanitized.length < options.minLength) {
    throw new Error(`Text must be at least ${options.minLength} characters long`);
  }
  if (options.maxLength && sanitized.length > options.maxLength) {
    throw new Error(`Text must not exceed ${options.maxLength} characters`);
  }
  
  return sanitized;
};

const validateAndFormatPrice = (price, options = {}) => {
  if (!price && options.required === false) {
    return options.defaultValue || 0;
  }
  
  const numPrice = parseFloat(price);
  if (isNaN(numPrice) || numPrice < 0) {
    throw new Error('Price must be a valid positive number');
  }
  
  return Math.round(numPrice * 100) / 100;
};

const validateAndFormatQuantity = (quantity, options = {}) => {
  if (quantity === undefined || quantity === null) {
    if (options.required === false) {
      return options.defaultValue || 0;
    }
    throw new Error('Quantity is required');
  }
  
  const numQuantity = parseInt(quantity);
  if (isNaN(numQuantity) || numQuantity < 0) {
    throw new Error('Quantity must be a non-negative integer');
  }
  
  if (options.min !== undefined && numQuantity < options.min) {
    return options.defaultValue || options.min;
  }
  
  return numQuantity;
};

const determineStockStatus = (stock, threshold = 10) => {
  const stockNum = parseInt(stock) || 0;
  const thresholdNum = parseInt(threshold) || 10;
  
  if (stockNum === 0) return 'out-of-stock';
  if (stockNum <= thresholdNum) return 'low-stock';
  return 'in-stock';
};

const validateSku = (sku) => {
  if (!sku) return '';
  const cleanSku = sku.toString().trim().toUpperCase();
  if (cleanSku.length < 2) {
    throw new Error('SKU must be at least 2 characters long');
  }
  return cleanSku;
};

const validateBarcode = (barcode) => {
  if (!barcode) return '';
  const cleanBarcode = barcode.toString().trim();
  return cleanBarcode;
};

const validateUrl = (url) => {
  if (!url) return '';
  try {
    new URL(url);
    return url;
  } catch {
    return '';
  }
};

const generateProductChecksum = (data) => {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
};

const validateBusinessLogic = (product) => {
  const errors = [];
  
  if (product.sellingPrice && product.buyingPrice && product.sellingPrice <= product.buyingPrice) {
    errors.push('Selling price should be higher than buying price');
  }
  
  if (product.discountedPrice && product.discountedPrice >= product.sellingPrice) {
    errors.push('Discounted price should be lower than selling price');
  }
  
  if (product.minimumOrderQuantity && product.maximumOrderQuantity && 
      product.minimumOrderQuantity > product.maximumOrderQuantity) {
    errors.push('Minimum order quantity cannot be greater than maximum order quantity');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateProductUpdateData = async (data, originalProduct) => {
  const errors = [];
  
  if (data.title !== undefined && (!data.title || data.title.trim().length < 3)) {
    errors.push('Title must be at least 3 characters long');
  }
  
  if (data.sellingPrice !== undefined) {
    const price = parseFloat(data.sellingPrice);
    if (isNaN(price) || price <= 0) {
      errors.push('Selling price must be a positive number');
    }
  }
  
  if (data.stockQuantity !== undefined) {
    const stock = parseInt(data.stockQuantity);
    if (isNaN(stock) || stock < 0) {
      errors.push('Stock quantity must be a non-negative number');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const ProductService = {
  getAll: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [...productsData];
  },
  
  getAllProducts: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [...productsData];
  },
  
  getTrendingByLocation: async (location) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    // Filter products based on location preferences
    const trendingProducts = productsData.filter(product => 
      product.category === 'vegetables' || 
      product.category === 'fruits' ||
      (location && product.name.toLowerCase().includes('organic'))
    ).slice(0, 12);
    return trendingProducts;
  },

  getById: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const product = productsData.find(p => p.Id === id);
    return product ? { ...product } : null;
  },
getByCategory: async (category) => {
    await new Promise(resolve => setTimeout(resolve, 250));
    return productsData.filter(p => 
      p.category.toLowerCase() === category.toLowerCase()
    ).map(p => ({ ...p }));
  },

  getRelatedProducts: async (productId, category, options = {}) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const { priceRange = {}, badges = [], limit = 8 } = options;
    
    const allProducts = [...productsData];
    const currentProduct = allProducts.find(p => p.Id === productId);
    
    if (!currentProduct) return [];
    
    // Score-based matching algorithm
    const scoredProducts = allProducts
      .filter(p => p.Id !== productId)
      .map(product => {
        let score = 0;
        
        // Category match (highest priority)
        if (product.category.toLowerCase() === category.toLowerCase()) {
          score += 100;
        }
        
        // Price range similarity
        if (priceRange.min !== undefined && priceRange.max !== undefined) {
          if (product.price >= priceRange.min && product.price <= priceRange.max) {
            score += 50;
          }
        }
        
        // Badge similarity
        if (badges && badges.length > 0) {
          const matchingBadges = product.badges?.filter(badge => badges.includes(badge)) || [];
          score += matchingBadges.length * 15;
        }
        
        // Stock availability bonus
        if (product.stock > 0) {
          score += 10;
        }
        
        // Featured product bonus
        if (product.featured) {
          score += 5;
        }
        
        // Price proximity bonus (closer prices get higher scores)
        const priceDifference = Math.abs(product.price - currentProduct.price);
        const maxPrice = Math.max(product.price, currentProduct.price);
        const priceProximity = 1 - (priceDifference / maxPrice);
        score += priceProximity * 20;
        
        return { ...product, relatedScore: score };
      })
      .sort((a, b) => b.relatedScore - a.relatedScore)
      .slice(0, limit)
      .map(p => {
        // Remove the score before returning
        const { relatedScore, ...productWithoutScore } = p;
        return productWithoutScore;
      });
    
    return scoredProducts;
  },

  search: async (query) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const searchTerm = query.toLowerCase();
    return productsData.filter(p =>
      p.title.toLowerCase().includes(searchTerm) ||
      p.description.toLowerCase().includes(searchTerm) ||
      p.category.toLowerCase().includes(searchTerm)
    ).map(p => ({ ...p }));
  },

create: async (product) => {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Enhanced validation before creation
    const validationResult = await validateProductData(product);
    if (!validationResult.isValid) {
      throw new Error(`Product validation failed: ${validationResult.errors.join(', ')}`);
    }
    
    // Generate new ID with validation
    const maxId = Math.max(...productsData.map(p => p.Id));
    const newId = maxId + 1;
    
    // Check for duplicate SKU
    const existingSku = productsData.find(p => p.sku?.toLowerCase() === product.sku?.toLowerCase());
    if (existingSku) {
      throw new Error(`SKU '${product.sku}' already exists. Please use a unique SKU.`);
    }
    
    // Enhanced data processing with comprehensive validation
    const processedProduct = {
      ...product,
      Id: newId,
      
      // Core product fields with validation
      title: sanitizeAndValidateText(product.title, { minLength: 3, maxLength: 100 }),
      brand: sanitizeAndValidateText(product.brand, { maxLength: 100, required: false }),
      category: product.category || "",
      subcategory: product.subcategory || "",
      description: sanitizeAndValidateText(product.description, { minLength: 20, maxLength: 2000 }),
      shortDescription: sanitizeAndValidateText(product.shortDescription, { maxLength: 200, required: false }),
      
      // Enhanced pricing fields with business logic validation
      price: validateAndFormatPrice(product.sellingPrice),
      sellingPrice: validateAndFormatPrice(product.sellingPrice),
      buyingPrice: validateAndFormatPrice(product.buyingPrice, { required: false }),
      costPrice: validateAndFormatPrice(product.buyingPrice, { required: false }),
      discountedPrice: validateAndFormatPrice(product.discountedPrice, { required: false }),
      discountAmount: validateAndFormatPrice(product.discountAmount, { required: false }),
      discountType: product.discountType || "percentage",
      
      // Calculate profit metrics with validation
      profitMargin: calculateProfitMargin(product.sellingPrice, product.buyingPrice),
      
      // Inventory management with validation
      stock: validateAndFormatQuantity(product.stockQuantity),
      stockQuantity: validateAndFormatQuantity(product.stockQuantity),
      stockStatus: determineStockStatus(product.stockQuantity, product.lowStockThreshold),
      
      // Product identification with validation
      sku: validateSku(product.sku),
      barcode: validateBarcode(product.barcode),
      
      // Media and content
      mainImage: product.mainImage || "",
      mainImageAltText: sanitizeAndValidateText(product.mainImageAltText, { maxLength: 125, required: false }),
      images: product.images || [],
      tags: product.tags || [],
      
      // Physical properties
      weight: product.weight || "",
      dimensions: product.dimensions || "",
      
      // Order management with validation
      unitOfMeasurement: product.unitOfMeasurement || "piece",
      minimumOrderQuantity: validateAndFormatQuantity(product.minimumOrderQuantity, { min: 1, defaultValue: 1 }),
      maximumOrderQuantity: validateAndFormatQuantity(product.maximumOrderQuantity, { required: false }),
      reorderLevel: validateAndFormatQuantity(product.reorderLevel, { defaultValue: 0 }),
      lowStockThreshold: validateAndFormatQuantity(product.lowStockThreshold, { defaultValue: 10 }),
      
      // Supply chain information
      location: sanitizeAndValidateText(product.location, { maxLength: 100, required: false }),
      supplierInfo: sanitizeAndValidateText(product.supplierInfo, { maxLength: 200, required: false }),
      lastRestocked: product.lastRestocked || "",
      expiryDate: product.expiryDate || "",
      batchNumber: sanitizeAndValidateText(product.batchNumber, { maxLength: 50, required: false }),
      notes: sanitizeAndValidateText(product.notes, { maxLength: 300, required: false }),
      
      // Enhanced marketing fields
      bannerText: sanitizeAndValidateText(product.bannerText, { maxLength: 100, required: false }),
      badges: Array.isArray(product.badges) ? product.badges.filter(badge => typeof badge === 'string') : [],
      includeInDeals: Boolean(product.includeInDeals),
      countdownHours: product.countdownHours ? parseInt(product.countdownHours) : null,
      countdownMinutes: product.countdownMinutes ? parseInt(product.countdownMinutes) : null,
      countdownSeconds: product.countdownSeconds ? parseInt(product.countdownSeconds) : null,
      
      // SEO and marketing
      metaTitle: sanitizeAndValidateText(product.metaTitle, { maxLength: 60, required: false }),
      metaDescription: sanitizeAndValidateText(product.metaDescription, { maxLength: 160, required: false }),
      videoUrl: validateUrl(product.videoUrl),
      
      // System fields with audit trail
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      createdBy: product.createdBy || 'system',
      modifiedBy: product.modifiedBy || 'system',
      version: 1,
      
      // Status and visibility with workflow
      visibility: product.visibility || "draft",
      workflowStatus: product.workflowStatus || "draft",
      requiresApproval: product.requiresApproval || false,
      approvedAt: product.visibility === 'published' ? new Date().toISOString() : null,
      approvedBy: product.visibility === 'published' ? (product.approvedBy || 'system') : null,
      
      // Data integrity
      dataChecksum: generateProductChecksum({
        title: product.title,
        sku: product.sku,
        sellingPrice: product.sellingPrice,
        stockQuantity: product.stockQuantity
      }),
      
      // Validation metadata
      validatedAt: new Date().toISOString(),
      validationVersion: '1.0',
      
      // Audit trail
      auditLog: [{
        action: 'created',
        timestamp: new Date().toISOString(),
        user: product.createdBy || 'system',
        details: 'Product created successfully',
        validation: 'passed'
      }],
      
      // Legacy compatibility fields
      image: product.mainImage || "",
      oldPrice: validateAndFormatPrice(product.sellingPrice),
      featured: Boolean(product.featured)
    };
    
    // Final business logic validation
    const businessValidation = validateBusinessLogic(processedProduct);
    if (!businessValidation.isValid) {
      throw new Error(`Business logic validation failed: ${businessValidation.errors.join(', ')}`);
    }
    
    // Add to products array with error handling
    try {
      productsData.push(processedProduct);
      
      // Log successful creation
      console.log(`✅ Product created successfully:`, {
        id: newId,
        title: processedProduct.title,
        sku: processedProduct.sku,
        price: processedProduct.sellingPrice,
        marketing: {
          tags: processedProduct.tags,
          badges: processedProduct.badges,
          dealOfDay: processedProduct.includeInDeals,
          bannerText: processedProduct.bannerText
        }
      });
      
      return { ...processedProduct };
      
    } catch (error) {
      console.error('❌ Error adding product to data store:', error);
      throw new Error('Failed to save product to database');
    }
  },

  // Toggle product visibility
async toggleVisibility(id) {
    const product = productsData.find(p => p.Id === parseInt(id));
    if (product) {
      product.visibility = product.visibility === 'published' ? 'draft' : 'published';
      product.lastModified = new Date().toISOString();
      return product;
    }
    throw new Error('Product not found');
  },

  // Toggle featured status
async toggleFeatured(id) {
    const product = productsData.find(p => p.Id === parseInt(id));
    if (product) {
      product.featured = !product.featured;
      product.priority = product.featured ? Date.now() : 0;
      product.lastModified = new Date().toISOString();
      return product;
    }
    throw new Error('Product not found');
  },

  // Bulk update products
  bulkUpdate: async (updates) => {
    const updatedProducts = [];
    
    for (const update of updates) {
      const product = productsData.find(p => p.Id === parseInt(update.id));
      if (product) {
        Object.assign(product, update.data);
        product.lastModified = new Date().toISOString();
        updatedProducts.push(product);
      }
    }
    
    return updatedProducts;
  },

  // Bulk price adjustment
  async bulkPriceAdjustment(productIds, adjustment) {
    const updatedProducts = [];
    
    for (const id of productIds) {
      const product = productsData.find(p => p.Id === parseInt(id));
      if (product) {
        const currentPrice = parseFloat(product.price) || 0;
        let newPrice = currentPrice;
        
        if (adjustment.type === 'percentage') {
          newPrice = currentPrice * (1 + adjustment.value / 100);
        } else {
          newPrice = currentPrice + adjustment.value;
        }
        
        product.price = Math.max(0, newPrice);
        product.lastModified = new Date().toISOString();
        updatedProducts.push(product);
      }
    }
return updatedProducts;
  },

  update: async (id, updates) => {
    await new Promise(resolve => setTimeout(resolve, 350));
    const index = productsData.findIndex(p => p.Id === id);
    if (index !== -1) {
      productsData[index] = { ...productsData[index], ...updates };
      return { ...productsData[index] };
    }
    return null;
  },

delete: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = productsData.findIndex(product => product.Id === parseInt(id));
    if (index !== -1) {
      const deleted = productsData.splice(index, 1)[0];
      // Store deletion timestamp for audit
      deleted.deletedAt = new Date().toISOString();
      return { ...deleted };
    }
    return null;
  },

// Enhanced bulk operations with comprehensive validation
  bulkDelete: async (ids) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const deletedProducts = [];
    const errors = [];
    const timestamp = new Date().toISOString();
    
    // Validate input
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error('Invalid product IDs provided for bulk delete');
    }
    
    if (ids.length > 100) {
      throw new Error('Cannot delete more than 100 products at once');
    }
    
    ids.forEach((id, index) => {
      try {
        const numericId = parseInt(id);
        if (isNaN(numericId)) {
          errors.push(`Invalid ID at position ${index + 1}: ${id}`);
          return;
        }
        
        const productIndex = productsData.findIndex(product => product.Id === numericId);
        if (productIndex !== -1) {
          const product = productsData[productIndex];
          
          // Enhanced deletion with audit trail
          const deletedProduct = {
            ...product,
            deletedAt: timestamp,
            deletedBy: 'admin', // In real app, get from auth context
            deletionReason: 'bulk_delete',
            originalIndex: productIndex,
            recoverable: true,
            recoveryExpires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            
            // Add to audit log
            auditLog: [
              ...(product.auditLog || []),
              {
                action: 'deleted',
                timestamp,
                user: 'admin',
                details: 'Product deleted via bulk operation',
                recoverable: true
              }
            ]
          };
          
          productsData.splice(productIndex, 1);
          deletedProducts.push(deletedProduct);
          
          console.log(`🗑️ Product deleted: ${product.title} (ID: ${numericId})`);
        } else {
          errors.push(`Product not found: ${id}`);
        }
      } catch (error) {
        console.error(`Error deleting product ${id}:`, error);
        errors.push(`Failed to delete product ${id}: ${error.message}`);
      }
    });
    
    // Log bulk operation results
    console.log(`📊 Bulk Delete Results:`, {
      requested: ids.length,
      successful: deletedProducts.length,
      failed: errors.length,
      errors: errors.slice(0, 5) // Show first 5 errors
    });
    
    if (errors.length > 0 && deletedProducts.length === 0) {
      throw new Error(`Bulk delete failed: ${errors.join(', ')}`);
    }
    
    return {
      deletedProducts,
      errors,
      summary: {
        total: ids.length,
        successful: deletedProducts.length,
        failed: errors.length
      }
    };
  },

  bulkUpdate: async (updates) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const updatedProducts = [];
    const errors = [];
    const timestamp = new Date().toISOString();
    
    // Enhanced validation
    if (!Array.isArray(updates) || updates.length === 0) {
      throw new Error('Invalid updates data provided for bulk update');
    }
    
    if (updates.length > 100) {
      throw new Error('Cannot update more than 100 products at once');
    }
    
    for (const update of updates) {
      try {
        const { id, data } = update;
        const numericId = parseInt(id);
        
        if (isNaN(numericId)) {
          errors.push(`Invalid product ID: ${id}`);
          continue;
        }
        
        if (!data || typeof data !== 'object') {
          errors.push(`Invalid update data for product ${id}`);
          continue;
        }
        
        const productIndex = productsData.findIndex(product => product.Id === numericId);
        if (productIndex === -1) {
          errors.push(`Product not found: ${id}`);
          continue;
        }
        
        const originalProduct = { ...productsData[productIndex] };
        
        // Validate update data
        const validationResult = await validateProductUpdateData(data, originalProduct);
        if (!validationResult.isValid) {
          errors.push(`Validation failed for product ${id}: ${validationResult.errors.join(', ')}`);
          continue;
        }
        
        // Apply updates with validation
        const updatedData = {
          ...originalProduct,
          ...data,
          
          // System fields
          lastModified: timestamp,
          modifiedBy: data.modifiedBy || 'admin',
          version: (originalProduct.version || 0) + 1,
          
          // Preserve audit trail and add new entry
          auditLog: [
            ...(originalProduct.auditLog || []),
            {
              action: 'bulk_updated',
              timestamp,
              user: data.modifiedBy || 'admin',
              changes: Object.keys(data).filter(key => data[key] !== originalProduct[key]),
              details: 'Product updated via bulk operation'
            }
          ]
        };
        
        // Business logic validation
        const businessValidation = validateBusinessLogic(updatedData);
        if (!businessValidation.isValid) {
          errors.push(`Business validation failed for product ${id}: ${businessValidation.errors.join(', ')}`);
          continue;
        }
        
        // Update the product
        productsData[productIndex] = updatedData;
        updatedProducts.push({ ...updatedData });
        
        console.log(`✏️ Product updated: ${updatedData.title} (ID: ${numericId})`);
        
      } catch (error) {
        console.error(`Error updating product ${update.id}:`, error);
        errors.push(`Failed to update product ${update.id}: ${error.message}`);
      }
    }
    
    // Log bulk operation results
    console.log(`📊 Bulk Update Results:`, {
      requested: updates.length,
      successful: updatedProducts.length,
      failed: errors.length,
      errors: errors.slice(0, 5)
    });
    
    return {
      updatedProducts,
      errors,
      summary: {
        total: updates.length,
        successful: updatedProducts.length,
        failed: errors.length
      }
    };
  },

  // Enhanced bulk price adjustment with comprehensive validation
  bulkPriceAdjustment: async (ids, adjustment) => {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const updatedProducts = [];
    const errors = [];
    const timestamp = new Date().toISOString();
    
    // Validate adjustment parameters
    if (!adjustment || typeof adjustment !== 'object') {
      throw new Error('Invalid adjustment parameters provided');
    }
    
    if (!['percentage', 'fixed'].includes(adjustment.type)) {
      throw new Error('Adjustment type must be either "percentage" or "fixed"');
    }
    
    const adjustmentValue = parseFloat(adjustment.value);
    if (isNaN(adjustmentValue)) {
      throw new Error('Adjustment value must be a valid number');
    }
    
    // Validate adjustment bounds
    if (adjustment.type === 'percentage') {
      if (adjustmentValue < -100 || adjustmentValue > 1000) {
        throw new Error('Percentage adjustment must be between -100% and 1000%');
      }
    } else if (adjustment.type === 'fixed') {
      if (Math.abs(adjustmentValue) > 1000000) {
        throw new Error('Fixed adjustment amount is too large');
      }
    }
    
    // Validate IDs
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error('Invalid product IDs provided');
    }
    
    if (ids.length > 100) {
      throw new Error('Cannot adjust prices for more than 100 products at once');
    }
    
    for (const id of ids) {
      try {
        const numericId = parseInt(id);
        if (isNaN(numericId)) {
          errors.push(`Invalid product ID: ${id}`);
          continue;
        }
        
        const productIndex = productsData.findIndex(product => product.Id === numericId);
        if (productIndex === -1) {
          errors.push(`Product not found: ${id}`);
          continue;
        }
        
        const product = productsData[productIndex];
        const oldPrice = parseFloat(product.price) || 0;
        const oldSellingPrice = parseFloat(product.sellingPrice) || 0;
        
        if (oldPrice <= 0) {
          errors.push(`Product ${id} has invalid price: ${oldPrice}`);
          continue;
        }
        
        let newPrice;
        let newSellingPrice;
        
        // Calculate new prices
        if (adjustment.type === 'percentage') {
          newPrice = oldPrice * (1 + adjustmentValue / 100);
          newSellingPrice = oldSellingPrice * (1 + adjustmentValue / 100);
        } else {
          newPrice = oldPrice + adjustmentValue;
          newSellingPrice = oldSellingPrice + adjustmentValue;
        }
        
        // Ensure prices remain positive
        if (newPrice <= 0 || newSellingPrice <= 0) {
          errors.push(`Adjustment would result in negative price for product ${id}`);
          continue;
        }
        
        // Round prices to 2 decimal places
        newPrice = Math.round(newPrice * 100) / 100;
        newSellingPrice = Math.round(newSellingPrice * 100) / 100;
        
        // Validate price reasonableness
        if (newPrice > 10000000 || newSellingPrice > 10000000) {
          errors.push(`Adjusted price too high for product ${id}`);
          continue;
        }
        
        // Update product with price history
        const updatedProduct = {
          ...product,
          price: newPrice,
          sellingPrice: newSellingPrice,
          lastModified: timestamp,
          modifiedBy: 'admin',
          version: (product.version || 0) + 1,
          
          // Enhanced price history tracking
          priceHistory: [
            ...(product.priceHistory || []),
            {
              oldPrice,
              oldSellingPrice,
              newPrice,
              newSellingPrice,
              adjustmentValue,
              adjustmentType: adjustment.type,
              adjustmentReason: adjustment.reason || 'bulk_price_adjustment',
              date: timestamp,
              appliedBy: 'admin'
            }
          ],
          
          // Update audit log
          auditLog: [
            ...(product.auditLog || []),
            {
              action: 'price_adjusted',
              timestamp,
              user: 'admin',
              details: `Price adjusted: ${adjustment.type} ${adjustmentValue}${adjustment.type === 'percentage' ? '%' : ' PKR'}`,
              oldValues: { price: oldPrice, sellingPrice: oldSellingPrice },
              newValues: { price: newPrice, sellingPrice: newSellingPrice }
            }
          ]
        };
        
        productsData[productIndex] = updatedProduct;
        updatedProducts.push({ ...updatedProduct });
        
        console.log(`💰 Price adjusted for: ${product.title} (${oldPrice} → ${newPrice})`);
        
      } catch (error) {
        console.error(`Error adjusting price for product ${id}:`, error);
        errors.push(`Failed to adjust price for product ${id}: ${error.message}`);
      }
    }
    
    // Log bulk operation results
    console.log(`📊 Bulk Price Adjustment Results:`, {
      requested: ids.length,
      successful: updatedProducts.length,
      failed: errors.length,
      adjustment: `${adjustment.type} ${adjustmentValue}${adjustment.type === 'percentage' ? '%' : ' PKR'}`,
      errors: errors.slice(0, 5)
    });
    
    return {
      updatedProducts,
      errors,
      summary: {
        total: ids.length,
        successful: updatedProducts.length,
        failed: errors.length,
        adjustment: {
          type: adjustment.type,
          value: adjustmentValue
        }
      }
    };
  },

// Admin-specific methods
  toggleVisibility: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const index = productsData.findIndex(product => product.Id === parseInt(id));
    if (index !== -1) {
      const currentVisibility = productsData[index].visibility || 'published';
      productsData[index].visibility = currentVisibility === 'published' ? 'draft' : 'published';
      productsData[index].lastModified = new Date().toISOString();
      return { ...productsData[index] };
    }
    return null;
  },
toggleFeatured: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const index = productsData.findIndex(product => product.Id === parseInt(id));
    if (index !== -1) {
      productsData[index].featured = !productsData[index].featured;
      productsData[index].lastModified = new Date().toISOString();
      return { ...productsData[index] };
    }
    return null;
  },

  updateStatus: async (id, status) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const index = productsData.findIndex(product => product.Id === parseInt(id));
    if (index !== -1) {
      productsData[index].status = status;
      productsData[index].lastModified = new Date().toISOString();
      return { ...productsData[index] };
    }
    return null;
  },

  // Get featured products for homepage
  getFeaturedProducts: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return productsData
      .filter(product => product.featured && product.visibility === 'published')
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
      .slice(0, 8)
      .map(product => ({ ...product }));
  },

  // Low stock alerts
  getLowStockProducts: async (threshold = 10) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return productsData
      .filter(product => product.stock <= threshold && product.stock > 0)
      .map(product => ({ ...product }));
  },

  // Out of stock products
  getOutOfStockProducts: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return productsData
      .filter(product => product.stock === 0)
      .map(product => ({ ...product }));
  },

  // Product analytics
  getProductAnalytics: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const product = productsData.find(p => p.Id === parseInt(id));
    if (!product) return null;
    
    // Mock analytics data
    return {
      productId: id,
      views: Math.floor(Math.random() * 1000) + 100,
      clicks: Math.floor(Math.random() * 100) + 10,
      conversions: Math.floor(Math.random() * 20) + 1,
      revenue: product.price * (Math.floor(Math.random() * 50) + 5),
      lastWeekViews: Math.floor(Math.random() * 200) + 20,
      conversionRate: ((Math.floor(Math.random() * 20) + 1) / (Math.floor(Math.random() * 100) + 10) * 100).toFixed(2)
    };
  },

// Removed duplicate getByCategory function - already defined earlier in the service

  searchProducts: async (query) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    if (!query) return productsData.map(product => ({ ...product }));
    
    const lowercaseQuery = query.toLowerCase();
    return productsData
      .filter(product => 
        product.title.toLowerCase().includes(lowercaseQuery) ||
        product.sku?.toLowerCase().includes(lowercaseQuery) ||
        product.description.toLowerCase().includes(lowercaseQuery) ||
        product.brand?.toLowerCase().includes(lowercaseQuery) ||
        product.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
      )
      .map(product => ({ ...product }));
  },

  // Advanced filtering
  filterProducts: async (filters) => {
    await new Promise(resolve => setTimeout(resolve, 400));
    let filtered = [...productsData];

    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(p => p.category === filters.category);
    }

    if (filters.priceRange) {
      const { min, max } = filters.priceRange;
      if (min) filtered = filtered.filter(p => p.price >= parseFloat(min));
      if (max) filtered = filtered.filter(p => p.price <= parseFloat(max));
    }

    if (filters.stockStatus && filters.stockStatus !== 'all') {
      switch (filters.stockStatus) {
        case 'in-stock':
          filtered = filtered.filter(p => p.stock > 10);
          break;
        case 'low-stock':
          filtered = filtered.filter(p => p.stock > 0 && p.stock <= 10);
          break;
        case 'out-of-stock':
          filtered = filtered.filter(p => p.stock === 0);
          break;
      }
    }

    if (filters.tags && filters.tags !== 'all') {
      filtered = filtered.filter(p => p.badges?.includes(filters.tags));
    }

    if (filters.featured && filters.featured !== 'all') {
      const isFeatured = filters.featured === 'featured';
      filtered = filtered.filter(p => !!p.featured === isFeatured);
    }

    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(p => (p.visibility || 'published') === filters.status);
    }

    return filtered.map(product => ({ ...product }));
  },

  // Sorting methods
  sortProducts: async (products, sortBy) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const sorted = [...products];

    switch (sortBy) {
      case 'name-asc':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'name-desc':
        sorted.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'stock-asc':
        sorted.sort((a, b) => a.stock - b.stock);
        break;
      case 'stock-desc':
        sorted.sort((a, b) => b.stock - a.stock);
        break;
      case 'newest':
        sorted.sort((a, b) => b.Id - a.Id);
        break;
      case 'oldest':
        sorted.sort((a, b) => a.Id - b.Id);
        break;
      case 'last-updated':
        sorted.sort((a, b) => 
          new Date(b.lastModified || 0) - new Date(a.lastModified || 0)
        );
        break;
      default:
        // Keep original order
        break;
    }

    return sorted;
  },

getTrendingByLocation: async (location) => {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    if (!location) {
      // Fallback to general trending if no location
      return productsData
        .filter(p => p.badges?.includes("BESTSELLER"))
        .slice(0, 8)
        .map(product => ({ ...product }));
    }

    const { LocationService } = await import('./LocationService.js');
    
    // Get weather-appropriate categories
    const preferredCategories = LocationService.getWeatherBasedCategories(
      location.weather, 
      location.temperature
    );
    
    // Get seasonal product names
    const seasonalProducts = LocationService.getSeasonalProducts(location.weather);
    
    // Score products based on location context
    const scoredProducts = productsData.map(product => {
      let score = 0;
      
      // Base score for bestsellers
      if (product.badges?.includes("BESTSELLER")) score += 10;
      if (product.badges?.includes("PREMIUM")) score += 5;
      if (product.badges?.includes("FRESH")) score += 3;
      
      // Weather-based category bonus
      if (preferredCategories.includes(product.category)) {
        score += 15;
      }
      
      // Seasonal product name match bonus
      const isSeasonalMatch = seasonalProducts.some(seasonal => 
        product.title.toLowerCase().includes(seasonal.toLowerCase()) ||
        seasonal.toLowerCase().includes(product.title.toLowerCase().split(' ')[0])
      );
      if (isSeasonalMatch) score += 20;
      
      // Weather-specific bonuses
      if (location.weather === 'hot' || location.weather === 'warm') {
        if (product.category === 'diet' || product.category === 'fruits') score += 12;
        if (product.title.toLowerCase().includes('tea') || 
            product.title.toLowerCase().includes('cold') ||
            product.title.toLowerCase().includes('fresh')) score += 8;
      }
      
      if (location.weather === 'cool' || location.weather === 'cold') {
        if (product.category === 'electric' || product.category === 'foods') score += 12;
        if (product.title.toLowerCase().includes('heater') || 
            product.title.toLowerCase().includes('warm') ||
            product.title.toLowerCase().includes('ghee') ||
            product.title.toLowerCase().includes('honey')) score += 8;
      }
      
      // Stock availability penalty
      if (product.stock === 0) score -= 50;
      else if (product.stock < 10) score -= 5;
      
      // Discount bonus
      if (product.oldPrice && product.oldPrice > product.price) {
        const discountPercent = ((product.oldPrice - product.price) / product.oldPrice) * 100;
        score += Math.floor(discountPercent / 5); // 1 point per 5% discount
      }
      
      return { ...product, score };
    });
    
    // Sort by score and return top 8
    return scoredProducts
      .filter(p => p.score > 0) // Only products with positive scores
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(({ score, ...product }) => ({ ...product })); // Remove score from final result
  }
};