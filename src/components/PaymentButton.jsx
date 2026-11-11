import React, { useState, useRef } from 'react';
import axios from 'axios';

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Razorpay SDK failed to load'));
    document.body.appendChild(script);
  });
}

/**
 * Production payment button:
 * 1. Backend creates Razorpay order + pending_orders row
 * 2. Razorpay checkout opens
 * 3. On success → verify only (webhook creates order; verify polls + backup)
 * 4. Success page only after verify returns 200
 */
export default function PaymentButton({
  amount,
  currency = 'INR',
  customer = {},
  createOrderPayload = {},
  onSuccess,
  onError,
}) {
  const [loading, setLoading] = useState(false);
  const payingRef = useRef(false);

  const API_URL = process.env.REACT_APP_API_URL || '';

  const handlePayment = async () => {
    if (payingRef.current) return;
    payingRef.current = true;
    setLoading(true);

    try {
      await loadRazorpayScript();

      const createResp = await axios.post(`${API_URL}/api/payment/create-order`, {
        amount,
        currency,
        customerId: customer.id || null,
        ...createOrderPayload,
      });

      const { order, key, success } = createResp.data;
      if (!success || !order?.id || !key) {
        throw new Error(createResp.data?.message || 'Invalid order response from server');
      }

      const options = {
        key,
        amount: order.amount,
        currency: order.currency || currency,
        name: 'NIVA',
        description: 'Order payment',
        order_id: order.id,
        handler: async function (response) {
          try {
            const verifyResp = await axios.post(`${API_URL}/api/payment/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              customer_id: customer.id,
              customer_name: customer.name,
              customer_email: customer.email,
              customer_phone: customer.phone,
            });

            if (verifyResp.data?.success) {
              if (onSuccess) onSuccess(verifyResp.data);
              else window.location.href = '/customer/orders';
            } else {
              const msg =
                verifyResp.data?.message ||
                'Payment verification failed. If money was deducted, your order will appear shortly.';
              if (onError) onError(msg);
              else alert(msg);
            }
          } catch (err) {
            console.error('[PAYMENT] verify error', err);
            const msg =
              err.response?.data?.message ||
              'Verification failed. Payment may still be processing — check Orders in a minute.';
            if (onError) onError(msg);
            else alert(msg);
          } finally {
            payingRef.current = false;
            setLoading(false);
          }
        },
        prefill: {
          name: customer.name || '',
          email: customer.email || '',
          contact: customer.phone || '',
        },
        modal: {
          ondismiss: () => {
            payingRef.current = false;
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp) => {
        payingRef.current = false;
        setLoading(false);
        const msg = resp.error?.description || resp.error?.reason || 'Payment failed';
        if (onError) onError(msg);
        else alert(msg);
      });
      rzp.open();
    } catch (err) {
      console.error('[PAYMENT] flow error', err);
      const msg = err.response?.data?.message || err.message || 'Unable to start payment';
      if (onError) onError(msg);
      else alert(msg);
      payingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handlePayment}
      disabled={loading}
      className="px-6 py-3 bg-black text-white rounded disabled:opacity-50"
    >
      {loading ? 'Processing...' : `Pay ${currency} ${amount}`}
    </button>
  );
}
