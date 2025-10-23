
import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Application } from '@/api/entities';
import { Cycle } from '@/api/entities';
import { Payment } from '@/api/entities';
import { CyclePass } from '@/api/entities';
import { NominationGift } from '@/api/entities';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  FileText,
  Calendar,
  CreditCard,
  Gift,
  HelpCircle,
  Mail,
  BarChart3,
  Settings,
  Shield,
  AlertCircle,
  TrendingUp,
  Clock,
  DollarSign,
  Palette // Import the new Palette icon
} from 'lucide-react';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalApplications: 0,
    activeCycles: 0,
    totalRevenue: 0,
    pendingApplications: 0,
    activePasses: 0,
    pendingGifts: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      if (currentUser?.role !== 'admin') {
        window.location.href = createPageUrl("Home");
        return;
      }

      // Load dashboard stats (using service role through backend if needed)
      const [users, applications, cycles, payments, cyclePasses, gifts] = await Promise.all([
        User.list(),
        Application.list(),
        Cycle.list(),
        Payment.list(),
        CyclePass.list(),
        NominationGift.list()
      ]);

      setStats({
        totalUsers: users.length,
        totalApplications: applications.length,
        activeCycles: cycles.filter(c => c.is_open_for_submissions).length,
        totalRevenue: payments.reduce((sum, p) => p.status === 'succeeded' ? sum + p.amount : sum, 0),
        pendingApplications: applications.filter(a => a.status === 'submitted' || a.status === 'under_review').length,
        activePasses: cyclePasses.filter(p => p.status === 'active' && p.redemptions_remaining > 0).length,
        pendingGifts: gifts.filter(g => g.status === 'pending_acceptance').length
      });
    } catch (error) {
      console.error('Failed to initialize admin dashboard:', error);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage users, applications, cycles, and system settings</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Applications</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingApplications}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Cycles</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeCycles}</p>
                </div>
                <Calendar className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">${(stats.totalRevenue / 100).toLocaleString()}</p>
                </div>
                <DollarSign className="w-8 h-8 text-rose-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Management Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link to={createPageUrl("AdminUsers")}>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">User Management</CardTitle>
                <Users className="w-4 h-4 ml-auto text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">Search, filter, export, verify emails</p>
                <div className="flex items-center space-x-1 mt-2">
                  <Badge variant="secondary">Active</Badge>
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link to={createPageUrl("AdminApplications")}>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Applications</CardTitle>
                <FileText className="w-4 h-4 ml-auto text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalApplications}</div>
                <p className="text-xs text-muted-foreground">Bulk updates, assign reviewers, export</p>
                <div className="flex items-center space-x-1 mt-2">
                  <Badge variant="outline">{stats.pendingApplications} Pending</Badge>
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link to={createPageUrl("AdminCycles")}>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cycles</CardTitle>
                <Calendar className="w-4 h-4 ml-auto text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeCycles}</div>
                <p className="text-xs text-muted-foreground">Manage dates, submissions, announcements</p>
                <div className="flex items-center space-x-1 mt-2">
                  <Badge variant="secondary">Active</Badge>
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link to={createPageUrl("AdminPayments")}>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Payments</CardTitle>
                <CreditCard className="w-4 h-4 ml-auto text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${(stats.totalRevenue / 100).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">List, filter, reconcile, refunds</p>
                <div className="flex items-center space-x-1 mt-2">
                  <Badge variant="secondary">Revenue</Badge>
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link to={createPageUrl("AdminPasses")}>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cycle Passes</CardTitle>
                <TrendingUp className="w-4 h-4 ml-auto text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activePasses}</div>
                <p className="text-xs text-muted-foreground">Edit redemptions, audit log</p>
                <div className="flex items-center space-x-1 mt-2">
                  <Badge variant="secondary">Active</Badge>
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link to={createPageUrl("AdminGifts")}>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gift Nominations</CardTitle>
                <Gift className="w-4 h-4 ml-auto text-rose-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingGifts}</div>
                <p className="text-xs text-muted-foreground">Resend invites, edit nominees</p>
                <div className="flex items-center space-x-1 mt-2">
                  <Badge variant="outline">Pending</Badge>
                </div>
              </CardContent>
            </Link>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link to={createPageUrl("AdminLegalContent")}>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Legal Content</CardTitle>
                <FileText className="w-4 h-4 ml-auto text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Terms & Privacy</div>
                <p className="text-xs text-muted-foreground">Edit legal documents in Markdown</p>
                <div className="flex items-center space-x-1 mt-2">
                  <Badge variant="secondary">Editable</Badge>
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link to={createPageUrl("AdminAppearance")}>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Appearance</CardTitle>
                <Palette className="w-4 h-4 ml-auto text-indigo-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Design</div>
                <p className="text-xs text-muted-foreground">Content, styles, navigation menu</p>
                <div className="flex items-center space-x-1 mt-2">
                  <Badge variant="secondary">Customizable</Badge>
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link to={createPageUrl("AdminFAQ")}>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">FAQ Manager</CardTitle>
                <HelpCircle className="w-4 h-4 ml-auto text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">FAQ</div>
                <p className="text-xs text-muted-foreground">Create, edit, organize content</p>
                <div className="flex items-center space-x-1 mt-2">
                  <Badge variant="secondary">Markdown</Badge>
                </div>
              </CardContent>
            </Link>
          </Card>
          
          {/* Email Management Card - UPDATED */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link to={createPageUrl("AdminEmails")}>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Email Management</CardTitle>
                <Mail className="w-4 h-4 ml-auto text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Email</div>
                <p className="text-xs text-muted-foreground">Templates, sequences & history</p>
                <div className="flex items-center space-x-1 mt-2">
                  <Badge variant="secondary">Communications</Badge>
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link to={createPageUrl("AdminAnnouncements")}>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Announcements</CardTitle>
                <Mail className="w-4 h-4 ml-auto text-indigo-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">News</div>
                <p className="text-xs text-muted-foreground">Publish quarterly recipients</p>
                <div className="flex items-center space-x-1 mt-2">
                  <Badge variant="secondary">Public</Badge>
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link to={createPageUrl("AdminAnalytics")}>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Analytics</CardTitle>
                <BarChart3 className="w-4 h-4 ml-auto text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">📊</div>
                <p className="text-xs text-muted-foreground">Reports, funnel analysis, metrics</p>
                <div className="flex items-center space-x-1 mt-2">
                  <Badge variant="secondary">Dashboard</Badge>
                </div>
              </CardContent>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
