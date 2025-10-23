import React, { useState, useEffect } from 'react';
import { LegalContent } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Shield } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function TermsPage() {
  const [termsContent, setTermsContent] = useState(null);
  const [privacyContent, setPrivacyContent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const allContent = await LegalContent.list();
      
      const terms = allContent.find(c => c.content_key === 'terms_of_service');
      const privacy = allContent.find(c => c.content_key === 'privacy_policy');

      setTermsContent(terms);
      setPrivacyContent(privacy);
    } catch (error) {
      console.error('Failed to load legal content:', error);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Tabs defaultValue="terms" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="terms" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Terms of Service
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Privacy Policy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="terms">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                {termsContent?.title || 'Terms of Service'}
              </CardTitle>
              {termsContent?.version && (
                <p className="text-sm text-gray-500">Version {termsContent.version}</p>
              )}
              {termsContent?.last_updated && (
                <p className="text-xs text-gray-400">
                  Last updated: {new Date(termsContent.last_updated).toLocaleDateString()}
                </p>
              )}
            </CardHeader>
            <CardContent>
              {termsContent?.content_md ? (
                <div className="prose max-w-none">
                  <ReactMarkdown>{termsContent.content_md}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-gray-500 italic">Terms of Service content is being updated. Please check back soon.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600" />
                {privacyContent?.title || 'Privacy Policy'}
              </CardTitle>
              {privacyContent?.version && (
                <p className="text-sm text-gray-500">Version {privacyContent.version}</p>
              )}
              {privacyContent?.last_updated && (
                <p className="text-xs text-gray-400">
                  Last updated: {new Date(privacyContent.last_updated).toLocaleDateString()}
                </p>
              )}
            </CardHeader>
            <CardContent>
              {privacyContent?.content_md ? (
                <div className="prose max-w-none">
                  <ReactMarkdown>{privacyContent.content_md}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-gray-500 italic">Privacy Policy content is being updated. Please check back soon.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}