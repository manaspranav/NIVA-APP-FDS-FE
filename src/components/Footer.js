import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faThLarge } from '@fortawesome/free-solid-svg-icons';

function Footer({ showFooter = true }) {
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveTab = () => {
    if (location.pathname === '/customer/dashboard') return 'home';
    if (location.pathname === '/customer/wishlist') return 'wishlist';
    if (location.pathname === '/categories') return 'categories';
    return '';
  };

  const activeTab = getActiveTab();

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 transition-transform duration-300 ${
      showFooter ? 'translate-y-0' : 'translate-y-full'
    }`}>
      <div className="flex justify-around items-center py-2">
        <button
          onClick={() => navigate('/customer/dashboard')}
          className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-all active:bg-gray-200 ${
            activeTab === 'home' ? 'text-black' : 'text-gray-600'
          }`}
        >
          <FontAwesomeIcon icon={faHome} className="text-2xl" />
          <span className="text-xs font-medium">Home</span>
        </button>

        <button
          onClick={() => navigate('/customer/wishlist')}
          className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-all active:bg-gray-200 ${
            activeTab === 'wishlist' ? 'text-black' : 'text-gray-600'
          }`}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
            />
          </svg>
          <span className="text-xs font-medium">Wishlist</span>
        </button>

        <button
          onClick={() => navigate('/categories')}
          className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-all active:bg-gray-200 ${
            activeTab === 'categories' ? 'text-black' : 'text-gray-600'
          }`}
        >
          <FontAwesomeIcon icon={faThLarge} className="text-2xl" />
          <span className="text-xs font-medium">Categories</span>
        </button>
      </div>
    </div>
  );
}

export default Footer;
