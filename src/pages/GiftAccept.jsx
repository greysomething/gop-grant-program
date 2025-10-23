
import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { NominationGift } from '@/api/entities';
import { CyclePass } from '@/api/entities';
import { useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Gift as GiftIcon, 
  Heart, 
  CheckCircle2, 
  XCircle, 
  Clock,
  UserPlus,
  LogIn
} from 'lucide-react';

export default function GiftAcceptPage() {
  const [user, setUser] = useState(null);
  const [gift, setGift] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState(null); // 'valid', 'expired', 'already_claimed', 'not_found'
  const [error, setError] = useState('');
  const location = useLocation();

  useEffect(() => {
    const initialize = async () => {
      try {
        // Get token from URL
        const urlParams = new URLSearchParams(location.search);
        const token = urlParams.get('token');
        
        if (!token) {
          setStatus('not_found');
          setIsLoading(false);
          return;
        }

        // Try to get current user
        try {
          const currentUser = await User.me();
          setUser(currentUser);
        } catch (e) {
          setUser(null);
        }

        // Find gift by token
        const gifts = await NominationGift.filter({ invite_token: token });
        if (gifts.length === 0) {
          setStatus('not_found');
          setIsLoading(false);
          return;
        }

        const giftData = gifts[0];
        setGift(giftData);

        // Check gift status
        if (giftData.status === 'claimed') {
          setStatus('already_claimed');
        } else if (giftData.status === 'expired' || new Date(giftData.expires_at) < new Date()) {
          setStatus('expired');
        } else if (giftData.status === 'cancelled') {
          setStatus('cancelled');
        } else {
          setStatus('valid');
        }
      } catch (error) {
        console.error('Failed to load gift:', error);
        setError('Failed to load gift information');
      }
      setIsLoading(false);
    };

    initialize();
  }, [location.search]);

  const handleLogin = async () => {
    const callbackUrl = window.location.href;
    await User.loginWithRedirect(callbackUrl);
  };

  const handleAcceptGift = async () => {
    if (!user || !gift) return;

    // Check if user email matches nominee email
    if (user.email !== gift.nominee_email) {
      setError('This gift is intended for a different email address. Please log in with the correct account.');
      return;
    }

    setIsProcessing(true);
    try {
      // Create cycle pass for the user
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year validity

      const cyclePass = await CyclePass.create({
        user_id: user.id,
        source: 'gift',
        redemptions_remaining: gift.payment_id?.includes('four_cycle') ? 4 : 1,
        valid_from: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        status: 'active'
      });

      // Update gift status to claimed
      await NominationGift.update(gift.id, {
        status: 'claimed',
        cyclepass_id: cyclePass.id
      });

      // Redirect to dashboard with success message
      window.location.href = createPageUrl('Dashboard') + '?gift_accepted=true';
    } catch (error) {
      console.error('Failed to accept gift:', error);
      setError('Failed to accept gift. Please try again.');
    }
    setIsProcessing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading gift information...</p>
        </div>
      </div>
    );
  }

  if (status === 'not_found') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Gift Not Found</h2>
            <p className="text-gray-600 mb-4">
              We couldn't find a gift with this invitation link. The link may be invalid or expired.
            </p>
            <Button onClick={() => window.location.href = createPageUrl('Home')}>
              Return to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Clock className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Gift Expired</h2>
            <p className="text-gray-600 mb-4">
              Unfortunately, this gift invitation has expired. Gift invitations are valid for 30 days.
            </p>
            <Button onClick={() => window.location.href = createPageUrl('Home')}>
              Return to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'already_claimed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Gift Already Claimed</h2>
            <p className="text-gray-600 mb-4">
              This gift has already been claimed and is in use.
            </p>
            <Button onClick={() => window.location.href = createPageUrl('Dashboard')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center px-4">
      <Card className="max-w-lg w-full shadow-xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <GiftIcon className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">You've Received a Gift!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {gift && (
            <div className="bg-rose-50 p-4 rounded-lg text-center">
              <p className="text-gray-800 mb-2">
                <strong>{gift.nominee_name}</strong>, someone special has nominated you to receive a pre-paid application for the Gift of Parenthood Grant program!
              </p>
              <div className="text-sm text-gray-600">
                <p>Gift Type: {gift.payment_id?.includes('four_cycle') ? 'Four-Cycle Pass' : 'Single Application'}</p>
                <p>Expires: {new Date(gift.expires_at).toLocaleDateString()}</p>
              </div>
            </div>
          )}

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <XCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          {!user ? (
            <div className="space-y-4">
              <p className="text-center text-gray-600">
                To accept this gift, you'll need to create an account or sign in with the email address this gift was sent to.
              </p>
              <div className="space-y-3">
                <Button onClick={handleLogin} className="w-full bg-rose-600 hover:bg-rose-700" size="lg">
                  <UserPlus className="mr-2 w-4 h-4" />
                  Sign Up & Accept Gift
                </Button>
                <Button onClick={handleLogin} variant="outline" className="w-full" size="lg">
                  <LogIn className="mr-2 w-4 h-4" />
                  Already Have Account? Sign In
                </Button>
              </div>
            </div>
          ) : user.email === gift?.nominee_email ? (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  Perfect! You're signed in with the correct email address. You can now accept this gift.
                </AlertDescription>
              </Alert>
              <Button 
                onClick={handleAcceptGift}
                disabled={isProcessing}
                className="w-full bg-rose-600 hover:bg-rose-700"
                size="lg"
              >
                {isProcessing ? 'Accepting Gift...' : 'Accept Gift & Activate'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert className="border-orange-200 bg-orange-50">
                <XCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-700">
                  This gift was sent to {gift?.nominee_email}, but you're signed in as {user.email}. 
                  Please sign in with the correct email address to accept this gift.
                </AlertDescription>
              </Alert>
              <Button onClick={handleLogin} variant="outline" className="w-full">
                Sign In with Different Account
              </Button>
            </div>
          )}

          <div className="text-center">
            <p className="text-sm text-gray-500">
              This gift covers your application fee and gives you the opportunity to share your story with our review board.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
