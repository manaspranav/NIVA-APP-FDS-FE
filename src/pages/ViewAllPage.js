import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Footer from '../components/Footer';
import FloatingCart from '../components/FloatingCart';
import BackToTop from '../components/BackToTop';

function ViewAllPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState('All Items');
  const [wishlistItems, setWishlistItems] = useState([]);

  useEffect(() => {
    // Load items passed from the previous page
    if (location.state?.items) {
      setItems(location.state.items);
      setTitle(location.state.title || 'All Items');
    }

    // Load wishlist
    const updateWishlist = () => {
      const savedWishlist = localStorage.getItem('wishlist');
      const wishlist = savedWishlist ? JSON.parse(savedWishlist) : [];
      setWishlistItems(wishlist.map(item => item.id));
    };

    updateWishlist();
    window.addEventListener('wishlistUpdated', updateWishlist);
    return () => window.removeEventListener('wishlistUpdated', updateWishlist);
  }, [location]);

  const handleAddToCart = (product) => {
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

  const handleItemClick = (item) => {
    navigate(`/product/${item.type}/${item.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-black shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="text-white hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-white">{title}</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 gap-4">
          {items.map(item => {
            const discount = item.originalPrice ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100) : 0;
            const isInWishlist = wishlistItems.includes(item.id);
            
            return (
              <div key={`${item.type}-${item.id}`} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 group">
                <div className="relative overflow-hidden bg-gray-50 rounded-xl">
                  <img
                    loading="lazy"
                    src={item.image}
                    alt={item.name}
                    onClick={() => handleItemClick(item)}
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105 rounded-xl cursor-pointer"
                  />
                  {/* Discount Badge */}
                  {discount > 0 && (
                    <div className="absolute top-0 left-0 bg-green-700 text-white text-xs font-bold px-3 py-2 rounded-br-2xl shadow-lg">
                      {discount}% OFF
                    </div>
                  )}
                  {/* Wishlist Button */}
                  <button
                    onClick={() => handleAddToWishlist(item)}
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
                    onClick={() => handleAddToCart(item)}
                    className="absolute bottom-0 right-0 bg-black text-white px-3 py-2 rounded-tl-2xl hover:bg-gray-800 transition-all duration-200 font-semibold text-sm flex items-center gap-1 shadow-lg"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Add
                  </button>
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-800 text-base">{item.name}</h3>
                    {item.vitamin && (
                      <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                        {item.vitamin}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900">₹{item.price}</span>
                    {item.originalPrice && (
                      <span className="text-sm text-gray-400 line-through">₹{item.originalPrice}</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">/plate</span>
                </div>
              </div>
            );
          })}
        </div>

        {items.length === 0 && (
          <div className="text-center py-16">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-gray-500">No items available</p>
          </div>
        )}
      </div>

      <BackToTop />
      <Footer showFooter={true} />
      <FloatingCart />
    </div>
  );
}

export default ViewAllPage;
