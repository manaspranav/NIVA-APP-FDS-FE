import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function getVendorAuth() {
  try {
    return JSON.parse(localStorage.getItem('vendorAuth') || 'null');
  } catch {
    return null;
  }
}

export default function VendorDashboard() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [auth, setAuth] = useState(getVendorAuth);
  const [orders, setOrders] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const headers = useCallback(() => {
    const a = getVendorAuth();
    return {
      'Content-Type': 'application/json',
      'X-Vendor-Id': a?.id || '',
      'X-Vendor-Token': a?.token || '',
    };
  }, []);

  const load = useCallback(async () => {
    const a = getVendorAuth();
    if (!a || a.slug !== slug) {
      navigate('/vendor/login');
      return;
    }
    try {
      const [ordRes, setRes] = await Promise.all([
        fetch(`${API_URL}/api/vendors/${slug}/orders`, { headers: headers() }),
        fetch(`${API_URL}/api/vendors/${slug}`),
      ]);
      const ordData = await ordRes.json();
      const venData = await setRes.json();
      if (ordData.success) setOrders(ordData.orders || []);
      if (venData.success) setSettings(venData.vendor?.settings || {});
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [slug, navigate, headers]);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  const updateSettings = async (patch) => {
    const res = await fetch(`${API_URL}/api/vendors/${slug}/settings`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (data.success) setSettings(data.settings);
  };

  const setOrderStatus = async (orderId, status) => {
    await fetch(`${API_URL}/api/vendors/${slug}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({ status }),
    });
    load();
  };

  const logout = () => {
    localStorage.removeItem('vendorAuth');
    navigate('/vendor/login');
  };

  if (!auth) return null;

  const s = settings || {};

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4 flex justify-between items-center">
        <div>
          <h1 className="font-semibold text-gray-900">{auth.name}</h1>
          <p className="text-xs text-gray-500">Vendor panel</p>
        </div>
        <button type="button" onClick={logout} className="text-sm text-gray-600">
          Logout
        </button>
      </header>

      <main className="max-w-3xl mx-auto p-4 space-y-6">
        <section className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Availability</h2>
          <div className="space-y-2 text-sm">
            {[
              ['isOpen', 'Restaurant open', s.is_open !== false],
              ['acceptingOrders', 'Accepting orders', s.accepting_orders !== false],
              ['lunchSlotActive', 'Lunch slot (12–2 PM)', s.lunch_slot_active !== false],
              ['eveningSlotActive', 'Evening slot (6:30–9 PM)', s.evening_slot_active !== false],
              ['lunchRoomDeliveryActive', 'Lunch room delivery', s.lunch_room_delivery_active !== false],
              ['eveningRoomDeliveryActive', 'Evening room delivery', s.evening_room_delivery_active !== false],
            ].map(([key, label, on]) => (
              <label key={key} className="flex items-center justify-between py-1">
                <span>{label}</span>
                <input
                  type="checkbox"
                  checked={on}
                  onChange={(e) => {
                    const map = {
                      isOpen: 'isOpen',
                      acceptingOrders: 'acceptingOrders',
                      lunchSlotActive: 'lunchSlotActive',
                      eveningSlotActive: 'eveningSlotActive',
                      lunchRoomDeliveryActive: 'lunchRoomDeliveryActive',
                      eveningRoomDeliveryActive: 'eveningRoomDeliveryActive',
                    };
                    updateSettings({ [map[key]]: e.target.checked });
                  }}
                />
              </label>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Orders</h2>
          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : orders.length === 0 ? (
            <p className="text-sm text-gray-500">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex justify-between text-sm">
                    <span className="font-mono text-xs">#{String(order.id).slice(0, 8)}</span>
                    <span className="font-medium capitalize">{order.status}</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{order.customer_name}</p>
                  <p className="text-sm font-semibold mt-1">₹{order.total_amount}</p>
                  {order.delivery_slot && (
                    <p className="text-xs text-gray-500 mt-1">{order.delivery_slot}</p>
                  )}
                  {order.delivery_type === 'room' && (
                    <p className="text-xs text-gray-500 mt-1">
                      {order.hostel_name}
                      {order.room_number ? ` · Room ${order.room_number}` : ''}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {order.status === 'placed' && (
                      <>
                        <button
                          type="button"
                          className="text-xs px-2 py-1 bg-gray-900 text-white rounded"
                          onClick={() => setOrderStatus(order.id, 'preparing')}
                        >
                          Accept / Preparing
                        </button>
                        <button
                          type="button"
                          className="text-xs px-2 py-1 border border-red-300 text-red-700 rounded"
                          onClick={() => setOrderStatus(order.id, 'rejected')}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {order.status === 'preparing' && (
                      <button
                        type="button"
                        className="text-xs px-2 py-1 bg-gray-900 text-white rounded"
                        onClick={() => setOrderStatus(order.id, 'ready')}
                      >
                        Ready
                      </button>
                    )}
                    {order.status === 'ready' && (
                      <button
                        type="button"
                        className="text-xs px-2 py-1 bg-green-700 text-white rounded"
                        onClick={() => setOrderStatus(order.id, 'completed')}
                      >
                        Completed
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
