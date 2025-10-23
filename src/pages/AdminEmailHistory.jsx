import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Mail,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Download
} from 'lucide-react';
import { format } from 'date-fns';

export default function AdminEmailHistory() {
  const [emailLogs, setEmailLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  useEffect(() => {
    loadEmailLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [emailLogs, searchTerm, statusFilter, typeFilter]);

  const loadEmailLogs = async () => {
    setIsLoading(true);
    try {
      const logs = await base44.entities.EmailLog.list('-created_date', 1000);
      setEmailLogs(logs);
    } catch (error) {
      console.error('Failed to load email logs:', error);
    }
    setIsLoading(false);
  };

  const filterLogs = () => {
    let filtered = [...emailLogs];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.recipient_email?.toLowerCase().includes(term) ||
        log.recipient_name?.toLowerCase().includes(term) ||
        log.subject?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(log => log.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(log => log.email_type === typeFilter);
    }

    setFilteredLogs(filtered);
  };

  const handleViewDetails = (log) => {
    setSelectedEmail(log);
    setShowDetailDialog(true);
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Recipient', 'Subject', 'Type', 'Status', 'Resend ID'];
    const rows = filteredLogs.map(log => [
      format(new Date(log.created_date), 'yyyy-MM-dd HH:mm:ss'),
      log.recipient_email,
      log.subject,
      log.email_type,
      log.status,
      log.resend_id || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'bounced':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Mail className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      invitation: 'bg-blue-100 text-blue-800',
      gift_nomination: 'bg-rose-100 text-rose-800',
      bulk: 'bg-purple-100 text-purple-800',
      sequence: 'bg-indigo-100 text-indigo-800',
      manual: 'bg-gray-100 text-gray-800',
      transactional: 'bg-green-100 text-green-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading email history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl("AdminEmails")}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Email Management
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Email History</h1>
            <p className="text-gray-600">View and search all sent emails</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-500" />
                Email Logs ({filteredLogs.length} of {emailLogs.length})
              </CardTitle>
              <Button onClick={exportToCSV} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by recipient, subject..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="bounced">Bounced</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Email Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="invitation">Invitation</SelectItem>
                  <SelectItem value="gift_nomination">Gift Nomination</SelectItem>
                  <SelectItem value="bulk">Bulk Email</SelectItem>
                  <SelectItem value="sequence">Sequence</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="transactional">Transactional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No emails found matching your filters
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {format(new Date(log.created_date), 'MMM d, yyyy')}
                          <br />
                          <span className="text-gray-500 text-xs">
                            {format(new Date(log.created_date), 'h:mm a')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{log.recipient_name || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{log.recipient_email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{log.subject}</TableCell>
                        <TableCell>
                          <Badge className={getTypeColor(log.email_type)}>
                            {log.email_type?.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(log.status)}
                            <span className="capitalize">{log.status}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDetails(log)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Details</DialogTitle>
            <DialogDescription>
              View complete email information and content
            </DialogDescription>
          </DialogHeader>
          {selectedEmail && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Recipient</label>
                  <p className="text-sm font-medium">{selectedEmail.recipient_name || 'N/A'}</p>
                  <p className="text-sm text-gray-600">{selectedEmail.recipient_email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Sent Date</label>
                  <p className="text-sm">{format(new Date(selectedEmail.created_date), 'PPpp')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(selectedEmail.status)}
                    <span className="capitalize">{selectedEmail.status}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Type</label>
                  <Badge className={`${getTypeColor(selectedEmail.email_type)} mt-1`}>
                    {selectedEmail.email_type?.replace('_', ' ')}
                  </Badge>
                </div>
                {selectedEmail.template_name && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Template</label>
                    <p className="text-sm">{selectedEmail.template_name}</p>
                  </div>
                )}
                {selectedEmail.resend_id && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Resend ID</label>
                    <p className="text-sm font-mono text-xs">{selectedEmail.resend_id}</p>
                  </div>
                )}
                {selectedEmail.sequence_id && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Sequence Step</label>
                    <p className="text-sm">Step {selectedEmail.sequence_step}</p>
                  </div>
                )}
                {selectedEmail.error_message && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-red-600">Error Message</label>
                    <p className="text-sm text-red-600 bg-red-50 p-2 rounded mt-1">
                      {selectedEmail.error_message}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 mb-2 block">Subject</label>
                <p className="text-sm bg-gray-50 p-3 rounded">{selectedEmail.subject}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 mb-2 block">Email Content</label>
                <div className="border rounded-lg p-4 bg-white max-h-96 overflow-y-auto">
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }}
                  />
                </div>
              </div>

              {selectedEmail.metadata && Object.keys(selectedEmail.metadata).length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-2 block">Metadata</label>
                  <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
                    {JSON.stringify(selectedEmail.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}