import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserCheck, UserPlus, ArrowRight } from 'lucide-react';

export default function ApplyEntry() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await User.me();
        if (user) {
          // User is already authenticated, send them directly to Apply page
          navigate(createPageUrl("Apply"));
        }
      } catch (error) {
        // User is not authenticated, which is expected - stay on this page
      }
      setIsCheckingAuth(false);
    };

    checkAuth();
  }, [navigate]);

  const handleExistingUser = () => {
    // Redirect to login page with return URL to Apply page
    const callbackUrl = window.location.origin + createPageUrl("Apply");
    window.location.href = `${window.location.origin}/login/?redirect_to=${encodeURIComponent(callbackUrl)}`;
  };

  const handleNewUser = () => {
    // Take user directly to Apply page where they'll fill out basic info first
    navigate(createPageUrl("Apply"));
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-orange-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Start Your Grant Application
          </h1>
          <p className="text-lg text-gray-600">
            We'll guide you through the process step by step. First, let's confirm if you have an account.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-2 hover:border-rose-300 hover:shadow-lg transition-all duration-200 cursor-pointer group" onClick={handleExistingUser}>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <UserCheck className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Yes, I have an account</h2>
              <p className="text-gray-600 mb-6">
                Sign in to continue your application or start a new one
              </p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 group-hover:shadow-md transition-all">
                Log In to Your Account
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-rose-300 bg-gradient-to-br from-rose-50 to-pink-50 hover:shadow-lg transition-all duration-200 cursor-pointer group" onClick={handleNewUser}>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <UserPlus className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">No, I'm new</h2>
              <p className="text-gray-600 mb-6">
                Start your application journey with us today
              </p>
              <Button className="w-full bg-rose-600 hover:bg-rose-700 group-hover:shadow-md transition-all">
                Start My Application
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Don't worry, your progress will be saved as you go through the application.
          </p>
        </div>
      </div>
    </div>
  );
}