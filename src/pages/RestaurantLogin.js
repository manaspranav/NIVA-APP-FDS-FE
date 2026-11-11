import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRestaurantAuth } from '../contexts/RestaurantAuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function RestaurantLogin() {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);

  const { login, isAuthenticated } = useRestaurantAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/restaurant-portal/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Fetch active restaurants for dropdown
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await fetch(`${API_URL}/api/restaurant-portal/restaurants/active`);
        const data = await response.json();
        if (data.success && data.restaurants) {
          setRestaurants(data.restaurants);
        }
      } catch (err) {
        console.error('Failed to fetch restaurants:', err);
      }
    };
    fetchRestaurants();
  }, []);

  // Rate limit countdown timer
  useEffect(() => {
    if (rateLimitCountdown <= 0) return;

    const timer = setInterval(() => {
      setRateLimitCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [rateLimitCountdown]);

  const handleLogin = useCallback(async (e) => {
    e.preventDefault();

    if (rateLimitCountdown > 0) return;

    setLoading(true);
    setError('');

    try {
      await login(selectedRestaurant, phone, password);
      navigate('/restaurant-portal/dashboard');
    } catch (err) {
      if (err.status === 429) {
        const retryAfter = err.retryAfter || 60;
        setRateLimitCountdown(retryAfter);
        setError(`Too many login attempts. Please try again in ${retryAfter} seconds.`);
      } else if (err.status === 401) {
        setError('Invalid credentials. Please check your details and try again.');
      } else if (err.status === 403) {
        setError(err.message || 'Access denied.');
      } else {
        setError('Login failed. Please try again.');
      }
    }

    setLoading(false);
  }, [selectedRestaurant, phone, password, login, navigate, rateLimitCountdown]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-500 to-red-600 p-5">
      <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-3">Restaurant Partner</h2>
        <p className="text-center text-gray-600 mb-8">Access your restaurant dashboard</p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-5">
            {error}
            {rateLimitCountdown > 0 && (
              <p className="mt-1 font-semibold">
                Retry in: {rateLimitCountdown}s
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-5">
            <label className="block mb-2 text-gray-700 font-medium">Select Restaurant</label>
            <select
              value={selectedRestaurant}
              onChange={(e) => setSelectedRestaurant(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 text-base transition-colors bg-white"
            >
              <option value="">-- Select Restaurant --</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-5">
            <label className="block mb-2 text-gray-700 font-medium">Phone Number</label>
            <input
              type="tel"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              pattern="[0-9]{10}"
              maxLength="10"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 text-base transition-colors"
            />
          </div>

          <div className="mb-5">
            <label className="block mb-2 text-gray-700 font-medium">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 text-base transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || rateLimitCountdown > 0}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging in...
              </span>
            ) : (
              'Login'
            )}
          </button>
        </form>

        <div className="text-center mt-6 text-gray-600">
          <a href="/customer/login" className="text-orange-600 font-semibold hover:underline">Customer Login</a>
          {' | '}
          <a href="/dlv-q5n8t-auth" className="text-orange-600 font-semibold hover:underline">Partner Login</a>
        </div>
      </div>
    </div>
  );
}

export default RestaurantLogin;
