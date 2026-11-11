import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, X } from 'lucide-react';
import FloatingCart from '../components/FloatingCart';
import { fastfoods, searchProducts, getPriceDropItems } from '../data/productsData';

function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadRecentSearches();
    loadWishlist();
  }, []);

  const loadWishlist = () => {
    const updateWishlist = () => {
      const savedWishlist = localStorage.getItem('wishlist');
      const wishlist = savedWishlist ? JSON.parse(savedWishlist) : [];
      setWishlistItems(wishlist.map(item => item.id));
    };

    updateWishlist();
    window.addEventListener('wishlistUpdated', updateWishlist);
    return () => window.removeEventListener('wishlistUpdated', updateWishlist);
  };

  const loadRecentSearches = () => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  };

  const saveRecentSearch = (query) => {
    if (!query.trim()) return;
    
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 4);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleAddToCart = (item) => {
    const savedCart = localStorage.getItem('cart');
    const cart = savedCart ? JSON.parse(savedCart) : [];
    const existingItemIndex = cart.findIndex(cartItem => cartItem.id === item.id);
    
    if (existingItemIndex > -1) {
      cart[existingItemIndex].quantity = (cart[existingItemIndex].quantity || 1) + 1;
    } else {
      cart.push({ ...item, quantity: 1 });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const handleAddToWishlist = (item) => {
    const savedWishlist = localStorage.getItem('wishlist');
    const wishlist = savedWishlist ? JSON.parse(savedWishlist) : [];
    
    const existingItemIndex = wishlist.findIndex(w => w.id === item.id && w.type === item.type);
    
    if (existingItemIndex > -1) {
      wishlist.splice(existingItemIndex, 1);
    } else {
      wishlist.push(item);
    }
    
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    window.dispatchEvent(new Event('wishlistUpdated'));
  };

  const allItems = [...fastfoods];
  const priceDropItems = getPriceDropItems();
  const filteredResults = searchProducts(searchQuery);

  const handleRecentSearchClick = (term) => {
    setSearchQuery(term);
  };

  const handleResultClick = (itemType, itemId) => {
    if (searchQuery.trim()) {
      saveRecentSearch(searchQuery.trim());
    }
    navigate(`/product/${itemType}/${itemId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 overflow-x-hidden">
      {/* Search Header */}
      <div className="glass-effect shadow-smooth-lg border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Search Input with Back Button Inside */}
          <div className="relative">
            <button
              onClick={handleBack}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 p-1.5 hover:bg-gray-200/50 rounded-full transition-all duration-200 active:scale-95 z-10"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <input
              type="text"
              placeholder="Search for biryani, noodles, fried rice and more"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              autoFocus
              className="w-full px-4 py-3.5 pl-12 pr-12 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:bg-white focus:border-gray-200 transition-all duration-200 font-body text-sm text-gray-900 placeholder:text-gray-400"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 hover:bg-gray-200 rounded-full transition-all duration-200 active:scale-90"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 pb-32">
        {!searchQuery.trim() ? (
          <div className="space-y-8 animate-fade-in">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-heading font-bold text-gray-900">Your Recent Searches</h2>
                  </div>
                  <button
                    onClick={clearRecentSearches}
                    className="text-sm font-subheading font-medium text-gray-600 hover:text-black transition-colors"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term, index) => (
                    <button
                      key={index}
                      onClick={() => handleRecentSearchClick(term)}
                      className="px-4 py-2.5 bg-white border-2 border-gray-200 rounded-2xl font-body text-sm text-gray-700 hover:bg-gray-50 hover:border-black transition-all duration-200 shadow-sm"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price Drop Alert Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-heading font-bold text-gray-900">Price Drop Alert!</h2>
              </div>
              
              <div className="relative">
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  {priceDropItems.map((item) => {
                    const itemType = item.type || (item.numberOfDays && item.numberOfDays > 1 ? 'pack' : item.numberOfDays === 1 ? 'bowl' : 'fruit');
                    const discount = item.originalPrice ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100) : 0;
                    const isInWishlist = wishlistItems.includes(item.id);
                    return (
                    <div
                      key={`${itemType}-${item.id}`}
                      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 flex-shrink-0 w-64 group"
                    >
                      <div className="relative overflow-hidden bg-gray-50 rounded-xl h-32">
                        <img
                          loading="lazy"
                          src={item.image}
                          alt={item.name}
                          onClick={() => navigate(`/product/${itemType}/${item.id}`)}
                          className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105 rounded-xl cursor-pointer"
                        />
                        {/* Discount Badge */}
                        {discount > 0 && item.originalPrice !== item.price && (
                          <div className="absolute top-0 left-0 bg-green-700 text-white text-xs font-bold px-3 py-2 rounded-br-2xl shadow-lg">
                            {discount}% OFF
                          </div>
                        )}
                        {/* Wishlist Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToWishlist(item);
                          }}
                          className="absolute top-3 right-3 hover:scale-110 transition-all duration-200"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 drop-shadow-lg"
                            fill={isInWishlist ? '#000000' : 'white'}
                            viewBox="0 0 24 24"
                            stroke={isInWishlist ? '#000000' : '#000000'}
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                          </svg>
                        </button>
                        {/* Add Button at Edge */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(item);
                          }}
                          className="absolute bottom-0 right-0 bg-black text-white px-3 py-2 rounded-tl-2xl hover:bg-gray-800 transition-all duration-200 font-semibold text-sm shadow-lg"
                        >
                          Add
                        </button>
                      </div>
                      <div className="p-3">
                        <h3 className="font-semibold text-gray-800 text-base mb-1">{item.name}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold text-gray-900">₹{item.price}</span>
                          {item.originalPrice && item.originalPrice !== item.price && (
                            <span className="text-sm text-gray-400 line-through">₹{item.originalPrice}</span>
                          )}
                        </div>
                        {item.numberOfDays && (
                          <span className="text-xs text-gray-500 block mt-1">{item.numberOfDays} Days</span>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-heading font-bold text-gray-900 mb-2">No results found</h3>
            <p className="font-body text-gray-600 mb-6">Try searching with different keywords</p>
            <button
              onClick={handleClearSearch}
              className="px-6 py-3 bg-black text-white rounded-2xl font-subheading font-semibold hover:bg-gray-800 transition-all duration-200 shadow-smooth"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="animate-fade-in space-y-6">
            {/* Search Results */}
            <div>
              <div className="mb-4">
                <p className="font-body text-sm text-gray-600">
                  Found <span className="font-bold text-gray-900">{filteredResults.length}</span> results
                </p>
              </div>
              <div className="space-y-3">
                {filteredResults.map(item => {
                  const itemType = item.type || (item.numberOfDays && item.numberOfDays > 1 ? 'pack' : item.numberOfDays === 1 ? 'bowl' : 'fruit');
                  return (
                    <div
                      key={`${itemType}-${item.id}`}
                      onClick={() => handleResultClick(itemType, item.id)}
                      className="bg-white rounded-xl hover:bg-gray-50 transition-all duration-200 cursor-pointer"
                    >
                      <div className="flex items-center gap-4 p-3">
                        <div className="flex-shrink-0 w-16 h-16 bg-gray-50 rounded-lg overflow-hidden">
                          <img
                            loading="lazy"
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-base truncate">{item.name}</h3>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Suggestions Section */}
            <div className="mt-8">
              <h2 className="text-lg font-heading font-bold text-gray-900 mb-4">Suggestions For You</h2>
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {allItems.filter(item => !filteredResults.find(f => f.id === item.id && f.type === item.type)).slice(0, 8).map((item) => {
                  const itemType = item.type || (item.numberOfDays && item.numberOfDays > 1 ? 'pack' : item.numberOfDays === 1 ? 'bowl' : 'fruit');
                  const discount = item.originalPrice ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100) : 0;
                  const isInWishlist = wishlistItems.includes(item.id);
                  return (
                  <div
                    key={`suggestion-${itemType}-${item.id}`}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 flex-shrink-0 w-64 group"
                  >
                    <div className="relative overflow-hidden bg-gray-50 rounded-xl h-32">
                      <img
                        loading="lazy"
                        src={item.image}
                        alt={item.name}
                        onClick={() => navigate(`/product/${itemType}/${item.id}`)}
                        className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105 rounded-xl cursor-pointer"
                      />
                      {/* Discount Badge */}
                      {discount > 0 && item.originalPrice !== item.price && (
                        <div className="absolute top-0 left-0 bg-green-700 text-white text-xs font-bold px-3 py-2 rounded-br-2xl shadow-lg">
                          {discount}% OFF
                        </div>
                      )}
                      {/* Wishlist Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToWishlist(item);
                        }}
                        className="absolute top-3 right-3 hover:scale-110 transition-all duration-200"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 drop-shadow-lg"
                          fill={isInWishlist ? '#000000' : 'white'}
                          viewBox="0 0 24 24"
                          stroke={isInWishlist ? '#000000' : '#000000'}
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
                      </button>
                      {/* Add Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(item);
                        }}
                        className="absolute bottom-0 right-0 bg-black text-white px-3 py-2 rounded-tl-2xl hover:bg-gray-800 transition-all duration-200 font-semibold text-sm shadow-lg"
                      >
                        Add
                      </button>
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-gray-800 text-base mb-1">{item.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-gray-900">₹{item.price}</span>
                        {item.originalPrice && item.originalPrice !== item.price && (
                          <span className="text-sm text-gray-400 line-through">₹{item.originalPrice}</span>
                        )}
                      </div>
                      {item.numberOfDays && (
                        <span className="text-xs text-gray-500 block mt-1">{item.numberOfDays} Days</span>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fixed Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-black text-white py-2.5 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="font-heading font-bold text-base">Free Delivery on every order</p>
        </div>
      </div>

      <FloatingCart />
    </div>
  );
}

export default SearchPage;
