import React from 'react';

/**
 * Status badge color mapping for visual differentiation.
 */
const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-blue-100 text-blue-800',
  preparing: 'bg-purple-100 text-purple-800',
  ready_for_pickup: 'bg-green-100 text-green-800',
  picked_up: 'bg-teal-100 text-teal-800',
  out_for_delivery: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-800',
};

/**
 * Human-readable status labels.
 */
const STATUS_LABELS = {
  pending: 'Pending',
  accepted: 'Accepted',
  preparing: 'Preparing',
  ready_for_pickup: 'Ready for Pickup',
  picked_up: 'Picked Up',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

/**
 * Status timeline entries in order of progression.
 * Only timestamps that are filled (non-null) will be displayed.
 */
const TIMELINE_STEPS = [
  { key: 'created_at', label: 'Order Placed' },
  { key: 'accepted_at', label: 'Accepted' },
  { key: 'preparing_at', label: 'Preparing' },
  { key: 'ready_for_pickup_at', label: 'Ready for Pickup' },
];

/**
 * Formats a timestamp to a localized, readable string.
 */
function formatTimestamp(ts) {
  if (!ts) return null;
  const date = new Date(ts);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * OrderDetailCard — Expanded view of a single order.
 *
 * Displays full order details including items list, room number,
 * notes, status timeline, and action buttons for status transitions.
 * Never displays any monetary fields (price, total, fees, etc.).
 *
 * @param {object} order - The order object
 * @param {function} onStatusUpdate - Callback: (orderId, newStatus) => void
 */
function OrderDetailCard({ order, onStatusUpdate }) {
  if (!order) return null;

  const statusColor = STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700';
  const statusLabel = STATUS_LABELS[order.status] || order.status;

  // Parse items if they arrive as a JSON string
  const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items || [];

  // Build timeline entries from filled timestamps
  const timelineEntries = TIMELINE_STEPS
    .filter((step) => order[step.key])
    .map((step) => ({
      label: step.label,
      time: formatTimestamp(order[step.key]),
    }));

  // Determine available action buttons based on current status
  const renderActions = () => {
    switch (order.status) {
      case 'pending':
        return (
          <div className="flex gap-3">
            <button
              onClick={() => onStatusUpdate(order.id, 'accepted')}
              className="flex-1 bg-green-600 text-white text-sm font-medium py-2.5 px-4 rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
              aria-label="Accept order"
            >
              Accept Order
            </button>
            <button
              onClick={() => onStatusUpdate(order.id, 'cancelled')}
              className="flex-1 bg-red-600 text-white text-sm font-medium py-2.5 px-4 rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
              aria-label="Cancel order"
            >
              Cancel Order
            </button>
          </div>
        );
      case 'accepted':
        return (
          <button
            onClick={() => onStatusUpdate(order.id, 'preparing')}
            className="w-full bg-purple-600 text-white text-sm font-medium py-2.5 px-4 rounded-lg hover:bg-purple-700 active:bg-purple-800 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1"
            aria-label="Start preparing order"
          >
            Start Preparing
          </button>
        );
      case 'preparing':
        return (
          <button
            onClick={() => onStatusUpdate(order.id, 'ready_for_pickup')}
            className="w-full bg-green-600 text-white text-sm font-medium py-2.5 px-4 rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
            aria-label="Mark order ready for pickup"
          >
            Mark Ready for Pickup
          </button>
        );
      default:
        // No actions for completed states (ready_for_pickup, picked_up, delivered, cancelled)
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header: Order ID and Status Badge */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">
          #{order.id ? order.id.slice(0, 8) : 'N/A'}
        </span>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor}`}>
          {statusLabel}
        </span>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-4">
        {/* Customer and Room Info */}
        <div className="space-y-1">
          {order.customer_name && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-sm text-gray-700">{order.customer_name}</span>
            </div>
          )}
          {order.hostel_room && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="text-sm text-gray-700">Room {order.hostel_room}</span>
            </div>
          )}
        </div>

        {/* Items List */}
        {items.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Items</h4>
            <ul className="space-y-1.5" aria-label="Order items">
              {items.map((item, index) => (
                <li key={index} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{item.name}</span>
                  <span className="text-gray-500 font-medium">×{item.quantity}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Order Notes */}
        {order.order_notes && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</h4>
            <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
              {order.order_notes}
            </p>
          </div>
        )}

        {/* Status Timeline */}
        {timelineEntries.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Timeline</h4>
            <div className="relative pl-4" aria-label="Order status timeline">
              {/* Vertical line */}
              <div className="absolute left-[7px] top-1 bottom-1 w-0.5 bg-gray-200" aria-hidden="true"></div>
              <ul className="space-y-3">
                {timelineEntries.map((entry, index) => (
                  <li key={index} className="relative flex items-start gap-3">
                    {/* Dot */}
                    <div
                      className={`absolute -left-4 top-1 w-3 h-3 rounded-full border-2 ${
                        index === timelineEntries.length - 1
                          ? 'bg-orange-500 border-orange-500'
                          : 'bg-white border-gray-300'
                      }`}
                      aria-hidden="true"
                    ></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700">{entry.label}</p>
                      <p className="text-xs text-gray-400">{entry.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {renderActions() && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
          {renderActions()}
        </div>
      )}
    </div>
  );
}

export default OrderDetailCard;
