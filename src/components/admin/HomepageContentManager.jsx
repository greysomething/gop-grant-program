
import React, { useState, useEffect, useRef } from 'react';
import { HomePageContent } from '@/api/entities';
import { UploadFile } from '@/api/integrations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, UploadCloud, Image as ImageIcon } from 'lucide-react';

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
    key: 'hero_bg_opacity',
    type: 'slider',
    display_name: 'Hero Background Overlay Opacity',
    section: 'hero',
    description: 'Darkness of the overlay on the hero background (0 = light, 100 = dark)',
    default_value: '40', // Store as string to be consistent with other content values
    min: 0,
    max: 100
  },
  {
    key: 'announcement_header_bg_image',
    type: 'url',
    display_name: 'Announcement Header Background',
    section: 'announcements',
    description: 'Background image for recipient announcement modals'
  },
  {
    key: 'announcement_header_opacity',
    type: 'slider',
    display_name: 'Announcement Header Overlay Opacity',
    section: 'announcements',
    description: 'Opacity of the amber overlay on announcement header (0 = transparent, 100 = solid)',
    default_value: '85', // Store as string
    min: 0,
    max: 100
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

export default function HomepageContentManager() {
  const [content, setContent] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadingKey, setUploadingKey] = useState(null);
  const fileInputRefs = useRef({});

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const contentItems = await HomePageContent.list();
      const contentMap = {};
      contentItems.forEach(item => {
        contentMap[item.content_key] = item.content_value;
      });
      // Initialize default values for new content types if not present
      CONTENT_ITEMS.forEach(item => {
        if (item.default_value !== undefined && contentMap[item.key] === undefined) {
          contentMap[item.key] = item.default_value;
        }
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
    } finally {
      setUploadingKey(null);
    }
  };
  
  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const existingContent = await HomePageContent.list();
      const existingKeys = new Set(existingContent.map(item => item.content_key));

      for (const item of CONTENT_ITEMS) {
        // Use the value from current state, or default value if not set and it's a slider
        const value = content[item.key] !== undefined ? content[item.key] : 
                       (item.type === 'slider' ? item.default_value : '');
        
        if (existingKeys.has(item.key)) {
          const existing = existingContent.find(c => c.content_key === item.key);
          if (existing && existing.content_value !== value) {
            await HomePageContent.update(existing.id, { content_value: value });
          }
        } else {
          // Only create if value is not empty, or if it's a slider with a default value
          if (value.trim() || (item.type === 'slider' && value !== undefined)) { 
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
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-rose-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading homepage content...</p>
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
    cta: 'Final Call-to-Action',
    announcements: 'Announcements'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Homepage Content</h2>
          <p className="text-gray-600">Edit the content displayed on your homepage</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : null}
          Save Changes
        </Button>
      </div>

      {saveSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Homepage content saved successfully!
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
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
                  ) : item.type === 'slider' ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <input
                          id={item.key}
                          type="range"
                          min={item.min || 0}
                          max={item.max || 100}
                          value={content[item.key] !== undefined ? content[item.key] : item.default_value || 50}
                          onChange={(e) => handleContentChange(item.key, e.target.value)}
                          className="flex-grow h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
                        />
                        <span className="text-lg font-semibold text-gray-700 min-w-[3rem] text-right">
                          {content[item.key] !== undefined ? content[item.key] : item.default_value || 50}%
                        </span>
                      </div>
                      {/* Helper text for slider interpretation */}
                      {item.key === 'hero_bg_opacity' && (
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Lighter Overlay</span>
                          <span>Darker Overlay</span>
                        </div>
                      )}
                      {item.key === 'announcement_header_opacity' && (
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>More Transparent</span>
                          <span>More Opaque</span>
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
  );
}
