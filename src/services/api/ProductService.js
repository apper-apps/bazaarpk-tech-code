import productsData from "@/services/mockData/products.json";

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
    const maxId = Math.max(...productsData.map(p => p.Id));
    const newProduct = { ...product, Id: maxId + 1 };
    productsData.push(newProduct);
    return { ...newProduct };
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
      return { ...deleted };
    }
    return null;
  },

  // Bulk operations
  bulkDelete: async (ids) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const deletedProducts = [];
    
    ids.forEach(id => {
      const index = productsData.findIndex(product => product.Id === parseInt(id));
      if (index !== -1) {
        deletedProducts.push(productsData.splice(index, 1)[0]);
      }
    });
    
    return deletedProducts;
  },

  bulkUpdate: async (updates) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const updatedProducts = [];
    
    updates.forEach(({ id, data }) => {
      const index = productsData.findIndex(product => product.Id === parseInt(id));
      if (index !== -1) {
        productsData[index] = { ...productsData[index], ...data };
        updatedProducts.push({ ...productsData[index] });
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
      return { ...productsData[index] };
    }
    return null;
  },

  toggleFeatured: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const index = productsData.findIndex(product => product.Id === parseInt(id));
    if (index !== -1) {
      productsData[index].featured = !productsData[index].featured;
      return { ...productsData[index] };
    }
    return null;
  },

  updateStatus: async (id, status) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const index = productsData.findIndex(product => product.Id === parseInt(id));
    if (index !== -1) {
      productsData[index].status = status;
      return { ...productsData[index] };
    }
    return null;
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
        product.description.toLowerCase().includes(lowercaseQuery)
      )
      .map(product => ({ ...product }));
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