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
  }
};