import React, { useState, useEffect, useCallback } from 'react';
import { useRestaurantAuth } from '../../contexts/RestaurantAuthContext';
import LoadingSpinner from './LoadingSpinner';
import ErrorBanner from './ErrorBanner';

/**
 * Restaurant tab for the Restaurant Partner Portal.
 * Displays restaurant info and a prominent Open/Closed toggle
 * reflecting `restaurant_available` state.
 *
 * Requirements: 6.1, 6.2, 4.4, 4.5
 */
function RestaurantTab() {
  const { authenticatedFetch } = useRestaurantAuth();

  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [toggleError, setToggleError] = useState('');
  const [toggling, setToggling] = useState(false);

  const fetchRestaurant = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const response = await authenticatedFetch('/api/restaurant-portal/restaurant');
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to load restaurant details');
      }
      setRestaurant(data.restaurant || data);
    } catch (err) {
      if (err.message !== 'Session expired' && err.message !== 'No active session') {
        setFetchError(err.message || 'Failed to load restaurant details');
      }
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch]);

  useEffect(() => {
    fetchRestaurant();
  }, [fetchRestaurant]);

  const handleToggleAvailability = useCallback(async () => {
    if (!restaurant || toggling) return;

    const previousValue = restaurant.restaurant_available;
    const newValue = !previousValue;

    // Optimistic update
    setRestaurant((prev) => ({ ...prev, restaurant_available: newValue }));
    setToggleError('');
    setToggling(true);

    try {
      const response = await authenticatedFetch('/api/restaurant-portal/restaurant/availability', {
        method: 'PUT',
        body: JSON.stringify({ available: newValue }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || data.error || 'Failed to update availability');
      }
    } catch (err) {
      // Revert on error
      setRestaurant((prev) => ({ ...prev, restaurant_available: previousValue }));
      if (err.message !== 'Session expired' && err.message !== 'No active session') {
        setToggleError(err.message || 'Failed to update restaurant availability. Please try again.');
      }
    } finally {
      setToggling(false);
    }
  }, [restaurant, toggling, authenticatedFetch]);

  if (loading) {
    return <LoadingSpinner message="Loading restaurant details..." />;
  }

  if (fetchError) {
    return <ErrorBanner message={fetchError} onRetry={fetchRestaurant} />;
  }

  if (!restaurant) {
    return <ErrorBanner message="Restaurant data not available." onRetry={fetchRestaurant} />;
  }

  const isOpen = restaurant.restaurant_available;

  return (
    <div className="px-4 py-6 max-w-md mx-auto">
      {/* Restaurant Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-3">{restaurant.name}</h2>
        <div className="space-y-2">
          {restaurant.cuisine && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-base" aria-hidden="true">🍽️</span>
              <span>{restaurant.cuisine}</span>
            </div>
          )}
          {restaurant.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-base" aria-hidden="true">📍</span>
              <span>{restaurant.location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Toggle Error */}
      {toggleError && (
        <ErrorBanner message={toggleError} onRetry={handleToggleAvailability} />
      )}

      {/* Open/Closed Toggle Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-base font-semibold text-gray-700 mb-4">Restaurant Status</h3>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${isOpen ? 'bg-green-500' : 'bg-red-500'}`}
              aria-hidden="true"
            />
            <span className={`text-lg font-bold ${isOpen ? 'text-green-600' : 'text-red-600'}`}>
              {isOpen ? 'Open' : 'Closed'}
            </span>
          </div>

          {/* Toggle Switch */}
          <button
            type="button"
            role="switch"
            aria-checked={isOpen}
            aria-label={`Restaurant is currently ${isOpen ? 'open' : 'closed'}. Toggle to ${isOpen ? 'close' : 'open'}.`}
            disabled={toggling}
            onClick={handleToggleAvailability}
            className={`
              relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
              transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
              ${isOpen ? 'bg-green-500' : 'bg-red-400'}
              ${toggling ? 'opacity-60 cursor-wait' : ''}
            `}
          >
            <span
              className={`
                pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0
                transition duration-200 ease-in-out
                ${isOpen ? 'translate-x-6' : 'translate-x-0'}
              `}
            />
          </button>
        </div>

        <p className="mt-3 text-sm text-gray-500">
          {isOpen
            ? 'Your restaurant is accepting new orders.'
            : 'Your restaurant is not accepting orders. Toggle to start receiving orders.'}
        </p>
      </div>
    </div>
  );
}

export default RestaurantTab;
