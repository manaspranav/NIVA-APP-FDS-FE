import React, { useState, useEffect, useCallback } from 'react';
import { useRestaurantAuth } from '../../contexts/RestaurantAuthContext';
import LoadingSpinner from './LoadingSpinner';
import ErrorBanner from './ErrorBanner';

/**
 * Profile tab for the Restaurant Partner Portal.
 * Displays restaurant identity (name, cuisine, location, owner phone)
 * and a logout button. Never displays password or password hash.
 *
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5
 */
function ProfileTab() {
  const { authenticatedFetch, logout, isAuthenticated } = useRestaurantAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await authenticatedFetch('/api/restaurant-portal/profile');
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to load profile');
      }
      setProfile(data.restaurant || data);
    } catch (err) {
      if (err.message !== 'Session expired' && err.message !== 'No active session') {
        setError(err.message || 'Failed to load profile');
      }
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleLogout = useCallback(async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
    } catch (err) {
      // logout() handles cleanup and redirect regardless of backend response
      setLoggingOut(false);
    }
  }, [logout, loggingOut]);

  if (loading) {
    return <LoadingSpinner message="Loading profile..." />;
  }

  if (error) {
    return <ErrorBanner message={error} onRetry={fetchProfile} />;
  }

  if (!profile) {
    return <ErrorBanner message="Profile data not available." onRetry={fetchProfile} />;
  }

  return (
    <div className="px-4 py-6 max-w-md mx-auto">
      {/* Profile Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
            <span className="text-xl" aria-hidden="true">🏪</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">{profile.name}</h2>
            <p className="text-sm text-gray-500">Restaurant Owner</p>
          </div>
        </div>

        <div className="space-y-3 mt-4">
          {profile.cuisine && (
            <div className="flex items-center gap-3">
              <span className="text-base" aria-hidden="true">🍽️</span>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Cuisine</p>
                <p className="text-sm text-gray-700">{profile.cuisine}</p>
              </div>
            </div>
          )}

          {profile.location && (
            <div className="flex items-center gap-3">
              <span className="text-base" aria-hidden="true">📍</span>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Location</p>
                <p className="text-sm text-gray-700">{profile.location}</p>
              </div>
            </div>
          )}

          {profile.owner_phone && (
            <div className="flex items-center gap-3">
              <span className="text-base" aria-hidden="true">📞</span>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Phone</p>
                <p className="text-sm text-gray-700">{profile.owner_phone}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Logout Button — only rendered when session is active */}
      {isAuthenticated && (
        <div className="mt-6">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className={`
              w-full py-3 px-4 rounded-xl font-semibold text-base
              transition-colors duration-150 ease-in-out
              focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
              ${loggingOut
                ? 'bg-gray-200 text-gray-400 cursor-wait'
                : 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700'}
            `}
            aria-label="Log out of restaurant portal"
          >
            {loggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      )}
    </div>
  );
}

export default ProfileTab;
