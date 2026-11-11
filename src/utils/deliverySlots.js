// ============================================================
// DELIVERY SLOT UTILITY
// ============================================================
// Shared logic for delivery slot selection and validation.
// Used by CheckoutPage and any other component needing slot logic.
//
// Both slots are always available for all fast-food items.
// ============================================================

const ALL_SLOTS = [
  { id: 'slot-12-2', label: '12:00 PM – 2:00 PM', value: '12:00 PM - 2:00 PM' },
  { id: 'slot-630-9', label: '6:30 PM – 9:00 PM', value: '6:30 PM - 9:00 PM' }
];

/**
 * Return all available delivery slots.
 * Both slots are always available.
 *
 * @param {Array} cartItems
 * @returns {{ slots: Array, hasEveningOnlyItem: boolean }}
 */
export const getAvailableSlots = (cartItems = []) => {
  return {
    slots: [...ALL_SLOTS]
  };
};

/**
 * Validate that a selected slot is valid.
 * @returns {{ valid: boolean, message?: string }}
 */
export const validateSlotForCart = (selectedSlot, cartItems = []) => {
  if (!selectedSlot) {
    return { valid: false, message: 'Please select a delivery slot.' };
  }

  const validValues = ALL_SLOTS.map(s => s.value);
  if (!validValues.includes(selectedSlot)) {
    return { valid: false, message: 'Invalid delivery slot.' };
  }

  return { valid: true };
};

/**
 * Get today's date formatted as YYYY-MM-DD (default delivery date).
 */
export const getNextDeliveryDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

/**
 * Format a delivery date for display (DD/MM/YYYY).
 */
export const formatDeliveryDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'N/A';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};
