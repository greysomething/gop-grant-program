
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User } from '@/api/entities';
import { Cycle } from '@/api/entities';
import { Announcement } from '@/api/entities';
import { HomePageContent } from '@/api/entities';
import { createPageUrl } from '@/utils';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Check,
  Gift,
  Users,
  Calendar,
  Clock,
  FileText,
  CreditCard,
  Award,
  ArrowRight,
  Star,
  Sprout,
  Sun
} from 'lucide-react';
import { getCurrentPacificTime, dateStringToPacificStartOfDay, dateStringToPacificEndOfDay } from '@/components/lib/timezone';
import CountdownTimer from '@/components/home/CountdownTimer';

// Default content fallbacks
const DEFAULT_CONTENT = {
  hero_heading: "Hope belongs here.",
  hero_paragraph: "The Gift of Parenthood Grant helps families build, grow, and support their dreams—with dignity and clarity. Apply during our quarterly cycle, share your story, and let our advisory board thoughtfully review your plan.",
  hero_primary_button: "Apply Now",
  hero_secondary_button: "View Process Timeline",
  hero_bg_image: "https://images.unsplash.com/photo-1516589178581/6cd7833ae3b2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=80",
  hero_bg_opacity: "40", // Default opacity value added here
  how_it_works_title: "How It Works",
  how_it_works_subtitle: "Our simple, transparent process puts families first. Here's how to get started on your journey.",
  application_plans_title: "Choose Your Application Plan",
  real_families_title: "Real Families, Real Hope",
  share_hope_title: "Share Some Hope",
  final_cta_title: "Ready to Begin Your Journey?",
  final_cta_subtitle: "Join hundreds of families who have found hope and support through the Gift of Parenthood Grant program."
};

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [currentCycle, setCurrentCycle] = useState(null);
  const [featuredStory, setFeaturedStory] = useState(null);
  const [homeContent, setHomeContent] = useState(null); // Initialize with null to prevent flash of defaults
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [userCheckComplete, setUserCheckComplete] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const loadContent = async () => {
      try {
        const contentItems = await HomePageContent.list();
        const contentMap = {};
        contentItems.forEach(item => {
          contentMap[item.content_key] = item.content_value;
        });
        
        // Merge custom content with defaults to ensure all keys are present
        setHomeContent({ ...DEFAULT_CONTENT, ...contentMap });

        const openCycles = await Cycle.filter({ is_open_for_submissions: true }, '-start_date', 1);
        if (openCycles.length > 0) {
          setCurrentCycle(openCycles[0]);
        } else {
          const upcomingCycles = await Cycle.list('-start_date', 1);
          if (upcomingCycles.length > 0) {
            setCurrentCycle(upcomingCycles[0]);
          }
        }

        const recipientAnnouncements = await Announcement.filter({
          status: 'published',
          category: 'recipients',
          featured: true
        }, '-publication_date', 1);

        if (recipientAnnouncements.length > 0) {
          setFeaturedStory(recipientAnnouncements[0]);
        }
      } catch (error) {
        console.error('Failed to load content:', error);
        // Use defaults if loading fails
        setHomeContent(DEFAULT_CONTENT);
      }
      setIsLoadingContent(false);
    };

    const checkUser = async () => {
      try {
        const u = await User.me();
        setUser(u);
      } catch (e) {
        setUser(null);
      }
      setUserCheckComplete(true);
    };

    loadContent();
    checkUser();
  }, []);

  const handleLogin = async () => {
    if (userCheckComplete) {
      if (!user) {
        await User.login();
      }
    } else {
      await User.login();
    }
  };

  const handleLogout = async () => {
    await User.logout();
    window.location.reload();
  };

  const isAdmin = user?.role === 'admin';
  const viewAsApplicant = new URLSearchParams(location.search).get('view') === 'applicant';

  const getApplicantLink = (page) => {
    return createPageUrl(page) + (isAdmin && viewAsApplicant ? '?view=applicant' : '');
  };

  const getCycleStatus = () => {
    if (!currentCycle) return null;

    const nowPT = getCurrentPacificTime();
    const startDate = dateStringToPacificStartOfDay(currentCycle.start_date);
    const endDate = dateStringToPacificEndOfDay(currentCycle.end_date);

    // This creates a Date object from the date string.
    // .toLocaleDateString with timeZone will then correctly display it.
    const displayEndDate = new Date(currentCycle.end_date);
    const endDateFormatted = displayEndDate.toLocaleDateString('en-US', {
      timeZone: 'America/Los_Angeles',
      month: 'numeric',
      day: 'numeric',
      year: 'numeric'
    });

    if (currentCycle.is_open_for_submissions && nowPT >= startDate && nowPT <= endDate) {
      return {
        status: 'open',
        title: 'Submissions Now Open!',
        subtitle: `Apply for the ${currentCycle.name} grant cycle`,
        deadline: `Applications close ${endDateFormatted} at 11:59 PM PT`,
        color: 'bg-green-100 text-green-800 border-green-200'
      };
    } else if (nowPT < startDate) {
      const displayStartDate = new Date(currentCycle.start_date);
      const startDateFormatted = displayStartDate.toLocaleDateString('en-US', {
        timeZone: 'America/Los_Angeles',
        month: 'numeric',
        day: 'numeric',
        year: 'numeric'
      });
      return {
        status: 'upcoming',
        title: 'Next Cycle Coming Soon',
        subtitle: `${currentCycle.name} opens ${startDateFormatted}`,
        deadline: `Applications will be accepted starting ${startDateFormatted} at 12:00 AM PT`,
        color: 'bg-blue-100 text-blue-800 border-blue-200'
      };
    } else {
      const displayAnnounceDate = new Date(currentCycle.announce_by);
      const announceByFormatted = displayAnnounceDate.toLocaleDateString('en-US', {
        timeZone: 'America/Los_Angeles',
        month: 'numeric',
        day: 'numeric',
        year: 'numeric'
      });
      return {
        status: 'closed',
        title: 'Applications Closed',
        subtitle: `${currentCycle.name} review in progress`,
        deadline: `Results announced by ${announceByFormatted}`,
        color: 'bg-orange-100 text-orange-800 border-orange-200'
      };
    }
  };

  const cycleStatus = getCycleStatus();

  const handleApplyClick = async () => {
    // Always redirect to ApplyEntry page which will handle authentication check
    window.location.href = createPageUrl("ApplyEntry");
  };

  // Show loading state while content is being fetched
  if (isLoadingContent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  const heroBgOpacity = homeContent.hero_bg_opacity || '40';
  const overlayOpacity = parseInt(heroBgOpacity) / 100;

  // Render the page content only when homeContent is loaded
  // homeContent is guaranteed to be non-null here, either from API or DEFAULT_CONTENT
  return (
    <>
      <div
        className="relative min-h-screen w-full flex items-center justify-center text-center overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, ${overlayOpacity}), rgba(0, 0, 0, ${overlayOpacity})), url('${homeContent.hero_bg_image}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Auth links in top right corner - converted to links */}
        <div className="absolute top-6 right-6 z-20 flex items-center gap-4">
          {user ? (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleLogout();
              }}
              className="text-white hover:text-orange-100 font-medium transition-colors underline hover:no-underline"
            >
              Sign Out
            </a>
          ) : (
            <>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleLogin();
                }}
                className="text-white hover:text-orange-100 font-medium transition-colors underline hover:no-underline"
              >
                Sign In
              </a>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleLogin();
                }}
                className="text-white hover:text-orange-100 font-medium transition-colors underline hover:no-underline"
              >
                Sign Up
              </a>
            </>
          )}
        </div>

        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-40 h-30 bg-white/10 rounded-full transform rotate-12 blur-lg"></div>
          <div className="absolute bottom-1/4 right-1/4 w-32 h-24 bg-rose-500/20 rounded-full transform -rotate-6 blur-lg"></div>
        </div>

        <div className="relative z-10 text-white max-w-5xl mx-auto px-4">
          {/* Removed Heart icon */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 drop-shadow-lg">
            {homeContent.hero_heading}
          </h1>
          <p className="mt-4 max-w-4xl mx-auto text-xl md:text-2xl leading-relaxed mb-8 text-white/95 drop-shadow-sm">
            {homeContent.hero_paragraph}
          </p>

          {/* Only render cycle status if it's available (i.e., currentCycle is loaded) */}
          {currentCycle && cycleStatus && (
            <div className="mb-6">
              <Card className={`max-w-lg mx-auto border-2 ${cycleStatus.color} bg-white/95 backdrop-blur-sm shadow-xl`}>
                <CardContent className="p-6 text-center">
                  <h3 className="text-2xl font-bold mb-2 text-gray-800">{cycleStatus.title}</h3>
                  <p className="text-lg font-medium mb-2 text-gray-700">{cycleStatus.subtitle}</p>
                  <p className="text-sm text-gray-600">{cycleStatus.deadline}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Countdown Timer - Only show if cycle is open, positioned below status card */}
          {currentCycle && cycleStatus?.status === 'open' && (
            <div className="mb-8">
              <CountdownTimer
                endDate={currentCycle.end_date}
                title="TIME REMAINING:"
              />
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button 
              size="lg" 
              onClick={handleApplyClick} 
              className="bg-rose-600 hover:bg-rose-700 text-xl px-10 shadow-lg hover:shadow-xl transition-all duration-200 h-14"
            >
              {currentCycle && cycleStatus?.status === 'open' ? homeContent.hero_primary_button : 'Learn About Applying'}
              <ArrowRight className="ml-2 h-6 w-6" />
            </Button>
            <Link to={getApplicantLink("Timeline")}>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-xl px-10 bg-white/90 hover:bg-white text-gray-800 border-white shadow-lg hover:shadow-xl transition-all duration-200 h-14 w-full sm:w-auto"
              >
                {homeContent.hero_secondary_button}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Rest of the content loads as data becomes available, using homeContent for titles/subtitles */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <section className="py-16 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-rose-50/50 to-orange-50/50 rounded-3xl"></div>
          <div className="relative z-10">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{homeContent.how_it_works_title}</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                {homeContent.how_it_works_subtitle}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <div className="text-center group">
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-rose-100 to-rose-200 rounded-full group-hover:scale-110 transition-transform duration-200"></div>
                  <div className="relative flex items-center justify-center w-full h-full">
                    <FileText className="w-10 h-10 text-rose-600" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800">1. Apply Online</h3>
                <p className="text-gray-600 leading-relaxed">
                  Complete our thoughtful application form. Share your story, your journey, and your dreams with our review board.
                </p>
              </div>

              <div className="text-center group">
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full group-hover:scale-110 transition-transform duration-200"></div>
                  <div className="relative flex items-center justify-center w-full h-full">
                    <Users className="w-10 h-10 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800">2. Board Review</h3>
                <p className="text-gray-600 leading-relaxed">
                  Our advisory board carefully reviews each application with empathy and expertise during the quarterly cycle.
                </p>
              </div>

              <div className="text-center group">
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-green-200 rounded-full group-hover:scale-110 transition-transform duration-200"></div>
                  <div className="relative flex items-center justify-center w-full h-full">
                    <Award className="w-10 h-10 text-green-600" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800">3. Grant Awarded</h3>
                <p className="text-gray-600 leading-relaxed">
                  Recipients are notified and receive their grant to support their family-building journey with dignity.
                </p>
              </div>
            </div>

            <div className="max-w-4xl mx-auto">
              <h3 className="text-2xl font-bold text-center mb-8 text-gray-800">{homeContent.application_plans_title}</h3>
              <div className="grid md:grid-cols-2 gap-8">
                <Card className="relative overflow-hidden border-2 border-gray-200 hover:border-rose-300 transition-all duration-200 hover:shadow-lg">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-rose-100 to-rose-200 rounded-full transform translate-x-8 -translate-y-8 opacity-50"></div>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between relative z-10">
                      Single-Cycle Application
                      <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-300">$75</Badge>
                    </CardTitle>
                    <CardDescription>Perfect for trying out our process</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-gray-600 leading-relaxed">Apply for one quarterly review cycle. This fee supports our platform and thorough review process.</p>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-green-600" />
                        </div>
                        <span>One application submission</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-green-600" />
                        </div>
                        <span>Considered in the next open cycle</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-green-600" />
                        </div>
                        <span>Full board review process</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-2 border-rose-300 bg-gradient-to-br from-rose-50 to-orange-50 relative overflow-hidden hover:shadow-lg transition-all duration-200">
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                    <Badge className="bg-rose-600 text-white shadow-lg">Best Value</Badge>
                  </div>
                  <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-rose-200 to-orange-200 rounded-full transform -translate-x-8 -translate-y-8 opacity-30"></div>
                  <CardHeader className="relative z-10">
                    <CardTitle className="flex items-center justify-between">
                      Four-Cycle Pass
                      <Badge variant="outline" className="bg-white text-rose-700 border-rose-300">$250</Badge>
                    </CardTitle>
                    <CardDescription className="text-rose-700">Most popular option for dedicated families</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-gray-700 leading-relaxed">Apply up to four times over a 12-month period. Save money and increase your chances.</p>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-green-600" />
                        </div>
                        <span>Four application submissions</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-green-600" />
                        </div>
                        <span>Valid for any 4 cycles within a year</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-green-600" />
                        </div>
                        <span>Save $50 compared to individual applications</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-green-600" />
                        </div>
                        <span>Priority consideration for multiple cycles</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {featuredStory && ( // Conditionally render featured story section only when data is loaded
          <section className="py-16 relative">
            <div
              className="absolute inset-0 rounded-3xl"
              style={{
                backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9)), url('https://images.unsplash.com/photo-1559827260-dc66d52bef19?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=80')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            ></div>
            <div className="relative z-10">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">{homeContent.real_families_title}</h2>
                <p className="text-lg text-gray-600">
                  Every grant represents a family's dream coming true. Here's one of their stories.
                </p>
              </div>

              <Card className="max-w-4xl mx-auto bg-white/95 backdrop-blur-sm shadow-xl border-0">
                <CardContent className="p-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <Badge className="bg-green-100 text-green-800 border-green-200">Grant Recipient</Badge>
                  </div>
                  <h3 className="text-2xl font-semibold mb-4 text-gray-800">{featuredStory.title}</h3>
                  {featuredStory.excerpt && (
                    <p className="text-gray-600 text-xl italic mb-6 leading-relaxed">"{featuredStory.excerpt}"</p>
                  )}
                  <Link to={createPageUrl("PastRecipients")} className="inline-flex items-center text-rose-600 hover:text-rose-700 font-medium text-lg group">
                    Read more success stories
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        <section className="py-16">
          <Card className="bg-gradient-to-r from-rose-50 to-pink-50 border-2 border-rose-200 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-200/30 rounded-full transform translate-x-16 -translate-y-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-pink-200/30 rounded-full transform -translate-x-12 translate-y-12"></div>
            <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8 relative z-10">
              <div className="w-20 h-20 bg-gradient-to-br from-rose-500 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                <Gift className="w-10 h-10 text-white" />
              </div>
              <div className="text-center md:text-left flex-grow">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{homeContent.share_hope_title}</h3>
                <p className="text-gray-700 text-lg leading-relaxed">
                  Pre-pay an application fee for a loved one so they can apply this quarter—or for the next four quarters.
                  It's a meaningful way to support their family-building journey.
                </p>
              </div>
              <Link to={getApplicantLink("Gift")} className="flex-shrink-0">
                <Button variant="outline" className="bg-white hover:bg-rose-50 border-rose-300 text-rose-700 shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3">
                  Nominate a Loved One
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>

        <section className="py-20 text-center relative">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-rose-50 rounded-3xl opacity-50"></div>
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{homeContent.final_cta_title}</h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              {homeContent.final_cta_subtitle}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg" onClick={handleApplyClick} className="bg-rose-600 hover:bg-rose-700 shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-4">
                Start Your Application
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Link to={getApplicantLink("FAQs")}>
                <Button size="lg" variant="outline" className="border-2 border-rose-300 text-rose-700 hover:bg-rose-50 shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-4">
                  Have Questions?
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
