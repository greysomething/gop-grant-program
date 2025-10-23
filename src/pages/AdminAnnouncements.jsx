
import React, { useState, useEffect, useCallback } from 'react';
import { User } from '@/api/entities';
import { Announcement } from '@/api/entities';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  ArrowLeft,
  Mail,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Star,
  StarOff,
  Search,
  Download,
  MoreHorizontal,
  X,
  Upload,
  UserCircle2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { UploadFile } from '@/api/integrations';

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: Edit },
  published: { label: 'Published', color: 'bg-green-100 text-green-800', icon: Eye },
  archived: { label: 'Archived', color: 'bg-orange-100 text-orange-800', icon: EyeOff }
};

const CATEGORY_CONFIG = {
  recipients: { label: 'Recipients', color: 'bg-rose-100 text-rose-800' },
  program_updates: { label: 'Program Updates', color: 'bg-blue-100 text-blue-800' },
  general: { label: 'General', color: 'bg-purple-100 text-purple-800' },
  cycle_announcements: { label: 'Cycle Announcements', color: 'bg-indigo-100 text-indigo-800' }
};

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content_md: '',
    excerpt: '',
    status: 'draft',
    publication_date: '',
    featured: false,
    category: 'general',
    recipients: []
  });
  const [formErrors, setFormErrors] = useState({});
  const [activeTab, setActiveTab] = useState('edit');
  const [uploadingRecipient, setUploadingRecipient] = useState(null);

  const filterAnnouncements = useCallback(() => {
    let filtered = announcements;

    if (searchTerm) {
      filtered = filtered.filter(announcement =>
        announcement.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        announcement.content_md?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        announcement.excerpt?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(announcement => announcement.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(announcement => announcement.category === categoryFilter);
    }

    setFilteredAnnouncements(filtered);
  }, [announcements, searchTerm, statusFilter, categoryFilter]);

  const initialize = useCallback(async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);

      if (user?.role !== 'admin') {
        window.location.href = createPageUrl("Home");
        return;
      }

      const allAnnouncements = await Announcement.list('-created_date');
      setAnnouncements(allAnnouncements);
    } catch (error) {
      console.error('Failed to load announcements:', error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    filterAnnouncements();
  }, [filterAnnouncements]);

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  };

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      content_md: '',
      excerpt: '',
      status: 'draft',
      publication_date: '',
      featured: false,
      category: 'general',
      recipients: []
    });
    setFormErrors({});
    setEditingAnnouncement(null);
    setActiveTab('edit');
  };

  const openEditDialog = (announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title || '',
      slug: announcement.slug || '',
      content_md: announcement.content_md || '',
      excerpt: announcement.excerpt || '',
      status: announcement.status || 'draft',
      publication_date: announcement.publication_date ? new Date(announcement.publication_date).toISOString().split('T')[0] : '',
      featured: announcement.featured || false,
      category: announcement.category || 'general',
      recipients: announcement.recipients || []
    });
    setShowAnnouncementDialog(true);
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.content_md.trim()) errors.content_md = 'Content is required';
    if (!formData.slug.trim()) errors.slug = 'Slug is required';

    if (formData.category === 'recipients' && formData.recipients.some(r => !r.name.trim())) {
      errors.recipients = 'All recipient names must be filled out.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const submitData = {
        ...formData,
        publication_date: formData.publication_date ? new Date(formData.publication_date).toISOString() : null
      };

      if (editingAnnouncement) {
        await Announcement.update(editingAnnouncement.id, submitData);
        // Refetch announcements to ensure we have the latest data, especially for
        // fields like publication_date which might be set by the backend on status change.
        const updatedAnnouncements = await Announcement.list('-created_date');
        setAnnouncements(updatedAnnouncements);
      } else {
        const newAnnouncement = await Announcement.create(submitData);
        setAnnouncements([newAnnouncement, ...announcements]);
      }

      setShowAnnouncementDialog(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save announcement:', error);
    }
  };

  const handleDelete = async (announcementId) => {
    try {
      await Announcement.delete(announcementId);
      setAnnouncements(announcements.filter(announcement => announcement.id !== announcementId));
    } catch (error) {
      console.error('Failed to delete announcement:', error);
    }
  };

  const toggleFeatured = async (announcement) => {
    try {
      const updated = { ...announcement, featured: !announcement.featured };
      await Announcement.update(announcement.id, updated);
      setAnnouncements(announcements.map(a => a.id === announcement.id ? updated : a));
    } catch (error) {
      console.error('Failed to toggle featured status:', error);
    }
  };

  const updateStatus = async (announcementId, newStatus) => {
    try {
      await Announcement.update(announcementId, {
        status: newStatus,
        publication_date: newStatus === 'published' && !announcements.find(a => a.id === announcementId)?.publication_date ? new Date().toISOString() : undefined
      });
      setAnnouncements(announcements.map(announcement =>
        announcement.id === announcementId ? {
          ...announcement,
          status: newStatus,
          publication_date: newStatus === 'published' && !announcement.publication_date ? new Date().toISOString() : announcement.publication_date
        } : announcement
      ));
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const exportAnnouncements = () => {
    const csvContent = [
      ['Title', 'Category', 'Status', 'Featured', 'Publication Date', 'Created Date'].join(','),
      ...filteredAnnouncements.map(announcement => [
        announcement.title || '',
        announcement.category || '',
        announcement.status || '',
        announcement.featured ? 'Yes' : 'No',
        announcement.publication_date ? new Date(announcement.publication_date).toLocaleDateString() : '',
        new Date(announcement.created_date).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `announcements_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  const addRecipient = () => {
    if (formData.recipients.length < 4) {
      setFormData({
        ...formData,
        recipients: [...formData.recipients, { name: '', photo_url: '' }]
      });
    }
  };

  const removeRecipient = (index) => {
    setFormData({
      ...formData,
      recipients: formData.recipients.filter((_, i) => i !== index)
    });
  };

  const updateRecipientName = (index, name) => {
    const newRecipients = [...formData.recipients];
    newRecipients[index] = { ...newRecipients[index], name };
    setFormData({ ...formData, recipients: newRecipients });
  };

  const uploadRecipientPhoto = async (index, file) => {
    if (!file) return;
    setUploadingRecipient(index);
    try {
      const { file_url } = await UploadFile({ file });
      const newRecipients = [...formData.recipients];
      newRecipients[index] = { ...newRecipients[index], photo_url: file_url };
      setFormData({ ...formData, recipients: newRecipients });
    } catch (error) {
      console.error('Photo upload failed:', error);
    } finally {
      setUploadingRecipient(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading announcements...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
              <p className="text-gray-600">Publish quarterly recipients and other news</p>
            </div>
          </div>
          <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                New Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}</DialogTitle>
                <DialogDescription>
                  Create announcements for quarterly recipients, program updates, and more
                </DialogDescription>
              </DialogHeader>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="edit">Edit</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
                <TabsContent value="edit" className="space-y-4 mt-4">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => {
                            const newTitle = e.target.value;
                            setFormData({
                              ...formData,
                              title: newTitle,
                              slug: formData.slug || generateSlug(newTitle)
                            });
                          }}
                          placeholder="Announcement title"
                          className={formErrors.title ? 'border-red-500' : ''}
                        />
                        {formErrors.title && <p className="text-sm text-red-500 mt-1">{formErrors.title}</p>}
                      </div>
                      <div>
                        <Label htmlFor="slug">URL Slug</Label>
                        <Input
                          id="slug"
                          value={formData.slug}
                          onChange={(e) => setFormData({...formData, slug: e.target.value})}
                          placeholder="url-friendly-slug"
                          className={formErrors.slug ? 'border-red-500' : ''}
                        />
                        {formErrors.slug && <p className="text-sm text-red-500 mt-1">{formErrors.slug}</p>}
                      </div>
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                              <SelectItem key={key} value={key}>{config.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
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
                        <Label htmlFor="publication_date">Publication Date</Label>
                        <Input
                          id="publication_date"
                          type="date"
                          value={formData.publication_date}
                          onChange={(e) => setFormData({...formData, publication_date: e.target.value})}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="excerpt">Excerpt</Label>
                        <Textarea
                          id="excerpt"
                          value={formData.excerpt}
                          onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                          placeholder="Short summary of the announcement..."
                          rows={2}
                        />
                      </div>
                    </div>

                    {formData.category === 'recipients' && (
                      <div>
                        <Label>Grant Recipients (up to 4)</Label>
                        <p className="text-sm text-gray-600 mb-3">Add photos and names of grant winners</p>
                        <div className="space-y-4">
                          {formData.recipients.map((recipient, index) => (
                            <Card key={index} className="p-4">
                              <div className="flex gap-4 items-start">
                                <div className="flex-shrink-0">
                                  {recipient.photo_url ? (
                                    <div className="relative w-24 h-24">
                                      <img
                                        src={recipient.photo_url}
                                        alt={recipient.name}
                                        className="w-24 h-24 rounded-full object-cover border-4 border-rose-200"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newRecipients = [...formData.recipients];
                                          newRecipients[index] = { ...newRecipients[index], photo_url: '' };
                                          setFormData({ ...formData, recipients: newRecipients });
                                        }}
                                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ) : (
                                    <label className="w-24 h-24 rounded-full border-4 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-rose-400 transition-colors">
                                      <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => uploadRecipientPhoto(index, e.target.files[0])}
                                        disabled={uploadingRecipient === index}
                                      />
                                      {uploadingRecipient === index ? (
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-rose-600"></div>
                                      ) : (
                                        <>
                                          <Upload className="w-6 h-6 text-gray-400 mb-1" />
                                          <span className="text-xs text-gray-500">Upload</span>
                                        </>
                                      )}
                                    </label>
                                  )}
                                </div>
                                <div className="flex-grow">
                                  <Label htmlFor={`recipient-name-${index}`}>Recipient Name</Label>
                                  <Input
                                    id={`recipient-name-${index}`}
                                    value={recipient.name}
                                    onChange={(e) => updateRecipientName(index, e.target.value)}
                                    placeholder="e.g., Sarah & John"
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeRecipient(index)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <X className="w-5 h-5" />
                                </Button>
                              </div>
                            </Card>
                          ))}
                          {formData.recipients.length < 4 && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={addRecipient}
                              className="w-full border-dashed"
                            >
                              <UserCircle2 className="w-4 h-4 mr-2" />
                              Add Recipient
                            </Button>
                          )}
                        </div>
                        {formErrors.recipients && <p className="text-sm text-red-500 mt-1">{formErrors.recipients}</p>}
                      </div>
                    )}

                    <div>
                      <Label htmlFor="content_md">Content (Markdown)</Label>
                      <p className="text-sm text-gray-600 mb-2">
                        {formData.category === 'recipients'
                          ? 'Write a short paragraph about the winner selection process or congratulations message'
                          : 'Write your announcement content in Markdown...'
                        }
                      </p>
                      <Textarea
                        id="content_md"
                        value={formData.content_md}
                        onChange={(e) => setFormData({...formData, content_md: e.target.value})}
                        rows={10}
                        className={formErrors.content_md ? 'border-red-500' : ''}
                      />
                      {formErrors.content_md && <p className="text-sm text-red-500 mt-1">{formErrors.content_md}</p>}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="featured"
                        checked={formData.featured}
                        onCheckedChange={(checked) => setFormData({...formData, featured: checked})}
                      />
                      <Label htmlFor="featured">Featured Announcement</Label>
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setShowAnnouncementDialog(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        {editingAnnouncement ? 'Update' : 'Create'} Announcement
                      </Button>
                    </DialogFooter>
                  </form>
                </TabsContent>
                <TabsContent value="preview" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {formData.featured && <Star className="w-5 h-5 text-yellow-500" />}
                        {formData.title || 'Untitled Announcement'}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Badge className={CATEGORY_CONFIG[formData.category]?.color}>
                          {CATEGORY_CONFIG[formData.category]?.label}
                        </Badge>
                        {formData.publication_date && (
                          <span>Published: {new Date(formData.publication_date).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  timeZone: 'America/Los_Angeles'
                                })}</span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {formData.excerpt && (
                        <p className="text-gray-600 italic mb-4">{formData.excerpt}</p>
                      )}

                      {formData.category === 'recipients' && formData.recipients.length > 0 && (
                        <div className="mb-6">
                          <div className={`grid ${formData.recipients.length === 1 ? 'grid-cols-1' : formData.recipients.length === 2 ? 'grid-cols-2' : formData.recipients.length === 3 ? 'grid-cols-3' : 'grid-cols-2 md:grid-cols-4'} gap-6 justify-center`}>
                            {formData.recipients.map((recipient, index) => (
                              <div key={index} className="text-center">
                                {recipient.photo_url ? (
                                  <img
                                    src={recipient.photo_url}
                                    alt={recipient.name}
                                    className="w-32 h-32 mx-auto rounded-full object-cover border-4 border-rose-300 shadow-lg mb-3"
                                  />
                                ) : (
                                  <div className="w-32 h-32 mx-auto rounded-full bg-gray-200 border-4 border-gray-300 flex items-center justify-center mb-3">
                                    <UserCircle2 className="w-16 h-16 text-gray-400" />
                                  </div>
                                )}
                                <p className="font-bold text-gray-900 text-lg">{recipient.name || `Recipient ${index + 1}`}</p>
                                {formData.publication_date && (
                                  <p className="text-sm text-gray-500">
                                    ANNOUNCED ON {new Date(formData.publication_date).toLocaleDateString('en-US', {
                                      month: 'long',
                                      day: 'numeric',
                                      year: 'numeric',
                                      timeZone: 'America/Los_Angeles'
                                    }).toUpperCase()}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="prose max-w-none">
                        <ReactMarkdown>{formData.content_md || 'No content yet...'}</ReactMarkdown>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-500" />
                Announcements ({filteredAnnouncements.length})
              </div>
              <Button onClick={exportAnnouncements} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search announcements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
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
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Publication Date</TableHead>
                    <TableHead>Featured</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAnnouncements.map((announcement) => {
                    const statusConfig = STATUS_CONFIG[announcement.status] || STATUS_CONFIG['draft'];
                    const categoryConfig = CATEGORY_CONFIG[announcement.category] || CATEGORY_CONFIG['general'];

                    return (
                      <TableRow key={announcement.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {announcement.featured && <Star className="w-4 h-4 text-yellow-500" />}
                              {announcement.title}
                            </div>
                            {announcement.excerpt && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {announcement.excerpt}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={categoryConfig.color}>
                            {categoryConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig.color}>
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600">
                            {announcement.publication_date
                              ? new Date(announcement.publication_date).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'numeric',
                                  day: 'numeric',
                                  timeZone: 'America/Los_Angeles'
                                })
                              : 'Not set'
                            }
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleFeatured(announcement)}
                          >
                            {announcement.featured ? (
                              <Star className="w-4 h-4 text-yellow-500" />
                            ) : (
                              <StarOff className="w-4 h-4 text-gray-400" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(announcement)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              {announcement.status === 'draft' && (
                                <DropdownMenuItem onClick={() => updateStatus(announcement.id, 'published')}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Publish
                                </DropdownMenuItem>
                              )}
                              {announcement.status === 'published' && (
                                <DropdownMenuItem onClick={() => updateStatus(announcement.id, 'archived')}>
                                  <EyeOff className="w-4 h-4 mr-2" />
                                  Archive
                                </DropdownMenuItem>
                              )}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Trash2 className="w-4 h-4 mr-2 text-red-500" />
                                    Delete
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{announcement.title}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(announcement.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
