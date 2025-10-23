
import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Cycle } from '@/api/entities';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowLeft,
  Calendar,
  Plus,
  Edit,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { getCurrentPacificTime, dateStringToPacificStartOfDay, dateStringToPacificEndOfDay, hasDatePassed } from '@/components/lib/timezone';

const DEFAULT_CYCLE_SETTINGS = {
  auto_close_enabled: true,
  auto_close_anchor: 'announce_by',
  auto_close_offset_days: 5,
  auto_close_time_of_day: '09:00'
};

const ANCHOR_OPTIONS = [
  { value: 'announce_by', label: 'Announcement Date' },
  { value: 'cycle_end', label: 'Cycle End Date' }
];

const MANUAL_STATUS_OPTIONS = [
  { value: null, label: 'Auto (based on dates)' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'completed', label: 'Completed' },
  { value: 'closed', label: 'Closed' }
];

export default function AdminCycles() {
  const [cycles, setCycles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [editingCycle, setEditingCycle] = useState(null);
  const [showCycleDialog, setShowCycleDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    announce_by: '',
    is_open_for_submissions: false,
    manual_status: null, // Added manual_status
    ...DEFAULT_CYCLE_SETTINGS
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);

      if (user?.role !== 'admin') {
        window.location.href = createPageUrl("Home");
        return;
      }

      const allCycles = await Cycle.list('-start_date');
      setCycles(allCycles);
    } catch (error) {
      console.error('Failed to load cycles:', error);
    }
    setIsLoading(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      start_date: '',
      end_date: '',
      announce_by: '',
      is_open_for_submissions: false,
      manual_status: null, // Reset manual_status
      ...DEFAULT_CYCLE_SETTINGS
    });
    setFormErrors({});
    setEditingCycle(null);
  };

  const openEditDialog = (cycle) => {
    setEditingCycle(cycle);
    setFormData({
      name: cycle.name || '',
      start_date: cycle.start_date || '',
      end_date: cycle.end_date || '',
      announce_by: cycle.announce_by || '',
      is_open_for_submissions: cycle.is_open_for_submissions || false,
      manual_status: cycle.manual_status || null, // Initialize manual_status from cycle
      auto_close_enabled: cycle.auto_close_enabled ?? DEFAULT_CYCLE_SETTINGS.auto_close_enabled,
      auto_close_anchor: cycle.auto_close_anchor || DEFAULT_CYCLE_SETTINGS.auto_close_anchor,
      auto_close_offset_days: cycle.auto_close_offset_days ?? DEFAULT_CYCLE_SETTINGS.auto_close_offset_days,
      auto_close_time_of_day: cycle.auto_close_time_of_day || DEFAULT_CYCLE_SETTINGS.auto_close_time_of_day
    });
    setShowCycleDialog(true);
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) errors.name = 'Cycle name is required';
    if (!formData.start_date) errors.start_date = 'Start date is required';
    if (!formData.end_date) errors.end_date = 'End date is required';
    if (!formData.announce_by) errors.announce_by = 'Announcement date is required';

    if (formData.start_date && formData.end_date && formData.start_date >= formData.end_date) {
      errors.end_date = 'End date must be after start date';
    }

    if (formData.end_date && formData.announce_by && formData.end_date >= formData.announce_by) {
      errors.announce_by = 'Announcement date must be after end date';
    }

    if (formData.auto_close_offset_days < 0 || formData.auto_close_offset_days > 30) {
      errors.auto_close_offset_days = 'Offset days must be between 0 and 30';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      if (editingCycle) {
        await Cycle.update(editingCycle.id, formData);
        setCycles(cycles.map(cycle =>
          cycle.id === editingCycle.id ? { ...cycle, ...formData } : cycle
        ));
      } else {
        const newCycle = await Cycle.create(formData);
        setCycles([newCycle, ...cycles]);
      }

      setShowCycleDialog(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save cycle:', error);
    }
  };

  const handleDelete = async (cycleId) => {
    try {
      await Cycle.delete(cycleId);
      setCycles(cycles.filter(cycle => cycle.id !== cycleId));
    } catch (error) {
      console.error('Failed to delete cycle:', error);
    }
  };

  const toggleSubmissions = async (cycle) => {
    try {
      const updated = { ...cycle, is_open_for_submissions: !cycle.is_open_for_submissions };
      await Cycle.update(cycle.id, updated);
      setCycles(cycles.map(c => c.id === cycle.id ? updated : c));
    } catch (error) {
      console.error('Failed to toggle submissions:', error);
    }
  };

  const getStatusDetails = (statusValue) => {
    switch (statusValue) {
      case 'reviewing': return { text: "Reviewing", color: "bg-purple-100 text-purple-800", icon: Clock };
      case 'completed': return { text: "Completed", color: "bg-gray-100 text-gray-800", icon: CheckCircle2 };
      case 'closed': return { text: "Closed", color: "bg-red-100 text-red-800", icon: XCircle };
      case 'open': return { text: "Open", color: "bg-green-100 text-green-800", icon: CheckCircle2 };
      case 'upcoming': return { text: "Upcoming", color: "bg-blue-100 text-blue-800", icon: Calendar };
      default: return { text: "Unknown", color: "bg-yellow-100 text-yellow-800", icon: AlertTriangle };
    }
  };

  const getCycleStatus = (cycle) => {
    // If manual_status is set, use it
    if (cycle.manual_status) {
      return getStatusDetails(cycle.manual_status);
    }

    // Otherwise, calculate based on dates
    const nowPT = getCurrentPacificTime();
    const startDate = dateStringToPacificStartOfDay(cycle.start_date);
    const endDate = dateStringToPacificEndOfDay(cycle.end_date);
    const announceDate = dateStringToPacificEndOfDay(cycle.announce_by);

    if (nowPT > announceDate) return getStatusDetails("completed");
    if (nowPT > endDate) return getStatusDetails("reviewing");
    if (nowPT >= startDate && cycle.is_open_for_submissions) return getStatusDetails("open");
    if (nowPT >= startDate && !cycle.is_open_for_submissions) return getStatusDetails("closed");
    return getStatusDetails("upcoming");
  };

  const formatDate = (dateString) => {
    // This trick prevents the off-by-one day error by telling the Date constructor
    // to parse the date in the local timezone, not UTC.
    if (!dateString) return '';
    return new Date(dateString.replace(/-/g, '\/')).toLocaleDateString();
  };

  const updateManualStatus = async (cycleId, newStatus) => {
    try {
      await Cycle.update(cycleId, { manual_status: newStatus });
      setCycles(cycles.map(c => c.id === cycleId ? { ...c, manual_status: newStatus } : c));
    } catch (error) {
      console.error('Failed to update manual status:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cycles...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Cycle Management</h1>
              <p className="text-gray-600">Manage quarterly grant cycles, dates, and submission settings</p>
            </div>
          </div>
          <Dialog open={showCycleDialog} onOpenChange={setShowCycleDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="bg-rose-600 hover:bg-rose-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Cycle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingCycle ? 'Edit Cycle' : 'Add New Cycle'}</DialogTitle>
                <DialogDescription>
                  Configure the cycle dates and auto-closeout settings
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="name">Cycle Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Q1 2024"
                      className={formErrors.name ? 'border-red-500' : ''}
                    />
                    {formErrors.name && <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>}
                  </div>
                  <div>
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                      className={formErrors.start_date ? 'border-red-500' : ''}
                    />
                    {formErrors.start_date && <p className="text-sm text-red-500 mt-1">{formErrors.start_date}</p>}
                  </div>
                  <div>
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                      className={formErrors.end_date ? 'border-red-500' : ''}
                    />
                    {formErrors.end_date && <p className="text-sm text-red-500 mt-1">{formErrors.end_date}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="announce_by">Announce Results By</Label>
                    <Input
                      id="announce_by"
                      type="date"
                      value={formData.announce_by}
                      onChange={(e) => setFormData({...formData, announce_by: e.target.value})}
                      className={formErrors.announce_by ? 'border-red-500' : ''}
                    />
                    {formErrors.announce_by && <p className="text-sm text-red-500 mt-1">{formErrors.announce_by}</p>}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_open_for_submissions"
                      checked={formData.is_open_for_submissions}
                      onCheckedChange={(checked) => setFormData({...formData, is_open_for_submissions: checked})}
                    />
                    <Label htmlFor="is_open_for_submissions">Open for Submissions</Label>
                  </div>

                  <div>
                    <Label htmlFor="manual_status">Manual Status Override</Label>
                    <Select
                      value={formData.manual_status || 'auto'}
                      onValueChange={(value) => setFormData({...formData, manual_status: value === 'auto' ? null : value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MANUAL_STATUS_OPTIONS.map(option => (
                          <SelectItem key={option.value || 'auto'} value={option.value || 'auto'}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500 mt-1">
                      Override automatic status calculation. Leave as "Auto" to calculate status based on dates.
                    </p>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-medium mb-4">Auto-Closeout Settings</h4>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="auto_close_enabled"
                        checked={formData.auto_close_enabled}
                        onCheckedChange={(checked) => setFormData({...formData, auto_close_enabled: checked})}
                      />
                      <Label htmlFor="auto_close_enabled">Enable Auto-Closeout</Label>
                    </div>

                    {formData.auto_close_enabled && (
                      <div className="ml-6 space-y-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                          <Label htmlFor="auto_close_anchor">Closeout Anchor</Label>
                          <Select
                            value={formData.auto_close_anchor}
                            onValueChange={(value) => setFormData({...formData, auto_close_anchor: value})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ANCHOR_OPTIONS.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="auto_close_offset_days">Offset Days</Label>
                            <Input
                              id="auto_close_offset_days"
                              type="number"
                              min="0"
                              max="30"
                              value={formData.auto_close_offset_days}
                              onChange={(e) => setFormData({...formData, auto_close_offset_days: parseInt(e.target.value) || 0})}
                              className={formErrors.auto_close_offset_days ? 'border-red-500' : ''}
                            />
                            {formErrors.auto_close_offset_days && <p className="text-sm text-red-500 mt-1">{formErrors.auto_close_offset_days}</p>}
                          </div>
                          <div>
                            <Label htmlFor="auto_close_time_of_day">Time of Day (PT)</Label>
                            <Input
                              id="auto_close_time_of_day"
                              type="time"
                              value={formData.auto_close_time_of_day}
                              onChange={(e) => setFormData({...formData, auto_close_time_of_day: e.target.value})}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowCycleDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingCycle ? 'Update Cycle' : 'Create Cycle'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-500" />
              Grant Cycles ({cycles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cycle</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Announce By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submissions</TableHead>
                    <TableHead>Auto-Close</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cycles.map((cycle) => {
                    const status = getCycleStatus(cycle);
                    const StatusIcon = status.icon;

                    return (
                      <TableRow key={cycle.id}>
                        <TableCell>
                          <div className="font-medium">{cycle.name}</div>
                        </TableCell>
                        <TableCell>
                          {formatDate(cycle.start_date)}
                        </TableCell>
                        <TableCell>
                          {formatDate(cycle.end_date)}
                        </TableCell>
                        <TableCell>
                          {formatDate(cycle.announce_by)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="flex items-center gap-2">
                                <Badge className={status.color}>
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {status.text}
                                </Badge>
                                {cycle.manual_status && (
                                  <span className="text-xs text-gray-500">(Manual)</span>
                                )}
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => updateManualStatus(cycle.id, null)}>
                                Auto (based on dates)
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateManualStatus(cycle.id, 'reviewing')}>
                                Set to Reviewing
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateManualStatus(cycle.id, 'completed')}>
                                Set to Completed
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateManualStatus(cycle.id, 'closed')}>
                                Set to Closed
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleSubmissions(cycle)}
                            className={cycle.is_open_for_submissions ? 'text-green-600' : 'text-red-600'}
                          >
                            {cycle.is_open_for_submissions ? 'Open' : 'Closed'}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {cycle.auto_close_enabled ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                <span className="text-xs text-gray-600">
                                  +{cycle.auto_close_offset_days}d
                                </span>
                              </>
                            ) : (
                              <XCircle className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(cycle)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Cycle</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{cycle.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(cycle.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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
