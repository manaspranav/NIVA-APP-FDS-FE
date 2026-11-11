import React, { useState, useEffect, useCallback } from 'react';
import { useRestaurantAuth } from '../../contexts/RestaurantAuthContext';
import LoadingSpinner from './LoadingSpinner';
import ErrorBanner from './ErrorBanner';
import EmptyState from './EmptyState';

/**
 * Status badge color mapping for order statuses.
 */
const STATUS_CONFIG = {
  pending: { label: 'Pending', bg: 'bg-yellow-100', text: 'text-yellow-800' },
  accepted: { label: 'Accepted', bg: 'bg-blue-100', text: 'text-blue-800' },
  preparing: { label: 'Preparing', bg: 'bg-purple-100', text: 'text-purple-800' },
  ready_for_pickup: { label: 'Ready for Pickup', bg: 'bg-green-100', text: 'text-green-800' },
  cancelled: { label: 'Cancelled', bg: 'bg-red-100', text: 'text-red-800' },
};

/**
 * Allowed next status transitions for the Restaurant Owner role.
 * Maps current status to an array of { target, label } action objects.
 */
const ALLOWED_TRANSITIONS = {
  pending: [
    { target: 'accepted', label: 'Accept' },
    { target: 'cancelled', label: 'Cancel' },
  ],
  accepted: [
    { target: 'preparing', label: 'Start Preparing' },
  ],
  preparing: [
    { target: 'ready_for_pickup', label: 'Ready for Pickup' },
  ],
};

/**
 * Formats an ISO timestamp into a human-readable string.
 */
function formatOrderTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isToday) {
    return `Today, ${timeStr}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday, ${timeStr}`;
  }

  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`;
}

/**
 * Shortens a UUID-style order ID for display.
 */
function shortenOrderId(id) {
  if (!id) return '';
  return `#${id.slice(0, 8).toUpperCase()}`;
}

/**
 * OrdersTab component for the Restaurant Partner Portal.
 * Fetches and displays hostel delivery orders with status management.
 *
 * - Fetches orders from /api/restaurant-portal/orders
 * - Displays order cards with ID, customer, room, items, notes, status, time
 * - Never displays monetary fields
 * - Shows action buttons for allowed status transitions
 * - Supports loading, error, and empty states
 */
function OrdersTab() {
  const { authenticatedFetch } = useRestaurantAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authenticatedFetch('/api/restaurant-portal/orders');
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || data.error || 'Failed to fetch orders');
      }
      const data = await response.json();
      // Orders come pre-sorted from API (newest first), but ensure sort client-side as well
      const sortedOrders = (data.orders || data || []).sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setOrders(sortedOrders);
    } catch (err) {
      if (err.message !== 'Session expired' && err.message !== 'No active session') {
        setError(err.message || 'Failed to load orders');
      }
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  /**
   * Updates an order's status via the API and refreshes the list.
   */
  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    try {
      const response = await authenticatedFetch(`/api/restaurant-portal/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || data.error || 'Failed to update order status');
      }
      // Refresh orders list after successful update
      await fetchOrders();
    } catch (err) {
      if (err.message !== 'Session expired' && err.message !== 'No active session') {
        setError(err.message || 'Failed to update order');
      }
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Loading state
  if (loading) {
    return <LoadingSpinner message="Loading orders..." />;
  }

  // Error state
  if (error) {
    return <ErrorBanner message={error} onRetry={fetchOrders} />;
  }

  // Empty state
  if (orders.length === 0) {
    return (
      <EmptyState
        title="No orders yet"
        message="Hostel delivery orders for your restaurant will appear here."
      />
    );
  }

  return (
    <div className="px-4 py-4 space-y-4">
      <h2 className="text-lg font-bold text-gray-800">Orders</h2>

      {orders.map((order) => {
        const statusConfig = STATUS_CONFIG[order.status] || {
          label: order.status,
          bg: 'bg-gray-100',
          text: 'text-gray-800',
        };
        const transitions = ALLOWED_TRANSITIONS[order.status] || [];
        const isUpdating = updatingOrderId === order.id;
        const items = Array.isArray(order.items)
          ? order.items
          : typeof order.items === 'string'
            ? JSON.parse(order.items)
            : [];

        return (
          <div
            key={order.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
          >
            {/* Header: Order ID + Status badge */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-700">
                {shortenOrderId(order.id)}
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}
              >
                {statusConfig.label}
              </span>
            </div>

            {/* Customer info */}
            <div className="mb-3 space-y-1">
              {order.customer_name && (
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Customer:</span> {order.customer_name}
                </p>
              )}
              {order.room_number && (
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Room:</span> {order.room_number}
                </p>
              )}
            </div>

            {/* Items list */}
            {items.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Items
                </p>
                <ul className="space-y-0.5">
                  {items.map((item, idx) => (
                    <li key={idx} className="text-sm text-gray-700">
                      {item.name} × {item.quantity}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Order time */}
            <p className="text-xs text-gray-400 mb-3">
              {formatOrderTime(order.created_at)}
            </p>

            {/* Action buttons */}
            {transitions.length > 0 && (
              <div className="flex gap-2 pt-2 border-t border-gray-100">
                {transitions.map((transition) => {
                  const isCancel = transition.target === 'cancelled';
                  return (
                    <button
                      key={transition.target}
                      onClick={() => handleStatusUpdate(order.id, transition.target)}
                      disabled={isUpdating}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
                        isCancel
                          ? 'bg-red-50 text-red-600 hover:bg-red-100 active:bg-red-200'
                          : 'bg-orange-50 text-orange-600 hover:bg-orange-100 active:bg-orange-200'
                      }`}
                      aria-label={`${transition.label} order ${shortenOrderId(order.id)}`}
                    >
                      {isUpdating ? (
                        <span className="inline-flex items-center gap-1">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Updating...
                        </span>
                      ) : (
                        transition.label
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default OrdersTab;
