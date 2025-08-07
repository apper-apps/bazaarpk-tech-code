export const formatPrice = (price) => {
  if (typeof price !== "number") return "Rs 0";
  return `Rs ${price.toLocaleString("en-PK")}`;
};

export const calculateDiscount = (originalPrice, discountedPrice) => {
  if (originalPrice <= discountedPrice) return 0;
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
};

export const calculateSavings = (originalPrice, discountedPrice) => {
  if (!originalPrice || !discountedPrice || originalPrice <= discountedPrice) {
    return 0;
  }
  return originalPrice - discountedPrice;
};

export const calculateBulkDiscount = (basePrice, bulkPricePerUnit, quantity) => {
  if (!basePrice || !bulkPricePerUnit || !quantity || basePrice <= bulkPricePerUnit) {
    return 0;
  }
  return (basePrice - bulkPricePerUnit) * quantity;
};

export const calculateTierSavings = (basePrice, tierPrice, quantity) => {
  if (!basePrice || !tierPrice || !quantity) {
    return 0;
  }
  const basePricePerUnit = basePrice;
  const tierPricePerUnit = tierPrice / quantity;
  return basePricePerUnit > tierPricePerUnit ? 
    (basePricePerUnit - tierPricePerUnit) * quantity : 0;
};

export const calculateDiscountPercent = (originalPrice, discountedPrice) => {
  if (!originalPrice || !discountedPrice || originalPrice <= discountedPrice) {
    return 0;
  }
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
};

// Enhanced profit calculations for inventory management
export const calculateProfit = (sellingPrice, buyingPrice) => {
  const selling = parseFloat(sellingPrice) || 0;
  const buying = parseFloat(buyingPrice) || 0;
  return selling - buying;
};

export const calculateProfitMargin = (sellingPrice, buyingPrice) => {
  const selling = parseFloat(sellingPrice) || 0;
  const buying = parseFloat(buyingPrice) || 0;
  if (buying <= 0) return 0;
  return ((selling - buying) / buying) * 100;
};

export const calculateMarkup = (sellingPrice, buyingPrice) => {
  const selling = parseFloat(sellingPrice) || 0;
  const buying = parseFloat(buyingPrice) || 0;
  if (buying <= 0) return 0;
  return ((selling - buying) / buying) * 100;
};

export const calculateFinalPrice = (sellingPrice, discountAmount, discountType = "percentage") => {
  const selling = parseFloat(sellingPrice) || 0;
  const discount = parseFloat(discountAmount) || 0;
  
  if (discount <= 0) return selling;
  
  if (discountType === "percentage") {
    return selling * (1 - discount / 100);
  } else {
    return Math.max(0, selling - discount);
  }
};

export const calculateBreakEvenUnits = (targetAmount, profitPerUnit) => {
  const target = parseFloat(targetAmount) || 0;
  const profit = parseFloat(profitPerUnit) || 0;
  if (profit <= 0) return 0;
  return Math.ceil(target / profit);
};