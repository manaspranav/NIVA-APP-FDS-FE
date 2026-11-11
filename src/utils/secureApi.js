/**
 * SECURITY: Secure API Call Utility
 * 
 * This utility ensures ALL API calls to protected endpoints include
 * the Supabase JWT authentication token in the Authorization header.
 * 
 * CRITICAL: Use this for ALL calls to protected backend endpoints.
 */

import { supabase } from '../supabaseClient';
import { customerSupabase } from '../customerSupabase';
import { partnerSupabase } from '../partnerSupabase';

/**
 * Get the correct Supabase client based on current role context.
 * Partner pages use partnerSupabase, customer pages use customerSupabase,
 * admin pages fall back to the default supabase client.
 */
const getSupabaseForCurrentRole = () => {
  const currentPath = window.location.pathname;
  if (currentPath.includes('dlv-') || currentPath.includes('partner')) {
    return partnerSupabase;
  }
  if (currentPath.includes('sys-') || currentPath.includes('admin')) {
    return supabase; // admin still uses the original shared client
  }
  return customerSupabase; // default to customer
};

/**
 * Make a secure API call with automatic Supabase JWT token inclusion
 * 
 * @param {string} url - The API endpoint URL
 * @param {object} options - Fetch options (method, body, headers, etc.)
 * @returns {Promise<Response>} - Fetch response
 * 
 * @throws {Error} - If not authenticated or session expired
 * 
 * @example
 * // GET request
 * const response = await secureApiCall('http://localhost:5000/api/admin/orders');
 * const data = await response.json();
 * 
 * @example
 * // POST request
 * const response = await secureApiCall('http://localhost:5000/api/partner/order/123/delivered', {
 *   method: 'PUT',
 *   body: JSON.stringify({ status: 'delivered' })
 * });
 */
export const secureApiCall = async (url, options = {}) => {
  try {
    // Get the correct Supabase client for the current role
    const sb = getSupabaseForCurrentRole();

    // Get current Supabase session
    const { data: { session }, error: sessionError } = await sb.auth.getSession();
    
    if (sessionError || !session) {
      console.error('No active session:', sessionError);
      // Redirect to appropriate login page
      handleAuthenticationFailure();
      throw new Error('Not authenticated. Please login.');
    }

    // Extract JWT access token
    const accessToken = session.access_token;

    if (!accessToken) {
      console.error('No access token in session');
      handleAuthenticationFailure();
      throw new Error('Invalid session. Please login again.');
    }

    // Prepare headers with Authorization
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      ...options.headers, // Allow override of other headers
    };

    // Make the API call
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle authentication errors
    if (response.status === 401) {
      console.error('401 Unauthorized - Session expired or invalid token');
      await sb.auth.signOut();
      handleAuthenticationFailure();
      throw new Error('Session expired. Please login again.');
    }

    // Handle authorization errors
    if (response.status === 403) {
      console.error('403 Forbidden - Insufficient permissions');
      throw new Error('Access denied. You do not have permission to perform this action.');
    }

    return response;
  } catch (error) {
    console.error('Secure API call failed:', error);
    throw error;
  }
};

/**
 * Handle authentication failure by redirecting to appropriate login page
 */
const handleAuthenticationFailure = () => {
  // Determine which login page to redirect to based on current path
  const currentPath = window.location.pathname;
  
  // Clear local storage
  localStorage.removeItem('userRole');
  localStorage.removeItem('adminPhone');
  localStorage.removeItem('userPhone');
  localStorage.removeItem('supabaseSession');

  // Redirect to appropriate login
  if (currentPath.includes('sys-') || currentPath.includes('admin')) {
    window.location.href = '/sys-x9k3m-auth'; // Admin login
  } else if (currentPath.includes('dlv-') || currentPath.includes('partner')) {
    window.location.href = '/dlv-p7q2k-auth'; // Partner login
  } else {
    window.location.href = '/customer-login'; // Customer login
  }
};

/**
 * Make a secure GET request
 * 
 * @param {string} url - The API endpoint URL
 * @returns {Promise<any>} - Parsed JSON response
 */
export const secureGet = async (url) => {
  const response = await secureApiCall(url, { method: 'GET' });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Request failed');
  }
  
  return response.json();
};

/**
 * Make a secure POST request
 * 
 * @param {string} url - The API endpoint URL
 * @param {object} data - Request body data
 * @returns {Promise<any>} - Parsed JSON response
 */
export const securePost = async (url, data) => {
  const response = await secureApiCall(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Request failed');
  }
  
  return response.json();
};

/**
 * Make a secure PUT request
 * 
 * @param {string} url - The API endpoint URL
 * @param {object} data - Request body data
 * @returns {Promise<any>} - Parsed JSON response
 */
export const securePut = async (url, data) => {
  const response = await secureApiCall(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Request failed');
  }
  
  return response.json();
};

/**
 * Make a secure DELETE request
 * 
 * @param {string} url - The API endpoint URL
 * @returns {Promise<any>} - Parsed JSON response
 */
export const secureDelete = async (url) => {
  const response = await secureApiCall(url, { method: 'DELETE' });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Request failed');
  }
  
  return response.json();
};

/**
 * Check if user is authenticated and has a valid session
 * 
 * @returns {Promise<boolean>} - True if authenticated, false otherwise
 */
export const isAuthenticated = async () => {
  try {
    const sb = getSupabaseForCurrentRole();
    const { data: { session } } = await sb.auth.getSession();
    return !!session;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

/**
 * Get current user role from Supabase session
 * 
 * @returns {Promise<string|null>} - User role or null if not authenticated
 */
export const getCurrentUserRole = async () => {
  try {
    const sb = getSupabaseForCurrentRole();
    const { data: { session } } = await sb.auth.getSession();
    
    if (!session || !session.user) {
      return null;
    }

    return session.user.user_metadata?.role || session.user.app_metadata?.role || null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
};

export default {
  secureApiCall,
  secureGet,
  securePost,
  securePut,
  secureDelete,
  isAuthenticated,
  getCurrentUserRole,
};
