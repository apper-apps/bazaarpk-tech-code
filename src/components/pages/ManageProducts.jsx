import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ProductService } from "@/services/api/ProductService";
import { CategoryService } from "@/services/api/CategoryService";
import { useToast } from "@/hooks/useToast";
import ApperIcon from "@/components/ApperIcon";
import ProductManagementCard from "@/components/organisms/ProductManagementCard";
import Loading from "@/components/ui/Loading";
import ErrorComponent from "@/components/ui/Error";
import Empty from "@/components/ui/Empty";
import Category from "@/components/pages/Category";
import Badge from "@/components/atoms/Badge";
import Input from "@/components/atoms/Input";
import Button from "@/components/atoms/Button";
import { cn } from "@/utils/cn";
import { formatPrice } from "@/utils/currency";

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
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
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
      userId: currentUser.id || 'unknown',
      action,
      details,
      browser: navigator.userAgent,
      sessionId: sessionStorage.getItem('sessionId') || 'unknown',
      performanceData: {
        memoryUsage: window.performance?.memory?.usedJSHeapSize || 0,
        timing: Date.now(),
        loadTime: window.performance?.timing ? 
          window.performance.timing.loadEventEnd - window.performance.timing.navigationStart : 0
      }
    };
    
    setActivityLog(prev => [logEntry, ...prev.slice(0, 99)]); // Keep last 100 entries
    
    // Enhanced console logging with browser compatibility info
    console.group(`📋 Activity: ${action}`);
    console.log('Details:', {
      ...logEntry,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      } : 'unknown'
    });
    console.groupEnd();
    
    // Track activity in analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'admin_activity', {
        action_type: action,
        user_role: currentUser.role,
        browser_name: navigator.userAgent.includes('Chrome') ? 'Chrome' : 
                     navigator.userAgent.includes('Firefox') ? 'Firefox' : 
                     navigator.userAgent.includes('Safari') ? 'Safari' : 'Other',
        is_mobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        timestamp: Date.now()
      });
    }
    
    // Store in localStorage for persistence across sessions
    try {
      const storedLogs = JSON.parse(localStorage.getItem('admin_activity_log') || '[]');
      const updatedLogs = [logEntry, ...storedLogs.slice(0, 199)]; // Keep last 200 entries
      localStorage.setItem('admin_activity_log', JSON.stringify(updatedLogs));
    } catch (error) {
      console.warn('Failed to store activity log in localStorage:', error);
    }
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

    // Apply sorting - remove async call from useEffect
    switch (sortBy) {
      case 'name-asc':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'name-desc':
        filtered.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'newest':
        filtered.sort((a, b) => (b.Id || 0) - (a.Id || 0));
        break;
      case 'oldest':
        filtered.sort((a, b) => (a.Id || 0) - (b.Id || 0));
        break;
      default:
        break;
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
        filtered.sort((a, b) => 
          new Date(b.lastModified || 0) - new Date(a.lastModified || 0)
        );
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
  }, [searchQuery, selectedCategory, priceRange, stockFilter, tagFilter, featuredFilter, statusFilter, sortBy]);

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

    const startTime = performance.now();
    try {
      setActionLoading(true);
      const selectedIds = Array.from(selectedProducts);
      
      logActivity('bulk_delete_initiated', { 
        productCount: selectedIds.length,
        productIds: selectedIds,
        initiatedAt: new Date().toISOString()
      });
      
      // Track bulk delete performance
      const deletePromises = selectedIds.map(async (id, index) => {
        try {
          await ProductService.delete(id);
          return { id, success: true, index };
        } catch (error) {
          console.error(`Failed to delete product ${id}:`, error);
          return { id, success: false, error: error.message, index };
        }
      });
      
      const results = await Promise.allSettled(deletePromises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
      const failed = results.filter(r => r.status === 'rejected' || !r.value?.success);
      
      // Update products list with only successful deletions
      if (successful.length > 0) {
        const successfulIds = successful.map(r => r.value.id);
        setProducts(prev => prev.filter(p => !successfulIds.includes(p.Id)));
      }
      
      setSelectedProducts(new Set());
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      logActivity('bulk_delete_completed', { 
        productCount: selectedIds.length,
        successfulCount: successful.length,
        failedCount: failed.length,
        duration: Math.round(duration),
        success: failed.length === 0
      });
      
      // Track performance metrics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'bulk_delete_performance', {
          product_count: selectedIds.length,
          duration_ms: Math.round(duration),
          success_rate: (successful.length / selectedIds.length) * 100,
          browser_name: navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Other'
        });
      }
      
      if (failed.length === 0) {
        showToast(`${successful.length} products deleted successfully`, 'success');
      } else if (successful.length > 0) {
        showToast(`${successful.length} products deleted, ${failed.length} failed`, 'warning');
      } else {
        showToast('Failed to delete products', 'error');
      }
      
    } catch (error) {
      console.error('Error bulk deleting products:', error);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      logActivity('bulk_delete_failed', { 
        error: error.message,
        duration: Math.round(duration),
        browserInfo: {
          userAgent: navigator.userAgent,
          online: navigator.onLine,
          memory: window.performance?.memory?.usedJSHeapSize || 0
        }
      });
      showToast('Failed to delete products', 'error');
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

    const startTime = performance.now();
    try {
      setActionLoading(true);
      const selectedIds = Array.from(selectedProducts);
      
      logActivity('bulk_approve_initiated', {
        productCount: selectedIds.length,
        productIds: selectedIds,
        approvedBy: currentUser.role,
        initiatedAt: new Date().toISOString()
      });
      
const updates = selectedIds.map(id => ({
        id,
        data: { 
          moderatorApproved: true, 
          status: 'approved',
          visibility: 'published',
          approvedAt: new Date().toISOString(),
          approvedBy: currentUser.id || currentUser.role,
          lastModified: new Date().toISOString()
        }
      }));
      
      // Execute bulk update with performance tracking
      const updatePromises = updates.map(async (update, index) => {
        try {
          const result = await ProductService.bulkUpdate([update]);
          return { id: update.id, success: true, index };
        } catch (error) {
          console.error(`Failed to approve product ${update.id}:`, error);
          return { id: update.id, success: false, error: error.message, index };
        }
      });
      
      const results = await Promise.allSettled(updatePromises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
      const failed = results.filter(r => r.status === 'rejected' || !r.value?.success);
      
      // Update products list
      if (successful.length > 0) {
        const successfulIds = successful.map(r => r.value.id);
        setProducts(prev => prev.map(p => 
          successfulIds.includes(p.Id) 
            ? { 
                ...p, 
                moderatorApproved: true, 
                status: 'approved', 
                visibility: 'published',
                approvedAt: new Date().toISOString()
              }
            : p
        ));
      }
      
      setSelectedProducts(new Set());
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      logActivity('bulk_approve_completed', { 
        productCount: selectedIds.length,
        successfulCount: successful.length,
        failedCount: failed.length,
        duration: Math.round(duration),
        approvedBy: currentUser.role
      });
      
      // Track approval performance
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'bulk_approve_performance', {
          product_count: selectedIds.length,
          duration_ms: Math.round(duration),
          success_rate: (successful.length / selectedIds.length) * 100,
          approver_role: currentUser.role
        });
      }
      
      if (failed.length === 0) {
        showToast(`${successful.length} products approved successfully`, 'success');
      } else if (successful.length > 0) {
        showToast(`${successful.length} products approved, ${failed.length} failed`, 'warning');
      } else {
        showToast('Failed to approve products', 'error');
      }
      
    } catch (error) {
      console.error('Error approving products:', error);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      logActivity('bulk_approve_failed', { 
        error: error.message,
        duration: Math.round(duration),
        approvedBy: currentUser.role
      });
      showToast('Failed to approve products', 'error');
    } finally {
      setActionLoading(false);
    }
  };

