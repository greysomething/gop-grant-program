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
  CreditCard,
  Search,
  Download,
  MoreHorizontal,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Trash2
} from 'lucide-react';

const PLAN_TYPE_CONFIG = {
  single_cycle: { label: 'Single Cycle', color: 'bg-blue-100 text-blue-800' },
  four_cycle_pass: { label: 'Four-Cycle Pass', color: 'bg-purple-100 text-purple-800' },
  pass_redemption: { label: 'Pass Redemption', color: 'bg-green-100 text-green-800' },
  gift_single_cycle: { label: 'Gift Single Cycle', color: 'bg-pink-100 text-pink-800' },
  gift_four_cycle_pass: { label: 'Gift Four-Cycle Pass', color: 'bg-rose-100 text-rose-800' }
};

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-800', icon: RefreshCw },
  succeeded: { label: 'Succeeded', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-800', icon: XCircle },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800', icon: XCircle },
  refunded: { label: 'Refunded', color: 'bg-orange-100 text-orange-800', icon: AlertCircle }
};

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planTypeFilter, setPlanTypeFilter] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPaymentIds, setSelectedPaymentIds] = useState([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null);

  useEffect(() => {
    initialize();
  }, []);

  const filterPayments = useCallback(() => {
    let filtered = payments;

    if (searchTerm) {
      filtered = filtered.filter(payment =>
        payment.user_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.application_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.charge_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter);
    }

    if (planTypeFilter !== 'all') {
      filtered = filtered.filter(payment => payment.plan_type === planTypeFilter);
    }

    setFilteredPayments(filtered);
  }, [payments, searchTerm, statusFilter, planTypeFilter]);

  useEffect(() => {
    filterPayments();
  }, [filterPayments]);

  const initialize = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      if (user?.role !== 'admin') {
        window.location.href = createPageUrl("Home");
        return;
      }

      const allPayments = await base44.entities.Payment.list('-created_date');
      setPayments(allPayments);
    } catch (error) {
      console.error('Failed to load payments:', error);
    }
    setIsLoading(false);
  };

  const viewPaymentDetails = (payment) => {
    setSelectedPayment(payment);
    setShowPaymentDialog(true);
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedPaymentIds(filteredPayments.map(p => p.id));
    } else {
      setSelectedPaymentIds([]);
    }
  };

  const handleSelectPayment = (paymentId, checked) => {
    if (checked) {
      setSelectedPaymentIds([...selectedPaymentIds, paymentId]);
    } else {
      setSelectedPaymentIds(selectedPaymentIds.filter(id => id !== paymentId));
    }
  };

  const handleDeleteClick = (payment) => {
    setPaymentToDelete(payment);
    setShowDeleteDialog(true);
  };

  const handleBulkDeleteClick = () => {
    if (selectedPaymentIds.length === 0) return;
    setPaymentToDelete(null);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    try {
      if (paymentToDelete) {
        // Delete single payment
        await base44.entities.Payment.delete(paymentToDelete.id);
        setPayments(payments.filter(p => p.id !== paymentToDelete.id));
      } else {
        // Delete multiple payments
        await Promise.all(
          selectedPaymentIds.map(id => base44.entities.Payment.delete(id))
        );
        setPayments(payments.filter(p => !selectedPaymentIds.includes(p.id)));
        setSelectedPaymentIds([]);
      }
      setShowDeleteDialog(false);
      setPaymentToDelete(null);
    } catch (error) {
      console.error('Failed to delete payment(s):', error);
      alert('Failed to delete payment(s). Please try again.');
    }
  };

  const exportPayments = () => {
    const csvContent = [
      ['Payment ID', 'User ID', 'Application ID', 'Amount', 'Currency', 'Plan Type', 'Status', 'Provider', 'Charge ID', 'Created Date'].join(','),
      ...filteredPayments.map(payment => [
        payment.id || '',
        payment.user_id || '',
        payment.application_id || '',
        payment.amount || '',
        payment.currency || 'usd',
        payment.plan_type || '',
        payment.status || '',
        payment.provider || '',
        payment.charge_id || '',
        new Date(payment.created_date).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  const formatAmount = (amount, currency = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getTotalRevenue = () => {
    return filteredPayments
      .filter(p => p.status === 'succeeded')
      .reduce((total, p) => total + (p.amount || 0), 0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payments...</p>
        </div>
      </div>
    );
  }

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
              <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
              <p className="text-gray-600">Monitor, reconcile, and manage all payment transactions</p>
            </div>
          </div>
        </div>

        {/* Revenue Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Payments</p>
                  <p className="text-2xl font-bold text-gray-900">{filteredPayments.length}</p>
                </div>
                <CreditCard className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Successful</p>
                  <p className="text-2xl font-bold text-green-600">
                    {filteredPayments.filter(p => p.status === 'succeeded').length}
                  </p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Failed</p>
                  <p className="text-2xl font-bold text-red-600">
                    {filteredPayments.filter(p => p.status === 'failed').length}
                  </p>
                </div>
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatAmount(getTotalRevenue())}</p>
                </div>
                <CreditCard className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-green-600" />
                Payments ({filteredPayments.length})
              </div>
              <div className="flex gap-2">
                {selectedPaymentIds.length > 0 && (
                  <Button 
                    onClick={handleBulkDeleteClick} 
                    variant="destructive" 
                    size="sm"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Selected ({selectedPaymentIds.length})
                  </Button>
                )}
                <Button onClick={exportPayments} variant="outline" size="sm">
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
                  placeholder="Search by payment ID, user ID, or charge ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={planTypeFilter} onValueChange={setPlanTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Plan Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  {Object.entries(PLAN_TYPE_CONFIG).map(([key, config]) => (
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
                        checked={selectedPaymentIds.length === filteredPayments.length && filteredPayments.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Plan Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => {
                    const planConfig = PLAN_TYPE_CONFIG[payment.plan_type] || PLAN_TYPE_CONFIG['single_cycle'];
                    const statusConfig = STATUS_CONFIG[payment.status] || STATUS_CONFIG['pending'];
                    const StatusIcon = statusConfig.icon;

                    return (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedPaymentIds.includes(payment.id)}
                            onCheckedChange={(checked) => handleSelectPayment(payment.id, checked)}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">#{payment.id.slice(-8)}</div>
                            {payment.charge_id && (
                              <div className="text-sm text-gray-500">Charge: {payment.charge_id.slice(-8)}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{payment.user_id.slice(-8)}</div>
                            {payment.application_id && (
                              <div className="text-sm text-gray-500">App: {payment.application_id.slice(-8)}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {formatAmount(payment.amount, payment.currency)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={planConfig.color}>
                            {planConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600">
                            {new Date(payment.created_date).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => viewPaymentDetails(payment)}>
                                View Details
                              </DropdownMenuItem>
                              {payment.receipt_url && (
                                <DropdownMenuItem
                                  onClick={() => window.open(payment.receipt_url, '_blank')}
                                >
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  View Receipt
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(payment)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Payment
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

        {/* Payment Details Dialog */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Payment Details</DialogTitle>
              <DialogDescription>
                Complete information for payment #{selectedPayment?.id.slice(-8)}
              </DialogDescription>
            </DialogHeader>
            {selectedPayment && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Payment ID</Label>
                    <p className="text-sm">{selectedPayment.id}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">User ID</Label>
                    <p className="text-sm">{selectedPayment.user_id}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Application ID</Label>
                    <p className="text-sm">{selectedPayment.application_id || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Amount</Label>
                    <p className="text-sm font-medium">{formatAmount(selectedPayment.amount, selectedPayment.currency)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Plan Type</Label>
                    <Badge className={PLAN_TYPE_CONFIG[selectedPayment.plan_type]?.color || 'bg-gray-100 text-gray-800'}>
                      {PLAN_TYPE_CONFIG[selectedPayment.plan_type]?.label || selectedPayment.plan_type}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Status</Label>
                    <Badge className={STATUS_CONFIG[selectedPayment.status]?.color || 'bg-gray-100 text-gray-800'}>
                      {STATUS_CONFIG[selectedPayment.status]?.label || selectedPayment.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Provider</Label>
                    <p className="text-sm">{selectedPayment.provider || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Charge ID</Label>
                    <p className="text-sm">{selectedPayment.charge_id || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Created</Label>
                    <p className="text-sm">{new Date(selectedPayment.created_date).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Updated</Label>
                    <p className="text-sm">{new Date(selectedPayment.updated_date).toLocaleString()}</p>
                  </div>
                </div>
                {selectedPayment.receipt_url && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Receipt</Label>
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(selectedPayment.receipt_url, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Receipt
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                {paymentToDelete ? (
                  <>
                    This will permanently delete payment <strong>#{paymentToDelete.id.slice(-8)}</strong>.
                    This action cannot be undone.
                  </>
                ) : (
                  <>
                    This will permanently delete <strong>{selectedPaymentIds.length}</strong> selected payment(s).
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