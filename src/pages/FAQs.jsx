
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { FaqItem } from "@/api/entities";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, Search, Inbox } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import ReactMarkdown from 'react-markdown';

const CATEGORIES = ["fees", "eligibility", "selection", "timeline", "privacy", "passes", "accessibility", "taxes", "technical"];

export default function FAQs() {
  const [faqs, setFaqs] = useState([]);
  const [filteredFaqs, setFilteredFaqs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    loadFaqs();
  }, []);

  useEffect(() => {
    let filtered = faqs;

    if (selectedCategory !== "all") {
      filtered = filtered.filter(faq => faq.category === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(faq => 
        faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.answer_md.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredFaqs(filtered);
  }, [searchTerm, selectedCategory, faqs]);

  const loadFaqs = async () => {
    try {
      // Check if user is logged in
      let userLoggedIn = false;
      try {
        const user = await User.me();
        userLoggedIn = !!user;
        setIsLoggedIn(userLoggedIn);
      } catch (error) {
        // User not logged in, that's fine
        setIsLoggedIn(false);
      }

      // Load published FAQs
      const publishedFaqs = await FaqItem.filter({ status: 'published' }, 'order_index');
      
      // Filter based on visibility and user login status
      const visibleFaqs = publishedFaqs.filter(faq => {
        if (faq.visibility === 'public') return true;
        if (faq.visibility === 'applicant_only' && userLoggedIn) return true;
        return false;
      });

      setFaqs(visibleFaqs);
      setFilteredFaqs(visibleFaqs);
    } catch (error) {
      console.error("Failed to load FAQs:", error);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <HelpCircle className="w-12 h-12 mx-auto text-rose-600 mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
          <p className="text-lg text-gray-600">
            Find answers to common questions about our grant program.
          </p>
        </div>

        <div className="sticky top-16 bg-white/80 backdrop-blur-lg py-4 z-10 mb-8">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search for a question..."
              className="pl-10 h-12"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            <Badge
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => setSelectedCategory("all")}
              className="cursor-pointer text-base px-3 py-1"
            >
              All
            </Badge>
            {CATEGORIES.map(category => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className="cursor-pointer text-base px-3 py-1 capitalize"
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : filteredFaqs.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {filteredFaqs.map(faq => (
              <AccordionItem key={faq.id} value={faq.id}>
                <AccordionTrigger className="text-lg text-left">
                  <div className="flex items-start gap-3">
                    <span>{faq.question}</span>
                    {faq.visibility === 'applicant_only' && isLoggedIn && (
                      <Badge variant="secondary" className="text-xs">
                        Member Only
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="prose max-w-none text-gray-600">
                  <ReactMarkdown>{faq.answer_md}</ReactMarkdown>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="text-center py-16">
            <Inbox className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800">No results found</h3>
            <p className="text-gray-500 mt-2">
              Try adjusting your search or category, or contact support if you can't find what you're looking for.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
