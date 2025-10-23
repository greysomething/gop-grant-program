
import React, { useState, useEffect, useCallback } from 'react';
import { User } from '@/api/entities';
import { Application } from '@/api/entities';
import { Cycle } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
}
 from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FileText, Search, Download, MoreHorizontal, ArrowLeft, Users, FileDown, Eye, X, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ReactMarkdown from 'react-markdown';
import { enrollOnStatusChange } from '@/components/lib/emailSequenceEnrollment';

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-800' },
  under_review: { label: 'Under Review', color: 'bg-purple-100 text-purple-800' },
  finalist: { label: 'Finalist', color: 'bg-yellow-100 text-yellow-800' },
  awarded: { label: 'Awarded', color: 'bg-green-100 text-green-800' },
  not_selected: { label: 'Not Selected', color: 'bg-red-100 text-red-800' },
  ineligible: { label: 'Ineligible', color: 'bg-orange-100 text-orange-800' },
  withdrawn: { label: 'Withdrawn', color: 'bg-gray-100 text-gray-800' },
};

export default function AdminApplications() {
  const [applications, setApplications] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [users, setUsers] = useState({});
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [selectedApplications, setSelectedApplications] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cycleFilter, setCycleFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [bulkStatusDialog, setBulkStatusDialog] = useState(false);
  const [newBulkStatus, setNewBulkStatus] = useState('');
  const [previewApplication, setPreviewApplication] = useState(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false); // New state for bulk delete dialog

  const filterApplications = useCallback(() => {
    let filtered = applications;

    if (searchTerm) {
      filtered = filtered.filter(app => {
        const user = users[app.user_id];
        const userName = user ? `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase() : '';
        const userEmail = user?.email?.toLowerCase() || '';
        
        return app.anonymized_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.user_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          userName.includes(searchTerm.toLowerCase()) ||
          userEmail.includes(searchTerm.toLowerCase());
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    if (cycleFilter !== 'all') {
      filtered = filtered.filter(app => app.cycle_id === cycleFilter);
    }

    setFilteredApplications(filtered);
  }, [applications, searchTerm, statusFilter, cycleFilter, users]);

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [filterApplications]);

  const initialize = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);

      if (user?.role !== 'admin') {
        window.location.href = createPageUrl("Home");
        return;
      }

      const [allApplications, allCycles, allUsers] = await Promise.all([
        Application.list('-updated_date'),
        Cycle.list('-start_date'),
        User.list()
      ]);
      
      // Create a map of user IDs to user objects for quick lookup
      const userMap = {};
      allUsers.forEach(u => {
        userMap[u.id] = u;
      });
      
      setApplications(allApplications);
      setCycles(allCycles);
      setUsers(userMap);
    } catch (error) {
      console.error('Failed to load applications:', error);
    }
    setIsLoading(false);
  };

  const toggleApplicationSelection = (applicationId) => {
    const newSelected = new Set(selectedApplications);
    if (newSelected.has(applicationId)) {
      newSelected.delete(applicationId);
    } else {
      newSelected.add(applicationId);
    }
    setSelectedApplications(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedApplications.size === filteredApplications.length) {
      setSelectedApplications(new Set());
    } else {
      setSelectedApplications(new Set(filteredApplications.map(app => app.id)));
    }
  };

  const updateApplicationStatus = async (applicationId, newStatus) => {
    try {
      await Application.update(applicationId, { status: newStatus });
      
      // Get the updated application
      const updatedApp = applications.find(app => app.id === applicationId);
      if (updatedApp) {
        const appWithNewStatus = { ...updatedApp, status: newStatus };
        
        // Try to enroll in matching sequences (won't break if it fails)
        await enrollOnStatusChange(appWithNewStatus, newStatus);
      }
      
      setApplications(applications.map(app =>
        app.id === applicationId ? { ...app, status: newStatus } : app
      ));
    } catch (error) {
      console.error('Failed to update application status:', error);
    }
  };

  const bulkUpdateStatus = async () => {
    try {
      const updatePromises = Array.from(selectedApplications).map(async (appId) => {
        await Application.update(appId, { status: newBulkStatus });
        
        // Enroll in sequences for each updated application
        const app = applications.find(a => a.id === appId);
        if (app) {
          await enrollOnStatusChange({ ...app, status: newBulkStatus }, newBulkStatus);
        }
      });
      
      await Promise.all(updatePromises);
      
      setApplications(applications.map(app =>
        selectedApplications.has(app.id) ? { ...app, status: newBulkStatus } : app
      ));
      
      setSelectedApplications(new Set());
      setBulkStatusDialog(false);
      setNewBulkStatus('');
    } catch (error) {
      console.error('Failed to bulk update status:', error);
    }
  };

  const bulkDeleteApplications = async () => {
    try {
      const deletePromises = Array.from(selectedApplications).map(appId =>
        Application.delete(appId)
      );

      await Promise.all(deletePromises);

      // Filter out the deleted applications from the main applications state
      setApplications(prevApplications =>
        prevApplications.filter(app => !selectedApplications.has(app.id))
      );

      setSelectedApplications(new Set()); // Clear selection
      setBulkDeleteDialog(false); // Close dialog
    } catch (error) {
      console.error('Failed to bulk delete applications:', error);
      // Optionally, add a user-facing error message or toast notification
    }
  };

  const exportApplications = () => {
    const csvContent = [
      ['Application ID', 'Anonymized ID', 'User ID', 'User Name', 'User Email', 'Cycle', 'Status', 'Created Date', 'Updated Date'].join(','),
      ...filteredApplications.map(app => {
        const user = users[app.user_id];
        const userName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : '';
        const userEmail = user?.email || '';
        
        return [
          app.id || '',
          app.anonymized_id || '',
          app.user_id || '',
          userName,
          userEmail,
          cycles.find(c => c.id === app.cycle_id)?.name || '',
          app.status || '',
          new Date(app.created_date).toLocaleDateString(),
          new Date(app.updated_date).toLocaleDateString()
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `applications_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  const handlePreview = (application) => {
    setPreviewApplication(application);
    setPreviewDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

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
              <h1 className="text-3xl font-bold text-gray-900">Application Management</h1>
              <p className="text-gray-600">Review, update, and manage grant applications</p>
            </div>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Applications ({filteredApplications.length})
              </div>
              <div className="flex items-center gap-2">
                {selectedApplications.size > 0 && (
                  <>
                    <Dialog open={bulkStatusDialog} onOpenChange={setBulkStatusDialog}>
                      <Button variant="outline" size="sm" onClick={() => setBulkStatusDialog(true)}>
                        Bulk Update ({selectedApplications.size})
                      </Button>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Bulk Status Update</DialogTitle>
                          <DialogDescription>
                            Update the status of {selectedApplications.size} selected applications.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <Select value={newBulkStatus} onValueChange={setNewBulkStatus}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select new status" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                <SelectItem key={key} value={key}>{config.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setBulkStatusDialog(false)}>
                            Cancel
                          </Button>
                          <Button onClick={bulkUpdateStatus} disabled={!newBulkStatus}>
                            Update Status
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    {/* New Bulk Delete Dialog */}
                    <Dialog open={bulkDeleteDialog} onOpenChange={setBulkDeleteDialog}>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setBulkDeleteDialog(true)}
                        className="ml-2"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete ({selectedApplications.size})
                      </Button>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Confirm Bulk Delete</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to delete {selectedApplications.size} selected applications? This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setBulkDeleteDialog(false)}>
                            Cancel
                          </Button>
                          <Button variant="destructive" onClick={bulkDeleteApplications}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Permanently
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
                <Button onClick={exportApplications} variant="outline" size="sm">
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
                  placeholder="Search by application ID, user name, or email..."
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
              <Select value={cycleFilter} onValueChange={setCycleFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Cycle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cycles</SelectItem>
                  {cycles.map((cycle) => (
                    <SelectItem key={cycle.id} value={cycle.id}>{cycle.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedApplications.size === filteredApplications.length && filteredApplications.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Cycle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((application) => {
                    const cycle = cycles.find(c => c.id === application.cycle_id);
                    const statusConfig = STATUS_CONFIG[application.status] || STATUS_CONFIG['draft'];
                    const applicantUser = users[application.user_id];
                    const applicantName = applicantUser 
                      ? `${applicantUser.first_name || ''} ${applicantUser.last_name || ''}`.trim() || applicantUser.full_name || 'Unknown'
                      : 'Unknown';
                    
                    return (
                      <TableRow key={application.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedApplications.has(application.id)}
                            onCheckedChange={() => toggleApplicationSelection(application.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {applicantName}
                            </div>
                            <div className="text-sm text-gray-600">
                              {applicantUser?.email || 'No email'}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {application.anonymized_id || application.id.slice(-6)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {cycle?.name || 'Unknown Cycle'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig.color}>
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600">
                            {new Date(application.created_date).toLocaleDateString('en-US', {
                              month: 'numeric',
                              day: 'numeric',
                              year: 'numeric',
                              timeZone: 'America/Los_Angeles'
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePreview(application)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Preview
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                  <DropdownMenuItem
                                    key={key}
                                    onClick={() => updateApplicationStatus(application.id, key)}
                                  >
                                    Mark as {config.label}
                                  </DropdownMenuItem>
                                ))}
                                <DropdownMenuItem>
                                  <FileDown className="w-4 h-4 mr-2" />
                                  Export PDF
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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

        {/* Preview Dialog */}
        <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl mb-2">
                Application Preview
              </DialogTitle>
              <DialogDescription>
                {previewApplication && users[previewApplication.user_id] && (
                  <div className="space-y-1">
                    <div className="font-medium text-gray-900">
                      {users[previewApplication.user_id].first_name} {users[previewApplication.user_id].last_name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {users[previewApplication.user_id].email}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={STATUS_CONFIG[previewApplication.status]?.color}>
                        {STATUS_CONFIG[previewApplication.status]?.label}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        Submitted: {new Date(previewApplication.created_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            
            {previewApplication && previewApplication.form_data && (
              <div className="space-y-6 pt-4">
                {/* About You Section */}
                <section className="space-y-3">
                  <h3 className="font-semibold text-lg border-b pb-2">About You</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Name:</span>
                      <div className="font-medium">
                        {previewApplication.form_data.first_name} {previewApplication.form_data.last_name}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Date of Birth:</span>
                      <div className="font-medium">{previewApplication.form_data.date_of_birth || 'Not provided'}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Phone:</span>
                      <div className="font-medium">{previewApplication.form_data.phone || 'Not provided'}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Address:</span>
                      <div className="font-medium">
                        {previewApplication.form_data.address}, {previewApplication.form_data.city}, {previewApplication.form_data.state} {previewApplication.form_data.zip_code}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Your Journey Section */}
                <section className="space-y-3">
                  <h3 className="font-semibold text-lg border-b pb-2">Your Journey</h3>
                  
                  {previewApplication.form_data.submission_type_written && (
                    <div>
                      <h4 className="font-medium mb-2 text-blue-600">Written Story</h4>
                      <div className="prose prose-sm max-w-none bg-gray-50 rounded-md p-4 border">
                        <ReactMarkdown>
                          {previewApplication.form_data.your_journey || 'No story provided.'}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}

                  {previewApplication.form_data.submission_type_video && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2 text-rose-600">Video Submission</h4>
                      {previewApplication.form_data.video_submission_url ? (
                        <div className="bg-green-50 border border-green-200 rounded-md p-3">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-green-600" />
                            <div>
                              <p className="font-medium text-green-900">Video uploaded</p>
                              <p className="text-sm text-green-700">{previewApplication.form_data.video_submission_filename}</p>
                              <a 
                                href={previewApplication.form_data.video_submission_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline"
                              >
                                View Video
                              </a>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No video uploaded</p>
                      )}
                    </div>
                  )}

                  {!previewApplication.form_data.submission_type_written && !previewApplication.form_data.submission_type_video && (
                    <p className="text-gray-500">No story submitted</p>
                  )}
                </section>

                {/* Financials Section */}
                <section className="space-y-3">
                  <h3 className="font-semibold text-lg border-b pb-2">Financials</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Household Size:</span>
                      <div className="font-medium">{previewApplication.form_data.household_size || 'Not provided'}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Annual Income:</span>
                      <div className="font-medium">{previewApplication.form_data.income_range || 'Not provided'}</div>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">Use of Funds:</span>
                      <div className="font-medium">{previewApplication.form_data.use_of_funds || 'Not provided'}</div>
                    </div>
                  </div>
                </section>

                {/* Consent Section */}
                <section className="space-y-3">
                  <h3 className="font-semibold text-lg border-b pb-2">Consent</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={previewApplication.form_data.terms_agreement} disabled className="rounded" />
                      <span>Agreed to Terms & Privacy</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={previewApplication.form_data.truthfulness_agreement} disabled className="rounded" />
                      <span>Certified truthfulness</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={previewApplication.form_data.publicity_consent} disabled className="rounded" />
                      <span>Consented to publicity</span>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {(!previewApplication || !previewApplication.form_data) && (
              <div className="py-8 text-center text-gray-500">
                No application data available
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
