import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/useToast';
import ApperIcon from '@/components/ApperIcon';
import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import Loading from '@/components/ui/Loading';
import { formatPrice } from '@/utils/currency';
import { cn } from '@/utils/cn';

const ReportsAnalytics = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [analytics, setAnalytics] = useState(null);

  const [currentUser] = useState({
    role: 'admin',
    permissions: { canViewReports: true }
  });

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockAnalytics = {
          summary: {
            totalRevenue: 2850000,
            totalOrders: 1247,
            totalProducts: 49,
            totalCustomers: 892,
            revenueGrowth: 12.5,
            ordersGrowth: 8.2,
            productsGrowth: 15.3,
            customersGrowth: 22.1
          },
          topProducts: [
            { id: 1, name: 'Apple iPhone 15 Pro', sales: 45, revenue: 485000 * 45 },
            { id: 2, name: 'Samsung Galaxy S24', sales: 32, revenue: 285000 * 32 },
            { id: 3, name: 'Dell XPS 13 Laptop', sales: 28, revenue: 285000 * 28 },
            { id: 4, name: 'Samsung 65" 4K Smart TV', sales: 24, revenue: 165000 * 24 },
            { id: 5, name: 'Fresh Halal Mutton', sales: 156, revenue: 2200 * 156 }
          ],
          topCategories: [
            { category: 'Electronics', sales: 234, revenue: 15650000 },
            { category: 'Mobile', sales: 89, revenue: 12340000 },
            { category: 'Computer', sales: 45, revenue: 8950000 },
            { category: 'Meat', sales: 345, revenue: 2890000 },
            { category: 'Vegetables', sales: 567, revenue: 1234000 }
          ],
          recentActivity: [
            { type: 'order', message: 'New order #ORD-2024-1005 received', time: '2 minutes ago' },
            { type: 'product', message: 'Product "Organic Honey" published', time: '15 minutes ago' },
            { type: 'user', message: 'New customer registration', time: '1 hour ago' },
            { type: 'order', message: 'Order #ORD-2024-1004 delivered', time: '2 hours ago' },
            { type: 'product', message: 'Stock alert: iPhone 15 Pro running low', time: '3 hours ago' }
          ],
          salesChart: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
            data: [1200000, 1350000, 1180000, 1650000, 2100000, 2350000, 2850000]
          }
        };

        setAnalytics(mockAnalytics);
      } catch (error) {
        console.error('Error loading analytics:', error);
        showToast('Failed to load analytics data', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [selectedPeriod, showToast]);

  const exportReport = () => {
    showToast('Report exported successfully', 'success');
  };

  if (loading) return <Loading />;
  if (!analytics) return null;

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-display font-bold text-gray-900">
              Reports & Analytics
            </h2>
            <p className="text-gray-600">
              Business insights and performance metrics
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
            </select>
            
            <Button onClick={exportReport}>
              <ApperIcon name="Download" className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPrice(analytics.summary.totalRevenue)}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  <ApperIcon name="TrendingUp" className="w-4 h-4 inline mr-1" />
                  +{analytics.summary.revenueGrowth}%
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <ApperIcon name="DollarSign" className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.summary.totalOrders.toLocaleString()}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  <ApperIcon name="TrendingUp" className="w-4 h-4 inline mr-1" />
                  +{analytics.summary.ordersGrowth}%
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <ApperIcon name="ShoppingCart" className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.summary.totalProducts}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  <ApperIcon name="TrendingUp" className="w-4 h-4 inline mr-1" />
                  +{analytics.summary.productsGrowth}%
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <ApperIcon name="Package" className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.summary.totalCustomers.toLocaleString()}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  <ApperIcon name="TrendingUp" className="w-4 h-4 inline mr-1" />
                  +{analytics.summary.customersGrowth}%
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <ApperIcon name="Users" className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Charts and Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Top Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h3>
            <div className="space-y-4">
              {analytics.topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold",
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-orange-500' : 'bg-gray-300'
                    )}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.sales} sales</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatPrice(product.revenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Top Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Categories</h3>
            <div className="space-y-4">
              {analytics.topCategories.map((category, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">{category.category}</span>
                    <span className="font-semibold text-primary-600">
                      {formatPrice(category.revenue)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>{category.sales} sales</span>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full"
                        style={{ 
                          width: `${Math.min((category.revenue / analytics.topCategories[0].revenue) * 100, 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <Button variant="ghost" size="sm">
              <ApperIcon name="RefreshCw" className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
          <div className="space-y-4">
            {analytics.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  activity.type === 'order' ? 'bg-green-100' :
                  activity.type === 'product' ? 'bg-blue-100' :
                  activity.type === 'user' ? 'bg-purple-100' : 'bg-gray-100'
                )}>
                  <ApperIcon 
                    name={
                      activity.type === 'order' ? 'ShoppingCart' :
                      activity.type === 'product' ? 'Package' :
                      activity.type === 'user' ? 'User' : 'Bell'
                    }
                    className={cn(
                      "w-4 h-4",
                      activity.type === 'order' ? 'text-green-600' :
                      activity.type === 'product' ? 'text-blue-600' :
                      activity.type === 'user' ? 'text-purple-600' : 'text-gray-600'
                    )}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default ReportsAnalytics;