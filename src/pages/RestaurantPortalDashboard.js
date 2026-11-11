import React, { useState } from 'react';
import { useRestaurantAuth } from '../contexts/RestaurantAuthContext';
import { Navigate } from 'react-router-dom';
import LoadingSpinner from '../components/restaurant-portal/LoadingSpinner';
import OrdersTab from '../components/restaurant-portal/OrdersTab';
import MenuTab from '../components/restaurant-portal/MenuTab';
import RestaurantTab from '../components/restaurant-portal/RestaurantTab';
import ProfileTab from '../components/restaurant-portal/ProfileTab';

const TABS = [
  {
    id: 'orders',
    label: 'Orders',
    icon: (active) => (
      <svg className={`w-6 h-6 ${active ? 'text-orange-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    id: 'menu',
    label: 'Menu',
    icon: (active) => (
      <svg className={`w-6 h-6 ${active ? 'text-orange-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    id: 'restaurant',
    label: 'Restaurant',
    icon: (active) => (
      <svg className={`w-6 h-6 ${active ? 'text-orange-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: (active) => (
      <svg className={`w-6 h-6 ${active ? 'text-orange-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

/**
 * Restaurant Partner Portal Dashboard with bottom navigation.
 * Mobile-first layout designed for viewports 320px–480px.
 * Auth guard redirects to login if not authenticated.
 */
function RestaurantPortalDashboard() {
  const { isAuthenticated, loading } = useRestaurantAuth();
  const [activeTab, setActiveTab] = useState('orders');

  // Auth guard: show spinner while checking session
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner message="Loading dashboard..." />
      </div>
    );
  }

  // Auth guard: redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/restaurant-portal/login" replace />;
  }

  // Render the active tab's component
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'orders':
        return <OrdersTab />;
      case 'menu':
        return <MenuTab />;
      case 'restaurant':
        return <RestaurantTab />;
      case 'profile':
        return <ProfileTab />;
      default:
        return <OrdersTab />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-[480px] mx-auto relative">
      {/* Content area — scrollable, padded at bottom for nav bar */}
      <main className="flex-1 overflow-y-auto pb-20">
        {renderActiveTab()}
      </main>

      {/* Bottom navigation bar — fixed at bottom */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 max-w-[480px] mx-auto z-50"
        aria-label="Dashboard navigation"
      >
        <div className="flex items-center justify-around h-16">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-inset ${
                  isActive ? 'text-orange-500' : 'text-gray-400'
                }`}
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
              >
                {tab.icon(isActive)}
                <span className={`text-xs mt-1 font-medium ${isActive ? 'text-orange-500' : 'text-gray-400'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default RestaurantPortalDashboard;
