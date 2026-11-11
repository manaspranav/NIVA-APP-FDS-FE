/**
 * Local Home Kitchen — hardcoded menu (add/replace images under public/restaurants/local-home-kitchen/)
 */
export const VENDOR_ID = 'local-home-kitchen';

const base = '/restaurants/local-home-kitchen';

export const menu = [
  {
    id: 401,
    vendorId: VENDOR_ID,
    name: 'Chicken Biryani',
    description: 'Homestyle chicken biryani with aromatic spices',
    price: 129,
    originalPrice: 159,
    image: `${base}/biryani.jpg`,
    category: 'Biryani',
    type: 'homekitchen',
    productType: 'homekitchen',
    isVeg: false,
  },
  {
    id: 402,
    vendorId: VENDOR_ID,
    name: 'Veg Meals (Full)',
    description: 'Rice, dal, sabzi, papad and pickle',
    price: 89,
    originalPrice: 99,
    image: `${base}/meals.jpg`,
    category: 'Meals',
    type: 'homekitchen',
    productType: 'homekitchen',
    isVeg: true,
  },
  {
    id: 403,
    vendorId: VENDOR_ID,
    name: 'Chicken Fried Rice',
    description: 'Wok-style fried rice with chicken and vegetables',
    price: 99,
    originalPrice: 119,
    image: `${base}/fried-rice.jpg`,
    category: 'Fried Rice',
    type: 'homekitchen',
    productType: 'homekitchen',
    isVeg: false,
  },
  {
    id: 404,
    vendorId: VENDOR_ID,
    name: 'Egg Curry & Rice',
    description: 'Two eggs in homestyle curry with steamed rice',
    price: 79,
    originalPrice: 89,
    image: `${base}/curry.jpg`,
    category: 'Curry',
    type: 'homekitchen',
    productType: 'homekitchen',
    isVeg: false,
  },
  {
    id: 405,
    vendorId: VENDOR_ID,
    name: 'Veg Fried Rice',
    description: 'Light veg fried rice — perfect for a quick meal',
    price: 79,
    originalPrice: 89,
    image: `${base}/veg-fried-rice.jpg`,
    category: 'Fried Rice',
    type: 'homekitchen',
    productType: 'homekitchen',
    isVeg: true,
  },
  {
    id: 406,
    vendorId: VENDOR_ID,
    name: 'Evening Snacks Plate',
    description: 'Assorted homestyle snacks — portion for one',
    price: 59,
    originalPrice: 69,
    image: `${base}/snacks.jpg`,
    category: 'Snacks',
    type: 'homekitchen',
    productType: 'homekitchen',
    isVeg: true,
  },
];

export default menu;
