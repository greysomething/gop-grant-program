import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const INCOME_RANGES = [
  "Under $25,000",
  "$25,000 - $50,000",
  "$50,000 - $75,000",
  "$75,000 - $100,000",
  "$100,000 - $150,000",
  "$150,000 - $200,000",
  "Over $200,000",
];

export default function Step3_Financials({ formData, setFormData }) {
  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };
  
  const handleSelectChange = (id, value) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="household_size">Household Size</Label>
            <Input id="household_size" type="number" min="1" value={formData.household_size || ''} onChange={handleChange} placeholder="e.g., 2" />
          </div>
          <div>
            <Label htmlFor="income_range">Annual Household Income</Label>
            <Select value={formData.income_range || ''} onValueChange={(value) => handleSelectChange('income_range', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select income range" />
              </SelectTrigger>
              <SelectContent>
                {INCOME_RANGES.map(range => (
                  <SelectItem key={range} value={range}>{range}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="use_of_funds">How would you use the grant funds?</Label>
          <p className="text-sm text-gray-600 mb-2">Briefly describe the treatment, procedure, or services you would use the grant for (e.g., IVF cycle, adoption agency fees, surrogacy costs).</p>
          <Textarea id="use_of_funds" value={formData.use_of_funds || ''} onChange={handleChange} className="h-32" />
        </div>
      </CardContent>
    </Card>
  );
}