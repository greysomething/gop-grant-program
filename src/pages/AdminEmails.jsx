
import React, { useState, useEffect, useCallback } from 'react';
import { User } from '@/api/entities';
import { EmailTemplate } from '@/api/entities';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Mail,
  Edit,
  Eye,
  EyeOff,
  Plus,
  Code,
  Type,
  Save,
  Send,
  Loader2,
  Users,
  User as UserIcon,
  Crown,
  History,
  GitBranch
} from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { sendBulkEmail } from '@/api/functions';
import EmailSequences from '@/components/email/EmailSequences';


const DEFAULT_TEMPLATES = [
  {
    template_key: 'application_confirmation',
    name: 'Application Confirmation',
    category: 'transactional',
    description: 'Sent when user successfully submits their application',
    subject: 'Application Received - {{cycle_name}}',
    body_html: '<h2>Thank you for your application!</h2><p>Dear {{user_name}},</p><p>We have received your application for the {{cycle_name}} grant cycle. Your application ID is {{application_id}}.</p><p>We will review all applications and announce results by {{announce_date}}.</p><p>Best regards,<br>The Gift of Parenthood Team</p>',
    body_text: 'Thank you for your application!\n\nDear {{user_name}},\n\nWe have received your application for the {{cycle_name}} grant cycle. Your application ID is {{application_id}}.\n\nWe will review all applications and announce results by {{announce_date}}.\n\nBest regards,\nThe Gift of Parenthood Team',
    available_variables: ['user_name', 'application_id', 'cycle_name', 'announce_date'],
    is_active: true
  },
  {
    template_key: 'status_update_finalist',
    name: 'Finalist Notification',
    category: 'transactional',
    description: 'Sent when applicant becomes a finalist',
    subject: 'Congratulations - You\'re a Finalist! {{cycle_name}}',
    body_html: '<h2>Congratulations!</h2><p>Dear {{user_name}},</p><p>We are thrilled to inform you that you have been selected as a finalist for the {{cycle_name}} grant cycle.</p><p>Our board will make final decisions by {{announce_date}}.</p><p>Thank you for sharing your story with us.</p><p>Best regards,<br>The Gift of Parenthood Team</p>',
    body_text: 'Congratulations!\n\nDear {{user_name}},\n\nWe are thrilled to inform you that you have been selected as a finalist for the {{cycle_name}} grant cycle.\n\nOur board will make final decisions by {{announce_date}}.\n\nThank you for sharing your story with us.\n\nBest regards,\nThe Gift of Parenthood Team',
    available_variables: ['user_name', 'cycle_name', 'announce_date'],
    is_active: true
  },
  {
    template_key: 'award_notification',
    name: 'Award Notification',
    category: 'transactional',
    description: 'Sent when applicant is selected for a grant',
    subject: 'Wonderful News - You\'ve Been Selected! {{cycle_name}}',
    body_html: '<h2>Wonderful News!</h2><p>Dear {{user_name}},</p><p>We are delighted to inform you that you have been selected to receive a Gift of Parenthood grant for the {{cycle_name}} cycle.</p><p>Grant amount: {{grant_amount}}</p><p>Our team will be in touch within the next few days with next steps.</p><p>Congratulations and best wishes on your journey!</p><p>With joy,<br>The Gift of Parenthood Team</p>',
    body_text: 'Wonderful News!\n\nDear {{user_name}},\n\nWe are delighted to inform you that you have been selected to receive a Gift of Parenthood grant for the {{cycle_name}} cycle.\n\nGrant amount: {{grant_amount}}\n\nOur team will be in touch within the next few days with next steps.\n\nCongratulations and best wishes on your journey!\n\nWith joy,\nThe Gift of Parenthood Team',
    available_variables: ['user_name', 'cycle_name', 'grant_amount'],
    is_active: true
  },
  {
    template_key: 'gift_nomination_invite',
    name: 'Gift Nomination Invitation',
    category: 'transactional',
    description: 'Sent to nominee when someone nominates them for a gift',
    subject: '{{nominator_name}} has nominated you for a gift!',
    body_html: '<h2>You\'ve been nominated!</h2><p>Dear {{nominee_name}},</p><p>{{nominator_name}} has nominated you to receive a pre-paid application for the Gift of Parenthood grant program.</p><p>This gift covers your application fee and gives you the opportunity to share your story with our review board.</p><p><a href="{{acceptance_url}}">Click here to accept this gift</a></p><p>This invitation expires on {{expiry_date}}.</p><p>With hope,<br>The Gift of Parenthood Team</p>',
    body_text: 'You\'ve been nominated!\n\nDear {{nominee_name}},\n\n{{nominator_name}} has nominated you to receive a pre-paid application for the Gift of Parenthood grant program.\n\nThis gift covers your application fee and gives you the opportunity to share your story with our review board.\n\nVisit this link to accept: {{acceptance_url}}\n\nThis invitation expires on {{expiry_date}}.\n\nWith hope,\nThe Gift of Parenthood Team',
    available_variables: ['nominee_name', 'nominator_name', 'acceptance_url', 'expiry_date'],
    is_active: true
  },
  {
    template_key: 'cycle_pass_confirmation',
    name: 'Cycle Pass Purchase Confirmation',
    category: 'transactional',
    description: 'Sent when user purchases a four-cycle pass',
    subject: 'Your Four-Cycle Pass Confirmed - Ready to Apply!',
    body_html: '<h2>Your Four-Cycle Pass is Active!</h2><p>Dear {{user_name}},</p><p>Thank you for purchasing a Four-Cycle Pass. You can now apply in up to 4 quarterly cycles over the next year.</p><p>Pass Details:</p><ul><li>Redemptions remaining: {{redemptions_remaining}}</li><li>Valid until: {{expires_date}}</li><li>Pass ID: {{pass_id}}</li></ul><p>You can start your first application anytime during an open cycle.</p><p>Best regards,<br>The Gift of Parenthood Team</p>',
    body_text: 'Your Four-Cycle Pass is Active!\n\nDear {{user_name}},\n\nThank you for purchasing a Four-Cycle Pass. You can now apply in up to 4 quarterly cycles over the next year.\n\nPass Details:\n- Redemptions remaining: {{redemptions_remaining}}\n- Valid until: {{expires_date}}\n- Pass ID: {{pass_id}}\n\nYou can start your first application anytime during an open cycle.\n\nBest regards,\nThe Gift of Parenthood Team',
    available_variables: ['user_name', 'redemptions_remaining', 'expires_date', 'pass_id'],
    is_active: true
  },
  {
    template_key: 'payment_receipt',
    name: 'Payment Receipt',
    category: 'transactional',
    description: 'Sent after successful payment processing',
    subject: 'Payment Confirmation - {{plan_name}}',
    body_html: '<h2>Payment Confirmed</h2><p>Dear {{user_name}},</p><p>Your payment has been successfully processed.</p><p>Receipt Details:</p><ul><li>Amount: {{amount}}</li><li>Plan: {{plan_name}}</li><li>Payment ID: {{payment_id}}</li><li>Date: {{payment_date}}</li></ul><p>You can download your receipt <a href="{{receipt_url}}">here</a>.</p><p>Thank you for supporting our mission!</p><p>Best regards,<br>The Gift of Parenthood Team</p>',
    body_text: 'Payment Confirmed\n\nDear {{user_name}},\n\nYour payment has been successfully processed.\n\nReceipt Details:\n- Amount: {{amount}}\n- Plan: {{plan_name}}\n- Payment ID: {{payment_id}}\n- Date: {{payment_date}}\n\nYou can download your receipt here: {{receipt_url}}\n\nThank you for supporting our mission!\n\nBest regards,\nThe Gift of Parenthood Team',
    available_variables: ['user_name', 'amount', 'plan_name', 'payment_id', 'payment_date', 'receipt_url'],
    is_active: true
  }
];

