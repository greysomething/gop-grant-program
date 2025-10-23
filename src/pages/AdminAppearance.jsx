import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Palette, Home, Menu } from 'lucide-react';

import HomepageContentManager from '@/components/admin/HomepageContentManager';
import GlobalStyleManager from '@/components/admin/GlobalStyleManager';
import NavigationMenuManager from '@/components/admin/NavigationMenuManager';

export default function AdminAppearance() {
  const [user, setUser] = useState(null);
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
    } catch (error) {
      console.error('Failed to initialize appearance page:', error);
      window.location.href = createPageUrl("Home");
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading appearance settings...</p>
        </div>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:py-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl("Admin")}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Appearance Settings</h1>
            <p className="text-gray-600">Customize your website's content, design, and navigation</p>
          </div>
        </div>

        <Tabs defaultValue="homepage" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="homepage" className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              Homepage Content
            </TabsTrigger>
            <TabsTrigger value="styles" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Global Styles
            </TabsTrigger>
            <TabsTrigger value="navigation" className="flex items-center gap-2">
              <Menu className="w-4 h-4" />
              Navigation Menu
            </TabsTrigger>
          </TabsList>

          <TabsContent value="homepage" className="space-y-6">
            <Card>
              <CardContent className="p-8">
                <HomepageContentManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="styles" className="space-y-6">
            <Card>
              <CardContent className="p-8">
                <GlobalStyleManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="navigation" className="space-y-6">
            <Card>
              <CardContent className="p-8">
                <NavigationMenuManager />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}