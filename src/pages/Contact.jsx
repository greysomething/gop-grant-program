import React from 'react';
import { Mail } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto px-4">
      <div className="text-center mb-12">
        <Mail className="w-12 h-12 mx-auto text-rose-600 mb-4" />
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Contact Us</h1>
        <p className="text-lg text-gray-600">Have a question? We're here to help.</p>
      </div>
      <div className="bg-white p-8 rounded-lg shadow-sm border">
        <p className="text-center text-gray-700">
          For any questions about the application process, eligibility, or technical support, please reach out to our support team at:
        </p>
        <p className="text-center font-semibold text-rose-600 text-lg mt-4">
          <a href="mailto:support@giftofparenthood.org">support@giftofparenthood.org</a>
        </p>
        <p className="text-center text-gray-500 text-sm mt-4">
            We typically respond within 1-2 business days.
        </p>
      </div>
    </div>
  );
}