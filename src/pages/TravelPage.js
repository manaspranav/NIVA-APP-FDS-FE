import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import FloatingCart from '../components/FloatingCart';
import BackToTop from '../components/BackToTop';

function TravelPage() {
  const navigate = useNavigate();
  const [showFooter, setShowFooter] = useState(true);

  // Track scroll direction to show/hide footer
  useEffect(() => {
    let lastScroll = 0;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > 50) {
        if (currentScrollY > lastScroll) {
          setShowFooter(false);
        } else if (currentScrollY < lastScroll) {
          setShowFooter(true);
        }
      } else {
        setShowFooter(true);
      }
      
      lastScroll = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-32 flex flex-col">
      {/* Header */}
      <div className="bg-black shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/customer/dashboard')}
              className="text-white hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-white">Travel & Rental</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-3">Coming Soon</h2>
          {/* <p className="text-xl text-gray-700 font-semibold mb-2 font-metropolis">20-02-2026</p> */}
          <p className="text-lg text-gray-600">Stay Tuned</p>
        </div>
      </div>

      <BackToTop />
      {/* Fixed Bottom Navigation */}
      <Footer showFooter={showFooter} />
      <FloatingCart />
    </div>
  );
}

export default TravelPage;