const handleBulkEdit = async () => {
    const startTime = performance.now();
    try {
      setActionLoading(true);
      const selectedIds = Array.from(selectedProducts);
      
      logActivity('bulk_edit_initiated', {
        productCount: selectedIds.length,
        productIds: selectedIds,
        editData: bulkEditData,
        initiatedAt: new Date().toISOString()
      });

      // Use the new bulk update service methods
      let updatedProducts = [];

      // Handle price adjustments
      if (bulkEditData.priceAdjustment.value) {
        const adjustment = {
          type: bulkEditData.priceAdjustment.type,
          value: parseFloat(bulkEditData.priceAdjustment.value)
        };
        
        if (isNaN(adjustment.value)) {
          throw new Error(`Invalid price adjustment value: ${bulkEditData.priceAdjustment.value}`);
        }

        updatedProducts = await ProductService.bulkPriceAdjustment(selectedIds, adjustment);
      }

      // Handle other bulk updates
      const otherUpdates = [];
      if (bulkEditData.category) {
        otherUpdates.push({ field: 'category', value: bulkEditData.category });
      }
      if (bulkEditData.status) {
        otherUpdates.push({ field: 'visibility', value: bulkEditData.status });
      }

      if (otherUpdates.length > 0) {
        const updates = selectedIds.map(id => ({
          id,
          data: otherUpdates.reduce((acc, update) => {
            acc[update.field] = update.value;
            return acc;
          }, {
            lastModified: new Date().toISOString(),
            modifiedBy: currentUser.id || currentUser.role
          })
        }));

        const bulkUpdated = await ProductService.bulkUpdate(updates);
        updatedProducts = bulkUpdated.length > 0 ? bulkUpdated : updatedProducts;
      }
// Handle tags (if needed in future)
      if (bulkEditData.tags && bulkEditData.tags.values.length > 0) {
        // Tag handling logic would go here
        const tagUpdates = selectedIds.map(id => ({
          id,
          data: { 
            tags: bulkEditData.tags.action === 'add' ? [...(products.find(p => p.Id === id)?.tags || []), ...bulkEditData.tags.values] : bulkEditData.tags.values,
            lastModified: new Date().toISOString()
          }
        }));
        await ProductService.bulkUpdate(tagUpdates);
      }
      
      const results = await Promise.allSettled(updatePromises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
      const failed = results.filter(r => r.status === 'rejected' || !r.value?.success);
      
      // Update products list with successful updates
      if (successful.length > 0) {
        const successfulProducts = successful.map(r => r.value.product).filter(Boolean);
        setProducts(prev => prev.map(p => {
          const updated = successfulProducts.find(u => u.Id === p.Id);
          return updated || p;
        }));
      }
      
      setSelectedProducts(new Set());
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      logActivity('bulk_edit_completed', {
        productCount: selectedIds.length,
        successfulCount: successful.length,
        failedCount: failed.length,
        duration: Math.round(duration),
        editData: bulkEditData
      });
      
      // Track bulk edit performance
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'bulk_edit_performance', {
          product_count: selectedIds.length,
          duration_ms: Math.round(duration),
          success_rate: (successful.length / selectedIds.length) * 100,
          edit_type: Object.keys(bulkEditData).filter(key => bulkEditData[key]).join(',')
        });
      }
      
      if (failed.length === 0) {
        showToast(`${successful.length} products updated successfully`, 'success');
      } else if (successful.length > 0) {
        showToast(`${successful.length} products updated, ${failed.length} failed`, 'warning');
      } else {
        showToast('Failed to update products', 'error');
      }
      
    } catch (error) {
      console.error('Error bulk editing products:', error);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      logActivity('bulk_edit_failed', { 
        error: error.message,
        duration: Math.round(duration),
        editData: bulkEditData
      });
      showToast('Failed to update products', 'error');
    } finally {
      setActionLoading(false);
      setShowBulkEditModal(false);
    }
  };

  // Product actions
