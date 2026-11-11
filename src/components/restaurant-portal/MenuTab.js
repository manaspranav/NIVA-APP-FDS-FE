import React, { useState, useEffect, useCallback } from 'react';
import { useRestaurantAuth } from '../../contexts/RestaurantAuthContext';
import LoadingSpinner from './LoadingSpinner';
import ErrorBanner from './ErrorBanner';
import EmptyState from './EmptyState';

/**
 * MenuTab component for the Restaurant Partner Portal.
 * Displays menu items with stock toggles. No prices, no add/edit/delete controls.
 *
 * Validates: Requirements 5.1, 5.2, 5.3, 5.6, 5.7, 4.4, 4.5, 4.6
 */
function MenuTab() {
  const { authenticatedFetch } = useRestaurantAuth();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toggleError, setToggleError] = useState(null);

  const fetchMenu = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authenticatedFetch('/api/restaurant-portal/menu');
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || data.error || 'Failed to load menu');
      }
      const data = await response.json();
      const items = data.items || data.menu || data || [];
      setMenuItems(Array.isArray(items) ? items : []);
    } catch (err) {
      if (err.message !== 'Session expired' && err.message !== 'No active session') {
        setError(err.message || 'Failed to load menu');
      }
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  /**
   * Toggle stock availability for a menu item.
   * Uses optimistic UI update — reverts on error.
   */
  const handleToggleStock = async (itemId, currentInStock) => {
    const newInStock = !currentInStock;

    // Optimistic update
    setMenuItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, in_stock: newInStock } : item
      )
    );
    setToggleError(null);

    try {
      const response = await authenticatedFetch(`/api/restaurant-portal/menu/${itemId}/stock`, {
        method: 'PUT',
        body: JSON.stringify({ in_stock: newInStock }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || data.error || 'Failed to update stock');
      }
    } catch (err) {
      // Revert optimistic update
      setMenuItems(prev =>
        prev.map(item =>
          item.id === itemId ? { ...item, in_stock: currentInStock } : item
        )
      );

      if (err.message !== 'Session expired' && err.message !== 'No active session') {
        setToggleError(`Could not update availability. Please try again.`);
        // Auto-dismiss error after 4 seconds
        setTimeout(() => setToggleError(null), 4000);
      }
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading menu..." />;
  }

  if (error) {
    return <ErrorBanner message={error} onRetry={fetchMenu} />;
  }

  if (menuItems.length === 0) {
    return (
      <EmptyState
        title="No Menu Items"
        message="Your restaurant doesn't have any menu items yet. Contact your admin to add items."
      />
    );
  }

  return (
    <div className="px-4 py-4">
      {/* Toggle error toast */}
      {toggleError && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center gap-2 animate-fade-in">
          <svg className="h-4 w-4 text-red-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-red-700">{toggleError}</p>
        </div>
      )}

      {/* Menu items grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {menuItems.map(item => (
          <MenuItemCard
            key={item.id}
            item={item}
            onToggleStock={handleToggleStock}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Individual menu item card.
 * Displays image, name, category, veg/non-veg indicator, and availability toggle.
 * NO price, NO edit/delete/add controls.
 */
function MenuItemCard({ item, onToggleStock }) {
  const { id, name, category, image_url, is_veg, in_stock } = item;

  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-smooth p-3 flex gap-3 transition-opacity ${!in_stock ? 'opacity-75' : ''}`}>
      {/* Product image */}
      <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
        {image_url ? (
          <img
            src={image_url}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          className={`w-full h-full items-center justify-center ${image_url ? 'hidden' : 'flex'}`}
          aria-hidden="true"
        >
          <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>

      {/* Item details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          {/* Name and veg/non-veg indicator */}
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`w-3.5 h-3.5 flex-shrink-0 border rounded-sm flex items-center justify-center ${
                is_veg ? 'border-green-600' : 'border-red-600'
              }`}
              title={is_veg ? 'Vegetarian' : 'Non-vegetarian'}
              aria-label={is_veg ? 'Vegetarian' : 'Non-vegetarian'}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  is_veg ? 'bg-green-600' : 'bg-red-600'
                }`}
              ></span>
            </span>
            <h3 className="text-sm font-semibold text-gray-800 truncate">{name}</h3>
          </div>

          {/* Category badge */}
          {category && (
            <span className="inline-block text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
              {category}
            </span>
          )}
        </div>

        {/* Availability toggle */}
        <div className="flex items-center justify-between mt-2">
          <span className={`text-xs font-medium ${in_stock ? 'text-green-600' : 'text-red-500'}`}>
            {in_stock ? 'In Stock' : 'Out of Stock'}
          </span>
          <button
            role="switch"
            aria-checked={in_stock}
            aria-label={`Toggle availability for ${name}`}
            onClick={() => onToggleStock(id, in_stock)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 ${
              in_stock ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                in_stock ? 'translate-x-[18px]' : 'translate-x-[2px]'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

export default MenuTab;
