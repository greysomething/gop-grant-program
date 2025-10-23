
import React, { useState, useEffect, useRef } from 'react';
import { User } from '@/api/entities';
import { HomePageContent } from '@/api/entities';
import { UploadFile } from '@/api/integrations';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Save, Home, CheckCircle2, UploadCloud, Image as ImageIcon } from 'lucide-react';

const CONTENT_ITEMS = [
  {
    key: 'hero_heading',
    type: 'text',
    display_name: 'Hero Heading',
    section: 'hero',
    description: 'Main headline on the hero section'
  },
  {
    key: 'hero_paragraph',
    type: 'textarea',
    display_name: 'Hero Paragraph',
    section: 'hero',
    description: 'Main description text under the hero heading'
  },
  {
    key: 'hero_primary_button',
    type: 'text',
    display_name: 'Primary Button Text',
    section: 'hero',
    description: 'Text for the main call-to-action button'
  },
  {
    key: 'hero_secondary_button',
    type: 'text',
    display_name: 'Secondary Button Text',
    section: 'hero',
    description: 'Text for the secondary button'
  },
  {
    key: 'hero_bg_image',
    type: 'url',
    display_name: 'Hero Background Image URL',
    section: 'hero',
    description: 'Background image URL for the hero section'
  },
  {
    key: 'how_it_works_title',
    type: 'text',
    display_name: 'How It Works Title',
    section: 'how_it_works',
    description: 'Title for the How It Works section'
  },
  {
    key: 'how_it_works_subtitle',
    type: 'textarea',
    display_name: 'How It Works Subtitle',
    section: 'how_it_works',
    description: 'Subtitle/description for the How It Works section'
  },
  {
    key: 'application_plans_title',
    type: 'text',
    display_name: 'Application Plans Title',
    section: 'plans',
    description: 'Title for the application plans section'
  },
  {
    key: 'real_families_title',
    type: 'text',
    display_name: 'Real Families Section Title',
    section: 'stories',
    description: 'Title for the testimonials/stories section'
  },
  {
    key: 'share_hope_title',
    type: 'text',
    display_name: 'Share Hope Section Title',
    section: 'gift',
    description: 'Title for the gift nomination section'
  },
  {
    key: 'final_cta_title',
    type: 'text',
    display_name: 'Final CTA Title',
    section: 'cta',
    description: 'Title for the final call-to-action section'
  },
  {
    key: 'final_cta_subtitle',
    type: 'textarea',
    display_name: 'Final CTA Subtitle',
    section: 'cta',
    description: 'Subtitle for the final call-to-action section'
  }
];

export default function AdminHomeContent() {
  const [user, setUser] = useState(null);
  const [content, setContent] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadingKey, setUploadingKey] = useState(null);
  const fileInputRefs = useRef({});

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

      // Load existing content
      const contentItems = await HomePageContent.list();
      const contentMap = {};
      contentItems.forEach(item => {
        contentMap[item.content_key] = item.content_value;
      });
      setContent(contentMap);
    } catch (error) {
      console.error('Failed to load content:', error);
    }
    setIsLoading(false);
  };

  const handleContentChange = (key, value) => {
    setContent(prev => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = async (key, file) => {
    if (!file) return;
    setUploadingKey(key);
    try {
      const { file_url } = await UploadFile({ file });
      handleContentChange(key, file_url);
    } catch (error) {
      console.error('Image upload failed:', error);
      // Optionally, show an error message to the user
    } finally {
      setUploadingKey(null);
    }
  };
  
  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // Get existing content to check what needs to be created vs updated
      const existingContent = await HomePageContent.list();
      const existingKeys = existingContent.map(item => item.content_key);

      for (const item of CONTENT_ITEMS) {
        const value = content[item.key] || '';
        
        if (existingKeys.includes(item.key)) {
          // Update existing
          const existing = existingContent.find(c => c.content_key === item.key);
          if (existing && existing.content_value !== value) {
            await HomePageContent.update(existing.id, { content_value: value });
          }
        } else {
          // Create new
          if (value.trim()) { // Only create if there's a value to save
            await HomePageContent.create({
              content_key: item.key,
              content_type: item.type,
              content_value: value,
              display_name: item.display_name,
              description: item.description,
              section: item.section
            });
          }
        }
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save content:', error);
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading homepage content...</p>
        </div>
      </div>
    );
  }

  const groupedContent = CONTENT_ITEMS.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});

  const sectionNames = {
    hero: 'Hero Section',
    how_it_works: 'How It Works',
    plans: 'Application Plans',
    stories: 'Success Stories',
    gift: 'Gift Nomination',
    cta: 'Final Call-to-Action'
  };

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
              <h1 className="text-3xl font-bold text-gray-900">Homepage Content</h1>
              <p className="text-gray-600">Edit the content displayed on your homepage</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to={createPageUrl("Home")} target="_blank">
              <Button variant="outline" size="sm">
                <Home className="w-4 h-4 mr-2" />
                Preview
              </Button>
            </Link>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </div>

        {saveSuccess && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Homepage content saved successfully!
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-8">
          {Object.entries(groupedContent).map(([section, items]) => (
            <Card key={section}>
              <CardHeader>
                <CardTitle className="text-xl">{sectionNames[section]}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {items.map(item => (
                  <div key={item.key}>
                    <Label htmlFor={item.key} className="text-base font-medium">
                      {item.display_name}
                    </Label>
                    <p className="text-sm text-gray-500 mb-2">{item.description}</p>
                    {item.type === 'textarea' ? (
                      <Textarea
                        id={item.key}
                        value={content[item.key] || ''}
                        onChange={(e) => handleContentChange(item.key, e.target.value)}
                        rows={3}
                        className="w-full"
                      />
                    ) : item.type === 'url' ? (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            id={item.key}
                            type="url"
                            value={content[item.key] || ''}
                            onChange={(e) => handleContentChange(item.key, e.target.value)}
                            className="flex-grow"
                            placeholder="https://... or upload an image"
                          />
                          <input
                            type="file"
                            ref={el => (fileInputRefs.current[item.key] = el)}
                            onChange={(e) => handleImageUpload(item.key, e.target.files[0])}
                            className="hidden"
                            accept="image/*"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRefs.current[item.key].click()}
                            disabled={uploadingKey === item.key}
                          >
                            {uploadingKey === item.key ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                            ) : (
                              <UploadCloud className="w-4 h-4 mr-2" />
                            )}
                            Upload
                          </Button>
                        </div>
                        {content[item.key] && (
                          <div className="mt-2 p-2 border rounded-lg bg-gray-50 flex items-center gap-4">
                            <ImageIcon className="w-8 h-8 text-gray-400 flex-shrink-0" />
                            <img src={content[item.key]} alt="Preview" className="h-16 w-auto rounded object-cover" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <Input
                        id={item.key}
                        type="text"
                        value={content[item.key] || ''}
                        onChange={(e) => handleContentChange(item.key, e.target.value)}
                        className="w-full"
                      />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
