import recipeBundlesData from '@/services/mockData/recipeBundles.json';

// Service for managing recipe bundles
class RecipeBundleServiceClass {
  constructor() {
    this.bundles = [...recipeBundlesData];
    this.nextId = Math.max(...this.bundles.map(b => b.Id)) + 1;
  }

  // Get all recipe bundles
  getAll() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...this.bundles]);
      }, 100);
    });
  }

  // Get recipe bundle by ID
  getById(id) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const bundle = this.bundles.find(b => b.Id === parseInt(id));
        if (bundle) {
          resolve({ ...bundle });
        } else {
          reject(new Error(`Recipe bundle with ID ${id} not found`));
        }
      }, 100);
    });
  }

  // Get featured recipe bundles
  getFeatured(limit = 6) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const featured = this.bundles
          .filter(bundle => bundle.featured)
          .slice(0, limit);
        resolve(featured);
      }, 150);
    });
  }

  // Get recipe bundles by category
  getByCategory(category, limit = 12) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const categoryBundles = this.bundles
          .filter(bundle => 
            bundle.category.toLowerCase() === category.toLowerCase()
          )
          .slice(0, limit);
        resolve(categoryBundles);
      }, 150);
    });
  }

  // Get recipe bundles by cooking time
  getByTime(maxTime, limit = 8) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const quickBundles = this.bundles
          .filter(bundle => {
            const timeInMinutes = parseInt(bundle.cookTime);
            return timeInMinutes <= maxTime;
          })
          .slice(0, limit);
        resolve(quickBundles);
      }, 150);
    });
  }

  // Search recipe bundles
  search(query, limit = 10) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const searchResults = this.bundles
          .filter(bundle =>
            bundle.name.toLowerCase().includes(query.toLowerCase()) ||
            bundle.description.toLowerCase().includes(query.toLowerCase()) ||
            bundle.category.toLowerCase().includes(query.toLowerCase())
          )
          .slice(0, limit);
        resolve(searchResults);
      }, 200);
    });
  }

  // Create new recipe bundle
  create(bundleData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newBundle = {
          ...bundleData,
          Id: this.nextId++,
          createdAt: new Date().toISOString()
        };
        this.bundles.push(newBundle);
        resolve({ ...newBundle });
      }, 200);
    });
  }

  // Update recipe bundle
  update(id, bundleData) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = this.bundles.findIndex(b => b.Id === parseInt(id));
        if (index !== -1) {
          this.bundles[index] = {
            ...this.bundles[index],
            ...bundleData,
            Id: parseInt(id),
            updatedAt: new Date().toISOString()
          };
          resolve({ ...this.bundles[index] });
        } else {
          reject(new Error(`Recipe bundle with ID ${id} not found`));
        }
      }, 200);
    });
  }

  // Delete recipe bundle
  delete(id) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = this.bundles.findIndex(b => b.Id === parseInt(id));
        if (index !== -1) {
          const deletedBundle = this.bundles.splice(index, 1)[0];
          resolve(deletedBundle);
        } else {
          reject(new Error(`Recipe bundle with ID ${id} not found`));
        }
      }, 200);
    });
  }
}

export const RecipeBundleService = new RecipeBundleServiceClass();