import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function Step1_AboutYou({ formData, setFormData, user }) {
  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>About You</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="first_name">First Name</Label>
            <Input id="first_name" value={formData.first_name || ''} onChange={handleChange} placeholder="John" />
          </div>
          <div>
            <Label htmlFor="last_name">Last Name</Label>
            <Input id="last_name" value={formData.last_name || ''} onChange={handleChange} placeholder="Doe" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={user?.email || ''} disabled />
          </div>
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" value={formData.phone || ''} onChange={handleChange} placeholder="(555) 123-4567" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="date_of_birth">Date of Birth</Label>
            <Input id="date_of_birth" type="date" value={formData.date_of_birth || ''} onChange={handleChange} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Street Address</Label>
          <Input id="address" value={formData.address || ''} onChange={handleChange} placeholder="123 Main St" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Label htmlFor="city">City</Label>
            <Input id="city" value={formData.city || ''} onChange={handleChange} placeholder="New York" />
          </div>
          <div>
            <Label htmlFor="state">State / Province</Label>
            <Input id="state" value={formData.state || ''} onChange={handleChange} placeholder="NY" />
          </div>
          <div>
            <Label htmlFor="zip_code">ZIP / Postal Code</Label>
            <Input id="zip_code" value={formData.zip_code || ''} onChange={handleChange} placeholder="10001" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}