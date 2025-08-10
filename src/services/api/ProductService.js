import React from "react";
import { Error } from "@/components/ui/Error";
import productsData from "@/services/mockData/products.json";
import { storage } from "@/utils/storage";
import cacheManager from "@/utils/cacheManager";

function sanitizeAndValidateText(text, minLength = 1, maxLength = 255) { 
  if (typeof text !== 'string') return { isValid: false, sanitized: '', error: 'Text must be a string' };
  
  const sanitized = text
    .trim()
    .replace(/<[^>]*>/g, '') // Remove potential HTML tags
    .replace(/\s+/g, ' '); // Normalize whitespace
      
  if (sanitized.length < minLength) {
    return { isValid: false, sanitized, error: `Minimum length is ${minLength} characters` };
  }
  
  if (sanitized.length > maxLength) {
    return { isValid: false, sanitized: sanitized.substring(0, maxLength), error: `Maximum length is ${maxLength} characters` };
  }
  
  return { isValid: true, sanitized, error: null };
}

const validateAndFormatPrice = (price) => {
  const numPrice = parseFloat(price);
  
  if (isNaN(numPrice) || numPrice < 0) {
    return { isValid: false, formatted: 0, error: 'Price must be a positive number' };
  }
  
  if (numPrice > 999999) {
    return { isValid: false, formatted: numPrice, error: 'Price too high' };
  }
  
  return { isValid: true, formatted: Math.round(numPrice * 100) / 100, error: null };
};

const validateAndFormatQuantity = (quantity) => {
  const numQuantity = parseInt(quantity);
  
  if (isNaN(numQuantity) || numQuantity < 0) {
    return { isValid: false, formatted: 0, error: 'Quantity must be a positive integer' };
  }
  
  if (numQuantity > 999999) {
    return { isValid: false, formatted: numQuantity, error: 'Quantity too high' };
  }
  
  return { isValid: true, formatted: numQuantity, error: null };
};

const determineStockStatus = (quantity, minStock = 10) => {
  if (quantity === 0) return 'out_of_stock';
  if (quantity <= minStock) return 'low_stock';
  return 'in_stock';
};

const validateSku = (sku) => {
  if (!sku || typeof sku !== 'string') {
    return { isValid: false, error: 'SKU is required' };
  }
  
  const skuPattern = /^[A-Z0-9-_]{3,20}$/;
  if (!skuPattern.test(sku.toUpperCase())) {
    return { isValid: false, error: 'SKU must be 3-20 characters, alphanumeric with hyphens/underscores' };
  }
  
  return { isValid: true, error: null };
};

const validateBarcode = (barcode) => {
  if (!barcode) return { isValid: true, error: null }; // Optional field
  
  const barcodePattern = /^[0-9]{8,13}$/;
  if (!barcodePattern.test(barcode)) {
    return { isValid: false, error: 'Barcode must be 8-13 digits' };
  }
  
  return { isValid: true, error: null };
};

// Enhanced ProductService with comprehensive functionality
// Helper functions for validation
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
  return hash.toString(16);
};

