import { DEFAULT_VENDOR_ID } from '../data/vendors';

const CART_KEY = 'cart';
const CART_META_KEY = 'cartMeta';

export function getCartMeta() {
  try {
    const raw = localStorage.getItem(CART_META_KEY);
    if (!raw) return { vendorId: DEFAULT_VENDOR_ID };
    return JSON.parse(raw);
  } catch {
    return { vendorId: DEFAULT_VENDOR_ID };
  }
}

export function getCartItems() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getCartVendorId() {
  return getCartMeta().vendorId || DEFAULT_VENDOR_ID;
}

export function setCart(vendorId, items) {
  localStorage.setItem(CART_META_KEY, JSON.stringify({ vendorId, updatedAt: Date.now() }));
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event('cartUpdated'));
}

export function clearCart() {
  localStorage.removeItem(CART_KEY);
  localStorage.removeItem(CART_META_KEY);
  window.dispatchEvent(new Event('cartUpdated'));
}

/**
 * Add item — clears cart if switching vendors (caller may confirm first).
 */
export function addToCart(vendorId, item, quantity = 1) {
  const meta = getCartMeta();
  let items = getCartItems();

  if (meta.vendorId && meta.vendorId !== vendorId && items.length > 0) {
    return { ok: false, reason: 'vendor_mismatch', currentVendorId: meta.vendorId };
  }

  const existing = items.find((i) => i.id === item.id && (i.vendorId || meta.vendorId) === vendorId);
  if (existing) {
    existing.quantity = (existing.quantity || 1) + quantity;
  } else {
    items.push({
      ...item,
      vendorId,
      quantity,
      productType: item.productType || item.type,
    });
  }

  setCart(vendorId, items);
  return { ok: true, items };
}

export function replaceCartVendor(vendorId, items = []) {
  setCart(vendorId, items);
}
