import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { partnerSupabase as supabase } from '../partnerSupabase';
import { calculatePartnerEarning } from '../utils/roomDeliveryUtils';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// SECURITY: Helper function to get auth headers with JWT token
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    };
  }
  return { headers: { 'Content-Type': 'application/json' } };
};

// Helper function to parse items if they're stored as JSON string
const parseItems = (items) => {
  if (!items) return [];
  if (Array.isArray(items)) return items;
  if (typeof items === 'string') {
    try {
      return JSON.parse(items);
    } catch (error) {
      return [];
    }
  }
  return [];
};

// Round up to nearest 10 for display in partner dashboard
const roundUpToTen = (amount) => {
  const num = parseFloat(amount);
  if (isNaN(num)) return 0;
  return Math.ceil(num / 10) * 10;
};

// Vendor prices (partner-only, never shown to customers)
const VENDOR_PRICES = {
  'Veg Fried Rice': 59,
  'Veg Noodles': 59,
  'Veg Manchurian Fried Rice': 69,
  'Veg Manchurian': 59,
  'Egg Fried Rice': 69,
  'Egg Noodles': 69,
  'Chicken Fried Rice': 79,
  'Chicken Noodles': 79,
  'Chicken Manchurian': 99,
  'Dum Biryani': 120,
  'Fry Biryani': 130,
  'Veg Manchurian Noodles': 69,
  'Chilli Chicken': 99,
  'Biryani Combo': 130,
  'Chicken Fried Rice + Thums Up Combo': 79,
  'Chicken Haleem': 199
};

function PartnerDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [partnerInfo, setPartnerInfo] = useState(null);
  const [todayDate, setTodayDate] = useState('');
  const [isSunday, setIsSunday] = useState(false);
  // Partner Profile State (hidePrices, slotControl, room delivery, stock toggles)
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [slotUpdating, setSlotUpdating] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  // Settlement state
  const [settlements, setSettlements] = useState([]);
  const [activeSection, setActiveSection] = useState('orders'); // 'orders', 'settlement'
  const ordersRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();

    // Listen for auth state changes to maintain session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setAuthenticated(false);
        navigate('/dlv-q5n8t-auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Auto-refresh orders every 20 seconds
  useEffect(() => {
    if (!authenticated) return;

    const interval = setInterval(() => {
      fetchOrders();
      setLastRefresh(new Date());
    }, 10000);

    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchOrders();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [authenticated]);

  const checkAuth = async () => {
    try {
      // Check Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('No session found, redirecting to login');
        navigate('/dlv-q5n8t-auth');
        return;
      }

      // Verify user role is partner
      const userRole = session.user?.user_metadata?.role || session.user?.app_metadata?.role;
      
      if (userRole !== 'partner') {
        console.log('User role is not partner:', userRole);
        await supabase.auth.signOut();
        navigate('/dlv-q5n8t-auth');
        return;
      }

      // Get partner info from session
      const partnerPhone = session.user?.user_metadata?.phone || localStorage.getItem('userPhone');
      const partnerName = session.user?.user_metadata?.name || localStorage.getItem('userName');
      const partnerId = session.user?.id || localStorage.getItem('userId');

      setPartnerInfo({ id: partnerId, name: partnerName, phone: partnerPhone });
      setAuthenticated(true);
      setAuthLoading(false);
      
      // Fetch data
      fetchOrders();
      fetchPartnerProfile(partnerPhone);
      fetchSettlement();
    } catch (error) {
      console.error('Auth check error:', error);
      navigate('/dlv-q5n8t-auth');
    }
  };

  // Fetch partner profile (hidePrices, slot control)
  const fetchPartnerProfile = async (phone) => {
    try {
      const authHeaders = await getAuthHeaders();
      const response = await axios.get(`${API_URL}/api/partner/profile?phone=${phone}`, authHeaders);
      if (response.data.success) {
        setPartnerProfile(response.data.partner);
      }
    } catch (error) {
      console.error('Error fetching partner profile:', error);
    }
  };

  // Toggle slot availability, room delivery, or stock
  const handleSlotToggle = async (toggleType) => {
    if (slotUpdating) return;
    setSlotUpdating(true);

    try {
      const authHeaders = await getAuthHeaders();
      const phone = partnerInfo?.phone;
      const updateData = { phone };

      if (toggleType === 'lunch') {
        updateData.lunchSlotActive = !(partnerProfile?.lunch_slot_active !== false);
      } else if (toggleType === 'evening') {
        updateData.eveningSlotActive = !(partnerProfile?.evening_slot_active !== false);
      } else if (toggleType === 'lunchRoom') {
        updateData.lunchRoomDeliveryActive = !(partnerProfile?.lunch_room_delivery_active !== false);
      } else if (toggleType === 'eveningRoom') {
        updateData.eveningRoomDeliveryActive = !(partnerProfile?.evening_room_delivery_active !== false);
      } else if (toggleType === 'fastFoods') {
        updateData.fastFoodsActive = !(partnerProfile?.fast_foods_active !== false);
      } else if (toggleType === 'biryani') {
        updateData.biryaniActive = !(partnerProfile?.biryani_active !== false);
      }

      const response = await axios.put(`${API_URL}/api/partner/slot-control`, updateData, authHeaders);

      if (response.data.success) {
        setPartnerProfile(prev => ({
          ...prev,
          ...response.data.partner
        }));
      }
    } catch (error) {
      alert('Failed to update. Please try again.');
      console.error('Error toggling:', error);
    } finally {
      setSlotUpdating(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const authHeaders = await getAuthHeaders();
      const response = await axios.get(`${API_URL}/api/partner/orders`, authHeaders);
      const fetchedOrders = response.data.orders || [];
      // Normalize items to always be an array
      const normalized = fetchedOrders.map(order => ({
        ...order,
        items: parseItems(order.items)
      }));
      setOrders(normalized);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (error.response?.status === 401) {
        navigate('/dlv-q5n8t-auth');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch settlement data
  const fetchSettlement = async () => {
    try {
      const authHeaders = await getAuthHeaders();
      const response = await axios.get(`${API_URL}/api/partner/settlement`, authHeaders);
      if (response.data.success) {
        setSettlements(response.data.settlements || []);
      }
    } catch (error) {
      console.error('Error fetching settlement:', error);
    }
  };

  const handleTakeOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to take this order?')) return;
    
    setUpdatingId(orderId);
    try {
      const authHeaders = await getAuthHeaders();
      const response = await axios.put(
        `${API_URL}/api/partner/order/${orderId}/take`,
        { 
          partnerId: partnerInfo.id,
          partnerName: partnerInfo.name,
          partnerPhone: partnerInfo.phone
        },
        authHeaders
      );

      if (response.data.success) {
        fetchOrders();
        alert('Order taken successfully! Customer and admin have been notified.');
      }
    } catch (error) {
      alert('Failed to take order. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleOutForDelivery = async (orderId) => {
    if (!window.confirm('Mark this order as out for delivery?')) return;
    
    setUpdatingId(orderId);
    try {
      const authHeaders = await getAuthHeaders();
      const response = await axios.put(
        `${API_URL}/api/partner/order/${orderId}/out-for-delivery`,
        {},
        authHeaders
      );

      if (response.data.success) {
        fetchOrders();
        alert('Order marked as out for delivery! Customer and admin have been notified.');
      }
    } catch (error) {
      alert('Failed to update order status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelivered = async (orderId) => {
    if (!window.confirm('Confirm that this order has been delivered?')) return;
    
    setUpdatingId(orderId);
    try {
      const authHeaders = await getAuthHeaders();
      const response = await axios.put(
        `${API_URL}/api/partner/order/${orderId}/delivered`,
        {},
        authHeaders
      );

      if (response.data.success) {
        fetchOrders();
        alert('Order marked as delivered! Customer and admin have been notified.');
      }
    } catch (error) {
      alert('Failed to mark order as delivered.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userPhone');
    localStorage.removeItem('supabaseSession');
    navigate('/dlv-q5n8t-auth');
  };

  // Manual refresh
  const handleManualRefresh = () => {
    fetchOrders();
    fetchSettlement();
  };

  // Click a status card → activate the tab and scroll to orders
  const handleCardClick = (tab) => {
    setActiveTab(tab);
    setTimeout(() => {
      ordersRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const getFilteredOrders = () => {
    switch (activeTab) {
      case 'all':
        return orders.filter(o => o.status === 'placed' || o.status === 'taken');
      case 'taken':
        return orders.filter(o => o.status === 'taken');
      case 'out_for_delivery':
        return orders.filter(o => o.status === 'out_for_delivery');
      case 'delivered':
        return orders.filter(o => o.status === 'delivered');
      default:
        return orders;
    }
  };

  // Reusable toggle row renderer
  const renderToggleRow = (toggleType, label, sublabel, isActive, isIndented = false) => (
    <div className={`flex items-center justify-between p-3 sm:p-4 rounded-xl border-2 transition-all ${
      isActive ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
    } ${isIndented ? 'ml-4 sm:ml-6' : ''}`}>
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <div>
          <p className="font-semibold text-gray-800 text-sm sm:text-base">{label}</p>
          <p className="text-xs text-gray-500">{sublabel}</p>
        </div>
      </div>
      <button
        onClick={() => handleSlotToggle(toggleType)}
        disabled={slotUpdating}
        className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
          isActive ? 'bg-green-500' : 'bg-gray-300'
        }`}
      >
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
          isActive ? 'translate-x-8' : 'translate-x-1'
        }`} />
      </button>
    </div>
  );

  // Calculate vendor settlement for an order
  const getOrderSettlement = (order) => {
    const items = parseItems(order.items);
    const totalQty = items.reduce((sum, item) => sum + (parseInt(item.quantity) || 1), 0);
    let vendorEarnings = 0;
    const itemDetails = items.map(item => {
      const vendorPrice = VENDOR_PRICES[item.name] || 0;
      const qty = parseInt(item.quantity) || 1;
      vendorEarnings += vendorPrice * qty;
      return { name: item.name, quantity: qty, vendorPrice };
    });
    let roomDeliveryPayment = 0;
    if (order.delivery_type === 'room') {
      roomDeliveryPayment = calculatePartnerEarning(order.number_of_packets || totalQty);
    }
    
    // Add additional fields for COD orders breakdown
    const isCOD = order.payment_method === 'cod' || (order.delivery_type === 'room' && parseFloat(order.food_amount) > 0);
    const totalCollected = isCOD ? (parseFloat(order.total_amount) || 0) : 0;
    const vendorPayable = vendorEarnings || 0;
    const partnerEarnings = roomDeliveryPayment || 0;
    
    // Fallbacks if not stored in DB (for older orders)
    const codTax = isCOD ? Number((parseFloat(order.cod_tax) || (parseFloat(order.food_amount || 0) * 0.02)).toFixed(2)) : 0;
    const baseDeliveryCharge = parseFloat(order.room_delivery_charge) || 0;
    const penaltyFee = parseFloat(order.penalty_fee) || 0;
    
    // Website maintenance is total collected minus vendor amount minus partner amount minus COD tax
    let websiteMaintenance = parseFloat(order.maintenance_amount) || 0;
    if (order.delivery_type === 'room') {
       websiteMaintenance = baseDeliveryCharge - partnerEarnings;
    } else if (!websiteMaintenance && isCOD) {
       websiteMaintenance = totalCollected - vendorPayable - partnerEarnings - codTax;
    }
    websiteMaintenance = Number(websiteMaintenance.toFixed(2));

    return { 
      vendorEarnings: Number(vendorEarnings.toFixed(2)), 
      roomDeliveryPayment: Number(roomDeliveryPayment.toFixed(2)), 
      totalSettlement: Number((vendorEarnings + roomDeliveryPayment).toFixed(2)), 
      itemDetails,
      isCOD,
      totalCollected: Number(totalCollected.toFixed(2)),
      vendorPayable: Number(vendorPayable.toFixed(2)),
      partnerEarnings: Number(partnerEarnings.toFixed(2)),
      codTax: Number(codTax.toFixed(2)),
      websiteMaintenance: Number(websiteMaintenance.toFixed(2)),
      penaltyFee: Number(penaltyFee.toFixed(2)),
      orderId: order.order_id || order.id,
      timestamp: order.updated_at || order.order_date || order.created_at,
      paymentStatus: isCOD ? 'To Collect / Collected' : 'Paid Online'
    };
  };

  // Get today's settlement summary
  const getTodaySettlement = () => {
    const today = new Date().toISOString().split('T')[0];
    return settlements.find(s => s.date === today) || { vendorTotal: 0, deliveryTotal: 0, websiteMaintenanceTotal: 0, codFeeTotal: 0, codFoodAmountTotal: 0, totalOrders: 0 };
  };

  const getStatusBadge = (status) => {
    const badges = {
      placed: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300', label: 'New Order' },
      taken: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', label: 'Taken' },
      out_for_delivery: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300', label: 'Out for Delivery' },
      delivered: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', label: 'Delivered' }
    };
    const badge = badges[status] || badges.placed;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold border-2 ${badge.bg} ${badge.text} ${badge.border}`}>
        {badge.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredOrders = getFilteredOrders();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-700 font-semibold">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-700 font-semibold">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">Partner Dashboard</h1>
              <p className="text-xs sm:text-sm text-gray-500 truncate">{partnerInfo?.name || 'Partner'}</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Refresh Button */}
              <button
                onClick={handleManualRefresh}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh orders"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
          {lastRefresh && (
            <p className="text-[10px] sm:text-xs text-gray-400 mt-1">
              Last updated: {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8 space-y-4 sm:space-y-8">
        {/* Stats Dashboard — 2-col mobile, 4-col desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <button
            onClick={() => handleCardClick('all')}
            className={`bg-white rounded-xl border-2 p-4 sm:p-5 text-left transition-all active:scale-95 ${
              activeTab === 'all' ? 'border-amber-500 shadow-md' : 'border-gray-200 hover:border-gray-300 shadow-sm'
            }`}
          >
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Active Orders</p>
            <p className="text-3xl sm:text-4xl font-bold text-gray-900">{orders.filter(o => o.status === 'placed' || o.status === 'taken').length}</p>
          </button>

          <button
            onClick={() => handleCardClick('taken')}
            className={`bg-white rounded-xl border-2 p-4 sm:p-5 text-left transition-all active:scale-95 ${
              activeTab === 'taken' ? 'border-blue-500 shadow-md' : 'border-gray-200 hover:border-gray-300 shadow-sm'
            }`}
          >
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Taken</p>
            <p className="text-3xl sm:text-4xl font-bold text-gray-900">{orders.filter(o => o.status === 'taken').length}</p>
          </button>

          <button
            onClick={() => handleCardClick('out_for_delivery')}
            className={`bg-white rounded-xl border-2 p-4 sm:p-5 text-left transition-all active:scale-95 ${
              activeTab === 'out_for_delivery' ? 'border-purple-500 shadow-md' : 'border-gray-200 hover:border-gray-300 shadow-sm'
            }`}
          >
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Out for Delivery</p>
            <p className="text-3xl sm:text-4xl font-bold text-gray-900">{orders.filter(o => o.status === 'out_for_delivery').length}</p>
          </button>

          <button
            onClick={() => handleCardClick('delivered')}
            className={`bg-white rounded-xl border-2 p-4 sm:p-5 text-left transition-all active:scale-95 ${
              activeTab === 'delivered' ? 'border-green-500 shadow-md' : 'border-gray-200 hover:border-gray-300 shadow-sm'
            }`}
          >
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Delivered</p>
            <p className="text-3xl sm:text-4xl font-bold text-gray-900">{orders.filter(o => o.status === 'delivered').length}</p>
          </button>
        </div>

        {/* Slot Availability Control Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="bg-gray-100 rounded-lg p-2">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900">Slot & Delivery Control</h2>
              <p className="text-xs text-gray-500">Toggle slots, room delivery, and stock for customers</p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Lunch Slot */}
            {renderToggleRow('lunch', '12:00 PM – 2:00 PM', 'Lunch Slot', partnerProfile?.lunch_slot_active !== false)}
            {/* Lunch Room Delivery */}
            {renderToggleRow('lunchRoom', '12:00 PM – 2:00 PM', 'Room Delivery', partnerProfile?.lunch_room_delivery_active !== false, true)}
            {/* Evening Slot */}
            {renderToggleRow('evening', '6:30 PM – 9:00 PM', 'Evening Slot', partnerProfile?.evening_slot_active !== false)}
            {/* Evening Room Delivery */}
            {renderToggleRow('eveningRoom', '6:30 PM – 9:00 PM', 'Room Delivery', partnerProfile?.evening_room_delivery_active !== false, true)}
          </div>

          {/* Stock Availability Toggles */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Stock Availability</h3>
            <div className="space-y-3">
              {renderToggleRow('fastFoods', 'Fast Foods', 'Fried Rice, Noodles, Starters', partnerProfile?.fast_foods_active !== false)}
              {renderToggleRow('biryani', 'Biryani', 'Dum Biryani, Fry Biryani, Combos', partnerProfile?.biryani_active !== false)}
            </div>
          </div>

          {slotUpdating && (
            <div className="mt-3 text-sm text-gray-500 flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Updating...
            </div>
          )}
        </div>

        {/* Section Toggle: Orders / Settlement */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1.5">
          <div className="flex gap-1.5">
            <button
              onClick={() => setActiveSection('orders')}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                activeSection === 'orders' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Orders
            </button>
            <button
              onClick={() => setActiveSection('settlement')}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                activeSection === 'settlement' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Settlement
            </button>
          </div>
        </div>

        {activeSection === 'orders' && (
        <>
        {/* Tab Navigation */}
        <div ref={ordersRef} className="bg-white rounded-xl shadow-sm border border-gray-200 p-1.5 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1.5 min-w-max">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Active
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs bg-white bg-opacity-20">
              {orders.filter(o => o.status === 'placed' || o.status === 'taken').length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('taken')}
            className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'taken'
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Taken
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs bg-white bg-opacity-20">
              {orders.filter(o => o.status === 'taken').length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('out_for_delivery')}
            className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'out_for_delivery'
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Out
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs bg-white bg-opacity-20">
              {orders.filter(o => o.status === 'out_for_delivery').length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('delivered')}
            className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'delivered'
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Done
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs bg-white bg-opacity-20">
              {orders.filter(o => o.status === 'delivered').length}
            </span>
          </button>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {
            // Regular Orders View
            filteredOrders.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-md p-12 text-center">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">No Orders Found</h3>
                <p className="text-gray-600">
                  {activeTab === 'all' && 'No active orders at the moment.'}
                  {activeTab === 'taken' && 'You have not taken any orders yet.'}
                  {activeTab === 'out_for_delivery' && 'No orders are currently out for delivery.'}
                  {activeTab === 'delivered' && 'No orders have been delivered yet.'}
                </p>
              </div>
            ) : (
              filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6"
              >
                <div className="flex flex-col gap-4">
                  {/* Order ID Banner - Clean & Simple */}
                  <div className="bg-gray-100 border-l-4 border-indigo-600 px-3 sm:px-4 py-3 mb-3 rounded-r-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">Order #</p>
                        <p className="text-lg sm:text-xl font-mono font-bold text-gray-900 break-all">{order.id.toUpperCase().slice(0, 12)}...</p>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>

                  {/* Order Info */}
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-0.5">
                          {order.customer_name}
                        </h3>
                        <p className="text-xs text-gray-400">Placed on {formatDate(order.order_date)}</p>
                      </div>
                    </div>

                    <div className="space-y-1.5 mb-3 text-sm">
                        <div className="flex items-center text-gray-600">
                          <svg className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span>{order.customer_phone || 'N/A'}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <svg className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span>{order.customer_college || 'N/A'}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <svg className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{formatDate(order.order_date)}</span>
                        </div>

                    </div>

                    {/* User Preferences & Acceptance Status */}
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 sm:p-4 mb-4">
                      <h4 className="font-semibold text-blue-900 mb-2 text-sm uppercase tracking-wide">
                        ✓ Acceptance Status
                      </h4>
                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700 font-medium">Terms Accepted</span>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            order.termsAccepted ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                          }`}>
                            {order.termsAccepted ? '✓ YES' : '✗ NO'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700 font-medium">Vendor Call Received</span>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            order.vendorCallReceived ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                          }`}>
                            {order.vendorCallReceived ? '✓ YES' : '✗ NO'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 border border-gray-200">
                      <h4 className="font-bold text-gray-900 mb-2 text-sm uppercase tracking-wide flex items-center">
                        📦 Items ({parseItems(order.items).length})
                      </h4>
                      <div className="space-y-1.5 text-sm">
                        {parseItems(order.items).map((item, idx) => (
                          <div key={idx} className="flex justify-between items-start text-gray-700">
                            <span className="font-medium">{item.name}</span>
                            <span className="text-gray-600 font-semibold">×{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Partner Earnings - Simple & Clean */}
                    {(() => {
                      const settlement = getOrderSettlement(order);
                      const foodAmount = parseFloat(order.food_amount) || 0;
                      const deliveryFee = settlement.partnerEarnings + foodAmount;
                      const codFee = settlement.codTax || 0;
                      const totalPartnerEarning = deliveryFee + codFee;
                      
                      if (totalPartnerEarning === 0) return null;
                      
                      return (
                        <div className="border-2 border-green-200 bg-green-50 rounded-lg p-3 sm:p-4 mb-4">
                          <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            {deliveryFee > 0 && (
                              <div className="flex flex-col">
                                <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Delivery Fee</p>
                                <p className="text-xl sm:text-2xl font-bold text-green-900">₹{deliveryFee.toFixed(2)}</p>
                              </div>
                            )}
                            {codFee > 0 && (
                              <div className="flex flex-col">
                                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">COD Fee</p>
                                <p className="text-xl sm:text-2xl font-bold text-amber-900">₹{codFee.toFixed(2)}</p>
                              </div>
                            )}
                          </div>
                          <div className="mt-3 pt-3 border-t-2 border-green-200 flex justify-between items-center">
                            <span className="font-semibold text-green-900 text-sm">You Earn</span>
                            <span className="text-2xl sm:text-3xl font-bold text-green-700">₹{totalPartnerEarning.toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Delivery Slot & Date Display */}
                    <div className="mt-2 text-sm text-gray-700">
                      <p>
                        <span className="font-semibold text-black">Delivery Slot:</span> {order.delivery_slot || '—'}
                      </p>
                      <p className="mt-0.5">
                        <span className="font-semibold text-black">Delivery Date:</span> {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
                      </p>
                      
                      {/* Customer Notes/Description */}
                      {order.description && (
                        <div className="mt-3 p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                          <p className="font-bold text-yellow-900 text-xs uppercase tracking-wide mb-1">📝 Notes</p>
                          <p className="text-sm text-yellow-900">{order.description}</p>
                        </div>
                      )}
                      {order.delivery_type === 'room' && (() => {
                        const items = parseItems(order.items);
                        let packets = order.number_of_packets;
                        let platform = order.vendor_platform;
                        let charge = order.room_delivery_charge || order.delivery_charge;
                        let foodAmt = order.food_amount || 0;

                        if (!packets) {
                          packets = items.reduce((sum, item) => sum + (parseInt(item.quantity) || 1), 0);
                        }

                        if (items.length > 0) {
                          const roomItem = items.find(i => i.type === 'room_delivery' || (i.name && i.name.includes('Room Delivery')));
                          if (roomItem) {
                            if (!platform && roomItem.name) {
                              const match = roomItem.name.match(/\(([^)]+)\)/);
                              if (match) platform = match[1];
                            }
                            if (!foodAmt && roomItem.foodAmount) {
                              foodAmt = roomItem.foodAmount;
                            }
                          }
                        }

                        if (!platform) platform = 'NIVA';

                        return (
                          <div className="mt-2 bg-purple-50 border border-purple-200 rounded-lg p-3 space-y-1.5">
                            <p className="font-bold text-purple-800 text-sm">🏠 Room Delivery Details</p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-purple-700">
                              <div>
                                <span className="font-semibold">Hostel:</span> {order.hostel_name} ({order.hostel_type === 'female' ? 'Girls' : 'Boys'})
                              </div>
                              <div>
                                <span className="font-semibold">Room:</span> {order.room_number || '—'}
                              </div>
                              {order.gate_number && (
                                <div>
                                  <span className="font-semibold">Gate:</span> {order.gate_number}
                                </div>
                              )}
                              <div>
                                <span className="font-semibold">Packets:</span> {packets || '—'}
                              </div>
                              <div>
                                <span className="font-semibold">Platform:</span> {platform || '—'}
                              </div>
                              <div>
                                <span className="font-semibold">Delivery Charge:</span> ₹{charge || '—'}
                              </div>
                              {foodAmt > 0 && (
                                <div>
                                  <span className="font-semibold">Food Bill:</span> ₹{foodAmt}
                                </div>
                              )}
                            </div>
                            {order.description && (
                              <div className="mt-1 pt-1.5 border-t border-purple-200">
                                <span className="font-semibold text-purple-800 text-xs">Description:</span>
                                <p className="text-purple-700 text-xs mt-0.5">{order.description}</p>
                              </div>
                            )}
                            <div className="mt-1.5 pt-1.5 border-t border-purple-200 flex justify-between items-center">
                              <span className="font-bold text-purple-900 text-sm">Total:</span>
                              {order.payment_method === 'cod' ? (
                                <span className="text-red-600 font-bold text-sm">Collect ₹{order.total_amount} at Room</span>
                              ) : (
                                <span className="text-green-700 font-bold text-sm">Paid Online ₹{order.total_amount}</span>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3 lg:w-64">
                    {order.status === 'placed' && (
                      <button
                        onClick={() => handleTakeOrder(order.id)}
                        disabled={updatingId === order.id}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {updatingId === order.id ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </span>
                        ) : (
                          <>
                            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Take Order
                          </>
                        )}
                      </button>
                    )}

                    {order.status === 'taken' && (
                      <button
                        onClick={() => handleOutForDelivery(order.id)}
                        disabled={updatingId === order.id}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {updatingId === order.id ? 'Updating...' : (
                          <>
                            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Out for Delivery
                          </>
                        )}
                      </button>
                    )}

                    {order.status === 'out_for_delivery' && (
                      <button
                        onClick={() => handleDelivered(order.id)}
                        disabled={updatingId === order.id}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {updatingId === order.id ? 'Updating...' : (
                          <>
                            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Mark as Delivered
                          </>
                        )}
                      </button>
                    )}

                    {order.status === 'delivered' && (
                      <div className="w-full bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-500 text-green-800 px-6 py-3 rounded-xl font-semibold text-center">
                        <svg className="w-6 h-6 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Completed
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
            )
          }
        </div>
        </>
        )}

        {/* Settlement Section */}
        {activeSection === 'settlement' && (
          <div className="space-y-4 sm:space-y-6">
            
            {/* Room Delivery Earnings Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Room Delivery Earnings Chart
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 ml-7">Transparent pricing breakdown per packet</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white text-left border-b border-gray-100">
                      <th className="px-4 sm:px-6 py-3 font-semibold text-gray-600">Packet Count</th>
                      <th className="px-4 sm:px-6 py-3 font-semibold text-gray-600 text-center">Total Amount</th>
                      <th className="px-4 sm:px-6 py-3 font-semibold text-purple-700 text-center">Partner Earnings</th>
                      <th className="px-4 sm:px-6 py-3 font-semibold text-gray-500 text-right">Website Maintenance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 sm:px-6 py-3 font-medium text-gray-900">1–2 Packets</td>
                      <td className="px-4 sm:px-6 py-3 text-center text-gray-700 font-semibold">₹29</td>
                      <td className="px-4 sm:px-6 py-3 text-center text-purple-700 font-bold bg-purple-50/30">₹20</td>
                      <td className="px-4 sm:px-6 py-3 text-right text-gray-500">₹9</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 sm:px-6 py-3 font-medium text-gray-900">3–4 Packets</td>
                      <td className="px-4 sm:px-6 py-3 text-center text-gray-700 font-semibold">₹49</td>
                      <td className="px-4 sm:px-6 py-3 text-center text-purple-700 font-bold bg-purple-50/30">₹30</td>
                      <td className="px-4 sm:px-6 py-3 text-right text-gray-500">₹19</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 sm:px-6 py-3 font-medium text-gray-900">5–6 Packets</td>
                      <td className="px-4 sm:px-6 py-3 text-center text-gray-700 font-semibold">₹55</td>
                      <td className="px-4 sm:px-6 py-3 text-center text-purple-700 font-bold bg-purple-50/30">₹35</td>
                      <td className="px-4 sm:px-6 py-3 text-right text-gray-500">₹20</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 sm:px-6 py-3 font-medium text-gray-900">7–8 Packets</td>
                      <td className="px-4 sm:px-6 py-3 text-center text-gray-700 font-semibold">₹59</td>
                      <td className="px-4 sm:px-6 py-3 text-center text-purple-700 font-bold bg-purple-50/30">₹40</td>
                      <td className="px-4 sm:px-6 py-3 text-right text-gray-500">₹19</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 sm:px-6 py-3 font-medium text-gray-900">&gt;8 Packets</td>
                      <td className="px-4 sm:px-6 py-3 text-center text-gray-700 font-semibold">₹69</td>
                      <td className="px-4 sm:px-6 py-3 text-center text-purple-700 font-bold bg-purple-50/30">₹45</td>
                      <td className="px-4 sm:px-6 py-3 text-right text-gray-500">₹24</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Today's Settlement Summary */}
            {(() => {
              const today = getTodaySettlement();
              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
                  <div className="bg-white rounded-xl border-2 border-gray-200 p-4 sm:p-5">
                    <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Today's Vendor Earnings</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">₹{roundUpToTen(today.vendorTotal)}</p>
                  </div>
                  <div className="bg-white rounded-xl border-2 border-purple-200 p-4 sm:p-5">
                    <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Today's Delivery Earnings</p>
                    <p className="text-2xl sm:text-3xl font-bold text-purple-700">₹{roundUpToTen(today.deliveryTotal)}</p>
                  </div>
                  <div className="bg-white rounded-xl border-2 border-orange-200 p-4 sm:p-5">
                    <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">COD Food Bill</p>
                    <p className="text-2xl sm:text-3xl font-bold text-orange-700">₹{roundUpToTen(today.codFoodAmountTotal)}</p>
                  </div>
                  <div className="bg-white rounded-xl border-2 border-amber-200 p-4 sm:p-5">
                    <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">COD Fee Total</p>
                    <p className="text-2xl sm:text-3xl font-bold text-amber-700">₹{roundUpToTen(today.codFeeTotal)}</p>
                  </div>
                  <div className="bg-white rounded-xl border-2 border-blue-200 p-4 sm:p-5">
                    <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Website Maintenance</p>
                    <p className="text-2xl sm:text-3xl font-bold text-blue-700">₹{roundUpToTen(today.websiteMaintenanceTotal)}</p>
                  </div>
                  <div className="bg-white rounded-xl border-2 border-green-200 p-4 sm:p-5">
                    <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Today's Total</p>
                    <p className="text-2xl sm:text-3xl font-bold text-green-700">₹{roundUpToTen(today.vendorTotal + today.deliveryTotal + today.websiteMaintenanceTotal + today.codFeeTotal + today.codFoodAmountTotal)}</p>
                    <p className="text-xs text-gray-400 mt-1">{today.totalOrders} order{today.totalOrders !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              );
            })()}

            {/* Settlement History Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                <h3 className="text-base sm:text-lg font-bold text-gray-900">Settlement History</h3>
                <p className="text-xs text-gray-500 mt-0.5">Daily breakdown of your earnings</p>
              </div>
              {settlements.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p className="text-lg font-semibold mb-1">No settlement data yet</p>
                  <p className="text-sm">Settlement history will appear once you have completed orders.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left">
                        <th className="px-4 sm:px-6 py-3 font-semibold text-gray-600">Date</th>
                        <th className="px-4 sm:px-6 py-3 font-semibold text-gray-600 text-right">Orders</th>
                        <th className="px-4 sm:px-6 py-3 font-semibold text-gray-600 text-right">Vendor</th>
                        <th className="px-4 sm:px-6 py-3 font-semibold text-gray-600 text-right">Delivery</th>
                        <th className="px-4 sm:px-6 py-3 font-semibold text-gray-600 text-right">COD Food</th>
                        <th className="px-4 sm:px-6 py-3 font-semibold text-gray-600 text-right">COD Fee</th>
                        <th className="px-4 sm:px-6 py-3 font-semibold text-gray-600 text-right">Web Maint.</th>
                        <th className="px-4 sm:px-6 py-3 font-semibold text-gray-600 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {settlements.map((s, idx) => (
                        <tr key={idx} className={idx === 0 ? 'bg-green-50' : 'hover:bg-gray-50'}>
                          <td className="px-4 sm:px-6 py-3 font-medium text-gray-900">
                            {new Date(s.date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-4 sm:px-6 py-3 text-right text-gray-700">{s.totalOrders}</td>
                          <td className="px-4 sm:px-6 py-3 text-right text-gray-700">₹{roundUpToTen(s.vendorTotal)}</td>
                          <td className="px-4 sm:px-6 py-3 text-right text-purple-700">₹{roundUpToTen(s.deliveryTotal)}</td>
                          <td className="px-4 sm:px-6 py-3 text-right text-orange-700">₹{roundUpToTen(s.codFoodAmountTotal)}</td>
                          <td className="px-4 sm:px-6 py-3 text-right text-amber-700">₹{roundUpToTen(s.codFeeTotal)}</td>
                          <td className="px-4 sm:px-6 py-3 text-right text-blue-700">₹{roundUpToTen(s.websiteMaintenanceTotal)}</td>
                          <td className="px-4 sm:px-6 py-3 text-right font-bold text-green-700">₹{roundUpToTen(s.vendorTotal + s.deliveryTotal + s.websiteMaintenanceTotal + s.codFeeTotal + s.codFoodAmountTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

}

export default PartnerDashboard;
