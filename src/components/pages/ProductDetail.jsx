import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import ApperIcon from "@/components/ApperIcon";
import Button from "@/components/atoms/Button";
import Badge from "@/components/atoms/Badge";
import PriceDisplay from "@/components/molecules/PriceDisplay";
import QuantitySelector from "@/components/molecules/QuantitySelector";
import StockIndicator from "@/components/molecules/StockIndicator";
import ProductBadges from "@/components/molecules/ProductBadges";
import ProductGrid from "@/components/organisms/ProductGrid";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";
import { ProductService } from "@/services/api/ProductService";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/useToast";
import { formatPrice, calculateDiscount, calculateSavings } from "@/utils/currency";
import { cn } from "@/utils/cn";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProductData = async () => {
    try {
      setLoading(true);
      setError("");

      const productData = await ProductService.getById(parseInt(id));
      if (!productData) {
        setError("Product not found");
        return;
      }

      setProduct(productData);
      setSelectedVariant(productData.variants?.[0] || null);

      // Load related products from same category
      const allProducts = await ProductService.getAll();
      const related = allProducts
        .filter(p => p.Id !== productData.Id && p.category === productData.category)
        .slice(0, 8);
      setRelatedProducts(related);

    } catch (err) {
      console.error("Error loading product:", err);
      setError("Failed to load product details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadProductData();
    }
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;

    const cartItem = {
      productId: product.Id,
      quantity,
      variant: selectedVariant,
      price: selectedVariant ? selectedVariant.price : product.price
    };

    addToCart(cartItem);
    showToast(`${product.title} added to cart!`, "success");
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate("/cart");
  };

  const handleVariantSelect = (variant) => {
    setSelectedVariant(variant);
    setQuantity(1); // Reset quantity when variant changes
  };

  const currentPrice = selectedVariant ? selectedVariant.price : product?.price || 0;
  const currentOldPrice = selectedVariant ? selectedVariant.oldPrice : product?.oldPrice;
  const discount = currentOldPrice ? calculateDiscount(currentOldPrice, currentPrice) : 0;
  const savings = currentOldPrice ? calculateSavings(currentOldPrice, currentPrice) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Image Skeleton */}
            <div className="space-y-4">
              <div className="aspect-square bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-2xl animate-pulse" />
              <div className="flex space-x-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-20 h-20 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
            
            {/* Details Skeleton */}
            <div className="space-y-6">
              <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse" />
              <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-3/4 animate-pulse" />
              <div className="h-12 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse" />
              <div className="h-10 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-1/2 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Error
          title="Product not found"
          message={error || "The product you're looking for doesn't exist or has been removed."}
          onRetry={() => navigate("/")}
          showRetry={true}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <button onClick={() => navigate("/")} className="hover:text-primary-600">
            Home
          </button>
          <ApperIcon name="ChevronRight" className="w-4 h-4" />
          <button onClick={() => navigate("/category")} className="hover:text-primary-600">
            Products
          </button>
          <ApperIcon name="ChevronRight" className="w-4 h-4" />
          <span className="text-gray-900 font-medium truncate">
            {product.title}
          </span>
        </nav>

        {/* Product Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <motion.div 
              className="aspect-square bg-white rounded-2xl shadow-soft overflow-hidden"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <img
                src={product.images?.[selectedImage] || "/api/placeholder/600/600"}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </motion.div>

            {/* Thumbnail Images */}
            {product.images && product.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={cn(
                      "flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors duration-200",
                      index === selectedImage 
                        ? "border-primary-500" 
                        : "border-gray-200 hover:border-primary-300"
                    )}
                  >
                    <img
                      src={image}
                      alt={`${product.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Information */}
          <div className="space-y-6">
            {/* Title & Badges */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-3xl font-display font-bold text-gray-900 leading-tight">
                  {product.title}
                </h1>
                <Button variant="ghost" size="sm" className="p-2">
                  <ApperIcon name="Heart" className="w-6 h-6" />
                </Button>
              </div>
              
              {product.badges && product.badges.length > 0 && (
                <ProductBadges badges={product.badges} maxDisplay={5} />
              )}
            </div>

            {/* Price */}
            <div className="space-y-2">
              <PriceDisplay 
                price={currentPrice}
                oldPrice={currentOldPrice}
                size="xl"
              />
              
              {savings > 0 && (
                <p className="text-green-600 font-medium">
                  You save {formatPrice(savings)} ({discount}% off)
                </p>
              )}
            </div>

            {/* Stock Status */}
            <StockIndicator stock={product.stock} size="md" />

            {/* Description */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Options</h3>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant, index) => (
                    <button
                      key={index}
                      onClick={() => handleVariantSelect(variant)}
                      className={cn(
                        "px-4 py-2 border rounded-lg transition-colors duration-200 font-medium",
                        selectedVariant?.name === variant.name
                          ? "border-primary-500 bg-primary-50 text-primary-700"
                          : "border-gray-300 bg-white text-gray-700 hover:border-primary-300 hover:bg-primary-50"
                      )}
                    >
                      <div className="text-center">
                        <div>{variant.name}</div>
                        <div className="text-sm text-gray-600">
                          {formatPrice(variant.price)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity & Actions */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Quantity</h3>
                <QuantitySelector
                  quantity={quantity}
                  onQuantityChange={setQuantity}
                  min={1}
                  max={product.stock}
                  size="lg"
                />
              </div>

              <div className="flex space-x-4">
                <Button
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                  size="lg"
                  className="flex-1"
                >
                  <ApperIcon name="ShoppingCart" className="w-5 h-5 mr-2" />
                  Add to Cart
                </Button>
                
                <Button
                  onClick={handleBuyNow}
                  disabled={product.stock <= 0}
                  variant="accent"
                  size="lg"
                  className="flex-1"
                >
                  <ApperIcon name="Zap" className="w-5 h-5 mr-2" />
                  Buy Now
                </Button>
              </div>
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-2 text-gray-600">
                <ApperIcon name="Truck" className="w-5 h-5" />
                <span className="text-sm">Free shipping over Rs 1000</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <ApperIcon name="RotateCcw" className="w-5 h-5" />
                <span className="text-sm">7-day return policy</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <ApperIcon name="Shield" className="w-5 h-5" />
                <span className="text-sm">100% authentic guarantee</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <ApperIcon name="MessageCircle" className="w-5 h-5" />
                <span className="text-sm">24/7 customer support</span>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <ProductGrid 
            products={relatedProducts}
            title="Related Products"
            showLoadMore={false}
            initialCount={8}
          />
        )}
      </div>
    </div>
  );
};

export default ProductDetail;