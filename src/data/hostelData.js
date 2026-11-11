/**
 * Hostel data configuration for NIVA Deliveries
 * Gender-based hostel assignment for room delivery
 */

export const MALE_HOSTELS = [
  'Vedavathi',
  'Ganga A',
  'Ganga B',
  'New Hostel'
];

export const FEMALE_HOSTELS = [
  'Krishna',
  'Yamuna',
  'Godavari',
  'Ganga',
  'Narmada'
];

/**
 * Get hostels based on gender selection
 * @param {'male' | 'female'} gender
 * @returns {string[]} Array of hostel names
 */
export const getHostelsByGender = (gender) => {
  if (gender === 'male') return MALE_HOSTELS;
  if (gender === 'female') return FEMALE_HOSTELS;
  return [];
};

/**
 * Validate hostel selection matches gender
 * @param {string} gender
 * @param {string} hostelName
 * @returns {boolean}
 */
export const isValidHostelForGender = (gender, hostelName) => {
  const hostels = getHostelsByGender(gender);
  return hostels.includes(hostelName);
};

export default {
  MALE_HOSTELS,
  FEMALE_HOSTELS,
  getHostelsByGender,
  isValidHostelForGender
};
