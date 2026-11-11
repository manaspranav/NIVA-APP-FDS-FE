import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Share2, ShoppingBag } from 'lucide-react';
function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Load wishlist from localStorage
    loadWishlist();
    updateCartCount();
    
    // Listen for cart updates
    window.addEventListener('cartUpdated', updateCartCount);
    return () => window.removeEventListener('cartUpdated', updateCartCount);
  }, []);

  const updateCartCount = () => {
    const savedCart = localStorage.getItem('cart');
    const cart = savedCart ? JSON.parse(savedCart) : [];
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    setCartCount(totalItems);
  };

  const loadWishlist = () => {
    const savedWishlist = localStorage.getItem('wishlist');
    if (savedWishlist) {
      setWishlistItems(JSON.parse(savedWishlist));
    }
  };

  const removeFromWishlist = (itemId) => {
    const updatedWishlist = wishlistItems.filter(item => item.id !== itemId);
    setWishlistItems(updatedWishlist);
    localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
    
    // Dispatch event to update count in header
    window.dispatchEvent(new Event('wishlistUpdated'));
  };

  const moveToCart = (item) => {
    // Get existing cart
    const savedCart = localStorage.getItem('cart');
    const cart = savedCart ? JSON.parse(savedCart) : [];
    
    // Check if item already in cart
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ ...item, quantity: 1 });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
    
    // Remove from wishlist
    removeFromWishlist(item.id);
  };

  const handleShare = () => {
    const shareUrl = window.location.origin + '/wishlist';
    
    if (navigator.share) {
      navigator.share({
        title: 'My NIVA Wishlist',
        url: shareUrl,
      }).catch(err => console.log('Error sharing:', err));
    } else {
      navigator.clipboard.writeText(shareUrl)
        .then(() => alert('Wishlist link copied to clipboard!'))
        .catch(err => console.error('Failed to copy:', err));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/customer/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-full transition-all"
              >
                <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-800">My Wishlist</h1>
                <p className="text-xs md:text-sm text-gray-500">{wishlistItems.length} items saved</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/customer/search')}
                className="p-2 hover:bg-gray-100 rounded-xl transition-all active:scale-95"
              >
                <Search className="w-5 h-5 text-gray-600" />
              </button>
              {wishlistItems.length > 0 && (
                <button
                  onClick={handleShare}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-all active:scale-95"
                >
                  <Share2 className="w-5 h-5 text-gray-600" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 min-h-[calc(100vh-180px)]">
        {wishlistItems.length === 0 ? (
          // Empty Wishlist State
          <div className="flex items-center justify-center h-full min-h-[60vh]">
            <p className="text-gray-500 text-center text-lg">
              There is nothing in the wishlist
            </p>
          </div>
        ) : (
          // Wishlist Grid - 3 columns
          <div className="grid grid-cols-3 gap-3 md:gap-4 pb-24">
            {wishlistItems.map((item) => {
              const discount = item.originalPrice ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100) : 0;
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 group"
                >
                  {/* Image Section */}
                  <div className="relative overflow-hidden bg-gray-50 rounded-lg">
                    <img 
                      loading="lazy"
                      src={item.image || '/BIryani/biriyani.png'} 
                      alt={item.name}
                      className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105 rounded-lg cursor-pointer"
                      onClick={() => navigate(`/product/${item.type || 'fastfood'}/${item.id}`)}
                    />
                    {discount > 0 && (
                      <div className="absolute top-0 left-0 bg-green-700 text-white text-xs font-bold px-2 py-1 rounded-br-lg shadow-lg">
                        {discount}% OFF
                      </div>
                    )}
                    <button
                      onClick={() => removeFromWishlist(item.id)}
                      className="absolute top-2 right-2 hover:scale-110 transition-all duration-200"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 drop-shadow-lg"
                        fill="#000000"
                        viewBox="0 0 24 24"
                        stroke="#000000"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveToCart(item)}
                      className="absolute bottom-0 right-0 bg-black text-white px-2 py-1 rounded-tl-lg hover:bg-gray-800 transition-all duration-200 font-semibold text-xs flex items-center gap-1 shadow-lg"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add
                    </button>
                  </div>

                  {/* Content Section */}
                  <div className="p-2">
                    <h3 className="font-semibold text-gray-800 text-xs mb-1 truncate">{item.name}</h3>
                    {item.vitamin && (
                      <span className="bg-green-100 text-green-700 text-xs font-bold px-1.5 py-0.5 rounded-full inline-block mb-1">
                        {item.vitamin}
                      </span>
                    )}
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold text-gray-900">₹{item.price}</span>
                      {item.originalPrice && (
                        <span className="text-xs text-gray-400 line-through">₹{item.originalPrice}</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">/ 1 plate</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Floating Cart - Bottom Center */}
      {cartCount > 0 && (
        <button
          onClick={() => navigate('/customer/cart')}
          className="fixed left-1/2 transform -translate-x-1/2 bottom-6 z-50 bg-black hover:bg-gray-800 text-white rounded-full p-4 shadow-lg flex items-center gap-2"
        >
          <ShoppingBag className="w-6 h-6" />
          <span className="text-sm font-medium">
            {cartCount} {cartCount === 1 ? 'product' : 'products'}
          </span>
        </button>
      )}
    </div>
  );
}

export default WishlistPage;
