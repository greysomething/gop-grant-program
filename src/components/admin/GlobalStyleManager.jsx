import React, { useState, useEffect } from 'react';
import { GlobalStyleSetting } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Palette } from 'lucide-react';

const DEFAULT_STYLE_SETTINGS = [
  // Colors
  { key: 'primary_color', type: 'color', category: 'colors', display_name: 'Primary Color', description: 'Main brand color used for buttons and links', default_value: '#ea580c' },
  { key: 'secondary_color', type: 'color', category: 'colors', display_name: 'Secondary Color', description: 'Secondary brand color', default_value: '#ec4899' },
  { key: 'text_color_primary', type: 'color', category: 'colors', display_name: 'Primary Text Color', description: 'Main text color', default_value: '#111827' },
  { key: 'text_color_secondary', type: 'color', category: 'colors', display_name: 'Secondary Text Color', description: 'Secondary text color', default_value: '#6b7280' },
  { key: 'link_color', type: 'color', category: 'colors', display_name: 'Link Color', description: 'Color for links and hypertext', default_value: '#2563eb' },
  
  // Typography
  { key: 'base_font_size', type: 'font_size', category: 'typography', display_name: 'Base Font Size', description: 'Base font size in pixels', default_value: '16' },
  { key: 'heading_font_size', type: 'font_size', category: 'typography', display_name: 'Heading Font Size', description: 'Main heading font size in pixels', default_value: '32' },
  { key: 'primary_font_family', type: 'font_family', category: 'typography', display_name: 'Primary Font Family', description: 'Main font family', default_value: 'Inter, sans-serif' },
  
  // Buttons
  { key: 'button_bg_primary', type: 'color', category: 'buttons', display_name: 'Primary Button Background', description: 'Background color for primary buttons', default_value: '#ea580c' },
  { key: 'button_text_primary', type: 'color', category: 'buttons', display_name: 'Primary Button Text', description: 'Text color for primary buttons', default_value: '#ffffff' },
  { key: 'button_border_radius', type: 'text', category: 'buttons', display_name: 'Button Border Radius', description: 'Border radius in pixels', default_value: '6' },
];

export default function GlobalStyleManager() {
  const [settings, setSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const existingSettings = await GlobalStyleSetting.list();
      const settingsMap = {};
      
      // Load existing settings
      existingSettings.forEach(setting => {
        settingsMap[setting.setting_key] = setting.setting_value;
      });
      
      // Fill in defaults for missing settings
      DEFAULT_STYLE_SETTINGS.forEach(defaultSetting => {
        if (!(defaultSetting.key in settingsMap)) {
          settingsMap[defaultSetting.key] = defaultSetting.default_value;
        }
      });
      
      setSettings(settingsMap);
    } catch (error) {
      console.error('Failed to load style settings:', error);
    }
    setIsLoading(false);
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const existingSettings = await GlobalStyleSetting.list();
      const existingKeys = existingSettings.map(s => s.setting_key);

      for (const defaultSetting of DEFAULT_STYLE_SETTINGS) {
        const value = settings[defaultSetting.key] || defaultSetting.default_value;
        
        if (existingKeys.includes(defaultSetting.key)) {
          const existing = existingSettings.find(s => s.setting_key === defaultSetting.key);
          if (existing && existing.setting_value !== value) {
            await GlobalStyleSetting.update(existing.id, { setting_value: value });
          }
        } else {
          await GlobalStyleSetting.create({
            setting_key: defaultSetting.key,
            setting_value: value,
            setting_type: defaultSetting.type,
            setting_category: defaultSetting.category,
            display_name: defaultSetting.display_name,
            description: defaultSetting.description,
            default_value: defaultSetting.default_value
          });
        }
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save style settings:', error);
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-rose-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading style settings...</p>
      </div>
    );
  }

  const groupedSettings = DEFAULT_STYLE_SETTINGS.reduce((acc, setting) => {
    if (!acc[setting.category]) acc[setting.category] = [];
    acc[setting.category].push(setting);
    return acc;
  }, {});

  const categoryNames = {
    colors: 'Colors',
    typography: 'Typography',
    buttons: 'Buttons',
    layout: 'Layout'
  };

  const renderSettingInput = (setting) => {
    const value = settings[setting.key] || setting.default_value;
    
    switch (setting.type) {
      case 'color':
        return (
          <div className="flex gap-2">
            <Input
              type="color"
              value={value}
              onChange={(e) => handleSettingChange(setting.key, e.target.value)}
              className="w-16 h-10 p-1"
            />
            <Input
              type="text"
              value={value}
              onChange={(e) => handleSettingChange(setting.key, e.target.value)}
              placeholder="#000000"
              className="flex-grow"
            />
          </div>
        );
        
      case 'font_size':
        return (
          <div className="flex gap-2 items-center">
            <Input
              type="number"
              value={value}
              onChange={(e) => handleSettingChange(setting.key, e.target.value)}
              min="10"
              max="72"
              className="w-20"
            />
            <span className="text-sm text-gray-500">px</span>
          </div>
        );
        
      case 'font_family':
        return (
          <Select value={value} onValueChange={(newValue) => handleSettingChange(setting.key, newValue)}>
            <SelectTrigger>
              <SelectValue placeholder="Select font family" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Inter, sans-serif">Inter</SelectItem>
              <SelectItem value="Arial, sans-serif">Arial</SelectItem>
              <SelectItem value="Helvetica, sans-serif">Helvetica</SelectItem>
              <SelectItem value="Georgia, serif">Georgia</SelectItem>
              <SelectItem value="Times New Roman, serif">Times New Roman</SelectItem>
            </SelectContent>
          </Select>
        );
        
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleSettingChange(setting.key, e.target.value)}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Palette className="w-6 h-6" />
            Global Styles
          </h2>
          <p className="text-gray-600">Customize colors, fonts, and design elements</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : null}
          Save Styles
        </Button>
      </div>

      {saveSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Style settings saved successfully! Refresh the page to see changes.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {Object.entries(groupedSettings).map(([category, categorySettings]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="text-xl">{categoryNames[category]}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {categorySettings.map(setting => (
                <div key={setting.key}>
                  <Label htmlFor={setting.key} className="text-base font-medium">
                    {setting.display_name}
                  </Label>
                  <p className="text-sm text-gray-500 mb-2">{setting.description}</p>
                  {renderSettingInput(setting)}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}