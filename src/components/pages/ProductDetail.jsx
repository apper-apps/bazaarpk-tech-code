import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import QuantityDiscountTable from "@/components/molecules/QuantityDiscountTable";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/useToast";
import ProductService from "@/services/api/ProductService";
import ApperIcon from "@/components/ApperIcon";
import ProductBadges from "@/components/molecules/ProductBadges";
import PriceDisplay from "@/components/molecules/PriceDisplay";
import QuantitySelector from "@/components/molecules/QuantitySelector";
import StockIndicator from "@/components/molecules/StockIndicator";
import ProductGrid from "@/components/organisms/ProductGrid";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";
import Home from "@/components/pages/Home";
import Cart from "@/components/pages/Cart";
import Badge from "@/components/atoms/Badge";
import Button from "@/components/atoms/Button";
import { cn } from "@/utils/cn";
import { calculateBulkDiscount, calculateDiscount, calculateSavings, formatPrice } from "@/utils/currency";

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
  const [activeTab, setActiveTab] = useState("overview");
  const [productStatus, setProductStatus] = useState("active");
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

// Load related products using enhanced matching
      const related = await ProductService.getRelatedProducts(productData.Id, productData.category, {
        priceRange: { min: productData.price * 0.3, max: productData.price * 2.5 },
        badges: productData.badges,
        limit: 8
      });
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
      price: selectedVariant ? selectedVariant.price : product.price,
      discountTier: selectedTier,
      bulkSavings: selectedTier?.savings || 0
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

const [selectedTier, setSelectedTier] = useState(null);
  
  const currentPrice = selectedVariant ? selectedVariant.price : product?.price || 0;
  const currentOldPrice = selectedVariant ? selectedVariant.oldPrice : product?.oldPrice;
  const discount = currentOldPrice ? calculateDiscount(currentOldPrice, currentPrice) : 0;
  const savings = currentOldPrice ? calculateSavings(currentOldPrice, currentPrice) : 0;
  
  const bulkDiscount = selectedTier ? calculateBulkDiscount(
    product?.price || 0, 
    selectedTier.pricePerUnit, 
    selectedTier.quantity
  ) : 0;
  const totalSavings = savings + (selectedTier?.savings || 0);

  function handleTierSelect(tier) {
    setSelectedTier(tier);
    if (tier.variant) {
      handleVariantSelect(tier.variant);
      setQuantity(tier.quantity);
    }
    showToast(`Selected ${tier.quantity}x quantity tier - Save ${formatPrice(tier.savings)}!`, 'success');
  }

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

