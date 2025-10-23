import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  ArrowLeft, 
  Mail,
  Search,
  Download,
  Send,
  CheckCircle2,
  Clock,
  XCircle,
  Gift,
  FileText,
  Loader2
} from 'lucide-react';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  invited: { label: 'Invited', color: 'bg-blue-100 text-blue-800', icon: Mail },
  claimed: { label: 'Claimed', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  expired: { label: 'Expired', color: 'bg-gray-100 text-gray-800', icon: XCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle }
};

const SOURCE_CONFIG = {
  admin_import: { label: 'Admin Import', icon: FileText },
  gift_nomination: { label: 'Gift Nomination', icon: Gift }
};

export default function AdminPendingInvitations() {
  const [pendingImports, setPendingImports] = useState([]);
  const [filteredImports, setFilteredImports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [sendResults, setSendResults] = useState(null);

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    filterImports();
  }, [pendingImports, searchTerm, statusFilter, sourceFilter]);

  const initialize = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      if (user?.role !== 'admin') {
        window.location.href = createPageUrl("Home");
        return;
      }

      const imports = await base44.entities.PendingUserImport.list('-created_date');
      setPendingImports(imports);
    } catch (error) {
      console.error('Failed to load pending imports:', error);
    }
    setIsLoading(false);
  };

  const filterImports = () => {
    let filtered = pendingImports;

    if (searchTerm) {
      filtered = filtered.filter(imp =>
        imp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        imp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        imp.nominator_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(imp => imp.status === statusFilter);
    }

    if (sourceFilter !== 'all') {
      filtered = filtered.filter(imp => imp.source === sourceFilter);
    }

    setFilteredImports(filtered);
  };

  const handleSendInvitations = async () => {
    setIsSending(true);
    setSendResults(null);

    try {
      const response = await base44.functions.invoke('sendPendingUserInvitations', {});
      
      if (response.data?.success) {
        setSendResults(response.data.results);
        await initialize(); // Refresh the list
      } else {
        alert('Failed to send invitations: ' + (response.data?.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to send invitations:', error);
      alert('Failed to send invitations: ' + error.message);
    }

    setIsSending(false);
  };

  const exportImports = () => {
    const csvContent = [
      ['Email', 'Name', 'Payment Plan', 'Source', 'Status', 'Invited At', 'Expires At', 'Created Date'].join(','),
      ...filteredImports.map(imp => [
        imp.email || '',
        imp.full_name || '',
        imp.payment_plan_type || '',
        imp.source || '',
        imp.status || '',
        imp.invite_sent_at ? new Date(imp.invite_sent_at).toLocaleDateString() : '',
        imp.expires_at ? new Date(imp.expires_at).toLocaleDateString() : '',
        new Date(imp.created_date).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pending_invitations_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  const getTotalStats = () => {
    return {
      total: filteredImports.length,
      pending: filteredImports.filter(i => i.status === 'pending').length,
      invited: filteredImports.filter(i => i.status === 'invited').length,
      claimed: filteredImports.filter(i => i.status === 'claimed').length,
      gifts: filteredImports.filter(i => i.source === 'gift_nomination').length
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pending invitations...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Pending Invitations</h1>
              <p className="text-gray-600">Manage and send invitations to pending users</p>
            </div>
          </div>
          <Button 
            onClick={handleSendInvitations} 
            disabled={isSending || stats.pending === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Invitations ({stats.pending})
              </>
            )}
          </Button>
        </div>

        {sendResults && (
          <Alert className="mb-6 border-green-500 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Invitations Sent Successfully!</strong>
              <div className="mt-2 text-sm">
                <p>✓ Total processed: {sendResults.total}</p>
                <p>✓ Successfully sent: {sendResults.sent}</p>
                {sendResults.failed > 0 && (
                  <p className="text-red-600">✗ Failed: {sendResults.failed}</p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Mail className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Invited</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.invited}</p>
                </div>
                <Mail className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Claimed</p>
                  <p className="text-2xl font-bold text-green-600">{stats.claimed}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Gifts</p>
                  <p className="text-2xl font-bold text-pink-600">{stats.gifts}</p>
                </div>
                <Gift className="w-8 h-8 text-pink-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                Pending Invitations ({filteredImports.length})
              </div>
              <Button onClick={exportImports} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by email, name, or nominator..."
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
                    <TableHead>Recipient</TableHead>
                    <TableHead>Payment Plan</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Invited</TableHead>
                    <TableHead>Expires</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredImports.map((imp) => {
                    const statusConfig = STATUS_CONFIG[imp.status] || STATUS_CONFIG.pending;
                    const sourceConfig = SOURCE_CONFIG[imp.source] || SOURCE_CONFIG.admin_import;
                    const StatusIcon = statusConfig.icon;
                    const SourceIcon = sourceConfig.icon;

                    return (
                      <TableRow key={imp.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{imp.full_name || imp.email}</div>
                            <div className="text-sm text-gray-500">{imp.email}</div>
                            {imp.nominator_name && (
                              <div className="text-xs text-gray-400">From: {imp.nominator_name}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {imp.payment_plan_type === 'four_cycle_pass' ? 'Four-Cycle Pass' : 'Single Application'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            <SourceIcon className="w-3 h-3" />
                            {sourceConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {imp.invite_sent_at ? (
                            <div className="text-sm text-gray-600">
                              {new Date(imp.invite_sent_at).toLocaleDateString()}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Not sent</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600">
                            {imp.expires_at ? new Date(imp.expires_at).toLocaleDateString() : 'N/A'}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}