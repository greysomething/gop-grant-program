import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, TestTube } from 'lucide-react';
import { createPaymentIntent } from '@/api/functions';
import { getStripeConfig } from '@/api/functions';
import { createPageUrl } from '@/utils';

const PaymentForm = ({ clientSecret, onSuccess, onError, amount, planType, environment, applicationId }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setMessage('');

    // Save application ID and plan type to localStorage before redirect
    localStorage.setItem('gop_application_id', applicationId);
    localStorage.setItem('gop_plan_type', planType);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}${createPageUrl('PaymentSuccess')}`,
      },
    });

    if (error) {
      setMessage(error.message);
      onError?.(error);
      setIsProcessing(false);
    } else {
      onSuccess?.();
    }
  };

  const formatAmount = (cents) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {environment === 'test' && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <TestTube className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Test Mode:</strong> No real money will be charged. Use test card 4242 4242 4242 4242.
          </AlertDescription>
        </Alert>
      )}

      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="font-medium">Total Amount:</span>
            {environment === 'test' && (
              <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300">
                TEST
              </Badge>
            )}
          </div>
          <span className="text-lg font-bold text-green-600">
            {formatAmount(amount)}
          </span>
        </div>
      </div>

      <PaymentElement />
      
      {message && (
        <Alert variant="destructive">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <Button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full bg-rose-600 hover:bg-rose-700"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            {environment === 'test' ? 'Test Pay' : 'Pay'} {formatAmount(amount)}
          </>
        )}
      </Button>
    </form>
  );
};

export default function StripePaymentForm({ amount, planType, applicationId, onSuccess, onError }) {
  const [clientSecret, setClientSecret] = useState('');
  const [stripePromise, setStripePromise] = useState(null);
  const [environment, setEnvironment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const initializePayment = async () => {
      try {
        setIsLoading(true);
        setError('');

        // Get Stripe configuration
        const configResponse = await getStripeConfig();
        if (configResponse.data?.publishableKey) {
          const stripeInstance = await loadStripe(configResponse.data.publishableKey);
          setStripePromise(() => stripeInstance);
          setEnvironment(configResponse.data.environment);
        } else {
          setError('Failed to load Stripe configuration');
          return;
        }

        // Create payment intent
        const response = await createPaymentIntent({
          amount,
          planType,
          applicationId
        });

        if (response.data?.clientSecret) {
          setClientSecret(response.data.clientSecret);
        } else {
          setError('Failed to initialize payment');
        }
      } catch (err) {
        setError('Failed to connect to payment service');
        console.error('Payment initialization failed:', err);
      }
      setIsLoading(false);
    };

    initializePayment();
  }, [amount, planType, applicationId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Initializing payment...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
        <Button onClick={() => window.location.reload()} className="mt-2">
          Try Again
        </Button>
      </Alert>
    );
  }

  if (!clientSecret || !stripePromise) {
    return (
      <Alert>
        <AlertDescription>Failed to initialize payment. Please try again.</AlertDescription>
      </Alert>
    );
  }

  return (
    <Elements 
      stripe={stripePromise} 
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#e11d48',
          },
        },
      }}
    >
      <PaymentForm
        clientSecret={clientSecret}
        amount={amount}
        planType={planType}
        applicationId={applicationId}
        environment={environment}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
}