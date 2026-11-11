// Centralized product data - single source of truth
// Fast Foods only

export const fastfoods = [
  // Biryani
  {
    id: 301,
    name: 'Dum Biryani',
    description: 'Authentic slow-cooked Dum Biryani with aromatic spices and tender chicken',
    price: 149,
    originalPrice: 200,
    image: '/BIryani/DumBiryani.png',
    category: 'Biryani',
    type: 'fastfood',
    isVeg: false
  },
  {
    id: 302,
    name: 'Fry Biryani',
    description: 'Flavorful Fry Biryani with perfectly spiced rice and juicy chicken',
    price: 159,
    originalPrice: 210,
    image: '/BIryani/FryBiryani.png',
    category: 'Biryani',
    type: 'fastfood',
    isVeg: false
  },
  {
    id: 303,
    name: 'Biryani Combo',
    description: 'Biryani Combo with 250ml Thums Up - the perfect meal deal',
    price: 169,
    originalPrice: 220,
    image: '/Combo/BiryaniCombo.png',
    category: 'Biryani',
    type: 'fastfood',
    isVeg: false
  },
  {
    id: 304,
    name: 'Chicken Fried Rice + Thums Up Combo',
    description: 'Delicious Chicken Fried Rice paired with a refreshing Thums Up',
    price: 139,
    originalPrice: 169,
    image: '/Combo/FriedRiceCombo.png',
    category: 'Biryani',
    type: 'fastfood',
    isVeg: false
  },
  // Fried Rice
  {
    id: 305,
    name: 'Chicken Fried Rice',
    description: 'Wok-tossed Chicken Fried Rice with fresh vegetables and savory sauces',
    price: 109,
    originalPrice: 120,
    image: '/FriedRice/ChickenFriedRice.png',
    category: 'Fried Rice',
    type: 'fastfood',
    isVeg: false
  },
  {
    id: 306,
    name: 'Egg Fried Rice',
    description: 'Classic Egg Fried Rice with scrambled eggs and aromatic seasonings',
    price: 79,
    originalPrice: 99,
    image: '/FriedRice/EggFriedRice.png',
    category: 'Fried Rice',
    type: 'fastfood',
    isVeg: false
  },
  {
    id: 307,
    name: 'Veg Fried Rice',
    description: 'Garden fresh Veg Fried Rice with seasonal vegetables and soy sauce',
    price: 89,
    originalPrice: 89,
    image: '/FriedRice/VegFriedRice.png',
    category: 'Fried Rice',
    type: 'fastfood',
    isVeg: true
  },
  {
    id: 308,
    name: 'Veg Manchurian Fried Rice',
    description: 'Indo-Chinese style Veg Manchurian Fried Rice with crispy manchurian balls',
    price: 99,
    originalPrice: 99,
    image: '/FriedRice/VegManchurianRice.png',
    category: 'Fried Rice',
    type: 'fastfood',
    isVeg: true
  },
  // Noodles
  {
    id: 309,
    name: 'Chicken Noodles',
    description: 'Stir-fried Chicken Noodles with vegetables and spicy sauces',
    price: 109,
    originalPrice: 120,
    image: '/Noodles/ChickenNoodles.png',
    category: 'Noodles',
    type: 'fastfood',
    isVeg: false
  },
  {
    id: 310,
    name: 'Egg Noodles',
    description: 'Classic Egg Noodles tossed with scrambled eggs and veggies',
    price: 79,
    originalPrice: 99,
    image: '/Noodles/EggNoodles.png',
    category: 'Noodles',
    type: 'fastfood',
    isVeg: false
  },
  {
    id: 311,
    name: 'Veg Manchurian Noodles',
    description: 'Spicy Veg Manchurian Noodles with indo-chinese flavors',
    price: 99,
    originalPrice: 99,
    image: '/Noodles/VegManchurianNoodles.png',
    category: 'Noodles',
    type: 'fastfood',
    isVeg: true
  },
  {
    id: 312,
    name: 'Veg Noodles',
    description: 'Fresh Veg Noodles stir-fried with seasonal vegetables',
    price: 89,
    originalPrice: 89,
    image: '/Noodles/VegNoodles.png',
    category: 'Noodles',
    type: 'fastfood',
    isVeg: true
  },
  // Starters
  {
    id: 313,
    name: 'Chicken Manchurian',
    description: 'Crispy Chicken Manchurian in tangy indo-chinese sauce',
    price: 189,
    originalPrice: 220,
    image: '/Starters/ChickenManchurian.png',
    category: 'Starters',
    type: 'fastfood',
    isVeg: false
  },
  {
    id: 314,
    name: 'Chilli Chicken',
    description: 'Spicy Chilli Chicken tossed with peppers and onions',
    price: 189,
    originalPrice: 220,
    image: '/Starters/ChilliChicken.png',
    category: 'Starters',
    type: 'fastfood',
    isVeg: false
  },
  {
    id: 315,
    name: 'Veg Manchurian',
    description: 'Crispy Veg Manchurian balls in savory indo-chinese gravy',
    price: 89,
    originalPrice: 99,
    image: '/Starters/VegManchurian.png',
    category: 'Starters',
    type: 'fastfood',
    isVeg: true
  },
];

// Helper functions
export const getAllProducts = () => [...fastfoods];

export const getFastfoodById = (id) => fastfoods.find(f => f.id === parseInt(id));

export const getProductById = (id, type) => {
  return getFastfoodById(id);
};

export const searchProducts = (query) => {
  if (!query || !query.trim()) return [];
  
  const searchTerm = query.trim().toLowerCase();
  const allItems = getAllProducts();
  
  return allItems.filter(item => {
    return (
      (item.name && item.name.toLowerCase().includes(searchTerm)) ||
      (item.description && item.description.toLowerCase().includes(searchTerm)) ||
      (item.category && item.category.toLowerCase().includes(searchTerm))
    );
  });
};

export const getPriceDropItems = (maxPrice = 100) => {
  return getAllProducts().filter(item => item.price < maxPrice);
};
