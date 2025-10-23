
import React, { useState, useEffect, useCallback } from 'react';
import { User } from '@/api/entities';
import { NominationGift } from '@/api/entities';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
  ArrowLeft, 
  Gift, 
  Search,
  Download,
  MoreHorizontal,
  Mail,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send
} from 'lucide-react';

const STATUS_CONFIG = {
  pending_acceptance: { label: 'Pending Acceptance', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  accepted: { label: 'Accepted', color: 'bg-blue-100 text-blue-800', icon: CheckCircle2 },
  claimed: { label: 'Claimed', color: 'bg-green-100 text-green-800', icon: Gift },
  expired: { label: 'Expired', color: 'bg-gray-100 text-gray-800', icon: XCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
  bounced: { label: 'Bounced', color: 'bg-orange-100 text-orange-800', icon: AlertCircle }
};

export default function AdminGifts() {
  const [gifts, setGifts] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredGifts, setFilteredGifts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedGift, setSelectedGift] = useState(null);
  const [showGiftDialog, setShowGiftDialog] = useState(false);
  
  const usersMap = React.useMemo(() => {
    return users.reduce((map, user) => {
      map[user.id] = user;
      return map;
    }, {});
  }, [users]);

  const filterGifts = useCallback(() => {
    let filtered = gifts;

    if (searchTerm) {
      filtered = filtered.filter(gift =>
        gift.nominee_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gift.nominee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usersMap[gift.nominator_user_id]?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usersMap[gift.nominator_user_id]?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gift.payment_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(gift => gift.status === statusFilter);
    }
    
    setFilteredGifts(filtered);
  }, [gifts, searchTerm, statusFilter, usersMap]);

  useEffect(() => {
    initialize();
  }, []);
  
  useEffect(() => {
    filterGifts();
  }, [filterGifts]);

  const initialize = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);

      if (user?.role !== 'admin') {
        window.location.href = createPageUrl("Home");
        return;
      }

      const [allGifts, allUsers] = await Promise.all([
        NominationGift.list('-created_date'),
        User.list()
      ]);
      
      setGifts(allGifts);
      setUsers(allUsers);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setIsLoading(false);
  };
  
  const viewGiftDetails = (gift) => {
    setSelectedGift(gift);
    setShowGiftDialog(true);
  };

  const updateGiftStatus = async (giftId, newStatus) => {
    try {
        await NominationGift.update(giftId, { status: newStatus });
        setGifts(prevGifts => prevGifts.map(gift => 
            gift.id === giftId ? { ...gift, status: newStatus } : gift
        ));
    } catch (error) {
        console.error('Failed to update gift status:', error);
    }
  };

  const exportGifts = () => {
    const csvContent = [
      ['Gift ID', 'Nominator Name', 'Nominator Email', 'Nominee Name', 'Nominee Email', 'Status', 'Expires At', 'Payment ID', 'Created Date'].join(','),
      ...filteredGifts.map(gift => {
        const nominator = usersMap[gift.nominator_user_id];
        return [
          gift.id || '',
          nominator?.full_name || '',
          nominator?.email || '',
          gift.nominee_name || '',
          gift.nominee_email || '',
          gift.status || '',
          gift.expires_at ? new Date(gift.expires_at).toLocaleDateString() : '',
          gift.payment_id || '',
          new Date(gift.created_date).toLocaleDateString()
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gifts_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading gift nominations...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Gift Nomination Management</h1>
              <p className="text-gray-600">Manage gift nominations and invitations</p>
            </div>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-rose-500" />
                Gift Nominations ({filteredGifts.length})
              </div>
              <Button onClick={exportGifts} variant="outline" size="sm">
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
                  placeholder="Search by nominator, nominee, or payment ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nominator</TableHead>
                    <TableHead>Nominee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGifts.map((gift) => {
                    const statusConfig = STATUS_CONFIG[gift.status] || {};
                    const StatusIcon = statusConfig.icon;
                    const nominator = usersMap[gift.nominator_user_id];
                    
                    return (
                      <TableRow key={gift.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{nominator?.full_name || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{nominator?.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{gift.nominee_name || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{gift.nominee_email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig.color}>
                            {StatusIcon && <StatusIcon className="w-3 h-3 mr-1" />}
                            {statusConfig.label || gift.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {gift.expires_at ? new Date(gift.expires_at).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {new Date(gift.created_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => viewGiftDetails(gift)}>
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Send className="w-4 h-4 mr-2" />
                                Resend Invite
                              </DropdownMenuItem>
                              {gift.status === 'pending_acceptance' && (
                                <DropdownMenuItem onClick={() => updateGiftStatus(gift.id, 'cancelled')}>
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Cancel Gift
                                </DropdownMenuItem>
                              )}
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

        <Dialog open={showGiftDialog} onOpenChange={setShowGiftDialog}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Gift Nomination Details</DialogTitle>
                    <DialogDescription>
                        Complete information for gift #{selectedGift?.id.slice(-8)}
                    </DialogDescription>
                </DialogHeader>
                {selectedGift && (
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-sm font-medium text-gray-600">Gift ID</Label>
                                <p className="text-sm">{selectedGift.id}</p>
                            </div>
                             <div>
                                <Label className="text-sm font-medium text-gray-600">Payment ID</Label>
                                <p className="text-sm">{selectedGift.payment_id}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-600">Nominator</Label>
                                <p className="text-sm">{usersMap[selectedGift.nominator_user_id]?.full_name || 'N/A'}</p>
                                <p className="text-xs text-gray-500">{usersMap[selectedGift.nominator_user_id]?.email}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-600">Nominee</Label> {/* Corrected from </p> to </Label> */}
                                <p className="text-sm">{selectedGift.nominee_name || 'N/A'}</p>
                                <p className="text-xs text-gray-500">{selectedGift.nominee_email}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-600">Status</Label>
                                <p><Badge className={STATUS_CONFIG[selectedGift.status]?.color}>{STATUS_CONFIG[selectedGift.status]?.label}</Badge></p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-600">Invite Token</Label>
                                <p className="text-sm break-all">{selectedGift.invite_token}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-600">Created</Label>
                                <p className="text-sm">{new Date(selectedGift.created_date).toLocaleString()}</p>
                            </div>
                             <div>
                                <Label className="text-sm font-medium text-gray-600">Expires</Label>
                                <p className="text-sm">{selectedGift.expires_at ? new Date(selectedGift.expires_at).toLocaleString() : 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
