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
import { cn } from '@/utils/cn';

const UserManagement = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modal states
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'moderator',
    permissions: {
      canDelete: false,
      canBulkEdit: false,
      canPublish: true,
      canApprove: true
    }
  });

  const [currentUser] = useState({
    role: 'admin',
    permissions: { canManageUsers: true }
  });

  // Mock user data
  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        const mockUsers = [
          {
            Id: 1,
            name: 'Admin User',
            email: 'admin@bazaarpk.com',
            role: 'admin',
            status: 'active',
            lastLogin: '2024-01-15T10:30:00Z',
            permissions: {
              canDelete: true,
              canBulkEdit: true,
              canPublish: true,
              canApprove: true,
              canManageUsers: true,
              canViewReports: true
            }
          },
          {
            Id: 2,
            name: 'Product Moderator',
            email: 'moderator@bazaarpk.com',
            role: 'moderator',
            status: 'active',
            lastLogin: '2024-01-14T15:45:00Z',
            permissions: {
              canDelete: false,
              canBulkEdit: true,
              canPublish: true,
              canApprove: true,
              canManageUsers: false,
              canViewReports: false
            }
          },
          {
            Id: 3,
            name: 'Content Manager',
            email: 'content@bazaarpk.com',
            role: 'moderator',
            status: 'inactive',
            lastLogin: '2024-01-10T09:15:00Z',
            permissions: {
              canDelete: false,
              canBulkEdit: false,
              canPublish: true,
              canApprove: false,
              canManageUsers: false,
              canViewReports: false
            }
          }
        ];
        setUsers(mockUsers);
        setFilteredUsers(mockUsers);
      } catch (error) {
        console.error('Error loading users:', error);
        showToast('Failed to load users', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [showToast]);

  // Filter users
  useEffect(() => {
    let filtered = [...users];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    setFilteredUsers(filtered);
  }, [users, searchQuery, roleFilter, statusFilter]);

  const handleAddUser = async () => {
    try {
      setActionLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newUserData = {
        Id: Math.max(...users.map(u => u.Id)) + 1,
        ...newUser,
        status: 'active',
        lastLogin: null
      };

      setUsers(prev => [...prev, newUserData]);
      setNewUser({
        name: '',
        email: '',
        role: 'moderator',
        permissions: {
          canDelete: false,
          canBulkEdit: false,
          canPublish: true,
          canApprove: true
        }
      });
      setShowAddUserModal(false);
      showToast('User added successfully', 'success');
    } catch (error) {
      console.error('Error adding user:', error);
      showToast('Failed to add user', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    try {
      setActionLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUsers(prev => prev.map(user =>
        user.Id === selectedUser.Id ? { ...selectedUser } : user
      ));
      
      setShowEditUserModal(false);
      setSelectedUser(null);
      showToast('User updated successfully', 'success');
    } catch (error) {
      console.error('Error updating user:', error);
      showToast('Failed to update user', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      setActionLoading(true);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setUsers(prev => prev.map(user =>
        user.Id === userId 
          ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' }
          : user
      ));
      
      showToast('User status updated successfully', 'success');
    } catch (error) {
      console.error('Error updating user status:', error);
      showToast('Failed to update user status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-display font-bold text-gray-900">
              User Management
            </h2>
            <p className="text-gray-600">
              Manage admin users and moderators
            </p>
          </div>
          
          {currentUser.permissions.canManageUsers && (
            <Button 
              onClick={() => setShowAddUserModal(true)}
              className="w-full sm:w-auto"
            >
              <ApperIcon name="UserPlus" className="w-4 h-4 mr-2" />
              Add New User
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
          
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="moderator">Moderator</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery('');
              setRoleFilter('all');
              setStatusFilter('all');
            }}
          >
            <ApperIcon name="RotateCcw" className="w-4 h-4 mr-2" />
            Clear Filters
          </Button>
        </div>
      </Card>

      {/* Users List */}
      {filteredUsers.length === 0 ? (
        <Empty
          title="No users found"
          message="No users match your current filters"
        />
      ) : (
        <div className="grid gap-4">
          <AnimatePresence>
            {filteredUsers.map((user) => (
              <motion.div
                key={user.Id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
<Card className="p-6 word-spacing-relaxed">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                        <ApperIcon name="User" className="w-6 h-6 text-primary-600" />
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-gray-900">{user.name}</h3>
                        <p className="text-gray-600 text-sm">{user.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge 
                            variant={user.role === 'admin' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {user.role.toUpperCase()}
                          </Badge>
                          <Badge 
                            variant={user.status === 'active' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {user.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowEditUserModal(true);
                        }}
                      >
                        <ApperIcon name="Edit3" className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(user.Id)}
                        disabled={actionLoading}
                      >
                        <ApperIcon 
                          name={user.status === 'active' ? 'UserX' : 'UserCheck'} 
                          className="w-4 h-4" 
                        />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Add New User</h3>
              
              <div className="space-y-4">
                <Input
                  placeholder="Full Name"
                  value={newUser.name}
                  onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                />
                
                <Input
                  placeholder="Email Address"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                />
                
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="ghost"
                  onClick={() => setShowAddUserModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddUser}
                  disabled={actionLoading || !newUser.name || !newUser.email}
                >
                  {actionLoading ? 'Adding...' : 'Add User'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default UserManagement;