import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import FloatingCart from '../components/FloatingCart';
import BackToTop from '../components/BackToTop';
import { fastfoods as fastfoodsData } from '../data/productsData';

function FastFoodsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [showFooter, setShowFooter] = useState(true);
  const [searchPlaceholder, setSearchPlaceholder] = useState("'dum biryani'");
  const [placeholderAnimating, setPlaceholderAnimating] = useState(false);
  const [stockStatus, setStockStatus] = useState({ fastFoodsActive: true, biryaniActive: true });

  const searchPlaceholders = [
    "'dum biryani'",
    "'chicken noodles'",
    "'fried rice'",
    "'starters'",
  ];

  // Animated placeholder effect
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setPlaceholderAnimating(true);
      setTimeout(() => {
        index = (index + 1) % searchPlaceholders.length;
        setSearchPlaceholder(searchPlaceholders[index]);
        setPlaceholderAnimating(false);
      }, 300);
    }, 2000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setProducts(fastfoodsData);
    setLoading(false);
  }, []);

  // Fetch stock availability from backend
  useEffect(() => {
    const fetchStockStatus = async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_URL}/api/slot-availability`);
        if (res.ok) {
          const data = await res.json();
          if (data.stock) {
            setStockStatus({
              fastFoodsActive: data.stock.fastFoodsActive !== false,
              biryaniActive: data.stock.biryaniActive !== false
            });
          }
        }
      } catch (err) {
        console.warn('Stock status fetch failed:', err.message);
      }
    };
    fetchStockStatus();
  }, []);

  // Load wishlist
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

  // Track scroll direction to show/hide footer
  useEffect(() => {
    let lastScroll = 0;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > 50) {
        if (currentScrollY > lastScroll) {
          setShowFooter(false);
        } else if (currentScrollY < lastScroll) {
          setShowFooter(true);
        }
      } else {
        setShowFooter(true);
      }
      
      lastScroll = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isItemOutOfStock = (item) => {
    if (item.category === 'Biryani' && !stockStatus.biryaniActive) return true;
    if (item.category !== 'Biryani' && !stockStatus.fastFoodsActive) return true;
    return false;
  };

  const handleAddToCart = (product) => {
    if (isItemOutOfStock(product)) return;
    const savedCart = localStorage.getItem('cart');
    const cart = savedCart ? JSON.parse(savedCart) : [];

    const existingItemIndex = cart.findIndex(item => item.id === product.id && item.type === product.type);

    if (existingItemIndex > -1) {
      cart[existingItemIndex].quantity = (cart[existingItemIndex].quantity || 1) + 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const handleAddToWishlist = (product) => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      navigate('/customer/edit-profile', { 
        state: { message: 'Please login or signup to add items to your wishlist' } 
      });
      return;
    }

    const savedWishlist = localStorage.getItem('wishlist');
    const wishlist = savedWishlist ? JSON.parse(savedWishlist) : [];

    const existingIndex = wishlist.findIndex(item => item.id === product.id && item.type === product.type);
    
    if (existingIndex > -1) {
      wishlist.splice(existingIndex, 1);
    } else {
      wishlist.push(product);
    }
    
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    window.dispatchEvent(new Event('wishlistUpdated'));
  };

  // Most selling items for FastFoods: Dum Biryani, Fry Biryani, Biryani Combo
  const mostSellingItems = products.filter(p => [301, 302, 303].includes(p.id));

  // Derived category arrays
  const starters = products.filter(f => f.category === 'Starters');
  const noodles = products.filter(f => f.category === 'Noodles');
  const biryanis = products.filter(f => f.category === 'Biryani');
  const friedRice = products.filter(f => f.category === 'Fried Rice');

  // Veg / Non-Veg filter arrays
  const vegItems = products.filter(f => f.isVeg === true);
  const nonVegItems = products.filter(f => f.isVeg === false);

  // Reusable product card renderer (same as CustomerDashboard)
  const renderProductCard = (item, keyPrefix = '', options = {}) => {
    const { badge, imageHeight = 'h-36', isGrid = false } = options;
    const discount = item.originalPrice ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100) : 0;
    const isInWishlist = wishlistItems.includes(item.id);
    const outOfStock = isItemOutOfStock(item);
    return (
      <div key={`${keyPrefix}${item.id}`} className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 group ${!isGrid ? 'flex-shrink-0 w-64' : ''} ${outOfStock ? 'opacity-60' : ''}`}>
        <div className="relative overflow-hidden bg-gray-50 rounded-xl">
          <img
            loading="lazy"
            src={item.image}
            alt={item.name}
            onClick={() => navigate(`/product/fastfood/${item.id}`)}
            className={`w-full ${imageHeight} object-cover transition-transform duration-300 group-hover:scale-105 rounded-xl cursor-pointer`}
          />
          {outOfStock && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-xl">
              <span className="bg-red-600 text-white text-sm font-bold px-4 py-2 rounded-lg">Out of Stock</span>
            </div>
          )}
          {!outOfStock && discount > 0 && (
            <div className="absolute top-0 left-0 bg-green-700 text-white text-xs font-bold px-3 py-2 rounded-br-2xl shadow-lg">
              {discount}% OFF
            </div>
          )}
          {badge && (
            <div className="absolute bottom-0 left-0 bg-orange-500 text-white text-xs font-bold px-3 py-2 rounded-tr-2xl shadow-lg">
              {badge}
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
          {!outOfStock && (
            <button
              onClick={() => handleAddToCart(item)}
              className="absolute bottom-0 right-0 bg-black text-white px-3 py-2 rounded-tl-2xl hover:bg-gray-800 transition-all duration-200 font-semibold text-sm flex items-center gap-1 shadow-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add
            </button>
          )}
        </div>
        <div className="p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`inline-flex items-center justify-center w-4 h-4 border-2 rounded-sm ${item.isVeg ? 'border-green-600' : 'border-red-600'}`}>
              <span className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`}></span>
            </span>
            <span className={`text-xs font-semibold ${item.isVeg ? 'text-green-700' : 'text-red-600'}`}>
              {item.isVeg ? 'Veg' : 'Non-Veg'}
            </span>
          </div>
          <h3 className="font-semibold text-gray-800 text-base mb-2">{item.name}</h3>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-gray-900 font-metropolis">₹{item.price}</span>
            {item.originalPrice && item.originalPrice !== item.price && (
              <span className="text-sm text-gray-400 line-through font-metropolis">₹{item.originalPrice}</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Reusable View All button
  const renderViewAllButton = (items, title) => (
    <button 
      onClick={() => navigate('/view-all', { state: { items, title } })}
      className="text-gray-800 font-semibold text-sm hover:text-black flex items-center gap-1"
    >
      View All
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );

  // Reusable loading spinner
  const renderLoadingSpinner = (text) => (
    <div className="flex items-center justify-center py-16">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
        <p className="text-gray-500">{text}</p>
      </div>
    </div>
  );

  // Reusable empty state
  const renderEmptyState = (text) => (
    <div className="text-center py-16 bg-white rounded-xl">
      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
      <p className="text-gray-500">{text}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header with Back Arrow */}
      <div className="bg-black shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/customer/dashboard')}
              className="text-white hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-white">FastFoods</h1>
          </div>
        </div>
      </div>

      {/* Sticky Search Bar - Same as Dashboard */}
      <div className="bg-black shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="relative overflow-hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 z-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              onClick={() => navigate('/customer/search')}
              readOnly
              className="w-full pl-12 pr-4 py-3 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-gray-700 cursor-pointer"
            />
            <div className="absolute left-12 top-1/2 transform -translate-y-1/2 pointer-events-none overflow-hidden h-6 flex items-center">
              <span className="text-gray-500 mr-1">Search for </span>
              <div className={`transition-all duration-300 ${placeholderAnimating ? '-translate-y-6 opacity-0' : 'translate-y-0 opacity-100'}`}>
                <span className="text-gray-500">{searchPlaceholder}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Space below sticky search bar */}
      <div className="h-4"></div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">

        {/* 1. Most Selling Section */}
        <div className="px-4 py-6 bg-gradient-to-b from-white to-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Most Selling</h2>
              <p className="text-sm text-gray-600 mt-1">Our customers' favorites</p>
            </div>
          </div>

          {loading ? renderLoadingSpinner('Loading most selling items...') : (
            <div className="overflow-x-auto -mx-4 px-4 pb-4 scrollbar-hide">
              <div className="flex gap-4">
                {mostSellingItems.map(item => renderProductCard(item, 'mostselling-', { badge: 'Most Selling' }))}
              </div>
            </div>
          )}
        </div>

        {/* 2. Starters Section */}
        <div className="px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Starters</h2>
              <p className="text-sm text-gray-600 mt-1">Crispy and delicious appetizers</p>
            </div>
            {renderViewAllButton(starters, 'Starters')}
          </div>

          {loading ? renderLoadingSpinner('Loading starters...') : starters.length === 0 ? renderEmptyState('No starters available') : (
            <div className="overflow-x-auto -mx-4 px-4 pb-4 scrollbar-hide">
              <div className="flex gap-4">
                {starters.map(item => renderProductCard(item, 'starter-'))}
              </div>
            </div>
          )}
        </div>

        {/* 3. Noodles Section */}
        <div className="px-4 py-6 bg-gradient-to-b from-white to-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Noodles</h2>
              <p className="text-sm text-gray-600 mt-1">Stir-fried to perfection</p>
            </div>
            {renderViewAllButton(noodles, 'Noodles')}
          </div>

          {loading ? renderLoadingSpinner('Loading noodles...') : noodles.length === 0 ? renderEmptyState('No noodles available') : (
            <div className="overflow-x-auto -mx-4 px-4 pb-4 scrollbar-hide">
              <div className="flex gap-4">
                {noodles.map(item => renderProductCard(item, 'noodle-'))}
              </div>
            </div>
          )}
        </div>

        {/* 4. Biryani Section */}
        <div className="px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Biryani</h2>
              <p className="text-sm text-gray-600 mt-1">Aromatic and flavorful biryanis</p>
            </div>
            {renderViewAllButton(biryanis, 'Biryani')}
          </div>

          {loading ? renderLoadingSpinner('Loading biryanis...') : biryanis.length === 0 ? renderEmptyState('No biryanis available') : (
            <div className="overflow-x-auto -mx-4 px-4 pb-4 scrollbar-hide">
              <div className="flex gap-4">
                {biryanis.map(item => renderProductCard(item, 'biryani-'))}
              </div>
            </div>
          )}
        </div>

        {/* 5. Fried Rice Section */}
        <div className="px-4 py-6 bg-gradient-to-b from-white to-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Fried Rice</h2>
              <p className="text-sm text-gray-600 mt-1">Wok-tossed goodness</p>
            </div>
            {renderViewAllButton(friedRice, 'Fried Rice')}
          </div>

          {loading ? renderLoadingSpinner('Loading fried rice...') : friedRice.length === 0 ? renderEmptyState('No fried rice available') : (
            <div className="overflow-x-auto -mx-4 px-4 pb-4 scrollbar-hide">
              <div className="flex gap-4">
                {friedRice.map(item => renderProductCard(item, 'friedrice-'))}
              </div>
            </div>
          )}
        </div>

        {/* 6. Veg Items Section */}
        <div className="px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-5 h-5 border-2 border-green-600 rounded-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-green-600"></span>
              </span>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Veg Items</h2>
                <p className="text-sm text-gray-600 mt-1">Pure vegetarian delights</p>
              </div>
            </div>
            {renderViewAllButton(vegItems, 'Veg Items')}
          </div>

          {loading ? renderLoadingSpinner('Loading veg items...') : vegItems.length === 0 ? renderEmptyState('No veg items available') : (
            <div className="overflow-x-auto -mx-4 px-4 pb-4 scrollbar-hide">
              <div className="flex gap-4">
                {vegItems.map(item => renderProductCard(item, 'veg-'))}
              </div>
            </div>
          )}
        </div>

        {/* 7. Non-Veg Items Section */}
        <div className="px-4 py-6 bg-gradient-to-b from-white to-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-5 h-5 border-2 border-red-600 rounded-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
              </span>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Non-Veg Items</h2>
                <p className="text-sm text-gray-600 mt-1">Premium non-vegetarian picks</p>
              </div>
            </div>
            {renderViewAllButton(nonVegItems, 'Non-Veg Items')}
          </div>

          {loading ? renderLoadingSpinner('Loading non-veg items...') : nonVegItems.length === 0 ? renderEmptyState('No non-veg items available') : (
            <div className="overflow-x-auto -mx-4 px-4 pb-4 scrollbar-hide">
              <div className="flex gap-4">
                {nonVegItems.map(item => renderProductCard(item, 'nonveg-'))}
              </div>
            </div>
          )}
        </div>

      </div>

      <BackToTop />
      {/* Fixed Bottom Navigation */}
      <Footer showFooter={showFooter} />
      <FloatingCart />

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

export default FastFoodsPage;
