import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductService } from '@/services/api/ProductService';
import { CategoryService } from '@/services/api/CategoryService';
import { useToast } from '@/hooks/useToast';
import ApperIcon from '@/components/ApperIcon';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import Badge from '@/components/atoms/Badge';
import ProductManagementCard from '@/components/organisms/ProductManagementCard';
import Loading from '@/components/ui/Loading';
import Empty from '@/components/ui/Empty';
import { cn } from '@/utils/cn';
import { formatPrice } from '@/utils/currency';

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

  // Bulk selection state
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Advanced filters state
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [stockFilter, setStockFilter] = useState('all'); // all, in-stock, low-stock, out-of-stock
  const [tagFilter, setTagFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [featuredFilter, setFeaturedFilter] = useState('all'); // all, featured, not-featured
  const [statusFilter, setStatusFilter] = useState('all'); // all, published, draft

  // Admin role and permissions
  const [currentUser] = useState({
    role: 'admin', // admin, moderator
    permissions: {
      canDelete: true,
      canBulkEdit: true,
      canPublish: true,
      canManageUsers: true,
      canViewReports: true
    }
  });

  // Confirmation dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  // Bulk edit modal state
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [bulkEditData, setBulkEditData] = useState({
    priceAdjustment: { type: 'percentage', value: '' },
    category: '',
    status: '',
    tags: { action: 'add', values: [] }
  });

  // Activity logging state
  const [activityLog, setActivityLog] = useState([]);
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
// Activity logging function
  const logActivity = (action, details) => {
    const logEntry = {
      id: Date.now(),
      timestamp: new Date(),
      user: currentUser.role,
      action,
      details
    };
    setActivityLog(prev => [logEntry, ...prev.slice(0, 99)]); // Keep last 100 entries
    console.log('Activity Log:', logEntry);
  };

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

    // Apply price range filter
    if (priceRange.min !== '' || priceRange.max !== '') {
      filtered = filtered.filter(product => {
        const price = product.price;
        const minPrice = priceRange.min === '' ? 0 : parseFloat(priceRange.min);
        const maxPrice = priceRange.max === '' ? Infinity : parseFloat(priceRange.max);
        return price >= minPrice && price <= maxPrice;
      });
    }

    // Apply stock filter
    if (stockFilter !== 'all') {
      filtered = filtered.filter(product => {
        switch (stockFilter) {
          case 'in-stock':
            return product.stock > 10;
          case 'low-stock':
            return product.stock > 0 && product.stock <= 10;
          case 'out-of-stock':
            return product.stock === 0;
          default:
            return true;
        }
      });
    }

    // Apply tag filter
    if (tagFilter !== 'all') {
      filtered = filtered.filter(product => 
        product.badges && product.badges.includes(tagFilter)
      );
    }

    // Apply featured filter
    if (featuredFilter !== 'all') {
      filtered = filtered.filter(product => {
        switch (featuredFilter) {
          case 'featured':
            return product.featured === true;
          case 'not-featured':
            return product.featured !== true;
          default:
            return true;
        }
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(product => {
        switch (statusFilter) {
          case 'published':
            return product.visibility === 'published';
          case 'draft':
            return product.visibility === 'draft' || !product.visibility;
          default:
            return true;
        }
      });
    }

    // Apply role-based filtering for moderators
    if (currentUser.role === 'moderator') {
      // Moderators might see only certain categories or approved products
      filtered = filtered.filter(product => 
        product.visibility !== 'hidden' && product.moderatorApproved !== false
      );
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
      case 'most-popular':
        filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
      case 'newest':
        filtered.sort((a, b) => b.Id - a.Id);
        break;
      case 'oldest':
        filtered.sort((a, b) => a.Id - b.Id);
        break;
      case 'last-updated':
        filtered.sort((a, b) => b.Id - a.Id); // Using ID as proxy for last updated
        break;
      case 'pending-approval':
        if (currentUser.role === 'admin' || currentUser.role === 'moderator') {
          filtered = filtered.filter(p => p.status === 'pending' || p.moderatorApproved === false);
        }
        break;
      default:
        break;
    }

    setFilteredProducts(filtered);
  }, [products, searchQuery, selectedCategory, sortBy, priceRange, stockFilter, tagFilter, featuredFilter, statusFilter, currentUser.role]);

// Bulk selection handlers
  const handleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.Id)));
    }
  };

  const handleSelectProduct = (productId) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  // Clear selections when filters change
  useEffect(() => {
    setSelectedProducts(new Set());
  }, [searchQuery, selectedCategory, priceRange, stockFilter, tagFilter, featuredFilter, statusFilter]);

  // Show/hide bulk actions based on selection
  useEffect(() => {
    setShowBulkActions(selectedProducts.size > 0);
  }, [selectedProducts]);

