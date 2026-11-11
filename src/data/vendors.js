/**
 * Restaurant / vendor registry (hardcoded — no DB for menus).
 */
export const VENDORS = [
  {
    id: 'niva-fastfoods',
    slug: 'niva-fastfoods',
    name: 'NIVA Fast Foods',
    tagline: 'Biryani, fried rice, noodles & more',
    description: 'Campus favourite — fresh fast food with scheduled delivery slots.',
    bannerImage: '/BIryani/DumBiryani.png',
    logoImage: '/BIryani/DumBiryani.png',
    supportsRoomDelivery: true,
    supportsScheduledSlots: true,
    isDefault: true,
    productType: 'fastfood',
    menuRoute: '/customer/dashboard',
  },
  {
    id: 'local-home-kitchen',
    slug: 'local-home-kitchen',
    name: 'Local Home Kitchen',
    tagline: 'Homestyle meals from a local kitchen',
    description: 'Comfort food — biryani, meals, curries and snacks made at home.',
    bannerImage: '/restaurants/local-home-kitchen/banner.jpg',
    logoImage: '/restaurants/local-home-kitchen/logo.jpg',
    supportsRoomDelivery: true,
    supportsScheduledSlots: true,
    isDefault: false,
    productType: 'homekitchen',
    menuRoute: '/restaurant/local-home-kitchen',
  },
];

export const DEFAULT_VENDOR_ID = 'niva-fastfoods';

export function getVendorById(id) {
  return VENDORS.find((v) => v.id === id) || null;
}

export function getVendorBySlug(slug) {
  return VENDORS.find((v) => v.slug === slug) || null;
}

export function getAllVendors() {
  return VENDORS.filter((v) => v.isDefault !== false || v.id !== 'hidden');
}
