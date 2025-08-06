import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/useToast';
import ApperIcon from '@/components/ApperIcon';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import Badge from '@/components/atoms/Badge';
import Card from '@/components/atoms/Card';
import Loading from '@/components/ui/Loading';
import Empty from '@/components/ui/Empty';
import { formatPrice } from '@/utils/currency';
import { cn } from '@/utils/cn';

const OrderManagement = () => {
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  
  // Order details modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  const [currentUser] = useState({
    role: 'admin',
    permissions: { 
      canManageOrders: true,
      canProcessRefunds: true
    }
  });

  // Mock orders data
  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        const mockOrders = [
          {
            Id: 1001,
            orderNumber: 'ORD-2024-1001',
            customer: {
              name: 'Ahmed Khan',
              email: 'ahmed@gmail.com',
              phone: '+92-300-1234567',
              address: 'House 123, Block A, DHA Phase 5, Lahore'
            },
            items: [
              { productId: 1, title: 'Fresh Organic Tomatoes', quantity: 2, price: 120 },
              { productId: 2, title: 'Premium Basmati Rice', quantity: 1, price: 850 }
            ],
            total: 1090,
            status: 'pending',
            paymentStatus: 'paid',
            paymentMethod: 'card',
            orderDate: '2024-01-15T10:30:00Z',
            notes: 'Please deliver before evening'
          },
          {
            Id: 1002,
            orderNumber: 'ORD-2024-1002',
            customer: {
              name: 'Fatima Ali',
              email: 'fatima@yahoo.com',
              phone: '+92-301-9876543',
              address: '456 Mall Road, Model Town, Karachi'
            },
            items: [
              { productId: 5, title: 'Apple iPhone 15 Pro', quantity: 1, price: 485000 }
            ],
            total: 485000,
            status: 'processing',
            paymentStatus: 'paid',
            paymentMethod: 'bank_transfer',
            orderDate: '2024-01-14T15:45:00Z',
            notes: 'Cash on delivery preferred'
          },
          {
            Id: 1003,
            orderNumber: 'ORD-2024-1003',
            customer: {
              name: 'Muhammad Hassan',
              email: 'hassan@hotmail.com',
              phone: '+92-302-5555444',
              address: '789 University Road, Gulshan, Karachi'
            },
            items: [
              { productId: 4, title: 'Fresh Halal Mutton', quantity: 2, price: 2200 },
              { productId: 3, title: 'Pure Desi Ghee', quantity: 1, price: 2500 }
            ],
            total: 6900,
            status: 'shipped',
            paymentStatus: 'paid',
            paymentMethod: 'cod',
            orderDate: '2024-01-13T09:15:00Z',
            trackingNumber: 'TCS123456789'
          },
          {
            Id: 1004,
            orderNumber: 'ORD-2024-1004',
            customer: {
              name: 'Aisha Mahmood',
              email: 'aisha@gmail.com',
              phone: '+92-333-7777888',
              address: 'Flat 45, Sector 15, Islamabad'
            },
            items: [
              { productId: 6, title: 'Samsung 65" 4K Smart TV', quantity: 1, price: 165000 }
            ],
            total: 165000,
            status: 'delivered',
            paymentStatus: 'paid',
            paymentMethod: 'card',
            orderDate: '2024-01-10T12:00:00Z',
            deliveryDate: '2024-01-12T16:30:00Z'
          }
        ];
        setOrders(mockOrders);
        setFilteredOrders(mockOrders);
      } catch (error) {
        console.error('Error loading orders:', error);
        showToast('Failed to load orders', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [showToast]);

  // Filter orders
  useEffect(() => {
    let filtered = [...orders];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(query) ||
        order.customer.name.toLowerCase().includes(query) ||
        order.customer.email.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  }, [orders, searchQuery, statusFilter, dateFilter]);

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      setActionLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setOrders(prev => prev.map(order =>
        order.Id === orderId ? { ...order, status: newStatus } : order
      ));
      
      showToast(`Order status updated to ${newStatus}`, 'success');
    } catch (error) {
      console.error('Error updating order status:', error);
      showToast('Failed to update order status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-display font-bold text-gray-900">
              Order Management
            </h2>
            <p className="text-gray-600">
              Track and manage customer orders
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline">
              <ApperIcon name="Download" className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-2xl font-bold text-gray-900">{orders.length}</div>
          <div className="text-sm text-gray-600">Total Orders</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-yellow-600">
            {orders.filter(o => o.status === 'pending').length}
          </div>
          <div className="text-sm text-gray-600">Pending</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">
            {orders.filter(o => o.status === 'processing').length}
          </div>
          <div className="text-sm text-gray-600">Processing</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-purple-600">
            {orders.filter(o => o.status === 'shipped').length}
          </div>
          <div className="text-sm text-gray-600">Shipped</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">
            {orders.filter(o => o.status === 'delivered').length}
          </div>
          <div className="text-sm text-gray-600">Delivered</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setDateFilter('all');
            }}
          >
            <ApperIcon name="RotateCcw" className="w-4 h-4 mr-2" />
            Clear Filters
          </Button>
        </div>
      </Card>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Empty
          title="No orders found"
          message="No orders match your current filters"
        />
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredOrders.map((order) => (
              <motion.div
                key={order.Id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {order.orderNumber}
                        </h3>
                        <Badge className={cn('text-xs', getStatusColor(order.status))}>
                          {order.status.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-1">
                        <strong>Customer:</strong> {order.customer.name} ({order.customer.email})
                      </p>
                      <p className="text-gray-600 text-sm mb-1">
                        <strong>Items:</strong> {order.items.length} item(s)
                      </p>
                      <p className="text-gray-600 text-sm">
                        <strong>Total:</strong> <span className="font-semibold text-primary-600">
                          {formatPrice(order.total)}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowOrderModal(true);
                        }}
                      >
                        <ApperIcon name="Eye" className="w-4 h-4" />
                      </Button>
                      
                      {order.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateOrderStatus(order.Id, 'processing')}
                          disabled={actionLoading}
                        >
                          Process
                        </Button>
                      )}
                      
                      {order.status === 'processing' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateOrderStatus(order.Id, 'shipped')}
                          disabled={actionLoading}
                        >
                          Ship
                        </Button>
                      )}
                      
                      {order.status === 'shipped' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateOrderStatus(order.Id, 'delivered')}
                          disabled={actionLoading}
                        >
                          Mark Delivered
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Order Details</h3>
                <Button
                  variant="ghost"
                  onClick={() => setShowOrderModal(false)}
                >
                  <ApperIcon name="X" className="w-5 h-5" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Customer Information */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Customer Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Name:</strong> {selectedOrder.customer.name}</p>
                    <p><strong>Email:</strong> {selectedOrder.customer.email}</p>
                    <p><strong>Phone:</strong> {selectedOrder.customer.phone}</p>
                    <p><strong>Address:</strong> {selectedOrder.customer.address}</p>
                  </div>
                </div>

                {/* Order Information */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Order Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Order Number:</strong> {selectedOrder.orderNumber}</p>
                    <p><strong>Status:</strong> 
                      <Badge className={cn('ml-2 text-xs', getStatusColor(selectedOrder.status))}>
                        {selectedOrder.status.toUpperCase()}
                      </Badge>
                    </p>
                    <p><strong>Payment Status:</strong> {selectedOrder.paymentStatus}</p>
                    <p><strong>Payment Method:</strong> {selectedOrder.paymentMethod}</p>
                    {selectedOrder.trackingNumber && (
                      <p><strong>Tracking:</strong> {selectedOrder.trackingNumber}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Order Items</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Product</th>
                        <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Quantity</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Price</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-4 py-2 text-sm">{item.title}</td>
                          <td className="px-4 py-2 text-sm text-center">{item.quantity}</td>
                          <td className="px-4 py-2 text-sm text-right">{formatPrice(item.price)}</td>
                          <td className="px-4 py-2 text-sm text-right">
                            {formatPrice(item.price * item.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan="3" className="px-4 py-2 text-sm font-semibold text-right">
                          Total:
                        </td>
                        <td className="px-4 py-2 text-sm font-semibold text-right">
                          {formatPrice(selectedOrder.total)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Order Notes */}
              {selectedOrder.notes && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-2">Order Notes</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {selectedOrder.notes}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;