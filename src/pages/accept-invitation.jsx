
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  Gift,
  Mail,
  Award,
} from 'lucide-react';

export default function AcceptInvitation() {
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pendingImport, setPendingImport] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    const urlParams = new URLSearchParams(window.location.search);
    const inviteToken = urlParams.get('token');

    if (!inviteToken) {
      setError('Invalid invitation link: missing token.');
      setIsLoading(false);
      return;
    }

    try {
      const pendingImports = await base44.entities.PendingUserImport.filter({ 
        invite_token: inviteToken 
      });

      if (pendingImports.length === 0) {
        setError('Invalid or expired invitation token.');
        setIsLoading(false);
        return;
      }

      const foundPendingImport = pendingImports[0];
      setPendingImport(foundPendingImport);

      if (foundPendingImport.status === 'claimed') {
        setSuccess('This invitation has already been claimed. You can go to your dashboard.');
        setIsLoading(false);
        return;
      }
      if (foundPendingImport.status === 'expired') {
        setError('This invitation has expired.');
        setIsLoading(false);
        return;
      }
      if (foundPendingImport.status === 'cancelled') {
        setError('This invitation has been cancelled.');
        setIsLoading(false);
        return;
      }

      try {
        const user = await base44.auth.me();
        setCurrentUser(user);

        if (user && user.email === foundPendingImport.email) {
          await claimGift(user, foundPendingImport);
        }
      } catch (authError) {
        setCurrentUser(null);
      }

    } catch (e) {
      console.error('Error initializing invitation acceptance:', e);
      setError('An error occurred while validating your invitation. Please try again or contact support.');
    } finally {
      setIsLoading(false);
    }
  };

  const claimGift = async (user, pImport) => {
    setIsProcessing(true);
    try {
      if (user.email !== pImport.email) {
        setError('The logged-in user email does not match the invitation email. Please log out and log in with the correct email, or register a new account.');
        setIsProcessing(false);
        return;
      }

      // Call backend function to claim the invitation
      const response = await base44.functions.invoke('claimInvitation', {
        invite_token: pImport.invite_token
      });

      if (response.data?.success) {
        setSuccess('Your invitation has been successfully claimed! You can now apply for grants.');
        setPendingImport({ ...pImport, status: 'claimed' });
      } else {
        throw new Error(response.data?.error || 'Failed to claim invitation');
      }

    } catch (error) {
      console.error('Error claiming gift:', error);
      setError(error.message || 'Failed to claim your invitation. Please try again or contact support.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoginSignup = () => {
    const currentUrl = window.location.href;
    base44.auth.redirectToLogin(currentUrl);
  };

  const handleGoToDashboard = () => {
    window.location.href = '/Dashboard';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white shadow-lg">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-12 h-12 text-rose-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Validating your invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white shadow-lg">
          <CardHeader className="text-center pt-8 pb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Invalid Invitation</h2>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <Alert className="border-red-200 bg-red-50 mb-6">
              <AlertDescription className="text-red-800 text-sm">
                {error}
              </AlertDescription>
            </Alert>
            <Button 
              onClick={() => window.location.href = '/'} 
              className="w-full bg-gray-900 hover:bg-gray-800 text-white"
            >
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white shadow-lg">
          <CardHeader className="text-center pt-8 pb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Success!</h2>
          </CardHeader>
          <CardContent className="px-8 pb-8 space-y-6">
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800 text-sm">
                {success}
              </AlertDescription>
            </Alert>
            {pendingImport && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-sm text-gray-900 mb-2">What You Received:</h3>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  {pendingImport.source === 'gift_nomination' ? (
                    <Gift className="w-5 h-5 text-rose-500" />
                  ) : (
                    <Award className="w-5 h-5 text-blue-500" />
                  )}
                  <span>
                    {pendingImport.payment_plan_type === 'four_cycle_pass' 
                      ? 'Four-Cycle Pass (4 applications)'
                      : 'Single Application'}
                  </span>
                </div>
              </div>
            )}
            <Button 
              onClick={handleGoToDashboard} 
              className="w-full bg-rose-600 hover:bg-rose-700 text-white"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentUser && pendingImport) {
    const isGift = pendingImport.source === 'gift_nomination';
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white shadow-lg">
          <CardHeader className="text-center pt-8 pb-4">
            <div className={`w-16 h-16 ${isGift ? 'bg-rose-100' : 'bg-blue-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
              {isGift ? (
                <Gift className="w-8 h-8 text-rose-600" />
              ) : (
                <Mail className="w-8 h-8 text-blue-600" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isGift ? "You've Been Gifted!" : "You're Invited to Apply!"}
            </h2>
            <p className="text-sm text-gray-600">
              Sign in to continue
            </p>
          </CardHeader>
          <CardContent className="px-8 pb-8 space-y-6">
            <Alert className={`${isGift ? 'border-rose-200 bg-rose-50' : 'border-blue-200 bg-blue-50'}`}>
              <AlertDescription className={`text-sm ${isGift ? 'text-rose-800' : 'text-blue-800'}`}>
                {isGift ? (
                  <>
                    <strong>{pendingImport.nominator_name || 'Someone special'}</strong> has gifted you a pre-paid application to the Gift of Parenthood grant program!
                  </>
                ) : (
                  <>
                    You've been invited to submit your application on the <strong>Gift of Parenthood Grant Portal</strong>. Your application fee has been pre-paid, and you can begin your journey today.
                  </>
                )}
              </AlertDescription>
            </Alert>

            {isGift && pendingImport.personal_message && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700 italic">"{pendingImport.personal_message}"</p>
              </div>
            )}

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-sm text-gray-900 mb-2">What's Included:</h3>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                {isGift ? (
                  <Gift className="w-5 h-5 text-rose-500" />
                ) : (
                  <Award className="w-5 h-5 text-blue-500" />
                )}
                <span>
                  {pendingImport.payment_plan_type === 'four_cycle_pass' 
                    ? 'Four-Cycle Pass - Apply up to 4 times'
                    : 'Single Application - One grant submission'}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-600 text-center">
                To claim your {isGift ? 'gift' : 'invitation'}, please log in or create an account with: <strong className="block mt-1 text-gray-900">{pendingImport.email}</strong>
              </p>
              <Button 
                onClick={handleLoginSignup} 
                className="w-full bg-gray-900 hover:bg-gray-800 text-white"
              >
                Login / Sign Up
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentUser && pendingImport && currentUser.email !== pendingImport.email) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white shadow-lg">
          <CardHeader className="text-center pt-8 pb-4">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Email Mismatch</h2>
          </CardHeader>
          <CardContent className="px-8 pb-8 space-y-6">
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertDescription className="text-yellow-800 text-sm">
                This invitation was sent to <strong>{pendingImport.email}</strong>, but you're logged in as <strong>{currentUser.email}</strong>.
                <br /><br />
                Please log out and log in with the correct email address to claim this invitation.
              </AlertDescription>
            </Alert>
            <div className="space-y-3">
              <Button 
                onClick={() => base44.auth.logout()} 
                variant="outline" 
                className="w-full border-gray-300"
              >
                Log Out
              </Button>
              <Button 
                onClick={() => window.location.href = '/'} 
                className="w-full bg-gray-900 hover:bg-gray-800 text-white"
              >
                Go to Homepage
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
