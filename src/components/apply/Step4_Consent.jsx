import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

export default function Step4_Consent({ formData, setFormData }) {
  const handleCheckboxChange = (id, checked) => {
    setFormData(prev => ({ ...prev, [id]: checked }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consent & Agreements</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-start space-x-3">
          <Checkbox id="terms_agreement" checked={formData.terms_agreement || false} onCheckedChange={(checked) => handleCheckboxChange('terms_agreement', checked)} />
          <div className="grid gap-1.5 leading-none">
            <label htmlFor="terms_agreement" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              I have read and agree to the <a href="/terms" target="_blank" className="text-rose-600 hover:underline">Terms & Privacy Policy</a>.
            </label>
          </div>
        </div>
        <div className="flex items-start space-x-3">
          <Checkbox id="truthfulness_agreement" checked={formData.truthfulness_agreement || false} onCheckedChange={(checked) => handleCheckboxChange('truthfulness_agreement', checked)} />
          <div className="grid gap-1.5 leading-none">
            <label htmlFor="truthfulness_agreement" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              I certify that all information provided in this application is true and accurate to the best of my knowledge.
            </label>
          </div>
        </div>
        <div className="flex items-start space-x-3">
          <Checkbox id="publicity_consent" checked={formData.publicity_consent || false} onCheckedChange={(checked) => handleCheckboxChange('publicity_consent', checked)} />
          <div className="grid gap-1.5 leading-none">
            <label htmlFor="publicity_consent" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              I consent to having my story and photo shared publicly if I am selected as a grant recipient.
            </label>
            <p className="text-sm text-muted-foreground">You can manage this setting later. We will always contact you before sharing any personal details.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}