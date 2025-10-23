
import React, { useState, useEffect } from 'react';
import { Cycle } from '@/api/entities';
import { Announcement } from '@/api/entities';
import { User } from '@/api/entities';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, CheckCircle2, XCircle, AlertCircle, PartyPopper, Megaphone, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getCurrentPacificTime, dateStringToPacificStartOfDay, dateStringToPacificEndOfDay } from '@/components/lib/timezone';

const CATEGORY_CONFIG = {
  'grant_cycle_update': { label: 'Grant Cycle Update', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  'winner_announcement': { label: 'Winner Announcement', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  'event': { label: 'Event', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  'general': { label: 'General', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  'urgent': { label: 'Urgent', color: 'bg-red-100 text-red-800 border-red-200' },
  'application_tip': { label: 'Application Tip', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  // Add other categories as needed, default will be general if not found
};

export default function Timeline() {
  const [cycles, setCycles] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
    } catch (e) {
      setUser(null);
    }

    try {
      const [allCycles, publishedAnnouncements] = await Promise.all([
        Cycle.list('-start_date'),
        Announcement.filter({ status: 'published' }, '-publication_date')
      ]);
      
      setCycles(allCycles);
      setAnnouncements(publishedAnnouncements);
    } catch (error) {
      console.error('Failed to load timeline:', error);
    }
    setIsLoading(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString.replace(/-/g, '\/')).toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getCycleStatus = (cycle) => {
    // If manual status is set, use it
    if (cycle.manual_status) {
      const manualStatuses = {
        reviewing: { 
          text: "Reviewing", 
          color: "bg-purple-100 text-purple-800 border-purple-200", 
          icon: Clock,
          description: "Applications are being reviewed by our board."
        },
        completed: { 
          text: "Completed", 
          color: "bg-gray-100 text-gray-800 border-gray-200", 
          icon: CheckCircle2,
          description: "This cycle has been completed and winners announced."
        },
        closed: { 
          text: "Closed", 
          color: "bg-red-100 text-red-800 border-red-200", 
          icon: XCircle,
          description: "This cycle is closed for submissions."
        }
      };
      // Return the specific manual status, or default to 'reviewing' if a malformed/unknown status is provided
      return manualStatuses[cycle.manual_status] || manualStatuses.reviewing;
    }

    // Otherwise calculate based on dates
    const nowPT = getCurrentPacificTime();
    const startDate = dateStringToPacificStartOfDay(cycle.start_date);
    const endDate = dateStringToPacificEndOfDay(cycle.end_date);
    const announceDate = dateStringToPacificEndOfDay(cycle.announce_by);

    if (nowPT > announceDate) {
      return { 
        text: "Completed", 
        color: "bg-gray-100 text-gray-800 border-gray-200", 
        icon: CheckCircle2,
        description: "This cycle has been completed and winners announced."
      };
    }
    if (nowPT > endDate) {
      return { 
        text: "Reviewing", 
        color: "bg-purple-100 text-purple-800 border-purple-200", 
        icon: Clock,
        description: "Applications are being reviewed by our board."
      };
    }
    if (nowPT >= startDate && cycle.is_open_for_submissions) {
      return { 
        text: "Open for Submissions", 
        color: "bg-green-100 text-green-800 border-green-200", 
        icon: CheckCircle2,
        description: "Applications are currently being accepted!"
      };
    }
    if (nowPT >= startDate && !cycle.is_open_for_submissions) {
      return { 
        text: "Closed", 
        color: "bg-red-100 text-red-800 border-red-200", 
        icon: XCircle,
        description: "This cycle is closed for submissions."
      };
    }
    return { 
      text: "Upcoming", 
      color: "bg-blue-100 text-blue-800 border-blue-200", 
      icon: Calendar,
      description: "This cycle will open for submissions soon."
    };
  };

  const isAdmin = user?.role === 'admin';
  const viewAsApplicant = new URLSearchParams(location.search).get('view') === 'applicant';

  const getApplicantLink = (page) => {
    return createPageUrl(page) + (isAdmin && viewAsApplicant ? '?view=applicant' : '');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading timeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:py-12">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Timeline & Announcements</h1>
          <p className="text-lg text-gray-600">Stay up-to-date with our quarterly grant cycles and important dates.</p>
        </div>

        {announcements.length > 0 && (
          <Card className="border-2 border-rose-200 mb-12">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Megaphone className="w-6 h-6 text-rose-600" />
                Recent Announcements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {announcements.slice(0, 3).map((announcement) => {
                const categoryConfig = CATEGORY_CONFIG[announcement.category] || CATEGORY_CONFIG['general'];
                return (
                  <div key={announcement.id} className="border-l-4 border-rose-400 pl-4 py-2">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg">{announcement.title}</h3>
                      <Badge className={categoryConfig.color}>
                        {categoryConfig.label}
                      </Badge>
                    </div>
                    {announcement.excerpt && (
                      <p className="text-gray-600 mb-2">{announcement.excerpt}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {new Date(announcement.publication_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'numeric',
                          day: 'numeric',
                          timeZone: 'America/Los_Angeles'
                        })}
                      </span>
                      <Link to={createPageUrl("PastRecipients")} className="text-rose-600 hover:text-rose-700 text-sm font-medium flex items-center gap-1">
                        Read more <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
              <Link to={createPageUrl("PastRecipients")} className="block">
                <Button variant="outline" className="w-full border-rose-300 text-rose-700 hover:bg-rose-50">
                  View All Announcements
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-gray-900">Grant Cycles</h2>
          
          {cycles.map((cycle) => {
            const status = getCycleStatus(cycle);
            const StatusIcon = status.icon;
            const nowPT = getCurrentPacificTime();
            const startDate = dateStringToPacificStartOfDay(cycle.start_date);
            const endDate = dateStringToPacificEndOfDay(cycle.end_date);
            // The `canApply` logic should still respect the cycle's `is_open_for_submissions` and date range, 
            // even if `manual_status` is set to something else for display.
            // A manual status like 'reviewing' or 'completed' would imply submissions are not open.
            // If manual_status is set to override, it usually means submissions are no longer possible.
            // We should ensure `canApply` is false if a manual status is active that implies closure.
            const canApply = !cycle.manual_status && nowPT >= startDate && nowPT <= endDate && cycle.is_open_for_submissions;

            return (
              <Card key={cycle.id} className={`${status.text === 'Open for Submissions' ? 'border-2 border-green-300 shadow-lg' : ''}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3">
                      <PartyPopper className="w-6 h-6 text-rose-600" />
                      {cycle.name}
                    </CardTitle>
                    <Badge className={`${status.color} border px-3 py-1 pointer-events-none`}>
                      <StatusIcon className="w-4 h-4 mr-2" />
                      {status.text}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {status.text === 'Open for Submissions' && (
                    <Alert className="mb-6 border-green-200 bg-green-50">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        <strong>🎉 Applications are being accepted now!</strong> Don't miss this opportunity.
                      </AlertDescription>
                    </Alert>
                  )}

                  <p className="text-gray-600 mb-6">{status.description}</p>

                  <div className="grid md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      <div className="text-sm text-gray-500 mb-1">Submissions Open</div>
                      <div className="font-semibold text-gray-900">{formatDate(cycle.start_date)}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      <div className="text-sm text-gray-500 mb-1">Submissions Close</div>
                      <div className="font-semibold text-gray-900">{formatDate(cycle.end_date)}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      <div className="text-sm text-gray-500 mb-1">Announcements By</div>
                      <div className="font-semibold text-gray-900">{formatDate(cycle.announce_by)}</div>
                    </div>
                  </div>

                  {canApply && (
                    <div className="flex justify-center">
                      <Link to={getApplicantLink("Apply")}>
                        <Button size="lg" className="bg-rose-600 hover:bg-rose-700">
                          Apply Now →
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
