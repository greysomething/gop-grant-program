
import React, { useState, useEffect, useCallback } from 'react';
import { User } from '@/api/entities';
import { FaqItem } from '@/api/entities';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  HelpCircle,
  Plus,
  Edit,
  Trash2,
  Search,
  Eye,
  EyeOff,
  FileText
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const CATEGORIES = ["fees", "eligibility", "selection", "timeline", "privacy", "passes", "accessibility", "taxes", "technical"];

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  published: { label: 'Published', color: 'bg-green-100 text-green-800' },
  archived: { label: 'Archived', color: 'bg-yellow-100 text-yellow-800' }
};

const VISIBILITY_CONFIG = {
  public: { label: 'Public', color: 'bg-blue-100 text-blue-800' },
  applicant_only: { label: 'Applicant Only', color: 'bg-purple-100 text-purple-800' }
};

export default function AdminFAQ() {
  const [faqs, setFaqs] = useState([]);
  const [filteredFaqs, setFilteredFaqs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [editingFaq, setEditingFaq] = useState(null);
  const [showFaqDialog, setShowFaqDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState({
    slug: '',
    question: '',
    answer_md: '',
    category: '',
    status: 'draft',
    visibility: 'public',
    order_index: 0
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    initialize();
  }, []);

  const filterFaqs = useCallback(() => {
    let filtered = faqs;

    if (searchTerm) {
      filtered = filtered.filter(faq =>
        faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.answer_md.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.slug.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(faq => faq.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(faq => faq.category === categoryFilter);
    }

    // Sort filtered FAQs by order_index in ascending order
    filtered.sort((a, b) => a.order_index - b.order_index);

    setFilteredFaqs(filtered);
  }, [faqs, searchTerm, statusFilter, categoryFilter]);

  useEffect(() => {
    filterFaqs();
  }, [filterFaqs]);

  const initialize = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);

      if (user?.role !== 'admin') {
        window.location.href = createPageUrl("Home");
        return;
      }

      const allFaqs = await FaqItem.list('order_index'); // Changed from '-order_index' to 'order_index'
      setFaqs(allFaqs);
    } catch (error) {
      console.error('Failed to load FAQs:', error);
    }
    setIsLoading(false);
  };

  const resetForm = () => {
    setFormData({
      slug: '',
      question: '',
      answer_md: '',
      category: '',
      status: 'draft',
      visibility: 'public',
      order_index: 0
    });
    setFormErrors({});
    setEditingFaq(null);
    setShowPreview(false);
  };

  const openEditDialog = (faq = null) => {
    if (faq) {
      setEditingFaq(faq);
      setFormData({
        slug: faq.slug || '',
        question: faq.question || '',
        answer_md: faq.answer_md || '',
        category: faq.category || '',
        status: faq.status || 'draft',
        visibility: faq.visibility || 'public',
        order_index: faq.order_index || 0
      });
    } else {
      resetForm();
    }
    setShowFaqDialog(true);
  };

  const generateSlugFromQuestion = (question) => {
    return question
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
  };

  const handleQuestionChange = (question) => {
    setFormData(prev => ({
      ...prev,
      question,
      slug: prev.slug || generateSlugFromQuestion(question)
    }));
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.question.trim()) errors.question = 'Question is required';
    if (!formData.answer_md.trim()) errors.answer_md = 'Answer is required';
    if (!formData.category) errors.category = 'Category is required';
    if (!formData.slug.trim()) errors.slug = 'Slug is required';

    // Check for duplicate slug (excluding current item when editing)
    const duplicateSlug = faqs.find(faq =>
      faq.slug === formData.slug && (!editingFaq || faq.id !== editingFaq.id)
    );
    if (duplicateSlug) errors.slug = 'This slug is already in use';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      if (editingFaq) {
        await FaqItem.update(editingFaq.id, formData);
        setFaqs(prevFaqs => prevFaqs.map(faq =>
          faq.id === editingFaq.id ? { ...faq, ...formData } : faq
        ));
      } else {
        const newFaq = await FaqItem.create(formData);
        setFaqs(prevFaqs => [newFaq, ...prevFaqs]);
      }

      setShowFaqDialog(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save FAQ:', error);
    }
  };

  const handleDelete = async (faqId) => {
    try {
      await FaqItem.delete(faqId);
      setFaqs(faqs.filter(faq => faq.id !== faqId));
    } catch (error) {
      console.error('Failed to delete FAQ:', error);
    }
  };

  const toggleStatus = async (faq, newStatus) => {
    try {
      await FaqItem.update(faq.id, { status: newStatus });
      setFaqs(faqs.map(f => f.id === faq.id ? { ...f, status: newStatus } : f));
    } catch (error) {
      console.error('Failed to update FAQ status:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading FAQs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl("Admin")}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Admin
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">FAQ Management</h1>
              <p className="text-gray-600">Create, edit, and organize FAQ content</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Dialog open={showFaqDialog} onOpenChange={setShowFaqDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => openEditDialog()} className="bg-rose-600 hover:bg-rose-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add FAQ
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingFaq ? 'Edit FAQ' : 'Add New FAQ'}</DialogTitle>
                  <DialogDescription>
                    Create helpful content for applicants and visitors
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="question">Question</Label>
                      <Input
                        id="question"
                        value={formData.question}
                        onChange={(e) => handleQuestionChange(e.target.value)}
                        placeholder="What are the eligibility requirements?"
                        className={formErrors.question ? 'border-red-500' : ''}
                      />
                      {formErrors.question && <p className="text-sm text-red-500 mt-1">{formErrors.question}</p>}
                    </div>
                    <div>
                      <Label htmlFor="slug">URL Slug</Label>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => setFormData({...formData, slug: e.target.value})}
                        placeholder="eligibility-requirements"
                        className={formErrors.slug ? 'border-red-500' : ''}
                      />
                      {formErrors.slug && <p className="text-sm text-red-500 mt-1">{formErrors.slug}</p>}
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({...formData, category: value})}
                      >
                        <SelectTrigger className={formErrors.category ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(category => (
                            <SelectItem key={category} value={category}>
                              {category.charAt(0).toUpperCase() + category.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formErrors.category && <p className="text-sm text-red-500 mt-1">{formErrors.category}</p>}
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData({...formData, status: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                            <SelectItem key={key} value={key}>{config.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="visibility">Visibility</Label>
                      <Select
                        value={formData.visibility}
                        onValueChange={(value) => setFormData({...formData, visibility: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(VISIBILITY_CONFIG).map(([key, config]) => (
                            <SelectItem key={key} value={key}>{config.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="order_index">Order Index</Label>
                      <Input
                        id="order_index"
                        type="number"
                        value={formData.order_index}
                        onChange={(e) => setFormData({...formData, order_index: parseInt(e.target.value) || 0})}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="answer_md">Answer (Markdown)</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPreview(!showPreview)}
                      >
                        {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                        {showPreview ? 'Hide Preview' : 'Show Preview'}
                      </Button>
                    </div>
                    <div className={showPreview ? 'grid grid-cols-2 gap-4' : ''}>
                      <Textarea
                        id="answer_md"
                        value={formData.answer_md}
                        onChange={(e) => setFormData({...formData, answer_md: e.target.value})}
                        placeholder="You must meet the following requirements..."
                        className={`h-48 ${formErrors.answer_md ? 'border-red-500' : ''}`}
                      />
                      {showPreview && (
                        <div className="h-48 overflow-y-auto border rounded-md p-3 bg-gray-50">
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown>{formData.answer_md}</ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>
                    {formErrors.answer_md && <p className="text-sm text-red-500 mt-1">{formErrors.answer_md}</p>}
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setShowFaqDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingFaq ? 'Update FAQ' : 'Create FAQ'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-amber-500" />
              FAQ Items ({filteredFaqs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search FAQs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Question</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFaqs.map((faq) => {
                    const statusConfig = STATUS_CONFIG[faq.status] || STATUS_CONFIG['draft'];
                    const visibilityConfig = VISIBILITY_CONFIG[faq.visibility] || VISIBILITY_CONFIG['public'];

                    return (
                      <TableRow key={faq.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{faq.question}</div>
                            <div className="text-sm text-gray-500">/{faq.slug}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {faq.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig.color}>
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={visibilityConfig.color}>
                            {visibilityConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">{faq.order_index}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {faq.status === 'published' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleStatus(faq, 'draft')}
                              >
                                Unpublish
                              </Button>
                            )}
                            {faq.status === 'draft' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleStatus(faq, 'published')}
                                className="text-green-600"
                              >
                                Publish
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(faq)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete FAQ</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this FAQ? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(faq.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