const handleStatusToggle = () => {
    const newStatus = productStatus === "active" ? "inactive" : "active";
    setProductStatus(newStatus);
    showToast(`Product status changed to ${newStatus}`, "success");
  };

  const renderOverviewTab = () => (
    <div className="space-y-8">
      {/* Product Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
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
              bulkSavings={selectedTier?.savings}
              showBulkDiscount={!!selectedTier}
            />
            
            {totalSavings > 0 && (
              <div className="space-y-1">
                {savings > 0 && (
                  <p className="text-green-600 font-medium">
                    Regular discount: {formatPrice(savings)} ({discount}% off)
                  </p>
                )}
                {selectedTier?.savings > 0 && (
                  <p className="text-green-700 font-semibold">
                    Bulk discount: {formatPrice(selectedTier.savings)} 
                    <span className="text-sm ml-1">
                      ({selectedTier.discountPercent}% additional off)
                    </span>
                  </p>
                )}
                {totalSavings > 0 && (
                  <p className="text-green-800 font-bold text-lg">
                    Total savings: {formatPrice(totalSavings)}
                  </p>
                )}
              </div>
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

            {/* Quantity Discount Table */}
            {product?.variants && product.variants.length > 1 && (
              <div className="mt-8">
                <QuantityDiscountTable
                  variants={product.variants}
                  basePrice={product.price}
                  selectedTier={selectedTier}
                  onTierSelect={handleTierSelect}
                />
              </div>
            )}

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

{/* Related Products Selector */}
      {relatedProducts.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-display font-bold text-gray-900">You Might Also Like</h2>
              <p className="text-gray-600 mt-1">Products similar to {product.title}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const moreRelated = await ProductService.getRelatedProducts(product.Id, product.category, {
                  priceRange: { min: 0, max: Infinity },
                  badges: product.badges,
                  limit: 16
                });
                setRelatedProducts(moreRelated);
                showToast(`Found ${moreRelated.length} related products`, 'success');
              }}
              className="flex items-center space-x-2"
            >
              <ApperIcon name="RefreshCw" className="w-4 h-4" />
              <span>Show More</span>
            </Button>
          </div>
          
          <ProductGrid 
            products={relatedProducts}
            title=""
            showLoadMore={false}
            initialCount={8}
            className="related-products-grid"
          />
          
          {relatedProducts.length >= 8 && (
            <div className="text-center mt-6">
              <Button
                variant="outline"
                onClick={() => navigate(`/category/${product.category}`)}
                className="flex items-center space-x-2 mx-auto"
              >
                <ApperIcon name="Grid" className="w-4 h-4" />
                <span>View All {product.category} Products</span>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderInventoryTab = () => (
    <div className="space-y-8">
      {/* Stock Summary */}
      <div className="bg-white rounded-lg shadow-soft p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Stock Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-primary-50 rounded-lg">
            <div className="text-2xl font-bold text-primary-600">{product.stock}</div>
            <div className="text-sm text-gray-600 mt-1">Total Stock</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {product.stock > 0 ? "Available" : "Out of Stock"}
            </div>
            <div className="text-sm text-gray-600 mt-1">Status</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {product.stock <= 10 ? "Low" : "Good"}
            </div>
            <div className="text-sm text-gray-600 mt-1">Stock Level</div>
          </div>
        </div>
      </div>

      {/* Variant Stock Levels */}
      {product.variants && product.variants.length > 0 && (
        <div className="bg-white rounded-lg shadow-soft p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Stock by Variant</h3>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Variant</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Price</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Stock Level</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {product.variants.map((variant, index) => {
                  // Simulate stock levels for each variant (in real app, this would come from backend)
                  const variantStock = Math.floor(product.stock / product.variants.length) + (index % 3);
                  const stockStatus = variantStock > 10 ? "good" : variantStock > 0 ? "low" : "out";
                  
                  return (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-900">{variant.name}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-gray-700">{formatPrice(variant.price)}</div>
                        {variant.oldPrice && (
                          <div className="text-sm text-gray-500 line-through">
                            {formatPrice(variant.oldPrice)}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-gray-900">{variantStock} units</div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge 
                          variant={stockStatus === "good" ? "success" : stockStatus === "low" ? "warning" : "destructive"}
                          className="text-xs"
                        >
                          {stockStatus === "good" ? "In Stock" : stockStatus === "low" ? "Low Stock" : "Out of Stock"}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => showToast(`Stock updated for ${variant.name}`, "success")}
                        >
                          Update Stock
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock History */}
      <div className="bg-white rounded-lg shadow-soft p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent Stock Changes</h3>
        <div className="space-y-4">
          {[
            { date: "2024-01-15", action: "Stock Added", quantity: "+25 units", user: "Admin", reason: "New shipment" },
            { date: "2024-01-12", action: "Stock Sold", quantity: "-8 units", user: "System", reason: "Customer orders" },
            { date: "2024-01-10", action: "Stock Adjustment", quantity: "-2 units", user: "Manager", reason: "Damaged items" },
            { date: "2024-01-08", action: "Stock Added", quantity: "+50 units", user: "Admin", reason: "Restock order" }
          ].map((entry, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  entry.action.includes("Added") ? "bg-green-500" : 
                  entry.action.includes("Sold") ? "bg-blue-500" : "bg-orange-500"
                )} />
                <div>
                  <div className="font-medium text-gray-900">{entry.action}</div>
                  <div className="text-sm text-gray-600">{entry.date} • {entry.user}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={cn(
                  "font-semibold",
                  entry.quantity.startsWith("+") ? "text-green-600" : 
                  entry.quantity.startsWith("-") && entry.action.includes("Sold") ? "text-blue-600" : "text-orange-600"
                )}>
                  {entry.quantity}
                </div>
                <div className="text-sm text-gray-600">{entry.reason}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Back Button and Status Toggle */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2"
            >
              <ApperIcon name="ArrowLeft" className="w-4 h-4" />
              <span>Back</span>
            </Button>
            
            {/* Breadcrumbs */}
            <nav className="flex items-center space-x-2 text-sm text-gray-600">
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
          </div>

          {/* Status Toggle */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              <Badge variant={productStatus === "active" ? "success" : "secondary"}>
                {productStatus === "active" ? "Active" : "Inactive"}
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleStatusToggle}
              className="flex items-center space-x-2"
            >
              <ApperIcon 
                name={productStatus === "active" ? "EyeOff" : "Eye"} 
                className="w-4 h-4" 
              />
              <span>{productStatus === "active" ? "Deactivate" : "Activate"}</span>
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("overview")}
              className={cn(
                "py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200",
                activeTab === "overview"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              <div className="flex items-center space-x-2">
                <ApperIcon name="Info" className="w-4 h-4" />
                <span>Overview</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("inventory")}
              className={cn(
                "py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200",
                activeTab === "inventory"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              <div className="flex items-center space-x-2">
                <ApperIcon name="Package" className="w-4 h-4" />
                <span>Inventory</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === "overview" ? renderOverviewTab() : renderInventoryTab()}
        </motion.div>
      </div>
    </div>
  );
};

export default ProductDetail;