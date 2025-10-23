
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User } from '@/api/entities';
import { Application } from '@/api/entities';
import { Cycle } from '@/api/entities';
import { CyclePass } from '@/api/entities';
import { createPageUrl } from '@/utils';
import { sendTemplatedEmail } from '@/components/lib/email';
import { getCurrentPacificTime, dateStringToPacificStartOfDay, dateStringToPacificEndOfDay } from '@/components/lib/timezone';
import { enrollOnSubmission, enrollOnDraftSave } from '@/components/lib/emailSequenceEnrollment';

import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Send, Shield } from 'lucide-react';

import StepIndicator from '@/components/apply/StepIndicator';
import Step1_BasicInfo from '@/components/apply/Step1_BasicInfo';
import Step1_AboutYou from '@/components/apply/Step1_AboutYou';
import Step2_YourJourney from '@/components/apply/Step2_YourJourney';
import Step3_Financials from '@/components/apply/Step3_Financials';
import Step4_Consent from '@/components/apply/Step4_Consent';
import Step5_ReviewAndPay from '@/components/apply/Step5_ReviewAndPay';

const STEPS = [
  { name: 'About You' },
  { name: 'Your Journey' },
  { name: 'Financials' },
  { name: 'Consent' },
  { name: 'Review & Submit' }
];

