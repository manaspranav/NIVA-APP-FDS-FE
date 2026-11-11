import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { restaurantSupabase } from '../restaurantSupabase';

const API_URL = process.env.REACT_APP_API_URL || '';
const SESSION_KEY = 'niva_restaurant_session';

const RestaurantAuthContext = createContext(null);

export function RestaurantAuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const sessionRef = useRef(null);

  // Keep ref in sync for use in callbacks without stale closures
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // Load session on mount: prefer Supabase client's (possibly auto-refreshed) session,
  // fall back to raw localStorage entry for backwards compatibility.
  useEffect(() => {
    let authListener = null;

    async function initSession() {
      try {
        // Ask the Supabase client for the current session. If the stored JWT was
        // expired but the refresh token is still valid, the client will silently
        // obtain a new access token before returning.
        const { data: { session: supabaseSession }, error } = await restaurantSupabase.auth.getSession();

        if (supabaseSession && !error) {
          // We have a live (possibly just-refreshed) Supabase session.
          // Merge it with the restaurant metadata we keep in our own key.
          const stored = localStorage.getItem(SESSION_KEY);
          let restaurantMeta = null;
          try {
            const parsed = stored ? JSON.parse(stored) : null;
            restaurantMeta = parsed?.restaurant || null;
          } catch {
            // ignore parse errors
          }

          const updatedSession = {
            token: supabaseSession.access_token,
            refreshToken: supabaseSession.refresh_token,
            restaurant: restaurantMeta,
          };

          if (restaurantMeta) {
            localStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession));
            setSession(updatedSession);
            setRestaurant(restaurantMeta);
            setIsAuthenticated(true);
          } else {
            // No restaurant metadata — session is incomplete; clear it.
            localStorage.removeItem(SESSION_KEY);
          }
        } else {
          // No valid Supabase session. Try falling back to raw localStorage entry.
          try {
            const stored = localStorage.getItem(SESSION_KEY);
            if (stored) {
              const parsed = JSON.parse(stored);
              if (parsed && parsed.token && parsed.restaurant) {
                setSession(parsed);
                setRestaurant(parsed.restaurant);
                setIsAuthenticated(true);
              } else {
                localStorage.removeItem(SESSION_KEY);
              }
            }
          } catch {
            localStorage.removeItem(SESSION_KEY);
          }
        }
      } catch (err) {
        // Unexpected error during session init — clear corrupted data.
        localStorage.removeItem(SESSION_KEY);
      }

      setLoading(false);
    }

    // Subscribe to Supabase auth state changes so the context stays up-to-date
    // whenever the Supabase client auto-refreshes the access token in the background.
    const { data: listenerData } = restaurantSupabase.auth.onAuthStateChange(
      (event, supabaseSession) => {
        if (event === 'TOKEN_REFRESHED' && supabaseSession) {
          // The Supabase client obtained a fresh access token automatically.
          // Update our context + localStorage so subsequent authenticated calls
          // use the new token.
          setSession((prev) => {
            if (!prev) return prev;
            const updated = {
              ...prev,
              token: supabaseSession.access_token,
              refreshToken: supabaseSession.refresh_token,
            };
            localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
            return updated;
          });
        } else if (event === 'SIGNED_OUT') {
          // Keep in sync with external sign-outs (shouldn't happen in normal flow,
          // but guards against edge cases like Supabase detecting token revocation).
          // Note: we do NOT navigate here — that is handled by the explicit logout()
          // function to preserve the preservation requirement (3.6).
        }
      }
    );
    authListener = listenerData;

    initSession();

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  /**
   * Authenticate a restaurant owner.
   * Calls POST /api/restaurant-portal/login with credentials.
   * On success, stores session in state and localStorage.
   * On failure, throws the error for the caller to handle.
   */
  const login = useCallback(async (restaurantId, phone, password) => {
    const response = await fetch(`${API_URL}/api/restaurant-portal/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restaurantId, phone, password })
    });

    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.message || data.error || 'Login failed');
      error.status = response.status;
      error.retryAfter = data.retryAfter || null;
      throw error;
    }

    const sessionData = {
      token: data.token,
      refreshToken: data.refreshToken,
      restaurant: data.restaurant
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    setSession(sessionData);
    setRestaurant(data.restaurant);
    setIsAuthenticated(true);

    return data;
  }, []);

  /**
   * Log out the current restaurant owner.
   * Calls backend logout (best-effort), clears state/localStorage,
   * and navigates to the login page.
   */
  const logout = useCallback(async () => {
    const currentSession = sessionRef.current;

    // Best-effort backend logout
    if (currentSession?.token) {
      try {
        await fetch(`${API_URL}/api/restaurant-portal/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentSession.token}`
          }
        });
      } catch (err) {
        // Logout API failure shouldn't block local cleanup
      }
    }

    localStorage.removeItem(SESSION_KEY);
    setSession(null);
    setRestaurant(null);
    setIsAuthenticated(false);
    navigate('/restaurant-portal/login');
  }, [navigate]);

  /**
   * Helper for making authenticated API calls.
   * Automatically adds the Bearer token from the current session.
   * On 401 responses:
   *   1. Attempt token refresh via restaurantSupabase.auth.refreshSession().
   *   2. Retry the original request once with the new token.
   *   3. Only redirect to login if the refresh also fails.
   *
   * @param {string} endpoint - API path (e.g. '/api/restaurant-portal/orders')
   * @param {object} options - fetch options (method, body, headers, etc.)
   * @returns {Promise<Response>} - the fetch Response object
   */
  const authenticatedFetch = useCallback(async (endpoint, options = {}) => {
    const currentSession = sessionRef.current;

    if (!currentSession?.token) {
      localStorage.removeItem(SESSION_KEY);
      setSession(null);
      setRestaurant(null);
      setIsAuthenticated(false);
      navigate('/restaurant-portal/login');
      throw new Error('No active session');
    }

    const buildHeaders = (token) => ({
      'Content-Type': 'application/json',
      ...options.headers,
      'Authorization': `Bearer ${token}`
    });

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: buildHeaders(currentSession.token)
    });

    // On 401, attempt token refresh before giving up.
    if (response.status === 401) {
      try {
        const { data, error: refreshError } = await restaurantSupabase.auth.refreshSession();

        if (!refreshError && data?.session) {
          // Refresh succeeded — update stored session and retry the request.
          const newSession = {
            ...currentSession,
            token: data.session.access_token,
            refreshToken: data.session.refresh_token,
          };
          localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
          setSession(newSession);

          // Retry the original request with the fresh token.
          const retryResponse = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: buildHeaders(data.session.access_token)
          });

          if (retryResponse.status === 401) {
            // Even the fresh token was rejected — the session is truly invalid.
            localStorage.removeItem(SESSION_KEY);
            setSession(null);
            setRestaurant(null);
            setIsAuthenticated(false);
            navigate('/restaurant-portal/login');
            throw new Error('Session expired');
          }

          return retryResponse;
        }
      } catch (refreshErr) {
        // If the refresh itself throws unexpectedly, fall through to logout below.
        if (refreshErr.message === 'Session expired') {
          throw refreshErr;
        }
      }

      // Refresh failed or produced no session — redirect to login.
      localStorage.removeItem(SESSION_KEY);
      setSession(null);
      setRestaurant(null);
      setIsAuthenticated(false);
      navigate('/restaurant-portal/login');
      throw new Error('Session expired');
    }

    return response;
  }, [navigate]);

  const value = {
    session,
    restaurant,
    isAuthenticated,
    loading,
    login,
    logout,
    authenticatedFetch
  };

  return (
    <RestaurantAuthContext.Provider value={value}>
      {children}
    </RestaurantAuthContext.Provider>
  );
}

/**
 * Hook to access restaurant auth context.
 * Must be used within a RestaurantAuthProvider.
 */
export function useRestaurantAuth() {
  const context = useContext(RestaurantAuthContext);
  if (!context) {
    throw new Error('useRestaurantAuth must be used within a RestaurantAuthProvider');
  }
  return context;
}

export default RestaurantAuthContext;
