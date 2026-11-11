import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import FloatingCart from '../components/FloatingCart';
import BackToTop from '../components/BackToTop';
import { fastfoods } from '../data/productsData';

const categories = [
  {
    name: 'Biryani',
    description: 'Aromatic and flavorful biryanis',
    image: '/BIryani/DumBiryani.png',
    bg: 'from-orange-50 to-amber-50',
    accent: 'bg-orange-500',
  },
  {
    name: 'Fried Rice',
    description: 'Wok-tossed goodness',
    image: '/FriedRice/ChickenFriedRice.png',
    bg: 'from-yellow-50 to-orange-50',
    accent: 'bg-yellow-500',
  },
  {
    name: 'Noodles',
    description: 'Stir-fried to perfection',
    image: '/Noodles/ChickenNoodles.png',
    bg: 'from-red-50 to-pink-50',
    accent: 'bg-red-500',
  },
  {
    name: 'Starters',
    description: 'Crispy and delicious appetizers',
    image: '/Starters/ChilliChicken.png',
    bg: 'from-green-50 to-emerald-50',
    accent: 'bg-green-500',
  },
];

function CategoriesPage() {
  const navigate = useNavigate();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [showFooter, setShowFooter] = useState(true);

  useEffect(() => {
    const updateWishlist = () => {
      const savedWishlist = localStorage.getItem('wishlist');
      const wishlist = savedWishlist ? JSON.parse(savedWishlist) : [];
      setWishlistItems(wishlist.map(item => item.id));
    };
    updateWishlist();
    window.addEventListener('wishlistUpdated', updateWishlist);
    return () => window.removeEventListener('wishlistUpdated', updateWishlist);
  }, []);

  useEffect(() => {
    let lastScroll = 0;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 50) {
        setShowFooter(currentScrollY < lastScroll);
      } else {
        setShowFooter(true);
      }
      lastScroll = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCategoryClick = (categoryName) => {
    const items = fastfoods.filter(f => f.category === categoryName);
    navigate('/view-all', { state: { items, title: categoryName } });
  };

  const handleAddToCart = useCallback((product) => {
    if (product.outOfStock) { alert(`"${product.name}" is currently out of stock.`); return; }
    const savedCart = localStorage.getItem('cart');
    const cart = savedCart ? JSON.parse(savedCart) : [];
    const existingItemIndex = cart.findIndex(item => item.id === product.id);
    if (existingItemIndex > -1) { cart[existingItemIndex].quantity = (cart[existingItemIndex].quantity || 1) + 1; }
    else { cart.push({ ...product, quantity: 1 }); }
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
  }, []);

  const handleAddToWishlist = useCallback((product) => {
    const userId = localStorage.getItem('userId');
    if (!userId) { navigate('/customer/edit-profile', { state: { message: 'Please login or signup to add items to your wishlist' } }); return; }
    const savedWishlist = localStorage.getItem('wishlist');
    const wishlist = savedWishlist ? JSON.parse(savedWishlist) : [];
    const existingIndex = wishlist.findIndex(item => item.id === product.id);
    if (existingIndex > -1) { wishlist.splice(existingIndex, 1); } else { wishlist.push(product); }
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    window.dispatchEvent(new Event('wishlistUpdated'));
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-black shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="text-white hover:text-gray-300 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-white font-bold text-xl">Categories</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Category Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {categories.map((cat) => {
            const count = fastfoods.filter(f => f.category === cat.name).length;
            return (
              <button
                key={cat.name}
                onClick={() => handleCategoryClick(cat.name)}
                className={`relative bg-gradient-to-br ${cat.bg} rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-95 text-left`}
              >
                <div className="p-4 pb-2">
                  <h3 className="font-bold text-gray-900 text-base">{cat.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{count} items</p>
                </div>
                <div className="flex justify-center pb-3">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-24 h-24 object-cover rounded-xl shadow-md"
                  />
                </div>
                <div className={`absolute top-0 right-0 ${cat.accent} text-white text-[10px] font-bold px-2 py-1 rounded-bl-xl`}>
                  View All →
                </div>
              </button>
            );
          })}
        </div>

        {/* All Items Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-1">All Fast Foods</h2>
          <p className="text-sm text-gray-500 mb-4">Browse our full menu</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {fastfoods.filter(f => !f.outOfStock).map((item) => {
              const discount = item.originalPrice ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100) : 0;
              const isInWishlist = wishlistItems.includes(item.id);
              return (
                <div key={item.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 group">
                  <div className="relative overflow-hidden bg-gray-50 rounded-xl">
                    <img
                      loading="lazy"
                      src={item.image}
                      alt={item.name}
                      onClick={() => navigate(`/product/fastfood/${item.id}`)}
                      className="w-full h-36 object-cover transition-transform duration-300 group-hover:scale-105 rounded-xl cursor-pointer"
                    />
                    {discount > 0 && (
                      <div className="absolute top-0 left-0 bg-green-700 text-white text-xs font-bold px-3 py-2 rounded-br-2xl shadow-lg">
                        {discount}% OFF
                      </div>
                    )}
                    <button
                      onClick={() => handleAddToWishlist(item)}
                      className="absolute top-3 right-3 hover:scale-110 transition-all duration-200"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 drop-shadow-lg" fill={isInWishlist ? '#000000' : 'white'} viewBox="0 0 24 24" stroke="#000000" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="absolute bottom-0 right-0 bg-black text-white px-3 py-2 rounded-tl-2xl transition-all duration-200 font-semibold text-sm flex items-center gap-1 shadow-lg hover:bg-gray-800"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add
                    </button>
                  </div>
                  <div className="p-3">
                    {item.isVeg !== undefined && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`inline-flex items-center justify-center w-4 h-4 border-2 rounded-sm ${item.isVeg ? 'border-green-600' : 'border-red-600'}`}>
                          <span className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`}></span>
                        </span>
                        <span className={`text-xs font-semibold ${item.isVeg ? 'text-green-700' : 'text-red-600'}`}>
                          {item.isVeg ? 'Veg' : 'Non-Veg'}
                        </span>
                      </div>
                    )}
                    <h3 className="font-semibold text-gray-800 text-sm mb-2 line-clamp-1">{item.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-900">₹{item.price}</span>
                      {item.originalPrice && item.originalPrice !== item.price && (
                        <span className="text-xs text-gray-400 line-through">₹{item.originalPrice}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <BackToTop />
      <Footer showFooter={showFooter} />
      <FloatingCart />
    </div>
  );
}

export default CategoriesPage;
