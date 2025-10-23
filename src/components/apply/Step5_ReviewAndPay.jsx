import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Gift, Ticket, Circle, Edit, AlertTriangle, FileText, Video, CreditCard } from 'lucide-react';
import StripePaymentForm from '@/components/payment/StripePaymentForm';

const ReviewItem = ({ label, children }) => (
  <div>
    <h4 className="text-sm font-medium text-gray-500">{label}</h4>
    <div className="text-gray-800">{children || <span className="text-gray-400">Not provided</span>}</div>
  </div>
);

export default function Step5_ReviewAndPay({ formData, setStep, cycle, cyclePass, onPay, user, application }) {
  const [selectedPlan, setSelectedPlan] = useState(cyclePass ? 'pass_redemption' : 'single_cycle');
  const [showPayment, setShowPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const handleContinueToPayment = () => {
    if (selectedPlan === 'pass_redemption') {
      onPay(selectedPlan);
    } else {
      setShowPayment(true);
      setPaymentError('');
    }
  };

  const handlePaymentSuccess = () => {
    onPay(selectedPlan);
  };

  const handlePaymentError = (error) => {
    console.error('Payment failed:', error);
    setPaymentError(error.message || 'Payment failed. Please try again.');
  };

  const getPlanAmount = (planType) => {
    const amounts = {
      single_cycle: 7500,
      four_cycle_pass: 25000,
      pass_redemption: 0
    };
    return amounts[planType] || 0;
  };

  const getPlanDetails = (planType) => {
    const plans = {
      single_cycle: { 
        name: 'Single-Cycle Application', 
        price: '$75', 
        description: 'Submit your application for this cycle only' 
      },
      four_cycle_pass: { 
        name: 'Four-Cycle Pass', 
        price: '$250', 
        description: 'Apply up to 4 times over the next year - Best value!' 
      },
      pass_redemption: { 
        name: 'Pass Redemption', 
        price: 'Free', 
        description: 'Use one of your Four-Cycle Pass redemptions' 
      }
    };
    return plans[planType] || plans.single_cycle;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Review Your Application</CardTitle>
              <CardDescription>Please review all information carefully before submitting.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setStep(1)}>
              <Edit className="w-4 h-4 mr-2" />Edit
            </Button>
          </CardHeader>
          <CardContent className="space-y-8">
            <section className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">About You</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ReviewItem label="Name">{formData.first_name && formData.last_name ? `${formData.first_name} ${formData.last_name}` : formData.full_name}</ReviewItem>
                <ReviewItem label="Date of Birth">{formData.date_of_birth}</ReviewItem>
                <ReviewItem label="Phone">{formData.phone}</ReviewItem>
                <ReviewItem label="Address">{`${formData.address || ''}, ${formData.city || ''}, ${formData.state || ''} ${formData.zip_code || ''}`}</ReviewItem>
              </div>
            </section>
            
            <section className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Your Journey</h3>
              
              {formData.submission_type_written && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Written Story
                  </h4>
                  <div 
                    className="prose prose-sm max-w-none rounded-md border bg-gray-50/50 p-4 max-h-64 overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: formData.your_journey || '<p class="text-gray-500">No story provided.</p>' }}
                  />
                </div>
              )}

              {formData.submission_type_video && (
                <div className={formData.submission_type_written ? "mt-6" : ""}>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Video className="w-4 h-4 text-rose-600" />
                    Video Submission
                  </h4>
                  {formData.video_submission_url ? (
                    <div className="border-2 border-green-200 bg-green-50 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-medium text-gray-900">Video uploaded</p>
                          <p className="text-sm text-gray-600">{formData.video_submission_filename}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No video uploaded</p>
                  )}
                </div>
              )}

              {!formData.submission_type_written && !formData.submission_type_video && (
                <p className="text-gray-500">No story submitted</p>
              )}
            </section>
            
            <section className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Financials</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ReviewItem label="Household Size">{formData.household_size}</ReviewItem>
                <ReviewItem label="Annual Household Income">{formData.income_range}</ReviewItem>
                <ReviewItem label="Use of Funds">{formData.use_of_funds}</ReviewItem>
              </div>
            </section>
            
            <section className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Consent</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm">
                  {formData.terms_agreement ? <CheckCircle2 className="w-4 h-4 text-green-600"/> : <Circle className="w-4 h-4 text-gray-400"/>} 
                  Agreed to Terms & Privacy
                </li>
                <li className="flex items-center gap-2 text-sm">
                  {formData.truthfulness_agreement ? <CheckCircle2 className="w-4 h-4 text-green-600"/> : <Circle className="w-4 h-4 text-gray-400"/>} 
                  Certified truthfulness
                </li>
                <li className="flex items-center gap-2 text-sm">
                  {formData.publicity_consent ? <CheckCircle2 className="w-4 h-4 text-green-600"/> : <Circle className="w-4 h-4 text-gray-400"/>} 
                  Consented to publicity
                </li>
              </ul>
            </section>
          </CardContent>
        </Card>
      </div>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Final Step</CardTitle>
            <CardDescription>
              You are applying for the <strong>{cycle?.name}</strong> grant cycle.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {cyclePass && (
              <Alert className="border-green-300 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  You have an active Four-Cycle Pass with <strong>{cyclePass.redemptions_remaining}</strong> redemption(s) remaining.
                </AlertDescription>
              </Alert>
            )}

            {paymentError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{paymentError}</AlertDescription>
              </Alert>
            )}
            
            {!showPayment ? (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-4 text-base">Choose your plan:</h3>
                  <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan} className="space-y-3">
                    {cyclePass && (
                      <div className="relative">
                        <RadioGroupItem value="pass_redemption" id="pass_redemption" className="peer sr-only" />
                        <Label
                          htmlFor="pass_redemption"
                          className="flex flex-col gap-2 rounded-lg border-2 border-gray-200 p-5 cursor-pointer hover:bg-gray-50 peer-data-[state=checked]:border-green-600 peer-data-[state=checked]:bg-green-50 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Ticket className="w-5 h-5 text-green-600" />
                              <span className="font-bold text-base">Use My Pass</span>
                            </div>
                            <span className="font-bold text-green-600">FREE</span>
                          </div>
                          <p className="text-sm text-gray-600 ml-8">
                            Use one of your Four-Cycle Pass redemptions
                          </p>
                        </Label>
                      </div>
                    )}
                    
                    <div className="relative">
                      <RadioGroupItem value="single_cycle" id="single_cycle" className="peer sr-only" />
                      <Label
                        htmlFor="single_cycle"
                        className="flex flex-col gap-2 rounded-lg border-2 border-gray-200 p-5 cursor-pointer hover:bg-gray-50 peer-data-[state=checked]:border-rose-600 peer-data-[state=checked]:bg-rose-50 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-rose-600" />
                            <span className="font-bold text-base">Single-Cycle</span>
                          </div>
                          <span className="font-bold text-rose-600">$75</span>
                        </div>
                        <p className="text-sm text-gray-600 ml-8">
                          Submit for this cycle only
                        </p>
                      </Label>
                    </div>
                    
                    <div className="relative">
                      <RadioGroupItem value="four_cycle_pass" id="four_cycle_pass" className="peer sr-only" />
                      <Label
                        htmlFor="four_cycle_pass"
                        className="flex flex-col gap-2 rounded-lg border-2 border-gray-200 p-5 cursor-pointer hover:bg-gray-50 peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:bg-blue-50 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Gift className="w-5 h-5 text-blue-600" />
                            <span className="font-bold text-base">Four-Cycle Pass</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-blue-600">$250</span>
                            <p className="text-xs text-blue-600 font-medium">Best Value</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 ml-8">
                          Apply up to 4 times over the next year
                        </p>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Button 
                  onClick={handleContinueToPayment}
                  className="w-full bg-rose-600 hover:bg-rose-700"
                  size="lg"
                >
                  {selectedPlan === 'pass_redemption' ? (
                    <>
                      <Ticket className="w-5 h-5 mr-2" />
                      Submit Application (Free)
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 mr-2" />
                      Continue to Payment
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowPayment(false);
                    setPaymentError('');
                  }}
                  className="w-full"
                >
                  ← Back to Plan Selection
                </Button>
                
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h4 className="font-semibold mb-3">Payment Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Plan:</span>
                      <span className="font-medium">{getPlanDetails(selectedPlan).name}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                      <span>Total:</span>
                      <span className="text-rose-600">{getPlanDetails(selectedPlan).price}</span>
                    </div>
                  </div>
                </div>

                <StripePaymentForm
                  amount={getPlanAmount(selectedPlan)}
                  planType={selectedPlan}
                  applicationId={application?.id}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}