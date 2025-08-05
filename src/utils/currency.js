export const formatPrice = (price) => {
  if (typeof price !== "number") return "Rs 0";
  return `Rs ${price.toLocaleString("en-PK")}`;
};

export const calculateDiscount = (originalPrice, discountedPrice) => {
  if (originalPrice <= discountedPrice) return 0;
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
};

export const calculateSavings = (originalPrice, discountedPrice) => {
  if (originalPrice <= discountedPrice) return 0;
  return originalPrice - discountedPrice;
};