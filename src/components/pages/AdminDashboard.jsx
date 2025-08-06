import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import ApperIcon from '@/components/ApperIcon';
import Button from '@/components/atoms/Button';
import { cn } from '@/utils/cn';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
const [expandedSections, setExpandedSections] = useState(['products']); // Products expanded by default

  const focusFirstAdminElement = () => {
    // Set keyboard focus on the first interactive admin element
    const firstButton = document.querySelector('.admin-nav button, .admin-sidebar button');
    if (firstButton) {
      firstButton.focus();
    }
  };

  useEffect(() => {
    focusFirstAdminElement();
  }, []);

  const toggleSection = (section) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const isActive = (path) => {
    if (path === '/admin' && location.pathname === '/admin') return true;
    if (path !== '/admin' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const sidebarItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'LayoutDashboard',
      path: '/admin',
      onClick: () => navigate('/admin')
    },
    {
id: 'products',
      label: 'Products',
      icon: 'Package',
      expandable: true,
      children: [
        {
          id: 'categories',
          label: 'Categories',
          icon: 'FolderOpen',
          path: '/admin/categories',
          onClick: () => navigate('/admin/categories')
        },
        {
          id: 'inventory',
          label: 'Inventory',
          icon: 'Package2',
          path: '/admin/inventory',
          onClick: () => navigate('/admin/inventory')
        },
        {
          id: 'manage-products',
          label: 'Manage Products',
          icon: 'List',
          path: '/admin/products/manage',
          onClick: () => navigate('/admin/products/manage')
        },
        {
          id: 'add-product',
          label: 'Add Product',
          icon: 'Plus',
          path: '/admin/products/add',
          onClick: () => navigate('/admin/products/add')
        }
      ]
    },
    {
      id: 'orders',
      label: 'Order Management',
      icon: 'ShoppingCart',
      expandable: true,
      children: [
        {
          id: 'all-orders',
          label: 'All Orders',
          icon: 'List',
          path: '/admin/orders',
          onClick: () => navigate('/admin/orders')
        },
        {
          id: 'pending-orders',
          label: 'Pending Orders',
          icon: 'Clock',
          path: '/admin/orders/pending',
          onClick: () => navigate('/admin/orders?status=pending')
        },
        {
          id: 'returns-refunds',
          label: 'Returns & Refunds',
          icon: 'RotateCcw',
          path: '/admin/orders/returns',
          onClick: () => navigate('/admin/orders/returns')
        }
      ]
    },
    {
      id: 'users',
      label: 'User Management',
      icon: 'Users',
      expandable: true,
      children: [
        {
          id: 'customers',
          label: 'Customers',
          icon: 'User',
          path: '/admin/customers',
          onClick: () => navigate('/admin/customers')
        },
        {
          id: 'admin-users',
          label: 'Admin & Moderators',
          icon: 'Shield',
          path: '/admin/users',
          onClick: () => navigate('/admin/users')
        },
        {
          id: 'roles-permissions',
          label: 'Roles & Permissions',
          icon: 'Lock',
          path: '/admin/roles',
          onClick: () => navigate('/admin/roles')
        }
      ]
    },
    {
      id: 'reports',
      label: 'Reports & Analytics',
      icon: 'BarChart3',
      expandable: true,
      children: [
        {
          id: 'sales-reports',
          label: 'Sales Reports',
          icon: 'TrendingUp',
          path: '/admin/reports',
          onClick: () => navigate('/admin/reports')
        },
        {
          id: 'product-analytics',
          label: 'Product Analytics',
          icon: 'PieChart',
          path: '/admin/reports/products',
          onClick: () => navigate('/admin/reports/products')
        },
        {
          id: 'customer-insights',
          label: 'Customer Insights',
          icon: 'Users',
          path: '/admin/reports/customers',
          onClick: () => navigate('/admin/reports/customers')
        }
      ]
    },
    {
      id: 'marketing',
      label: 'Marketing Tools',
      icon: 'Megaphone',
      path: '/admin/marketing',
      onClick: () => navigate('/admin/marketing')
    },
    {
      id: 'settings',
      label: 'System Settings',
      icon: 'Settings',
      expandable: true,
      children: [
        {
          id: 'general-settings',
          label: 'General Settings',
          icon: 'Settings',
          path: '/admin/settings',
          onClick: () => navigate('/admin/settings')
        },
        {
          id: 'payment-settings',
          label: 'Payment Settings',
          icon: 'CreditCard',
          path: '/admin/settings/payments',
          onClick: () => navigate('/admin/settings/payments')
        },
        {
          id: 'security-audit',
          label: 'Security & Audit',
          icon: 'Shield',
          path: '/admin/settings/security',
          onClick: () => navigate('/admin/settings/security')
        }
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <motion.div 
        className={cn(
          "bg-white shadow-lg border-r border-gray-200 flex flex-col transition-all duration-300",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
        initial={false}
        animate={{ width: sidebarCollapsed ? 64 : 256 }}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div>
                <h2 className="text-xl font-display font-bold text-gray-900">
                  BazaarPK Admin
                </h2>
                <p className="text-sm text-gray-600">Management Dashboard</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2"
            >
              <ApperIcon 
                name={sidebarCollapsed ? "ChevronRight" : "ChevronLeft"} 
                className="w-4 h-4" 
              />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="px-2 space-y-1">
            {sidebarItems.map((item) => (
              <div key={item.id}>
                {/* Main Item */}
<button
                  onClick={item.expandable ? () => toggleSection(item.id) : item.onClick}
                  className={cn(
                    "admin-nav w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    isActive(item.path) 
                      ? "bg-primary-100 text-primary-700 border-r-2 border-primary-500" 
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  )}
                  tabIndex={0}
                >
                  <ApperIcon name={item.icon} className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <>
                      <span className="ml-3 flex-1 text-left">{item.label}</span>
                      {item.expandable && (
                        <ApperIcon 
                          name="ChevronDown" 
                          className={cn(
                            "w-4 h-4 transition-transform",
                            expandedSections.includes(item.id) ? "rotate-180" : ""
                          )}
                        />
                      )}
                    </>
                  )}
                </button>

                {/* Sub Items */}
                {item.expandable && item.children && !sidebarCollapsed && expandedSections.includes(item.id) && (
                  <div className="mt-1 ml-8 space-y-1">
                    {item.children.map((child) => (
                      <button
                        key={child.id}
                        onClick={child.onClick}
                        className={cn(
                          "w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                          isActive(child.path)
                            ? "bg-primary-50 text-primary-600 border-l-2 border-primary-500"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        )}
                      >
                        <ApperIcon name={child.icon} className="w-4 h-4 flex-shrink-0" />
                        <span className="ml-3">{child.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className={cn(
              "w-full justify-start",
              sidebarCollapsed && "justify-center"
            )}
          >
            <ApperIcon name="ArrowLeft" className="w-4 h-4" />
            {!sidebarCollapsed && <span className="ml-3">Back to Store</span>}
          </Button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
<h1 className="text-2xl font-display font-bold text-gray-900">
                {location.pathname === '/admin' ? 'Dashboard Overview' :
                 location.pathname.includes('/categories') ? 'Categories Management' :
                 location.pathname.includes('/inventory') ? 'Inventory Management' :
                 location.pathname.includes('/products/manage') ? 'Manage Products' :
                 location.pathname.includes('/products/add') ? 'Add New Product' :
                 location.pathname.includes('/orders') ? 'Orders Management' :
                 location.pathname.includes('/customers') ? 'Customer Management' :
                 location.pathname.includes('/users') ? 'User Management' :
                 location.pathname.includes('/marketing') ? 'Marketing Tools' :
                 location.pathname.includes('/reports') ? 'Reports & Analytics' :
                 location.pathname.includes('/settings') ? 'System Settings' :
                 'Admin Dashboard'}
              </h1>
              <p className="text-gray-600 mt-1">
                {location.pathname === '/admin' ? 'Welcome to your admin control center' :
                 location.pathname.includes('/products') || location.pathname.includes('/categories') || location.pathname.includes('/inventory') ? 'Manage your product catalog' :
                 'Manage your business operations'}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <ApperIcon name="Bell" className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm">
                <ApperIcon name="User" className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;