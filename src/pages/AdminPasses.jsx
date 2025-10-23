
import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  ArrowLeft, 
  TrendingUp, 
  Search,
  Download,
  MoreHorizontal,
  Edit,
  Gift,
  ShoppingCart,
  Shield,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  Trash2
} from 'lucide-react';

const SOURCE_CONFIG = {
  purchase: { label: 'Purchase', color: 'bg-blue-100 text-blue-800', icon: ShoppingCart },
  gift: { label: 'Gift', color: 'bg-pink-100 text-pink-800', icon: Gift },
  admin_grant: { label: 'Admin Grant', color: 'bg-purple-100 text-purple-800', icon: Shield }
};

const STATUS_CONFIG = {
  active: { label: 'Active', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  expired: { label: 'Expired', color: 'bg-gray-100 text-gray-800', icon: Clock },
  revoked: { label: 'Revoked', color: 'bg-red-100 text-red-800', icon: XCircle }
};

export default function AdminPasses() {
  const [cyclePasses, setCyclePasses] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredPasses, setFilteredPasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [selectedPass, setSelectedPass] = useState(null);
  const [showPassDialog, setShowPassDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPass, setEditingPass] = useState(null);
  const [selectedPassIds, setSelectedPassIds] = useState([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [passToDelete, setPassToDelete] = useState(null);
  const [formData, setFormData] = useState({
    user_id: '',
    source: 'admin_grant',
    redemptions_remaining: 4,
    valid_from: '',
    expires_at: '',
    status: 'active'
  });
  const [formErrors, setFormErrors] = useState({});

  const usersMap = React.useMemo(() => {
    return users.reduce((map, user) => {
      map[user.id] = user;
      return map;
    }, {});
  }, [users]);

  useEffect(() => {
    initialize();
  }, []);

  const filterPasses = useCallback(() => {
    let filtered = cyclePasses;

    if (searchTerm) {
      filtered = filtered.filter(pass => {
        const user = usersMap[pass.user_id];
        return pass.user_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pass.purchased_payment_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pass.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(pass => pass.status === statusFilter);
    }

    if (sourceFilter !== 'all') {
      filtered = filtered.filter(pass => pass.source === sourceFilter);
    }

    setFilteredPasses(filtered);
  }, [cyclePasses, searchTerm, statusFilter, sourceFilter, usersMap]);

  useEffect(() => {
    filterPasses();
  }, [filterPasses]);

  const initialize = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      if (user?.role !== 'admin') {
        window.location.href = createPageUrl("Home");
        return;
      }

      const [allPasses, allUsers] = await Promise.all([
        base44.entities.CyclePass.list('-created_date'),
        base44.entities.User.list()
      ]);
      
      setCyclePasses(allPasses);
      setUsers(allUsers);
    } catch (error) {
      console.error('Failed to load cycle passes:', error);
    }
    setIsLoading(false);
  };

  const viewPassDetails = (pass) => {
    setSelectedPass(pass);
    setShowPassDialog(true);
  };

  const openEditDialog = (pass) => {
    setEditingPass(pass);
    setFormData({
      user_id: pass.user_id || '',
      source: pass.source || 'admin_grant',
      redemptions_remaining: pass.redemptions_remaining || 0,
      valid_from: pass.valid_from ? new Date(pass.valid_from).toISOString().split('T')[0] : '',
      expires_at: pass.expires_at ? new Date(pass.expires_at).toISOString().split('T')[0] : '',
      status: pass.status || 'active'
    });
    setShowEditDialog(true);
  };

  const openCreateDialog = () => {
    setEditingPass(null);
    setFormData({
      user_id: '',
      source: 'admin_grant',
      redemptions_remaining: 4,
      valid_from: new Date().toISOString().split('T')[0],
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'active'
    });
    setFormErrors({});
    setShowCreateDialog(true);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.user_id.trim()) errors.user_id = 'User ID is required';
    if (formData.redemptions_remaining < 0) errors.redemptions_remaining = 'Redemptions cannot be negative';
    if (!formData.valid_from) errors.valid_from = 'Valid from date is required';
    if (!formData.expires_at) errors.expires_at = 'Expires at date is required';
    
    if (formData.valid_from && formData.expires_at && formData.valid_from >= formData.expires_at) {
      errors.expires_at = 'Expiration date must be after valid from date';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      const saveData = {
        ...formData,
        valid_from: formData.valid_from ? new Date(formData.valid_from).toISOString() : null,
        expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
        redemptions_remaining: parseInt(formData.redemptions_remaining)
      };

      if (editingPass) {
        await base44.entities.CyclePass.update(editingPass.id, saveData);
        setCyclePasses(cyclePasses.map(pass => 
          pass.id === editingPass.id ? { ...pass, ...saveData } : pass
        ));
        setShowEditDialog(false);
      } else {
        const newPass = await base44.entities.CyclePass.create(saveData);
        setCyclePasses([newPass, ...cyclePasses]);
        setShowCreateDialog(false);
      }
      
      setFormErrors({});
    } catch (error) {
      console.error('Failed to save cycle pass:', error);
    }
  };

  const updatePassStatus = async (passId, newStatus) => {
    try {
      await base44.entities.CyclePass.update(passId, { status: newStatus });
      setCyclePasses(cyclePasses.map(pass =>
        pass.id === passId ? { ...pass, status: newStatus } : pass
      ));
    } catch (error) {
      console.error('Failed to update pass status:', error);
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedPassIds(filteredPasses.map(p => p.id));
    } else {
      setSelectedPassIds([]);
    }
  };

  const handleSelectPass = (passId, checked) => {
    if (checked) {
      setSelectedPassIds([...selectedPassIds, passId]);
    } else {
      setSelectedPassIds(selectedPassIds.filter(id => id !== passId));
    }
  };

  const handleDeleteClick = (pass) => {
    setPassToDelete(pass);
    setShowDeleteDialog(true);
  };

  const handleBulkDeleteClick = () => {
    if (selectedPassIds.length === 0) return;
    setPassToDelete(null);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    try {
      if (passToDelete) {
        // Delete single pass
        await base44.entities.CyclePass.delete(passToDelete.id);
        setCyclePasses(cyclePasses.filter(p => p.id !== passToDelete.id));
      } else {
        // Delete multiple passes
        await Promise.all(
          selectedPassIds.map(id => base44.entities.CyclePass.delete(id))
        );
        setCyclePasses(cyclePasses.filter(p => !selectedPassIds.includes(p.id)));
        setSelectedPassIds([]);
      }
      setShowDeleteDialog(false);
      setPassToDelete(null);
    } catch (error) {
      console.error('Failed to delete cycle pass(es):', error);
      alert('Failed to delete cycle pass(es). Please try again.');
    }
  };

  const exportPasses = () => {
    const csvContent = [
      ['Pass ID', 'User ID', 'User Email', 'User Name', 'Payment ID', 'Source', 'Redemptions Remaining', 'Valid From', 'Expires At', 'Status', 'Created Date'].join(','),
      ...filteredPasses.map(pass => {
        const user = usersMap[pass.user_id];
        return [
          pass.id || '',
          pass.user_id || '',
          user?.email || '',
          user?.full_name || '',
          pass.purchased_payment_id || '',
          pass.source || '',
          pass.redemptions_remaining || '',
          pass.valid_from ? new Date(pass.valid_from).toLocaleDateString() : '',
          pass.expires_at ? new Date(pass.expires_at).toLocaleDateString() : '',
          pass.status || '',
          new Date(pass.created_date).toLocaleDateString()
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cycle_passes_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  const getPassStatus = (pass) => {
    if (pass.status === 'revoked') return 'revoked';
    if (pass.expires_at && new Date(pass.expires_at) < new Date()) return 'expired';
    return 'active';
  };

  const getTotalStats = () => {
    return {
      total: filteredPasses.length,
      active: filteredPasses.filter(p => getPassStatus(p) === 'active').length,
      expired: filteredPasses.filter(p => getPassStatus(p) === 'expired').length,
      revoked: filteredPasses.filter(p => p.status === 'revoked').length,
      totalRedemptions: filteredPasses.reduce((sum, p) => sum + (p.redemptions_remaining || 0), 0)
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cycle passes...</p>
        </div>
      </div>
    );
  }

  const stats = getTotalStats();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl("Admin")}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Admin
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Cycle Pass Management</h1>
              <p className="text-gray-600">Manage active cycle passes and view audit logs</p>
            </div>
          </div>
          <Button onClick={openCreateDialog} className="bg-rose-600 hover:bg-rose-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Pass
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Passes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Expired</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.expired}</p>
                </div>
                <Clock className="w-8 h-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Revoked</p>
                  <p className="text-2xl font-bold text-red-600">{stats.revoked}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Redemptions</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.totalRedemptions}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Cycle Passes ({filteredPasses.length})
              </div>
              <div className="flex gap-2">
                {selectedPassIds.length > 0 && (
                  <Button 
                    onClick={handleBulkDeleteClick} 
                    variant="destructive" 
                    size="sm"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Selected ({selectedPassIds.length})
                  </Button>
                )}
                <Button onClick={exportPasses} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by pass ID, user ID, email or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {Object.entries(SOURCE_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedPassIds.length === filteredPasses.length && filteredPasses.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Pass</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Redemptions</TableHead>
                    <TableHead>Valid Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPasses.map((pass) => {
                    const sourceConfig = SOURCE_CONFIG[pass.source] || SOURCE_CONFIG['purchase'];
                    const actualStatus = getPassStatus(pass);
                    const statusConfig = STATUS_CONFIG[actualStatus] || STATUS_CONFIG['active'];
                    const StatusIcon = statusConfig.icon;
                    const SourceIcon = sourceConfig.icon;
                    const user = usersMap[pass.user_id];

                    return (
                      <TableRow key={pass.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedPassIds.includes(pass.id)}
                            onCheckedChange={(checked) => handleSelectPass(pass.id, checked)}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">#{pass.id.slice(-8)}</div>
                            {pass.purchased_payment_id && (
                              <div className="text-sm text-gray-500">Payment: {pass.purchased_payment_id.slice(-8)}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user?.email || 'Unknown'}</div>
                            {user?.full_name && (
                              <div className="text-sm text-gray-500">{user.full_name}</div>
                            )}
                            <div className="text-xs text-gray-400">ID: {pass.user_id.slice(-8)}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={sourceConfig.color}>
                            <SourceIcon className="w-3 h-3 mr-1" />
                            {sourceConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{pass.redemptions_remaining}</div>
                          <div className="text-sm text-gray-500">remaining</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{pass.valid_from ? new Date(pass.valid_from).toLocaleDateString() : 'N/A'}</div>
                            <div className="text-gray-500">to {pass.expires_at ? new Date(pass.expires_at).toLocaleDateString() : 'N/A'}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => viewPassDetails(pass)}>
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditDialog(pass)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Pass
                              </DropdownMenuItem>
                              {pass.status !== 'revoked' && (
                                <DropdownMenuItem 
                                  onClick={() => updatePassStatus(pass.id, 'revoked')}
                                  className="text-orange-600"
                                >
                                  Revoke Pass
                                </DropdownMenuItem>
                              )}
                              {pass.status === 'revoked' && (
                                <DropdownMenuItem 
                                  onClick={() => updatePassStatus(pass.id, 'active')}
                                  className="text-green-600"
                                >
                                  Restore Pass
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(pass)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Pass
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pass Details Dialog */}
        <Dialog open={showPassDialog} onOpenChange={setShowPassDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Cycle Pass Details</DialogTitle>
              <DialogDescription>
                Complete information for pass #{selectedPass?.id.slice(-8)}
              </DialogDescription>
            </DialogHeader>
            {selectedPass && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Pass ID</Label>
                    <p className="text-sm">{selectedPass.id}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">User ID</Label>
                    <p className="text-sm">{selectedPass.user_id}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">User Email</Label>
                    <p className="text-sm">{usersMap[selectedPass.user_id]?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">User Name</Label>
                    <p className="text-sm">{usersMap[selectedPass.user_id]?.full_name || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Payment ID</Label>
                    <p className="text-sm">{selectedPass.purchased_payment_id || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Source</Label>
                    <Badge className={SOURCE_CONFIG[selectedPass.source]?.color || 'bg-gray-100 text-gray-800'}>
                      {SOURCE_CONFIG[selectedPass.source]?.label || selectedPass.source}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Redemptions Remaining</Label>
                    <p className="text-sm font-medium">{selectedPass.redemptions_remaining}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Status</Label>
                    <Badge className={STATUS_CONFIG[getPassStatus(selectedPass)]?.color || 'bg-gray-100 text-gray-800'}>
                      {STATUS_CONFIG[getPassStatus(selectedPass)]?.label || selectedPass.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Valid From</Label>
                    <p className="text-sm">{selectedPass.valid_from ? new Date(selectedPass.valid_from).toLocaleString() : 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Expires At</Label>
                    <p className="text-sm">{selectedPass.expires_at ? new Date(selectedPass.expires_at).toLocaleString() : 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Created</Label>
                    <p className="text-sm">{new Date(selectedPass.created_date).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Updated</Label>
                    <p className="text-sm">{new Date(selectedPass.updated_date).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Pass Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Cycle Pass</DialogTitle>
              <DialogDescription>
                Update the cycle pass details
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_user_id">User ID</Label>
                <Input
                  id="edit_user_id"
                  value={formData.user_id}
                  onChange={(e) => setFormData({...formData, user_id: e.target.value})}
                  className={formErrors.user_id ? 'border-red-500' : ''}
                />
                {formErrors.user_id && <p className="text-sm text-red-500 mt-1">{formErrors.user_id}</p>}
              </div>
              <div>
                <Label htmlFor="edit_source">Source</Label>
                <Select value={formData.source} onValueChange={(value) => setFormData({...formData, source: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SOURCE_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit_redemptions">Redemptions Remaining</Label>
                <Input
                  id="edit_redemptions"
                  type="number"
                  min="0"
                  value={formData.redemptions_remaining}
                  onChange={(e) => setFormData({...formData, redemptions_remaining: parseInt(e.target.value) || 0})}
                  className={formErrors.redemptions_remaining ? 'border-red-500' : ''}
                />
                {formErrors.redemptions_remaining && <p className="text-sm text-red-500 mt-1">{formErrors.redemptions_remaining}</p>}
              </div>
              <div>
                <Label htmlFor="edit_status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit_valid_from">Valid From</Label>
                <Input
                  id="edit_valid_from"
                  type="date"
                  value={formData.valid_from}
                  onChange={(e) => setFormData({...formData, valid_from: e.target.value})}
                  className={formErrors.valid_from ? 'border-red-500' : ''}
                />
                {formErrors.valid_from && <p className="text-sm text-red-500 mt-1">{formErrors.valid_from}</p>}
              </div>
              <div>
                <Label htmlFor="edit_expires_at">Expires At</Label>
                <Input
                  id="edit_expires_at"
                  type="date"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({...formData, expires_at: e.target.value})}
                  className={formErrors.expires_at ? 'border-red-500' : ''}
                />
                {formErrors.expires_at && <p className="text-sm text-red-500 mt-1">{formErrors.expires_at}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Update Pass
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Pass Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Cycle Pass</DialogTitle>
              <DialogDescription>
                Create a new cycle pass for a user
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create_user_id">User ID</Label>
                <Input
                  id="create_user_id"
                  value={formData.user_id}
                  onChange={(e) => setFormData({...formData, user_id: e.target.value})}
                  placeholder="Enter user ID"
                  className={formErrors.user_id ? 'border-red-500' : ''}
                />
                {formErrors.user_id && <p className="text-sm text-red-500 mt-1">{formErrors.user_id}</p>}
              </div>
              <div>
                <Label htmlFor="create_source">Source</Label>
                <Select value={formData.source} onValueChange={(value) => setFormData({...formData, source: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SOURCE_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="create_redemptions">Redemptions Remaining</Label>
                <Input
                  id="create_redemptions"
                  type="number"
                  min="0"
                  value={formData.redemptions_remaining}
                  onChange={(e) => setFormData({...formData, redemptions_remaining: parseInt(e.target.value) || 0})}
                  className={formErrors.redemptions_remaining ? 'border-red-500' : ''}
                />
                {formErrors.redemptions_remaining && <p className="text-sm text-red-500 mt-1">{formErrors.redemptions_remaining}</p>}
              </div>
              <div>
                <Label htmlFor="create_status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="create_valid_from">Valid From</Label>
                <Input
                  id="create_valid_from"
                  type="date"
                  value={formData.valid_from}
                  onChange={(e) => setFormData({...formData, valid_from: e.target.value})}
                  className={formErrors.valid_from ? 'border-red-500' : ''}
                />
                {formErrors.valid_from && <p className="text-sm text-red-500 mt-1">{formErrors.valid_from}</p>}
              </div>
              <div>
                <Label htmlFor="create_expires_at">Expires At</Label>
                <Input
                  id="create_expires_at"
                  type="date"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({...formData, expires_at: e.target.value})}
                  className={formErrors.expires_at ? 'border-red-500' : ''}
                />
                {formErrors.expires_at && <p className="text-sm text-red-500 mt-1">{formErrors.expires_at}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Create Pass
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                {passToDelete ? (
                  <>
                    This will permanently delete cycle pass <strong>#{passToDelete.id.slice(-8)}</strong>.
                    This action cannot be undone.
                  </>
                ) : (
                  <>
                    This will permanently delete <strong>{selectedPassIds.length}</strong> selected cycle pass(es).
                    This action cannot be undone.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
