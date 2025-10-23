
import React, { useState, useEffect, useCallback } from 'react';
import { User } from '@/api/entities';
import { Application } from '@/api/entities';
import { Payment } from '@/api/entities';
import { Cycle } from '@/api/entities';
import { CyclePass } from '@/api/entities';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { 
  ArrowLeft, 
  BarChart3,
  DollarSign,
  Users,
  FileText,
  TrendingUp,
  TrendingDown,
  Calendar,
  CreditCard,
  Award,
  Clock
} from 'lucide-react';

const CHART_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: '#6b7280' },
  submitted: { label: 'Submitted', color: '#3b82f6' },
  under_review: { label: 'Under Review', color: '#8b5cf6' },
  finalist: { label: 'Finalist', color: '#eab308' },
  awarded: { label: 'Awarded', color: '#22c55e' },
  not_selected: { label: 'Not Selected', color: '#ef4444' },
  ineligible: { label: 'Ineligible', color: '#f97316' },
  withdrawn: { label: 'Withdrawn', color: '#6b7280' }
};

export default function AdminAnalytics() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('90'); // days
  const [data, setData] = useState({
    users: [],
    applications: [],
    payments: [],
    cycles: [],
    cyclePasses: []
  });
  const [analytics, setAnalytics] = useState({
    kpis: {},
    charts: {}
  });

  const initialize = useCallback(async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);

      if (user?.role !== 'admin') {
        window.location.href = createPageUrl("Home");
        return;
      }

      // Fetch all data
      const [users, applications, payments, cycles, cyclePasses] = await Promise.all([
        User.list(),
        Application.list(),
        Payment.list(),
        Cycle.list(),
        CyclePass.list()
      ]);

      setData({
        users,
        applications,
        payments,
        cycles,
        cyclePasses
      });

    } catch (error) {
      console.error('Failed to load analytics data:', error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const getDateFilter = useCallback(() => {
    if (dateRange === 'all') return null;
    const days = parseInt(dateRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return cutoffDate;
  }, [dateRange]);

  const processRevenueOverTime = useCallback(() => {
    const monthlyRevenue = {};
    
    data.payments
      .filter(p => p.status === 'succeeded')
      .forEach(payment => {
        const date = new Date(payment.created_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyRevenue[monthKey]) {
          monthlyRevenue[monthKey] = 0;
        }
        monthlyRevenue[monthKey] += payment.amount / 100;
      });

    return Object.entries(monthlyRevenue)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, revenue]) => ({
        month,
        revenue: Math.round(revenue)
      }));
  }, [data.payments]);

  const processApplicationsByCycle = useCallback(() => {
    const applicationsByCycle = {};
    
    data.applications.forEach(app => {
      const cycle = data.cycles.find(c => c.id === app.cycle_id);
      const cycleName = cycle?.name || 'Unknown';
      
      if (!applicationsByCycle[cycleName]) {
        applicationsByCycle[cycleName] = 0;
      }
      applicationsByCycle[cycleName]++;
    });

    return Object.entries(applicationsByCycle)
      .map(([cycle, count]) => ({ cycle, applications: count }))
      .sort((a, b) => b.applications - a.applications);
  }, [data.applications, data.cycles]);

  const processApplicationStatusDistribution = useCallback(() => {
    const statusCount = {};
    
    data.applications.forEach(app => {
      const status = app.status || 'draft';
      if (!statusCount[status]) {
        statusCount[status] = 0;
      }
      statusCount[status]++;
    });

    return Object.entries(statusCount).map(([status, count]) => ({
      status: STATUS_CONFIG[status]?.label || status,
      count,
      color: STATUS_CONFIG[status]?.color || '#6b7280'
    }));
  }, [data.applications]);

  const processPaymentsByPlanType = useCallback(() => {
    const planTypeCount = {};
    
    data.payments
      .filter(p => p.status === 'succeeded')
      .forEach(payment => {
        const planType = payment.plan_type || 'unknown';
        if (!planTypeCount[planType]) {
          planTypeCount[planType] = { count: 0, revenue: 0 };
        }
        planTypeCount[planType].count++;
        planTypeCount[planType].revenue += payment.amount / 100;
      });

    return Object.entries(planTypeCount).map(([planType, data]) => ({
      planType: planType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count: data.count,
      revenue: Math.round(data.revenue)
    }));
  }, [data.payments]);

  const processUserGrowth = useCallback(() => {
    const monthlyUsers = {};
    
    data.users.forEach(user => {
      const date = new Date(user.created_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyUsers[monthKey]) {
        monthlyUsers[monthKey] = 0;
      }
      monthlyUsers[monthKey]++;
    });

    let cumulativeUsers = 0;
    return Object.entries(monthlyUsers)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, newUsers]) => {
        cumulativeUsers += newUsers;
        return {
          month,
          newUsers,
          totalUsers: cumulativeUsers
        };
      });
  }, [data.users]);

  const processAnalytics = useCallback(() => {
    const dateFilter = getDateFilter();
    
    // Filter data by date range
    const filteredUsers = dateFilter ? 
      data.users.filter(u => new Date(u.created_date) >= dateFilter) : 
      data.users;
    
    const filteredApplications = dateFilter ? 
      data.applications.filter(a => new Date(a.created_date) >= dateFilter) : 
      data.applications;
    
    const filteredPayments = dateFilter ? 
      data.payments.filter(p => new Date(p.created_date) >= dateFilter) : 
      data.payments;

    // Calculate KPIs
    const totalRevenue = data.payments
      .filter(p => p.status === 'succeeded')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const revenueInRange = filteredPayments
      .filter(p => p.status === 'succeeded')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const successfulPayments = data.payments.filter(p => p.status === 'succeeded');
    const avgApplicationFee = successfulPayments.length > 0 ? 
      successfulPayments.reduce((sum, p) => sum + (p.amount || 0), 0) / successfulPayments.length : 0;

    const kpis = {
      totalRevenue: totalRevenue / 100, // Convert cents to dollars
      revenueInRange: revenueInRange / 100,
      totalUsers: data.users.length,
      newUsersInRange: filteredUsers.length,
      totalApplications: data.applications.length,
      applicationsInRange: filteredApplications.length,
      avgApplicationFee: avgApplicationFee / 100,
      conversionRate: data.users.length > 0 ? (data.applications.length / data.users.length * 100) : 0,
      activeCycles: data.cycles.filter(c => c.is_open_for_submissions).length,
      activePasses: data.cyclePasses.filter(p => p.status === 'active' && p.redemptions_remaining > 0).length
    };

    // Process chart data
    const charts = {
      revenueOverTime: processRevenueOverTime(),
      applicationsByCycle: processApplicationsByCycle(),
      applicationStatusDistribution: processApplicationStatusDistribution(),
      paymentsByPlanType: processPaymentsByPlanType(),
      userGrowth: processUserGrowth()
    };

    setAnalytics({ kpis, charts });
  }, [data, getDateFilter, processRevenueOverTime, processApplicationsByCycle, processApplicationStatusDistribution, processPaymentsByPlanType, processUserGrowth]);

  useEffect(() => {
    if (data.users.length > 0) {
      processAnalytics();
    }
  }, [processAnalytics, data.users.length]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600">Comprehensive insights into platform performance</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="180">Last 6 months</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(analytics.kpis.totalRevenue || 0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatCurrency(analytics.kpis.revenueInRange || 0)} in selected range
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.kpis.totalUsers?.toLocaleString() || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    +{analytics.kpis.newUsersInRange || 0} in selected range
                  </p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Applications</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.kpis.totalApplications?.toLocaleString() || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    +{analytics.kpis.applicationsInRange || 0} in selected range
                  </p>
                </div>
                <FileText className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.kpis.conversionRate?.toFixed(1) || 0}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Users who submit applications
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-rose-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Cycles</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.kpis.activeCycles || 0}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-indigo-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Passes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.kpis.activePasses || 0}
                  </p>
                </div>
                <CreditCard className="w-8 h-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Application Fee</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(analytics.kpis.avgApplicationFee || 0)}
                  </p>
                </div>
                <Award className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Over Time */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.charts.revenueOverTime || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                  <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* User Growth */}
          <Card>
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.charts.userGrowth || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="newUsers" stroke="#3b82f6" strokeWidth={2} name="New Users" />
                  <Line type="monotone" dataKey="totalUsers" stroke="#8b5cf6" strokeWidth={2} name="Total Users" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Applications by Cycle */}
          <Card>
            <CardHeader>
              <CardTitle>Applications by Cycle</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.charts.applicationsByCycle || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="cycle" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="applications" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Application Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Application Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.charts.applicationStatusDistribution || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, count }) => `${status}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {(analytics.charts.applicationStatusDistribution || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Payments by Plan Type */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Plan Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={analytics.charts.paymentsByPlanType || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="planType" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8b5cf6" name="Count" />
                <Bar dataKey="revenue" fill="#22c55e" name="Revenue ($)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
