import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { customerSupabase as supabase } from '../customerSupabase';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' } };
  }
  return { headers: { 'Content-Type': 'application/json' } };
};

function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        localStorage.removeItem('userId');
        localStorage.removeItem('userRole');
        navigate('/customer/login');
        return;
      }
      localStorage.setItem('userId', session.user.id);
      localStorage.setItem('userRole', 'customer');
      await fetchOrders();
      if (location.state?.fromPayment) {
        pollOrdersAfterPayment(6);
      }
    };
    init();
  }, [navigate, location.state?.fromPayment]);

  const pollOrdersAfterPayment = async (attempts) => {
    for (let i = 1; i <= attempts; i++) {
      await new Promise((r) => setTimeout(r, 1500));
      await fetchOrders();
    }
  };

  useEffect(() => {
    const close = (e) => { if (menuOpen && !e.target.closest('.order-menu')) setMenuOpen(null); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  const fetchOrders = async () => {
    try {
      const customerId = localStorage.getItem('userId');
      const authHeaders = await getAuthHeaders();
      const response = await axios.get(`${API_URL}/api/orders/customer/${customerId}`, authHeaders);
      setOrders(response.data.data || []);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('userId');
        localStorage.removeItem('userRole');
        navigate('/customer/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const fmt = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const fmtDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const statusConfig = {
    placed:           { label: 'Placed',           dot: 'bg-amber-500',  bg: 'bg-amber-50',  text: 'text-amber-700' },
    taken:            { label: 'Accepted',         dot: 'bg-blue-500',   bg: 'bg-blue-50',   text: 'text-blue-700' },
    out_for_delivery: { label: 'Out for Delivery', dot: 'bg-violet-500', bg: 'bg-violet-50', text: 'text-violet-700' },
    delivered:        { label: 'Delivered',         dot: 'bg-green-500',  bg: 'bg-green-50',  text: 'text-green-700' },
  };

  const getStatus = (s) => statusConfig[s] || statusConfig.placed;

  const handleDelete = async (id, status) => {
    if (status !== 'delivered') { alert('You can only delete delivered orders.'); return; }
    if (!window.confirm('Delete this order?')) return;
    try {
      const authHeaders = await getAuthHeaders();
      await axios.delete(`${API_URL}/api/orders/${id}`, authHeaders);
      setOrders(prev => prev.filter(o => o.id !== id));
      setMenuOpen(null);
    } catch (error) {
      if (error.response?.status === 401) { navigate('/customer/login'); }
      else { alert('Failed to delete order.'); }
    }
  };

  const parseItems = (items) => {
    if (!items) return [];
    if (Array.isArray(items)) return items;
    try { return JSON.parse(items); } catch { return []; }
  };

  const isUUID = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id));

  const handleReorder = (items) => {
    if (!items || items.length === 0) return;
    const firstItem = items[0];
    if (isUUID(firstItem.id)) {
      // Admin-added menu item with UUID-based ID: navigate to restaurant menu page
      // so the database-sourced product can be resolved via vendorId
      navigate(`/restaurant/${firstItem.vendorId}/menu`);
    } else {
      // Legacy hardcoded catalog item with numeric ID: keep existing navigation
      navigate(`/product/${firstItem.type || 'fastfood'}/${firstItem.id}`);
    }
  };

  const steps = [
    { key: 'placed', label: 'Order Placed' },
    { key: 'taken', label: 'Accepted' },
    { key: 'out_for_delivery', label: 'Out for Delivery' },
    { key: 'delivered', label: 'Delivered' },
  ];
  const stepIdx = (s) => steps.findIndex(st => st.key === s);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/customer/dashboard')} className="p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-base font-semibold text-gray-900">Your Orders</h1>
          <span className="text-xs text-gray-400 ml-auto">{orders.length} order{orders.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {orders.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-sm">No orders yet</p>
            <button onClick={() => navigate('/customer/dashboard')} className="mt-4 text-sm font-medium text-gray-900 underline underline-offset-2">Browse menu</button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const items = parseItems(order.items);
              const st = getStatus(order.status);

              return (
                <div key={order.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  {/* Header row */}
                  <div className="px-4 pt-3.5 pb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xs font-mono text-gray-400 shrink-0">#{order.id.slice(0, 8).toUpperCase()}</span>
                      {order.vendor_name && (
                        <span className="text-xs font-medium text-gray-700 truncate">{order.vendor_name}</span>
                      )}
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded ${st.bg} ${st.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`}></span>
                        {st.label}
                      </span>
                    </div>
                    <div className="relative order-menu">
                      <button onClick={() => setMenuOpen(menuOpen === order.id ? null : order.id)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="4" r="1.5"/><circle cx="10" cy="10" r="1.5"/><circle cx="10" cy="16" r="1.5"/></svg>
                      </button>
                      {menuOpen === order.id && (
                        <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-30">
                          <button onClick={() => { setTrackingOrder(order); setMenuOpen(null); }} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Track order</button>
                          <button
                            onClick={() => handleDelete(order.id, order.status)}
                            disabled={order.status !== 'delivered'}
                            className={`w-full text-left px-3 py-2 text-sm ${order.status === 'delivered' ? 'text-red-600 hover:bg-red-50' : 'text-gray-300 cursor-not-allowed'}`}
                          >Delete order</button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="px-4 pb-3">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 py-2">
                        {item.image && <img src={item.image} alt={item.name} className="w-11 h-11 rounded-md object-cover bg-gray-100 shrink-0" loading="lazy" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                          <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-medium text-gray-900 shrink-0">₹{item.price * item.quantity}</p>
                      </div>
                    ))}
                  </div>

                  {order.delivery_type === 'room' && (order.hostel_name || order.room_number) && (
                    <p className="mx-4 mb-2 text-xs text-gray-500">
                      {[order.hostel_name, order.room_number && `Room ${order.room_number}`]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  )}

                  <div className="border-t border-gray-100 mx-4"></div>

                  {/* Footer actions */}
                  <div className="border-t border-gray-100 px-4 py-2.5 flex items-center gap-3">
                    <button onClick={() => setTrackingOrder(order)} className="text-xs font-medium text-gray-700 hover:text-gray-900">Track</button>
                    <span className="text-gray-200">|</span>
                    {items[0] && (
                      <button onClick={() => handleReorder(items)} className="text-xs font-medium text-gray-700 hover:text-gray-900">Reorder</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tracking Modal */}
      {trackingOrder && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={() => setTrackingOrder(null)}>
          <div className="bg-white w-full sm:max-w-md sm:rounded-xl rounded-t-xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Order Tracking</p>
                <p className="text-xs text-gray-400 font-mono mt-0.5">#{trackingOrder.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <button onClick={() => setTrackingOrder(null)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="px-5 py-5">
              {steps.map((step, i) => {
                const current = stepIdx(trackingOrder.status);
                const done = i <= current;
                const dateMap = { placed: trackingOrder.placed_at || trackingOrder.order_date, taken: trackingOrder.taken_at, out_for_delivery: trackingOrder.out_for_delivery_at, delivered: trackingOrder.delivered_at };
                const date = dateMap[step.key];
                return (
                  <div key={step.key} className="flex gap-3 pb-6 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${done ? 'bg-gray-900' : 'bg-gray-200'}`}>
                        {done ? (
                          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        )}
                      </div>
                      {i < steps.length - 1 && <div className={`w-px flex-1 min-h-[24px] ${i < current ? 'bg-gray-900' : 'bg-gray-200'}`}></div>}
                    </div>
                    <div className="pt-0.5">
                      <p className={`text-sm font-medium ${done ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
                      {date && <p className="text-xs text-gray-400 mt-0.5">{fmt(date)}</p>}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-gray-100 px-5 py-4 space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-gray-400">Date</span><span className="text-gray-700 font-medium">{fmtDate(trackingOrder.order_date)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Total</span><span className="text-gray-900 font-semibold">₹{trackingOrder.total_amount}</span></div>
              {trackingOrder.delivery_slot && <div className="flex justify-between"><span className="text-gray-400">Slot</span><span className="text-gray-700 font-medium">{trackingOrder.delivery_slot}</span></div>}
              {trackingOrder.delivery_type === 'room' && (
                <div className="mt-2 pt-2 border-t border-gray-100 space-y-2">
                  <p className="text-xs font-semibold text-gray-700">Delivery address</p>
                  {trackingOrder.hostel_name && <div className="flex justify-between"><span className="text-gray-400">Hostel</span><span className="text-gray-700 font-medium">{trackingOrder.hostel_name}</span></div>}
                  {trackingOrder.gate_number && <div className="flex justify-between"><span className="text-gray-400">Gate</span><span className="text-gray-700 font-medium">Gate {trackingOrder.gate_number}</span></div>}
                  {trackingOrder.number_of_packets && <div className="flex justify-between"><span className="text-gray-400">Packets</span><span className="text-gray-700 font-medium">{trackingOrder.number_of_packets}</span></div>}
                  {trackingOrder.room_number && <div className="flex justify-between"><span className="text-gray-400">Room</span><span className="text-gray-700 font-medium">{trackingOrder.room_number}</span></div>}
                  {trackingOrder.room_delivery_charge > 0 && <div className="flex justify-between"><span className="text-gray-400">Delivery Charge</span><span className="text-gray-700 font-medium">₹{trackingOrder.room_delivery_charge}</span></div>}
                  {trackingOrder.vendor_platform && <div className="flex justify-between"><span className="text-gray-400">Platform</span><span className="text-gray-700 font-medium">{trackingOrder.vendor_platform}</span></div>}
                  {trackingOrder.payment_method && <div className="flex justify-between"><span className="text-gray-400">Payment</span><span className="text-gray-700 font-medium">{trackingOrder.payment_method === 'cod' ? 'Pay at Room' : 'Paid Online'}</span></div>}
                </div>
              )}
            </div>

            <div className="px-5 pb-5">
              <button onClick={() => setTrackingOrder(null)} className="w-full py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerOrders;
