import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TermsAndConditionsPage = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: "Platform Role & Disclaimer",
      content: [
        "This platform operates strictly as a technology-based intermediary and mediator.",
        "- We connect customers with independent food vendors and delivery partners.",
        "- We do not own, operate, or manage any kitchens, warehouses, or delivery vehicles.",
        "- All food sourcing, preparation, quality control, and delivery are handled by independent third-party vendors and partners.",
        "- Our role is limited to facilitating orders, scheduling, payments, and communication through this platform.",
        "- By using this platform, you acknowledge that we act solely as an intermediary and not as the direct provider of goods or services."
      ]
    },
    {
      title: "Services Offered",
      content: [
        "Through our partner network, we facilitate the following services:",
        "- Fast Food Orders (Biryani, Noodles, Fried Rice, Starters, and more)",
        "- Normal Delivery to your location",
        "- Room Delivery directly to your hostel room",
        "All products are subject to availability and are provided by our vendor partners."
      ]
    },
    {
      title: "Ordering & Eligibility",
      content: [
        "- Users must provide accurate delivery details while placing an order.",
        "- For Room Delivery, a valid hostel name and room number must be provided.",
        "- Orders once placed cannot be modified after confirmation.",
        "- We reserve the right to refuse or cancel orders in case of misuse or incorrect information."
      ]
    },
    {
      title: "Room Delivery Terms",
      content: [
        "- Room Delivery is available for supported hostels (GH-1, GH-2, GH-3, BH-1, BH-2, BH-3).",
        "- Additional delivery charges apply based on order quantity.",
        "- Users must ensure they are available at their room to receive the delivery.",
        "- Room Delivery charges: 1-2 items ₹29, 3-4 items ₹49, 5-6 items ₹55, 7-8 items ₹59, 9+ items ₹65."
      ]
    },
    {
      title: "Delivery Policy",
      content: [
        "- Delivery times depend on the assigned delivery partner and availability.",
        "- Delivery schedules may vary due to unforeseen circumstances.",
        "- We are not responsible for delays caused by weather, traffic, or other external factors."
      ]
    },
    {
      title: "Pricing & Payments",
      content: [
        "- Prices are displayed clearly before checkout.",
        "- Room Delivery includes additional charges based on item quantity.",
        "- Full payment must be made in advance for all orders.",
        "- We reserve the right to change prices at any time without prior notice."
      ]
    },
    {
      title: "Refund & Cancellation Policy",
      content: [
        "- Refunds are not available once payment is completed.",
        "- Orders cannot be canceled after confirmation.",
        "- No refunds will be issued for missed deliveries."
      ]
    },
    {
      title: "Product Quality & Availability",
      content: [
        "- Food is prepared fresh and hygienically by our vendor partners.",
        "- We facilitate but do not directly control food quality, which is the responsibility of the vendor partners.",
        "- Menu items may vary depending on availability.",
        "- Images shown in the app are for representation purposes only."
      ]
    },
    {
      title: "User Responsibilities",
      content: [
        "- Users must ensure availability at the delivery location.",
        "- Incorrect address or unavailability may result in missed delivery.",
        "- Users agree not to misuse the platform for fraudulent activities."
      ]
    },
    {
      title: "Delivery Partner Assignment",
      content: [
        "- Delivery partners are assigned automatically based on availability and location.",
        "- We do not guarantee the same delivery partner for every order."
      ]
    },
    {
      title: "Limitation of Liability",
      content: [
        "- As a technology platform and intermediary, we are not directly responsible for the quality or condition of products delivered by vendor partners.",
        "- We are not responsible for delays caused by weather, traffic, strikes, vendor issues, or unforeseen circumstances.",
        "- Our liability as a mediator is limited to facilitating communication between customers and vendors.",
        "- Any disputes regarding product quality should be raised through the Help & Support section, and we will assist in coordinating with the vendor partner.",
        "- Maximum liability, if any, is limited to the value of the order placed."
      ]
    },
    {
      title: "Account Suspension or Termination",
      content: [
        "We reserve the right to suspend or terminate user accounts if:",
        "- False information is provided",
        "- Terms are violated",
        "- Fraudulent activity is detected"
      ]
    },
    {
      title: "Changes to Terms & Conditions",
      content: [
        "- We may update these Terms & Conditions at any time.",
        "- Continued use of our services implies acceptance of updated terms."
      ]
    },
    {
      title: "Governing Law",
      content: [
        "These Terms & Conditions shall be governed by and interpreted in accordance with the laws applicable in your operating region."
      ]
    },
    {
      title: "Contact & Support",
      content: [
        "For any questions or concerns regarding these Terms & Conditions, please contact us through the Help & Support section in the website."
      ]
    }
  ];

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
          <h1 className="text-2xl font-bold text-white">Terms & Conditions</h1>
        </div>
      </div>

      {/* Last Updated */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <div className="px-2">
          <p className="text-sm text-gray-700">
            Last updated: <span className="font-semibold text-gray-900">January 25, 2026</span>
          </p>
          <p className="text-sm text-gray-700 mt-2 leading-relaxed">
            By accessing or using our application, website, or services, you agree to be bound by the following Terms & Conditions. Please read them carefully before placing an order.
          </p>
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {sections.map((section, index) => (
          <div key={index} className="space-y-4">
            {/* Section Header */}
            <div className="bg-black rounded-lg px-5 py-3 shadow-lg">
              <h2 className="text-lg font-bold text-white">
                {index + 1}. {section.title}
              </h2>
            </div>

            {/* Section Content */}
            <div className="px-2">
              {section.content && (
                <div className="space-y-2">
                  {section.content.map((text, textIndex) => (
                    <p key={textIndex} className="text-gray-700 text-sm leading-relaxed">
                      {text}
                    </p>
                  ))}
                </div>
              )}

              {/* Subsections */}
              {section.subsections && (
                <div className="space-y-4 mt-3">
                  {section.subsections.map((subsection, subIndex) => (
                    <div key={subIndex} className="pl-4">
                      <h3 className="font-bold text-gray-900 text-base mb-2">
                        {subsection.subtitle}
                      </h3>
                      <div className="space-y-1">
                        {subsection.content.map((text, textIndex) => (
                          <p key={textIndex} className="text-gray-700 text-sm leading-relaxed">
                            {text}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Spacing */}
      <div className="h-8"></div>
    </div>
  );
};

export default TermsAndConditionsPage;
