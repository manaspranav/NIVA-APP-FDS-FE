import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const AboutUsPage = () => {
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
          <h1 className="text-2xl font-bold text-white">About Us</h1>
        </div>
      </div>

      {/* Introduction */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <div className="px-2">
          <p className="text-gray-700 text-base leading-relaxed">
            Welcome to our platform – a simple and convenient solution for ordering delicious fast food items with quick delivery options including room delivery.
          </p>
          <p className="text-gray-700 text-base leading-relaxed mt-3">
            Our goal is to make tasty fast food easily accessible while supporting local food vendors and delivery partners through a technology-driven platform.
          </p>
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        
        {/* What We Offer */}
        <div className="space-y-4">
          <div className="bg-black rounded-lg px-5 py-3 shadow-lg">
            <h2 className="text-lg font-bold text-white">What We Offer</h2>
          </div>
          <div className="px-2">
            <ul className="space-y-2 text-gray-700 text-sm leading-relaxed">
              <li className="flex items-start">
                <span className="text-green-600 mr-2 mt-0.5">✓</span>
                <span>Fast Food Orders – Biryani, Noodles, Fried Rice, Starters & more</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2 mt-0.5">✓</span>
                <span>Normal Delivery to your location</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2 mt-0.5">✓</span>
                <span>Room Delivery option for hostel residents</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2 mt-0.5">✓</span>
                <span>Flexible delivery time slots</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Our Role as a Mediator */}
        <div className="space-y-4">
          <div className="bg-black rounded-lg px-5 py-3 shadow-lg">
            <h2 className="text-lg font-bold text-white">Our Role as a Mediator</h2>
          </div>
          <div className="px-2">
            <p className="text-gray-700 text-sm font-semibold mb-3">We operate strictly as a technology platform and mediator.</p>
            <ul className="space-y-2 text-gray-700 text-sm leading-relaxed">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>We connect users with independent food vendors and delivery partners</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>We do not own or operate kitchens, warehouses, or delivery vehicles</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Food sourcing, preparation, and delivery are managed by third-party partners</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Our responsibility is limited to facilitating orders, schedules, and communication through the platform</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Business Status Disclosure */}
        <div className="space-y-4">
          <div className="bg-black rounded-lg px-5 py-3 shadow-lg">
            <h2 className="text-lg font-bold text-white">Business Status Disclosure</h2>
          </div>
          <div className="px-2">
            <ul className="space-y-2 text-gray-700 text-sm leading-relaxed">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>This business is currently <span className="font-semibold">unregistered</span></span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Services are offered on a best-effort basis</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>By using this platform, users acknowledge and accept this operational status</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Our Vision */}
        <div className="space-y-4">
          <div className="bg-black rounded-lg px-5 py-3 shadow-lg">
            <h2 className="text-lg font-bold text-white">Our Vision</h2>
          </div>
          <div className="px-2">
            <p className="text-gray-700 text-sm mb-3">We aim to:</p>
            <ul className="space-y-2 text-gray-700 text-sm leading-relaxed">
              <li className="flex items-start">
                <span className="text-green-600 mr-2 mt-0.5">✓</span>
                <span>Promote convenient and tasty food delivery</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2 mt-0.5">✓</span>
                <span>Enable easy access to a variety of fast food options</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2 mt-0.5">✓</span>
                <span>Support local vendors and delivery partners</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2 mt-0.5">✓</span>
                <span>Maintain transparency in operations and policies</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Support & Contact */}
        <div className="space-y-4">
          <div className="bg-black rounded-lg px-5 py-3 shadow-lg">
            <h2 className="text-lg font-bold text-white">Support & Contact</h2>
          </div>
          <div className="px-2">
            <p className="text-gray-700 text-sm leading-relaxed">
              For any questions, issues, or feedback, users can contact us through the Help & Support section available within the app or website.
            </p>
          </div>
        </div>

        {/* Our Commitment to Transparency */}
        <div className="space-y-4">
          <div className="bg-black rounded-lg px-5 py-3 shadow-lg">
            <h2 className="text-lg font-bold text-white">Our Commitment to Transparency</h2>
          </div>
          <div className="px-2">
            <p className="text-gray-700 text-sm mb-3">We believe in clearly communicating:</p>
            <ul className="space-y-2 text-gray-700 text-sm leading-relaxed">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Our role as a mediator</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Delivery limitations (no Sundays or public holidays)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Fixed policies including no-refund policy</span>
              </li>
            </ul>
            <p className="text-gray-700 text-sm leading-relaxed mt-4 font-medium">
              Thank you for trusting our platform and being part of our journey.
            </p>
          </div>
        </div>

      </div>

      {/* Bottom Spacing */}
      <div className="h-8"></div>
    </div>
  );
};

export default AboutUsPage;
