import { useState, useEffect } from "react";
import { getCartFromStorage, saveCartToStorage } from "@/utils/storage";
import ProductService from "@/services/api/ProductService";

export const useCart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [cartProducts, setCartProducts] = useState({});

  // Load cart from storage on mount
  useEffect(() => {
    const savedCart = getCartFromStorage();
    setCartItems(savedCart);
  }, []);

// Load product details for cart items with optimization to prevent excessive requests
  useEffect(() => {
    const loadProductDetails = async () => {
      const productIds = [...new Set(cartItems.map(item => item.productId))];
      const products = {};
      
      // Only fetch products we don't already have
      const missingProductIds = productIds.filter(id => !cartProducts[id]);

      for (const productId of missingProductIds) {
        try {
          const product = await ProductService.getById(productId);
          if (product) {
            products[productId] = product;
          }
        } catch (error) {
          console.error(`Failed to load product ${productId}:`, error);
        }
      }

      // Only update state if we have new products
      if (Object.keys(products).length > 0) {
        setCartProducts(prev => ({ ...prev, ...products }));
      }
    };

    if (cartItems.length > 0) {
      loadProductDetails();
    } else if (cartItems.length === 0 && Object.keys(cartProducts).length > 0) {
      // Clear product cache when cart is empty
      setCartProducts({});
    }
  }, [cartItems.map(item => item.productId).sort().join(',')]); // Optimize dependency to prevent unnecessary calls

// Save cart to storage whenever it changes with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveCartToStorage(cartItems);
    }, 100); // Debounce to prevent excessive storage writes

    return () => clearTimeout(timeoutId);
  }, [cartItems]);

  // Add product details to cart items
  const cartItemsWithProducts = cartItems.map(item => ({
    ...item,
    product: cartProducts[item.productId]
  }));

  const addToCart = (item) => {
    setCartItems(prevItems => {
      const existingIndex = prevItems.findIndex(
        cartItem => 
          cartItem.productId === item.productId && 
          JSON.stringify(cartItem.variant) === JSON.stringify(item.variant)
      );

      if (existingIndex >= 0) {
        // Update quantity if item exists
        const updatedItems = [...prevItems];
        updatedItems[existingIndex].quantity += item.quantity;
        return updatedItems;
      } else {
        // Add new item
        return [...prevItems, item];
      }
    });
  };

  const removeFromCart = (productId, variant = null) => {
    setCartItems(prevItems =>
      prevItems.filter(item => 
        !(item.productId === productId && 
          JSON.stringify(item.variant) === JSON.stringify(variant))
      )
    );
  };

  const updateQuantity = (productId, variant, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId, variant);
      return;
    }

    setCartItems(prevItems =>
      prevItems.map(item => 
        item.productId === productId && 
        JSON.stringify(item.variant) === JSON.stringify(variant)
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const isInCart = (productId, variant = null) => {
    return cartItems.some(item => 
      item.productId === productId && 
      JSON.stringify(item.variant) === JSON.stringify(variant)
    );
  };

  return {
    cartItems: cartItemsWithProducts,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
    isInCart
  };
};