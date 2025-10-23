
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { User } from '@/api/entities';
import { Application } from '@/api/entities';
import { Cycle } from '@/api/entities'; // Keep Cycle import as it's used for fetching cycle details
import { Payment } from '@/api/entities';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert'; // Keep Alert for error display
import { CheckCircle2, Loader2, AlertCircle, ArrowRight, Home, FileText } from 'lucide-react'; // Add Home, FileText
import { sendTemplatedEmail } from '@/components/lib/email';
import { enrollOnSubmission } from '@/components/lib/emailSequenceEnrollment'; // New import

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams(); // Changed from useLocation
  const navigate = useNavigate();

  const [isProcessing, setIsProcessing] = useState(true); // New state variable
  const [error, setError] = useState(''); // New state variable for error messages
  const [successMessage, setSuccessMessage] = useState(''); // New state variable for success messages
  const [currentUser, setCurrentUser] = useState(null); // Keep user for display
  const [currentApplication, setCurrentApplication] = useState(null); // Keep application for display
  const [currentCycle, setCurrentCycle] = useState(null); // Keep cycle for display

  // Removed debugInfo and addDebug as per outline simplification

  useEffect(() => {
    const processSuccess = async () => { // Renamed from processPayment
      try {
        const paymentIntentId = searchParams.get('payment_intent');
        const redirectStatus = searchParams.get('redirect_status');

        if (!paymentIntentId) {
          setError('Invalid payment confirmation link - no payment_intent parameter found.');
          setIsProcessing(false);
          return;
        }

        if (redirectStatus !== 'succeeded') {
          setError(`Payment status: ${redirectStatus}. Payment was not completed successfully.`);
          setIsProcessing(false);
          return;
        }

        const user = await User.me();
        setCurrentUser(user);

        // Check if payment already processed
        const existingPayments = await Payment.filter({ charge_id: paymentIntentId });
        if (existingPayments.length > 0 && existingPayments[0].status === 'succeeded') {
          // If payment already exists and succeeded, try to recover application details
          const existingApp = await Application.get(existingPayments[0].application_id);
          const existingCycle = await Cycle.get(existingApp.cycle_id);
          setCurrentApplication(existingApp);
          setCurrentCycle(existingCycle);

          setSuccessMessage('Your payment has already been processed and your application submitted.');
          setIsProcessing(false);
          return;
        }

        const savedApplicationId = localStorage.getItem('gop_application_id');
        const savedPlanType = localStorage.getItem('gop_plan_type');

        let app;
        let cycle;

        // Try to get the saved application
        if (savedApplicationId) {
          try {
            app = await Application.get(savedApplicationId);
            cycle = await Cycle.get(app.cycle_id);
          } catch (appError) {
            console.error('Error fetching saved application:', appError);
            app = null; // Force creation of a recovery application
          }
        }

        // Get the current open cycle first if app or cycle not found
        if (!cycle) {
          const openCycles = await Cycle.filter({ is_open_for_submissions: true }, '-start_date', 1);
          if (openCycles.length === 0) {
            const allCycles = await Cycle.list('-start_date', 1);
            if (allCycles.length === 0) {
              setError('No cycles found. Please contact support with your payment confirmation.');
              setIsProcessing(false);
              return;
            }
            cycle = allCycles[0];
          } else {
            cycle = openCycles[0];
          }
        }
        setCurrentCycle(cycle);

        // If application doesn't exist or previous fetch failed, create a new one (recovery)
        if (!app) {
          try {
            app = await Application.create({
              user_id: user.id,
              cycle_id: cycle.id,
              status: 'submitted',
              form_data: {
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email,
                phone: user.phone || '',
                recovery_note: 'Application recovered after payment - original draft not found'
              }
            });
          } catch (createError) {
            console.error('Error creating recovery application:', createError);
            setError('Payment succeeded but unable to create application record. Please contact support immediately with your payment confirmation.');
            setIsProcessing(false);
            return;
          }
        } else if (app.status === 'draft') {
          // Update existing application to submitted if still draft
          try {
            app = await Application.update(app.id, { status: 'submitted' });
          } catch (updateError) {
            console.error('Error updating application status:', updateError);
            setError('Payment succeeded but failed to update application status. Please contact support.');
            setIsProcessing(false);
            return;
          }
        }
        setCurrentApplication(app);

        // Create payment record (backup in case webhook fails)
        try {
          const planType = savedPlanType || 'single_cycle';
          const amount = planType === 'four_cycle_pass' ? 25000 : 7500;
            
          await Payment.create({
            user_id: user.id,
            application_id: app.id,
            amount: amount,
            currency: 'usd',
            provider: 'stripe',
            charge_id: paymentIntentId,
            plan_type: planType,
            status: 'succeeded'
          });
        } catch (paymentError) {
          console.warn(`Failed to create payment record (non-critical): ${paymentError.message}`);
        }

        // Enroll in email sequences
        await enrollOnSubmission({ ...app, status: 'submitted' }); // Ensure 'status' is submitted here

        // Send confirmation email
        try {
          const applicantName = user.full_name ||
            (user.first_name && user.last_name
              ? `${user.first_name} ${user.last_name}`
              : user.email);

          await sendTemplatedEmail('application_confirmation', user.email, {
            applicant_name: applicantName,
            application_id: app.id.slice(-8),
            cycle_name: cycle.name,
            announce_date: new Date(cycle.announce_by).toLocaleDateString()
          });
        } catch (emailError) {
          console.warn(`Failed to send confirmation email (non-critical): ${emailError.message}`);
        }

        // Clear localStorage
        localStorage.removeItem('gop_application_id');
        localStorage.removeItem('gop_plan_type');

        setSuccessMessage('Your application has been submitted successfully!');
      } catch (err) {
        console.error('Payment processing error:', err);
        setError('An unexpected error occurred. Please contact support if your payment was charged.');
      } finally {
        setIsProcessing(false);
      }
    };

    processSuccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // Depend on searchParams

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Your Payment</h2>
            <p className="text-gray-600">Please wait while we confirm your submission...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <Card className="max-w-2xl w-full">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Confirmation Issue</h2>
              <Alert variant="destructive" className="text-left">
                <AlertDescription>{error}</AlertDescription> {/* Use 'error' state */}
              </Alert>
            </div>

            {/* Debug information section removed as per outline */}

            <div className="space-y-3">
              <Button 
                onClick={() => navigate(createPageUrl("Dashboard"))}
                className="w-full bg-gray-900 hover:bg-gray-800"
              >
                <Home className="w-4 h-4 mr-2" /> Go to Dashboard
              </Button>
              <Button 
                onClick={() => window.location.href = `mailto:support@giftofparenthood.org?subject=Payment%20Issue&body=Payment%20Intent:%20${searchParams.get('payment_intent')}%0D%0A%0D%0A`}
                variant="outline"
                className="w-full"
              >
                <AlertCircle className="w-4 h-4 mr-2" /> Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center py-12 px-4">
      <Card className="max-w-2xl w-full border-2 border-green-200 shadow-xl">
        <CardContent className="p-10 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {successMessage || "Operation Successful!"} {/* Use successMessage */}
          </h2>
          {currentApplication && currentCycle && currentUser && (
            <>
              <p className="text-lg text-gray-600 mb-6">
                Thank you for sharing your story with us, {currentUser?.first_name || currentUser?.full_name}. 
                Your application for <strong>{currentCycle?.name}</strong> has been received.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
                <p className="text-sm text-blue-800">
                  You'll receive a confirmation email shortly. Results will be announced by{' '}
                  <strong>{currentCycle && new Date(currentCycle.announce_by).toLocaleDateString()}</strong>.
                </p>
              </div>
            </>
          )}

          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate(createPageUrl("Dashboard") + '?new_submission=true')}
              size="lg"
              className="w-full md:w-auto bg-green-600 hover:bg-green-700 px-8"
            >
              <Home className="w-5 h-5 mr-2" /> Go to Dashboard
            </Button>
            {currentApplication && (
              <Button
                onClick={() => navigate(createPageUrl("ApplicationDetail", { id: currentApplication.id }))}
                size="lg"
                variant="outline"
                className="w-full md:w-auto border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700 px-8"
              >
                <FileText className="w-5 h-5 mr-2" /> View My Application
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
