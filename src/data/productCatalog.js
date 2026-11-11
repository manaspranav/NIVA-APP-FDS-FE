/**
 * Unified hardcoded catalog — all vendors.
 */
import nivaMenu from './menus/nivaFastfoodsMenu';
import lhkMenu from './menus/localHomeKitchenMenu';
import { getVendorBySlug } from './vendors';

const MENUS_BY_VENDOR = {
  'niva-fastfoods': nivaMenu,
  'local-home-kitchen': lhkMenu,
};

export function getMenuByVendorId(vendorId) {
  return MENUS_BY_VENDOR[vendorId] || [];
}

export function getMenuByVendorSlug(slug) {
  const vendor = getVendorBySlug(slug);
  if (!vendor) return [];
  return getMenuByVendorId(vendor.id);
}

export function getProductByVendorAndId(vendorId, productId) {
  const menu = getMenuByVendorId(vendorId);
  return menu.find((p) => p.id === parseInt(productId, 10)) || null;
}

export function getAllProductsForVendor(vendorId) {
  return getMenuByVendorId(vendorId);
}

/** Search within one vendor */
export function searchVendorProducts(vendorId, query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return [];
  return getMenuByVendorId(vendorId).filter(
    (item) =>
      item.name?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q)
  );
}

/** Legacy: all NIVA fastfoods */
export function getLegacyFastfoods() {
  return nivaMenu;
}

export { nivaMenu, lhkMenu };
