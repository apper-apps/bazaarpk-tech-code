export const getCartFromStorage = () => {
  try {
    const cart = localStorage.getItem("bazaarpk-cart");
    return cart ? JSON.parse(cart) : [];
  } catch (error) {
    console.error("Error reading cart from storage:", error);
    return [];
  }
};

export const saveCartToStorage = (cart) => {
  try {
    localStorage.setItem("bazaarpk-cart", JSON.stringify(cart));
  } catch (error) {
    console.error("Error saving cart to storage:", error);
  }
};

export const getRecentlyViewedFromStorage = () => {
  try {
    const recentlyViewed = localStorage.getItem("bazaarpk-recently-viewed");
    return recentlyViewed ? JSON.parse(recentlyViewed) : [];
  } catch (error) {
    console.error("Error reading recently viewed from storage:", error);
    return [];
  }
};

export const saveRecentlyViewedToStorage = (products) => {
  try {
    localStorage.setItem("bazaarpk-recently-viewed", JSON.stringify(products));
  } catch (error) {
console.error("Error saving recently viewed to storage:", error);
  }
};

// Generic storage object for general data operations
export const storage = {
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading ${key} from storage:`, error);
      return null;
    }
  },

  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error saving ${key} to storage:`, error);
      return false;
    }
  },

  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing ${key} from storage:`, error);
      return false;
    }
  },

  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }
};