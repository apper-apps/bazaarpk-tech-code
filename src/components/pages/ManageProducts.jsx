import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import ProductService from '@/services/api/ProductService'
import { CategoryService } from '@/services/api/CategoryService'
import { useToast } from '@/hooks/useToast'
import ApperIcon from "@/components/ApperIcon";
import Category from "@/components/pages/Category";
import ProductManagementCard from "@/components/organisms/ProductManagementCard";
import Empty from "@/components/ui/Empty";
import ErrorComponent, { Error } from "@/components/ui/Error";
import Loading from "@/components/ui/Loading";
import Input from "@/components/atoms/Input";
import Button from "@/components/atoms/Button";
import Badge from "@/components/atoms/Badge";
import { cn } from "@/utils/cn";
import { formatPrice } from "@/utils/currency";
import cacheManager from "@/utils/cacheManager";
import useWebSocket from "@/hooks/useWebSocket";

function ManageProducts() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  
// State management
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('lastModified')
  const [sortOrder, setSortOrder] = useState('desc')
  const [selectedProducts, setSelectedProducts] = useState(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, product: null })
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)
  
  // Form validation states
  const [validationErrors, setValidationErrors] = useState({})
  const [isValidating, setIsValidating] = useState(false)
  
  // WebSocket for real-time updates
  const { connected, lastMessage } = useWebSocket('/admin/products')
  
  // Load initial data
  useEffect(() => {
    loadData()
  }, [])
  
  // Handle real-time updates
  useEffect(() => {
    if (lastMessage?.type === 'product_updated' || lastMessage?.type === 'product_created') {
      loadData()
      showToast(`Product ${lastMessage.type.split('_')[1]}`, 'info')
    }
  }, [lastMessage])
  
  async function loadData() {
    try {
      setLoading(true)
      setError(null)
      
      const [productsData, categoriesData] = await Promise.all([
        ProductService.getAll(),
        CategoryService.getAll()
      ])
      
      setProducts(productsData || [])
      setCategories(categoriesData || [])
    } catch (err) {
      console.error('Error loading data:', err)
      setError(err.message || 'Failed to load data')
      showToast('Failed to load products', 'error')
    } finally {
      setLoading(false)
    }
  }
  
  // Validation helper
  const validateProductChanges = useCallback(async (productData) => {
    setIsValidating(true)
    setValidationErrors({})
    
    try {
      const validation = await ProductService.validateProduct(productData)
      
      if (!validation.isValid) {
        const errors = {}
        validation.errors.forEach(error => {
          if (error.includes('Category')) {
            errors.category = error
          } else if (error.includes('Description')) {
            errors.description = error
          } else if (error.includes('Selling Price')) {
            errors.sellingPrice = error
          } else if (error.includes('Product name') || error.includes('title')) {
            errors.title = error
          } else if (error.includes('Stock')) {
            errors.stockQuantity = error
          } else {
            errors.general = error
          }
        })
        
        setValidationErrors(errors)
        
        // Show consolidated error message
        const errorMessage = `Validation failed: ${validation.errors.join(', ')}`
        showToast(errorMessage, 'error')
        
        return { isValid: false, errors }
      }
      
      return { isValid: true, errors: {} }
    } catch (error) {
      console.error('Validation error:', error)
      const errorMsg = 'Validation check failed'
      setValidationErrors({ general: errorMsg })
      showToast(errorMsg, 'error')
      return { isValid: false, errors: { general: errorMsg } }
    } finally {
      setIsValidating(false)
    }
  }, [showToast])
  
  // Selection handlers
  function handleSelectAll() {
    if (selectAll) {
      setSelectedProducts(new Set())
      setSelectAll(false)
    } else {
      const filteredProducts = getFilteredProducts()
      setSelectedProducts(new Set(filteredProducts.map(p => p.Id)))
      setSelectAll(true)
    }
  }
  
  function handleSelectProduct(productId) {
    const newSelected = new Set(selectedProducts)
    if (newSelected.has(productId)) {
      newSelected.delete(productId)
    } else {
      newSelected.add(productId)
    }
    setSelectedProducts(newSelected)
    setSelectAll(false)
  }
  
  // Bulk operations with validation
  async function handleBulkDelete() {
    if (selectedProducts.size === 0) return
    
    try {
      setBulkActionLoading(true)
      const productIds = Array.from(selectedProducts)
      
      // Validate that products can be deleted
      const deleteValidation = await Promise.all(
        productIds.map(async (id) => {
          const product = products.find(p => p.Id === id)
          if (!product) return { id, valid: false, error: 'Product not found' }
          
          // Add business logic validation for deletion
          if (product.status === 'published' && product.visibility === 'published') {
            return { id, valid: false, error: 'Cannot delete published products' }
          }
          
          return { id, valid: true }
        })
      )
      
      const invalidDeletes = deleteValidation.filter(v => !v.valid)
      if (invalidDeletes.length > 0) {
        const errorMsg = `Cannot delete ${invalidDeletes.length} products: ${invalidDeletes.map(v => v.error).join(', ')}`
        showToast(errorMsg, 'error')
        return
      }
      
      await ProductService.bulkDelete(productIds)
      
      setSelectedProducts(new Set())
      setSelectAll(false)
      await loadData()
      
      showToast(`Successfully deleted ${productIds.length} products`, 'success')
    } catch (error) {
      console.error('Bulk delete error:', error)
      showToast(`Error deleting products: ${error.message}`, 'error')
    } finally {
      setBulkActionLoading(false)
    }
  }
  
  async function handleBulkApprove() {
    if (selectedProducts.size === 0) return
    
    try {
      setBulkActionLoading(true)
      const productIds = Array.from(selectedProducts)
      
      // Prepare bulk update data with validation
      const updates = await Promise.all(
        productIds.map(async (id) => {
          const product = products.find(p => p.Id === id)
          if (!product) throw new Error(`Product ${id} not found`)
          
          // Validate product before approval
          const validation = await validateProductChanges(product)
          if (!validation.isValid) {
            throw new Error(`Product ${id} validation failed: ${Object.values(validation.errors).join(', ')}`)
          }
          
          return {
            id,
            data: {
              status: 'approved',
              visibility: 'published',
              modifiedBy: 'admin',
              approvedAt: new Date().toISOString(),
              approvedBy: 'admin'
            }
          }
        })
      )
      
      const result = await ProductService.bulkUpdate(updates)
      
      if (result.errors.length > 0) {
        showToast(`Partial success: ${result.errors.length} products failed to update`, 'warning')
        console.warn('Bulk approve errors:', result.errors)
      } else {
        showToast(`Successfully approved ${result.updatedProducts.length} products`, 'success')
      }
      
      setSelectedProducts(new Set())
      setSelectAll(false)
      await loadData()
    } catch (error) {
      console.error('Bulk approve error:', error)
      showToast(`Error approving products: ${error.message}`, 'error')
    } finally {
      setBulkActionLoading(false)
    }
  }
  
  async function handleBulkEdit() {
    if (selectedProducts.size === 0) return
    
    // For now, show selected count - could expand to batch edit modal
    showToast(`Selected ${selectedProducts.size} products for bulk edit`, 'info')
    // TODO: Implement bulk edit modal
  }
  
  // Individual product actions with validation
  async function handleToggleVisibility(productId) {
    try {
      const product = products.find(p => p.Id === productId)
      if (!product) throw new Error('Product not found')
      
      const newVisibility = product.visibility === 'published' ? 'draft' : 'published'
      
      // Validate product before publishing
      if (newVisibility === 'published') {
        const validation = await validateProductChanges(product)
        if (!validation.isValid) {
          const errorMsg = `Cannot publish product: ${Object.values(validation.errors).join(', ')}`
          showToast(errorMsg, 'error')
          return
        }
      }
      
      const updateData = {
        visibility: newVisibility,
        modifiedBy: 'admin'
      }
      
      // Auto-approve when publishing
      if (newVisibility === 'published' && product.status !== 'approved') {
        updateData.status = 'approved'
        updateData.approvedAt = new Date().toISOString()
        updateData.approvedBy = 'admin'
      }
      
      // Clear publication fields when drafting
      if (newVisibility === 'draft') {
        updateData.publishedAt = null
        updateData.publishedBy = null
      }
      
      await ProductService.update(productId, updateData)
      await loadData()
      
      const action = newVisibility === 'published' ? 'published' : 'drafted'
      showToast(`Product ${action} successfully`, 'success')
    } catch (error) {
      console.error('Toggle visibility error:', error)
      showToast(`Error updating product: ${error.message}`, 'error')
    }
  }
  
  async function handleToggleFeatured(productId) {
    try {
      const product = products.find(p => p.Id === productId)
      if (!product) throw new Error('Product not found')
      
      await ProductService.update(productId, {
        featured: !product.featured,
        modifiedBy: 'admin'
      })
      
      await loadData()
      showToast(`Product ${product.featured ? 'unfeatured' : 'featured'} successfully`, 'success')
    } catch (error) {
      console.error('Toggle featured error:', error)
      showToast(`Error updating product: ${error.message}`, 'error')
    }
  }
  
  // Navigation handlers
  function handleEdit(productId) {
    navigate(`/admin/products/edit/${productId}`)
  }
  
  function handleViewProduct(productId) {
    navigate(`/product/${productId}`)
  }
  
  // Delete confirmation handlers
  function handleDeleteClick(product) {
    setDeleteConfirm({ show: true, product })
  }
  
  async function handleDeleteConfirm() {
    try {
      const { product } = deleteConfirm
      
      // Validate deletion
      if (product.status === 'published' && product.visibility === 'published') {
        showToast('Cannot delete published products. Please draft it first.', 'error')
        return
      }
      
      await ProductService.delete(product.Id)
      await loadData()
      
      showToast('Product deleted successfully', 'success')
    } catch (error) {
      console.error('Delete error:', error)
      showToast(`Error deleting product: ${error.message}`, 'error')
    } finally {
      setDeleteConfirm({ show: false, product: null })
    }
  }
  
  function handleDeleteCancel() {
    setDeleteConfirm({ show: false, product: null })
  }
  
