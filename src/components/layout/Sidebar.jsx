import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import {
  LayoutGrid,
  Calendar,
  Award,
  HelpCircle,
  LayoutDashboard,
  Users,
  FileText,
  RefreshCw,
  CreditCard,
  Ticket,
  Gift,
  Mail,
  Megaphone,
  BarChart3,
  ChevronsLeft,
  LogOut,
  Eye,
  Shield,
  ChevronsRight,
  MoreHorizontal,
  User as UserIcon,
  Palette
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const adminNavItems = [
  { href: "Admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "AdminUsers", icon: Users, label: "Users" },
  { href: "AdminApplications", icon: FileText, label: "Applications" },
  { href: "AdminCycles", icon: RefreshCw, label: "Cycles" },
  { href: "AdminPayments", icon: CreditCard, label: "Payments" },
  { href: "AdminPasses", icon: Ticket, label: "Passes" },
  { href: "AdminGifts", icon: Gift, label: "Gifts" },
  { href: "AdminAppearance", icon: Palette, label: "Appearance" },
  { href: "AdminMerchantSettings", icon: CreditCard, label: "Merchant Settings" },
  { href: "AdminFAQ", icon: HelpCircle, label: "FAQ" },
  { href: "AdminEmails", icon: Mail, label: "Emails" },
  { href: "AdminAnnouncements", icon: Megaphone, label: "Announcements" },
  { href: "AdminAnalytics", icon: BarChart3, label: "Analytics" },
];

const NavItem = ({ item, isSidebarOpen, isAdmin, viewMode }) => {
  const location = useLocation();
  const getLink = (page) => {
    const baseUrl = createPageUrl(page);
    if (isAdmin && viewMode !== 'admin') {
      return baseUrl + `?view=${viewMode}`;
    }
    return baseUrl;
  };
  const to = getLink(item.href);
  const isActive = location.pathname === createPageUrl(item.href);

  const linkContent = (
    <>
      <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-rose-600' : 'text-gray-500 group-hover:text-gray-900'}`} />
      <span className={`truncate transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>{item.label}</span>
    </>
  );

  return (
    <li>
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link to={to} className={`flex items-center gap-3 rounded-md px-3 py-2 transition-colors group ${isActive ? 'bg-rose-50 text-rose-600 font-semibold' : 'hover:bg-gray-100'}`}>
              {linkContent}
            </Link>
          </TooltipTrigger>
          {!isSidebarOpen && <TooltipContent side="right"><p>{item.label}</p></TooltipContent>}
        </Tooltip>
      </TooltipProvider>
    </li>
  );
};

export default function Sidebar({
  isSidebarOpen,
  setIsSidebarOpen,
  currentUser,
  isAdmin,
  viewMode,
  onAdminPage,
  handleLogout,
  handleViewModeChange,
  currentPageName
}) {
  const showAdminNav = isAdmin && viewMode === 'admin';
  
  const navItems = showAdminNav ? adminNavItems : [
    { href: "Home", icon: LayoutGrid, label: "Overview" },
    { href: "Dashboard", icon: LayoutDashboard, label: "My Application" },
    { href: "Profile", icon: UserIcon, label: "My Profile" },
    { href: "Timeline", icon: Calendar, label: "Timeline" },
    { href: "PastRecipients", icon: Award, label: "Past Recipients" },
    { href: "FAQs", icon: HelpCircle, label: "FAQs" },
  ];

  const showMyApplicationDropdownItem = viewMode !== 'admin';

  return (
    <aside className={`fixed top-16 h-[calc(100vh-4rem)] bg-white border-r z-30 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-end h-14 border-b px-4">
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? <ChevronsLeft className="h-5 w-5" /> : <ChevronsRight className="h-5 w-5" />}
          </Button>
        </div>
        
        <nav className="flex-1 px-4 py-6">
          {isAdmin && viewMode === 'admin' && (
            <div className="mb-4">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Administration
              </div>
              <ul className="space-y-1">
                {adminNavItems.map(item => (
                  <NavItem key={item.href} item={item} isSidebarOpen={isSidebarOpen} isAdmin={isAdmin} viewMode={viewMode} />
                ))}
              </ul>
            </div>
          )}

          {(!isAdmin || viewMode !== 'admin') && (
            <ul className="space-y-1">
              {navItems.map(item => <NavItem key={item.href} item={item} isSidebarOpen={isSidebarOpen} isAdmin={isAdmin} viewMode={viewMode} />)}
            </ul>
          )}
        </nav>

        <div className="border-t p-4">
          {currentUser ? (
            <div>
              {isAdmin && (
                <div className={`mb-4 transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 h-0'}`}>
                  <Label htmlFor="view-mode-select" className="text-sm mb-2 block">View Mode</Label>
                  <Select value={viewMode} onValueChange={handleViewModeChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select view mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Admin View
                        </div>
                      </SelectItem>
                      <SelectItem value="applicant">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Applicant View
                        </div>
                      </SelectItem>
                      <SelectItem value="visitor">
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          Visitor View
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-orange-500 text-white font-semibold">
                    {currentUser.full_name?.charAt(0).toUpperCase() || currentUser.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className={`flex-1 truncate transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
                  <p className="font-semibold text-sm truncate">{currentUser.full_name}</p>
                  <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="flex-shrink-0">
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="top" align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center gap-2">
                           <p className="text-sm font-medium leading-none">{currentUser.full_name}</p>
                           {isAdmin && <Shield className="w-3 h-3 text-rose-600" />}
                        </div>
                        <p className="text-xs leading-none text-muted-foreground">{currentUser.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {showMyApplicationDropdownItem && (
                      <DropdownMenuItem>
                        <Link to={createPageUrl("Dashboard")} className="w-full">My Application</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem>
                      <Link to={createPageUrl("Profile")} className="w-full">My Profile</Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem>
                        <Link to={createPageUrl("Admin")} className="w-full">Admin Dashboard</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ) : (
             <div className="space-y-2">
                <Button className="w-full">Sign In</Button>
                <Button variant="outline" className="w-full">Sign Up</Button>
             </div>
          )}
        </div>
      </div>
    </aside>
  );
}