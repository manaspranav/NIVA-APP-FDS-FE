import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// Helper function to get auth headers with JWT token
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    };
  }
  return { 'Content-Type': 'application/json' };
};

// Helper function to parse items if they're stored as JSON string
const parseItems = (items) => {
  if (!items) return [];
  if (Array.isArray(items)) return items;
  if (typeof items === 'string') {
    try {
      return JSON.parse(items);
    } catch (error) {
      console.error('Error parsing items:', error);
      return [];
    }
  }
  return [];
};

const OrdersManagement = ({ userRole }) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/api/orders`, { headers });
      const result = await response.json();
      
      if (result.success) {
        setOrders(result.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'placed':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'taken':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'out_for_delivery':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    if (userRole === 'admin') {
      localStorage.removeItem('adminPhone');
      navigate('/sys-x9k3m-auth');
    } else {
      navigate('/dlv-q5n8t-auth');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-black text-white shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="hover:text-gray-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold">{userRole === 'admin' ? 'Admin' : 'Partner'} - Orders</h1>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-all font-semibold"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border-2 border-black rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-600 uppercase">Total Orders</p>
            <p className="text-3xl font-bold text-black mt-1">{orders.length}</p>
          </div>
          <div className="bg-white border-2 border-amber-500 rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-600 uppercase">Placed</p>
            <p className="text-3xl font-bold text-amber-600 mt-1">
              {orders.filter(o => o.status === 'placed').length}
            </p>
          </div>
          <div className="bg-white border-2 border-purple-500 rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-600 uppercase">Out for Delivery</p>
            <p className="text-3xl font-bold text-purple-600 mt-1">
              {orders.filter(o => o.status === 'out_for_delivery').length}
            </p>
          </div>
          <div className="bg-white border-2 border-green-500 rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-600 uppercase">Delivered</p>
            <p className="text-3xl font-bold text-green-600 mt-1">
              {orders.filter(o => o.status === 'delivered').length}
            </p>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white border-2 border-black rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-bold">Order ID</th>
                  <th className="px-4 py-3 text-left text-sm font-bold">Customer</th>
                  <th className="px-4 py-3 text-left text-sm font-bold">College</th>
                  <th className="px-4 py-3 text-left text-sm font-bold">Phone</th>
                  <th className="px-4 py-3 text-left text-sm font-bold">Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-bold">Delivery Slot</th>
                  <th className="px-4 py-3 text-left text-sm font-bold">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-bold">Date</th>
                  <th className="px-4 py-3 text-center text-sm font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                      No orders found
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono text-gray-900">
                        #{order.id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-semibold text-black">{order.customer_name}</div>
                        <div className="text-xs text-gray-600">{order.customer_email}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{order.customer_college}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{order.customer_phone}</td>
                      <td className="px-4 py-3 text-sm font-bold text-black">₹{order.total_amount}</td>
                      <td className="px-4 py-3 text-xs text-gray-900">
                        {order.delivery_slot ? (
                          <div>
                            <div className="font-semibold">{order.delivery_slot}</div>
                            {order.delivery_date && (
                              <div className="mt-0.5 text-gray-500">{new Date(order.delivery_date).toLocaleDateString('en-IN')}</div>
                            )}
                            {order.delivery_type === 'room' && (
                              <div className="mt-0.5 text-purple-600 font-semibold">
                                🏠 {order.hostel_name}
                                {order.gate_number ? ` - Gate ${order.gate_number}` : ''}
                                {order.room_number ? ` - Room ${order.room_number}` : ''}
                              </div>
                            )}
                          </div>
                        ) : order.delivery_type === 'room' ? (
                          <div className="mt-0.5 text-purple-600 font-semibold">
                            🏠 {order.hostel_name}
                            {order.gate_number ? ` - Gate ${order.gate_number}` : ''}
                            {order.room_number ? ` - Room ${order.room_number}` : ''}
                            <br/><span className="text-gray-500 font-normal">Now</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(order.status)}`}>
                          {order.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {formatDate(order.order_date)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => viewOrderDetails(order)}
                          className="bg-black text-white px-3 py-1 rounded text-xs font-semibold hover:bg-gray-800"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-black text-white px-6 py-4 flex justify-between items-center sticky top-0">
              <h2 className="text-xl font-bold">Order Details</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-white hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Order Info */}
              <div>
                <h3 className="text-lg font-bold text-black mb-3">Order Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 font-semibold">Order ID</p>
                    <p className="text-black font-mono">#{selectedOrder.id}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-semibold">Status</p>
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-600 font-semibold">Order Date</p>
                    <p className="text-black">{formatDate(selectedOrder.order_date)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-semibold">Total Amount</p>
                    <p className="text-black font-bold">₹{selectedOrder.total_amount}</p>
                  </div>
                  {selectedOrder.delivery_slot && (
                    <div>
                      <p className="text-gray-600 font-semibold">Delivery Slot</p>
                      <p className="text-black font-semibold">{selectedOrder.delivery_slot}</p>
                    </div>
                  )}
                  {selectedOrder.delivery_date && (
                    <div>
                      <p className="text-gray-600 font-semibold">Delivery Date</p>
                      <p className="text-black">{new Date(selectedOrder.delivery_date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                    </div>
                  )}
                      {selectedOrder.delivery_type === 'room' && (
                        <>
                          <div>
                            <p className="text-gray-600 font-semibold">Delivery Type</p>
                            <p className="text-black font-semibold">🏠 Room Delivery</p>
                          </div>
                          <div>
                            <p className="text-gray-600 font-semibold">Hostel</p>
                            <p className="text-black">{selectedOrder.hostel_name} ({selectedOrder.hostel_type === 'female' ? 'Girls' : 'Boys'})</p>
                          </div>
                          {selectedOrder.gate_number && (
                            <div>
                              <p className="text-gray-600 font-semibold">Gate Number</p>
                              <p className="text-black font-semibold">Gate {selectedOrder.gate_number}</p>
                            </div>
                          )}
                          {selectedOrder.room_number && (
                            <div>
                              <p className="text-gray-600 font-semibold">Room Number</p>
                              <p className="text-black font-semibold">{selectedOrder.room_number}</p>
                            </div>
                          )}
                          {selectedOrder.number_of_packets && (
                            <div>
                              <p className="text-gray-600 font-semibold">Packets</p>
                              <p className="text-black font-semibold">{selectedOrder.number_of_packets}</p>
                            </div>
                          )}
                          {selectedOrder.vendor_platform && (
                            <div>
                              <p className="text-gray-600 font-semibold">Vendor Platform</p>
                              <p className="text-black font-semibold">{selectedOrder.vendor_platform}</p>
                            </div>
                          )}
                          {selectedOrder.payment_method && (
                            <div>
                              <p className="text-gray-600 font-semibold">Payment Method</p>
                              <p className="text-black font-semibold">{selectedOrder.payment_method === 'cod' ? 'Pay at Room (Cash/Online)' : 'Paid Online'}</p>
                            </div>
                          )}
                          {selectedOrder.room_delivery_charge > 0 && (
                            <div>
                              <p className="text-gray-600 font-semibold">Room Delivery Charge</p>
                              <p className="text-black font-bold">₹{selectedOrder.room_delivery_charge}</p>
                            </div>
                          )}
                        </>
                      )}
                </div>
              </div>

              {/* Customer Info */}
              <div className="border-t-2 border-gray-200 pt-6">
                <h3 className="text-lg font-bold text-black mb-3">Customer Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-semibold">Name:</span>
                    <span className="text-black">{selectedOrder.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-semibold">Email:</span>
                    <span className="text-black">{selectedOrder.customer_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-semibold">Phone:</span>
                    <span className="text-black">{selectedOrder.customer_phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-semibold">College:</span>
                    <span className="text-black">{selectedOrder.customer_college}</span>
                  </div>
                </div>
              </div>
              
              {/* Order Tracking */}
              {userRole === 'admin' && (
                <div className="border-t-2 border-gray-200 pt-6">
                  <h3 className="text-lg font-bold text-black mb-4">Order Tracking</h3>
                  <div className="relative">
                    {[
                      { key: 'placed', label: 'Order Placed', date: selectedOrder.placed_at || selectedOrder.order_date },
                      { key: 'taken', label: 'Accepted by Partner', date: selectedOrder.taken_at, partner: selectedOrder.partner_name },
                      { key: 'out_for_delivery', label: 'Out for Delivery', date: selectedOrder.out_for_delivery_at },
                      { key: 'delivered', label: 'Delivered', date: selectedOrder.delivered_at }
                    ].map((step, index, arr) => {
                      const statusOrder = ['placed', 'taken', 'out_for_delivery', 'delivered'];
                      const currentIndex = statusOrder.indexOf(selectedOrder.status);
                      const stepIndex = statusOrder.indexOf(step.key);
                      const isCompleted = stepIndex <= currentIndex;
                      const isActive = selectedOrder.status === step.key;

                      return (
                        <div key={step.key} className="flex items-start mb-6 last:mb-0">
                          {/* Timeline Line */}
                          {index < arr.length - 1 && (
                            <div 
                              className={`absolute left-3 top-8 w-0.5 h-12 ${
                                isCompleted ? 'bg-green-500' : 'bg-gray-300'
                              }`}
                            />
                          )}

                          {/* Icon */}
                          <div className={`relative z-10 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                            isCompleted 
                              ? 'bg-green-500 ring-4 ring-green-100' 
                              : 'bg-gray-300 ring-4 ring-gray-100'
                          } ${isActive ? 'animate-pulse' : ''}`}>
                            {isCompleted && (
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>

                          {/* Content */}
                          <div className="ml-4 flex-1">
                            <div className={`font-semibold ${
                              isCompleted ? 'text-green-700' : 'text-gray-500'
                            } ${isActive ? 'text-purple-700' : ''}`}>
                              {step.label}
                              {isActive && <span className="ml-2 text-sm">(Current)</span>}
                            </div>
                            {step.date && (
                              <div className="text-sm text-gray-600 mt-1">
                                {formatDate(step.date)}
                              </div>
                            )}
                            {step.partner && isCompleted && (
                              <div className="text-sm text-blue-600 mt-1">
                                Partner: {step.partner}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div className="border-t-2 border-gray-200 pt-6">
                <h3 className="text-lg font-bold text-black mb-3">Order Items</h3>
                <div className="space-y-3">
                  {JSON.parse(selectedOrder.items).map((item, index) => (
                    <div key={index} className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <img
                        loading="lazy"
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded border border-gray-300"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-black">{item.name}</h4>
                        <p className="text-xs text-gray-600">Fast Food</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                        <p className="font-bold text-black">₹{item.price * item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 border-2 border-black text-black rounded-lg font-semibold hover:bg-black hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersManagement;
