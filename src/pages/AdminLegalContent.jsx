import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { LegalContent } from '@/api/entities';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, FileText, Eye, Save, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function AdminLegalContent() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [termsContent, setTermsContent] = useState(null);
  const [privacyContent, setPrivacyContent] = useState(null);
  const [activeTab, setActiveTab] = useState('terms');
  const [previewMode, setPreviewMode] = useState(false);

  const [termsForm, setTermsForm] = useState({
    title: 'Terms of Service',
    content_md: '',
    version: '1.0'
  });

  const [privacyForm, setPrivacyForm] = useState({
    title: 'Privacy Policy',
    content_md: '',
    version: '1.0'
  });

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      if (currentUser?.role !== 'admin') {
        window.location.href = createPageUrl("Home");
        return;
      }

      const allContent = await LegalContent.list();
      
      const terms = allContent.find(c => c.content_key === 'terms_of_service');
      const privacy = allContent.find(c => c.content_key === 'privacy_policy');

      if (terms) {
        setTermsContent(terms);
        setTermsForm({
          title: terms.title || 'Terms of Service',
          content_md: terms.content_md || '',
          version: terms.version || '1.0'
        });
      }

      if (privacy) {
        setPrivacyContent(privacy);
        setPrivacyForm({
          title: privacy.title || 'Privacy Policy',
          content_md: privacy.content_md || '',
          version: privacy.version || '1.0'
        });
      }

    } catch (error) {
      console.error('Failed to load legal content:', error);
    }
    setIsLoading(false);
  };

  const handleSave = async (contentType) => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const isTerms = contentType === 'terms';
      const formData = isTerms ? termsForm : privacyForm;
      const existingContent = isTerms ? termsContent : privacyContent;
      const contentKey = isTerms ? 'terms_of_service' : 'privacy_policy';

      const dataToSave = {
        content_key: contentKey,
        title: formData.title,
        content_md: formData.content_md,
        version: formData.version,
        last_updated: new Date().toISOString()
      };

      if (existingContent) {
        await LegalContent.update(existingContent.id, dataToSave);
      } else {
        const newContent = await LegalContent.create(dataToSave);
        if (isTerms) {
          setTermsContent(newContent);
        } else {
          setPrivacyContent(newContent);
        }
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

    } catch (error) {
      console.error('Failed to save legal content:', error);
      alert('Failed to save content. Please try again.');
    }

    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading legal content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl("Admin")}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Legal Content Management</h1>
            <p className="text-gray-600">Edit Terms of Service and Privacy Policy</p>
          </div>
        </div>

        {saveSuccess && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Content saved successfully!
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="terms">Terms of Service</TabsTrigger>
            <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
          </TabsList>

          <TabsContent value="terms" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Terms of Service
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewMode(!previewMode)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {previewMode ? 'Edit' : 'Preview'}
                    </Button>
                    <Button
                      onClick={() => handleSave('terms')}
                      disabled={isSaving}
                      className="bg-rose-600 hover:bg-rose-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!previewMode ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="terms-title">Document Title</Label>
                      <Input
                        id="terms-title"
                        value={termsForm.title}
                        onChange={(e) => setTermsForm({ ...termsForm, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="terms-version">Version</Label>
                      <Input
                        id="terms-version"
                        value={termsForm.version}
                        onChange={(e) => setTermsForm({ ...termsForm, version: e.target.value })}
                        placeholder="1.0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="terms-content">Content (Markdown)</Label>
                      <Textarea
                        id="terms-content"
                        value={termsForm.content_md}
                        onChange={(e) => setTermsForm({ ...termsForm, content_md: e.target.value })}
                        rows={20}
                        placeholder="Enter your Terms of Service content in Markdown format..."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="prose max-w-none">
                    <h1>{termsForm.title}</h1>
                    <p className="text-sm text-gray-500">Version {termsForm.version}</p>
                    <ReactMarkdown>{termsForm.content_md || '*No content yet...*'}</ReactMarkdown>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-600" />
                    Privacy Policy
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewMode(!previewMode)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {previewMode ? 'Edit' : 'Preview'}
                    </Button>
                    <Button
                      onClick={() => handleSave('privacy')}
                      disabled={isSaving}
                      className="bg-rose-600 hover:bg-rose-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!previewMode ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="privacy-title">Document Title</Label>
                      <Input
                        id="privacy-title"
                        value={privacyForm.title}
                        onChange={(e) => setPrivacyForm({ ...privacyForm, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="privacy-version">Version</Label>
                      <Input
                        id="privacy-version"
                        value={privacyForm.version}
                        onChange={(e) => setPrivacyForm({ ...privacyForm, version: e.target.value })}
                        placeholder="1.0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="privacy-content">Content (Markdown)</Label>
                      <Textarea
                        id="privacy-content"
                        value={privacyForm.content_md}
                        onChange={(e) => setPrivacyForm({ ...privacyForm, content_md: e.target.value })}
                        rows={20}
                        placeholder="Enter your Privacy Policy content in Markdown format..."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="prose max-w-none">
                    <h1>{privacyForm.title}</h1>
                    <p className="text-sm text-gray-500">Version {privacyForm.version}</p>
                    <ReactMarkdown>{privacyForm.content_md || '*No content yet...*'}</ReactMarkdown>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}