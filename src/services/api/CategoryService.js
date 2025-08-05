import categoriesData from "@/services/mockData/categories.json";

export const CategoryService = {
  getAll: async () => {
    await new Promise(resolve => setTimeout(resolve, 250));
    return [...categoriesData];
  },

  getById: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const category = categoriesData.find(c => c.Id === id);
    return category ? { ...category } : null;
  },

  create: async (category) => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const maxId = Math.max(...categoriesData.map(c => c.Id));
    const newCategory = { ...category, Id: maxId + 1 };
    categoriesData.push(newCategory);
    return { ...newCategory };
  },

  update: async (id, updates) => {
    await new Promise(resolve => setTimeout(resolve, 350));
    const index = categoriesData.findIndex(c => c.Id === id);
    if (index !== -1) {
      categoriesData[index] = { ...categoriesData[index], ...updates };
      return { ...categoriesData[index] };
    }
    return null;
  },

  delete: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = categoriesData.findIndex(c => c.Id === id);
    if (index !== -1) {
      const deleted = categoriesData.splice(index, 1)[0];
      return { ...deleted };
    }
    return null;
  }
};