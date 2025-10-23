
import React, { useState, useEffect } from 'react';
import { Announcement } from '@/api/entities';
import { HomePageContent } from '@/api/entities'; // New import
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Search, 
  Calendar, 
  Star, 
  Heart,
  ArrowRight,
  Inbox,
  Award,
  Sparkles,
  Trophy,
  PartyPopper
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function PastRecipientsPage() {
  const [recipients, setRecipients] = useState([]);
  const [filteredRecipients, setFilteredRecipients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [headerBgImage, setHeaderBgImage] = useState(''); // New state for header background image
  const [headerOpacity, setHeaderOpacity] = useState('85'); // New state for header background opacity

  useEffect(() => {
    loadRecipients();
    loadHeaderBackground(); // Call new function to load header background
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredRecipients(recipients);
      return;
    }

    const filtered = recipients.filter(recipient =>
      recipient.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipient.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipient.content_md?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredRecipients(filtered);
  }, [searchTerm, recipients]);

  const loadRecipients = async () => {
    try {
      const recipientAnnouncements = await Announcement.filter({ 
        status: 'published', 
        category: 'recipients'
      }, '-publication_date');
      
      setRecipients(recipientAnnouncements);
      setFilteredRecipients(recipientAnnouncements);
    } catch (error) {
      console.error('Failed to load recipient stories:', error);
    }
    setIsLoading(false);
  };

  // New function to load header background image from HomePageContent
  const loadHeaderBackground = async () => {
    try {
      const contentItems = await HomePageContent.list();
      const bgImageContent = contentItems.find(item => item.content_key === 'announcement_header_bg_image');
      const opacityContent = contentItems.find(item => item.content_key === 'announcement_header_opacity');
      
      if (bgImageContent?.content_value) {
        setHeaderBgImage(bgImageContent.content_value);
      }
      if (opacityContent?.content_value) {
        setHeaderOpacity(opacityContent.content_value);
      }
    } catch (error) {
      console.error('Failed to load header background:', error);
    }
  };

  const formatPublicationDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Los_Angeles'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading recipient stories...</p>
        </div>
      </div>
    );
  }

  const featuredRecipients = filteredRecipients.filter(r => r.featured);
  const regularRecipients = filteredRecipients.filter(r => !r.featured);

  const overlayOpacity = parseInt(headerOpacity) / 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-orange-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
              <Award className="w-6 h-6 text-white" />
            </div>
            <Users className="w-12 h-12 text-rose-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Past Grant Recipients</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Celebrating the families who have received a Gift of Parenthood grant and the journeys that brought them hope.
          </p>
        </div>

        {recipients.length > 0 && (
          <div className="mb-8">
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search recipient stories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 bg-white/80 backdrop-blur-sm border-rose-200 focus:border-rose-400"
              />
            </div>
          </div>
        )}

        {recipients.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-white/80 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Inbox className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Stories Yet</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              We're still building our collection of recipient stories. Check back soon to read about the families we've helped support.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Featured Recipients */}
            {featuredRecipients.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <h2 className="text-2xl font-bold text-gray-900">Featured Stories</h2>
                </div>
                <div className="grid gap-8">
                  {featuredRecipients.map((recipient) => (
                    <Card key={recipient.id} className="bg-white/90 backdrop-blur-sm border-2 border-yellow-200 shadow-xl hover:shadow-2xl transition-all duration-200">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-2xl mb-2 flex items-center gap-2">
                              <Sparkles className="w-6 h-6 text-yellow-500" />
                              {recipient.title}
                            </CardTitle>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                Featured Story
                              </Badge>
                              {recipient.publication_date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {formatPublicationDate(recipient.publication_date)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {recipient.excerpt && (
                          <blockquote className="text-lg italic text-gray-700 border-l-4 border-yellow-400 pl-4 mb-4">
                            "{recipient.excerpt}"
                          </blockquote>
                        )}
                        <div className="prose prose-rose max-w-none mb-6">
                          <ReactMarkdown>
                            {recipient.content_md?.substring(0, 500) + (recipient.content_md?.length > 500 ? '...' : '')}
                          </ReactMarkdown>
                        </div>
                        <Button 
                          onClick={() => setSelectedRecipient(recipient)}
                          className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-lg"
                        >
                          Read Full Story <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Regular Recipients */}
            {regularRecipients.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <Heart className="w-5 h-5 text-rose-500" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    {featuredRecipients.length > 0 ? 'More Stories' : 'Recipient Stories'}
                  </h2>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  {regularRecipients.map((recipient) => (
                    <Card key={recipient.id} className="bg-white/80 backdrop-blur-sm border border-rose-200 shadow-lg hover:shadow-xl transition-all duration-200 hover:border-rose-300">
                      <CardHeader>
                        <CardTitle className="text-xl mb-2">{recipient.title}</CardTitle>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
                            Grant Recipient
                          </Badge>
                          {recipient.publication_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatPublicationDate(recipient.publication_date)}
                            </span>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {recipient.excerpt && (
                          <p className="text-gray-700 italic mb-4 line-clamp-3">
                            "{recipient.excerpt}"
                          </p>
                        )}
                        <div className="prose prose-sm max-w-none text-gray-600 mb-4">
                          <ReactMarkdown>
                            {recipient.content_md?.substring(0, 200) + (recipient.content_md?.length > 200 ? '...' : '')}
                          </ReactMarkdown>
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={() => setSelectedRecipient(recipient)}
                          className="border-rose-300 text-rose-700 hover:bg-rose-50"
                        >
                          Read Story <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {filteredRecipients.length === 0 && recipients.length > 0 && (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Stories Found</h3>
                <p className="text-gray-600">
                  No recipient stories match your search. Try adjusting your search terms.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Story Detail Modal - UPDATED WITH WINNER CARDS */}
        {selectedRecipient && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="max-w-4xl w-full bg-gradient-to-br from-amber-50 via-white to-rose-50 rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
              {/* Award Show Header */}
              <div 
                className="relative bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 p-8 text-center overflow-hidden"
                style={headerBgImage ? {
                  backgroundImage: `linear-gradient(rgba(251, 191, 36, ${overlayOpacity}), rgba(251, 191, 36, ${overlayOpacity})), url(${headerBgImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                } : {}}
              >
                {/* Decorative sparkles */}
                <div className="absolute top-4 left-4 text-white/30">
                  <Sparkles className="w-8 h-8 animate-pulse" />
                </div>
                <div className="absolute top-4 right-4 text-white/30">
                  <Sparkles className="w-8 h-8 animate-pulse" style={{ animationDelay: '0.5s' }} />
                </div>
                <div className="absolute bottom-4 left-1/4 text-white/20">
                  <PartyPopper className="w-6 h-6" />
                </div>
                <div className="absolute bottom-4 right-1/4 text-white/20">
                  <PartyPopper className="w-6 h-6" />
                </div>
                
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg relative z-10">
                  <Trophy className="w-10 h-10 text-amber-500" />
                </div>
                
                <h2 className="text-4xl font-bold text-white drop-shadow-lg mb-2 relative z-10">
                  {selectedRecipient.title}
                </h2>
                
                <div className="flex items-center justify-center gap-3 mt-4 relative z-10">
                  {selectedRecipient.featured && (
                    <Badge className="bg-white/90 text-amber-700 border-0 px-4 py-1 text-sm font-semibold">
                      <Star className="w-4 h-4 mr-1 fill-amber-500 text-amber-500" />
                      Featured Story
                    </Badge>
                  )}
                  {selectedRecipient.publication_date && (
                    <Badge className="bg-white/80 text-gray-700 border-0 px-4 py-1 text-sm">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatPublicationDate(selectedRecipient.publication_date)}
                    </Badge>
                  )}
                </div>
                
                <button 
                  onClick={() => setSelectedRecipient(null)}
                  className="absolute top-4 right-4 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center text-gray-700 hover:text-gray-900 transition-colors shadow-lg z-10"
                >
                  ✕
                </button>
              </div>
              
              {/* Content Section */}
              <div className="p-8">
                {/* Winner Cards */}
                {selectedRecipient.recipients && selectedRecipient.recipients.length > 0 && (
                  <div className="mb-8">
                    <div className={`grid ${
                      selectedRecipient.recipients.length === 1 ? 'grid-cols-1' : 
                      selectedRecipient.recipients.length === 2 ? 'grid-cols-2' : 
                      selectedRecipient.recipients.length === 3 ? 'grid-cols-3' : 
                      'grid-cols-2 md:grid-cols-4'
                    } gap-8 justify-center mb-8`}>
                      {selectedRecipient.recipients.map((recipient, index) => (
                        <div key={index} className="text-center">
                          <div className="relative mb-4">
                            <div className="absolute inset-0 bg-gradient-to-br from-rose-200 to-amber-200 rounded-full blur-lg opacity-50"></div>
                            <img 
                              src={recipient.photo_url} 
                              alt={recipient.name} 
                              className="relative w-48 h-48 mx-auto rounded-full object-cover border-4 border-white shadow-2xl"
                            />
                          </div>
                          <p className="font-bold text-gray-900 text-xl mb-1">{recipient.name}</p>
                          {selectedRecipient.publication_date && (
                            <p className="text-xs text-gray-500 uppercase tracking-wide">
                              Announced on {new Date(selectedRecipient.publication_date).toLocaleDateString('en-US', { 
                                month: 'long', 
                                day: 'numeric', 
                                year: 'numeric',
                                timeZone: 'America/Los_Angeles' 
                              })}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedRecipient.excerpt && (
                  <div className="mb-8">
                    <div className="flex items-start gap-3 bg-gradient-to-r from-rose-50 to-pink-50 border-l-4 border-rose-400 p-6 rounded-r-lg">
                      <Award className="w-6 h-6 text-rose-500 flex-shrink-0 mt-1" />
                      <blockquote className="text-xl italic text-gray-800 leading-relaxed">
                        "{selectedRecipient.excerpt}"
                      </blockquote>
                    </div>
                  </div>
                )}
                
                {/* Main Content */}
                <div className="prose prose-lg prose-rose max-w-none">
                  <ReactMarkdown>{selectedRecipient.content_md}</ReactMarkdown>
                </div>
                
                {/* Footer */}
                <div className="mt-12 pt-8 border-t border-gray-200">
                  <div className="flex items-center justify-center gap-2 text-rose-600">
                    <Heart className="w-5 h-5 fill-current" />
                    <span className="text-lg font-semibold">Congratulations to our grant recipients!</span>
                    <Heart className="w-5 h-5 fill-current" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