const validateBusinessLogic = (product) => {
  const errors = [];
  
  if (!product.title || product.title.length < 2) {
    errors.push('Title is required and must be at least 2 characters');
  }
  
  if (!product.sku || product.sku.length < 3) {
    errors.push('SKU is required and must be at least 3 characters');
  }
  
  if (typeof product.price !== 'number' || product.price <= 0) {
    errors.push('Price must be a positive number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateProductUpdateData = async (data, originalProduct) => {
  const errors = [];
  
  if (data.price !== undefined && (typeof data.price !== 'number' || data.price <= 0)) {
    errors.push('Price must be a positive number');
  }
  
  if (data.stock !== undefined && (typeof data.stock !== 'number' || data.stock < 0)) {
    errors.push('Stock must be a non-negative number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateBulkUpdateEdgeCases = async (updates) => {
  const criticalErrors = [];
  const warnings = [];
  
  const duplicateIds = updates.map(u => u.id).filter((id, index, arr) => arr.indexOf(id) !== index);
  if (duplicateIds.length > 0) {
    criticalErrors.push(`Duplicate product IDs found: ${duplicateIds.join(', ')}`);
  }
  
  return { criticalErrors, warnings };
};

// Mock products data for service operations
const mockProducts = productsData || [];

// Main service export
const productService = {
  // Core CRUD operations
  async getById(id) {
    try {
      if (!id) throw new Error('Product ID is required');
      
      const products = await this.getAll();
      const product = products.find(p => p.Id === parseInt(id));
      
      if (!product) {
        throw new Error(`Product with ID ${id} not found`);
      }
      
      return product;
    } catch (error) {
      console.error('Error fetching product by ID:', error);
      throw error;
    }
  },

  async getAll() {
    try {
      // Get from cache first
      const cached = cacheManager.get('products:all');
      if (cached) return cached;
      
      // Load from mock data
      const products = productsData.map(product => ({
        ...product,
        Id: parseInt(product.Id),
        price: parseFloat(product.price),
        oldPrice: product.oldPrice ? parseFloat(product.oldPrice) : null,
        stock: parseInt(product.stock || 0)
      }));
      
      // Cache results
      cacheManager.set('products:all', products, 300000); // 5 minutes
      return products;
    } catch (error) {
      console.error('Error fetching all products:', error);
      throw error;
    }
  },

  async getRelatedProducts(productId, category, options = {}) {
    try {
      const { priceRange, badges, limit = 8 } = options;
      const allProducts = await this.getAll();
      
      let related = allProducts.filter(p => 
        p.Id !== parseInt(productId) && p.category === category
      );
      
      // Apply price range filter if provided
      if (priceRange) {
        related = related.filter(p => 
          p.price >= priceRange.min && p.price <= priceRange.max
        );
      }
      
      // Prioritize products with similar badges
      if (badges && badges.length > 0) {
        related.sort((a, b) => {
          const aMatches = (a.badges || []).filter(badge => badges.includes(badge)).length;
          const bMatches = (b.badges || []).filter(badge => badges.includes(badge)).length;
          return bMatches - aMatches;
        });
      }
      
      return related.slice(0, limit);
    } catch (error) {
      console.error('Error fetching related products:', error);
      return [];
    }
  },

  // Enhanced toggle product visibility with approval workflow
  async toggleVisibility(id) {
    const product = mockProducts.find(p => p.Id === parseInt(id));
    if (!product) {
      throw new Error('Product not found');
    }
    
    const currentVisibility = product.visibility || 'draft';
    const currentStatus = product.status || 'pending';
    
    // If making visible, ensure product is approved
    if (currentVisibility === 'draft') {
      if (currentStatus !== 'approved') {
        throw new Error('Product must be approved before it can be published');
      }
      product.visibility = 'published';
      product.publishedAt = new Date().toISOString();
      product.publishedBy = 'system'; // Should be passed from caller
    } else {
      product.visibility = 'draft';
      product.publishedAt = null;
      product.publishedBy = null;
    }
    
    product.lastModified = new Date().toISOString();
    
    // Add to audit log
    product.auditLog = product.auditLog || [];
    product.auditLog.push({
      action: 'visibility_toggled',
      timestamp: new Date().toISOString(),
      user: 'system',
      details: `Product ${product.visibility === 'published' ? 'published' : 'hidden'}`,
      oldValue: currentVisibility,
      newValue: product.visibility
    });
    
    return product;
  },

  // Enhanced toggle featured status with approval workflow
  async toggleFeatured(id) {
    const product = mockProducts.find(p => p.Id === parseInt(id));
    if (!product) {
      throw new Error('Product not found');
    }
    
    // Only allow featuring approved, published products
    if (product.status !== 'approved' || product.visibility !== 'published') {
      throw new Error('Only approved and published products can be featured');
    }
    
    const wasFeatured = product.featured;
    product.featured = !product.featured;
    product.priority = product.featured ? Date.now() : 0;
    product.lastModified = new Date().toISOString();
    
    // Add to audit log
    product.auditLog = product.auditLog || [];
    product.auditLog.push({
      action: 'featured_toggled',
      timestamp: new Date().toISOString(),
      user: 'system',
      details: `Product ${product.featured ? 'marked as featured' : 'removed from featured'}`,
      oldValue: wasFeatured,
      newValue: product.featured
    });
    
    return product;
  },
  
  // Bulk price adjustment
  async bulkPriceAdjustment(productIds, adjustment) {
    const updatedProducts = [];
    
    for (const id of productIds) {
      const product = mockProducts.find(p => p.Id === parseInt(id));
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
                oldValues: { 
                  title: product.title,
                  price: product.price,
                  stock: product.stock,
                  status: product.status,
                  visibility: product.visibility
                }
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

// Enhanced bulk update with comprehensive approval workflow and cache invalidation

// Enhanced bulk update with comprehensive approval workflow and cache invalidation
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
    
    // Edge case validation for bulk updates
    const validationResults = await validateBulkUpdateEdgeCases(updates);
    if (validationResults.criticalErrors.length > 0) {
      throw new Error(`Critical validation errors: ${validationResults.criticalErrors.join(', ')}`);
    }
    
    // Log warnings for non-critical issues
    if (validationResults.warnings.length > 0) {
      console.warn('Bulk update warnings:', validationResults.warnings);
    }
    
    // Track products that will affect homepage cache
    let homepageAffectedCount = 0;
    
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
        
        // Enhanced approval workflow validation
        const oldStatus = originalProduct.status || 'pending';
        const newStatus = data.status || oldStatus;
        const oldVisibility = originalProduct.visibility || 'draft';
        const newVisibility = data.visibility || oldVisibility;
        
        // Auto-approve if publishing and user has permission
        if (newVisibility === 'published' && newStatus === 'pending') {
          data.status = 'approved';
          data.approvedAt = timestamp;
          data.approvedBy = data.modifiedBy || 'admin';
          console.log(`✅ Auto-approved product ${numericId} for publication`);
        }
        
        // Auto-set publication fields when approved + published
        if (data.status === 'approved' && data.visibility === 'published') {
          data.publishedAt = timestamp;
          data.publishedBy = data.modifiedBy || 'admin';
          data.moderatorApproved = true; // backward compatibility
          
          // This will affect homepage cache
          homepageAffectedCount++;
          
          // Visibility monitoring - ensure proper publication
          if (!data.publishedAt || !data.publishedBy) {
            console.warn('Publication fields missing for approved product:', update.id);
          }
        }
        
        // Clear publication fields when draft
        if (data.visibility === 'draft') {
          data.publishedAt = null;
          data.publishedBy = null;
          
          // This will also affect homepage cache
          if (originalProduct.visibility === 'published') {
            homepageAffectedCount++;
          }
        }
        
        // Edge case handling - validate critical fields during approval
        if (data.status === 'approved') {
          const product = productsData.find(p => p.Id === numericId);
          if (product) {
            // Check for missing images
            if (!product.image && (!product.images || product.images.length === 0)) {
              data.approvalWarnings = data.approvalWarnings || [];
              data.approvalWarnings.push('missing_images');
            }
            
            // Check for negative stock
            if (product.stock < 0 || product.stockCount < 0) {
              data.approvalWarnings = data.approvalWarnings || [];
              data.approvalWarnings.push('negative_stock');
            }
            
            // Check for invalid pricing
            if (!product.price || product.price <= 0 || isNaN(product.price)) {
              data.approvalWarnings = data.approvalWarnings || [];
              data.approvalWarnings.push('invalid_pricing');
            }
          }
        }
        
        // Apply updates with enhanced workflow tracking
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
              details: 'Product updated via bulk operation with cache invalidation',
              workflowTransition: (oldStatus !== newStatus || oldVisibility !== newVisibility) ? {
                oldStatus,
                newStatus,
                oldVisibility,
                newVisibility,
                autoApproved: data.status === 'approved' && originalProduct.status !== 'approved',
                autoPublished: data.visibility === 'published' && originalProduct.visibility !== 'published',
                affectsHomepage: (data.status === 'approved' && data.visibility === 'published') || 
                               (data.visibility === 'draft' && originalProduct.visibility === 'published')
              } : null
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
        
        // Enhanced logging
        const workflowInfo = (oldStatus !== newStatus || oldVisibility !== newVisibility) ? 
          ` [${oldStatus}→${newStatus}, ${oldVisibility}→${newVisibility}]` : '';
        console.log(`✏️ Product updated: ${updatedData.title} (ID: ${numericId})${workflowInfo}`);
        
      } catch (error) {
        console.error(`Error updating product ${update.id}:`, error);
        errors.push(`Failed to update product ${update.id}: ${error.message}`);
      }
    }
    
    // Cache invalidation for homepage-affecting changes
    if (homepageAffectedCount > 0) {
      try {
        // Simulate cache invalidation middleware
console.log(`🗑️ Cache Invalidation: ${homepageAffectedCount} products affect homepage`);
        
        // Set cache headers for fresh content
        if (typeof window !== 'undefined' && window.CustomEvent) {
          // Trigger cache invalidation event for listening components
          window.dispatchEvent(new window.CustomEvent('product-cache-invalidate', {
            detail: {
              type: 'bulk_approval',
              affectedCount: homepageAffectedCount,
              timestamp: Date.now(),
              cacheHeaders: {
                'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
                'Pragma': 'no-cache',
                'Expires': '0'
              }
            }
          }));
        }
        
        console.log('✅ Cache invalidation completed - homepage will show fresh content');
      } catch (cacheError) {
        console.warn('Cache invalidation failed:', cacheError);
      }
    }
    
    // Enhanced logging with workflow metrics
    const workflowChanges = updatedProducts.filter(p => 
      p.auditLog?.[p.auditLog.length - 1]?.workflowTransition
    ).length;
    
    console.log(`📊 Enhanced Bulk Update Results:`, {
      requested: updates.length,
      successful: updatedProducts.length,
      failed: errors.length,
      workflowChanges,
      homepageAffected: homepageAffectedCount,
      cacheInvalidated: homepageAffectedCount > 0,
      errors: errors.slice(0, 5)
    });
    
    return {
      updatedProducts,
      errors,
      summary: {
        total: updates.length,
        successful: updatedProducts.length,
        failed: errors.length,
        workflowChanges,
        homepageAffected: homepageAffectedCount,
        cacheInvalidated: homepageAffectedCount > 0
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
    
    // Monitoring implementation - Check for visibility issues
    const checkVisibilityIssues = () => {
      const approvedButHidden = mockProducts.filter(p => 
        p.status === 'approved' && 
        p.moderatorApproved === true &&
        (p.visibility !== 'published' || !p.publishedAt)
      );
      
      if (approvedButHidden.length > 0) {
        console.warn('⚠️ Visibility Alert: Approved products not visible:', {
          count: approvedButHidden.length,
          products: approvedButHidden.map(p => ({
            id: p.Id,
            name: p.name,
            status: p.status,
            visibility: p.visibility,
            approvedAt: p.approvedAt
          }))
        });
        
        return {
          alertTriggered: true,
          count: approvedButHidden.length,
          products: approvedButHidden
        };
      }
      
      return { alertTriggered: false, count: 0 };
    };
    
    // Edge case validation function
// Function moved to proper scope before main export
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
        
        // Update product with price history and workflow considerations
        const updatedProduct = {
          ...product,
          price: newPrice,
          sellingPrice: newSellingPrice,
          lastModified: timestamp,
          modifiedBy: 'admin',
          version: (product.version || 0) + 1,
          
          // If price change is significant, may need re-approval
          requiresReapproval: product.status === 'approved' && Math.abs((newPrice - oldPrice) / oldPrice) > 0.5,
          
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
              appliedBy: 'admin',
              requiresReapproval: product.status === 'approved' && Math.abs((newPrice - oldPrice) / oldPrice) > 0.5
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
              newValues: { price: newPrice, sellingPrice: newSellingPrice },
              workflowImpact: product.status === 'approved' && Math.abs((newPrice - oldPrice) / oldPrice) > 0.5 ? 
                'significant_price_change_requires_reapproval' : 'minor_change'
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
// Enhanced async toggleVisibility with approval workflow and cache invalidation
  toggleVisibility: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const index = productsData.findIndex(product => product.Id === parseInt(id));
    if (index === -1) {
return null;
    }
    
    const product = productsData[index];
    const currentVisibility = product.visibility || 'draft';
    const currentStatus = product.status || 'pending';
    const timestamp = new Date().toISOString();

    // Auto-approve and publish if needed
    if (currentVisibility === 'draft' && currentStatus === 'pending') {
      productsData[index] = {
        ...product,
        visibility: 'published',
        status: 'approved',
        approvedAt: timestamp,
        approvedBy: 'admin',
        publishedAt: timestamp,
        publishedBy: 'admin',
        lastModified: timestamp,
        
        auditLog: [
          ...(product.auditLog || []),
          {
            action: 'auto_approved_and_published',
            timestamp,
            user: 'admin',
            details: 'Product auto-approved and published in single action',
            workflowTransition: {
              oldStatus: currentStatus,
              newStatus: 'approved',
              oldVisibility: currentVisibility,
              newVisibility: 'published',
              autoApproved: true,
              affectsHomepage: true
            }
          }
        ]
      };
      
      // Trigger cache invalidation for homepage
      try {
        if (typeof window !== 'undefined' && window.CustomEvent) {
          window.dispatchEvent(new window.CustomEvent('product-cache-invalidate', {
            detail: {
              type: 'auto_approve_publish',
              productId: parseInt(id),
              timestamp: Date.now(),
              cacheHeaders: {
                'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
                'Pragma': 'no-cache',
                'Expires': '0'
              }
            }
          }));
        }
        console.log(`✅ Product ${id} auto-approved and published with cache invalidation`);
      } catch (cacheError) {
        console.warn('Cache invalidation failed:', cacheError);
      }
      
      return { ...productsData[index] };
    }
    
    // Regular visibility toggle for approved products
    const newVisibility = currentVisibility === 'published' ? 'draft' : 'published';
    const affectsHomepage = newVisibility === 'published' || currentVisibility === 'published';
    
    productsData[index] = {
      ...product,
      visibility: newVisibility,
      lastModified: timestamp,
      publishedAt: newVisibility === 'published' ? timestamp : null,
      publishedBy: newVisibility === 'published' ? 'admin' : null,
      
      // Update audit log
      auditLog: [
        ...(product.auditLog || []),
        {
          action: 'visibility_toggled',
          timestamp,
          user: 'admin',
          details: `Product ${newVisibility === 'published' ? 'published to homepage' : 'hidden from homepage'}`,
          oldValue: currentVisibility,
          newValue: newVisibility,
          workflowCompliant: currentStatus === 'approved',
          affectsHomepage
        }
      ]
    };
    
    // Cache invalidation for homepage-affecting changes
    if (affectsHomepage) {
      try {
        if (typeof window !== 'undefined' && window.CustomEvent) {
          window.dispatchEvent(new window.CustomEvent('product-cache-invalidate', {
            detail: {
              type: 'visibility_toggle',
              productId: parseInt(id),
              newVisibility,
              timestamp: Date.now(),
              cacheHeaders: {
                'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
                'Pragma': 'no-cache',
                'Expires': '0'
              }
            }
          }));
        }
        console.log(`✅ Product ${id} visibility toggled with cache invalidation`);
      } catch (cacheError) {
        console.warn('Cache invalidation failed:', cacheError);
      }
    }
    
    return { ...productsData[index] };
  },
// Enhanced async toggleFeatured with approval workflow
  toggleFeatured: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const index = productsData.findIndex(product => product.Id === parseInt(id));
    if (index === -1) {
      throw new Error('Product not found');
    }
    
    const product = productsData[index];
    
    // Strict validation: Only allow featuring approved, published products
    if (product.status !== 'approved') {
      throw new Error('Only approved products can be featured');
    }
    
    if (product.visibility !== 'published') {
      throw new Error('Only published products can be featured');
    }
    
    const wasFeatured = product.featured;
    const timestamp = new Date().toISOString();
    
    productsData[index] = {
      ...product,
      featured: !product.featured,
      priority: !product.featured ? Date.now() : 0,
      lastModified: timestamp,
      
      // Update audit log
      auditLog: [
        ...(product.auditLog || []),
        {
          action: 'featured_toggled',
          timestamp,
          user: 'admin',
          details: `Product ${!product.featured ? 'marked as featured for homepage' : 'removed from homepage featured section'}`,
          oldValue: wasFeatured,
          newValue: !product.featured,
          workflowCompliant: true,
          affectsHomepage: true
        }
      ]
    };
    
    // Cache invalidation for featured changes (affects homepage)
    try {
      if (typeof window !== 'undefined' && window.CustomEvent) {
        window.dispatchEvent(new window.CustomEvent('product-cache-invalidate', {
          detail: {
            type: 'featured_toggle',
            productId: parseInt(id),
            newFeaturedStatus: !product.featured,
            timestamp: Date.now(),
            cacheHeaders: {
              'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          }
        }));
      }
      console.log(`✅ Product ${id} featured status toggled with homepage cache invalidation`);
    } catch (cacheError) {
      console.warn('Cache invalidation failed:', cacheError);
    }
    
    return { ...productsData[index] };
  },

  // Enhanced status update with workflow validation and cache invalidation
  updateStatus: async (id, status) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const index = productsData.findIndex(product => product.Id === parseInt(id));
    if (index === -1) {
      return null;
    }
    
    const product = productsData[index];
    const oldStatus = product.status || 'pending';
    const oldVisibility = product.visibility || 'draft';
    const timestamp = new Date().toISOString();
    let affectsHomepage = false;
    
    // Status-specific updates
    const statusUpdates = {
      status,
      lastModified: timestamp
    };
    
    if (status === 'approved') {
      statusUpdates.approvedAt = timestamp;
      statusUpdates.approvedBy = 'admin';
      statusUpdates.moderatorApproved = true; // backward compatibility
      
      // Auto-publish approved products
      if (product.visibility === 'draft' || !product.visibility) {
        statusUpdates.visibility = 'published';
        statusUpdates.publishedAt = timestamp;
        statusUpdates.publishedBy = 'admin';
        affectsHomepage = true;
      } else if (product.visibility === 'published') {
        affectsHomepage = true;
      }
      
    } else if (status === 'rejected') {
      statusUpdates.rejectedAt = timestamp;
      statusUpdates.rejectedBy = 'admin';
      statusUpdates.visibility = 'draft'; // Hide rejected products
      
      // If was published, this affects homepage
      if (oldVisibility === 'published') {
        affectsHomepage = true;
      }
    }
    
    productsData[index] = {
      ...product,
      ...statusUpdates,
      
      // Update audit log
      auditLog: [
        ...(product.auditLog || []),
        {
          action: 'status_updated',
          timestamp,
          user: 'admin',
          details: `Product status changed from ${oldStatus} to ${status}${affectsHomepage ? ' with homepage impact' : ''}`,
          oldValue: oldStatus,
          newValue: status,
          workflowStep: status,
          affectsHomepage,
          visibilityChange: statusUpdates.visibility !== oldVisibility
        }
      ]
    };
    
    // Cache invalidation for homepage-affecting status changes
    if (affectsHomepage) {
      try {
        if (typeof window !== 'undefined' && window.CustomEvent) {
          window.dispatchEvent(new window.CustomEvent('product-cache-invalidate', {
            detail: {
              type: 'status_update',
              productId: parseInt(id),
              newStatus: status,
              newVisibility: statusUpdates.visibility,
              timestamp: Date.now(),
              cacheHeaders: {
                'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
                'Pragma': 'no-cache',
                'Expires': '0'
              }
            }
          }));
        }
        console.log(`✅ Product ${id} status updated to ${status} with homepage cache invalidation`);
      } catch (cacheError) {
        console.warn('Cache invalidation failed:', cacheError);
      }
    }
    
    return { ...productsData[index] };
  },

  // Enhanced get featured products with approval workflow
  getFeaturedProducts: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return productsData
      .filter(product => 
        product.featured && 
        product.visibility === 'published' && 
        product.status === 'approved' // strict approval check
      )
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
      .slice(0, 12) // Show more featured products on homepage
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

    // Enhanced tag filtering
    if (filters.tags && filters.tags !== 'all') {
      filtered = filtered.filter(p => 
        p.badges?.includes(filters.tags) || 
        p.tags?.includes(filters.tags)
      );
    }

    // Enhanced featured filtering
    if (filters.featured && filters.featured !== 'all') {
      if (filters.featured === 'featured') {
        filtered = filtered.filter(p => 
          p.featured || 
          p.badges?.includes("BESTSELLER") ||
          p.badges?.includes("PREMIUM")
        );
      } else if (filters.featured === 'regular') {
        filtered = filtered.filter(p => 
          !p.featured && 
          !p.badges?.includes("BESTSELLER") &&
          !p.badges?.includes("PREMIUM")
        );
      }
    }

    // Enhanced status filtering with approval workflow
    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'published') {
        filtered = filtered.filter(p => 
          p.visibility === 'published' && (p.status === 'approved' || !p.status)
        );
      } else if (filters.status === 'draft') {
        filtered = filtered.filter(p => 
          p.visibility === 'draft' || p.status === 'pending' || p.status === 'rejected'
        );
      } else {
        filtered = filtered.filter(p => (p.visibility || 'published') === filters.status);
      }
    }
    
    // Additional approval status filter
    if (filters.approvalStatus && filters.approvalStatus !== 'all') {
      filtered = filtered.filter(p => (p.status || 'pending') === filters.approvalStatus);
    }

    // Advanced search filtering
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.tags?.some(tag => tag.toLowerCase().includes(query)) ||
        p.badges?.some(badge => badge.toLowerCase().includes(query))
      );
    }

    return filtered.map(product => ({ ...product }));
  },

  // New method for getting available tags/badges
  getAvailableTags: async () => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const allTags = new Set();
    
    productsData.forEach(product => {
      if (product.badges) {
        product.badges.forEach(badge => allTags.add(badge));
      }
      if (product.tags) {
        product.tags.forEach(tag => allTags.add(tag));
      }
    });
    
    return Array.from(allTags).sort();
  },

  // Enhanced method for getting featured products with approval workflow
  getFeaturedProductsAdvanced: async (options = {}) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const { limit = 8, category = null, excludeIds = [] } = options;
    
    const scoredProducts = productsData
      .filter(product => 
        product.visibility === 'published' && 
        product.status === 'approved' && // strict approval requirement
        !excludeIds.includes(product.Id) &&
        (category ? product.category.toLowerCase() === category.toLowerCase() : true)
      )
      .map(product => {
        let score = 0;
        
        // Featured status gets highest priority
        if (product.featured) score += 30;
        
        // Approval status scoring
        if (product.status === 'approved') score += 25;
        
        // Badge-based scoring
        if (product.badges?.includes("BESTSELLER")) score += 15;
        if (product.badges?.includes("PREMIUM")) score += 12;
        if (product.badges?.includes("FRESH")) score += 10;
        if (product.badges?.includes("ORGANIC")) score += 8;
        if (product.badges?.includes("HALAL")) score += 6;
        
        // Stock availability
        if (product.stock > 0) score += 5;
        if (product.stock > 50) score += 3;
        
        // Discount bonus
        if (product.oldPrice && product.oldPrice > product.price) {
          const discountPercent = ((product.oldPrice - product.price) / product.oldPrice) * 100;
          score += Math.floor(discountPercent / 5);
        }
        
        // Rating bonus
        if (product.rating) {
          score += product.rating * 2;
        }
        
        return { ...product, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ score, ...product }) => product);
      
    return scoredProducts;
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
      const mockProducts = productsData;
      return mockProducts
        .filter(p => p.badges?.includes("BESTSELLER"))
        .slice(0, 8)
        .map(product => ({ ...product }));
    }

    try {
      const { LocationService } = await import('@/services/api/LocationService');
      
      // Get weather-appropriate categories
      const preferredCategories = LocationService.getWeatherBasedCategories(
        location.weather, 
        location.temperature
      );
      
      // Get seasonal product names
      const seasonalProducts = LocationService.getSeasonalProducts(location.weather);
      
      // Score products based on location context
      const mockProducts = productsData;
      const scoredProducts = mockProducts.map(product => {
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
          product.title?.toLowerCase().includes(seasonal.toLowerCase()) ||
          seasonal.toLowerCase().includes(product.title?.toLowerCase().split(' ')[0])
        );
        if (isSeasonalMatch) score += 20;
        
        // Weather-specific bonuses
        if (location.weather === 'hot' || location.weather === 'warm') {
          if (product.category === 'diet' || product.category === 'fruits') score += 12;
          if (product.title?.toLowerCase().includes('tea') || 
              product.title?.toLowerCase().includes('cold') ||
              product.title?.toLowerCase().includes('fresh')) score += 8;
        }
        
        if (location.weather === 'cool' || location.weather === 'cold') {
          if (product.category === 'electric' || product.category === 'foods') score += 12;
          if (product.title?.toLowerCase().includes('heater') || 
              product.title?.toLowerCase().includes('warm') ||
              product.title?.toLowerCase().includes('ghee') ||
              product.title?.toLowerCase().includes('honey')) score += 8;
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
    } catch (error) {
      console.warn('LocationService import failed, using fallback:', error);
      const mockProducts = productsData;
      return mockProducts
        .filter(p => p.badges?.includes("BESTSELLER"))
        .slice(0, 8)
.map(product => ({ ...product }));
    }
  },

// Enhanced create method with comprehensive validation
  async create(productData) {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      // Generate new ID
      const maxId = Math.max(...productsData.map(p => p.Id || 0), 0);
      const newId = maxId + 1;
      
// Enhanced field mapping from form to expected service fields
      const fieldMapping = {
        'sellingPrice': 'price',
        'category': 'category',
        'sku': 'sku'
      };
      
      // Create mapped data with proper field transformation
      const mappedData = { ...productData };
      
      // Apply field mapping transformations
      Object.keys(fieldMapping).forEach(formField => {
        const serviceField = fieldMapping[formField];
        if (productData[formField] !== undefined && productData[formField] !== null) {
          mappedData[serviceField] = productData[formField];
          // Keep original field for backward compatibility
          if (formField !== serviceField) {
            mappedData[formField] = productData[formField];
          }
        }
      });
      
      // Enhanced validation with multiple field name checks
// Enhanced validation with comprehensive field checking and null safety
      const validationErrors = [];
      
      // Product Name validation - check for title or productName field
      const titleValue = mappedData.title || mappedData.productName || productData.title || productData.productName;
      if (!titleValue || 
          (typeof titleValue === 'string' && titleValue.trim() === '') ||
          titleValue === null || 
          titleValue === undefined) {
        validationErrors.push('Short Description is required and cannot be empty');
      }
      
      // Category validation - comprehensive empty check with multiple field variations
      const categoryValue = mappedData.category || productData.category;
      if (!categoryValue || 
          (typeof categoryValue === 'string' && (categoryValue.trim() === '' || categoryValue === 'select')) ||
          categoryValue === null || 
          categoryValue === undefined) {
        validationErrors.push('Category is required and cannot be empty');
      }
      
      // Price validation - check all possible price field variations with comprehensive validation
      const priceValue = mappedData.price || productData.sellingPrice || productData.price || mappedData.sellingPrice;
      
      if (!priceValue || 
          (typeof priceValue === 'string' && priceValue.trim() === '') || 
          priceValue === null || 
          priceValue === undefined) {
        validationErrors.push('Selling Price is required and cannot be empty');
      } else {
        const numericPrice = typeof priceValue === 'string' ? parseFloat(priceValue.trim()) : parseFloat(priceValue);
        if (isNaN(numericPrice) || numericPrice <= 0) {
          validationErrors.push('Selling Price is required and cannot be empty');
        }
      }
      
      // SKU validation - comprehensive validation with whitespace and null checks
      const skuValue = mappedData.sku || productData.sku;
      if (!skuValue || 
          (typeof skuValue === 'string' && skuValue.trim() === '') ||
          skuValue === null || 
          skuValue === undefined) {
        validationErrors.push('Sku is required and cannot be empty');
      }
      
      if (validationErrors.length > 0) {
        const error = new Error(`Final validation failed: ${validationErrors.join(', ')}`);
        error.validationErrors = validationErrors;
        throw error;
      }
      
      // Create the new product
const newProduct = {
        ...mappedData,
        Id: newId,
        price: parseFloat(mappedData.price || productData.sellingPrice || productData.price || 0),
        sellingPrice: parseFloat(mappedData.sellingPrice || mappedData.price || productData.sellingPrice || 0),
        stock: parseInt(mappedData.stock || mappedData.stockQuantity || 0),
        status: 'pending',
        visibility: 'draft',
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        version: 1,
        auditLog: [{
          action: 'created',
          timestamp: new Date().toISOString(),
          user: 'admin',
          details: 'Product created via form submission'
        }]
      };
      
      // Add to products array
      productsData.push(newProduct);
      
      // Clear cache
      cacheManager.clear('products:all');
      
      console.log(`✅ Product created successfully: ${newProduct.title} (ID: ${newId})`);
      
      return { ...newProduct };
      
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }
};

// Export both named and default for compatibility
export { productService };
export default productService;
export { productService as ProductService };