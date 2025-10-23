
import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  User as UserIcon,
  Save,
  CheckCircle2,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Shield
} from 'lucide-react';

const INCOME_RANGES = [
  "Under $25,000",
  "$25,000 - $50,000",
  "$50,000 - $75,000",
  "$75,000 - $100,000",
  "$100,000 - $150,000",
  "$150,000 - $200,000",
  "Over $200,000",
];

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

const COUNTRIES = [
  "United States", "Canada", "United Kingdom", "Australia", "Other"
];

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    full_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
    date_of_birth: '',
    household_size: '',
    income_range: '',
    publicity_consent: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      setFormData({
        first_name: currentUser.first_name || '',
        last_name: currentUser.last_name || '',
        full_name: currentUser.full_name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        address: currentUser.address || '',
        city: currentUser.city || '',
        state: currentUser.state || '',
        zip_code: currentUser.zip_code || '',
        country: currentUser.country || 'United States',
        date_of_birth: currentUser.date_of_birth || '',
        household_size: currentUser.household_size || '',
        income_range: currentUser.income_range || '',
        publicity_consent: currentUser.publicity_consent || false
      });
    } catch (error) {
      console.error('Failed to load user profile:', error);
      // Redirect to login if not authenticated
      window.location.href = '/';
    }
    setIsLoading(false);
  };

  const calculateProfileCompletion = () => {
    const requiredFields = ['first_name', 'last_name', 'phone', 'address', 'city', 'state', 'zip_code', 'country', 'date_of_birth', 'household_size', 'income_range'];
    const completedFields = requiredFields.filter(field => formData[field] && formData[field].toString().trim() !== '');
    return Math.round((completedFields.length / requiredFields.length) * 100);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Street address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!formData.zip_code.trim()) {
      newErrors.zip_code = 'ZIP code is required';
    }

    if (!formData.country.trim()) {
      newErrors.country = 'Country is required';
    }

    if (!formData.date_of_birth) {
      newErrors.date_of_birth = 'Date of birth is required';
    }

    if (!formData.household_size || formData.household_size < 1) {
      newErrors.household_size = 'Household size must be at least 1';
    }

    if (!formData.income_range) {
      newErrors.income_range = 'Income range is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[id]) {
      setErrors(prev => ({
        ...prev,
        [id]: ''
      }));
    }
  };

  const handleSelectChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user selects
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const updateData = { ...formData };
      delete updateData.email; // Email can't be updated via profile
      delete updateData.full_name; // Full name can't be updated via profile directly, it's derived from first/last

      await User.updateMyUserData(updateData);
      setSaveSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const completionPercentage = calculateProfileCompletion();

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-600 rounded-full flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
              <p className="text-gray-600">Manage your personal information and preferences</p>
            </div>
          </div>

          {saveSuccess && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Profile updated successfully!
              </AlertDescription>
            </Alert>
          )}

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Profile Completion</span>
                <span className="text-sm font-normal text-gray-600">{completionPercentage}%</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={completionPercentage} className="h-2" />
              <p className="text-sm text-gray-600 mt-2">
                {completionPercentage === 100
                  ? "Your profile is complete!"
                  : "Complete your profile to apply for grants"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-gray-600" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className={errors.first_name ? 'border-red-500' : ''}
                    placeholder="John"
                  />
                  {errors.first_name && (
                    <p className="text-sm text-red-600 mt-1">{errors.first_name}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className={errors.last_name ? 'border-red-500' : ''}
                    placeholder="Doe"
                  />
                  {errors.last_name && (
                    <p className="text-sm text-red-600 mt-1">{errors.last_name}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      disabled
                      className="bg-gray-50"
                    />
                    <Mail className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed here</p>
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <div className="relative">
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={errors.phone ? 'border-red-500' : ''}
                      placeholder="(555) 123-4567"
                    />
                    <Phone className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  </div>
                  {errors.phone && (
                    <p className="text-sm text-red-600 mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date_of_birth">Date of Birth *</Label>
                  <div className="relative">
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={handleInputChange}
                      className={errors.date_of_birth ? 'border-red-500' : ''}
                    />
                    <Calendar className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  </div>
                  {errors.date_of_birth && (
                    <p className="text-sm text-red-600 mt-1">{errors.date_of_birth}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-gray-600" />
                Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address">Street Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className={errors.address ? 'border-red-500' : ''}
                  placeholder="123 Main St"
                />
                {errors.address && (
                  <p className="text-sm text-red-600 mt-1">{errors.address}</p>
                )}
              </div>

              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className={errors.city ? 'border-red-500' : ''}
                  placeholder="New York"
                />
                {errors.city && (
                  <p className="text-sm text-red-600 mt-1">{errors.city}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="state">State / Province *</Label>
                  <Select
                    value={formData.state}
                    onValueChange={(value) => handleSelectChange('state', value)}
                  >
                    <SelectTrigger className={errors.state ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.state && (
                    <p className="text-sm text-red-600 mt-1">{errors.state}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="zip_code">ZIP Code *</Label>
                  <Input
                    id="zip_code"
                    value={formData.zip_code}
                    onChange={handleInputChange}
                    className={errors.zip_code ? 'border-red-500' : ''}
                    placeholder="10001"
                  />
                  {errors.zip_code && (
                    <p className="text-sm text-red-600 mt-1">{errors.zip_code}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="country">Country *</Label>
                  <Select
                    value={formData.country}
                    onValueChange={(value) => handleSelectChange('country', value)}
                  >
                    <SelectTrigger className={errors.country ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map(country => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.country && (
                    <p className="text-sm text-red-600 mt-1">{errors.country}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-600" />
                Household Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="household_size">Household Size *</Label>
                  <Input
                    id="household_size"
                    type="number"
                    min="1"
                    value={formData.household_size}
                    onChange={handleInputChange}
                    className={errors.household_size ? 'border-red-500' : ''}
                    placeholder="2"
                  />
                  {errors.household_size && (
                    <p className="text-sm text-red-600 mt-1">{errors.household_size}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="income_range">Annual Household Income *</Label>
                  <Select
                    value={formData.income_range}
                    onValueChange={(value) => handleSelectChange('income_range', value)}
                  >
                    <SelectTrigger className={errors.income_range ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select income range" />
                    </SelectTrigger>
                    <SelectContent>
                      {INCOME_RANGES.map(range => (
                        <SelectItem key={range} value={range}>{range}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.income_range && (
                    <p className="text-sm text-red-600 mt-1">{errors.income_range}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-gray-600" />
                Privacy Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="publicity_consent" className="text-base font-medium">
                    Publicity Consent
                  </Label>
                  <p className="text-sm text-gray-600">
                    Allow us to share your story (anonymized) if you receive a grant to inspire others
                  </p>
                </div>
                <Switch
                  id="publicity_consent"
                  checked={formData.publicity_consent}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({ ...prev, publicity_consent: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4 pt-4">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-rose-600 hover:bg-rose-700"
              size="lg"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Profile
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
