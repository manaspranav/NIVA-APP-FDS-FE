import React, { useState, useEffect } from 'react';

function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!visible) return null;

  return (
    <div className="fixed top-16 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <button
        onClick={scrollToTop}
        className="pointer-events-auto bg-black text-white text-sm font-semibold px-5 py-2 rounded-full shadow-lg hover:bg-gray-800 transition-all duration-300 flex items-center gap-1 opacity-90 hover:opacity-100"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
        Back to Top
      </button>
    </div>
  );
}

export default BackToTop;
