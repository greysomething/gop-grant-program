import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { UploadFile } from '@/api/integrations';
import { Video, FileText, Upload, CheckCircle2, Loader2, Info } from 'lucide-react';

export default function Step2_YourJourney({ formData, setFormData }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleQuillChange = (value) => {
    setFormData(prev => ({ ...prev, your_journey: value }));
  };

  const handleSubmissionTypeChange = (type, checked) => {
    setFormData(prev => ({
      ...prev,
      submission_type_written: type === 'written' ? checked : prev.submission_type_written,
      submission_type_video: type === 'video' ? checked : prev.submission_type_video
    }));
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      setUploadError('Please upload a valid video file');
      return;
    }

    // Validate file size (100MB max)
    if (file.size > 100 * 1024 * 1024) {
      setUploadError('Video file must be less than 100MB');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      const { file_url } = await UploadFile({ file });
      setFormData(prev => ({ 
        ...prev, 
        video_submission_url: file_url,
        video_submission_filename: file.name
      }));
    } catch (error) {
      console.error('Video upload failed:', error);
      setUploadError('Failed to upload video. Please try again.');
    }

    setIsUploading(false);
  };

  const removeVideo = () => {
    setFormData(prev => ({
      ...prev,
      video_submission_url: '',
      video_submission_filename: ''
    }));
  };

  // Count words in the written story
  const getWordCount = () => {
    if (!formData.your_journey) return 0;
    const text = formData.your_journey.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return text ? text.split(' ').length : 0;
  };

  const wordCount = getWordCount();
  const isOverLimit = wordCount > 500;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Journey</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Share your family-building story with us. You can choose to submit a written story, a video, or both. 
            Only our review board will see your submission.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <Label className="text-base font-semibold">How would you like to share your story?</Label>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
              <Checkbox
                id="submission_written"
                checked={formData.submission_type_written || false}
                onCheckedChange={(checked) => handleSubmissionTypeChange('written', checked)}
              />
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <Label htmlFor="submission_written" className="cursor-pointer font-medium">
                  Written Story (Max 500 words)
                </Label>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
              <Checkbox
                id="submission_video"
                checked={formData.submission_type_video || false}
                onCheckedChange={(checked) => handleSubmissionTypeChange('video', checked)}
              />
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-rose-600" />
                <Label htmlFor="submission_video" className="cursor-pointer font-medium">
                  Video Submission (Max 2 minutes)
                </Label>
              </div>
            </div>
          </div>
        </div>

        {formData.submission_type_written && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="your_journey">Your Written Story</Label>
              <span className={`text-sm ${isOverLimit ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                {wordCount} / 500 words
              </span>
            </div>
            <p className="text-sm text-gray-600">
              Share your family-building journey with us. What challenges have you faced? What are your hopes?
            </p>
            <div className="bg-white rounded-md">
              <ReactQuill
                theme="snow"
                value={formData.your_journey || ''}
                onChange={handleQuillChange}
                className="h-64 mb-12"
              />
            </div>
            {isOverLimit && (
              <p className="text-sm text-red-600">
                Your story exceeds the 500-word limit. Please shorten it to continue.
              </p>
            )}
          </div>
        )}

        {formData.submission_type_video && (
          <div className="space-y-4">
            <Label>Video Submission</Label>
            <p className="text-sm text-gray-600">
              Upload a video (max 2 minutes) sharing your story. Accepted formats: MP4, MOV, AVI, WebM.
            </p>

            {!formData.video_submission_url ? (
              <div>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                  id="video-upload"
                  disabled={isUploading}
                />
                <label htmlFor="video-upload">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-32 border-2 border-dashed"
                    disabled={isUploading}
                    onClick={() => document.getElementById('video-upload')?.click()}
                  >
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
                        <span>Uploading video...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8 text-gray-400" />
                        <span>Click to upload video</span>
                        <span className="text-xs text-gray-500">MP4, MOV, AVI, WebM (max 100MB)</span>
                      </div>
                    )}
                  </Button>
                </label>
              </div>
            ) : (
              <div className="border-2 border-green-200 bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">Video uploaded successfully</p>
                      <p className="text-sm text-gray-600">{formData.video_submission_filename}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={removeVideo}>
                    Remove
                  </Button>
                </div>
              </div>
            )}

            {uploadError && (
              <Alert variant="destructive">
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {!formData.submission_type_written && !formData.submission_type_video && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Please select at least one option above to share your story.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}