export default function ApplyPage() {
  const [user, setUser] = useState(null);
  const [cycle, setCycle] = useState(null);
  const [application, setApplication] = useState(null);
  const [cyclePass, setCyclePass] = useState(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showAccountSetupPrompt, setShowAccountSetupPrompt] = useState(false);
  const [tempBasicInfo, setTempBasicInfo] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  const viewAsApplicant = new URLSearchParams(location.search).get('view') === 'applicant';

  const initialize = useCallback(async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      // Check if user came back after authentication with basic info saved
      const savedBasicInfo = localStorage.getItem('gop_basic_info');
      if (savedBasicInfo) {
        const basicInfo = JSON.parse(savedBasicInfo);
        
        // Update user profile with basic info if needed
        const updates = {};
        if (basicInfo.first_name && !currentUser.first_name) updates.first_name = basicInfo.first_name;
        if (basicInfo.last_name && !currentUser.last_name) updates.last_name = basicInfo.last_name;
        if (basicInfo.phone && !currentUser.phone) updates.phone = basicInfo.phone;
        if (basicInfo.address && !currentUser.address) updates.address = basicInfo.address;
        if (basicInfo.city && !currentUser.city) updates.city = basicInfo.city;
        if (basicInfo.state && !currentUser.state) updates.state = basicInfo.state;
        if (basicInfo.zip_code && !currentUser.zip_code) updates.zip_code = basicInfo.zip_code;
        
        if (Object.keys(updates).length > 0) {
          await User.updateMyUserData(updates);
        }
        
        // Clear localStorage after using it
        localStorage.removeItem('gop_basic_info');
      }

      if (currentUser?.role === 'admin' && !viewAsApplicant) {
        navigate(createPageUrl("Admin"));
        return;
      }

      const [openCycles, userPasses, userApps] = await Promise.all([
        Cycle.filter({ is_open_for_submissions: true }, '-start_date', 1),
        CyclePass.list(),
        Application.list()
      ]);

      if (openCycles.length === 0) {
        setError("No application cycles are currently open. Please check back later.");
        setIsLoading(false);
        return;
      }
      
      const currentCycle = openCycles[0];
      
      // Validate that the cycle is actually open using Pacific Time
      const nowPT = getCurrentPacificTime();
      const startDate = dateStringToPacificStartOfDay(currentCycle.start_date);
      const endDate = dateStringToPacificEndOfDay(currentCycle.end_date);
      
      if (nowPT < startDate || nowPT > endDate) {
        setError("The current application cycle is not accepting submissions at this time (Pacific Time).");
        setIsLoading(false);
        return;
      }
      
      setCycle(currentCycle);
      
      const activePass = userPasses.find(p => p.status === 'active' && p.redemptions_remaining > 0 && new Date(p.expires_at) > new Date());
      setCyclePass(activePass);

      const existingDraft = userApps.find(app => app.cycle_id === currentCycle.id && app.status === 'draft');
      if (existingDraft) {
        setApplication(existingDraft);
        setFormData(existingDraft.form_data || {});
      } else {
        const newApp = await Application.create({
          user_id: currentUser.id,
          cycle_id: currentCycle.id,
          status: 'draft',
          form_data: { 
            first_name: currentUser.first_name || '',
            last_name: currentUser.last_name || '',
            email: currentUser.email,
            phone: currentUser.phone || '',
            date_of_birth: currentUser.date_of_birth || '',
            address: currentUser.address || '',
            city: currentUser.city || '',
            state: currentUser.state || '',
            zip_code: currentUser.zip_code || '',
            household_size: currentUser.household_size || '', // Added pre-fill
            income_range: currentUser.income_range || '' // Added pre-fill
          }
        });
        setApplication(newApp);
        setFormData({ 
          first_name: currentUser.first_name || '',
          last_name: currentUser.last_name || '',
          email: currentUser.email,
          phone: currentUser.phone || '',
          date_of_birth: currentUser.date_of_birth || '',
          address: currentUser.address || '',
          city: currentUser.city || '',
          state: currentUser.state || '',
          zip_code: currentUser.zip_code || '',
          household_size: currentUser.household_size || '', // Added pre-fill
          income_range: currentUser.income_range || '' // Added pre-fill
        });
      }

    } catch (e) {
      // User is not authenticated
      setUser(null);
      
      // Check if they have saved basic info from a previous attempt
      const savedBasicInfo = localStorage.getItem('gop_basic_info');
      if (savedBasicInfo) {
        setTempBasicInfo(JSON.parse(savedBasicInfo));
        setShowAccountSetupPrompt(true);
      }
    }
    
    setIsLoading(false);
  }, [viewAsApplicant, navigate]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleBasicInfoContinue = (basicInfo) => {
    setTempBasicInfo(basicInfo);
    setShowAccountSetupPrompt(true);
  };

  const handleAccountSetup = () => {
    // Redirect to login page with return URL to this page
    const callbackUrl = window.location.origin + createPageUrl("Apply");
    window.location.href = `${window.location.origin}/login/?redirect_to=${encodeURIComponent(callbackUrl)}`;
  };

  const saveDraft = async (data) => {
    if (!application) return;
    try {
      const updatedApp = await Application.update(application.id, { form_data: data });
      setApplication(updatedApp);
      
      // Enroll in draft sequences when draft is saved (only once)
      if (updatedApp.status === 'draft') {
        await enrollOnDraftSave(updatedApp);
      }
      
      console.log('Draft saved successfully');
    } catch (error) {
      console.error("Failed to save draft:", error);
    }
  };

  const handleNext = async () => {
    await saveDraft(formData);
    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo(0, 0); // Scroll to top
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo(0, 0); // Scroll to top
    }
  };
  
  const handlePaymentAndSubmission = async (planType) => {
    setIsSubmitting(true);
    setError('');
    
    try {
      // Fallback for missing application, should not happen if `initialize` works correctly,
      // but good for robustness if there's a race condition or state issue.
      if (!application) {
        throw new Error("Application object is missing. Please refresh the page and try again.");
      }

      // CRITICAL: Save form_data to application BEFORE any payment processing
      console.log('Saving form data before payment/submission, form data:', formData);
      const updatedApp = await Application.update(application.id, {
        form_data: formData
      });
      setApplication(updatedApp); // Update local state with the latest application object
      console.log('Form data saved successfully to application:', updatedApp.id);
      
      if (planType === 'pass_redemption') {
        // Handle pass redemption - immediate submission
        if (cyclePass) {
          await CyclePass.update(cyclePass.id, {
            redemptions_remaining: cyclePass.redemptions_remaining - 1
          });
        }

        // Now, only update the status, form_data is already saved.
        await Application.update(application.id, {
          status: 'submitted'
        });
        
        // Enroll in email sequences (this will cancel draft sequences automatically)
        await enrollOnSubmission({ ...updatedApp, status: 'submitted' });

        await sendTemplatedEmail('application_confirmation', user.email, {
          applicant_name: `${formData.first_name} ${formData.last_name}`,
          application_id: updatedApp.id.slice(-8), // Use updatedApp.id for consistency
          cycle_name: cycle.name,
          announce_date: new Date(cycle.announce_by).toLocaleDateString()
        });

        const dashboardUrl = createPageUrl("Dashboard") + '?new_submission=true' + 
          (viewAsApplicant ? '&view=applicant' : '');
        navigate(dashboardUrl);
        
      } else {
        // For paid plans, the Stripe payment form will handle the redirect
        // Form data is already saved above
        console.log(`Application ${updatedApp.id} form data saved, ready for payment`);
        
        // Store application ID and plan type in localStorage before Stripe redirect
        localStorage.setItem('gop_application_id', updatedApp.id);
        localStorage.setItem('gop_plan_type', planType);
        console.log('Stored application details in localStorage');
        
        // Note: Stripe's confirmPayment will redirect to PaymentSuccess page
        // The actual submission to 'submitted' status happens in the webhook after successful payment
        // No explicit navigate from here for paid applications, as Stripe will redirect.
        // We set isSubmitting to false to allow user to retry if needed or if there's an issue with Stripe redirect
        setIsSubmitting(false); 
      }

    } catch (e) {
      setError("An error occurred during submission. Please try again. " + e.message);
      console.error(e);
      setIsSubmitting(false);
    }
  };
  
  const isNextDisabled = () => {
    if (currentStep === 2) {
      // Step 2: Require at least one submission type
      const hasWritten = formData.submission_type_written && formData.your_journey && formData.your_journey.trim() !== '';
      const hasVideo = formData.submission_type_video && formData.video_submission_url && formData.video_submission_url.trim() !== '';
      
      // Check word count if written is selected
      if (formData.submission_type_written) {
        const text = (formData.your_journey || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        const wordCount = text ? text.split(' ').filter(word => word !== '').length : 0; // Filter empty strings
        if (wordCount > 500) return true;
      }
      
      return !hasWritten && !hasVideo;
    }
    if (currentStep === 4) {
      return !formData.terms_agreement || !formData.truthfulness_agreement;
    }
    return false;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your application...</p>
        </div>
      </div>
    );
  }

  // Show basic info collection if user is not authenticated
  if (!user && !showAccountSetupPrompt) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <Step1_BasicInfo onContinue={handleBasicInfoContinue} />
      </div>
    );
  }

  // Show account setup prompt after basic info is collected
  if (!user && showAccountSetupPrompt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-2xl w-full">
          <Card className="border-2 border-blue-200 shadow-xl">
            <CardContent className="p-10 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Great Start, {tempBasicInfo?.first_name}!
              </h2>
              <p className="text-lg text-gray-600 mb-2">
                To save your application and officially submit it, we need to set up your account.
              </p>
              <p className="text-base text-gray-600 mb-8">
                You'll be able to log in anytime to check your application status and continue where you left off.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
                <p className="text-sm text-blue-800">
                  <strong>Don't worry!</strong> All the information you just entered has been securely saved.
                </p>
              </div>

              <Button 
                onClick={handleAccountSetup}
                size="lg"
                className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 px-12 py-6 text-lg"
              >
                Set Up My Account
              </Button>
              
              <p className="text-sm text-gray-500 mt-6">
                You'll use Google, Facebook, or Email to create your secure account.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1_AboutYou formData={formData} setFormData={setFormData} user={user} />;
      case 2: return <Step2_YourJourney formData={formData} setFormData={setFormData} />;
      case 3: return <Step3_Financials formData={formData} setFormData={setFormData} />;
      case 4: return <Step4_Consent formData={formData} setFormData={setFormData} />;
      case 5: return <Step5_ReviewAndPay formData={formData} setStep={setCurrentStep} cycle={cycle} cyclePass={cyclePass} onPay={handlePaymentAndSubmission} user={user} application={application} />;
      default: return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Grant Application</h1>
          <p className="text-lg text-gray-600">Tell us your story. Your progress is saved as you go.</p>
        </div>
        
        <StepIndicator currentStep={currentStep} steps={STEPS} />
        
        <div>{renderStep()}</div>
        
        {isSubmitting && (
          <div className="text-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-rose-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Submitting your application, please wait...</p>
          </div>
        )}

        {currentStep < STEPS.length && !isSubmitting && (
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={handlePrev} disabled={currentStep === 1}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Previous
            </Button>
            <Button onClick={handleNext} disabled={isNextDisabled()}>
              Next <Send className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
