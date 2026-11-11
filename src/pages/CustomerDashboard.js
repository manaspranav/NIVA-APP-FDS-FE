import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLocationDot } from '@fortawesome/free-solid-svg-icons';
import Footer from '../components/Footer';
import FloatingCart from '../components/FloatingCart';
import BackToTop from '../components/BackToTop';
import RoomDeliveryForm from '../components/RoomDeliveryForm';
import axios from 'axios';
import { fastfoods as fastfoodsData } from '../data/productsData';
import { customerSupabase as supabase } from '../customerSupabase';
import { isCustomerProfileComplete } from '../utils/customerProfile';
import RestaurantsSection from '../components/RestaurantsSection';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function CustomerDashboard() {
  const navigate = useNavigate();
  const [fastfoods, setFastfoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [searchPlaceholder, setSearchPlaceholder] = useState("'biryani combo'");
  const [placeholderAnimating, setPlaceholderAnimating] = useState(false);
  const [showFooter, setShowFooter] = useState(true);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [showPromoBanner, setShowPromoBanner] = useState(false);
  const [stockStatus, setStockStatus] = useState({ fastFoodsActive: true, biryaniActive: true });
  const [currentSlide, setCurrentSlide] = useState('deliveries'); // 'foods' | 'deliveries'

  const searchPlaceholders = useMemo(() => [
    "'biryani combo'",
    "'chicken noodles'",
    "'fried rice'",
    "'starters'",
  ], []);

  useEffect(() => {
    const bannerDismissed = sessionStorage.getItem('promoBannerDismissed');
    if (!bannerDismissed) {
      const timer = setTimeout(() => setShowPromoBanner(true), 4000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const handler = () => {};
    window.addEventListener('cartUpdated', handler);
    return () => window.removeEventListener('cartUpdated', handler);
  }, []);

  useEffect(() => {
    const updateWishlist = () => {
      const savedWishlist = localStorage.getItem('wishlist');
      const wishlist = savedWishlist ? JSON.parse(savedWishlist) : [];
      setWishlistItems(wishlist.map(item => item.id));
    };
    updateWishlist();
    window.addEventListener('wishlistUpdated', updateWishlist);
    return () => window.removeEventListener('wishlistUpdated', updateWishlist);
  }, []);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setPlaceholderAnimating(true);
      setTimeout(() => {
        index = (index + 1) % searchPlaceholders.length;
        setSearchPlaceholder(searchPlaceholders[index]);
        setPlaceholderAnimating(false);
      }, 300);
    }, 2000);
    return () => clearInterval(interval);
  }, [searchPlaceholders]);

  useEffect(() => {
    let lastScroll = 0;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 50) {
        setShowFooter(currentScrollY < lastScroll);
      } else {
        setShowFooter(true);
      }
      lastScroll = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let mounted = true;
    const initAuth = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        if (session?.user) {
          localStorage.setItem('userId', session.user.id);
          localStorage.setItem('userRole', 'customer');
        }
        setAuthInitialized(true);
      }
    };
    initAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted && session?.user) {
        localStorage.setItem('userId', session.user.id);
        localStorage.setItem('userRole', 'customer');
      }
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!authInitialized) return;
    const cachedProfile = sessionStorage.getItem('userProfile');
    if (cachedProfile) setUserProfile(JSON.parse(cachedProfile));

    const fetchUserProfile = async () => {
      try {
        let userId = localStorage.getItem('userId');
        if (!userId) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) { userId = session.user.id; localStorage.setItem('userId', userId); localStorage.setItem('userRole', 'customer'); }
        }
        if (!userId) { setUserProfile({ name: 'Guest', university: 'Select your university', location: 'Your Location' }); return; }

        const response = await axios.get(`${API_URL}/api/customers/${userId}`);
        if (response.data.success && response.data.data) {
          const customerData = response.data.data;
          if (!isCustomerProfileComplete(customerData)) { navigate('/customer/update-profile', { replace: true }); return; }
          const profile = { name: customerData.name || 'User', university: customerData.college || 'Select your university', location: customerData.college || 'Your Location' };
          setUserProfile(profile);
          sessionStorage.setItem('userProfile', JSON.stringify(profile));
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setUserProfile({ name: 'User', university: 'Select your university', location: 'Your Location' });
      }
    };
    fetchUserProfile();
  }, [authInitialized, navigate]);

  useEffect(() => {
    const handleProfileUpdate = (event) => {
      if (event.detail) {
        setUserProfile({ name: event.detail.name || 'User', university: event.detail.college || 'Select your university', location: event.detail.college || 'Your Location' });
      }
    };
    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate);
  }, []);

  useEffect(() => { setFastfoods(fastfoodsData); setLoading(false); }, []);

  // Fetch stock availability from backend
  useEffect(() => {
    const fetchStockStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/api/slot-availability`);
        if (res.ok) {
          const data = await res.json();
          if (data.stock) {
            setStockStatus({
              fastFoodsActive: data.stock.fastFoodsActive !== false,
              biryaniActive: data.stock.biryaniActive !== false
            });
          }
        }
      } catch (err) {
        console.warn('Stock status fetch failed:', err.message);
      }
    };
    fetchStockStatus();
  }, []);

  const isItemOutOfStock = useCallback((item) => {
    if (item.category === 'Biryani' && !stockStatus.biryaniActive) return true;
    if (item.category !== 'Biryani' && !stockStatus.fastFoodsActive) return true;
    return false;
  }, [stockStatus]);

  const handleAddToCart = useCallback((product) => {
    if (isItemOutOfStock(product)) { alert(`"${product.name}" is currently out of stock.`); return; }
    const savedCart = localStorage.getItem('cart');
    const cart = savedCart ? JSON.parse(savedCart) : [];
    const existingItemIndex = cart.findIndex(item => item.id === product.id);
    if (existingItemIndex > -1) { cart[existingItemIndex].quantity = (cart[existingItemIndex].quantity || 1) + 1; }
    else { cart.push({ ...product, quantity: 1 }); }
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
  }, [isItemOutOfStock]);

  const handleAddToWishlist = useCallback((product) => {
    const userId = localStorage.getItem('userId');
    if (!userId) { navigate('/customer/edit-profile', { state: { message: 'Please login or signup to add items to your wishlist' } }); return; }
    const savedWishlist = localStorage.getItem('wishlist');
    const wishlist = savedWishlist ? JSON.parse(savedWishlist) : [];
    const existingIndex = wishlist.findIndex(item => item.id === product.id);
    if (existingIndex > -1) { wishlist.splice(existingIndex, 1); } else { wishlist.push(product); }
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    window.dispatchEvent(new Event('wishlistUpdated'));
  }, [navigate]);

  const starters = useMemo(() => fastfoods.filter(f => f.category === 'Starters'), [fastfoods]);
  const noodles = useMemo(() => fastfoods.filter(f => f.category === 'Noodles'), [fastfoods]);
  const biryanis = useMemo(() => fastfoods.filter(f => f.category === 'Biryani'), [fastfoods]);
  const friedRice = useMemo(() => fastfoods.filter(f => f.category === 'Fried Rice'), [fastfoods]);
  const mostSellingItems = useMemo(() => fastfoods.filter(f => [301, 302, 303].includes(f.id)), [fastfoods]);

  const getProductLink = (item) => `/product/fastfood/${item.id}`;

  const renderProductCard = (item, keyPrefix = '', options = {}) => {
    const { badge, imageHeight = 'h-36', isGrid = false } = options;
    const discount = item.originalPrice ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100) : 0;
    const isInWishlist = wishlistItems.includes(item.id);
    const isOutOfStock = isItemOutOfStock(item);
    return (
      <div key={`${keyPrefix}${item.id}`} className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 group ${!isGrid ? 'flex-shrink-0 w-64' : ''} ${isOutOfStock ? 'opacity-75' : ''}`}>
        <div className="relative overflow-hidden bg-gray-50 rounded-xl">
          <img loading="lazy" src={item.image} alt={item.name} onClick={() => navigate(getProductLink(item))} className={`w-full ${imageHeight} object-cover transition-transform duration-300 group-hover:scale-105 rounded-xl cursor-pointer ${isOutOfStock ? 'grayscale' : ''}`} />
          {isOutOfStock && (<div className="absolute top-0 left-0 right-0 bottom-0 bg-black bg-opacity-30 flex items-center justify-center rounded-xl"><span className="bg-red-600 text-white text-sm font-bold px-4 py-2 rounded-lg shadow-lg">Out of Stock</span></div>)}
          {!isOutOfStock && discount > 0 && (<div className="absolute top-0 left-0 bg-green-700 text-white text-xs font-bold px-3 py-2 rounded-br-2xl shadow-lg">{discount}% OFF</div>)}
          {badge && (<div className="absolute bottom-0 left-0 bg-orange-500 text-white text-xs font-bold px-3 py-2 rounded-tr-2xl shadow-lg">{badge}</div>)}
          <button onClick={() => handleAddToWishlist(item)} className="absolute top-3 right-3 hover:scale-110 transition-all duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 drop-shadow-lg" fill={isInWishlist ? '#000000' : 'white'} viewBox="0 0 24 24" stroke="#000000" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          </button>
          <button onClick={() => !isOutOfStock && handleAddToCart(item)} disabled={isOutOfStock} className={`absolute bottom-0 right-0 px-3 py-2 rounded-tl-2xl transition-all duration-200 font-semibold text-sm flex items-center gap-1 shadow-lg ${isOutOfStock ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800'}`}>
            {isOutOfStock ? <>Out of Stock</> : (<><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Add</>)}
          </button>
        </div>
        <div className="p-3">
          {item.isVeg !== undefined && (<div className="flex items-center gap-1.5 mb-1"><span className={`inline-flex items-center justify-center w-4 h-4 border-2 rounded-sm ${item.isVeg ? 'border-green-600' : 'border-red-600'}`}><span className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`}></span></span><span className={`text-xs font-semibold ${item.isVeg ? 'text-green-700' : 'text-red-600'}`}>{item.isVeg ? 'Veg' : 'Non-Veg'}</span></div>)}
          <h3 className="font-semibold text-gray-800 text-base mb-2">{item.name}</h3>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-gray-900 font-metropolis">₹{item.price}</span>
            {item.originalPrice && item.originalPrice !== item.price && (<span className="text-sm text-gray-400 line-through font-metropolis">₹{item.originalPrice}</span>)}
          </div>
        </div>
      </div>
    );
  };

  const renderLoadingSpinner = (text) => (<div className="flex items-center justify-center py-16"><div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div><p className="text-gray-500">{text}</p></div></div>);
  const renderEmptyState = (text) => (<div className="text-center py-16 bg-white rounded-xl"><svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg><p className="text-gray-500">{text}</p></div>);
  const renderViewAllButton = (items, title) => (<button onClick={() => navigate('/view-all', { state: { items, title } })} className="text-gray-800 font-semibold text-sm hover:text-black flex items-center gap-1">View All<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>);

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="bg-black shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-white font-bold text-2xl">NIVA</h1>
              <div className="flex items-center gap-1 mt-1">
                <FontAwesomeIcon icon={faLocationDot} className="text-white text-xs" />
                <span className="text-white text-xs">Deliver to {userProfile?.location || 'Your Location'}</span>
              </div>
            </div>
            <button onClick={() => navigate('/customer/edit-profile')} className="focus:outline-none bg-black hover:bg-gray-800 p-2 rounded-full transition-colors active:bg-gray-700">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-black shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="relative overflow-hidden">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" onClick={() => navigate('/customer/search')} readOnly className="w-full pl-12 pr-4 py-3 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-gray-700 cursor-pointer" />
            <div className="absolute left-12 top-1/2 transform -translate-y-1/2 pointer-events-none overflow-hidden h-6 flex items-center">
              <span className="text-gray-500 mr-1">Search for </span>
              <div className={`transition-all duration-300 ${placeholderAnimating ? '-translate-y-6 opacity-0' : 'translate-y-0 opacity-100'}`}><span className="text-gray-500">{searchPlaceholder}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Slide Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-[80px] z-30">
        <div className="max-w-7xl mx-auto flex">
          <button
            onClick={() => setCurrentSlide('deliveries')}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-all border-b-[3px] ${
              currentSlide === 'deliveries'
                ? 'text-black border-black'
                : 'text-gray-400 border-transparent hover:text-gray-600'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            NIVA Deliveries
          </button>
          <button
            onClick={() => setCurrentSlide('foods')}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-all border-b-[3px] ${
              currentSlide === 'foods'
                ? 'text-black border-black'
                : 'text-gray-400 border-transparent hover:text-gray-600'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            NIVA Foods
          </button>
        </div>
      </div>

      {currentSlide === 'foods' && (
      <>
      <div className="h-4"></div>

      <div className="max-w-7xl mx-auto">
        {/* Restaurants Section */}
        <RestaurantsSection />

        {/* Most Selling */}
        <div className="px-4 py-6 bg-gradient-to-b from-white to-gray-50">
          <div className="flex items-center justify-between mb-4"><div><h2 className="text-2xl font-bold text-gray-800">Most Selling Items</h2><p className="text-sm text-gray-600 mt-1">Our customers' favorites</p></div></div>
          {loading ? renderLoadingSpinner('Loading...') : (<div className="overflow-x-auto -mx-4 px-4 pb-4 scrollbar-hide"><div className="flex gap-4">{mostSellingItems.map(item => renderProductCard(item, 'mostselling-', { badge: 'Most Selling' }))}</div></div>)}
        </div>

        {/* Starters */}
        <div className="px-4 py-6">
          <div className="flex items-center justify-between mb-4"><div><h2 className="text-2xl font-bold text-gray-800">Starters</h2><p className="text-sm text-gray-600 mt-1">Crispy and delicious appetizers</p></div>{renderViewAllButton(starters, 'Starters')}</div>
          {loading ? renderLoadingSpinner('Loading starters...') : starters.length === 0 ? renderEmptyState('No starters available') : (<div className="overflow-x-auto -mx-4 px-4 pb-4 scrollbar-hide"><div className="flex gap-4">{starters.map(item => renderProductCard(item, 'starter-'))}</div></div>)}
        </div>

        {/* Noodles */}
        <div className="px-4 py-6 bg-gradient-to-b from-white to-gray-50">
          <div className="flex items-center justify-between mb-4"><div><h2 className="text-2xl font-bold text-gray-800">Noodles</h2><p className="text-sm text-gray-600 mt-1">Stir-fried to perfection</p></div>{renderViewAllButton(noodles, 'Noodles')}</div>
          {loading ? renderLoadingSpinner('Loading noodles...') : noodles.length === 0 ? renderEmptyState('No noodles available') : (<div className="overflow-x-auto -mx-4 px-4 pb-4 scrollbar-hide"><div className="flex gap-4">{noodles.map(item => renderProductCard(item, 'noodle-'))}</div></div>)}
        </div>

        {/* Biryani */}
        <div className="px-4 py-6">
          <div className="flex items-center justify-between mb-4"><div><h2 className="text-2xl font-bold text-gray-800">Biryani</h2><p className="text-sm text-gray-600 mt-1">Aromatic and flavorful biryanis</p></div>{renderViewAllButton(biryanis, 'Biryani')}</div>
          {loading ? renderLoadingSpinner('Loading biryanis...') : biryanis.length === 0 ? renderEmptyState('No biryanis available') : (<div className="overflow-x-auto -mx-4 px-4 pb-4 scrollbar-hide"><div className="flex gap-4">{biryanis.map(item => renderProductCard(item, 'biryani-'))}</div></div>)}
        </div>

        {/* Fried Rice */}
        <div className="px-4 py-6 bg-gradient-to-b from-white to-gray-50">
          <div className="flex items-center justify-between mb-4"><div><h2 className="text-2xl font-bold text-gray-800">Fried Rice</h2><p className="text-sm text-gray-600 mt-1">Wok-tossed goodness</p></div>{renderViewAllButton(friedRice, 'Fried Rice')}</div>
          {loading ? renderLoadingSpinner('Loading fried rice...') : friedRice.length === 0 ? renderEmptyState('No fried rice available') : (<div className="overflow-x-auto -mx-4 px-4 pb-4 scrollbar-hide"><div className="flex gap-4">{friedRice.map(item => renderProductCard(item, 'friedrice-'))}</div></div>)}
        </div>
      </div>
      </>
      )}

      {currentSlide === 'deliveries' && (
        <RoomDeliveryForm 
          onSubmit={async (formData) => {
            const userId = localStorage.getItem('userId');
            if (!userId) {
              navigate('/customer/edit-profile', { state: { message: 'Please login or signup to place a room delivery order' } });
              return;
            }

            try {
              const orderData = {
                customerId: userId,
                hostelType: formData.hostelType,
                hostelName: formData.hostelName,
                roomNumber: formData.roomNumber,
                numberOfPackets: formData.numberOfPackets,
                vendorPlatform: formData.vendorPlatform,
                paymentMethod: formData.paymentMethod,
                deliveryCharge: formData.deliveryCharge,
                foodAmount: formData.foodAmount,
                vendorOrderType: formData.vendorOrderType,
                description: formData.description,
                termsAccepted: formData.termsAccepted,
                vendorCallReceived: formData.vendorCallReceived,
                codTax: formData.codTax,
                penaltyFee: formData.penaltyFee
              };

              const response = await axios.post(`${API_URL}/api/orders/external-room-delivery`, orderData);
              if (response.data.success) {
                if (formData.paymentMethod === 'online' && response.data.razorpayOrderId) {
                  // Basic Razorpay Integration
                  const loadRazorpayScript = () => {
                    return new Promise((resolve) => {
                      if (window.Razorpay) return resolve(true);
                      const script = document.createElement('script');
                      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                      script.onload = () => resolve(true);
                      script.onerror = () => resolve(false);
                      document.body.appendChild(script);
                    });
                  };

                  const isLoaded = await loadRazorpayScript();
                  if (!isLoaded) {
                    alert('Failed to load payment gateway. Please check your internet connection.');
                    return;
                  }

                  const options = {
                    key: response.data.key,
                    amount: response.data.amount,
                    currency: "INR",
                    name: "NIVA Deliveries",
                    description: "Room Delivery Charge",
                    order_id: response.data.razorpayOrderId,
                    handler: async function (responsePayment) {
                      try {
                        const verifyRes = await axios.post(`${API_URL}/api/payment/verify`, {
                          razorpay_order_id: responsePayment.razorpay_order_id,
                          razorpay_payment_id: responsePayment.razorpay_payment_id,
                          razorpay_signature: responsePayment.razorpay_signature,
                          orderId: response.data.orderId,
                          // Pass customer details so the verify route can create the order record
                          customer_id: userId,
                          customer_name: response.data.customerName || userProfile?.name || '',
                          customer_email: response.data.customerEmail || '',
                          customer_phone: response.data.customerPhone || userProfile?.phone || '',
                          customer_college: response.data.customerCollege || userProfile?.university || ''
                        });

                        if (verifyRes.data.success) {
                          alert('Order placed successfully! Redirecting to your orders...');
                          navigate('/customer/orders');
                        } else {
                          alert('Payment verification failed. Please contact support with your payment ID: ' + responsePayment.razorpay_payment_id);
                        }
                      } catch (err) {
                        console.error('Payment verification error:', err);
                        alert('Payment verification error. Your payment may have been processed. Please check your orders or contact support.');
                      }
                    },
                    prefill: {
                      name: userProfile?.name || '',
                      contact: userProfile?.phone || ''
                    },
                    theme: { color: "#000000" }
                  };
                  
                  const rzp = new window.Razorpay(options);
                  rzp.on('payment.failed', function (resp) {
                    alert('Payment failed! Reason: ' + resp.error.description);
                  });
                  rzp.open();
                } else {
                  // COD or free
                  navigate('/customer/orders');
                }
              }
            } catch (error) {
              console.error('Error placing room delivery order:', error);
              alert(error.response?.data?.message || 'Failed to place order. Please try again.');
            }
          }} 
          onClose={() => setCurrentSlide('foods')}
          userProfile={userProfile}
        />
      )}

      <BackToTop />
      {currentSlide === 'foods' && <Footer showFooter={showFooter} />}
      {currentSlide === 'foods' && <FloatingCart />}

      {showPromoBanner && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-fadeIn" onClick={() => { setShowPromoBanner(false); sessionStorage.setItem('promoBannerDismissed', 'true'); }}>
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl mx-0 sm:mx-4 max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()} style={{ animation: 'slideUp 0.35s ease-out' }}>
            <div className="h-1 bg-gradient-to-r from-orange-400 via-red-500 to-orange-400"></div>
            <button onClick={() => { setShowPromoBanner(false); sessionStorage.setItem('promoBannerDismissed', 'true'); }} className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all z-10"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
            <div className="flex items-center gap-4 p-5 pt-4">
              <img src="/Combo/BiryaniCombo.png" alt="Biryani Combo" className="w-28 h-28 object-cover rounded-xl shadow-sm flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="inline-block bg-orange-50 text-orange-600 text-xs font-semibold px-2.5 py-1 rounded-md mb-2">This Month Special</span>
                <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1">Biryani Combo</h3>
                <div className="flex items-baseline gap-2 mb-1"><span className="text-2xl font-bold text-gray-900">₹169</span><span className="text-sm text-gray-400 line-through">₹220</span><span className="text-xs font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">23% OFF</span></div>
                <p className="text-xs text-gray-500">Limited time offer — grab it fast!</p>
              </div>
            </div>
            <div className="px-5 pb-5"><button onClick={() => { setShowPromoBanner(false); sessionStorage.setItem('promoBannerDismissed', 'true'); navigate('/product/fastfood/303'); }} className="w-full bg-black text-white font-semibold py-3 rounded-xl hover:bg-gray-800 transition-colors duration-200 text-sm">Order Now</button></div>
          </div>
        </div>
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.25s ease-out forwards; }
      `}</style>
    </div>
  );
}

export default CustomerDashboard;