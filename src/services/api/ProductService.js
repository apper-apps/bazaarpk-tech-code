import productsData from "@/services/mockData/products.json";

export const ProductService = {
  getAll: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [...productsData];
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
    const index = productsData.findIndex(p => p.Id === id);
    if (index !== -1) {
      const deleted = productsData.splice(index, 1)[0];
      return { ...deleted };
    }
    return null;
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