import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerSupabase as supabase } from '../customerSupabase';
import { User, ArrowLeft, Phone, Mail, ShoppingBag, Heart, LogOut, HelpCircle, FileText, Info, MapPin, Edit2 } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInstagram, faWhatsapp } from '@fortawesome/free-brands-svg-icons';

function EditProfile() {
  const [customerData, setCustomerData] = useState({
    name: '',
    email: '',
    phone: '',
    college: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [slideIn, setSlideIn] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Trigger slide-in animation
    setSlideIn(true);
  }, []);

  // Initialize auth state and listen for changes
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      // Wait for Supabase to restore session from storage
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (mounted) {
        if (session?.user) {
          localStorage.setItem('userId', session.user.id);
          localStorage.setItem('userRole', 'customer');
          setIsLoggedIn(true);
        } else {
          // Check if we have a userId in localStorage from previous session
          const storedUserId = localStorage.getItem('userId');
          if (storedUserId) {
            setIsLoggedIn(true);
          } else {
            setIsLoggedIn(false);
          }
        }
        setAuthInitialized(true);
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        if (session?.user) {
          localStorage.setItem('userId', session.user.id);
          localStorage.setItem('userRole', 'customer');
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authInitialized) return;

    const fetchCustomerData = async () => {
      try {
        // Get userId from localStorage
        let userId = localStorage.getItem('userId');
        let user = null;
        
        // Verify with current session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          user = session.user;
          userId = session.user.id;
          localStorage.setItem('userId', userId);
        } else if (userId) {
          // We have a stored userId, try to verify it's still valid
          const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
          if (!authError && authUser) {
            user = authUser;
            userId = authUser.id;
          } else {
            // Session expired, clear localStorage
            userId = null;
            localStorage.removeItem('userId');
            localStorage.removeItem('userRole');
          }
        }
        
        // If still no valid user session, set logged out state
        if (!userId) {
          setIsLoggedIn(false);
          return;
        }

        setIsLoggedIn(true);
        
        // Sync localStorage
        localStorage.setItem('userId', userId);
        localStorage.setItem('userRole', 'customer');

        // Fetch customer data using server API endpoint (bypasses RLS)
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        
        try {
          const response = await fetch(`${API_URL}/api/customers/${userId}`);
          
          // Check if response is OK before parsing
          if (!response.ok) {
            // Check if response is HTML (error page)
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('text/html')) {
              throw new Error('API server returned an error page. Please check your connection.');
            }
            throw new Error(`API request failed with status ${response.status}`);
          }
          
          // Safely parse JSON
          let result;
          try {
            result = await response.json();
          } catch (parseError) {
            throw new Error('Invalid response from server');
          }
          
          if (!result.success || !result.data) {
          // No customer record found, creating one
          
          // Try to get email from user object or localStorage
          let email = user?.email;
          let name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
          
          if (!email && userId) {
            // Fetch email from auth if available
            try {
              const { data: { user: authUser } } = await supabase.auth.getUser();
              if (authUser?.email) {
                email = authUser.email;
                name = authUser.user_metadata?.full_name || authUser.email.split('@')[0];
              }
            } catch (e) {
              // Could not fetch auth user
            }
          }
          
          if (!email) {
            setMessage({ type: 'error', text: 'Could not determine email. Please login again.' });
            return;
          }
          
          try {
            const response = await fetch(`${API_URL}/api/customers/upsert`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: userId,
                name: name,
                email: email,
                phone: '',
                college: ''
              })
            });
            
            // Check response before parsing
            if (!response.ok) {
              const contentType = response.headers.get('content-type');
              if (contentType && contentType.includes('text/html')) {
                throw new Error('API server error. Please check your connection.');
              }
              throw new Error(`Request failed with status ${response.status}`);
            }
            
            let result;
            try {
              result = await response.json();
            } catch (parseError) {
              throw new Error('Invalid response from server');
            }
            
            if (!result.success) {
              throw new Error(result.message || 'Failed to create customer record');
            }
            
            setCustomerData({
              name: result.data.name || '',
              email: result.data.email || '',
              phone: result.data.phone || '',
              college: result.data.college || ''
            });
          } catch (insertError) {
            setMessage({ type: 'error', text: insertError.message || 'Failed to create profile. Please try again.' });
          }
          return;
        }
        
        // Customer record exists, populate form
        setCustomerData({
          name: result.data.name || '',
          email: result.data.email || '',
          phone: result.data.phone || '',
          college: result.data.college || ''
        });
        
        } catch (fetchError) {
          setMessage({ type: 'error', text: 'Failed to load profile data. Please try again.' });
        }
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to load profile data' });
      }
    };

    fetchCustomerData();

    // Listen for profile updates and refetch
    const handleProfileUpdate = () => {
      fetchCustomerData();
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    
    // Also refetch when window gains focus (user comes back to the page)
    window.addEventListener('focus', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      window.removeEventListener('focus', handleProfileUpdate);
    };
  }, [authInitialized, navigate]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('userId');
      localStorage.removeItem('userRole');
      setIsLoggedIn(false);
      setCustomerData({
        name: '',
        email: '',
        phone: '',
        college: ''
      });
      setMessage({ type: '', text: '' });
    } catch (error) {
      // Logout error handled silently
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 transition-all duration-700 ${
      slideIn ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      {/* Header - Sticky */}
      <div className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/customer/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-xl transition-all active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
          </button>
          <h1 className="text-lg sm:text-xl font-bold text-gray-800">My Account</h1>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        
        {/* User Info Card */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
          {isLoggedIn ? (
            <div className="relative">
              {/* Edit Pencil Icon */}
              <button
                onClick={() => navigate('/customer/update-profile')}
                className="absolute top-0 right-0 p-2 hover:bg-gray-100 rounded-full transition-all active:scale-95"
              >
                <Edit2 className="w-4 h-4 text-gray-600" />
              </button>
              
              <div className="flex items-start gap-4">
                {/* Black User Icon */}
                <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-8 h-8 text-white" strokeWidth={2} />
                </div>
                
                {/* User Details */}
                <div className="flex-1 min-w-0 space-y-3 overflow-hidden">
                  {/* Name */}
                  <h2 className="text-2xl font-bold text-gray-800 truncate">{customerData.name || 'User Name'}</h2>
                  
                  {/* Phone */}
                  <div className="flex items-center gap-2 text-gray-600 min-w-0">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm truncate">{customerData.phone || 'Add phone number'}</span>
                  </div>
                  
                  {/* Email */}
                  <div className="flex items-center gap-2 text-gray-600 min-w-0">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm truncate">{customerData.email || 'email@example.com'}</span>
                  </div>
                  
                  {/* Location/University */}
                  <div className="flex items-center gap-2 text-gray-600 min-w-0">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm truncate">{customerData.college || 'Select your university'}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              {/* Black User Icon */}
              <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-white" strokeWidth={2} />
              </div>
              
              <h2 className="text-xl font-bold text-gray-800 mb-2">Welcome to NIVA</h2>
              <p className="text-gray-600 mb-6">Login or signup to continue</p>
              
              {message.text && (
                <div className={`mb-4 p-3 rounded-lg ${
                  message.type === 'info' 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {message.text}
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/customer/login')}
                  className="flex-1 px-6 py-3 bg-black hover:bg-gray-800 text-white font-semibold rounded-xl transition-all active:scale-95 shadow-md">
                
                  Login
                </button>
                <button
                  onClick={() => navigate('/customer/register')}
                  className="flex-1 px-6 py-3 bg-white hover:bg-gray-50 text-black font-semibold rounded-xl transition-all active:scale-95 border-2 border-black">
                
                  Sign Up
                </button>
              </div>
            </div>
          )}
        </div>

        {/* YOUR INFORMATION Section */}
        {isLoggedIn && (
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Your Information</h3>
          </div>
          
          <button 
            onClick={() => navigate('/customer/orders')}
            className="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-all active:bg-gray-100 border-b border-gray-100"
          >
            <ShoppingBag className="w-5 h-5 text-gray-700" />
            <span className="text-gray-800 font-medium">Your Orders</span>
            <svg className="w-5 h-5 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          <button 
            onClick={() => navigate('/customer/wishlist')}
            className="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-all active:bg-gray-100"
          >
            <Heart className="w-5 h-5 text-gray-700" />
            <span className="text-gray-800 font-medium">Your Wishlist</span>
            <svg className="w-5 h-5 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        )}

        {/* OTHER INFORMATION Section */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Other Information</h3>
          </div>
          
          <button 
            onClick={() => navigate('/faqs')}
            className="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-all active:bg-gray-100 border-b border-gray-100"
          >
            <HelpCircle className="w-5 h-5 text-gray-700" />
            <span className="text-gray-800 font-medium">FAQs</span>
            <svg className="w-5 h-5 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          <button 
            onClick={() => navigate('/terms-and-conditions')}
            className="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-all active:bg-gray-100 border-b border-gray-100"
          >
            <FileText className="w-5 h-5 text-gray-700" />
            <span className="text-gray-800 font-medium">Terms & Conditions</span>
            <svg className="w-5 h-5 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          <button 
            onClick={() => navigate('/about-us')}
            className="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-all active:bg-gray-100 border-b border-gray-100"
          >
            <Info className="w-5 h-5 text-gray-700" />
            <span className="text-gray-800 font-medium">About Us</span>
            <svg className="w-5 h-5 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          <button 
            onClick={() => navigate('/help-and-support')}
            className="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-all active:bg-gray-100"
          >
            <HelpCircle className="w-5 h-5 text-gray-700" />
            <span className="text-gray-800 font-medium">Help & Support</span>
            <svg className="w-5 h-5 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Logout Button */}
        {isLoggedIn && (
        <div className="flex justify-center py-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-8 py-3 text-black hover:text-gray-700 font-semibold transition-all active:scale-95">
          
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
        )}

        {/* Social Media Links */}
        <div className="flex justify-center gap-4 py-4">
          <a 
            href="mailto:niva2026.in@gmail.com"
            className="w-12 h-12 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-all active:scale-95 shadow-md"
          >
            <Mail className="w-5 h-5" />
          </a>
          <a 
            href="https://instagram.com/_niva_2026"
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 hover:opacity-90 rounded-full flex items-center justify-center text-white transition-all active:scale-95 shadow-md"
          >
            <FontAwesomeIcon icon={faInstagram} className="text-xl" />
          </a>
          <a 
            href="https://whatsapp.com/channel/0029VbCQhdxId7nKq0tZEf3v"
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white transition-all active:scale-95 shadow-md"
          >
            <FontAwesomeIcon icon={faWhatsapp} className="text-xl" />
          </a>
        </div>

        {/* Brand Logo */}
        <div className="flex justify-center py-6">
          <div className="text-center">
            <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
              <span className="text-white font-bold text-3xl">N</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">NIVA</h2>
            <p className="text-sm text-gray-500 mt-1">Fresh & Healthy</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditProfile;
