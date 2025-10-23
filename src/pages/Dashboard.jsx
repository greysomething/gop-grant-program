import React, { useState, useEffect, useCallback } from 'react';
import { User } from '@/api/entities';
import { Application } from '@/api/entities';
import { Cycle } from '@/api/entities';
import { CyclePass } from '@/api/entities';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  User as UserIcon,
  Calendar,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Gift,
  Edit3,
  Search,
  Heart,
  Award,
  XCircle,
  AlertTriangle,
  Trash2,
  Shield,
  Eye,
  Video
} from 'lucide-react';
import { getCurrentPacificTime, dateStringToPacificStartOfDay, dateStringToPacificEndOfDay } from '@/components/lib/timezone';

const STATUS_CONFIG = {
  draft: { icon: Edit3, title: 'Draft', color: 'bg-gray-100 text-gray-800', description: 'You can continue editing your application.' },
  submitted: { icon: Clock, title: 'Submitted', color: 'bg-blue-100 text-blue-800', description: 'Your application has been submitted for the current cycle.' },
  under_review: { icon: Search, title: 'Under Review', color: 'bg-purple-100 text-purple-800', description: 'Our board is carefully reviewing your story.' },
  finalist: { icon: Heart, title: 'Finalist', color: 'bg-yellow-100 text-yellow-800', description: 'Congratulations! You are a finalist for this cycle.' },
  awarded: { icon: Award, title: 'Awarded', color: 'bg-green-100 text-green-800', description: 'Wonderful news! You have been selected for a grant.' },
  not_selected: { icon: XCircle, title: 'Not Selected', color: 'bg-red-100 text-red-800', description: 'Thank you for your submission. Please consider applying again.' },
  ineligible: { icon: AlertTriangle, title: 'Ineligible', color: 'bg-orange-100 text-orange-800', description: 'Your application was found to be ineligible for this cycle.' },
  withdrawn: { icon: Trash2, title: 'Withdrawn', color: 'bg-gray-100 text-gray-800', description: 'You have withdrawn this application.' },
};

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [impersonatedUser, setImpersonatedUser] = useState(null);
  const [applications, setApplications] = useState([]);
  const [cyclePasses, setCyclePasses] = useState([]);
  const [currentCycle, setCurrentCycle] = useState(null);
  const [allCycles, setAllCycles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSubmissionSuccess, setShowSubmissionSuccess] = useState(false);
  const [previewApplication, setPreviewApplication] = useState(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const location = useLocation();

  const initialize = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const searchParams = new URLSearchParams(location.search);
      const impersonateUserId = searchParams.get('impersonate_user_id');

      let dataOwnerId = currentUser.id;

      if (currentUser.role === 'admin' && impersonateUserId) {
        const impersonated = await User.get(impersonateUserId);
        setImpersonatedUser(impersonated);
        dataOwnerId = impersonateUserId;
      } else {
        setImpersonatedUser(null);
      }

      const [userApps, userPasses, openCycles, cycles] = await Promise.all([
        Application.filter({ user_id: dataOwnerId }, '-updated_date'),
        CyclePass.filter({ user_id: dataOwnerId }),
        Cycle.filter({ is_open_for_submissions: true }, '-start_date', 1),
        Cycle.list('-start_date')
      ]);

      console.log('User applications:', userApps);
      setApplications(userApps);
      setCyclePasses(userPasses);
      setAllCycles(cycles);

      let cycleToShow = openCycles.length > 0 ? openCycles[0] : null;

      if (!cycleToShow && cycles.length > 0) {
        cycleToShow = cycles[0];
      }

      setCurrentCycle(cycleToShow);
      setIsLoading(false);

    } catch (error) {
      console.error("Failed to initialize dashboard:", error);
      window.location.href = createPageUrl("Home");
    }
  }, [location.search]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('new_submission') === 'true') {
      setShowSubmissionSuccess(true);
      const newSearchParams = new URLSearchParams(location.search);
      newSearchParams.delete('new_submission');
      const newUrl = location.pathname + (newSearchParams.toString() ? '?' + newSearchParams.toString() : '');
      window.history.replaceState({}, document.title, newUrl);
    }
    initialize();
  }, [initialize, location.pathname, location.search]);

  const formatDateWithTime = (dateString) => {
    if (!dateString) return '';
    const date = dateStringToPacificStartOfDay(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'America/Los_Angeles'
    }) + ' at 11:59 PM PT';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = dateStringToPacificStartOfDay(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'America/Los_Angeles'
    });
  };

  const getActiveCyclePass = () => {
    if (!cyclePasses) return null;
    return cyclePasses.find(pass =>
      pass.status === 'active' &&
      pass.redemptions_remaining > 0 &&
      new Date(pass.expires_at) > new Date()
    );
  };

  const getCurrentCycleApplication = () => {
    if (!currentCycle || !applications) return null;
    return applications.find(app => app.cycle_id === currentCycle.id);
  };

  const getCycleStatus = (cycle) => {
    const nowPT = getCurrentPacificTime();
    const startDate = dateStringToPacificStartOfDay(cycle.start_date);
    const endDate = dateStringToPacificEndOfDay(cycle.end_date);
    const announceDate = dateStringToPacificEndOfDay(cycle.announce_by);

    if (nowPT > announceDate) return { text: "Completed", color: "bg-gray-100 text-gray-800", icon: CheckCircle2 };
    if (nowPT > endDate) return { text: "Reviewing", color: "bg-purple-100 text-purple-800", icon: Clock };
    if (nowPT >= startDate && cycle.is_open_for_submissions) return { text: "Open", color: "bg-green-100 text-green-800", icon: CheckCircle2 };
    if (nowPT >= startDate && !cycle.is_open_for_submissions) return { text: "Closed", color: "bg-red-100 text-red-800", icon: XCircle };
    return { text: "Upcoming", color: "bg-blue-100 text-blue-800", icon: Calendar };
  };

  const getPastCyclesWithApplications = () => {
    if (!applications || !allCycles || !currentCycle) return [];

    const nowPT = getCurrentPacificTime();

    const pastCyclesWithApps = allCycles
      .filter(cycle => {
        if (cycle.id === currentCycle.id) {
          return false;
        }

        const endDate = dateStringToPacificEndOfDay(cycle.end_date);
        const hasPassed = nowPT > endDate;
        const hasApplication = applications.some(app => app.cycle_id === cycle.id);
        return hasPassed && hasApplication;
      })
      .map(cycle => {
        const app = applications.find(app => app.cycle_id === cycle.id);
        return { cycle, application: app };
      })
      .filter(item => item.application);

    return pastCyclesWithApps;
  };

  const isAdmin = user?.role === 'admin';
  const viewAsApplicant = new URLSearchParams(location.search).get('view') === 'applicant';

  const getApplicantLink = (page) => {
    return createPageUrl(page) + (isAdmin && viewAsApplicant ? '?view=applicant' : '');
  };

  const handlePreviewApplication = (app) => {
    setPreviewApplication(app);
    setShowPreviewDialog(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const dashboardUser = impersonatedUser || user;
  const pastCyclesWithApps = getPastCyclesWithApplications();

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 px-4 sm:py-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          {impersonatedUser && (
            <Alert className="mb-6 border-yellow-200 bg-yellow-50">
              <Shield className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                You are viewing the dashboard as <strong>{impersonatedUser.first_name && impersonatedUser.last_name ? `${impersonatedUser.first_name} ${impersonatedUser.last_name}` : impersonatedUser.full_name}</strong>.
              </AlertDescription>
            </Alert>
          )}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-600 rounded-full flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {dashboardUser?.first_name || dashboardUser?.full_name?.split(' ')[0] || 'there'}
              </h1>
              <p className="text-gray-600">Manage your grant applications and track your journey</p>
            </div>
          </div>
        </div>

        {showSubmissionSuccess && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Application submitted successfully!</strong> Thank you for sharing your story with us.
              We'll review it and announce results by the date shown below.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {currentCycle ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Current Cycle: {currentCycle.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Submissions close:</span>
                        <br />
                        <span className="font-medium">{formatDateWithTime(currentCycle.end_date)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Results announced by:</span>
                        <br />
                        <span className="font-medium">{formatDate(currentCycle.announce_by)}</span>
                      </div>
                    </div>
                    {(() => {
                      const currentApp = getCurrentCycleApplication();
                      const nowPT = getCurrentPacificTime();
                      const endDate = dateStringToPacificEndOfDay(currentCycle.end_date);
                      const isCycleClosed = nowPT > endDate;

                      if (!currentApp) {
                        if (isCycleClosed) {
                          return (
                            <div className="border-t pt-4 mt-4">
                              <Alert className="border-orange-200 bg-orange-50">
                                <Clock className="h-4 w-4 text-orange-600" />
                                <AlertDescription className="text-orange-800">
                                  <strong>This cycle has closed.</strong> Applications are no longer being accepted for {currentCycle.name}.
                                  Winners will be announced by {formatDate(currentCycle.announce_by)}.
                                </AlertDescription>
                              </Alert>
                            </div>
                          );
                        }

                        return (
                          <div className="border-t pt-4 mt-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">Ready to apply?</p>
                                <p className="text-sm text-gray-600">Start your application for this cycle</p>
                              </div>
                              <Link to={getApplicantLink("Apply")}>
                                <Button className="bg-rose-600 hover:bg-rose-700">
                                  <Plus className="w-4 h-4 mr-2" /> Start Application
                                </Button>
                              </Link>
                            </div>
                          </div>
                        );
                      } else {
                        const config = STATUS_CONFIG[currentApp.status] || STATUS_CONFIG['draft'];
                        const StatusIcon = config.icon;
                        return (
                          <div className="border-t pt-4 mt-4">
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <StatusIcon className="w-6 h-6 text-gray-600" />
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-gray-900">Your Application</span>
                                      <Badge className={config.color}>{config.title}</Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">{config.description}</p>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                                <div>
                                  <span className="text-gray-500">Submitted:</span>
                                  <div className="font-medium text-gray-900">
                                    {new Date(currentApp.created_date).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-gray-500">Application ID:</span>
                                  <div className="font-medium text-gray-900">
                                    #{currentApp.anonymized_id || currentApp.id.slice(-6)}
                                  </div>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handlePreviewApplication(currentApp)}
                                  className="flex-1"
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Review Application
                                </Button>
                                {currentApp.status === 'draft' && !isCycleClosed && (
                                  <Link to={getApplicantLink("Apply")} className="flex-1">
                                    <Button variant="default" size="sm" className="w-full">
                                      <Edit3 className="w-4 h-4 mr-2" />
                                      Continue Editing
                                    </Button>
                                  </Link>
                                )}
                              </div>

                              {(currentApp.status === 'under_review' || currentApp.status === 'submitted' || currentApp.status === 'finalist') && (
                                <p className="text-xs text-gray-500 mt-3 text-center">
                                  Expected announcement: {formatDate(currentCycle.announce_by)}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      }
                    })()}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>No application cycles are currently open. Check back soon!</AlertDescription>
              </Alert>
            )}

            {pastCyclesWithApps.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gray-600" />
                    Previous Cycle Applications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pastCyclesWithApps.map(({ cycle, application }) => {
                      const config = STATUS_CONFIG[application.status] || STATUS_CONFIG['draft'];
                      const StatusIcon = config.icon;
                      const cycleStatus = getCycleStatus(cycle);

                      return (
                        <div key={cycle.id} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-gray-900">{cycle.name}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={cycleStatus.color} variant="outline">
                                  {cycleStatus.text}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  Results by: {formatDate(cycle.announce_by)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 pt-3 border-t">
                            <StatusIcon className="w-4 h-4 text-gray-600" />
                            <div className="flex-grow">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900">Your Application</span>
                                <Badge className={config.color}>{config.title}</Badge>
                              </div>
                              <p className="text-xs text-gray-600 mt-1">{config.description}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Submitted: {new Date(application.created_date).toLocaleDateString()}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePreviewApplication(application)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Review
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            {(() => {
              const activePass = getActiveCyclePass();
              if (activePass) {
                return (
                  <Card className="border-green-200 bg-green-50">
                    <CardHeader><CardTitle className="flex items-center gap-2 text-green-900"><CheckCircle2 className="w-5 h-5 text-green-600" />Four-Cycle Pass Active</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm"><span className="text-green-700">Redemptions remaining:</span><span className="font-medium text-green-900">{activePass.redemptions_remaining}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-green-700">Expires:</span><span className="font-medium text-green-900">{new Date(activePass.expires_at).toLocaleDateString()}</span></div>
                        <Progress value={(4 - activePass.redemptions_remaining) / 4 * 100} className="h-2" />
                        <p className="text-xs text-green-600">You can apply in {activePass.redemptions_remaining} more cycle{activePass.redemptions_remaining !== 1 ? 's' : ''}.</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              } else {
                return (
                  <Card className="border-blue-200 bg-blue-50">
                    <CardHeader><CardTitle className="flex items-center gap-2 text-blue-900"><Clock className="w-5 h-5 text-blue-600" />Get a Four-Cycle Pass</CardTitle></CardHeader>
                    <CardContent>
                      <p className="text-sm text-blue-800 mb-4">Save money and apply in up to four quarterly cycles over the next year.</p>
                      <Link to={createPageUrl("Apply")}>
                        <Button variant="outline" className="w-full border-blue-300 text-blue-800 hover:bg-blue-100">Buy a Pass for $250</Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              }
            })()}

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Gift className="w-5 h-5 text-rose-600" />Share Some Hope</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">Pre-pay an application fee for a loved one to help them start their journey.</p>
                <Link to={createPageUrl("Gift")}><Button variant="outline" className="w-full">Nominate & Pre-pay</Button></Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {previewApplication && (
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl mb-2">Your Application</DialogTitle>
              <DialogDescription>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge className={STATUS_CONFIG[previewApplication.status]?.color}>
                      {STATUS_CONFIG[previewApplication.status]?.title}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      Application ID: #{previewApplication.anonymized_id || previewApplication.id.slice(-6)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Submitted: {new Date(previewApplication.created_date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>
            
            {previewApplication.form_data && (
              <div className="space-y-6 pt-4">
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

                <section className="space-y-3">
                  <h3 className="font-semibold text-lg border-b pb-2">Your Journey</h3>
                  
                  {previewApplication.form_data.submission_type_written && (
                    <div>
                      <h4 className="font-medium mb-2 text-blue-600">Written Story</h4>
                      <div 
                        className="prose prose-sm max-w-none bg-gray-50 rounded-md p-4 border"
                        dangerouslySetInnerHTML={{ __html: previewApplication.form_data.your_journey || '<p class="text-gray-500">No story provided.</p>' }}
                      />
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
                </section>

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
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}