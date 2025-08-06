import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductService } from '@/services/api/ProductService';
import { CategoryService } from '@/services/api/CategoryService';
import { useToast } from '@/hooks/useToast';
import ApperIcon from '@/components/ApperIcon';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import ProductManagementCard from '@/components/organisms/ProductManagementCard';
import Loading from '@/components/ui/Loading';
import Empty from '@/components/ui/Empty';
import { cn } from '@/utils/cn';

const ManageProducts = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // State management
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name-asc');
  const [viewMode, setViewMode] = useState('grid');

  // Confirmation dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, categoriesData] = await Promise.all([
        ProductService.getAll(),
        CategoryService.getAll()
      ]);
      
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort products
  useEffect(() => {
    let filtered = [...products];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product => 
        product.title.toLowerCase().includes(query) ||
        product.sku?.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Apply sorting
    switch (sortBy) {
      case 'name-asc':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'name-desc':
        filtered.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'stock-high':
        filtered.sort((a, b) => b.stock - a.stock);
        break;
      case 'stock-low':
        filtered.sort((a, b) => a.stock - b.stock);
        break;
      case 'created-desc':
        filtered.sort((a, b) => b.Id - a.Id);
        break;
      default:
        break;
    }

    setFilteredProducts(filtered);
  }, [products, searchQuery, selectedCategory, sortBy]);

  // Product actions
  const handleToggleVisibility = async (productId) => {
    try {
      setActionLoading(true);
      const updatedProduct = await ProductService.toggleVisibility(productId);
      
      if (updatedProduct) {
        setProducts(prev => prev.map(p => 
          p.Id === productId ? updatedProduct : p
        ));
        showToast(
          `Product ${updatedProduct.visibility === 'published' ? 'published' : 'hidden'}`,
          'success'
        );
      }
    } catch (error) {
      console.error('Error toggling visibility:', error);
      showToast('Failed to update product visibility', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleFeatured = async (productId) => {
    try {
      setActionLoading(true);
      const updatedProduct = await ProductService.toggleFeatured(productId);
      
      if (updatedProduct) {
        setProducts(prev => prev.map(p => 
          p.Id === productId ? updatedProduct : p
        ));
        showToast(
          `Product ${updatedProduct.featured ? 'marked as featured' : 'removed from featured'}`,
          'success'
        );
      }
    } catch (error) {
      console.error('Error toggling featured status:', error);
      showToast('Failed to update featured status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = (productId) => {
    navigate(`/admin/products/add?edit=${productId}`);
  };

  const handleViewProduct = (productId) => {
    navigate(`/product/${productId}`);
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    try {
      setActionLoading(true);
      const deleted = await ProductService.delete(productToDelete.Id);
      
      if (deleted) {
        setProducts(prev => prev.filter(p => p.Id !== productToDelete.Id));
        showToast('Product deleted successfully', 'success');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      showToast('Failed to delete product', 'error');
    } finally {
      setActionLoading(false);
      setShowDeleteDialog(false);
      setProductToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setProductToDelete(null);
  };

  if (loading) {
    return (
      <div className="p-6">
        <Loading />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => navigate('/admin/products/add')}
            className="whitespace-nowrap"
          >
            <ApperIcon name="Plus" className="w-4 h-4 mr-2" />
            Add New Product
          </Button>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              {filteredProducts.length} of {products.length} products
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <ApperIcon name="Grid3X3" className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <ApperIcon name="List" className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <ApperIcon name="Search" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search by name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Category:
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name} ({products.filter(p => p.category === category.slug).length})
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Sort by:
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="price-high">Price (High-Low)</option>
            <option value="price-low">Price (Low-High)</option>
            <option value="stock-high">Stock (High-Low)</option>
            <option value="stock-low">Stock (Low-High)</option>
            <option value="created-desc">Recently Added</option>
          </select>
        </div>
      </div>

      {/* Products Grid/List */}
      {filteredProducts.length === 0 ? (
        <Empty
          title="No products found"
          message={
            searchQuery || selectedCategory !== 'all'
              ? "Try adjusting your filters or search terms"
              : "Start by adding your first product to the catalog"
          }
          action={
            <Button onClick={() => navigate('/admin/products/add')}>
              <ApperIcon name="Plus" className="w-4 h-4 mr-2" />
              Add New Product
            </Button>
          }
        />
      ) : (
        <motion.div
          className={cn(
            "grid gap-6",
            viewMode === 'grid'
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "grid-cols-1"
          )}
          layout
        >
          <AnimatePresence>
            {filteredProducts.map((product) => (
              <ProductManagementCard
                key={product.Id}
                product={product}
                viewMode={viewMode}
                onToggleVisibility={handleToggleVisibility}
                onToggleFeatured={handleToggleFeatured}
                onEdit={handleEdit}
                onView={handleViewProduct}
                onDelete={handleDeleteClick}
                loading={actionLoading}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {showDeleteDialog && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0">
                  <ApperIcon name="AlertTriangle" className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">
                  Delete Product
                </h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{productToDelete?.title}"? This action cannot be undone.
              </p>
              
              <div className="flex space-x-3 justify-end">
                <Button
                  variant="ghost"
                  onClick={handleDeleteCancel}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteConfirm}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <ApperIcon name="Trash2" className="w-4 h-4 mr-2" />
                      Delete Product
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageProducts;