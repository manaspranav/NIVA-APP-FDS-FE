import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { customerSupabase as supabase } from '../customerSupabase';
import { ArrowLeft } from 'lucide-react';

function UpdateProfile() {
  const [customerData, setCustomerData] = useState({
    name: '',
    email: '',
    phone: '',
    college: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [slideIn, setSlideIn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Trigger slide-in animation
    setSlideIn(true);
  }, []);

  useEffect(() => {
    const notice = location.state?.notice;
    if (notice?.message) {
      setMessage({
        type: notice.variant === 'error' ? 'error' : 'success',
        text: notice.title ? `${notice.title}: ${notice.message}` : notice.message
      });
    }
  }, [location.state]);

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        let user = session?.user;
        let userId = user?.id;

        if (!user) {
          const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
          if (!authError && authUser) {
            user = authUser;
            userId = authUser.id;
          }
        }

        if (!userId) {
          console.log('No valid authentication session found');
          navigate('/customer/login');
          return;
        }

        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

        try {
          const response = await fetch(`${API_URL}/api/customers/${userId}`);
          const result = await response.json();

          if (result.success && result.data) {
            setCustomerData({
              name: result.data.name || '',
              email: result.data.email || '',
              phone: result.data.phone || '',
              college: result.data.college || ''
            });
          }
        } catch (fetchError) {
          console.error('Error fetching customer data:', fetchError);
        }
      } catch (error) {
        console.error('Error fetching customer data:', error);
      }
    };

    fetchCustomerData();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Validate phone number - only allow digits and max 10 characters
    if (name === 'phone') {
      const phoneValue = value.replace(/\D/g, ''); // Remove non-digits
      if (phoneValue.length <= 10) {
        setCustomerData({
          ...customerData,
          [name]: phoneValue
        });
      }
    } else {
      setCustomerData({
        ...customerData,
        [name]: value
      });
    }
  };



  const saveField = async (field) => {
    // Validate phone number before saving
    if (field === 'phone' && customerData.phone && customerData.phone.length !== 10) {
      setMessage({ type: 'error', text: 'Phone number must be exactly 10 digits' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    setMessage({ type: '', text: '' });

    try {
      let userId = null;

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        userId = session.user.id;
      } else {
        userId = localStorage.getItem('userId');
      }

      if (!userId) {
        setMessage({ type: 'error', text: 'Session expired. Please login again.' });
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/customers/update/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: customerData.name,
          phone: customerData.phone,
          college: customerData.college
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to update profile');
      }

      // Dispatch custom event to notify other components about profile update
      window.dispatchEvent(new CustomEvent('profileUpdated', {
        detail: {
          name: customerData.name,
          college: customerData.college,
          phone: customerData.phone
        }
      }));

      setMessage({ type: 'success', text: `${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully!` });
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    }
  };

  const handleBlur = (field) => {
    saveField(field);
  };

  return (
    <div className={`min-h-screen bg-gray-50 transition-all duration-700 ${slideIn ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}>
      {/* Header */}
      <div className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/customer/edit-profile')}
            className="p-2 hover:bg-gray-100 rounded-xl transition-all active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
          </button>
          <h1 className="text-lg sm:text-xl font-bold text-gray-800">Update Profile</h1>
        </div>
      </div>

      {/* Update Profile Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        {message.text && (
          <div className={`p-4 rounded-2xl border shadow-sm ${message.type === 'success'
              ? 'bg-gray-900 text-white border-gray-800'
              : 'bg-red-50 text-red-700 border-red-200'
            }`}>
            {message.text}
          </div>
        )}

        {/* Full Name Field */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={customerData.name}
            onChange={handleChange}
            onBlur={() => handleBlur('name')}
            className="w-full px-4 py-3 border-2 border-gray-300 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all"
            placeholder="Enter your full name"
          />
        </div>

        {/* Phone Number Field */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Phone Number (10 digits)
          </label>
          <input
            type="tel"
            name="phone"
            value={customerData.phone}
            onChange={handleChange}
            onBlur={() => handleBlur('phone')}
            maxLength={10}
            className="w-full px-4 py-3 border-2 border-gray-300 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all"
            placeholder="Enter 10 digit phone number"
          />
          {customerData.phone && customerData.phone.length < 10 && (
            <p className="text-xs text-red-500 mt-2">{customerData.phone.length}/10 digits</p>
          )}
        </div>

        {/* University Field */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            University <span className="text-red-500">*</span>
          </label>
          <select
            name="college"
            value={customerData.college}
            onChange={async (e) => {
              handleChange(e);
              // Update the state first
              const newCollege = e.target.value;
              setCustomerData({ ...customerData, college: newCollege });
              // Then save after a short delay to ensure state is updated
              setTimeout(async () => {
                try {
                  let userId = null;
                  const { data: { session } } = await supabase.auth.getSession();
                  if (session?.user) {
                    userId = session.user.id;
                  } else {
                    userId = localStorage.getItem('userId');
                  }

                  if (userId) {
                    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/customers/update/${userId}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        name: customerData.name,
                        phone: customerData.phone,
                        college: newCollege
                      })
                    });

                    const result = await response.json();
                    if (result.success) {
                      setMessage({ type: 'success', text: 'University updated successfully!' });
                      // Dispatch event
                      window.dispatchEvent(new CustomEvent('profileUpdated', {
                        detail: {
                          name: customerData.name,
                          college: newCollege,
                          phone: customerData.phone
                        }
                      }));
                      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
                    }
                  }
                } catch (err) {
                  console.error('Auto-save failed:', err);
                }
              }, 300);
            }}
            className="w-full px-4 py-3 border-2 border-gray-300 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-black appearance-none cursor-pointer transition-all"
          >
            <option value="" disabled>Select Your University</option>
            <option value="SRM University">SRM University</option>
            <option value="VIT University" disabled>VIT University (Currently Unavailable)</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export default UpdateProfile;