// Filter and search functions
  function getFilteredProducts() {
    return products.filter(product => {
      const matchesSearch = !searchTerm || 
        product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCategory = !selectedCategory || product.category === selectedCategory
      
      const matchesStatus = !statusFilter || product.status === statusFilter
      
      return matchesSearch && matchesCategory && matchesStatus
    })
  }
  function getSortedProducts(filteredProducts) {
    return [...filteredProducts].sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]
      
      // Handle different data types
      if (sortBy === 'price' || sortBy === 'sellingPrice') {
        aValue = parseFloat(aValue) || 0
        bValue = parseFloat(bValue) || 0
      } else if (sortBy === 'lastModified' || sortBy === 'createdAt') {
        aValue = new Date(aValue)
        bValue = new Date(bValue)
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })
  }
  
function clearAllFilters() {
    setSearchTerm('')
    setSelectedCategory('')
    setStatusFilter('')
    setSortBy('lastModified')
    setSortOrder('desc')
    setCurrentPage(1)
  }
  
  // Get paginated products
  const filteredProducts = getFilteredProducts()
  const sortedProducts = getSortedProducts(filteredProducts)
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage)
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )
  
  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Loading />
      </div>
    )
  }
  
  // Render error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ErrorComponent 
          message={error}
          onRetry={loadData}
          showRetry={true}
        />
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Manage Products</h1>
              <Badge variant="secondary" className="text-xs">
                {products.length} Total
              </Badge>
              {connected && (
                <Badge variant="success" className="text-xs">
                  <div className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <span>Live</span>
                  </div>
                </Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => navigate('/admin/products/add')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <ApperIcon name="Plus" className="w-4 h-4 mr-2" />
                Add Product
              </Button>
              
              <Button
                variant="outline"
                onClick={loadData}
                disabled={loading}
                className="border-gray-300"
              >
                <ApperIcon name="RefreshCw" className={cn("w-4 h-4", loading && "animate-spin")} />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Validation Errors Display */}
      {Object.keys(validationErrors).length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <ApperIcon name="AlertTriangle" className="w-5 h-5 text-red-400 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Validation Errors</h3>
<ul className="text-sm text-red-600 bg-red-50 p-3 rounded">
                {Object.entries(validationErrors).map(([field, error]) => (
                  <li key={field}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      
{/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          {/* Search Input */}
          <div className="mb-4">
            <Input
              type="text"
              placeholder="Search products by name, description, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
              icon="Search"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
<option value="">All Categories</option>
                {categories.map((category, index) => (
                  <option 
                    key={category.id || category.name || `category-${index}`} 
                    value={category.name}
                  >
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <div className="flex space-x-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="lastModified">Last Modified</option>
                  <option value="createdAt">Created</option>
                  <option value="title">Name</option>
                  <option value="price">Price</option>
                  <option value="stockQuantity">Stock</option>
                </select>
                <Button
                  variant="outline"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3"
                >
                  <ApperIcon name={sortOrder === 'asc' ? 'ArrowUp' : 'ArrowDown'} className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {(searchTerm || selectedCategory || statusFilter) && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {filteredProducts.length} of {products.length} products
              </p>
              <Button
                variant="ghost"
                onClick={clearAllFilters}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>
        
        {/* Bulk Actions */}
        {selectedProducts.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-blue-800">
                  {selectedProducts.size} product{selectedProducts.size !== 1 ? 's' : ''} selected
                </span>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedProducts(new Set())}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Clear selection
                </Button>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button
                  onClick={handleBulkApprove}
                  disabled={bulkActionLoading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {bulkActionLoading ? (
                    <ApperIcon name="Loader2" className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <ApperIcon name="Check" className="w-4 h-4 mr-2" />
                  )}
                  Approve & Publish
                </Button>
                
                <Button
                  onClick={handleBulkEdit}
                  variant="outline"
                  disabled={bulkActionLoading}
                >
                  <ApperIcon name="Edit2" className="w-4 h-4 mr-2" />
                  Bulk Edit
                </Button>
                
                <Button
                  onClick={handleBulkDelete}
                  disabled={bulkActionLoading}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {bulkActionLoading ? (
                    <ApperIcon name="Loader2" className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <ApperIcon name="Trash2" className="w-4 h-4 mr-2" />
                  )}
                  Delete Selected
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* View Mode Toggle */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="selectAll"
                checked={selectAll}
                onChange={handleSelectAll}
                className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label htmlFor="selectAll" className="text-sm font-medium text-gray-700">
                Select All
              </label>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              onClick={() => setViewMode('grid')}
              className="px-3 py-2"
            >
              <ApperIcon name="Grid3X3" className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              onClick={() => setViewMode('list')}
              className="px-3 py-2"
            >
              <ApperIcon name="List" className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Products Grid/List */}
        {paginatedProducts.length === 0 ? (
          <Empty
            title="No products found"
            description={searchTerm || selectedCategory || statusFilter ? 
              "No products match your current filters. Try adjusting your search criteria." :
              "No products have been added yet. Create your first product to get started."
            }
            action={
              <Button
                onClick={() => navigate('/admin/products/add')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <ApperIcon name="Plus" className="w-4 h-4 mr-2" />
                Add First Product
              </Button>
            }
          />
        ) : (
          <div className={cn(
            "grid gap-6",
            viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'
          )}>
            <AnimatePresence>
              {paginatedProducts.map((product) => (
                <motion.div
                  key={product.Id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <ProductManagementCard
                    product={product}
                    viewMode={viewMode}
                    selected={selectedProducts.has(product.Id)}
                    onSelect={() => handleSelectProduct(product.Id)}
                    onEdit={() => handleEdit(product.Id)}
                    onView={() => handleViewProduct(product.Id)}
                    onDelete={() => handleDeleteClick(product)}
                    onToggleVisibility={() => handleToggleVisibility(product.Id)}
                    onToggleFeatured={() => handleToggleFeatured(product.Id)}
                    validationErrors={validationErrors}
                    isValidating={isValidating}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-8">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Items per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value={6}>6</option>
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ApperIcon name="ChevronLeft" className="w-4 h-4" />
                Previous
              </Button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'default' : 'ghost'}
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-10 h-10 p-0"
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>
              
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ApperIcon name="ChevronRight" className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="text-sm text-gray-600">
              Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, sortedProducts.length)} of {sortedProducts.length}
            </div>
          </div>
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-lg p-6 max-w-md w-full"
            >
              <div className="flex items-center mb-4">
                <ApperIcon name="AlertTriangle" className="w-6 h-6 text-red-500 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Confirm Deletion</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{deleteConfirm.product?.title}"? This action cannot be undone.
              </p>
              
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={handleDeleteCancel}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteConfirm}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete Product
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ManageProducts