const handleToggleVisibility = async (productId) => {
    const startTime = performance.now();
    try {
      setActionLoading(true);
      const product = products.find(p => p.Id === productId);
      
      logActivity('visibility_toggle_initiated', {
        productId,
        productTitle: product?.title || 'Unknown',
        currentVisibility: product?.visibility || 'unknown'
      });
      
      const updatedProduct = await ProductService.toggleVisibility(productId);
      
      if (updatedProduct) {
        setProducts(prev => prev.map(p => 
p.Id === productId ? {
            ...updatedProduct,
            lastModified: new Date().toISOString(),
            modifiedBy: currentUser.id || currentUser.role,
            visibilityChangedAt: new Date().toISOString()
          } : p
        ));
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        logActivity('visibility_toggled', {
          productId,
          productTitle: updatedProduct.title,
          newVisibility: updatedProduct.visibility,
          duration: Math.round(duration)
        });
        
        showToast(
          `Product ${updatedProduct.visibility === 'published' ? 'published' : 'hidden'}`,
          'success'
        );
        
        // Track visibility toggle performance
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'visibility_toggle', {
            new_visibility: updatedProduct.visibility,
            duration_ms: Math.round(duration)
          });
        }
      }
    } catch (error) {
      console.error('Error toggling visibility:', error);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      logActivity('visibility_toggle_failed', {
        productId,
        error: error.message,
        duration: Math.round(duration)
      });
      showToast('Failed to update product visibility', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleFeatured = async (productId) => {
    const startTime = performance.now();
    try {
      setActionLoading(true);
      const product = products.find(p => p.Id === productId);
      
      logActivity('featured_toggle_initiated', {
        productId,
        productTitle: product?.title || 'Unknown',
        currentFeatured: product?.featured || false
      });
      
      const updatedProduct = await ProductService.toggleFeatured(productId);
      
      if (updatedProduct) {
        setProducts(prev => prev.map(p => 
          p.Id === productId ? {
            ...updatedProduct,
lastModified: new Date().toISOString(),
            modifiedBy: currentUser.id || currentUser.role,
            featuredChangedAt: new Date().toISOString()
          } : p
        ));
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        logActivity('featured_toggled', {
          productId,
          productTitle: updatedProduct.title,
          newFeatured: updatedProduct.featured,
          duration: Math.round(duration)
        });
        
        showToast(
          `Product ${updatedProduct.featured ? 'marked as featured' : 'removed from featured'}`,
          'success'
        );
        
        // Track featured toggle performance
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'featured_toggle', {
            new_featured: updatedProduct.featured,
            duration_ms: Math.round(duration)
          });
        }
      }
    } catch (error) {
      console.error('Error toggling featured status:', error);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      logActivity('featured_toggle_failed', {
        productId,
        error: error.message,
        duration: Math.round(duration)
      });
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
      logActivity('delete_permission_denied', {
        productId: productToDelete.Id,
        userRole: currentUser.role
      });
      setShowDeleteDialog(false);
      setProductToDelete(null);
      return;
    }

    const startTime = performance.now();
    try {
      setActionLoading(true);
      
      logActivity('product_delete_initiated', { 
        productId: productToDelete.Id,
        productTitle: productToDelete.title,
        productCategory: productToDelete.category,
        deletedBy: currentUser.id || currentUser.role,
        initiatedAt: new Date().toISOString()
      });
      
      // Create backup of product data before deletion
      const productBackup = {
        ...productToDelete,
        deletedAt: new Date().toISOString(),
        deletedBy: currentUser.id || currentUser.role,
        backupId: `backup_${Date.now()}`
      };
      
      const deleted = await ProductService.delete(productToDelete.Id);
      
      if (deleted) {
        setProducts(prev => prev.filter(p => p.Id !== productToDelete.Id));
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Store deletion record for audit trail with enhanced metadata
        try {
          const deletionRecord = {
            ...productBackup,
            deletionDuration: Math.round(duration),
            browserInfo: navigator.userAgent,
            timestamp: Date.now(),
            userSession: sessionStorage.getItem('sessionId'),
            adminAction: true,
            recoverable: true,
            retentionPeriod: 30 // days
          };
          
          const deletionHistory = JSON.parse(localStorage.getItem('product_deletion_history') || '[]');
          deletionHistory.unshift(deletionRecord);
          localStorage.setItem('product_deletion_history', JSON.stringify(deletionHistory.slice(0, 100)));
        } catch (storageError) {
          console.warn('Failed to store deletion record:', storageError);
        }
        
        logActivity('product_deleted', { 
          productId: productToDelete.Id,
          productTitle: productToDelete.title,
          duration: Math.round(duration),
          success: true,
          recoverable: true
        });
        
        // Track deletion performance
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'product_deletion', {
            duration_ms: Math.round(duration),
            product_category: productToDelete.category || 'unknown',
            deleter_role: currentUser.role
          });
        }
        
        showToast('Product deleted successfully. Can be recovered within 30 days.', 'success');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      logActivity('product_delete_failed', { 
        productId: productToDelete.Id,
        productTitle: productToDelete.title,
        error: error.message,
        duration: Math.round(duration),
        browserInfo: {
          userAgent: navigator.userAgent,
          online: navigator.onLine
        }
      });
      
      // Categorize error for better user feedback
      let errorMessage = 'Failed to delete product';
      if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Network error: Failed to delete product. Please check your connection.';
      } else if (error.message.includes('permission') || error.message.includes('forbidden')) {
        errorMessage = 'Permission error: You may not have rights to delete this product.';
      } else if (error.message.includes('not found')) {
        errorMessage = 'Product not found: It may have already been deleted.';
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setActionLoading(false);
      setShowDeleteDialog(false);
      setProductToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    logActivity('product_delete_cancelled', {
      productId: productToDelete?.Id || 'unknown',
      productTitle: productToDelete?.title || 'unknown'
    });
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
<div className="p-6 space-y-6" role="main" aria-labelledby="products-title">
      {/* Screen reader heading */}
      <h1 id="products-title" className="sr-only">Product Management Dashboard</h1>
      
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => navigate('/admin/products/add')}
            className="whitespace-nowrap bg-primary-600 hover:bg-primary-700"
            aria-label="Add new product"
          >
            <ApperIcon name="Plus" className="w-4 h-4 mr-2" aria-hidden="true" />
            Add New Product
          </Button>
          
          <div className="flex items-center space-x-2" role="status" aria-live="polite">
            <span className="text-sm text-gray-600">
              {filteredProducts.length} of {products.length} products
            </span>
            {selectedProducts.size > 0 && (
              <Badge variant="secondary" aria-label={`${selectedProducts.size} products selected`}>
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
              className="flex flex-wrap items-center gap-2"
              role="group"
              aria-label="Bulk actions for selected products"
            >
              {(currentUser.role === 'admin' || currentUser.role === 'moderator') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkApprove}
                  disabled={actionLoading}
                  aria-label={`Approve ${selectedProducts.size} selected products`}
                  title={`Approve ${selectedProducts.size} products and make them visible to customers`}
                  className="border-green-300 text-green-700 hover:bg-green-50"
                >
                  <ApperIcon name="CheckCircle" className="w-4 h-4 mr-2" aria-hidden="true" />
                  Approve ({selectedProducts.size})
                </Button>
              )}
              
              {currentUser.permissions.canBulkEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBulkEditModal(true)}
                  disabled={actionLoading}
                  aria-label={`Edit ${selectedProducts.size} selected products`}
                  title="Edit price, category, and status for selected products"
                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  <ApperIcon name="Edit3" className="w-4 h-4 mr-2" aria-hidden="true" />
                  Bulk Edit ({selectedProducts.size})
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const selectedData = Array.from(selectedProducts).map(id => 
                    products.find(p => p.Id === id)
                  );
                  const csv = [
                    'Name,Category,Price,Stock,SKU',
                    ...selectedData.map(p => 
                      `"${p.title}","${p.category}","${p.price}","${p.stock}","${p.sku || ''}"`
                    )
                  ].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `products-export-${new Date().toISOString().split('T')[0]}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                  showToast(`Exported ${selectedProducts.size} products`, 'success');
                }}
                disabled={actionLoading}
                title="Export selected products to CSV"
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                <ApperIcon name="Download" className="w-4 h-4 mr-2" aria-hidden="true" />
                Export ({selectedProducts.size})
              </Button>
              
              {currentUser.permissions.canDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowBulkDeleteDialog(true)}
                  disabled={actionLoading}
                  aria-label={`Delete ${selectedProducts.size} selected products`}
                  title="Permanently delete selected products - recoverable for 30 days"
                >
                  <ApperIcon name="Trash2" className="w-4 h-4 mr-2" aria-hidden="true" />
                  Delete ({selectedProducts.size})
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

<div className="flex flex-wrap items-center gap-4">
          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2" role="group" aria-label="View mode selection">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              aria-pressed={viewMode === 'grid'}
              title="Display products in grid layout"
            >
              <ApperIcon name="Grid3X3" className="w-4 h-4" aria-hidden="true" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              aria-label="List view"
              aria-pressed={viewMode === 'list'}
              title="Display products in list layout"
            >
              <ApperIcon name="List" className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>

          {/* Sorting */}
          <div className="flex items-center space-x-2">
            <label htmlFor="sort-select" className="text-sm text-gray-600">Sort:</label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="price-asc">Price Low-High</option>
              <option value="price-desc">Price High-Low</option>
              <option value="stock-desc">Stock High-Low</option>
              <option value="last-updated">Recently Updated</option>
            </select>
          </div>

          {/* Role Badge */}
          <Badge 
            variant={currentUser.role === 'admin' ? 'default' : 'secondary'} 
            className="text-xs"
            role="status"
            aria-label={`Current role: ${currentUser.role}`}
          >
            {currentUser.role.toUpperCase()}
          </Badge>

          {/* Activity Log Access */}
          {currentUser.role === 'admin' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/activity-log')}
              aria-label="View activity log"
              title="View detailed activity log and system events"
            >
              <ApperIcon name="FileText" className="w-4 h-4 mr-2" aria-hidden="true" />
              Activity Log
            </Button>
          )}

          {/* Performance Monitoring Badge */}
          {typeof window !== 'undefined' && window.performance?.timing && (
            <Badge 
              variant="outline" 
              className="text-xs"
              title={`Page load time: ${Math.round(window.performance.timing.loadEventEnd - window.performance.timing.navigationStart)}ms`}
            >
              {Math.round(window.performance.timing.loadEventEnd - window.performance.timing.navigationStart)}ms
            </Badge>
          )}
        </div>
      </div>

{/* Filters and Search */}
      <section aria-labelledby="search-filters-title">
        <h2 id="search-filters-title" className="sr-only">Search and Filter Products</h2>
        
        {/* Search and Quick Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <label htmlFor="product-search" className="sr-only">Search products</label>
              <div className="relative">
                <ApperIcon 
                  name="Search" 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" 
                  aria-hidden="true"
                />
                <Input
                  id="product-search"
                  type="text"
                  placeholder="Search by name, SKU, or brand..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  aria-describedby="search-help"
                />
                <div id="search-help" className="sr-only">
                  Search through product names, SKU codes, brands, and tags. Results update automatically as you type.
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {/* Quick Category Filter */}
              <div>
                <label htmlFor="quick-category-filter" className="sr-only">Quick category filter</label>
                <select
                  id="quick-category-filter"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map((category, index) => (
                    <option key={`${category.slug}-${index}`} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Approval Status Filter for Moderators */}
              {(currentUser.role === 'admin' || currentUser.role === 'moderator') && (
                <div>
                  <label htmlFor="status-filter" className="sr-only">Filter by approval status</label>
                  <select
                    id="status-filter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    aria-label="Filter products by approval status"
                  >
                    <option value="all">All Status</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="pending-approval">Pending Approval</option>
                  </select>
                </div>
              )}

              {/* Advanced Filters Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="whitespace-nowrap"
                aria-label={showAdvancedFilters ? 'Hide advanced filters' : 'Show advanced filters'}
              >
                <ApperIcon name="Filter" className="w-4 h-4 mr-2" aria-hidden="true" />
                {showAdvancedFilters ? 'Hide' : 'Show'} Filters
                <ApperIcon 
                  name={showAdvancedFilters ? "ChevronUp" : "ChevronDown"} 
                  className="w-4 h-4 ml-2" 
                  aria-hidden="true" 
                />
              </Button>
            </div>
</div>
          </div>
        </div>
          {/* Select All Checkbox */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="select-all"
              checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
              onChange={handleSelectAll}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              aria-describedby="select-all-help"
            />
            <label htmlFor="select-all" className="text-sm font-medium text-gray-700">
              Select All ({filteredProducts.length} items)
            </label>
            <div id="select-all-help" className="sr-only">
              Toggle selection of all visible products in the current filter
            </div>
          </div>
        </div>

{/* Advanced Filters */}
          {showAdvancedFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-gray-200 pt-4 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Advanced Filters</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-gray-500 hover:text-gray-700 text-xs"
                  aria-label="Clear all active filters"
                >
                  <ApperIcon name="X" className="w-4 h-4 mr-1" aria-hidden="true" />
                  Clear All
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
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
                      aria-label="Minimum price"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                      className="text-sm"
                      aria-label="Maximum price"
                    />
                  </div>
                </div>

                {/* Stock Status */}
                <div>
                  <label htmlFor="stock-filter" className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Status
                  </label>
                  <select
                    id="stock-filter"
                    value={stockFilter}
                    onChange={(e) => setStockFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    aria-label="Filter by stock availability"
                  >
                    <option value="all">All Stock</option>
                    <option value="in-stock">In Stock (10+)</option>
                    <option value="low-stock">Low Stock (1-10)</option>
                    <option value="out-of-stock">Out of Stock</option>
                  </select>
                </div>

                {/* Tag Filter */}
                <div>
                  <label htmlFor="tag-filter" className="block text-sm font-medium text-gray-700 mb-1">
                    Tags
                  </label>
                  <select
                    id="tag-filter"
                    value={tagFilter}
                    onChange={(e) => setTagFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    aria-label="Filter by product tags"
                  >
                    <option value="all">All Tags</option>
                    {availableTags.map((tag, index) => (
                      <option key={`${tag}-${index}`} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Featured Status */}
                <div>
                  <label htmlFor="featured-filter" className="block text-sm font-medium text-gray-700 mb-1">
                    Featured
                  </label>
                  <select
                    id="featured-filter"
                    value={featuredFilter}
                    onChange={(e) => setFeaturedFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    aria-label="Filter by featured status"
                  >
                    <option value="all">All Products</option>
                    <option value="featured">Featured Only</option>
                    <option value="not-featured">Not Featured</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label htmlFor="visibility-filter" className="block text-sm font-medium text-gray-700 mb-1">
                    Visibility
                  </label>
                  <select
                    id="visibility-filter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    aria-label="Filter by publication status"
                  >
                    <option value="all">All Status</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>

                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                  <div className="flex space-x-2">
                    <Input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="text-sm"
                      aria-label="Start date"
                    />
                    <Input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="text-sm"
                      aria-label="End date"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

          {/* Sort */}
          <div className="flex items-center space-x-4">
            <label htmlFor="sort-select" className="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              aria-label="Sort products by selected criteria"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="price-high">Price (High-Low)</option>
              <option value="price-low">Price (Low-High)</option>
              <option value="stock-high">Stock (High-Low)</option>
              <option value="stock-low">Stock (Low-High)</option>
              <option value="most-popular">Most Popular</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="last-updated">Last Updated</option>
            </select>
          </div>
        </div>
      </section>
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
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
                : "grid-cols-1"
            )}
            layout
          >
            <AnimatePresence mode="wait">
              {filteredProducts.map((product) => (
                <motion.div
                  key={product.Id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <ProductManagementCard
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
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Pagination Placeholder */}
          {filteredProducts.length > 50 && (
            <div className="flex justify-center mt-8">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>Showing {Math.min(filteredProducts.length, 50)} of {filteredProducts.length} products</span>
                <Button variant="outline" size="sm" disabled>
                  Load More
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Bulk Edit Modal */}
{/* Bulk Edit Modal */}
      <AnimatePresence>
        {showBulkEditModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="bulk-edit-title"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowBulkEditModal(false);
              }
            }}
          >
            <motion.div
              className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 id="bulk-edit-title" className="text-lg font-semibold text-gray-900">
                    Bulk Edit Products
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Apply changes to {selectedProducts.size} selected products
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBulkEditModal(false)}
                  aria-label="Close bulk edit dialog"
                >
                  <ApperIcon name="X" className="w-4 h-4" aria-hidden="true" />
                </Button>
              </div>
              
              <form onSubmit={(e) => { e.preventDefault(); handleBulkEdit(); }}>
                <div className="space-y-6">
                  {/* Price Adjustment */}
                  <div>
                    <label htmlFor="price-adjustment-type" className="block text-sm font-medium text-gray-700 mb-3">
                      💰 Price Adjustment
                    </label>
                    <div className="space-y-3">
                      <div className="flex space-x-2">
                        <select
                          id="price-adjustment-type"
                          value={bulkEditData.priceAdjustment.type}
                          onChange={(e) => setBulkEditData(prev => ({
                            ...prev,
                            priceAdjustment: { ...prev.priceAdjustment, type: e.target.value }
                          }))}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          aria-label="Price adjustment type"
                        >
                          <option value="percentage">Percentage (%)</option>
                          <option value="fixed">Fixed Amount (PKR)</option>
                        </select>
                        <Input
                          type="number"
                          placeholder={bulkEditData.priceAdjustment.type === 'percentage' ? '± %' : '± PKR'}
                          value={bulkEditData.priceAdjustment.value}
                          onChange={(e) => setBulkEditData(prev => ({
                            ...prev,
                            priceAdjustment: { ...prev.priceAdjustment, value: e.target.value }
                          }))}
                          className="flex-1"
                          aria-label={`Price adjustment value in ${bulkEditData.priceAdjustment.type === 'percentage' ? 'percentage' : 'PKR'}`}
                          min={bulkEditData.priceAdjustment.type === 'percentage' ? '-100' : undefined}
                          max={bulkEditData.priceAdjustment.type === 'percentage' ? '1000' : undefined}
                          step={bulkEditData.priceAdjustment.type === 'percentage' ? '0.1' : '1'}
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        {bulkEditData.priceAdjustment.type === 'percentage' ? 
                          '📈 Use positive values to increase, negative to decrease (e.g., 10 for +10%, -20 for -20%)' :
                          '💸 Use positive values to increase, negative to decrease (e.g., 100 for +100 PKR, -50 for -50 PKR)'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Category Change */}
                  <div>
                    <label htmlFor="bulk-category-select" className="block text-sm font-medium text-gray-700 mb-3">
                      📂 Change Category
                    </label>
                    <select
                      id="bulk-category-select"
                      value={bulkEditData.category}
                      onChange={(e) => setBulkEditData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      aria-label="New category for selected products"
                    >
                      <option value="">Keep Current Category</option>
                      {categories.map((category, index) => (
                        <option key={`${category.slug}-edit-${index}`} value={category.slug}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status Change */}
                  <div>
                    <label htmlFor="bulk-status-select" className="block text-sm font-medium text-gray-700 mb-3">
                      👁️ Change Visibility
                    </label>
                    <select
                      id="bulk-status-select"
                      value={bulkEditData.status}
                      onChange={(e) => setBulkEditData(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      aria-label="New publication status for selected products"
                    >
                      <option value="">Keep Current Status</option>
                      <option value="published">✅ Published (Visible to customers)</option>
                      <option value="draft">📝 Draft (Hidden from customers)</option>
                    </select>
                  </div>

                  {/* Preview Changes */}
                  {(bulkEditData.priceAdjustment.value || bulkEditData.category || bulkEditData.status) && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="text-sm font-medium text-blue-900 mb-3 flex items-center">
                        <ApperIcon name="Eye" className="w-4 h-4 mr-2" />
                        Preview Changes:
                      </h4>
                      <ul className="text-sm text-blue-800 space-y-2">
                        {bulkEditData.priceAdjustment.value && (
                          <li className="flex items-center">
                            <ApperIcon name="DollarSign" className="w-4 h-4 mr-2" />
                            Price: {bulkEditData.priceAdjustment.type === 'percentage' ? 
                              `${bulkEditData.priceAdjustment.value > 0 ? '+' : ''}${bulkEditData.priceAdjustment.value}%` :
                              `${bulkEditData.priceAdjustment.value > 0 ? '+' : ''}${bulkEditData.priceAdjustment.value} PKR`
                            }
                          </li>
                        )}
                        {bulkEditData.category && (
                          <li className="flex items-center">
                            <ApperIcon name="Folder" className="w-4 h-4 mr-2" />
                            Category: {categories.find(c => c.slug === bulkEditData.category)?.name || bulkEditData.category}
                          </li>
                        )}
                        {bulkEditData.status && (
                          <li className="flex items-center">
                            <ApperIcon name="Eye" className="w-4 h-4 mr-2" />
                            Status: {bulkEditData.status === 'published' ? '✅ Published' : '📝 Draft'}
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-3 justify-end mt-8 pt-4 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowBulkEditModal(false)}
                    disabled={actionLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={actionLoading || (!bulkEditData.priceAdjustment.value && !bulkEditData.category && !bulkEditData.status)}
                    aria-describedby="bulk-edit-help"
                    className="bg-primary-600 hover:bg-primary-700"
                  >
                    {actionLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" aria-hidden="true" />
                        Updating {selectedProducts.size} products...
                      </>
                    ) : (
                      <>
                        <ApperIcon name="Save" className="w-4 h-4 mr-2" />
                        Apply Changes to {selectedProducts.size} Products
                      </>
                    )}
                  </Button>
                </div>
                
                <div id="bulk-edit-help" className="sr-only">
                  This will apply the selected changes to all {selectedProducts.size} selected products. 
                  Changes will be tracked in the activity log.
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Delete Confirmation */}
{/* Bulk Delete Modal */}
      <AnimatePresence>
        {showBulkDeleteDialog && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="bulk-delete-title"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowBulkDeleteDialog(false);
              }
            }}
          >
            <motion.div
              className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start space-x-3 mb-6">
                <div className="flex-shrink-0">
                  <ApperIcon name="AlertTriangle" className="w-8 h-8 text-red-600" aria-hidden="true" />
                </div>
                <div>
                  <h3 id="bulk-delete-title" className="text-xl font-semibold text-gray-900">
                    Delete Selected Products
                  </h3>
                  <p className="text-gray-600 mt-1">
                    This action will permanently remove {selectedProducts.size} products
                  </p>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="flex items-center mb-3">
                    <ApperIcon name="Trash2" className="w-5 h-5 text-red-600 mr-2" />
                    <span className="font-medium text-red-800">
                      {selectedProducts.size} products will be deleted
                    </span>
                  </div>
                  
                  {selectedProducts.size <= 5 ? (
                    <ul className="text-sm text-red-700 space-y-1">
                      {Array.from(selectedProducts).map(productId => {
                        const product = products.find(p => p.Id === productId);
                        return (
                          <li key={productId} className="flex items-center">
                            <ApperIcon name="Package" className="w-4 h-4 mr-2 flex-shrink-0" />
                            {product?.title || `Product ID: ${productId}`}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-sm text-red-700">
                      Too many products to list individually. All {selectedProducts.size} selected products will be deleted.
                    </p>
                  )}
                </div>
                
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <div className="flex items-start space-x-2">
                    <ApperIcon name="Shield" className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <div className="text-sm text-amber-800">
                      <p className="font-medium mb-2">⚠️ This deletion will:</p>
                      <ul className="space-y-1 text-xs">
                        <li className="flex items-center">
                          <ApperIcon name="Eye" className="w-3 h-3 mr-2" />
                          Remove products from customer view immediately
                        </li>
                        <li className="flex items-center">
                          <ApperIcon name="ShoppingCart" className="w-3 h-3 mr-2" />
                          Cancel any pending orders for these products
                        </li>
                        <li className="flex items-center">
                          <ApperIcon name="Search" className="w-3 h-3 mr-2" />
                          Remove from search results and recommendations
                        </li>
                        <li className="flex items-center">
                          <ApperIcon name="Image" className="w-3 h-3 mr-2" />
                          Delete associated images and data
                        </li>
                        <li className="flex items-center">
                          <ApperIcon name="FileText" className="w-3 h-3 mr-2" />
                          Create audit trail entries for recovery
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2">
                    <ApperIcon name="RotateCcw" className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      Products can be recovered within 30 days
                    </span>
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    Deleted products are backed up and can be restored by administrators
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-3 justify-end pt-4 border-t border-gray-200">
                <Button
                  variant="ghost"
                  onClick={() => setShowBulkDeleteDialog(false)}
                  disabled={actionLoading}
                  aria-label="Cancel bulk delete operation"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleBulkDelete}
                  disabled={actionLoading || !currentUser.permissions.canDelete}
                  aria-describedby="bulk-delete-confirm-help"
                >
                  {actionLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" aria-hidden="true" />
                      Deleting {selectedProducts.size} products...
                    </>
                  ) : (
                    <>
                      <ApperIcon name="Trash2" className="w-4 h-4 mr-2" aria-hidden="true" />
                      Delete {selectedProducts.size} Products
                    </>
                  )}
                </Button>
              </div>
              
              <div id="bulk-delete-confirm-help" className="sr-only">
                Confirm permanent deletion of {selectedProducts.size} selected products. 
                Products can be recovered within 30 days through the admin recovery system.
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Single Product Delete Modal */}
      <AnimatePresence>
        {showDeleteDialog && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-product-title"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleDeleteCancel();
              }
            }}
          >
            <motion.div
              className="bg-white rounded-lg p-6 max-w-md w-full"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start space-x-3 mb-4">
                <div className="flex-shrink-0">
                  <ApperIcon name="AlertTriangle" className="w-6 h-6 text-red-600" aria-hidden="true" />
                </div>
                <div>
                  <h3 id="delete-product-title" className="text-lg font-semibold text-gray-900">
                    Delete Product
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">
                    This action cannot be undone immediately
                  </p>
                </div>
              </div>
              
              <div className="mb-6 space-y-4">
                <p className="text-gray-700">
                  Are you sure you want to delete "<strong>{productToDelete?.title}</strong>"?
                </p>
                
                {productToDelete && (
                  <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                    <div className="text-sm text-red-800 grid grid-cols-2 gap-2">
                      <div><strong>SKU:</strong> {productToDelete.sku || 'N/A'}</div>
                      <div><strong>Category:</strong> {productToDelete.category || 'N/A'}</div>
                      <div><strong>Price:</strong> PKR {productToDelete.price || 'N/A'}</div>
                      <div><strong>Stock:</strong> {productToDelete.stock || 0} units</div>
                    </div>
                  </div>
                )}
                
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2">
                    <ApperIcon name="RotateCcw" className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      Recoverable for 30 days
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 justify-end">
                <Button
                  variant="ghost"
                  onClick={handleDeleteCancel}
                  disabled={actionLoading}
                  aria-label="Cancel product deletion"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteConfirm}
                  disabled={actionLoading || !currentUser.permissions.canDelete}
                  aria-describedby="delete-confirm-help"
                >
                  {actionLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" aria-hidden="true" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <ApperIcon name="Trash2" className="w-4 h-4 mr-2" aria-hidden="true" />
                      Delete Product
                    </>
                  )}
                </Button>
              </div>
              
              <div id="delete-confirm-help" className="sr-only">
                Confirm deletion of product "{productToDelete?.title}". 
                Product can be recovered within 30 days through the admin recovery system.
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageProducts;