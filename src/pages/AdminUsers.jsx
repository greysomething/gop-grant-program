
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Users,
  Search,
  Download,
  MoreHorizontal,
  Mail,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Eye,
  Upload,
  UserPlus,
  Loader2,
  Send,
  XCircle,
  Save
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [pendingImports, setPendingImports] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [isSendingInvitations, setIsSendingInvitations] = useState(false);
  const [invitationResults, setInvitationResults] = useState(null);
  const [selectedPendingIds, setSelectedPendingIds] = useState([]);
  const [showPendingDialog, setShowPendingDialog] = useState(false);
  const [editingPending, setEditingPending] = useState(null);
  const [pendingSearchTerm, setPendingSearchTerm] = useState('');

  const filterUsers = useCallback(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.includes(searchTerm) ||
        user.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.state?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'verified') {
        filtered = filtered.filter(user => user.email_verified);
      } else if (statusFilter === 'unverified') {
        filtered = filtered.filter(user => !user.email_verified);
      }
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter, statusFilter]);

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [filterUsers]);

  const initialize = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      if (user?.role !== 'admin') {
        window.location.href = createPageUrl("Home");
        return;
      }

      const [allUsers, allPendingImports] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.PendingUserImport.list('-created_date')
      ]);
      
      setUsers(allUsers);
      setPendingImports(allPendingImports);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
    setIsLoading(false);
  };

  const exportUsers = () => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'City', 'State', 'Role', 'Email Verified', 'Created Date'].join(','),
      ...filteredUsers.map(user => [
        (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.full_name) || '',
        user.email || '',
        user.phone || '',
        user.city || '',
        user.state || '',
        user.role || '',
        user.email_verified ? 'Yes' : 'No',
        new Date(user.created_date).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setImportFile(file);
      setImportResults(null); // Reset results when a new file is selected
    } else {
      alert('Please select a valid CSV file');
    }
  };

  const handleBulkImport = async () => {
    if (!importFile) {
      alert('Please select a file first');
      return;
    }

    setIsImporting(true);
    setImportResults(null);

    try {
      console.log('Reading file:', importFile.name);
      
      // Read file as text
      const csvText = await importFile.text();
      
      console.log('Invoking bulkImportUsers function...');
      
      // Use SDK invoke with CSV text as string (not FormData)
      const response = await base44.functions.invoke('bulkImportUsers', {
        csvContent: csvText,
        fileName: importFile.name
      });
      
      console.log('Response:', JSON.stringify(response.data, null, 2));
      
      if (response.data?.success) {
        setImportResults(response.data.results);
        await initialize();
        // Don't close the dialog - let user review results and close manually
      } else {
        const errorData = response.data || {};
        console.error('Import failed:', JSON.stringify(errorData, null, 2));
        
        let errorMessage = 'Import failed:\n';
        if (errorData.error) errorMessage += `Error: ${errorData.error}\n`;
        if (errorData.details) errorMessage += `Details: ${errorData.details}\n`;
        if (errorData.headers_found && errorData.headers_found.length > 0) {
          errorMessage += `Headers found: ${errorData.headers_found.join(', ')}\n`;
        }
        
        alert(errorMessage);
        setImportResults({
          total: 0,
          created: 0,
          skipped: 0,
          payments_created: 0,
          passes_created: 0,
          errors: [errorMessage],
          pending_imports_created: 0, // Ensure this is initialized
        });
      }
    } catch (error) {
      console.error('Import exception:', error);
      
      let errorMessage = 'Import failed:\n';
      if (error.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'string') {
          errorMessage += errorData;
        } else {
          if (errorData.error) errorMessage += `Error: ${errorData.error}\n`;
          if (errorData.details) errorMessage += `Details: ${errorData.details}\n`;
        }
      } else {
        errorMessage += error.message || 'Unknown error';
      }
      
      alert(errorMessage);
      setImportResults({
        total: 0,
        created: 0,
        skipped: 0,
        payments_created: 0,
        passes_created: 0,
        errors: [errorMessage],
        pending_imports_created: 0, // Ensure this is initialized
      });
    } finally {
      setIsImporting(false);
    }
  };

  const downloadSampleCSV = () => {
    // Updated sample CSV to reflect the new primary fields for gift nominations
    const sampleCSV = `email,first_name,last_name,phone,address,city,state,zip,date_submitted,payment_plan_type
john.doe@example.com,John,Doe,555-123-4567,"123 Main St",Anytown,CA,90210,2024-01-15,single_cycle
jane.smith@example.com,Jane,Smith,555-987-6543,"456 Oak Ave",Otherville,NY,10001,2024-01-20,four_cycle_pass`;

    const blob = new Blob([sampleCSV], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_user_import.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  const handleCloseImportDialog = () => {
    setShowImportDialog(false);
    setImportFile(null);
    setImportResults(null);
  };

  const handleSendInvitations = async () => {
    setIsSendingInvitations(true);
    setInvitationResults(null);

    try {
      const response = await base44.functions.invoke('sendPendingUserInvitations');
      
      if (response.data?.success) {
        setInvitationResults(response.data.results);
        // Refresh pending imports list
        const allPendingImports = await base44.entities.PendingUserImport.list('-created_date');
        setPendingImports(allPendingImports);
        setSelectedPendingIds([]); // Clear selection after sending
      } else {
        alert('Failed to send invitations: ' + (response.data?.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to send invitations:', error);
      alert('Failed to send invitations: ' + error.message);
    }
    
    setIsSendingInvitations(false);
  };

  const handleSelectAllPending = (checked) => {
    if (checked) {
      const pendingIds = filteredPendingImports.map(p => p.id);
      setSelectedPendingIds(pendingIds);
    } else {
      setSelectedPendingIds([]);
    }
  };

  const handleSelectPending = (id, checked) => {
    if (checked) {
      setSelectedPendingIds([...selectedPendingIds, id]);
    } else {
      setSelectedPendingIds(selectedPendingIds.filter(sid => sid !== id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedPendingIds.length === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedPendingIds.length} pending invitation(s)?`)) {
      return;
    }

    try {
      // Delete multiple in parallel
      await Promise.all(selectedPendingIds.map(id => base44.entities.PendingUserImport.delete(id)));
      
      const allPendingImports = await base44.entities.PendingUserImport.list('-created_date');
      setPendingImports(allPendingImports);
      setSelectedPendingIds([]);
    } catch (error) {
      console.error('Failed to delete pending imports:', error);
      alert('Failed to delete pending imports: ' + error.message);
    }
  };

  const handleResendSelected = async () => {
    if (selectedPendingIds.length === 0) return;
    
    setIsSendingInvitations(true);
    
    try {
      // Update selected records back to pending status so they get picked up
      await Promise.all(selectedPendingIds.map(id => 
        base44.entities.PendingUserImport.update(id, { status: 'pending' })
      ));
      
      // Now send invitations for all 'pending' records
      const response = await base44.functions.invoke('sendPendingUserInvitations');
      
      if (response.data?.success) {
        setInvitationResults(response.data.results);
        const allPendingImports = await base44.entities.PendingUserImport.list('-created_date');
        setPendingImports(allPendingImports);
        setSelectedPendingIds([]);
      } else {
        alert('Failed to resend invitations: ' + (response.data?.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to resend invitations:', error);
      alert('Failed to resend invitations: ' + error.message);
    }
    
    setIsSendingInvitations(false);
  };

  const handleViewPending = (pending) => {
    setEditingPending(pending);
    setShowPendingDialog(true);
  };

  const handleSavePending = async () => {
    if (!editingPending) return;
    try {
      await base44.entities.PendingUserImport.update(editingPending.id, editingPending);
      const allPendingImports = await base44.entities.PendingUserImport.list('-created_date');
      setPendingImports(allPendingImports);
      setShowPendingDialog(false);
      setEditingPending(null);
    } catch (error) {
      console.error('Failed to update pending import:', error);
      alert('Failed to update: ' + error.message);
    }
  };

  const handleDeletePending = async (id) => {
    if (!confirm('Are you sure you want to delete this pending invitation?')) {
      return;
    }

    try {
      await base44.entities.PendingUserImport.delete(id);
      const allPendingImports = await base44.entities.PendingUserImport.list('-created_date');
      setPendingImports(allPendingImports);
      setSelectedPendingIds(prev => prev.filter(sid => sid !== id)); // Remove from selection if deleted
    } catch (error) {
      console.error('Failed to delete pending import:', error);
      alert('Failed to delete: ' + error.message);
    }
  };

  const handleResendSingle = async (pending) => {
    setIsSendingInvitations(true);
    
    try {
      // Ensure status is 'pending' for it to be picked up by the backend function
      await base44.entities.PendingUserImport.update(pending.id, { status: 'pending' });
      const response = await base44.functions.invoke('sendPendingUserInvitations');
      
      if (response.data?.success) {
        setInvitationResults(response.data.results);
        const allPendingImports = await base44.entities.PendingUserImport.list('-created_date');
        setPendingImports(allPendingImports);
      } else {
        alert('Failed to resend invitation: ' + (response.data?.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to resend invitation:', error);
      alert('Failed to resend: ' + error.message);
    }
    
    setIsSendingInvitations(false);
  };

  const filteredPendingImports = useMemo(() => {
    let filtered = pendingImports.filter(p => p.status === 'pending' || p.status === 'invited');
    
    if (pendingSearchTerm) {
      filtered = filtered.filter(p =>
        p.email?.toLowerCase().includes(pendingSearchTerm.toLowerCase()) ||
        p.full_name?.toLowerCase().includes(pendingSearchTerm.toLowerCase()) ||
        p.first_name?.toLowerCase().includes(pendingSearchTerm.toLowerCase()) ||
        p.last_name?.toLowerCase().includes(pendingSearchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [pendingImports, pendingSearchTerm]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  const hasTrulyPendingInvitations = pendingImports.filter(p => p.status === 'pending').length > 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:py-12">
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
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600">Search, filter, and manage user accounts</p>
            </div>
          </div>
          <Button 
            onClick={() => { setShowImportDialog(true); setImportResults(null); setImportFile(null); }} // Reset dialog state on open
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Upload className="w-4 h-4 mr-2" />
            Bulk Import Users
          </Button>
        </div>

        {/* Pending Invitations Card */}
        {filteredPendingImports.length > 0 && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-blue-600" />
                  Pending Invitations ({filteredPendingImports.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedPendingIds.length > 0 && (
                    <>
                      <Button
                        onClick={handleResendSelected}
                        disabled={isSendingInvitations}
                        variant="outline"
                        size="sm"
                      >
                        {isSendingInvitations ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        Resend Selected ({selectedPendingIds.length})
                      </Button>
                      <Button
                        onClick={handleDeleteSelected}
                        variant="destructive"
                        size="sm"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Delete Selected ({selectedPendingIds.length})
                      </Button>
                    </>
                  )}
                  <Button
                    onClick={handleSendInvitations}
                    disabled={isSendingInvitations || !hasTrulyPendingInvitations}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSendingInvitations ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send All Pending ({pendingImports.filter(p => p.status === 'pending').length})
                      </>
                    )}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-800 mb-4">
                Manage pending invitations - send emails, edit details, or remove entries.
              </p>
              
              {invitationResults && (
                <Alert className={invitationResults.failed > 0 ? 'border-yellow-500 bg-yellow-50' : 'border-green-500 bg-green-50'} className="mb-4">
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">Invitation Results:</p>
                      <ul className="text-sm space-y-1">
                        <li>✅ Sent: {invitationResults.sent}</li>
                        <li>❌ Failed: {invitationResults.failed}</li>
                        {invitationResults.errors && invitationResults.errors.length > 0 && (
                          <li className="text-yellow-700">
                            Errors:
                            <ul className="list-disc list-inside ml-4 mt-1">
                              {invitationResults.errors.map((err, i) => (
                                <li key={i}>{err}</li>
                              ))}
                            </ul>
                          </li>
                        )}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search pending invitations..."
                    value={pendingSearchTerm}
                    onChange={(e) => setPendingSearchTerm(e.target.value)}
                    className="pl-10 bg-white"
                  />
                </div>
              </div>

              <div className="border rounded-lg bg-white">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedPendingIds.length === filteredPendingImports.length && filteredPendingImports.length > 0}
                          onCheckedChange={handleSelectAllPending}
                          disabled={filteredPendingImports.length === 0}
                        />
                      </TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Plan Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPendingImports.map((pending) => (
                      <TableRow key={pending.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedPendingIds.includes(pending.id)}
                            onCheckedChange={(checked) => handleSelectPending(pending.id, checked)}
                          />
                        </TableCell>
                        <TableCell>{pending.email}</TableCell>
                        <TableCell>{pending.full_name || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {pending.payment_plan_type === 'four_cycle_pass' ? '4-Cycle Pass' : 'Single Cycle'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={pending.status === 'pending' ? 'secondary' : 'default'}>
                            {pending.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={pending.source === 'gift_nomination' ? 'default' : 'secondary'}>
                            {pending.source === 'gift_nomination' ? 'Gift' : 'Import'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(pending.created_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewPending(pending)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View/Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleResendSingle(pending)}
                                disabled={isSendingInvitations}
                              >
                                <Send className="w-4 h-4 mr-2" />
                                Resend Invitation
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeletePending(pending.id)}
                                className="text-red-600"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredPendingImports.length === 0 && (
                  <div className="p-8 text-center text-sm text-gray-500">
                    No pending invitations found matching your criteria.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Users ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name, email, phone, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={exportUsers} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.full_name}
                          </div>
                          <div className="text-sm text-gray-600">{user.email}</div>
                          {user.phone && <div className="text-xs text-gray-500">{user.phone}</div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {user.city && user.state ? `${user.city}, ${user.state}` : 'Not specified'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                          {user.role || 'user'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {user.email_verified ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-yellow-500" />
                          )}
                          <span className="text-sm">
                            {user.email_verified ? 'Verified' : 'Unverified'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {new Date(user.created_date).toLocaleDateString()}
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
                            <DropdownMenuItem asChild>
                              <a
                                href={createPageUrl(`Dashboard?impersonate_user_id=${user.id}`)}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View As User
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <a href={`mailto:${user.email}`}>
                                <Mail className="w-4 h-4 mr-2" />
                                Send Email
                              </a>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Bulk Import Users</DialogTitle>
              <DialogDescription>
                Import users from your old system with their payment information
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <Alert>
                <AlertDescription>
                  <strong>How Bulk Import Works:</strong>
                  <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                    <li>For users who already have accounts: Creates payment and cycle pass records immediately</li>
                    <li>For users who don't have accounts yet: Creates pending invitation records</li>
                    <li>After import, use "Send Invitations" to email all pending users</li>
                    <li>Users will receive personalized invitation emails to sign up and claim their pre-paid application</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <Alert>
                <AlertDescription>
                  <strong>CSV Format:</strong> Upload a CSV file with the following columns:
                  <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                    <li>email (required)</li>
                    <li>first_name, last_name, phone, address, city, state, zip (optional but recommended)</li>
                    <li>payment_plan_type (single_cycle or four_cycle_pass)</li>
                    <li>date_submitted (optional)</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={downloadSampleCSV}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Sample CSV
                </Button>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="csv-upload"
                  disabled={isImporting}
                />
                <label
                  htmlFor="csv-upload"
                  className={`cursor-pointer flex flex-col items-center ${isImporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Upload className="w-12 h-12 text-gray-400 mb-4" />
                  <p className="text-sm text-gray-600 mb-2">
                    {importFile ? importFile.name : 'Click to select CSV file'}
                  </p>
                  <p className="text-xs text-gray-500">or drag and drop</p>
                </label>
              </div>

              {importResults && (
                <Alert className={importResults.errors && importResults.errors.length > 0 ? 'border-yellow-500' : 'border-green-500'}>
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">Import Results:</p>
                      <ul className="text-sm space-y-1">
                        <li>✅ Total rows processed: {importResults.total}</li>
                        <li>✅ Existing users found: {importResults.users_found}</li>
                        <li>⚠️ Users not found: {importResults.users_not_found}</li>
                        <li>💳 Payment records created: {importResults.payments_created}</li>
                        <li>🎫 Cycle passes created: {importResults.passes_created}</li>
                        {importResults.errors && importResults.errors.length > 0 && (
                          <li className="text-yellow-600">
                            ⚠️ Warnings: {importResults.errors.length}
                            <details className="mt-2">
                              <summary className="cursor-pointer">View details</summary>
                              <ul className="list-disc list-inside mt-2">
                                {importResults.errors.map((err, i) => (
                                  <li key={i}>{err}</li>
                                ))}
                              </ul>
                            </details>
                          </li>
                        )}
                      </ul>
                      {importResults.users_not_found > 0 && (
                        <p className="text-sm text-yellow-700 mt-3 p-2 bg-yellow-50 rounded">
                          <strong>Note:</strong> {importResults.users_not_found} user(s) were not found in the system. These users need to sign up or be invited before their payment data can be imported.
                        </p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {importResults && importResults.pending_imports_created > 0 && (
                <Alert className="border-blue-500 bg-blue-50">
                  <AlertDescription className="text-blue-800">
                    <strong>Next Step:</strong> {importResults.pending_imports_created} user(s) need to be invited. 
                    After closing this dialog, click "Send Invitations" to email all pending users.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={handleCloseImportDialog}
                  disabled={isImporting}
                >
                  {importResults ? 'Close' : 'Cancel'}
                </Button>
                {!importResults && ( // Only show import button if results are not displayed yet
                  <Button
                    onClick={handleBulkImport}
                    disabled={!importFile || isImporting}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Import Users
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Pending Import Details Dialog */}
        <Dialog open={showPendingDialog} onOpenChange={setShowPendingDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Pending Invitation Details</DialogTitle>
              <DialogDescription>
                View and edit pending user invitation information
              </DialogDescription>
            </DialogHeader>
            {editingPending && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-email">Email</Label>
                    <Input
                      id="edit-email"
                      value={editingPending.email}
                      onChange={(e) => setEditingPending({...editingPending, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-full-name">Full Name</Label>
                    <Input
                      id="edit-full-name"
                      value={editingPending.full_name || ''}
                      onChange={(e) => setEditingPending({...editingPending, full_name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-first-name">First Name</Label>
                    <Input
                      id="edit-first-name"
                      value={editingPending.first_name || ''}
                      onChange={(e) => setEditingPending({...editingPending, first_name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-last-name">Last Name</Label>
                    <Input
                      id="edit-last-name"
                      value={editingPending.last_name || ''}
                      onChange={(e) => setEditingPending({...editingPending, last_name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-plan-type">Plan Type</Label>
                    <Select
                      value={editingPending.payment_plan_type}
                      onValueChange={(value) => setEditingPending({...editingPending, payment_plan_type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single_cycle">Single Cycle</SelectItem>
                        <SelectItem value="four_cycle_pass">Four-Cycle Pass</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-status">Status</Label>
                    <Select
                      value={editingPending.status}
                      onValueChange={(value) => setEditingPending({...editingPending, status: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="invited">Invited</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {editingPending.source === 'gift_nomination' && (
                  <div>
                    <Label htmlFor="edit-message">Personal Message</Label>
                    <Textarea
                      id="edit-message"
                      value={editingPending.personal_message || ''}
                      onChange={(e) => setEditingPending({...editingPending, personal_message: e.target.value})}
                      rows={3}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Source</Label>
                    <p className="text-sm">{editingPending.source}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Created</Label>
                    <p className="text-sm">{new Date(editingPending.created_date).toLocaleString()}</p>
                  </div>
                  {editingPending.invite_sent_at && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Invited At</Label>
                      <p className="text-sm">{new Date(editingPending.invite_sent_at).toLocaleString()}</p>
                    </div>
                  )}
                  {editingPending.expires_at && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Expires At</Label>
                      <p className="text-sm">{new Date(editingPending.expires_at).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPendingDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSavePending}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