export default function AdminEmails() {
  const [templates, setTemplates] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState('templates');
  const [templateCategory, setTemplateCategory] = useState('all');
  const location = useLocation();

  const [templateFormData, setTemplateFormData] = useState({
    name: '',
    category: 'transactional',
    subject: '',
    body_html: '',
    body_text: '',
    description: '',
    is_active: true
  });

  const [sendEmailFormData, setSendEmailFormData] = useState({
    recipients: 'all_users',
    specificUserId: '',
    subject: '',
    bodyHtml: '',
  });
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [sendEmailSuccess, setSendEmailSuccess] = useState(false);
  const [sendEmailError, setSendEmailError] = useState('');

  const initializeDefaultTemplates = useCallback(async () => {
    try {
      const createPromises = DEFAULT_TEMPLATES.map(template =>
        EmailTemplate.create(template)
      );
      await Promise.all(createPromises);
    } catch (error) {
      console.error('Failed to initialize default templates:', error);
    }
  }, []);

  const initialize = useCallback(async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);

      if (user?.role !== 'admin') {
        window.location.href = createPageUrl("Home");
        return;
      }

      let allTemplates = await EmailTemplate.list();
      if (allTemplates.length === 0) {
        await initializeDefaultTemplates();
        allTemplates = await EmailTemplate.list();
      }
      setTemplates(allTemplates);

      const usersList = await User.list();
      setAllUsers(usersList);

      const query = new URLSearchParams(location.search);
      const toEmail = query.get('to');
      const tab = query.get('tab');

      if (toEmail) {
        const targetUser = usersList.find(u => u.email === toEmail);
        if (targetUser) {
          setSendEmailFormData(prev => ({
            ...prev,
            recipients: `specific_user_${targetUser.id}`,
            specificUserId: targetUser.id,
          }));
        } else {
          setSendEmailFormData(prev => ({
            ...prev,
            recipients: `email_${toEmail}`,
          }));
        }
        setActiveTab('send');
      } else if (tab === 'send') {
        setActiveTab('send');
      } else if (tab === 'sequences') {
        setActiveTab('sequences');
      }


    } catch (error) {
      console.error('Failed to load email data:', error);
    }
    setIsLoading(false);
  }, [initializeDefaultTemplates, location.search]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const openEditDialog = (template) => {
    setEditingTemplate(template);
    setTemplateFormData({
      name: template.name || '',
      category: template.category || 'transactional',
      subject: template.subject || '',
      body_html: template.body_html || '',
      body_text: template.body_text || '',
      description: template.description || '',
      is_active: template.is_active !== false
    });
    setShowEditDialog(true);
    setShowPreview(false);
  };

  const openCreateDialog = () => {
    setEditingTemplate(null);
    setTemplateFormData({
      name: '',
      category: 'sequence',
      subject: '',
      body_html: '',
      body_text: '',
      description: '',
      is_active: true
    });
    setShowEditDialog(true);
    setShowPreview(false);
  };

  const handleSaveTemplate = async () => {
    try {
      if (editingTemplate) {
        // Update existing template
        await EmailTemplate.update(editingTemplate.id, templateFormData);
        setTemplates(templates.map(t =>
          t.id === editingTemplate.id ? { ...t, ...templateFormData } : t
        ));
      } else {
        // Create new template
        const newTemplate = await EmailTemplate.create({
          ...templateFormData,
          template_key: `custom_${Date.now()}`, // Generate unique key
          available_variables: [] // Can be updated later
        });
        setTemplates([...templates, newTemplate]);
      }
      setShowEditDialog(false);
    } catch (error) {
      console.error('Failed to save template:', error);
    }
  };

  const getTemplatePreviewContent = () => {
    // If we're creating a new template, editingTemplate is null, so use templateFormData for preview
    const currentTemplateData = editingTemplate ? editingTemplate : templateFormData;

    let content = templateFormData.body_html;
    let subject = templateFormData.subject;
    const sampleData = {
      user_name: 'John Doe',
      nominee_name: 'Jane Smith',
      nominator_name: 'John Doe',
      cycle_name: 'Q1 2024',
      application_id: 'APP-2024-001',
      announce_date: 'March 15, 2024',
      grant_amount: '$5,000',
      payment_id: 'pay_1234567890',
      amount: '$250',
      plan_name: 'Four-Cycle Pass',
      payment_date: 'January 15, 2024',
      expiry_date: 'February 15, 2024',
      redemptions_remaining: '3',
      expires_date: 'January 15, 2025',
      pass_id: 'PASS-2024-001',
      acceptance_url: '#',
      receipt_url: '#'
    };
    Object.entries(sampleData).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, value);
      subject = subject.replace(regex, value);
    });
    return { content, subject };
  };

  const handleSendEmailChange = (field, value) => {
    setSendEmailFormData(prev => ({ ...prev, [field]: value }));
    setSendEmailError('');
    setSendEmailSuccess(false);
  };

  const handleSendEmailSubmit = async (e) => {
    e.preventDefault();
    setIsSendingEmail(true);
    setSendEmailError('');
    setSendEmailSuccess(false);

    if (!sendEmailFormData.subject.trim() || !sendEmailFormData.bodyHtml.trim()) {
      setSendEmailError('Subject and email body cannot be empty.');
      setIsSendingEmail(false);
      return;
    }

    try {
      let recipientValue = sendEmailFormData.recipients;
      if (recipientValue === 'specific_user' && sendEmailFormData.specificUserId) {
        recipientValue = `specific_user_${sendEmailFormData.specificUserId}`;
      }

      const response = await sendBulkEmail({
        recipients: recipientValue,
        subject: sendEmailFormData.subject,
        bodyHtml: sendEmailFormData.bodyHtml
      });

      if (response.data.success) {
        setSendEmailSuccess(true);
        setSendEmailFormData({ recipients: 'all_users', specificUserId: '', subject: '', bodyHtml: '' });
      } else {
        setSendEmailError(response.data.error || 'Failed to send emails.');
      }
    } catch (error) {
      setSendEmailError('An unexpected error occurred.');
    }
    setIsSendingEmail(false);
  };

  const getSendEmailPreviewContent = () => {
    let content = sendEmailFormData.bodyHtml || '';
    let subject = sendEmailFormData.subject || '';
    let recipientId = sendEmailFormData.recipients.startsWith('specific_user_') ? sendEmailFormData.recipients.replace('specific_user_', '') : null;
    const sampleUser = allUsers.find(u => u.id === recipientId) || allUsers[0] || { full_name: 'John Doe', email: 'john.doe@example.com' };
    const sampleData = { user_name: sampleUser.full_name, user_email: sampleUser.email };
    Object.entries(sampleData).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, value);
      subject = subject.replace(regex, value);
    });
    return { content, subject };
  };
  
  const insertVariable = (quillRef, variable) => {
    const quill = quillRef.getEditor();
    const range = quill.getSelection(true);
    quill.insertText(range.index, `{{${variable}}}`, 'user');
  };

  const SendEmailTab = () => {
    const quillRef = React.useRef(null);
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-rose-500" />
            Compose & Send Email
          </CardTitle>
          <CardDescription>
            Send a custom email to selected users with dynamic content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendEmailSubmit} className="space-y-6">
            <div>
              <Label htmlFor="recipients">Recipients</Label>
              <Select
                value={sendEmailFormData.recipients}
                onValueChange={(value) => {
                  handleSendEmailChange('recipients', value);
                  if (value.startsWith('specific_user_')) {
                    handleSendEmailChange('specificUserId', value.replace('specific_user_', ''));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select recipients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_users"><div className="flex items-center gap-2"><Users className="w-4 h-4" /> All Users</div></SelectItem>
                  <SelectItem value="all_applicants"><div className="flex items-center gap-2"><UserIcon className="w-4 h-4" /> All Applicants</div></SelectItem>
                  <SelectItem value="all_admins"><div className="flex items-center gap-2"><Crown className="w-4 h-4" /> All Admins</div></SelectItem>
                  {allUsers.map(u => (
                    <SelectItem key={u.id} value={`specific_user_${u.id}`}><div className="flex items-center gap-2"><UserIcon className="w-4 h-4" /> {u.full_name} ({u.email})</div></SelectItem>
                  ))}
                  {sendEmailFormData.recipients.startsWith('email_') && (
                    <SelectItem value={sendEmailFormData.recipients}><div className="flex items-center gap-2"><Mail className="w-4 h-4" /> {sendEmailFormData.recipients.replace('email_', '')} (External)</div></SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="send-email-subject">Subject Line</Label>
              <Input id="send-email-subject" value={sendEmailFormData.subject} onChange={(e) => handleSendEmailChange('subject', e.target.value)} placeholder="Your email subject here" />
            </div>

            <div>
              <Label htmlFor="send-email-body">Email Body</Label>
              <ReactQuill ref={quillRef} theme="snow" value={sendEmailFormData.bodyHtml} onChange={(value) => handleSendEmailChange('bodyHtml', value)} placeholder="Compose your email here..." className="h-64 mb-10" />
            </div>

            <div>
              <Label className="mb-2 block">Available Variables</Label>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => insertVariable(quillRef.current, 'user_name')} className="text-xs"><Plus className="w-3 h-3 mr-1" />user_name</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => insertVariable(quillRef.current, 'user_email')} className="text-xs"><Plus className="w-3 h-3 mr-1" />user_email</Button>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Email Preview</h3>
              <div className="border rounded-lg p-4 bg-white min-h-[150px] overflow-y-auto">
                <div className="mb-4"><strong>Subject:</strong> {getSendEmailPreviewContent().subject}</div>
                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: getSendEmailPreviewContent().content }} />
              </div>
            </div>

            {sendEmailError && <div className="text-red-500 text-sm mt-4">{sendEmailError}</div>}
            {sendEmailSuccess && <div className="text-green-500 text-sm mt-4">Emails sent successfully!</div>}

            <Button type="submit" disabled={isSendingEmail} className="w-full">
              {isSendingEmail ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</>) : (<><Send className="mr-2 h-4 w-4" />Send Email</>)}
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  };

  const filteredTemplates = templateCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === templateCategory);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl("Admin")}><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Back to Admin</Button></Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Email Management</h1>
            <p className="text-gray-600">Manage templates, sequences and send custom messages.</p>
          </div>
          <Link to={createPageUrl("AdminEmailHistory")}>
            <Button variant="outline">
              <History className="w-4 h-4 mr-2" />
              Email History
            </Button>
          </Link>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="templates"><Code className="w-4 h-4 mr-2" />Email Templates</TabsTrigger>
            <TabsTrigger value="sequences"><GitBranch className="w-4 h-4 mr-2" />Sequences</TabsTrigger>
            <TabsTrigger value="send"><Send className="w-4 h-4 mr-2" />Send New Email</TabsTrigger>
          </TabsList>

          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-blue-500" />
                    Email Templates ({filteredTemplates.length})
                  </CardTitle>
                  <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                      <Button
                        variant={templateCategory === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTemplateCategory('all')}
                      >
                        All
                      </Button>
                      <Button
                        variant={templateCategory === 'transactional' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTemplateCategory('transactional')}
                      >
                        Transactional
                      </Button>
                      <Button
                        variant={templateCategory === 'sequence' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTemplateCategory('sequence')}
                      >
                        Sequence Emails
                      </Button>
                      <Button
                        variant={templateCategory === 'manual' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTemplateCategory('manual')}
                      >
                        Manual
                      </Button>
                    </div>
                    <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      New Template
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Template</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTemplates.map((template) => (
                        <TableRow key={template.id}>
                          <TableCell>
                            <div className="font-medium">{template.name}</div>
                            <div className="text-sm text-gray-500">{template.description}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {template.category === 'transactional' && 'Transactional'}
                              {template.category === 'sequence' && 'Sequence'}
                              {template.category === 'manual' && 'Manual'}
                            </Badge>
                          </TableCell>
                          <TableCell><div className="text-sm max-w-xs truncate">{template.subject}</div></TableCell>
                          <TableCell><Badge variant={template.is_active ? 'default' : 'secondary'}>{template.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                          <TableCell><Button variant="ghost" size="icon" onClick={() => openEditDialog(template)}><Edit className="w-4 h-4" /></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sequences">
            <EmailSequences onAlert={(message, type) => {
              if (type === 'destructive') {
                setSendEmailError(message);
              } else {
                setSendEmailSuccess(true);
              }
            }} />
          </TabsContent>

          <TabsContent value="send">
            <SendEmailTab />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? `Edit: ${editingTemplate.name}` : 'Create New Email Template'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <Label htmlFor="name">Template Name</Label>
              <Input 
                id="name" 
                value={templateFormData.name} 
                onChange={(e) => setTemplateFormData({ ...templateFormData, name: e.target.value })} 
                placeholder="e.g., Day 3 Follow-up Email"
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={templateFormData.category}
                onValueChange={(value) => setTemplateFormData({ ...templateFormData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transactional">Transactional (System Emails)</SelectItem>
                  <SelectItem value="sequence">Sequence Email</SelectItem>
                  <SelectItem value="manual">Manual (One-off)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="subject">Subject Line</Label>
              <Input 
                id="subject" 
                value={templateFormData.subject} 
                onChange={(e) => setTemplateFormData({ ...templateFormData, subject: e.target.value })} 
                placeholder="e.g., Quick check-in about your application"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                value={templateFormData.description} 
                onChange={(e) => setTemplateFormData({ ...templateFormData, description: e.target.value })} 
                placeholder="Describe when and why this template is used..."
              />
            </div>
            <div>
              <Label>Email Body (HTML)</Label>
              <ReactQuill 
                theme="snow" 
                value={templateFormData.body_html} 
                onChange={(value) => setTemplateFormData({ 
                  ...templateFormData, 
                  body_html: value, 
                  body_text: value.replace(/(<([^>]+)>)/gi, "") 
                })} 
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                id="active-template" 
                checked={templateFormData.is_active} 
                onCheckedChange={(checked) => setTemplateFormData({ ...templateFormData, is_active: checked })} 
              />
              <Label htmlFor="active-template">Active Template</Label>
            </div>

            {editingTemplate && ( // Show these tabs only for existing templates
              <Tabs defaultValue="preview" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="preview"><Eye className="w-4 h-4 mr-2" />Preview</TabsTrigger>
                  <TabsTrigger value="variables"><Type className="w-4 h-4 mr-2" />Variables</TabsTrigger>
                </TabsList>
                <TabsContent value="preview">
                  <Card>
                    <CardHeader>
                      <CardTitle>Email Preview</CardTitle>
                      <CardDescription>Subject: {getTemplatePreviewContent().subject}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="border rounded-lg p-4 bg-gray-50 max-h-60 overflow-y-auto">
                        <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: getTemplatePreviewContent().content }} />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="variables">
                  <Card>
                    <CardHeader>
                      <CardTitle>Available Variables</CardTitle>
                      <CardDescription>Use these variables in your template. They will be replaced with actual data when sending.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {editingTemplate.available_variables?.map(variable => (
                          <Badge key={variable} variant="outline" className="text-sm px-2 py-1">{`{{${variable}}}`}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}

            {!editingTemplate && ( // Show this tip only for new templates
              <Alert>
                <AlertDescription>
                  <strong>Tip:</strong> Use variables like {`{{user_name}}`}, {`{{application_id}}`}, {`{{cycle_name}}`} to personalize your emails. These will be automatically replaced when the email is sent.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveTemplate}>
              <Save className="w-4 h-4 mr-2" />
              {editingTemplate ? 'Save Changes' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
