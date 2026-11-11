import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MessageCircle, HelpCircle } from 'lucide-react';

const HelpAndSupportPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white pb-8 overflow-x-hidden">
      {/* Header */}
      <div className="bg-black sticky top-0 z-50 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-800 rounded-full transition-all"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-2xl font-bold text-white">Help & Support</h1>
        </div>
      </div>

      {/* Introduction */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <div className="px-2">
          <div className="flex items-start gap-3 mb-3">
            <HelpCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">We're Here to Help!</h2>
              <p className="text-gray-700 text-sm leading-relaxed">
                If you have any questions, concerns, or need assistance with your orders, our support team is ready to assist you.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Options */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        
        {/* Contact Methods Section */}
        <div className="space-y-4">
          <div className="bg-black rounded-lg px-5 py-3 shadow-lg">
            <h2 className="text-lg font-bold text-white">Contact Us</h2>
          </div>

          {/* Phone Contact */}
          <div className="px-2 space-y-4">
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-1">Phone Support</h3>
                <p className="text-sm text-gray-600 mb-1">Call us directly for immediate assistance</p>
                <a href="tel:+919392178949" className="text-lg font-semibold text-green-600 hover:underline">
                  +91 93921 78949
                </a>
              </div>
            </div>

          {/* Email Contact */}
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-1">Email Support</h3>
                <p className="text-sm text-gray-600 mb-1">Send us an email anytime</p>
                <a href="mailto:niva2026.in@gmail.com" className="text-sm font-semibold text-blue-600 hover:underline">
                  niva2026.in@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Help Topics */}
        <div className="space-y-4">
          <div className="bg-black rounded-lg px-5 py-3 shadow-lg">
            <h2 className="text-lg font-bold text-white">Quick Help Topics</h2>
          </div>

          <div className="px-2 space-y-3">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-gray-700" />
              <button
                onClick={() => navigate('/faqs')}
                className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
              >
                Frequently Asked Questions
              </button>
            </div>

            <div className="pl-7">
              <p className="text-sm text-gray-700 font-medium mb-2">Common Topics:</p>
              <ul className="space-y-1.5 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="mr-2 text-green-600">•</span>
                  <span>How to place an order?</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-green-600">•</span>
                  <span>Delivery schedule and timing</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-green-600">•</span>
                  <span>Room delivery options</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-green-600">•</span>
                  <span>Refund and cancellation policy</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-green-600">•</span>
                  <span>Payment issues</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Business Hours */}
        <div className="space-y-4">
          <div className="bg-black rounded-lg px-5 py-3 shadow-lg">
            <h2 className="text-lg font-bold text-white">Support Hours</h2>
          </div>
          <div className="px-2">
            <p className="text-gray-700 text-sm leading-relaxed mb-3">
              Our support team is available to assist you:
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-700 font-medium">Monday - Saturday</span>
                <span className="text-gray-900 font-semibold">9:00 AM - 7:00 PM</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-700 font-medium">Sunday</span>
                <span className="text-red-600 font-semibold">Closed</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              * Response time may vary during peak hours
            </p>
          </div>
        </div>

        {/* Response Time */}
        <div className="space-y-4">
          <div className="bg-black rounded-lg px-5 py-3 shadow-lg">
            <h2 className="text-lg font-bold text-white">Expected Response Time</h2>
          </div>
          <div className="px-2">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Phone Support</p>
                  <p className="text-xs text-gray-600">Immediate response during business hours</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Email Support</p>
                  <p className="text-xs text-gray-600">Response within 24-48 hours</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Note */}
        <div className="px-2">
          <p className="text-sm text-gray-700 leading-relaxed">
            <strong>Note:</strong> For urgent order-related issues, we recommend calling our phone support for immediate assistance.
          </p>
        </div>

      </div>

      {/* Bottom Spacing */}
      <div className="h-8"></div>
    </div>
  );
};

export default HelpAndSupportPage;
