
import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PlusCircle, Edit, Trash2, Users, GitBranch, Play, Loader2, Mail, Eye, Plus, Save } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const SequenceForm = ({ sequence, templates, onSave, onCancel }) => {
  const [currentSequence, setCurrentSequence] = useState(sequence || {
    name: "",
    description: "",
    trigger_type: "manual",
    trigger_status: "",
    is_active: true,
    total_steps: 0
  });

  const [steps, setSteps] = useState([]);
  const [isLoadingSteps, setIsLoadingSteps] = useState(false);

  useEffect(() => {
    if (sequence) {
      loadSteps();
    }
  }, [sequence]);

  const loadSteps = async () => {
    if (!sequence) return;
    setIsLoadingSteps(true);
    try {
      const data = await base44.entities.EmailSequenceStep.filter({ sequence_id: sequence.id });
      setSteps(data.sort((a, b) => a.step_number - b.step_number));
    } catch (error) {
      console.error("Error loading steps:", error);
    } finally {
      setIsLoadingSteps(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentSequence(prev => ({ ...prev, [name]: value }));
  };

  const handleAddStep = () => {
    setSteps(prev => [...prev, {
      step_number: prev.length + 1,
      delay_days: 0,
      template_id: "",
      template_name: ""
    }]);
  };

  const handleUpdateStep = (index, field, value) => {
    setSteps(prev => prev.map((step, i) => {
      if (i === index) {
        if (field === 'template_id') {
          const template = templates.find(t => t.id === value);
          return { ...step, template_id: value, template_name: template?.name || '' };
        }
        return { ...step, [field]: value };
      }
      return step;
    }));
  };

  const handleRemoveStep = (index) => {
    setSteps(prev => prev.filter((_, i) => i !== index).map((step, i) => ({
      ...step,
      step_number: i + 1
    })));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave({ ...currentSequence, total_steps: steps.length }, steps);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4 max-h-[80vh] overflow-y-auto">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Sequence Name</Label>
          <Input
            id="name"
            name="name"
            value={currentSequence.name}
            onChange={handleInputChange}
            required
            placeholder="e.g., Application Follow-up Series"
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            value={currentSequence.description}
            onChange={handleInputChange}
            placeholder="What is this sequence for?"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="trigger_type">Trigger Type</Label>
            <Select
              value={currentSequence.trigger_type}
              onValueChange={(value) => setCurrentSequence(prev => ({ ...prev, trigger_type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select trigger" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual (Admin Enrolls)</SelectItem>
                <SelectItem value="application_submitted">On Application Submitted</SelectItem>
                <SelectItem value="status_change">On Status Change</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {currentSequence.trigger_type === "status_change" && (
            <div>
              <Label htmlFor="trigger_status">Trigger Status</Label>
              <Select
                value={currentSequence.trigger_status}
                onValueChange={(value) => setCurrentSequence(prev => ({ ...prev, trigger_status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft (Incomplete Application)</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="finalist">Finalist</SelectItem>
                  <SelectItem value="awarded">Awarded</SelectItem>
                  <SelectItem value="not_selected">Not Selected</SelectItem>
                </SelectContent>
              </Select>
              {currentSequence.trigger_status === 'draft' && (
                <p className="text-xs text-amber-600 mt-1">
                  💡 Tip: Set your first email step to delay 1+ days so users who complete their application aren't contacted
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="is_active"
            checked={currentSequence.is_active}
            onCheckedChange={(checked) => setCurrentSequence(prev => ({ ...prev, is_active: checked }))}
          />
          <Label htmlFor="is_active">Active</Label>
        </div>
      </div>

      <div className="space-y-4 border-t pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Email Steps</h3>
          <Button type="button" onClick={handleAddStep} variant="outline" size="sm">
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Step
          </Button>
        </div>

        {steps.length === 0 ? (
          <Alert>
            <AlertDescription>
              No steps added yet. Click "Add Step" to create your first email in this sequence.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {steps.map((step, index) => (
              <Card key={index} className="bg-gray-50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div>
                        <Label>Email Template</Label>
                        <Select
                          value={step.template_id}
                          onValueChange={(value) => handleUpdateStep(index, 'template_id', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select template" />
                          </SelectTrigger>
                          <SelectContent>
                            {templates.map(template => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Delay (Days)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={step.delay_days}
                          onChange={(e) => handleUpdateStep(index, 'delay_days', parseInt(e.target.value) || 0)}
                          placeholder="0 = immediate"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveStep(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save Sequence</Button>
      </div>
    </form>
  );
};

const SequenceManagementDialog = ({ sequence, onClose, onAlert, onRefreshSequences }) => {
  const [steps, setSteps] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewTemplateDialog, setShowNewTemplateDialog] = useState(false);
  const [showEditTemplateDialog, setShowEditTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showAddStepDialog, setShowAddStepDialog] = useState(false);
  const [newStepData, setNewStepData] = useState({ template_id: '', delay_days: 0 });

  const [templateFormData, setTemplateFormData] = useState({
    name: '',
    subject: '',
    body_html: '',
    description: '',
    category: 'sequence'
  });

  useEffect(() => {
    loadSequenceData();
  }, [sequence]);

  const loadSequenceData = async () => {
    setIsLoading(true);
    try {
      const [stepsData, templatesData] = await Promise.all([
        base44.entities.EmailSequenceStep.filter({ sequence_id: sequence.id }),
        base44.entities.EmailTemplate.list()
      ]);
      
      setSteps(stepsData.sort((a, b) => a.step_number - b.step_number));
      setTemplates(templatesData);
    } catch (error) {
      console.error("Error loading sequence data:", error);
      onAlert("Error loading sequence data", "destructive");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    try {
      const newTemplate = await base44.entities.EmailTemplate.create({
        ...templateFormData,
        template_key: `custom_${Date.now()}`,
        is_active: true,
        available_variables: []
      });
      
      setTemplates([...templates, newTemplate]);
      setShowNewTemplateDialog(false);
      setTemplateFormData({
        name: '',
        subject: '',
        body_html: '',
        description: '',
        category: 'sequence'
      });
      onAlert("Template created successfully");
    } catch (error) {
      console.error("Error creating template:", error);
      onAlert("Error creating template", "destructive");
    }
  };

  const handleEditTemplate = (step) => {
    const template = templates.find(t => t.id === step.template_id);
    if (template) {
      setEditingTemplate(template);
      setTemplateFormData({
        name: template.name,
        subject: template.subject,
        body_html: template.body_html,
        description: template.description || '',
        category: template.category || 'sequence'
      });
      setShowEditTemplateDialog(true);
    }
  };

  const handleSaveTemplateEdit = async () => {
    try {
      await base44.entities.EmailTemplate.update(editingTemplate.id, templateFormData);
      onAlert("Template updated successfully");
      setShowEditTemplateDialog(false);
      loadSequenceData();
    } catch (error) {
      console.error("Error updating template:", error);
      onAlert("Error updating template", "destructive");
    }
  };

  const handleAddStep = async () => {
    try {
      const template = templates.find(t => t.id === newStepData.template_id);
      await base44.entities.EmailSequenceStep.create({
        sequence_id: sequence.id,
        step_number: steps.length + 1,
        delay_days: newStepData.delay_days,
        template_id: newStepData.template_id,
        template_name: template?.name || ''
      });

      // Update sequence total_steps
      await base44.entities.EmailSequence.update(sequence.id, {
        total_steps: steps.length + 1
      });

      setShowAddStepDialog(false);
      setNewStepData({ template_id: '', delay_days: 0 });
      loadSequenceData();
      onRefreshSequences();
      onAlert("Step added successfully");
    } catch (error) {
      console.error("Error adding step:", error);
      onAlert("Error adding step", "destructive");
    }
  };

  const handleDeleteStep = async (stepId, stepNumber) => {
    if (!confirm("Are you sure you want to delete this step? This will reorder subsequent steps.")) return;

    try {
      // Try to delete the step, but don't fail if it doesn't exist
      try {
        await base44.entities.EmailSequenceStep.delete(stepId);
      } catch (deleteError) {
        console.warn(`Step ${stepId} already deleted or not found, continuing...`, deleteError);
      }

      // Reload data to get current state
      await loadSequenceData();
      
      // Get fresh steps and reorder them
      const freshSteps = await base44.entities.EmailSequenceStep.filter({ sequence_id: sequence.id });
      const sortedSteps = freshSteps.sort((a, b) => a.step_number - b.step_number);
      
      // Reorder remaining steps
      for (let i = 0; i < sortedSteps.length; i++) {
        if (sortedSteps[i].step_number !== i + 1) {
          await base44.entities.EmailSequenceStep.update(sortedSteps[i].id, {
            step_number: i + 1
          });
        }
      }

      // Update sequence total_steps
      await base44.entities.EmailSequence.update(sequence.id, {
        total_steps: sortedSteps.length
      });

      await loadSequenceData();
      onRefreshSequences();
      onAlert("Step deleted successfully");
    } catch (error) {
      console.error("Error deleting step or reordering:", error);
      onAlert("Error deleting step", "destructive");
    }
  };

  const getTemplatePreview = () => {
    let content = templateFormData.body_html;
    const sampleData = {
      user_name: 'John Doe',
      application_id: 'APP-2024-001',
      cycle_name: 'Q1 2024',
      announce_date: 'March 15, 2024'
    };
    Object.entries(sampleData).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, value);
    });
    return content;
  };

  return (
    <>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Manage Sequence: "{sequence.name}"</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Loading sequence...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">{steps.length} email{steps.length !== 1 ? 's' : ''} in this sequence</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setShowNewTemplateDialog(true)} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  New Template
                </Button>
                <Button onClick={() => setShowAddStepDialog(true)} size="sm">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Add Step
                </Button>
              </div>
            </div>

            {steps.length === 0 ? (
              <Alert>
                <AlertDescription>
                  No email steps configured yet. Click "Add Step" to create your first email.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {steps.map((step) => {
                  const template = templates.find(t => t.id === step.template_id);
                  return (
                    <Card key={step.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-lg flex-shrink-0">
                            {step.step_number}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-semibold text-lg text-gray-900">{template?.name || 'Unknown Template'}</h4>
                                <p className="text-sm text-gray-600">{template?.description}</p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditTemplate(step)}
                                  disabled={!template}
                                >
                                  <Edit className="w-4 h-4 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteStep(step.id, step.step_number)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="bg-white rounded-md p-3 border">
                                <span className="text-gray-500 block mb-1">Subject Line:</span>
                                <p className="font-medium text-gray-900">{template?.subject}</p>
                              </div>
                              <div className="bg-white rounded-md p-3 border">
                                <span className="text-gray-500 block mb-1">Delay:</span>
                                <p className="font-medium text-gray-900">
                                  {step.delay_days === 0 ? 'Sent Immediately' : `Wait ${step.delay_days} day${step.delay_days !== 1 ? 's' : ''}`}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
        
        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>

      {/* New Template Dialog */}
      <Dialog open={showNewTemplateDialog} onOpenChange={setShowNewTemplateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Email Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-template-name">Template Name</Label>
              <Input
                id="new-template-name"
                value={templateFormData.name}
                onChange={(e) => setTemplateFormData({ ...templateFormData, name: e.target.value })}
                placeholder="e.g., Day 3 Follow-up Email"
              />
            </div>
            <div>
              <Label htmlFor="new-template-subject">Subject Line</Label>
              <Input
                id="new-template-subject"
                value={templateFormData.subject}
                onChange={(e) => setTemplateFormData({ ...templateFormData, subject: e.target.value })}
                placeholder="e.g., Quick check-in about your application"
              />
            </div>
            <div>
              <Label htmlFor="new-template-description">Description</Label>
              <Textarea
                id="new-template-description"
                value={templateFormData.description}
                onChange={(e) => setTemplateFormData({ ...templateFormData, description: e.target.value })}
                placeholder="Describe when and why this template is used..."
                rows={2}
              />
            </div>
            <div>
              <Label>Email Body</Label>
              <ReactQuill
                theme="snow"
                value={templateFormData.body_html}
                onChange={(value) => setTemplateFormData({ ...templateFormData, body_html: value })}
                className="h-64 mb-12"
              />
            </div>
            <Alert>
              <AlertDescription>
                <strong>Available Variables:</strong> Use {`{{user_name}}`}, {`{{application_id}}`}, {`{{cycle_name}}`}, {`{{announce_date}}`} to personalize your emails.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewTemplateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateTemplate}>
              <Save className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={showEditTemplateDialog} onOpenChange={setShowEditTemplateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Email Template: {editingTemplate?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-template-name">Template Name</Label>
              <Input
                id="edit-template-name"
                value={templateFormData.name}
                onChange={(e) => setTemplateFormData({ ...templateFormData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-template-subject">Subject Line</Label>
              <Input
                id="edit-template-subject"
                value={templateFormData.subject}
                onChange={(e) => setTemplateFormData({ ...templateFormData, subject: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-template-description">Description</Label>
              <Textarea
                id="edit-template-description"
                value={templateFormData.description}
                onChange={(e) => setTemplateFormData({ ...templateFormData, description: e.target.value })}
                rows={2}
              />
            </div>
            <div>
              <Label>Email Body</Label>
              <ReactQuill
                theme="snow"
                value={templateFormData.body_html}
                onChange={(value) => setTemplateFormData({ ...templateFormData, body_html: value })}
                className="h-64 mb-12"
              />
            </div>
            <div>
              <Label className="mb-2 block">Preview</Label>
              <div className="border rounded-lg p-4 bg-white max-h-60 overflow-y-auto">
                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: getTemplatePreview() }} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditTemplateDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveTemplateEdit}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Step Dialog */}
      <Dialog open={showAddStepDialog} onOpenChange={setShowAddStepDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Email Step</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Email Template</Label>
              <Select
                value={newStepData.template_id}
                onValueChange={(value) => setNewStepData({ ...newStepData, template_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.filter(t => t.category === 'sequence').map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">Only showing sequence email templates</p>
            </div>
            <div>
              <Label>Delay (Days)</Label>
              <Input
                type="number"
                min="0"
                value={newStepData.delay_days}
                onChange={(e) => setNewStepData({ ...newStepData, delay_days: parseInt(e.target.value) || 0 })}
                placeholder="0 = immediate"
              />
              <p className="text-xs text-gray-500 mt-1">Number of days to wait before sending this email</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddStepDialog(false)}>Cancel</Button>
            <Button onClick={handleAddStep} disabled={!newStepData.template_id}>
              Add Step
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default function EmailSequences({ onAlert }) {
  const [sequences, setSequences] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSequence, setEditingSequence] = useState(null);
  const [enrollmentDialogOpen, setEnrollmentDialogOpen] = useState(false);
  const [selectedSequence, setSelectedSequence] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [managingSequence, setManagingSequence] = useState(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Try to load sequences with better error handling
      let seqData = [];
      let tempData = [];
      
      try {
        seqData = await base44.entities.EmailSequence.list("-created_date");
      } catch (seqError) {
        console.warn("Could not load sequences:", seqError);
        // If sequences don't exist yet, that's okay - start with empty array
        seqData = [];
      }
      
      try {
        tempData = await base44.entities.EmailTemplate.filter({ is_active: true });
      } catch (tempError) {
        console.warn("Could not load templates with 'is_active: true' filter:", tempError);
        // Try loading all templates without filter
        try {
          tempData = await base44.entities.EmailTemplate.list();
        } catch (e) {
          console.error("Could not load any templates:", e);
          tempData = [];
        }
      }
      
      setSequences(seqData);
      setTemplates(tempData);
    } catch (error) {
      console.error("Error loading sequences:", error);
      onAlert("Error loading email sequences. Please refresh the page.", "destructive");
    } finally {
      setIsLoading(false);
    }
  }, [onAlert]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async (sequenceData, steps) => {
    try {
      let savedSequence;
      
      // Validate that we have at least one step
      if (steps.length === 0) {
        onAlert("Please add at least one email step to the sequence", "destructive");
        return;
      }
      
      // Validate that all steps have templates selected
      const hasEmptyTemplates = steps.some(step => !step.template_id);
      if (hasEmptyTemplates) {
        onAlert("Please select an email template for all steps", "destructive");
        return;
      }
      
      if (editingSequence) {
        // Update existing sequence
        console.log("Updating sequence:", editingSequence.id, sequenceData);
        await base44.entities.EmailSequence.update(editingSequence.id, sequenceData);
        savedSequence = { ...editingSequence, ...sequenceData };
        
        // Delete old steps - with error handling
        try {
          const oldSteps = await base44.entities.EmailSequenceStep.filter({ sequence_id: editingSequence.id });
          console.log(`Found ${oldSteps.length} old steps to delete`);
          for (const step of oldSteps) {
            try {
              await base44.entities.EmailSequenceStep.delete(step.id);
            } catch (deleteError) {
              console.warn(`Step ${step.id} already deleted, continuing...`);
            }
          }
        } catch (fetchError) {
          console.warn("Could not fetch old steps, they may have been deleted already or sequence_id not found", fetchError);
        }
      } else {
        // Create new sequence
        console.log("Creating new sequence:", sequenceData);
        savedSequence = await base44.entities.EmailSequence.create(sequenceData);
        console.log("Created sequence:", savedSequence);
      }
      
      // Create new steps
      console.log(`Creating ${steps.length} new steps for sequence ${savedSequence.id}`);
      for (const step of steps) {
        const stepData = {
          sequence_id: savedSequence.id,
          step_number: step.step_number,
          delay_days: parseInt(step.delay_days) || 0,
          template_id: step.template_id,
          template_name: step.template_name
        };
        console.log("Creating step:", stepData);
        await base44.entities.EmailSequenceStep.create(stepData);
      }
      
      console.log("Sequence saved successfully");
      setIsDialogOpen(false);
      setEditingSequence(null);
      await loadData();
      onAlert(editingSequence ? "Sequence updated successfully" : "Sequence created successfully");
    } catch (error) {
      console.error("Error saving sequence:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        stack: error.stack
      });
      onAlert(`Error saving sequence: ${error.message || 'Unknown error'}`, "destructive");
    }
  };

  const handleEdit = (sequence) => {
    console.log("Editing sequence:", sequence);
    setEditingSequence(sequence);
    setIsDialogOpen(true);
  };

  const handleDelete = async (sequenceId) => {
    if (!window.confirm("Are you sure? This will delete the sequence and all its steps (but not enrollments).")) {
      return;
    }
    
    try {
      console.log("Deleting sequence:", sequenceId);
      
      // Delete all steps first
      try {
        const steps = await base44.entities.EmailSequenceStep.filter({ sequence_id: sequenceId });
        console.log(`Found ${steps.length} steps to delete`);
        for (const step of steps) {
          await base44.entities.EmailSequenceStep.delete(step.id);
        }
      } catch (stepsError) {
        console.warn("Error deleting steps:", stepsError);
      }
      
      // Delete the sequence
      await base44.entities.EmailSequence.delete(sequenceId);
      console.log("Sequence deleted successfully");
      
      await loadData();
      onAlert("Sequence deleted successfully");
    } catch (error) {
      console.error("Error deleting sequence:", error);
      onAlert(`Error deleting sequence: ${error.message}`, "destructive");
    }
  };

  const handleViewEnrollments = async (sequence) => {
    setSelectedSequence(sequence);
    try {
      const data = await base44.entities.EmailSequenceEnrollment.filter({ sequence_id: sequence.id });
      setEnrollments(data);
      setEnrollmentDialogOpen(true);
    } catch (error) {
      console.error("Error loading enrollments:", error);
      onAlert("Error loading enrollments", "destructive");
    }
  };

  const handleProcessSequences = async () => {
    setIsProcessing(true);
    try {
      const response = await base44.functions.invoke('processEmailSequences', {});
      if (response.data.success) {
        onAlert(`Processing complete: ${response.data.results.sent} emails sent, ${response.data.results.failed} failed`);
        await loadData();
      } else {
        onAlert("Error processing sequences", "destructive");
      }
    } catch (error) {
      console.error("Error processing sequences:", error);
      onAlert(`Error processing sequences: ${error.message}`, "destructive");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManageSequence = (sequence) => {
    console.log("Managing sequence:", sequence);
    setManagingSequence(sequence);
    setShowManageDialog(true);
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading sequences...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            Email Sequences ({sequences.length})
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              onClick={handleProcessSequences} 
              variant="outline"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Process Now
                </>
              )}
            </Button>
            <Button onClick={() => { setEditingSequence(null); setIsDialogOpen(true); }}>
              <PlusCircle className="w-4 h-4 mr-2" />
              Create Sequence
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {sequences.length === 0 ? (
            <div className="text-center py-8">
              <GitBranch className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No sequences found</p>
              <p className="text-sm text-gray-500 mb-4">Create your first email sequence to automate your communications</p>
              <Button className="mt-4" onClick={() => { setEditingSequence(null); setIsDialogOpen(true); }}>
                Create Your First Sequence
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sequence Name</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Steps</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sequences.map((seq) => (
                  <TableRow key={seq.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{seq.name}</p>
                        {seq.description && (
                          <p className="text-sm text-gray-500">{seq.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {seq.trigger_type === 'manual' && 'Manual'}
                        {seq.trigger_type === 'application_submitted' && 'On Submit'}
                        {seq.trigger_type === 'status_change' && `Status: ${seq.trigger_status}`}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-blue-100 text-blue-800">
                        {seq.total_steps} Steps
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={seq.is_active ? "default" : "outline"}>
                        {seq.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="default" size="sm" onClick={() => handleManageSequence(seq)}>
                          <GitBranch className="w-4 h-4 mr-1" />
                          Manage
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleViewEnrollments(seq)}>
                          <Users className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEdit(seq)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(seq.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {editingSequence ? 'Edit Sequence' : 'Create New Sequence'}
            </DialogTitle>
          </DialogHeader>
          <SequenceForm
            sequence={editingSequence}
            templates={templates}
            onSave={handleSave}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={enrollmentDialogOpen} onOpenChange={setEnrollmentDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Enrollments - {selectedSequence?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {enrollments.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No enrollments yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Current Step</TableHead>
                    <TableHead>Next Email Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((enrollment) => (
                    <TableRow key={enrollment.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{enrollment.recipient_name}</p>
                          <p className="text-sm text-gray-500">{enrollment.recipient_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={enrollment.status === 'active' ? 'default' : 'outline'}>
                          {enrollment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        Step {enrollment.current_step} of {selectedSequence?.total_steps}
                      </TableCell>
                      <TableCell>
                        {enrollment.next_email_due_date ? (
                          new Date(enrollment.next_email_due_date).toLocaleDateString()
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {managingSequence && (
        <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
          <SequenceManagementDialog
            sequence={managingSequence}
            onClose={() => setShowManageDialog(false)}
            onAlert={onAlert}
            onRefreshSequences={loadData}
          />
        </Dialog>
      )}
    </div>
  );
}
