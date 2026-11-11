import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerSupabase as supabase } from '../customerSupabase';
import { ArrowLeft, Mail, Lock } from 'lucide-react';
import FloatingCart from '../components/FloatingCart';
import { getOrCreateCustomerProfile, isCustomerProfileComplete } from '../utils/customerProfile';

function CustomerLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already logged in as customer
    const checkExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        localStorage.setItem('userRole', 'customer');
        localStorage.setItem('userId', session.user.id);

        const profile = await getOrCreateCustomerProfile(session.user);
        if (!isCustomerProfileComplete(profile)) {
          navigate('/customer/update-profile', {
            replace: true,
            state: {
              notice: {
                variant: 'info',
                title: 'Complete your profile',
                message: 'Please continue the details to proceed.'
              }
            }
          });
          return;
        }

        navigate('/customer/dashboard', { replace: true });
      }
    };
    
    checkExistingSession();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      localStorage.setItem('userRole', 'customer');
      localStorage.setItem('userId', data.user.id);

      const profile = await getOrCreateCustomerProfile(data.user);
      if (!isCustomerProfileComplete(profile)) {
        navigate('/customer/update-profile', {
          state: {
            notice: {
              variant: 'info',
              title: 'Complete your profile',
              message: 'Please continue the details to proceed.'
            }
          }
        });
        return;
      }

      navigate('/customer/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      localStorage.setItem('userRole', 'customer');

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/customer/dashboard'
        }
      });

      if (error) throw error;
      console.log('Redirecting to Google for authentication...');
    } catch (err) {
      setError(err.message || 'Gmail login failed. Please try again.');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-black shadow-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/customer/edit-profile')}
            className="p-2 hover:bg-gray-800 rounded-xl transition-all active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </button>
          <h1 className="text-lg sm:text-xl font-bold text-white">Login</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Brand Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
            <span className="text-white font-bold text-3xl">N</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Welcome to NIVA</h2>
          <p className="text-sm text-gray-600 mt-1">Login to continue</p>
        </div>

        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}

          {/* Google Login - Recommended */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white border-2 border-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading ? 'Loading...' : 'Continue with Google'}
          </button>
          <p className="text-center text-sm text-gray-500 mt-2 mb-4">Use Google sign-in for the best experience</p>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">OR</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-black hover:bg-gray-800 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md mt-6"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/customer/register')}
                className="text-black hover:text-gray-800 font-semibold"
              >
                Sign Up
              </button>
            </p>
          </div>

        </div>
      </div>
      <FloatingCart />
    </div>
  );
}

export default CustomerLogin;
