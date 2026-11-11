import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, ArrowLeft, ChevronRight, Search, Share2 } from 'lucide-react';
import axios from 'axios';
import { syncCartWithLatestPrices } from '../utils/cartPriceSync';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function CartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [customerId, setCustomerId] = useState(null);
  const [universityName, setUniversityName] = useState('');
  const [customerProfile, setCustomerProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    
    if (userRole === 'customer' && userId) {
      setCustomerId(userId);
      
      // Fetch customer profile (university, phone, name, email)
      axios.get(`${API_URL}/api/customers/${userId}`)
        .then(response => {
          if (response.data.success && response.data.data) {
            const profile = response.data.data;
            setUniversityName(profile.college || 'Your Location');
            setCustomerProfile(profile);
          }
        })
        .catch(err => console.error('Error fetching profile:', err));
    }
    
    loadCart();
  }, []);

  const loadCart = () => {
    let storedCart = [];

    try {
      storedCart = JSON.parse(localStorage.getItem('cart')) || [];
    } catch (error) {
      storedCart = [];
    }

    const { syncedCart, changed } = syncCartWithLatestPrices(storedCart);

    if (changed) {
      localStorage.setItem('cart', JSON.stringify(syncedCart));
      window.dispatchEvent(new Event('cartUpdated'));
    }

    setCartItems(syncedCart);
  };

  const updateQuantity = (itemId, change) => {
    const updatedCart = cartItems.map(item => {
      if (item.id === itemId) {
        const newQuantity = (item.quantity || 1) + change;
        // If quantity becomes 0 or less, we'll filter it out later
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(item => item.quantity > 0); // Remove items with quantity 0 or less
    
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  // eslint-disable-next-line no-unused-vars
  const removeFromCart = (itemId) => {
    const updatedCart = cartItems.filter(item => item.id !== itemId);
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  };

  const calculateTotal = () => {
    // Since delivery and handling are FREE, total is just the subtotal
    return calculateSubtotal();
  };

  const handleShareCart = () => {
    const shareUrl = window.location.origin + 'customer/cart';
    
    if (navigator.share) {
      navigator.share({
        title: 'My NIVA Cart',
        url: shareUrl,
      }).catch(err => console.log('Error sharing:', err));
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(shareUrl)
        .then(() => alert('Cart link copied to clipboard!'))
        .catch(err => console.error('Failed to copy:', err));
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handlePayment = async () => {
    if (!customerId) {
      alert('Please login to proceed with checkout');
      navigate('/customer/login');
      return;
    }

    try {
      // Debug: Log environment variables
      console.log('Environment Check:');
      console.log('- Razorpay Key ID:', process.env.REACT_APP_RAZORPAY_KEY_ID);
      
      // Check if Razorpay SDK is loaded
      if (!window.Razorpay) {
        alert('Payment system is loading. Please wait and try again.');
        return;
      }

      if (!process.env.REACT_APP_RAZORPAY_KEY_ID) {
        alert('Payment system is not configured. Please contact support.');
        console.error('RAZORPAY_KEY_ID not configured');
        console.error('Available env vars:', Object.keys(process.env).filter(k => k.startsWith('REACT_APP')));
        return;
      }

      const totalAmount = calculateTotal();
      
      if (totalAmount <= 0) {
        alert('Invalid cart total. Please refresh and try again.');
        return;
      }

      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      // Create Razorpay order
      const orderResponse = await axios.post(`${API_URL}/api/payment/create-order`, {
        amount: totalAmount,
        currency: 'INR',
        receipt: `rcpt_${Date.now()}_${customerId.substring(0, 8)}`
      });

      if (!orderResponse.data.success || !orderResponse.data.order) {
        throw new Error(orderResponse.data.message || 'Failed to create order');
      }

      const { order } = orderResponse.data;

      // Get Razorpay key from environment (LIVE mode)
      const razorpayKey = process.env.REACT_APP_RAZORPAY_KEY_ID;
      const isLiveMode = razorpayKey.startsWith('rzp_live_');
      
      console.log('Payment Mode:', isLiveMode ? 'LIVE' : 'TEST');

      // Razorpay options with comprehensive error handling and UPI Intent enabled
      const options = {
        key: razorpayKey,
        amount: order.amount,
        currency: order.currency,
        name: 'NIVA',
        description: 'Fast Food Delivery',
        order_id: order.id,
        
        // ✅ ENABLE UPI INTENT FLOW - Let Razorpay detect and launch UPI apps
        config: {
          display: {
            blocks: {
              upi: {
                name: 'Pay using UPI',
                instruments: [
                  {
                    method: 'upi', // Razorpay handles UPI intent automatically
                  },
                ],
              },
              card: {
                name: 'Cards',
                instruments: [
                  {
                    method: 'card',
                  },
                ],
              },
              other: {
                name: 'Other Payment Methods',
                instruments: [
                  { method: 'netbanking' },
                  { method: 'wallet' },
                ],
              },
            },
            sequence: ['block.upi', 'block.card', 'block.other'], // UPI first
            preferences: {
              show_default_blocks: true, // Show all available UPI apps
            },
          },
        },
        
        handler: async function (response) {
          try {
            console.log('Payment completed, verifying...');
            
            // Verify payment
            const verifyResponse = await axios.post(`${API_URL}/api/payment/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            if (!verifyResponse.data.success) {
              throw new Error(verifyResponse.data.message || 'Payment verification failed');
            }

            console.log('Payment verified successfully');
            alert('Payment successful! Your order has been placed.');
            
            // Clear cart after successful payment
            setCartItems([]);
            localStorage.setItem('cart', JSON.stringify([]));
            window.dispatchEvent(new Event('cartUpdated'));
            navigate('/customer/dashboard');
          } catch (error) {
            console.error('Payment verification error:', error);
            alert(
              'Payment completed but verification failed.\n\n' +
              'If money was deducted, please contact support with:\n' +
              '- Payment ID: ' + (response.razorpay_payment_id || 'Not available') + '\n' +
              '- Order ID: ' + (response.razorpay_order_id || 'Not available')
            );
          }
        },
        prefill: {
          name: customerProfile?.name || '',
          email: customerProfile?.email || '',
          contact: customerProfile?.phone || ''
        },
        theme: {
          color: '#9333ea' // Purple color matching your theme
        },
        modal: {
          ondismiss: function() {
            console.log('Payment cancelled by user');
            alert('Payment cancelled. Your cart items are still saved.');
          },
          confirm_close: true
        },
        retry: {
          enabled: true,
          max_count: 3
        },
        timeout: 600 // 10 minutes timeout
      };

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      
      razorpay.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error);
        alert(
          'Payment failed!\n\n' +
          'Reason: ' + (response.error.description || response.error.reason || 'Unknown error') + '\n\n' +
          'Please try again or contact support if the issue persists.'
        );
      });
      
      razorpay.open();
    } catch (error) {
      console.error('Payment error:', error);
      alert('Failed to initiate payment: ' + (error.message || 'Unknown error') + '\n\nPlease try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-black shadow-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-3">
            {/* Left - Back button and Title */}
            <div className="flex items-center gap-3 flex-1">
              <button
                onClick={() => navigate('/customer/dashboard')}
                className="p-2 hover:bg-gray-800 rounded-xl transition-all active:scale-95"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </button>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white">My Cart</h1>
                <p className="text-xs text-white/90">Deliver to {universityName || 'Your Location'}</p>
              </div>
            </div>
            
            {/* Right - Search and Share icons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/customer/search')}
                className="p-2 hover:bg-gray-800 rounded-xl transition-all active:scale-95"
              >
                <Search className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={handleShareCart}
                className="p-2 hover:bg-gray-800 rounded-xl transition-all active:scale-95"
              >
                <Share2 className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {cartItems.length === 0 ? (
          // Empty Cart State
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl shadow-md">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <ShoppingCart className="w-12 h-12 text-black" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Cart is Empty</h2>
            <p className="text-gray-500 mb-6 text-center max-w-md">
              Add some items to your cart and start shopping!
            </p>
            <button
              onClick={() => navigate('/customer/dashboard')}
              className="px-8 py-3 bg-black hover:bg-gray-800 text-white rounded-xl font-semibold transition-all shadow-md"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <>
            {/* Cart Items Section */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Your Items ({cartItems.length} {cartItems.length === 1 ? 'product' : 'products'})</h2>
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 pb-4 border-b border-gray-100 last:border-0"
                  >
                    {/* Image */}
                    <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {item.image ? (
                        <img 
                          loading="lazy"
                          src={item.image} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl">{item.emoji || '🍇'}</span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-1">{item.name}</h3>
                      <div className="flex items-center gap-2">
                        {item.vitamin && (
                          <span className="inline-block bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                            {item.vitamin}
                          </span>
                        )}
                        {item.numberOfDays && (
                          <span className="inline-block bg-gray-800 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {item.numberOfDays} Days
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity Controls and Price - Right Side */}
                    <div className="flex flex-col items-end gap-2">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1 bg-black rounded-md h-10 w-28">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-8 h-full hover:bg-gray-800 rounded flex items-center justify-center transition-all"
                        >
                          <Minus className="w-3 h-3 text-white" />
                        </button>
                        <span className="font-bold text-white text-sm flex-1 text-center">
                          {item.quantity || 1}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-8 h-full hover:bg-gray-800 rounded flex items-center justify-center transition-all"
                        >
                          <Plus className="w-3 h-3 text-white" />
                        </button>
                      </div>

                      {/* Price below quantity controls */}
                      <div className="flex items-center gap-2">
                        {item.originalPrice && (
                          <p className="text-sm text-gray-400 line-through">₹{item.originalPrice}</p>
                        )}
                        <p className="text-lg font-bold text-black">₹{item.price}</p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {item.numberOfDays 
                          ? 'total' 
                          : '/ 1 plate'
                        }
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bill Details */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Bill Details</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <div className="flex items-center gap-2">
                    <span>Item Total</span>
                    {cartItems.some(item => item.originalPrice) && (() => {
                      const totalSavings = cartItems.reduce((sum, item) => {
                        const savings = (item.originalPrice || item.price) - item.price;
                        return sum + (savings * (item.quantity || 1));
                      }, 0);
                      return totalSavings > 0 ? (
                        <span className="text-green-600 font-semibold text-sm">You save ₹{totalSavings}</span>
                      ) : null;
                    })()}
                  </div>
                  <div className="flex items-center gap-2">
                    {cartItems.some(item => item.originalPrice) && (
                      <span className="text-gray-400 line-through text-sm">
                        ₹{cartItems.reduce((sum, item) => sum + ((item.originalPrice || item.price) * (item.quantity || 1)), 0)}
                      </span>
                    )}
                    <span className="font-semibold">₹{calculateSubtotal()}</span>
                  </div>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Handling Charge</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 line-through text-sm">₹4</span>
                    <span className="font-semibold text-green-600">FREE</span>
                  </div>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 line-through text-sm">₹16</span>
                    <span className="font-semibold text-green-600">FREE</span>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-bold text-gray-800">
                  <span>Total Amount</span>
                  <span className="text-black">₹{calculateSubtotal()}</span>
                </div>
              </div>
            </div>


          </>
        )}
      </div>

      {/* Fixed Footer - Proceed to Pay */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
            {/* Left - Total (up to middle) */}
            <div className="flex-1 text-left">
              <p className="text-sm text-gray-600 font-medium">Total</p>
              <p className="text-2xl font-bold text-black">₹{calculateTotal()}</p>
            </div>

            {/* Right - Proceed to Pay Button */}
            <button
              onClick={() => {
                if (!customerId) {
                  alert('Please login to proceed with checkout');
                  navigate('/customer/login');
                  return;
                }
                navigate('/checkout');
              }}
              className="flex-1 bg-black hover:bg-gray-800 text-white py-4 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>Proceed to Pay</span>
              <ChevronRight className="w-5 h-5" />
              <ChevronRight className="w-5 h-5 -ml-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CartPage;
