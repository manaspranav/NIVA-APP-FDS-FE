import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { partnerSupabase as supabase } from '../partnerSupabase';

/**
 * SECURITY: Partner Login - Supabase Authentication
 * NO HARD-CODED CREDENTIALS
 * All authentication handled by Supabase
 */
function PartnerLogin() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Convert phone to email format for Supabase (e.g., 9299950587@partner.com)
      const email = `${phone}@partner.com`;

      // Authenticate with Supabase
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (signInError) {
        console.error('Login error:', signInError);
        setError('Invalid credentials. Please check your phone number and password.');
        setLoading(false);
        return;
      }

      // Verify user role is partner
      const userRole = data.user?.user_metadata?.role || data.user?.app_metadata?.role;
      
      if (userRole !== 'partner') {
        await supabase.auth.signOut();
        setError('Access denied. Partner credentials required.');
        setLoading(false);
        return;
      }

      // Get partner details from user metadata
      const userName = data.user?.user_metadata?.name || 'Delivery Partner';
      const userPhone = data.user?.user_metadata?.phone || phone;
      const userId = data.user?.id;

      // Successful login - store session
      localStorage.setItem('userRole', 'partner');
      localStorage.setItem('userPhone', userPhone);
      localStorage.setItem('userName', userName);
      localStorage.setItem('userId', userId);
      localStorage.setItem('supabaseSession', JSON.stringify(data.session));
      
      navigate('/dlv-w2r6e-panel');
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Login failed. Please try again.');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-700 p-5">
      <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-3">Delivery Partner Login</h2>
        <p className="text-center text-gray-600 mb-8">Access your delivery dashboard</p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
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
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-600 text-base transition-colors"
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
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-600 text-base transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-700 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="text-center mt-6 text-gray-600">
          <a href="/customer/login" className="text-purple-600 font-semibold hover:underline">Customer Login</a>
          {' | '}
          <a href="/sys-x9k3m-auth" className="text-purple-600 font-semibold hover:underline">Admin Login</a>
        </div>
      </div>
    </div>
  );
}

export default PartnerLogin;
