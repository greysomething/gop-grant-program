
import React, { useState, useEffect, useCallback } from 'react';
import { Announcement } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calendar, Star, Search, Inbox } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const CATEGORY_CONFIG = {
  recipients: { label: 'Recipients', color: 'bg-rose-100 text-rose-800' },
  program_updates: { label: 'Program Updates', color: 'bg-blue-100 text-blue-800' },
  general: { label: 'General', color: 'bg-purple-100 text-purple-800' },
  cycle_announcements: { label: 'Cycle Announcements', color: 'bg-indigo-100 text-indigo-800' }
};

export default function NewsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadAnnouncements = async () => {
    try {
      const published = await Announcement.filter({ status: 'published' }, '-publication_date');
      setAnnouncements(published);
    } catch (error) {
      console.error('Failed to load announcements:', error);
    }
    setIsLoading(false);
  };

  const filterAnnouncements = useCallback(() => {
    let filtered = announcements;

    if (searchTerm) {
      filtered = filtered.filter(announcement =>
        announcement.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        announcement.content_md?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        announcement.excerpt?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAnnouncements(filtered);
  }, [announcements, searchTerm]);

  useEffect(() => {
    loadAnnouncements();
  }, []); // Empty dependency array means this runs once on mount

  useEffect(() => {
    filterAnnouncements();
  }, [filterAnnouncements]); // Now depends on the memoized filterAnnouncements function

  const featuredAnnouncements = filteredAnnouncements.filter(a => a.featured);
  const regularAnnouncements = filteredAnnouncements.filter(a => !a.featured);

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Calendar className="w-12 h-12 mx-auto text-rose-600 mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">News & Announcements</h1>
          <p className="text-lg text-gray-600">
            Stay updated with the latest news, grant recipients, and program updates.
          </p>
        </div>

        <div className="sticky top-16 bg-white/80 backdrop-blur-lg py-4 z-10 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search announcements..."
              className="pl-10 h-12"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 w-2/3 bg-gray-200 rounded"></div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="h-4 w-full bg-gray-200 rounded"></div>
                  <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Featured Announcements */}
            {featuredAnnouncements.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Star className="w-6 h-6 text-yellow-500" />
                  Featured
                </h2>
                <div className="space-y-6">
                  {featuredAnnouncements.map((announcement) => {
                    const categoryConfig = CATEGORY_CONFIG[announcement.category] || CATEGORY_CONFIG['general'];
                    return (
                      <Card key={announcement.id} className="border-2 border-yellow-200 bg-yellow-50/50">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-xl flex items-center gap-2">
                              <Star className="w-5 h-5 text-yellow-500" />
                              {announcement.title}
                            </CardTitle>
                            <Badge className={categoryConfig.color}>
                              {categoryConfig.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            {new Date(announcement.publication_date).toLocaleDateString()}
                          </div>
                        </CardHeader>
                        <CardContent>
                          {announcement.excerpt && (
                            <p className="text-gray-700 mb-4 text-lg">{announcement.excerpt}</p>
                          )}
                          <div className="prose max-w-none">
                            <ReactMarkdown>{announcement.content_md}</ReactMarkdown>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Regular Announcements */}
            {regularAnnouncements.length > 0 && (
              <div>
                {featuredAnnouncements.length > 0 && (
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Updates</h2>
                )}
                <div className="space-y-6">
                  {regularAnnouncements.map((announcement) => {
                    const categoryConfig = CATEGORY_CONFIG[announcement.category] || CATEGORY_CONFIG['general'];
                    return (
                      <Card key={announcement.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-xl">{announcement.title}</CardTitle>
                            <Badge className={categoryConfig.color}>
                              {categoryConfig.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            {new Date(announcement.publication_date).toLocaleDateString()}
                          </div>
                        </CardHeader>
                        <CardContent>
                          {announcement.excerpt && (
                            <p className="text-gray-700 mb-4">{announcement.excerpt}</p>
                          )}
                          <div className="prose max-w-none">
                            <ReactMarkdown>{announcement.content_md}</ReactMarkdown>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* No Results */}
            {filteredAnnouncements.length === 0 && !isLoading && (
              <div className="text-center py-16">
                <Inbox className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-800">
                  {searchTerm ? 'No matching announcements' : 'No announcements yet'}
                </h3>
                <p className="text-gray-500 mt-2">
                  {searchTerm 
                    ? 'Try adjusting your search terms.' 
                    : 'Check back soon for the latest updates and grant recipient announcements.'
                  }
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
