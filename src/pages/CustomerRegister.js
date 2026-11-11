import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerSupabase as supabase } from '../customerSupabase';
import { ArrowLeft, Mail, Lock, User, Phone, MapPin } from 'lucide-react';
import FloatingCart from '../components/FloatingCart';

function CustomerRegister() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already logged in
    const checkExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        console.log('Existing session found, redirecting to dashboard...');
        navigate('/customer/dashboard');
      }
    };
    
    checkExistingSession();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      // Create customer record using server endpoint (bypasses RLS)
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/customers/upsert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: authData.user.id,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            college: formData.address
          })
        });
        
        const result = await response.json();
        if (!result.success) {
          console.error('Failed to create customer record:', result.message);
        } else {
          console.log('Customer record created successfully');
        }
      } catch (dbErr) {
        console.error('Error creating customer record:', dbErr);
      }

      alert('Registration successful! Please check your email for verification.');
      navigate('/customer/login');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/customer/dashboard'
        }
      });

      if (error) throw error;
      console.log('Redirecting to Google for registration...');
    } catch (err) {
      setError(err.message || 'Gmail signup failed. Please try again.');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-black via-gray-900 to-black shadow-smooth-lg sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/customer/edit-profile')}
            className="p-2.5 hover:bg-white/10 rounded-2xl transition-all duration-200 active:scale-95 group"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:text-gray-200 transition-colors" />
          </button>
          <h1 className="text-lg sm:text-xl font-heading font-bold text-white tracking-tight">Sign Up</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Brand Logo */}
        <div className="text-center mb-8 sm:mb-10 animate-fade-in">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-black via-gray-800 to-gray-900 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-smooth-lg transform hover:scale-105 transition-transform duration-300">
            <span className="text-white font-heading font-black text-3xl sm:text-4xl">N</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 mb-2">Join NIVA</h2>
          <p className="text-sm sm:text-base font-body text-gray-600">Create your account to get started</p>
        </div>

        <div className="bg-white rounded-3xl shadow-smooth-lg border border-gray-100 p-6 sm:p-8 animate-slide-up">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-800 px-4 py-3 rounded-xl mb-6 animate-fade-in">
              <p className="font-body text-sm">{error}</p>
            </div>
          )}

          {/* Google Signup - Recommended */}
          <button
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full bg-white border-2 border-gray-200 text-gray-800 py-3.5 rounded-2xl hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 font-subheading font-semibold transition-all duration-200 shadow-sm hover:shadow-smooth transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>{loading ? 'Loading...' : 'Sign up with Google'}</span>
          </button>
          <p className="text-center text-sm text-gray-500 mt-2 mb-4">Use Google sign-in for the best experience</p>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white font-body text-gray-500 font-medium">OR SIGN UP WITH EMAIL</span>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="transform transition-all duration-200 hover:translate-x-1">
              <label className="block text-sm font-subheading font-semibold text-gray-800 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-black transition-colors" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all duration-200 font-body text-gray-900 placeholder:text-gray-400 bg-gray-50 focus:bg-white"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>

            <div className="transform transition-all duration-200 hover:translate-x-1">
              <label className="block text-sm font-subheading font-semibold text-gray-800 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-black transition-colors" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all duration-200 font-body text-gray-900 placeholder:text-gray-400 bg-gray-50 focus:bg-white"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className="transform transition-all duration-200 hover:translate-x-1">
              <label className="block text-sm font-subheading font-semibold text-gray-800 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-black transition-colors" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all duration-200 font-body text-gray-900 placeholder:text-gray-400 bg-gray-50 focus:bg-white"
                  placeholder="10 digit phone number"
                  required
                  pattern="[0-9]{10}"
                  maxLength="10"
                />
              </div>
            </div>

            <div className="transform transition-all duration-200 hover:translate-x-1">
              <label className="block text-sm font-subheading font-semibold text-gray-800 mb-2">
                Delivery Address <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-black transition-colors" />
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all duration-200 font-body text-gray-900 placeholder:text-gray-400 bg-gray-50 focus:bg-white"
                  placeholder="Enter your delivery address"
                  required
                />
              </div>
            </div>

            <div className="transform transition-all duration-200 hover:translate-x-1">
              <label className="block text-sm font-subheading font-semibold text-gray-800 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-black transition-colors" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all duration-200 font-body text-gray-900 placeholder:text-gray-400 bg-gray-50 focus:bg-white"
                  placeholder="Min 6 characters"
                  required
                  minLength="6"
                />
              </div>
            </div>

            <div className="transform transition-all duration-200 hover:translate-x-1">
              <label className="block text-sm font-subheading font-semibold text-gray-800 mb-2">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-black transition-colors" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all duration-200 font-body text-gray-900 placeholder:text-gray-400 bg-gray-50 focus:bg-white"
                  placeholder="Confirm your password"
                  required
                  minLength="6"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-black via-gray-900 to-black hover:from-gray-900 hover:via-black hover:to-gray-900 text-white font-heading font-bold rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-smooth-lg hover:shadow-smooth-xl transform hover:scale-[1.02] active:scale-[0.98] mt-6"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Creating Account...
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="font-body text-gray-600 text-sm sm:text-base">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/customer/login')}
                className="text-black hover:text-gray-700 font-subheading font-bold transition-colors duration-200 underline decoration-2 underline-offset-4 decoration-gray-300 hover:decoration-black"
              >
                Log In
              </button>
            </p>
          </div>

        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center animate-fade-in">
          <p className="font-body text-xs text-gray-500 leading-relaxed px-4">
            By signing up, you agree to our{' '}
            <button type="button" className="text-black hover:underline font-medium transition-colors">Terms of Service</button>
            {' '}and{' '}
            <button type="button" className="text-black hover:underline font-medium transition-colors">Privacy Policy</button>
          </p>
        </div>
      </div>
      <FloatingCart />
    </div>
  );
}

export default CustomerRegister;
