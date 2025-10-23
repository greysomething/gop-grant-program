import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Eye, Shield } from 'lucide-react';
import {
  Search,
  Building2,
  Users,
  ShieldCheck,
  BarChart3,
  ArrowLeft,
  Plus,
  LogIn,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Upload,
  Menu,
  X,
  Image as ImageIcon,
  Crown,
  CreditCard,
  Settings,
  UserCog,
  Palette,
  Rocket,
  ShoppingBag,
  Mail
} from 'lucide-react';
import { User } from '@/api/entities';
import Sidebar from '@/components/layout/Sidebar';

function PublicHeader({ onLoginClick, handleLogout, isAuthenticated, userRole }) {
  const [showMoreDropdown, setShowMoreDropdown] = React.useState(false);
  const [showGetInvolvedSubmenu, setShowGetInvolvedSubmenu] = React.useState(false);
  const [showMobileMenu, setShowMobileMenu] = React.useState(false);

  React.useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showMobileMenu]);

  const getDashboardUrl = () => {
    if (userRole === 'admin') {
      return createPageUrl("Admin");
    }
    return createPageUrl("Dashboard");
  };

  const handleMobileMenuClose = () => {
    setShowMobileMenu(false);
  };

  return (
    <header className="bg-orange-500 px-4 md:px-6 h-[68px] flex items-center fixed top-0 left-0 right-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center w-full">
        <a href="https://giftofparenthood.org" target="_blank" rel="noopener noreferrer">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68c454689023af7be794a4cf/05bd4e20e_giftofparenthood_logo_24WHT.png"
            alt="Gift of Parenthood"
            className="h-6 md:h-8"
          />
        </a>

        <nav className="hidden md:flex items-center space-x-8" style={{ fontFamily: 'Poppins, sans-serif' }}>
          <a
            href="https://giftofparenthood.org/new-fundraiser/"
            className="text-white hover:text-orange-100 transition-colors font-medium"
          >
            Start a Fundraiser
          </a>
          <a
            href="http://directory.giftofparenthood.org/"
            className="text-white hover:text-orange-100 transition-colors font-medium"
          >
            Find a Provider
          </a>
          <a
            href="https://giftofparenthood.org/grant/"
            className="text-white hover:text-orange-100 transition-colors font-medium"
          >
            Grant Program
          </a>

          <div className="relative">
            <button
              onClick={() => setShowMoreDropdown(!showMoreDropdown)}
              className="flex items-center text-white hover:text-orange-100 transition-colors font-medium"
            >
              More
              <ChevronDown className="w-4 h-4 ml-1" />
            </button>

            {showMoreDropdown && (
              <div
                className="absolute top-full right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-2 z-50 text-slate-700"
                style={{ fontFamily: 'Poppins, sans-serif' }}
                onMouseLeave={() => {
                  setShowMoreDropdown(false);
                  setShowGetInvolvedSubmenu(false);
                }}
              >
                <a
                  href="https://giftofparenthood.org/browse-featured-fundraisers/"
                  className="block px-4 py-2 hover:bg-slate-100"
                  onClick={() => setShowMoreDropdown(false)}
                >
                  Fundraisers
                </a>
                <a
                  href="https://giftofparenthood.org/about-us/"
                  className="block px-4 py-2 hover:bg-slate-100"
                  onClick={() => setShowMoreDropdown(false)}
                >
                  About Gift of Parenthood
                </a>

                <div className="relative">
                  <button
                    onMouseEnter={() => setShowGetInvolvedSubmenu(true)}
                    className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-100"
                  >
                    Get Involved
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {showGetInvolvedSubmenu && (
                    <div
                      className="absolute left-full top-0 ml-1 w-56 bg-white rounded-md shadow-lg py-2 border"
                      onMouseLeave={() => setShowGetInvolvedSubmenu(false)}
                    >
                      <a
                        href="https://giftofparenthood.org/partnerships/"
                        className="block px-4 py-2 hover:bg-slate-100"
                        onClick={() => {setShowMoreDropdown(false); setShowGetInvolvedSubmenu(false);}}
                      >
                        Partnerships
                      </a>
                      <a
                        href="https://giftofparenthood.org/donate"
                        className="block px-4 py-2 hover:bg-slate-100"
                        onClick={() => {setShowMoreDropdown(false); setShowGetInvolvedSubmenu(false);}}
                      >
                        Giving to Gift of Parenthood
                      </a>
                    </div>
                  )}
                </div>

                <a
                  href="https://giftofparenthood.org/support/"
                  className="block px-4 py-2 hover:bg-slate-100"
                  onClick={() => setShowMoreDropdown(false)}
                >
                  Help Center
                </a>
                <a
                  href="https://giftofparenthood.org/contact/"
                  className="block px-4 py-2 hover:bg-slate-100"
                  onClick={() => setShowMoreDropdown(false)}
                >
                  Contact
                </a>

                {!isAuthenticated && (
                  <a
                    href="https://giftofparenthood.org/login/?redirect_to=https://giftofparenthood.org/cf-dashboard/"
                    className="block px-4 py-2 hover:bg-slate-100 font-medium"
                    onClick={() => setShowMoreDropdown(false)}
                  >
                    Fundraiser Login
                  </a>
                )}

                {isAuthenticated && (
                  <>
                    <div className="border-t my-2 border-slate-100"></div>
                    <Link to={getDashboardUrl()} className="block px-4 py-2 hover:bg-slate-100" onClick={() => setShowMoreDropdown(false)}>Dashboard</Link>
                    <button
                      onClick={() => { setShowMoreDropdown(false); handleLogout(); }}
                      className="block w-full text-left px-4 py-2 hover:bg-slate-100 text-red-600 font-medium"
                    >
                      Logout
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </nav>

        <div className="md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="text-white hover:bg-white/20"
          >
            {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </div>

      {showMobileMenu && (
        <div className="md:hidden fixed inset-0 top-[68px] bg-white z-40 overflow-y-auto" style={{ fontFamily: 'Poppins, sans-serif' }}>
          <div className="h-full overflow-y-auto">
            <div className="p-6 space-y-4 min-h-full">
              <a
                href="https://giftofparenthood.org/new-fundraiser/"
                className="block py-3 text-lg font-medium text-slate-700 hover:text-orange-500 border-b border-slate-200"
                onClick={handleMobileMenuClose}
              >
                Start a Fundraiser
              </a>
              <a
                href="http://directory.giftofparenthood.org/"
                className="block py-3 text-lg font-medium text-slate-700 hover:text-orange-500 border-b border-slate-200"
                onClick={handleMobileMenuClose}
              >
                Find a Provider
              </a>
              <a
                href="https://giftofparenthood.org/grant/"
                className="block py-3 text-lg font-medium text-slate-700 hover:text-orange-500 border-b border-slate-200"
                onClick={handleMobileMenuClose}
              >
                Grant Program
              </a>

              <a
                href="https://giftofparenthood.org/browse-featured-fundraisers/"
                className="block py-3 text-lg font-medium text-slate-700 hover:text-orange-500 border-b border-slate-200"
                onClick={handleMobileMenuClose}
              >
                Fundraisers
              </a>
              <a
                href="https://giftofparenthood.org/about-us/"
                className="block py-3 text-lg font-medium text-slate-700 hover:text-orange-500 border-b border-slate-200"
                onClick={handleMobileMenuClose}
              >
                About Gift of Parenthood
              </a>
              <a
                href="https://giftofparenthood.org/partnerships/"
                className="block py-3 text-lg font-medium text-slate-700 hover:text-orange-500 border-b border-slate-200"
                onClick={handleMobileMenuClose}
              >
                Partnerships
              </a>
              <a
                href="https://giftofparenthood.org/donate"
                className="block py-3 text-lg font-medium text-slate-700 hover:text-orange-500 border-b border-slate-200"
                onClick={handleMobileMenuClose}
              >
                Giving to Gift of Parenthood
              </a>
              <a
                href="https://giftofparenthood.org/support/"
                className="block py-3 text-lg font-medium text-slate-700 hover:text-orange-500 border-b border-slate-200"
                onClick={handleMobileMenuClose}
              >
                Help Center
              </a>
              <a
                href="https://giftofparenthood.org/contact/"
                className="block py-3 text-lg font-medium text-slate-700 hover:text-orange-500 border-b border-slate-200"
                onClick={handleMobileMenuClose}
              >
                Contact
              </a>

              {!isAuthenticated ? (
                <>
                  <a
                    href="https://giftofparenthood.org/login/?redirect_to=https://giftofparenthood.org/cf-dashboard/"
                    className="block py-3 text-lg font-medium text-slate-700 hover:text-orange-500 border-b border-slate-200"
                    onClick={handleMobileMenuClose}
                  >
                    Fundraiser Login
                  </a>
                  <Link
                    to={createPageUrl("Home")}
                    className="block py-3 text-lg font-medium text-slate-700 hover:text-orange-500 border-b border-slate-200"
                    onClick={handleMobileMenuClose}
                  >
                    Grant Application
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to={getDashboardUrl()}
                    className="block py-3 text-lg font-medium text-slate-700 hover:text-orange-500 border-b border-slate-200"
                    onClick={handleMobileMenuClose}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => { handleMobileMenuClose(); handleLogout(); }}
                    className="block w-full text-left py-3 text-lg font-medium text-red-600 hover:text-red-700 border-b border-slate-200"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default function Layout({ children, currentPageName }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  const viewMode = React.useMemo(() => {
    const params = new URLSearchParams(location.search);
    const view = params.get('view');
    if (view === 'applicant') return 'applicant';
    if (view === 'visitor') return 'visitor';
    return 'admin';
  }, [location.search]);

  const viewAsApplicant = viewMode === 'applicant';
  const viewAsVisitor = viewMode === 'visitor';

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (error) {
        setCurrentUser(null);
      } finally {
        setIsLoadingUser(false);
      }
    };
    fetchUser();
  }, []);

  const handleLogin = async () => {
    window.location.href = createPageUrl("Login");
  };

  const handleLogout = async () => {
    await User.logout();
    setCurrentUser(null);
    window.location.href = createPageUrl("Home");
  };

  const handleViewModeChange = (newMode) => {
    if (newMode === 'admin') {
      window.location.href = createPageUrl('Admin');
    } else {
      window.location.href = createPageUrl('Home') + `?view=${newMode}`;
    }
  };

  const isAdmin = currentUser?.role === 'admin';
  const onAdminPage = currentPageName?.startsWith('Admin');
  const showSidebar = !!currentUser && !viewAsVisitor;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;700;800&display=swap');
        body { font-family: 'Inter', sans-serif; }
      `}</style>
      
      {/* Use the consistent header from other app */}
      <PublicHeader 
        onLoginClick={handleLogin}
        handleLogout={handleLogout}
        isAuthenticated={!!currentUser}
        userRole={currentUser?.role || 'user'}
      />

      {showSidebar && (
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          currentUser={currentUser}
          isAdmin={isAdmin}
          viewMode={viewMode}
          onAdminPage={onAdminPage}
          handleLogout={handleLogout}
          handleViewModeChange={handleViewModeChange}
          currentPageName={currentPageName}
        />
      )}
      
      <div className={`transition-all duration-300 ease-in-out ${showSidebar ? (isSidebarOpen ? 'ml-64' : 'ml-20') : 'ml-0'}`} style={{ paddingTop: '68px' }}>
        {isAdmin && viewMode !== 'admin' && (
          <div className={`border-b sticky top-[68px] z-20 ${viewMode === 'applicant' ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'}`}>
            <div className="py-2 text-center">
              <div className={`flex items-center justify-center gap-2 ${viewMode === 'applicant' ? 'text-yellow-800' : 'text-blue-800'}`}>
                <Eye className="w-4 h-4" />
                <span className="text-sm font-medium">
                  You are viewing as {viewMode === 'applicant' ? 'an applicant' : 'a visitor'}
                </span>
              </div>
            </div>
          </div>
        )}

        <main>
          {children}
        </main>
        
        <footer className="bg-gray-800 text-white py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Gift of Parenthood</h3>
                <p className="text-gray-300 text-sm">
                  Supporting families on their journey to parenthood through thoughtful grant assistance.
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider">Quick Links</h4>
                <ul className="space-y-2">
                  <li><Link to={createPageUrl("Timeline")} className="text-gray-300 hover:text-white text-sm">Timeline</Link></li>
                  <li><Link to={createPageUrl("PastRecipients")} className="text-gray-300 hover:text-white text-sm">Past Recipients</Link></li>
                  <li><Link to={createPageUrl("FAQs")} className="text-gray-300 hover:text-white text-sm">FAQs</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider">Support</h4>
                <ul className="space-y-2">
                  <li><Link to={createPageUrl("Contact")} className="text-gray-300 hover:text-white text-sm">Contact Us</Link></li>
                  <li><Link to={createPageUrl("Terms")} className="text-gray-300 hover:text-white text-sm">Terms & Privacy</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-700 mt-8 pt-8 text-center">
              <p className="text-gray-300 text-sm">
                &copy; 2024 Gift of Parenthood. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}