import React, { useState, useEffect, useCallback } from 'react';
import { User } from '@/api/entities';
import { MerchantSettings } from '@/api/entities';
import { getStripeSecretStatus } from '@/api/functions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { 
  CreditCard, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Settings,
  TestTube,
  Shield,
  Globe,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const KeyStatusIndicator = ({ label, isConfigured }) => (
  <div className={`flex items-center justify-between p-3 rounded-md ${isConfigured ? 'bg-green-50' : 'bg-red-50'}`}>
    <span className={`text-sm font-medium ${isConfigured ? 'text-green-800' : 'text-red-800'}`}>{label}</span>
    {isConfigured ? (
      <CheckCircle2 className="w-5 h-5 text-green-600" />
    ) : (
      <AlertCircle className="w-5 h-5 text-red-600" />
    )}
  </div>
);

export default function AdminMerchantSettings() {
  const [user, setUser] = useState(null);
  const [isTestingMode, setIsTestingMode] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [stripeStatus, setStripeStatus] = useState({
    publishable_live: false,
    publishable_test: false,
    secret_live: false,
    secret_test: false,
    webhook_live: false,
    webhook_test: false
  });

  const initialize = useCallback(async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      if (currentUser?.role !== 'admin') {
        window.location.href = createPageUrl("Home");
        return;
      }

      // Load testing mode setting
      const settingsPromise = MerchantSettings.filter({ setting_key: 'stripe_testing_mode' });
      // Load secret status
      const statusPromise = getStripeSecretStatus();

      const [settings, statusResponse] = await Promise.all([settingsPromise, statusPromise]);

      if (settings.length > 0) {
        setIsTestingMode(settings[0].setting_value === 'true');
      } else {
        // Create default setting
        await MerchantSettings.create({
          setting_key: 'stripe_testing_mode',
          setting_value: 'true',
          setting_type: 'boolean',
          description: 'Whether Stripe payments should use test mode',
          category: 'payments'
        });
        setIsTestingMode(true);
      }
      
      if (statusResponse.data) {
        setStripeStatus(statusResponse.data);
      }

    } catch (error) {
      console.error('Failed to initialize merchant settings:', error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);


  const handleTestingModeToggle = async (enabled) => {
    setSaving(true);
    setSaveSuccess(false);
    
    try {
      const settings = await MerchantSettings.filter({ setting_key: 'stripe_testing_mode' });
      
      if (settings.length > 0) {
        await MerchantSettings.update(settings[0].id, {
          setting_value: enabled.toString()
        });
      } else {
        await MerchantSettings.create({
          setting_key: 'stripe_testing_mode',
          setting_value: enabled.toString(),
          setting_type: 'boolean',
          description: 'Whether Stripe payments should use test mode',
          category: 'payments'
        });
      }
      
      setIsTestingMode(enabled);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
    } catch (error) {
      console.error('Failed to update testing mode:', error);
    }
    setSaving(false);
  };

  const getConfigurationStatus = () => {
    const currentKeys = isTestingMode 
      ? [stripeStatus.publishable_test, stripeStatus.secret_test, stripeStatus.webhook_test]
      : [stripeStatus.publishable_live, stripeStatus.secret_live, stripeStatus.webhook_live];
    
    const configuredCount = currentKeys.filter(Boolean).length;
    return {
      isFullyConfigured: configuredCount === 3,
      configuredCount,
      totalCount: 3
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin rounded-full h-8 w-8 text-rose-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading merchant settings...</p>
        </div>
      </div>
    );
  }

  const status = getConfigurationStatus();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl("Admin")}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Admin
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Merchant Settings</h1>
              <p className="text-gray-600">Manage Stripe integration and payment modes</p>
            </div>
          </div>
        </div>
        
        {saveSuccess && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Settings saved successfully!
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-rose-600" />
                Payment Mode
              </CardTitle>
              <CardDescription>
                Toggle between test and live payments. This affects all transactions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {isTestingMode ? (
                    <TestTube className="w-6 h-6 text-yellow-600" />
                  ) : (
                    <Globe className="w-6 h-6 text-green-600" />
                  )}
                  <div>
                    <Label htmlFor="testing-mode" className="font-semibold text-lg">
                      {isTestingMode ? "Stripe Test Mode" : "Stripe Live Mode"}
                    </Label>
                    <p className="text-sm text-gray-500">
                      {isTestingMode ? "No real money will be charged." : "Transactions are real."}
                    </p>
                  </div>
                </div>
                <Switch
                  id="testing-mode"
                  checked={isTestingMode}
                  onCheckedChange={handleTestingModeToggle}
                  disabled={isSaving}
                />
              </div>

              <div className={`p-4 rounded-lg border ${status.isFullyConfigured ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <div className="flex items-center gap-3">
                  {status.isFullyConfigured ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <div>
                    <h4 className={`font-semibold ${status.isFullyConfigured ? 'text-green-900' : 'text-red-900'}`}>
                      {status.isFullyConfigured ? 'Configuration Complete' : 'Configuration Incomplete'}
                    </h4>
                    <p className={`text-sm ${status.isFullyConfigured ? 'text-green-700' : 'text-red-700'}`}>
                      {status.configuredCount} of {status.totalCount} required keys for the current mode are set.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Stripe Key Status
              </CardTitle>
              <CardDescription>
                Shows whether Stripe secret keys are configured in the system.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <KeyStatusIndicator label="Publishable Key (Test)" isConfigured={stripeStatus.publishable_test} />
              <KeyStatusIndicator label="Secret Key (Test)" isConfigured={stripeStatus.secret_test} />
              <KeyStatusIndicator label="Webhook Secret (Test)" isConfigured={stripeStatus.webhook_test} />
              <div className="border-t my-3"></div>
              <KeyStatusIndicator label="Publishable Key (Live)" isConfigured={stripeStatus.publishable_live} />
              <KeyStatusIndicator label="Secret Key (Live)" isConfigured={stripeStatus.secret_live} />
              <KeyStatusIndicator label="Webhook Secret (Live)" isConfigured={stripeStatus.webhook_live} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}