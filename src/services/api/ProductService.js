import productsData from "@/services/mockData/products.json";

// Enhanced product service with admin capabilities
let nextId = Math.max(...productsData.map(p => p.Id)) + 1;

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
    
    // Generate new ID
    const maxId = Math.max(...productsData.map(p => p.Id));
    const newId = maxId + 1;
    
    // Process and validate inventory data
    const processedProduct = {
      ...product,
      Id: newId,
      // Core product fields
      title: product.title || "",
      brand: product.brand || "",
      category: product.category || "",
      subcategory: product.subcategory || "",
      description: product.description || "",
      shortDescription: product.shortDescription || "",
      
      // Enhanced pricing fields
      price: parseFloat(product.sellingPrice) || 0,
      sellingPrice: parseFloat(product.sellingPrice) || 0,
      buyingPrice: parseFloat(product.buyingPrice) || 0,
      costPrice: parseFloat(product.buyingPrice) || 0,
      discountedPrice: parseFloat(product.discountedPrice) || 0,
      discountAmount: parseFloat(product.discountAmount) || 0,
      discountType: product.discountType || "percentage",
      
      // Calculate profit metrics
      profit: (parseFloat(product.sellingPrice) || 0) - (parseFloat(product.buyingPrice) || 0),
      profitMargin: parseFloat(product.buyingPrice) > 0 ? 
        (((parseFloat(product.sellingPrice) || 0) - (parseFloat(product.buyingPrice) || 0)) / (parseFloat(product.buyingPrice) || 0)) * 100 : 0,
      
      // Enhanced inventory fields
      stock: parseInt(product.stockQuantity) || 0,
      stockQuantity: parseInt(product.stockQuantity) || 0,
      stockStatus: product.stockStatus || "In Stock",
      lowStockThreshold: parseInt(product.lowStockThreshold) || 10,
      sku: product.sku || `PRD-${newId}`,
      barcode: product.barcode || "",
      
      // Order management
      unitOfMeasurement: product.unitOfMeasurement || "piece",
      minimumOrderQuantity: parseInt(product.minimumOrderQuantity) || 1,
      maximumOrderQuantity: parseInt(product.maximumOrderQuantity) || null,
      reorderLevel: parseInt(product.reorderLevel) || 0,
      
      // Additional inventory details
      location: product.location || "",
      supplierInfo: product.supplierInfo || "",
      lastRestocked: product.lastRestocked || "",
      expiryDate: product.expiryDate || "",
      batchNumber: product.batchNumber || "",
      notes: product.notes || "",
      
      // System fields
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      visibility: product.visibility || "draft",
      
      // Legacy compatibility
      image: product.mainImage || "",
      oldPrice: parseFloat(product.sellingPrice) || 0,
      badges: product.badges || [],
      featured: product.featured || false
    };
    
    // Add to products array
    productsData.push(processedProduct);
    
    return { ...processedProduct };
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

  // Bulk operations
bulkDelete: async (ids) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const deletedProducts = [];
    const timestamp = new Date().toISOString();
    
    ids.forEach(id => {
      const index = productsData.findIndex(product => product.Id === parseInt(id));
      if (index !== -1) {
        const deleted = productsData.splice(index, 1)[0];
        deleted.deletedAt = timestamp;
        deletedProducts.push(deleted);
      }
    });
    
return deletedProducts;
  },

  bulkUpdate: async (updates) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const updatedProducts = [];
    const timestamp = new Date().toISOString();
    
    updates.forEach(({ id, data }) => {
      const index = productsData.findIndex(product => product.Id === parseInt(id));
      if (index !== -1) {
        productsData[index] = { 
          ...productsData[index], 
          ...data,
          lastModified: timestamp 
        };
        updatedProducts.push({ ...productsData[index] });
      }
    });
    
    return updatedProducts;
  },

  // Bulk price adjustment
  bulkPriceAdjustment: async (ids, adjustment) => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const updatedProducts = [];
    
    ids.forEach(id => {
      const index = productsData.findIndex(product => product.Id === parseInt(id));
      if (index !== -1) {
        const product = productsData[index];
        const oldPrice = product.price;
        
        if (adjustment.type === 'percentage') {
          product.price = Math.round(product.price * (1 + adjustment.value / 100));
        } else {
          product.price = Math.max(0, product.price + adjustment.value);
        }
        
        // Track price history
        if (!product.priceHistory) product.priceHistory = [];
        product.priceHistory.push({
          oldPrice,
          newPrice: product.price,
          adjustment: adjustment.value,
          type: adjustment.type,
          date: new Date().toISOString()
        });
        
        updatedProducts.push({ ...product });
      }
    });
    
    return updatedProducts;
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

getByCategory: async (category) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    if (!category) return productsData.map(product => ({ ...product }));
    
    return productsData
      .filter(product => product.category === category)
      .map(product => ({ ...product }));
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