// Bulk action handlers with role-based permissions
  const handleBulkDelete = async () => {
    if (!currentUser.permissions.canDelete) {
      showToast('You do not have permission to delete products', 'error');
      return;
    }

    try {
      setActionLoading(true);
      const selectedIds = Array.from(selectedProducts);
      
      logActivity('bulk_delete_initiated', { 
        productCount: selectedIds.length,
        productIds: selectedIds 
      });
      
      for (const id of selectedIds) {
        await ProductService.delete(id);
      }
      
      setProducts(prev => prev.filter(p => !selectedProducts.has(p.Id)));
      setSelectedProducts(new Set());
      
      logActivity('bulk_delete_completed', { 
        productCount: selectedIds.length,
        success: true 
      });
      
      showToast(`${selectedIds.length} products deleted successfully`, 'success');
    } catch (error) {
      console.error('Error bulk deleting products:', error);
      logActivity('bulk_delete_failed', { error: error.message });
      showToast('Failed to delete some products', 'error');
    } finally {
      setActionLoading(false);
      setShowBulkDeleteDialog(false);
    }
  };

  // Bulk approval for moderators
  const handleBulkApprove = async () => {
    if (currentUser.role !== 'admin' && currentUser.role !== 'moderator') {
      showToast('You do not have permission to approve products', 'error');
      return;
    }

    try {
      setActionLoading(true);
      const selectedIds = Array.from(selectedProducts);
      
      const updates = selectedIds.map(id => ({
        id,
        data: { 
          moderatorApproved: true, 
          status: 'approved',
          visibility: 'published'
        }
      }));
      
      await ProductService.bulkUpdate(updates);
      
      setProducts(prev => prev.map(p => 
        selectedIds.includes(p.Id) 
          ? { ...p, moderatorApproved: true, status: 'approved', visibility: 'published' }
          : p
      ));
      
      setSelectedProducts(new Set());
      logActivity('bulk_approve', { productCount: selectedIds.length });
      showToast(`${selectedIds.length} products approved successfully`, 'success');
    } catch (error) {
      console.error('Error approving products:', error);
      showToast('Failed to approve products', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkEdit = async () => {
    try {
      setActionLoading(true);
      const selectedIds = Array.from(selectedProducts);
      const updatedProducts = [];

      for (const id of selectedIds) {
        const product = products.find(p => p.Id === id);
        if (product) {
          let updatedProduct = { ...product };

          // Apply price adjustment
          if (bulkEditData.priceAdjustment.value) {
            const adjustment = parseFloat(bulkEditData.priceAdjustment.value);
            if (bulkEditData.priceAdjustment.type === 'percentage') {
              updatedProduct.price = Math.round(product.price * (1 + adjustment / 100));
            } else {
              updatedProduct.price = Math.max(0, product.price + adjustment);
            }
          }

          // Apply category change
          if (bulkEditData.category) {
            updatedProduct.category = bulkEditData.category;
          }

          // Apply status change
          if (bulkEditData.status) {
            updatedProduct.visibility = bulkEditData.status;
          }

          updatedProducts.push(await ProductService.update(id, updatedProduct));
        }
      }

      setProducts(prev => prev.map(p => {
        const updated = updatedProducts.find(u => u.Id === p.Id);
        return updated || p;
      }));
      
      setSelectedProducts(new Set());
      showToast(`${selectedIds.length} products updated successfully`, 'success');
    } catch (error) {
      console.error('Error bulk editing products:', error);
      showToast('Failed to update some products', 'error');
    } finally {
      setActionLoading(false);
      setShowBulkEditModal(false);
    }
  };

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
    
    if (!currentUser.permissions.canDelete) {
      showToast('You do not have permission to delete products', 'error');
      setShowDeleteDialog(false);
      setProductToDelete(null);
      return;
    }

    try {
      setActionLoading(true);
      
      logActivity('product_delete_initiated', { 
        productId: productToDelete.Id,
        productTitle: productToDelete.title 
      });
      
      const deleted = await ProductService.delete(productToDelete.Id);
      
      if (deleted) {
        setProducts(prev => prev.filter(p => p.Id !== productToDelete.Id));
        
        logActivity('product_deleted', { 
          productId: productToDelete.Id,
          productTitle: productToDelete.title,
          success: true
        });
        
        showToast('Product deleted successfully', 'success');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      logActivity('product_delete_failed', { 
        productId: productToDelete.Id,
        error: error.message 
      });
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

  // Clear filters
  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setPriceRange({ min: '', max: '' });
    setStockFilter('all');
    setTagFilter('all');
    setDateRange({ start: '', end: '' });
    setFeaturedFilter('all');
    setStatusFilter('all');
    setSortBy('name-asc');
  };

  // Get unique tags from all products
  const availableTags = [...new Set(products.flatMap(p => p.badges || []))];

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
            {selectedProducts.size > 0 && (
              <Badge variant="secondary">
                {selectedProducts.size} selected
              </Badge>
            )}
          </div>
        </div>

        {/* Bulk Actions */}
<AnimatePresence>
          {showBulkActions && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center space-x-2"
            >
              {(currentUser.role === 'admin' || currentUser.role === 'moderator') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkApprove}
                  disabled={actionLoading}
                >
                  <ApperIcon name="CheckCircle" className="w-4 h-4 mr-2" />
                  Approve Selected
                </Button>
              )}
              
              {currentUser.permissions.canBulkEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBulkEditModal(true)}
                  disabled={actionLoading}
                >
                  <ApperIcon name="Edit3" className="w-4 h-4 mr-2" />
                  Bulk Edit
                </Button>
              )}
              
              {currentUser.permissions.canDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowBulkDeleteDialog(true)}
                  disabled={actionLoading}
                >
                  <ApperIcon name="Trash2" className="w-4 h-4 mr-2" />
                  Delete Selected
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

<div className="flex items-center space-x-4">
          {/* View Mode Toggle */}
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

          {/* Role Badge */}
          <Badge variant={currentUser.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
            {currentUser.role.toUpperCase()}
          </Badge>

          {/* Activity Log Access */}
          {currentUser.role === 'admin' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/activity-log')}
            >
              <ApperIcon name="FileText" className="w-4 h-4 mr-2" />
              Activity Log
            </Button>
          )}
        </div>
      </div>

      {/* Filters and Search */}
{/* Search and Basic Controls */}
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

        {/* View Mode Toggle */}
<div className="flex items-center space-x-4">
          {/* View Mode Toggle */}
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

{/* Approval Status Filter for Moderators */}
          {(currentUser.role === 'admin' || currentUser.role === 'moderator') && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option key="all" value="all">All Status</option>
              <option key="published" value="published">Published</option>
              <option key="draft" value="draft">Draft</option>
              <option key="pending-approval" value="pending-approval">Pending Approval</option>
            </select>
          )}
        </div>

        {/* Select All Checkbox */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="select-all"
            checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
            onChange={handleSelectAll}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="select-all" className="text-sm font-medium text-gray-700">
            Select All ({filteredProducts.length} items)
          </label>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-gray-500 hover:text-gray-700"
          >
            <ApperIcon name="X" className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
            <div className="flex space-x-2">
              <Input
                type="number"
                placeholder="Min"
                value={priceRange.min}
                onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                className="text-sm"
              />
              <Input
                type="number"
                placeholder="Max"
                value={priceRange.max}
                onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                className="text-sm"
              />
            </div>
          </div>

          {/* Stock Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Status</label>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Stock</option>
              <option value="in-stock">In Stock (10+)</option>
              <option value="low-stock">Low Stock (1-10)</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>

          {/* Tag Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Tags</option>
              {availableTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>

          {/* Featured Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Featured</label>
            <select
              value={featuredFilter}
              onChange={(e) => setFeaturedFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Products</option>
              <option value="featured">Featured Only</option>
              <option value="not-featured">Not Featured</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
>
              <option key="all" value="all">All Status</option>
              <option key="published" value="published">Published</option>
              <option key="draft" value="draft">Draft</option>
            </select>
          </div>
        </div>

        {/* Sort */}
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
<option key="name-asc" value="name-asc">Name (A-Z)</option>
            <option key="name-desc" value="name-desc">Name (Z-A)</option>
            <option key="price-high" value="price-high">Price (High-Low)</option>
            <option key="price-low" value="price-low">Price (Low-High)</option>
            <option key="stock-high" value="stock-high">Stock (High-Low)</option>
            <option key="stock-low" value="stock-low">Stock (Low-High)</option>
            <option key="most-popular" value="most-popular">Most Popular</option>
            <option key="newest" value="newest">Newest First</option>
            <option key="oldest" value="oldest">Oldest First</option>
            <option key="last-updated" value="last-updated">Last Updated</option>
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
              : currentUser.role === 'moderator' 
                ? "No products available for moderation"
                : "Start by adding your first product to the catalog"
          }
          action={
            currentUser.permissions.canPublish && (
              <Button onClick={() => navigate('/admin/products/add')}>
                <ApperIcon name="Plus" className="w-4 h-4 mr-2" />
                Add New Product
              </Button>
            )
          }
        />
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">
                {filteredProducts.length}
              </div>
              <div className="text-sm text-gray-600">Total Products</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-green-600">
                {filteredProducts.filter(p => p.visibility === 'published').length}
              </div>
              <div className="text-sm text-gray-600">Published</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-orange-600">
                {filteredProducts.filter(p => p.stock <= 10 && p.stock > 0).length}
              </div>
              <div className="text-sm text-gray-600">Low Stock</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-red-600">
                {filteredProducts.filter(p => p.stock === 0).length}
              </div>
              <div className="text-sm text-gray-600">Out of Stock</div>
            </div>
          </div>

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
                  selected={selectedProducts.has(product.Id)}
                  onSelect={handleSelectProduct}
                  onToggleVisibility={handleToggleVisibility}
                  onToggleFeatured={handleToggleFeatured}
                  onEdit={handleEdit}
                  onView={handleViewProduct}
                  onDelete={handleDeleteClick}
                  loading={actionLoading}
                  currentUser={currentUser}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        </>
      )}

      {/* Bulk Edit Modal */}
      <AnimatePresence>
        {showBulkEditModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Bulk Edit ({selectedProducts.size} products)
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBulkEditModal(false)}
                >
                  <ApperIcon name="X" className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                {/* Price Adjustment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Adjustment
                  </label>
                  <div className="flex space-x-2">
                    <select
                      value={bulkEditData.priceAdjustment.type}
                      onChange={(e) => setBulkEditData(prev => ({
                        ...prev,
                        priceAdjustment: { ...prev.priceAdjustment, type: e.target.value }
                      }))}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                    <Input
                      type="number"
                      placeholder="Enter value"
                      value={bulkEditData.priceAdjustment.value}
                      onChange={(e) => setBulkEditData(prev => ({
                        ...prev,
                        priceAdjustment: { ...prev.priceAdjustment, value: e.target.value }
                      }))}
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Category Change */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Change Category
                  </label>
                  <select
                    value={bulkEditData.category}
                    onChange={(e) => setBulkEditData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">Keep Current</option>
                    {categories.map((category) => (
                      <option key={category.slug} value={category.slug}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Change */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Change Status
                  </label>
                  <select
                    value={bulkEditData.status}
                    onChange={(e) => setBulkEditData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">Keep Current</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>
              
              <div className="flex space-x-3 justify-end mt-6">
                <Button
                  variant="ghost"
                  onClick={() => setShowBulkEditModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBulkEdit}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Updating...
                    </>
                  ) : (
                    'Apply Changes'
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Delete Confirmation */}
      <AnimatePresence>
        {showBulkDeleteDialog && (
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
                  Delete Selected Products
                </h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete {selectedProducts.size} selected products? This action cannot be undone.
              </p>
              
              <div className="flex space-x-3 justify-end">
<Button
                  variant="ghost"
                  onClick={() => setShowBulkDeleteDialog(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleBulkDelete}
                  disabled={actionLoading || !currentUser.permissions.canDelete}
                >
                  {actionLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <ApperIcon name="Trash2" className="w-4 h-4 mr-2" />
                      Delete Products ({selectedProducts.size})
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  disabled={actionLoading || !currentUser.permissions.canDelete}
                >
                  {actionLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <ApperIcon name="Trash2" className="w-4 h-4 mr-2" />
                      Delete "{productToDelete?.title}"
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