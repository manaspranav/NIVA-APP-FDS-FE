import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { customerSupabase as supabase } from '../customerSupabase';
import Footer from '../components/Footer';
import { Plus, Minus } from 'lucide-react';
import { getAvailableSlots, validateSlotForCart, getNextDeliveryDate, formatDeliveryDate } from '../utils/deliverySlots';
import { syncCartWithLatestPrices } from '../utils/cartPriceSync';
import { getRoomDeliveryPrefs, saveRoomDeliveryPrefs } from '../utils/roomDeliveryPrefs';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [customerProfile, setCustomerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState([]);
  const [currentStep, setCurrentStep] = useState(1); // 1: Delivery, 2: Order Summary, 3: Payment
  const [paymentError, setPaymentError] = useState(''); // Add payment error state
  const [isProcessing, setIsProcessing] = useState(false); // Prevent double-click on Pay button

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');

  // Delivery slot state
  const [selectedSlot, setSelectedSlot] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(getNextDeliveryDate());
  const [slotError, setSlotError] = useState('');
  const slotErrorRef = useRef(null);

  // Auto-scroll to slot error when it appears
  useEffect(() => {
    if (slotError && slotErrorRef.current) {
      slotErrorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [slotError]);

  // Room delivery state
  const [deliveryType, setDeliveryType] = useState('normal'); // 'normal' or 'room'
  const [hostelType, setHostelType] = useState(''); // 'girls' or 'boys'
  const [hostelName, setHostelName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [roomDeliveryError, setRoomDeliveryError] = useState('');

  const GIRLS_HOSTELS = ['Narmada', 'Krishna', 'Yamuna', 'Godavari', 'Ganga'];
  const BOYS_HOSTELS = ['Ganga-A', 'Vedhavathi', 'Ganga-B', 'New Hostel'];

  // Calculate room delivery charge based on total cart quantity
  const calculateRoomDeliveryCharge = () => {
    if (deliveryType !== 'room') return 0;
    const totalQty = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
    if (totalQty <= 2) return 29;
    if (totalQty <= 4) return 49;
    if (totalQty <= 6) return 55;
    if (totalQty <= 8) return 59;
    return 65;
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  // Remember room delivery details for this customer (slot/date still chosen each order)
  useEffect(() => {
    if (!user?.id) return;
    saveRoomDeliveryPrefs(user.id, {
      deliveryType,
      hostelType,
      hostelName,
      roomNumber: roomNumber.trim(),
    });
  }, [user?.id, deliveryType, hostelType, hostelName, roomNumber]);

  const checkAuthAndLoadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate('/customer/login', { state: { from: location.pathname } });
        return;
      }

      setUser(session.user);
      const profileData = await fetchCustomerProfile(session.user.id);
      
      if (!profileData) {
        setLoading(false);
        return;
      }

      const savedRoom = getRoomDeliveryPrefs(session.user.id);
      if (savedRoom?.deliveryType === 'room' && savedRoom.hostelType && savedRoom.hostelName) {
        setDeliveryType('room');
        setHostelType(savedRoom.hostelType);
        setHostelName(savedRoom.hostelName);
        setRoomNumber(savedRoom.roomNumber || '');
      }
      
      loadCart();
      setLoading(false);

      // Check for unrecovered payments (e.g., browser crashed after payment but before verify)
      attemptPaymentRecovery(session.user.id);
    } catch (error) {
      navigate('/customer/login');
      setLoading(false);
    }
  };

  /**
   * Attempt to recover a payment that succeeded but whose verify call failed
   * (e.g., browser crash, network failure). Recovery data is saved in localStorage
   * during the payment handler before the verify call.
   */
  const attemptPaymentRecovery = async (userId) => {
    try {
      const pendingPaymentStr = localStorage.getItem('pendingPayment');
      if (!pendingPaymentStr) return;

      const pendingPayment = JSON.parse(pendingPaymentStr);

      // Only recover payments less than 30 minutes old
      const MAX_RECOVERY_AGE = 30 * 60 * 1000; // 30 minutes
      if (Date.now() - pendingPayment.timestamp > MAX_RECOVERY_AGE) {
        localStorage.removeItem('pendingPayment');
        return;
      }

      console.log('🔄 Found unrecovered payment, attempting recovery...');

      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const recoverResponse = await fetch(`${API_URL}/api/payment/recover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: pendingPayment.razorpay_order_id,
          razorpay_payment_id: pendingPayment.razorpay_payment_id,
          customer_id: userId
        })
      });

      const recoverData = await recoverResponse.json();

      if (recoverData.success) {
        console.log('✅ Payment recovered:', recoverData.order?.id, recoverData.recovered ? '(created now)' : '(already existed)');
        localStorage.removeItem('pendingPayment');
        localStorage.removeItem('cart');
        window.dispatchEvent(new Event('cartUpdated'));
        navigate('/customer/orders', { state: { fromPayment: true } });
      } else {
        // Payment wasn't captured — clean up stale recovery data
        console.log('ℹ️ Recovery not needed:', recoverData.message);
        localStorage.removeItem('pendingPayment');
      }
    } catch (err) {
      console.warn('⚠️ Payment recovery check failed:', err.message);
      // Don't remove pendingPayment — webhook may still handle it
    }
  };

  const fetchCustomerProfile = async (userId) => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/customers/${userId}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setCustomerProfile(result.data);
        
        // Check for missing fields and provide specific guidance
        const missingFields = [];
        if (!result.data.name || result.data.name.trim() === '') missingFields.push('Name');
        if (!result.data.email || result.data.email.trim() === '') missingFields.push('Email');
        if (!result.data.phone || result.data.phone.trim() === '') missingFields.push('Phone');
        if (!result.data.college || result.data.college.trim() === '' || result.data.college === 'Select your university') missingFields.push('University');
        
        if (missingFields.length > 0) {
          navigate('/customer/update-profile', { state: { notice: { variant: 'info', title: 'Complete your profile', message: 'Please continue the details to proceed.' } } });
          return null;
        }
        
        return result.data;
      } else {
        navigate('/customer/update-profile', { state: { notice: { variant: 'info', title: 'Complete your profile', message: 'Please continue the details to proceed.' } } });
        return null;
      }
    } catch (error) {
      navigate('/customer/update-profile', { state: { notice: { variant: 'info', title: 'Complete your profile', message: 'Please continue the details to proceed.' } } });
      return null;
    }
  };

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

    // Reset coupon when cart changes
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
    
    if (syncedCart.length === 0) {
      navigate('/customer/dashboard');
      return;
    }
  };

  // Calculate original total (before discount)
  const calculateOriginalTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  // Calculate final total (after discount + room delivery charge)
  const calculateTotal = () => {
    const originalTotal = calculateOriginalTotal();
    let total = originalTotal;
    if (appliedCoupon) {
      total = originalTotal - appliedCoupon.discountAmount;
    }
    return total + calculateRoomDeliveryCharge();
  };

  // Apply coupon handler
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setCouponLoading(true);
    setCouponError('');
    setAppliedCoupon(null);

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/coupon/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          couponCode: couponCode.trim(),
          cartItems: cartItems
        })
      });

      const result = await response.json();

      if (result.success) {
        // New response format with eligibleItems array
        const eligibleProductNames = result.eligibleItems
          ? result.eligibleItems.map(item => item.name).join(', ')
          : result.coupon.applicableProductNames?.join(', ') || result.coupon.productName || 'your items';

        setAppliedCoupon({
          code: result.coupon.code,
          category: result.coupon.category,
          couponType: result.coupon.couponType || result.coupon.category || 'pack',
          applicableProducts: result.coupon.applicableProducts || [],
          applicableProductNames: result.coupon.applicableProductNames || [],
          eligibleItems: result.eligibleItems || [],
          eligibleProductNames: eligibleProductNames,
          discountType: result.coupon.discountType,
          discountValue: result.coupon.discountValue,
          discountAmount: result.pricing.discountAmount,
          eligibleTotal: result.pricing.eligibleTotal,
          originalTotal: result.pricing.originalTotal,
          finalTotal: result.pricing.finalTotal,
          message: result.message,
          // Combo-specific fields
          fixedComboPrice: result.coupon.fixedComboPrice || null,
          numCombos: result.coupon.numCombos || null,
          comboOriginalPricePerSet: result.pricing.comboOriginalPricePerSet || null,
          comboDiscountedTotal: result.pricing.comboDiscountedTotal || null
        });
        setCouponError('');
      } else {
        // Show specific error message with eligible products
        let errorMsg = result.message || 'Invalid coupon code';
        if (result.eligibleProducts && result.eligibleProducts.length > 0) {
          errorMsg = `Coupon valid only for: ${result.eligibleProducts.join(', ')}`;
        }
        setCouponError(errorMsg);
        setAppliedCoupon(null);
      }
    } catch (error) {
      setCouponError('Failed to validate coupon. Please try again.');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  // Remove coupon handler
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const handleProceedToPayment = async () => {
    if (currentStep === 1) {
      // Validate delivery date + slot before moving to Order Summary
      if (!deliveryDate) {
        setSlotError('Please select a delivery date.');
        return;
      }
      const slotValidation = validateSlotForCart(selectedSlot, cartItems);
      if (!slotValidation.valid) {
        setSlotError(slotValidation.message);
        return;
      }

      // Validate room delivery fields
      if (deliveryType === 'room') {
        if (!hostelType) {
          setRoomDeliveryError('Please select a hostel type.');
          return;
        }
        if (!hostelName) {
          setRoomDeliveryError('Please select a hostel.');
          return;
        }
        if (hostelType === 'boys' && !roomNumber.trim()) {
          setRoomDeliveryError('Please enter your room number.');
          return;
        }
        setRoomDeliveryError('');
      }

      // Check backend slot availability (partner may have turned off the slot)
      try {
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_URL}/api/slot-availability`);
        if (res.ok) {
          const data = await res.json();
          const isLunchSlot = selectedSlot === '12:00 PM - 2:00 PM';
          const slotAvailable = isLunchSlot ? data.slots?.lunchSlotActive : data.slots?.eveningSlotActive;
          if (!slotAvailable) {
            setSlotError('This delivery slot is currently unavailable. The owner has stopped taking orders for this slot. Please select another slot or try again later.');
            return;
          }

          // Check room delivery availability for selected slot
          if (deliveryType === 'room') {
            const roomDeliveryAvailable = isLunchSlot ? data.slots?.lunchRoomDeliveryActive : data.slots?.eveningRoomDeliveryActive;
            if (!roomDeliveryAvailable) {
              setSlotError('Room delivery is currently unavailable for this slot. Please select counter pickup or try another slot.');
              return;
            }
          }

          // Check stock availability for cart items
          if (data.stock) {
            const hasBiryani = cartItems.some(item => item.category === 'Biryani');
            const hasFastFoods = cartItems.some(item => item.category !== 'Biryani');
            if (hasBiryani && !data.stock.biryaniActive) {
              setSlotError('Biryani items are currently out of stock. Please remove them from your cart to proceed.');
              return;
            }
            if (hasFastFoods && !data.stock.fastFoodsActive) {
              setSlotError('Fast food items are currently out of stock. Please remove them from your cart to proceed.');
              return;
            }
          }
        }
      } catch (err) {
        // If availability check fails, let the backend catch it during order creation
        console.warn('Slot availability check failed, proceeding:', err.message);
      }

      setSlotError('');
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Move from Order Summary to Payment
      setCurrentStep(3);
    }
  };

  /**
   * ============================================================================
   * SECURE PAYMENT FLOW
   * ============================================================================
   * 
   * SECURITY: Frontend sends ONLY cart item IDs and quantities.
   * The backend fetches actual prices from the database and calculates the total.
   * This prevents price manipulation attacks where users modify the amount.
   * ============================================================================
   */
  const handlePlaceOrder = async () => {
    try {
      // ===== CRITICAL FIX: Prevent double-click race condition =====
      if (isProcessing) {
        console.warn('⚠️ [CHECKOUT] Payment already processing - ignoring duplicate click');
        return; // Ignore double-clicks
      }
      
      setIsProcessing(true); // Lock UI to prevent concurrent payments
      setPaymentError(''); // Clear previous errors
      if (!window.Razorpay) {
        setPaymentError('Payment system is loading. Please wait...');
        setIsProcessing(false);
        window.location.reload();
        return;
      }

      // SECURITY: Always use the key returned by the backend.
      // The backend creates the Razorpay order with its configured key (test or live).
      // Using a different key here causes a 500 "key mismatch" error from Razorpay.
      // DO NOT hardcode a key here.

      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      // ======================================================================
      // SECURE: Send only cart item IDs, product types, and quantities
      // DO NOT send prices - backend will fetch them from database
      // ======================================================================
      const secureCartItems = cartItems.map(item => ({
        id: item.id,
        quantity: item.quantity,
        productType: item.productType || item.type || 'fastfood',
        // Include customization info (for display only, not pricing)
        name: item.name,
        type: item.type
      }));

      // Create Razorpay order - backend calculates price from database
      const orderResponse = await fetch(`${API_URL}/api/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems: secureCartItems,  // Only IDs and quantities
          couponCode: appliedCoupon?.code || null,  // Coupon for server-side validation
          customerId: user.id,
          deliverySlot: selectedSlot,
          deliveryDate: deliveryDate,
          // Room delivery fields
          deliveryType: deliveryType,
          hostelType: deliveryType === 'room' ? hostelType : null,
          hostelName: deliveryType === 'room' ? hostelName : null,
          roomNumber: deliveryType === 'room' && hostelType === 'boys' ? roomNumber.trim() : null,
          roomDeliveryCharge: calculateRoomDeliveryCharge()
        })
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json().catch(() => ({}));
        
        // Handle slot unavailable error specifically
        if (errorData.error_code === 'SLOT_UNAVAILABLE') {
          setCurrentStep(1);
          setSlotError(errorData.message || 'The selected delivery slot is currently unavailable. Please try another slot.');
          setPaymentError('');
          setIsProcessing(false);
          return;
        }
        
        throw new Error(errorData.message || `Server error: ${orderResponse.status}`);
      }

      const orderResult = await orderResponse.json();

      if (!orderResult.success || !orderResult.order) {
        throw new Error(orderResult.message || 'Failed to create payment order');
      }

      const { order, pricing, verifiedItems, key: razorpayKey } = orderResult;

      if (!razorpayKey) {
        setPaymentError('Payment configuration error: key missing from server response. Please contact support.');
        setIsProcessing(false);
        return;
      }

      // Razorpay options with comprehensive error handling
      const options = {
        key: razorpayKey,
        amount: order.amount,  // Server-calculated amount in paise
        currency: order.currency,
        name: 'NIVA',
        description: 'Food Delivery',
        order_id: order.id,
        handler: async function (response) {
          try {
            console.log('========================================================');
            console.log('💳 [PAYMENT] Razorpay handler called — payment succeeded at gateway');
            console.log('💳 [PAYMENT] razorpay_order_id:', response.razorpay_order_id);
            console.log('💳 [PAYMENT] razorpay_payment_id:', response.razorpay_payment_id);
            console.log('💳 [PAYMENT] razorpay_signature:', response.razorpay_signature ? response.razorpay_signature.substring(0, 12) + '...' : 'MISSING');
            console.log('========================================================');
            
            // CRITICAL: Clear any previous payment error from failed attempts.
            // This ensures retry flow is not blocked by stale error state.
            setPaymentError('');

            // ================================================================
            // ATOMIC VERIFY + ORDER CREATION with RETRY LOGIC
            // Send customer/order data WITH the verify request so the backend
            // can create the order in the same transaction as verification.
            // Retries with exponential backoff to handle network failures.
            // ================================================================

            // Save payment info to localStorage for recovery in case of crash
            const recoveryData = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              customer_id: user.id,
              timestamp: Date.now()
            };
            localStorage.setItem('pendingPayment', JSON.stringify(recoveryData));

            const verifyPayload = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              customer_id: user.id,
              customer_name: customerProfile.name,
              customer_email: customerProfile.email,
              customer_phone: customerProfile.phone,
              customer_college: customerProfile.college
            };

            // Retry logic: up to 3 attempts with exponential backoff
            const MAX_RETRIES = 3;
            let verifyResult = null;
            let lastError = null;

            for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
              try {
                console.log(`🔄 [VERIFY] Attempt ${attempt}/${MAX_RETRIES} — calling ${API_URL}/api/payment/verify`);
                console.log(`🔄 [VERIFY] Payload:`, JSON.stringify(verifyPayload, null, 2));
                const verifyResponse = await fetch(`${API_URL}/api/payment/verify`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(verifyPayload)
                });

                console.log(`🔄 [VERIFY] Response status: ${verifyResponse.status}`);
                const data = await verifyResponse.json().catch((parseErr) => {
                  console.error('🔄 [VERIFY] Failed to parse response JSON:', parseErr.message);
                  return {};
                });
                console.log(`🔄 [VERIFY] Response data:`, JSON.stringify(data, null, 2));

                // Success (including duplicate — backend now returns 200 for duplicates)
                if (data.success) {
                  console.log(`✅ [VERIFY] SUCCESS on attempt ${attempt}! Order ID: ${data.order?.id}`);
                  verifyResult = data;
                  break;
                }

                // Non-retryable errors (signature mismatch, amount mismatch)
                if (verifyResponse.status === 400) {
                  console.error(`❌ [VERIFY] Non-retryable error (400): ${data.message}`);
                  lastError = new Error(data.message || 'Payment verification failed');
                  break;
                }

                // Server error — retryable
                lastError = new Error(data.message || `Server error (${verifyResponse.status})`);
                console.warn(`⚠️ [VERIFY] Attempt ${attempt} failed (retryable): ${lastError.message}`);

              } catch (networkError) {
                lastError = networkError;
                console.warn(`⚠️ Verify attempt ${attempt} network error: ${networkError.message}`);
              }

              // Exponential backoff before retry (2s, 4s)
              if (attempt < MAX_RETRIES) {
                await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
              }
            }

            // If all retries failed, try the recovery endpoint as last resort
            if (!verifyResult) {
              console.log('🔄 All verify attempts failed. Trying recovery endpoint...');
              try {
                const recoverResponse = await fetch(`${API_URL}/api/payment/recover`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    customer_id: user.id
                  })
                });
                const recoverData = await recoverResponse.json();
                if (recoverData.success) {
                  verifyResult = recoverData;
                  console.log('✅ Payment recovered via recovery endpoint');
                }
              } catch (recoverError) {
                console.error('❌ Recovery endpoint also failed:', recoverError.message);
              }
            }

            if (!verifyResult?.success) {
              throw lastError || new Error('Payment verification failed after all retries. Your payment was captured — our system will create your order automatically. If not, please contact support.');
            }

            // Success — clean up recovery data
            localStorage.removeItem('pendingPayment');

            console.log('✅ Payment verified & order created:', verifyResult.order?.id, verifyResult.duplicate ? '(duplicate)' : '');

            // Clear cart and redirect
            localStorage.removeItem('cart');
            window.dispatchEvent(new Event('cartUpdated'));
            setIsProcessing(false); // Unlock UI before redirect
            navigate('/customer/orders', { state: { fromPayment: true, paymentId: verifyResult.order?.id } });
          } catch (error) {
            console.error('❌ Payment/Order error:', error);
            // Don't remove pendingPayment from localStorage — recovery can happen on next visit
            setPaymentError(error.message || 'Payment verification failed. Please contact support.');
            setIsProcessing(false); // Unlock UI on error
          }
        },
        prefill: {
          name: customerProfile?.name || '',
          email: customerProfile?.email || '',
          contact: customerProfile?.phone || ''
        },
        theme: {
          color: '#000000'
        },
        modal: {
          ondismiss: function() {
            console.log('💳 Payment modal dismissed by user');
            setPaymentError('');
            setIsProcessing(false);
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
      const razorpayInstance = new window.Razorpay(options);
      
      razorpayInstance.on('payment.failed', function (response) {
        console.error('❌ Payment failed:', response.error);
        setPaymentError(`Payment failed: ${response.error.description || response.error.reason || 'Unknown error'}`);
        setIsProcessing(false); // Unlock UI on failure
      });
      
      razorpayInstance.open();
    } catch (error) {
      console.error('❌ Error initiating payment:', error);
      setPaymentError(`Error initiating payment: ${error.message}`);
      setIsProcessing(false); // Unlock UI on error
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  // Note: Order success screen removed - redirects directly to orders page

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="bg-black text-white shadow-lg sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => currentStep === 1 ? navigate(-1) : setCurrentStep(currentStep - 1)} className="text-white hover:text-gray-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold">Checkout</h1>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            {/* Step 1 */}
            <div className="flex-1 flex flex-col items-center relative">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm z-10 ${
                currentStep >= 1 ? 'bg-black text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                {currentStep > 1 ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : '1'}
              </div>
              <span className="text-xs mt-2 font-medium text-gray-700">Delivery Info</span>
              {currentStep > 1 && <div className="absolute top-5 left-1/2 w-full h-0.5 bg-black -z-0"></div>}
            </div>

            {/* Line 1-2 */}
            <div className={`flex-1 h-0.5 -mt-6 ${currentStep >= 2 ? 'bg-black' : 'bg-gray-300'}`}></div>

            {/* Step 2 */}
            <div className="flex-1 flex flex-col items-center relative">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm z-10 ${
                currentStep >= 2 ? 'bg-black text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                {currentStep > 2 ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : '2'}
              </div>
              <span className="text-xs mt-2 font-medium text-gray-700">Order Summary</span>
            </div>

            {/* Line 2-3 */}
            <div className={`flex-1 h-0.5 -mt-6 ${currentStep >= 3 ? 'bg-black' : 'bg-gray-300'}`}></div>

            {/* Step 3 */}
            <div className="flex-1 flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
                currentStep >= 3 ? 'bg-black text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                3
              </div>
              <span className="text-xs mt-2 font-medium text-gray-700">Payment</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Step 1: Delivery Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            {/* Delivery Date & Slot */}
            <div className="bg-white border-2 border-black rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-bold text-black mb-5">Select Delivery Date</h2>
              <input
                type="date"
                value={deliveryDate}
                min={getNextDeliveryDate()}
                onChange={(e) => { setDeliveryDate(e.target.value); setSlotError(''); }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black text-sm text-black"
              />

              <h2 className="text-lg font-bold text-black mt-6 mb-4">Select Delivery Slot</h2>
              <div className="space-y-2">
                {getAvailableSlots(cartItems).slots.map((slot) => (
                  <label
                    key={slot.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedSlot === slot.value
                        ? 'border-black bg-gray-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="deliverySlot"
                      value={slot.value}
                      checked={selectedSlot === slot.value}
                      onChange={(e) => { setSelectedSlot(e.target.value); setSlotError(''); }}
                      className="w-4 h-4 accent-black"
                    />
                    <span className={`text-sm ${
                      selectedSlot === slot.value ? 'font-semibold text-black' : 'text-gray-700'
                    }`}>
                      {slot.label}
                    </span>
                  </label>
                ))}
              </div>

              {slotError && (
                <div ref={slotErrorRef} className="mt-4 bg-red-50 border-2 border-red-300 rounded-xl p-4 animate-pulse-once">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-red-800 mb-1">Slot Unavailable</h4>
                      <p className="text-sm text-red-700 leading-relaxed">{slotError}</p>
                    </div>
                    <button
                      onClick={() => setSlotError('')}
                      className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Delivery Address */}
            <div className="bg-white border-2 border-black rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-bold text-black mb-5">Delivery Type</h2>

              {/* Normal vs Room radio */}
              <div className="space-y-2 mb-6">
                <label className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors ${deliveryType === 'normal' ? 'border-black bg-gray-50' : 'border-gray-300 hover:border-gray-400'}`}>
                  <input type="radio" name="deliveryType" value="normal" checked={deliveryType === 'normal'} onChange={() => { setDeliveryType('normal'); setHostelType(''); setHostelName(''); setRoomNumber(''); setRoomDeliveryError(''); }} className="w-4 h-4 accent-black" />
                  <div>
                    <span className={`text-sm ${deliveryType === 'normal' ? 'font-semibold text-black' : 'text-gray-700'}`}>Normal Delivery</span>
                    <p className="text-xs text-gray-500 mt-0.5">Delivered to your college gate</p>
                  </div>
                  <span className="ml-auto text-xs text-green-600 font-semibold">FREE</span>
                </label>
                <label className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors ${deliveryType === 'room' ? 'border-black bg-gray-50' : 'border-gray-300 hover:border-gray-400'}`}>
                  <input type="radio" name="deliveryType" value="room" checked={deliveryType === 'room'} onChange={() => { setDeliveryType('room'); setHostelType(''); setHostelName(''); setRoomNumber(''); setRoomDeliveryError(''); }} className="w-4 h-4 accent-black" />
                  <div>
                    <span className={`text-sm ${deliveryType === 'room' ? 'font-semibold text-black' : 'text-gray-700'}`}>Room Delivery</span>
                    <p className="text-xs text-gray-500 mt-0.5">Delivered to your hostel room</p>
                  </div>
                  <span className="ml-auto text-xs text-orange-600 font-semibold">+₹{(() => { const q = cartItems.reduce((s, i) => s + (i.quantity || 1), 0); if (q <= 2) return 29; if (q <= 4) return 49; if (q <= 6) return 55; if (q <= 8) return 59; return 65; })()}</span>
                </label>
              </div>

              {/* Room delivery options */}
              {deliveryType === 'room' && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                  <h3 className="text-sm font-bold text-black">Hostel Details</h3>

                  {/* Hostel type */}
                  <div>
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 block">Hostel Type</label>
                    <div className="flex gap-3">
                      <button onClick={() => { setHostelType('girls'); setHostelName(''); setRoomNumber(''); setRoomDeliveryError(''); }} className={`flex-1 py-2.5 px-4 rounded-lg border-2 text-sm font-semibold transition-colors ${hostelType === 'girls' ? 'border-black bg-black text-white' : 'border-gray-300 text-gray-700 hover:border-gray-400'}`}>
                        Girls Hostel
                      </button>
                      <button onClick={() => { setHostelType('boys'); setHostelName(''); setRoomNumber(''); setRoomDeliveryError(''); }} className={`flex-1 py-2.5 px-4 rounded-lg border-2 text-sm font-semibold transition-colors ${hostelType === 'boys' ? 'border-black bg-black text-white' : 'border-gray-300 text-gray-700 hover:border-gray-400'}`}>
                        Boys Hostel
                      </button>
                    </div>
                  </div>

                  {/* Hostel name selection */}
                  {hostelType && (
                    <div>
                      <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 block">Select Hostel</label>
                      <div className="flex gap-2 flex-wrap">
                        {(hostelType === 'girls' ? GIRLS_HOSTELS : BOYS_HOSTELS).map(h => (
                          <button key={h} onClick={() => { setHostelName(h); setRoomDeliveryError(''); }} className={`py-2 px-5 rounded-lg border-2 text-sm font-semibold transition-colors ${hostelName === h ? 'border-black bg-black text-white' : 'border-gray-300 text-gray-700 hover:border-gray-400'}`}>
                            {h}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Girls hostel message */}
                  {hostelType === 'girls' && hostelName && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <p className="text-sm text-yellow-800">Your order will be delivered to <strong>{hostelName} hostel down</strong>. Please collect it from there.</p>
                      </div>
                    </div>
                  )}

                  {/* Boys hostel room number */}
                  {hostelType === 'boys' && hostelName && (
                    <div>
                      <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 block">Room Number</label>
                      <input
                        type="text"
                        value={roomNumber}
                        onChange={(e) => { setRoomNumber(e.target.value); setRoomDeliveryError(''); }}
                        placeholder="Enter your room number"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black text-sm"
                      />
                    </div>
                  )}

                  {/* Room delivery charge info */}
                  {hostelName && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-blue-800 font-medium">Room Delivery Charge</span>
                        <span className="text-sm font-bold text-blue-900">₹{calculateRoomDeliveryCharge()}</span>
                      </div>
                      <p className="text-xs text-blue-600 mt-1">Based on {cartItems.reduce((s, i) => s + (i.quantity || 1), 0)} item(s) in your cart</p>
                    </div>
                  )}

                  {roomDeliveryError && (
                    <div className="flex items-center gap-2 text-red-600">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span className="text-sm">{roomDeliveryError}</span>
                    </div>
                  )}
                </div>
              )}

              <h2 className="text-lg font-bold text-black mb-5">Delivery Address</h2>

              {customerProfile ? (
                <div className="space-y-4">
                  <div className="border-b border-gray-200 pb-4">
                    <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Full Name</label>
                    <p className="text-base text-black mt-1">{customerProfile.name}</p>
                  </div>

                  <div className="border-b border-gray-200 pb-4">
                    <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Email Address</label>
                    <p className="text-base text-black mt-1 break-all">{customerProfile.email}</p>
                  </div>

                  <div className="border-b border-gray-200 pb-4">
                    <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Phone Number</label>
                    <p className="text-base text-black mt-1">{customerProfile.phone}</p>
                  </div>

                  <div className="pb-2">
                    <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Delivery Location (College)</label>
                    <p className="text-base text-black mt-1">{customerProfile.college}</p>
                  </div>

                  <button
                    onClick={() => navigate('/customer/update-profile')}
                    className="mt-2 text-black border-2 border-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-black hover:text-white transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Information
                  </button>
                </div>
              ) : (
                <p className="text-gray-500">Loading profile...</p>
              )}
            </div>

            <button
              onClick={handleProceedToPayment}
              disabled={!selectedSlot || !deliveryDate || (deliveryType === 'room' && (!hostelType || !hostelName || (hostelType === 'boys' && !roomNumber.trim())))}
              className={`w-full py-4 rounded-lg font-bold text-lg transition-colors ${
                !selectedSlot || !deliveryDate || (deliveryType === 'room' && (!hostelType || !hostelName || (hostelType === 'boys' && !roomNumber.trim())))
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              Proceed to Order Summary
            </button>
          </div>
        )}

        {/* Step 2: Order Summary */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="bg-white border-2 border-black rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-black mb-6">Order Summary</h2>
              
              {/* Coupon Section - Moved to Top */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold mb-3">Have a discount coupon?</h3>

                {!appliedCoupon ? (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter coupon code"
                      className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black uppercase min-w-0"
                      disabled={couponLoading}
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all whitespace-nowrap"
                    >
                      {couponLoading ? 'Applying...' : 'Apply'}
                    </button>
                  </div>
                ) : (
                  <div className="relative overflow-hidden rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 shadow-sm">
                    {/* Decorative left accent */}
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-emerald-500 to-teal-500" />

                    <div className="pl-5 pr-4 py-4">
                      {/* Header row */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-sm font-semibold text-emerald-800 tracking-wide uppercase">Coupon Applied</span>
                        </div>
                        <button
                          onClick={handleRemoveCoupon}
                          className="text-xs text-gray-400 hover:text-red-500 transition-colors font-medium px-2 py-1 rounded hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </div>

                      {appliedCoupon.couponType === 'combo' ? (
                        <>
                          {/* Coupon code tag */}
                          <div className="inline-flex items-center gap-1.5 bg-white border border-emerald-200 rounded-md px-2.5 py-1 mb-3">
                            <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            <span className="font-mono text-sm font-bold text-emerald-700 tracking-wider">{appliedCoupon.code}</span>
                            <span className="text-xs text-emerald-500 font-medium">• Combo Deal</span>
                          </div>

                          {/* Product names */}
                          <p className="text-sm text-gray-600 mb-3">
                            {appliedCoupon.applicableProductNames?.join(' + ')}
                          </p>

                          {/* Pricing breakdown */}
                          <div className="bg-white/60 rounded-lg px-3 py-2.5 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Original</span>
                              <span className="text-sm text-gray-400 line-through">
                                ₹{appliedCoupon.comboOriginalPricePerSet}{appliedCoupon.numCombos > 1 ? ` × ${appliedCoupon.numCombos}` : ''}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-600 font-medium uppercase tracking-wide">Combo Price</span>
                              <span className="text-sm font-bold text-gray-800">
                                ₹{appliedCoupon.fixedComboPrice}{appliedCoupon.numCombos > 1 ? ` × ${appliedCoupon.numCombos} = ₹${appliedCoupon.comboDiscountedTotal}` : ''}
                              </span>
                            </div>
                            <div className="border-t border-emerald-100 pt-1.5 flex items-center justify-between">
                              <span className="text-xs text-emerald-700 font-semibold uppercase tracking-wide">You Save</span>
                              <span className="text-sm font-bold text-emerald-600">₹{appliedCoupon.discountAmount}</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Coupon code tag */}
                          <div className="inline-flex items-center gap-1.5 bg-white border border-emerald-200 rounded-md px-2.5 py-1 mb-3">
                            <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            <span className="font-mono text-sm font-bold text-emerald-700 tracking-wider">{appliedCoupon.code}</span>
                            <span className="text-xs text-emerald-500 font-medium">
                              • {appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.discountValue}% off` : `₹${appliedCoupon.discountValue} off`}
                            </span>
                          </div>

                          {/* Savings */}
                          <div className="bg-white/60 rounded-lg px-3 py-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-emerald-700 font-semibold uppercase tracking-wide">You Save</span>
                              <span className="text-sm font-bold text-emerald-600">₹{appliedCoupon.discountAmount}</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {couponError && (
                  <div className="mt-2 flex items-center gap-2 text-red-600">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm">{couponError}</span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {cartItems.map((item, index) => {
                  const handleIncreaseQuantity = () => {
                    const updatedCart = [...cartItems];
                    updatedCart[index].quantity += 1;
                    setCartItems(updatedCart);
                    localStorage.setItem('cart', JSON.stringify(updatedCart));
                    window.dispatchEvent(new Event('cartUpdated'));
                  };

                  const handleDecreaseQuantity = () => {
                    const updatedCart = [...cartItems];
                    if (updatedCart[index].quantity > 1) {
                      updatedCart[index].quantity -= 1;
                      setCartItems(updatedCart);
                      localStorage.setItem('cart', JSON.stringify(updatedCart));
                      window.dispatchEvent(new Event('cartUpdated'));
                    }
                  };

                  return (
                    <div key={index} className="flex items-start gap-4 pb-4 border-b border-gray-200 last:border-0">
                      <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden border border-gray-300 flex-shrink-0">
                        <img
                          loading="lazy"
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-black text-lg mb-1">{item.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">Fast Food</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleDecreaseQuantity}
                              className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-semibold w-8 text-center">{item.quantity}</span>
                            <button
                              onClick={handleIncreaseQuantity}
                              className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <span className="text-lg font-bold text-black">₹{item.price * item.quantity}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Price Summary */}
              <div className="mt-6 pt-6 border-t-2 border-black">
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>₹{calculateOriginalTotal()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Delivery Fee</span>
                    {deliveryType === 'room' ? (
                      <span className="text-orange-600 font-semibold">₹{calculateRoomDeliveryCharge()}</span>
                    ) : (
                      <span className="text-green-600 font-semibold">FREE</span>
                    )}
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600">
                      <span>
                        {appliedCoupon.couponType === 'combo' 
                          ? `Combo Discount (${appliedCoupon.code})` 
                          : `Discount (${appliedCoupon.code})`}
                      </span>
                      <span>-₹{appliedCoupon.discountAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-2xl font-bold pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <div className="text-right">
                      {appliedCoupon && (
                        <span className="text-base text-gray-400 line-through mr-2">₹{calculateOriginalTotal()}</span>
                      )}
                      <span>₹{calculateTotal()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleProceedToPayment}
              className="w-full bg-black text-white py-4 rounded-lg font-bold text-lg hover:bg-gray-800 transition-colors"
            >
              Proceed to Payment
            </button>
          </div>
        )}

        {/* Step 3: Payment */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="bg-white border-2 border-black rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-black mb-6">Payment Details</h2>
              
              <div className="bg-gray-50 border border-gray-300 rounded-lg p-6 mb-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-black mb-2">Online Payment</h3>
                  <p className="text-gray-600 text-sm">Secure payment gateway</p>
                </div>
              </div>

              {/* Applied Coupon Display */}
              {appliedCoupon && (
                <div className="relative overflow-hidden rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 shadow-sm mb-6">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-teal-500" />
                  <div className="pl-4 pr-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-emerald-700">{appliedCoupon.code}</span>
                          <span className="text-xs text-emerald-600 font-medium">applied</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {appliedCoupon.couponType === 'combo'
                            ? `${appliedCoupon.applicableProductNames?.join(' + ')} combo at ₹${appliedCoupon.fixedComboPrice}`
                            : `Saving ₹${appliedCoupon.discountAmount} on this order`
                          }
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-emerald-600 flex-shrink-0">−₹{appliedCoupon.discountAmount}</span>
                  </div>
                </div>
              )}

              <div className="border-t-2 border-black pt-6">
                <h3 className="font-bold text-black mb-4">Order Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Items</span>
                    <span className="font-semibold text-black">{cartItems.reduce((sum, item) => sum + item.quantity, 0)} items</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Delivery to</span>
                    <span className="font-semibold text-black">{customerProfile?.college}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Delivery Slot</span>
                    <span className="font-semibold text-black">{selectedSlot}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Delivery Date</span>
                    <span className="font-semibold text-black">{formatDeliveryDate(deliveryDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Delivery Type</span>
                    <span className="font-semibold text-black">{deliveryType === 'room' ? 'Room Delivery' : 'Normal Delivery'}</span>
                  </div>
                  {deliveryType === 'room' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Hostel</span>
                        <span className="font-semibold text-black">{hostelName} ({hostelType === 'girls' ? 'Girls' : 'Boys'})</span>
                      </div>
                      {hostelType === 'boys' && roomNumber && (
                        <div className="flex justify-between">
                          <span className="text-gray-700">Room Number</span>
                          <span className="font-semibold text-black">{roomNumber}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-orange-600">
                        <span>Room Delivery Charge</span>
                        <span>+₹{calculateRoomDeliveryCharge()}</span>
                      </div>
                    </>
                  )}
                  {appliedCoupon && (
                    <>
                      <div className="flex justify-between text-gray-600">
                        <span>Original Amount</span>
                        <span className="line-through">₹{calculateOriginalTotal()}</span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>{appliedCoupon.couponType === 'combo' ? 'Combo Discount' : 'Discount'}</span>
                        <span>-₹{appliedCoupon.discountAmount}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between pt-3 border-t border-gray-300">
                    <span className="font-bold text-black text-lg">Amount to Pay</span>
                    <span className="font-bold text-black text-lg">₹{calculateTotal()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-black flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-gray-700">
                  By placing this order, you agree to our terms and conditions. You will receive a confirmation email shortly after your order is confirmed.
                </p>
              </div>
            </div>

            {/* Payment Error Display */}
            {paymentError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-700">{paymentError}</p>
                </div>
              </div>
            )}

            <button
              onClick={handlePlaceOrder}
              disabled={isProcessing}
              className={`w-full bg-black text-white py-4 rounded-lg font-bold text-lg transition-colors shadow-lg ${
                isProcessing 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-gray-800'
              }`}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing Payment...
                </div>
              ) : (
                'Proceed to Payment'
              )}
            </button>
          </div>
        )}
      </div>

      <Footer showFooter={true} />
    </div>
  );
};

export default CheckoutPage;
