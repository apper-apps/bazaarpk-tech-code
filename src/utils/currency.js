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