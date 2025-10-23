
import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import * as base44 from '@/base44'; // Added base44 import for entities and functions
// Removed: import { PendingUserImport } from '@/api/entities'; 
// Removed: import { Payment } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Gift as GiftIcon, 
  Heart, 
  ArrowRight, 
  Check, 
  Mail,
  CreditCard,
  Sparkles,
  UserPlus
} from 'lucide-react';
// Removed: import { sendTemplatedEmail } from '@/components/lib/email';
// Removed: import { createPageUrl } from '@/utils';

export default function GiftPage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState(1); // 1: form, 2: payment, 3: success
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    nominee_name: '',
    nominee_email: '',
    personal_message: '',
    plan_type: 'gift_single_cycle'
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
    } catch (error) {
      console.error('User not logged in:', error);
      // Redirect to login
      await User.login();
    }
    setIsLoading(false);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nominee_name.trim()) {
      newErrors.nominee_name = 'Nominee name is required';
    }

    if (!formData.nominee_email.trim()) {
      newErrors.nominee_email = 'Nominee email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.nominee_email)) {
      newErrors.nominee_email = 'Please enter a valid email address';
    }

    if (formData.nominee_email === user?.email) {
      newErrors.nominee_email = 'You cannot nominate yourself';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      setStep(2);
    }
  };

  const handlePayment = async (paymentType) => {
    setIsProcessing(true);
    try {
      // Create payment record
      const amount = paymentType === 'gift_single_cycle' ? 7500 : 25000; // $75 or $250 in cents
      
      const payment = await base44.entities.Payment.create({
        user_id: user.id,
        amount: amount,
        currency: 'usd',
        provider: 'stripe_simulated',
        charge_id: `ch_sim_${Date.now()}`,
        plan_type: paymentType,
        status: 'succeeded'
      });

      // Create pending user import record instead of NominationGift
      const inviteToken = generateInviteToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days to accept

      const pendingImport = await base44.entities.PendingUserImport.create({
        email: formData.nominee_email,
        full_name: formData.nominee_name,
        payment_plan_type: paymentType === 'gift_single_cycle' ? 'single_cycle' : 'four_cycle_pass',
        payment_amount: amount,
        invite_token: inviteToken,
        status: 'pending',
        source: 'gift_nomination',
        nominator_user_id: user.id,
        nominator_name: user.full_name,
        personal_message: formData.personal_message,
        payment_id: payment.id,
        expires_at: expiresAt.toISOString()
      });

      // Send invitation email to nominee using backend function
      const baseUrl = window.location.origin;
      const acceptanceUrl = `${baseUrl}/accept-invitation?token=${inviteToken}`;
      
      try {
        // Call backend to send the email (backend function handles Core.SendEmail)
        const response = await base44.functions.invoke('sendGiftNominationEmail', {
          pending_import_id: pendingImport.id,
          acceptance_url: acceptanceUrl
        });

        if (response.data?.success) {
          // Update pending import to invited status
          await base44.entities.PendingUserImport.update(pendingImport.id, {
            status: 'invited',
            invite_sent_at: new Date().toISOString()
          });
        } else {
          console.error('Failed to send invitation email:', response.data?.error);
          // Don't fail the whole process, just log it
        }
      } catch (emailError) {
        console.error('Error sending invitation email:', emailError);
        // Don't fail the whole process
      }

      setStep(3);
    } catch (error) {
      console.error('Gift creation failed:', error);
      alert('Failed to send gift invitation. Please try again.'); // Added an alert for error
    }
    setIsProcessing(false);
  };

  const generateInviteToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const getPlanDetails = (planType) => {
    return planType === 'gift_single_cycle' 
      ? { name: 'Single-Cycle Gift', price: '$75', description: 'One application submission' }
      : { name: 'Four-Cycle Pass Gift', price: '$250', description: 'Up to 4 applications over a year' };
  };

  if (isLoading) {
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
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <GiftIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Nominate a Loved One</h1>
          <p className="text-lg text-gray-600">Give someone special the gift of hope on their parenthood journey</p>
        </div>

        {step === 1 && (
          <Card className="shadow-xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-rose-600" />
                Tell Us About Your Nominee
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="nominee_name">Nominee's Full Name *</Label>
                <Input
                  id="nominee_name"
                  value={formData.nominee_name}
                  onChange={(e) => setFormData({...formData, nominee_name: e.target.value})}
                  className={errors.nominee_name ? 'border-red-500' : ''}
                  placeholder="Enter their full name"
                />
                {errors.nominee_name && (
                  <p className="text-sm text-red-600 mt-1">{errors.nominee_name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="nominee_email">Nominee's Email Address *</Label>
                <Input
                  id="nominee_email"
                  type="email"
                  value={formData.nominee_email}
                  onChange={(e) => setFormData({...formData, nominee_email: e.target.value})}
                  className={errors.nominee_email ? 'border-red-500' : ''}
                  placeholder="Enter their email address"
                />
                {errors.nominee_email && (
                  <p className="text-sm text-red-600 mt-1">{errors.nominee_email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="plan_type">Choose Gift Type</Label>
                <RadioGroup
                  value={formData.plan_type}
                  onValueChange={(value) => setFormData({...formData, plan_type: value})}
                  className="mt-3"
                >
                  <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="gift_single_cycle" id="single" />
                    <div className="flex-grow">
                      <Label htmlFor="single" className="font-medium">Single-Cycle Gift - {getPlanDetails('gift_single_cycle').price}</Label>
                      <p className="text-sm text-gray-500">{getPlanDetails('gift_single_cycle').description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 border-2 border-rose-200 bg-rose-50 rounded-lg">
                    <RadioGroupItem value="gift_four_cycle_pass" id="pass" />
                    <div className="flex-grow">
                      <Label htmlFor="pass" className="font-medium text-rose-800">Four-Cycle Pass Gift - {getPlanDetails('gift_four_cycle_pass').price}</Label>
                      <p className="text-sm text-rose-600">{getPlanDetails('gift_four_cycle_pass').description}</p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="personal_message">Personal Message (Optional)</Label>
                <Textarea
                  id="personal_message"
                  value={formData.personal_message}
                  onChange={(e) => setFormData({...formData, personal_message: e.target.value})}
                  placeholder="Add a personal message that will be included in their invitation email..."
                  rows={4}
                />
              </div>

              <Button onClick={handleNext} className="w-full bg-rose-600 hover:bg-rose-700" size="lg">
                Continue to Payment <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="shadow-xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-rose-600" />
                Complete Your Gift
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Gift Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Nominee:</span>
                    <span className="font-medium">{formData.nominee_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Email:</span>
                    <span className="font-medium">{formData.nominee_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gift Type:</span>
                    <span className="font-medium">{getPlanDetails(formData.plan_type).name}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>{getPlanDetails(formData.plan_type).price}</span>
                  </div>
                </div>
              </div>

              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  After payment, we'll send an invitation email to {formData.nominee_email} with instructions to accept your gift. They'll have 30 days to respond.
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back to Form
                </Button>
                <Button 
                  onClick={() => handlePayment(formData.plan_type)}
                  disabled={isProcessing}
                  className="flex-1 bg-rose-600 hover:bg-rose-700"
                  size="lg"
                >
                  {isProcessing ? 'Processing...' : `Pay ${getPlanDetails(formData.plan_type).price}`}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card className="shadow-xl border-0 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Gift Sent Successfully!</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Your gift nomination for <strong>{formData.nominee_name}</strong> has been sent to <strong>{formData.nominee_email}</strong>. 
                They'll receive an invitation email with instructions to accept your thoughtful gift.
              </p>
              <div className="bg-white p-4 rounded-lg mb-6">
                <h3 className="font-semibold mb-2">What happens next?</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-rose-500 mt-0.5" />
                    <span>We'll email {formData.nominee_name} about your gift</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-rose-500 mt-0.5" />
                    <span>They have 30 days to accept and create an account</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-rose-500 mt-0.5" />
                    <span>Once accepted, they can apply during any open cycle</span>
                  </li>
                </ul>
              </div>
              <Button onClick={() => window.location.href = '/'} className="bg-rose-600 hover:bg-rose-700">
                Return to Homepage
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
