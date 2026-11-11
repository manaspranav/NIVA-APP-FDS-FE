/**
 * Room Delivery Utilities
 * Delivery charge calculation and partner earning computation
 * Based on number of packets/items
 */

/**
 * Delivery charge tiers based on number of packets
 * Each tier defines: min packets, max packets, customer charge, partner earning
 */
const DELIVERY_TIERS = [
  { min: 1,  max: 2,  charge: 29, partnerEarning: 20 },
  { min: 3,  max: 4,  charge: 49, partnerEarning: 30 },
  { min: 5,  max: 6,  charge: 55, partnerEarning: 35 },
  { min: 7,  max: 8,  charge: 59, partnerEarning: 40 },
  { min: 9,  max: 50, charge: 69, partnerEarning: 45 }
];

/**
 * Calculate delivery charge based on number of packets
 * @param {number} packets - Number of packets (1-50)
 * @returns {number} Delivery charge in INR
 */
export const calculateDeliveryCharge = (packets) => {
  const count = parseInt(packets) || 0;
  if (count <= 0) return 0;

  const tier = DELIVERY_TIERS.find(t => count >= t.min && count <= t.max);
  return tier ? tier.charge : DELIVERY_TIERS[DELIVERY_TIERS.length - 1].charge;
};

/**
 * Calculate partner earning based on number of packets
 * @param {number} packets - Number of packets (1-50)
 * @returns {number} Partner earning in INR
 */
export const calculatePartnerEarning = (packets) => {
  const count = parseInt(packets) || 0;
  if (count <= 0) return 0;

  const tier = DELIVERY_TIERS.find(t => count >= t.min && count <= t.max);
  return tier ? tier.partnerEarning : DELIVERY_TIERS[DELIVERY_TIERS.length - 1].partnerEarning;
};

/**
 * Get the full tier info for a given packet count
 * @param {number} packets
 * @returns {{ charge: number, partnerEarning: number, tierLabel: string }}
 */
export const getDeliveryTierInfo = (packets) => {
  const count = parseInt(packets) || 0;
  if (count <= 0) return { charge: 0, partnerEarning: 0, tierLabel: 'N/A' };

  const tier = DELIVERY_TIERS.find(t => count >= t.min && count <= t.max) 
    || DELIVERY_TIERS[DELIVERY_TIERS.length - 1];

  return {
    charge: tier.charge,
    partnerEarning: tier.partnerEarning,
    tierLabel: `${tier.min}-${tier.max} packets`
  };
};

/**
 * Validate packet count
 * @param {number} packets
 * @returns {{ valid: boolean, message?: string }}
 */
export const validatePacketCount = (packets) => {
  const count = parseInt(packets);
  if (isNaN(count) || count < 1) {
    return { valid: false, message: 'Please enter at least 1 packet.' };
  }
  if (count > 50) {
    return { valid: false, message: 'Maximum 50 packets allowed per order.' };
  }
  return { valid: true };
};

/**
 * Get all delivery tiers for display purposes
 * @returns {Array} All delivery tiers
 */
export const getAllDeliveryTiers = () => DELIVERY_TIERS;

export default {
  calculateDeliveryCharge,
  calculatePartnerEarning,
  getDeliveryTierInfo,
  validatePacketCount,
  getAllDeliveryTiers
};
