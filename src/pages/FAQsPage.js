import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const FAQsPage = () => {
  const navigate = useNavigate();

  const faqSections = [
    {
      title: "Ordering",
      faqs: [
        {
          question: "What types of food do you offer?",
          answer: "We offer a variety of fast food items including Biryani, Noodles, Fried Rice, Starters (Manchuria, 65 varieties), Haleem, and more."
        },
        {
          question: "How do I place an order?",
          answer: "Browse our menu, add items to your cart, choose your delivery type and time slot, and proceed to payment."
        },
        {
          question: "Is there a minimum order requirement?",
          answer: "No. You can order any number of items from our menu."
        }
      ]
    },
    {
      title: "Delivery Options",
      faqs: [
        {
          question: "What delivery options are available?",
          answer: "We offer two delivery types: Normal Delivery (to your location) and Room Delivery (directly to your hostel room)."
        },
        {
          question: "What is Room Delivery?",
          answer: "Room Delivery is a service for hostel residents where food is delivered directly to your hostel room. Select your hostel, provide your room number, and we'll deliver right to your door."
        },
        {
          question: "Which hostels are supported for Room Delivery?",
          answer: "We support Girls Hostels (GH-1, GH-2, GH-3) and Boys Hostels (BH-1, BH-2, BH-3)."
        },
        {
          question: "How is the Room Delivery charge calculated?",
          answer: "Room Delivery charges are based on the number of items: 1-2 items: ₹29, 3-4 items: ₹49, 5-6 items: ₹55, 7-8 items: ₹59, 9+ items: ₹65."
        }
      ]
    },
    {
      title: "Delivery Time",
      faqs: [
        {
          question: "When can I get my order delivered?",
          answer: "You can choose from available delivery time slots during checkout. Delivery times depend on partner availability."
        },
        {
          question: "Can I track my order?",
          answer: "Yes. You can track your order status from the My Orders section after placing an order."
        }
      ]
    },
    {
      title: "Pricing & Payments",
      faqs: [
        {
          question: "What payment methods are accepted?",
          answer: "We accept online payments through Razorpay including UPI, cards, net banking, and wallets."
        },
        {
          question: "Are there any additional charges?",
          answer: "Room Delivery orders include an additional delivery charge based on item quantity. Normal delivery has no extra charges."
        }
      ]
    },
    {
      title: "Refund & Cancellation Policy",
      faqs: [
        {
          question: "Is a refund available after payment?",
          answer: "No. Refunds are not available once the payment is completed."
        },
        {
          question: "Can I cancel my order?",
          answer: "Orders cannot be canceled after confirmation."
        }
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
          <h1 className="text-2xl font-bold text-white">Frequently Asked Questions</h1>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {faqSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="space-y-4">
            {/* Section Header */}
            <div className="bg-black rounded-lg px-5 py-3 shadow-lg">
              <h2 className="text-lg font-bold text-white">{section.title}</h2>
            </div>

            {/* FAQs in Section - Simple Text Style */}
            <div className="space-y-4 px-2">
              {section.faqs.map((faq, faqIndex) => (
                <div key={faqIndex} className="space-y-2">
                  {/* Question */}
                  <h3 className="font-semibold text-gray-900 text-base">
                    Q: {faq.question}
                  </h3>
                  
                  {/* Answer */}
                  <p className="text-gray-700 text-sm leading-relaxed pl-4">
                    A: {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Spacing */}
      <div className="h-8"></div>
    </div>
  );
};

export default FAQsPage;
