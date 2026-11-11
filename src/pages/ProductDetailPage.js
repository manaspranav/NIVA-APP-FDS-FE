import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Heart, Share2, ArrowLeft } from 'lucide-react';
import { customerSupabase as supabase } from '../customerSupabase';
import { fastfoods, getProductById } from '../data/productsData';

const ProductDetailPage = () => {
  const { id, type } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [relatedItems, setRelatedItems] = useState([]);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [user, setUser] = useState(null);
  const [customerProfile, setCustomerProfile] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [loadingRelatedId, setLoadingRelatedId] = useState(null);
  const [isReloading, setIsReloading] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setIsReloading(false);
    loadProductData();
    checkUserAuth();
    checkWishlistStatus();
  }, [id, type]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const checkWishlistStatus = () => {
    const savedWishlist = localStorage.getItem('wishlist');
    const wishlist = savedWishlist ? JSON.parse(savedWishlist) : [];
    setIsInWishlist(wishlist.some(item => item.id === parseInt(id)));
  };

  const checkUserAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await fetchCustomerProfile(session.user.id);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    }
  };

  const fetchCustomerProfile = async (userId) => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/customers/${userId}`);
      const result = await response.json();

      if (result.success && result.data) {
        setCustomerProfile(result.data);
        return result.data;
      }

      return null;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  const isProfileComplete = (profile) => {
    if (!user) return false;
    if (!profile) return false;

    // Check if all required fields are filled
    return !!(
      profile.name &&
      profile.email &&
      profile.phone &&
      profile.college
    );
  };

  const loadProductData = () => {
    // Get current product using centralized data
    const currentProduct = getProductById(id, type);
    setProduct(currentProduct);

    if (!currentProduct) {
      return;
    }

    if (type === 'fastfood') {
      // Show related items from the same fastfood category
      const sameCategory = fastfoods.filter(f => f.category === currentProduct.category && f.id !== parseInt(id));
      const otherFastfoods = fastfoods.filter(f => f.category !== currentProduct.category && f.id !== parseInt(id));
      setRelatedItems([...sameCategory, ...otherFastfoods].slice(0, 4));
    } else {
      setRelatedItems(fastfoods.filter(f => f.id !== parseInt(id)).slice(0, 4));
    }
  };

  const handleRelatedClick = (item, itemType) => {
    setLoadingRelatedId(item.id);
    setIsReloading(true);
    setTimeout(() => {
      navigate(`/product/${itemType}/${item.id}`);
    }, 400);
  };

  const handleAddToCart = (item) => {
    // Check if product is out of stock
    if (item.outOfStock) {
      alert(`"${item.name}" is currently out of stock.`);
      return;
    }

    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItem = cart.find(cartItem => cartItem.id === item.id && cartItem.type === item.type);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ ...item, quantity: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const handleBuyNow = async (item) => {
    // Check if user is logged in
    if (!user) {
      navigate('/customer/login', { state: { from: `/product/${type}/${id}` } });
      return;
    }

    const latestProfile = customerProfile || await fetchCustomerProfile(user.id);

    // Check if profile is complete
    if (!isProfileComplete(latestProfile)) {
      navigate('/customer/update-profile', { state: { from: `/product/${type}/${id}`, notice: { variant: 'info', title: 'Complete your profile', message: 'Please continue the details to proceed.' } } });
      return;
    }

    const cart = JSON.parse(localStorage.getItem('cart')) || [];

    // Normal add to cart behavior
    const existingItem = cart.find(cartItem => cartItem.id === item.id && cartItem.type === item.type);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ ...item, quantity: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));

    // Navigate to checkout page
    navigate('/checkout');
  };

  const handleToggleWishlist = () => {
    const savedWishlist = localStorage.getItem('wishlist');
    const wishlist = savedWishlist ? JSON.parse(savedWishlist) : [];

    const itemIndex = wishlist.findIndex(item => item.id === product.id && item.type === product.type);

    if (itemIndex > -1) {
      wishlist.splice(itemIndex, 1);
      setIsInWishlist(false);
    } else {
      wishlist.push(product);
      setIsInWishlist(true);
    }

    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    window.dispatchEvent(new Event('wishlistUpdated'));
  };

  const handleShare = async () => {
    const shareData = {
      title: product.name,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Product not found</h2>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const discount = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Sticky Header - Shows on Scroll */}
      <div className={`fixed top-0 left-0 right-0 bg-gray-200 border-b border-gray-200 px-4 py-3 flex items-center justify-between z-50 transition-transform duration-300 ${isScrolled ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/customer/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-full transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={() => navigate('/customer/search')}
            className="p-2 hover:bg-gray-100 rounded-full transition-all"
          >
            <Search className="w-5 h-5 text-gray-700" />
          </button>
          <h2 className="text-lg font-bold text-gray-900 truncate max-w-[150px]">{product?.name}</h2>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleToggleWishlist}
            className="p-2 hover:bg-gray-100 rounded-full transition-all"
          >
            <Heart
              className={`w-5 h-5 ${isInWishlist ? 'fill-black text-black' : 'text-gray-700'}`}
            />
          </button>
          <button
            onClick={handleShare}
            className="p-2 hover:bg-gray-100 rounded-full transition-all"
          >
            <Share2 className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Full Width Product Image with Icons */}
      <div className="relative w-full">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-96 object-cover"
        />

        {/* Top Icons Bar */}
        <div className="absolute top-4 left-0 right-0 px-4 flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/customer/dashboard')}
              className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={() => navigate('/customer/search')}
              className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-all"
            >
              <Search className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleToggleWishlist}
              className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-all"
            >
              <Heart
                className={`w-5 h-5 ${isInWishlist ? 'fill-black text-black' : 'text-gray-700'}`}
              />
            </button>
            <button
              onClick={handleShare}
              className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-all"
            >
              <Share2 className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>
      </div>

      {/* Product Details */}
      <div className="px-4 py-6">
        {/* Product Name */}
        <h1 className="text-2xl font-bold text-gray-900 mb-3">{product.name}</h1>

        {/* Price Section */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl font-bold text-gray-900">₹{product.price}</span>
          {product.originalPrice && product.originalPrice !== product.price && (
            <>
              <span className="text-xl text-gray-400 line-through">₹{product.originalPrice}</span>
              <span className="bg-green-700 text-white text-sm font-bold px-3 py-1 rounded-full">
                {discount}% OFF
              </span>
            </>
          )}
        </div>

        {/* Description */}
        <div className="mb-6">
          <p className="text-gray-700 text-base leading-relaxed">{product.description}</p>
        </div>

        {/* FastFood Details */}
        {type === 'fastfood' && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Product Details</h2>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-2">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Category:</span> {product.category}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Serving:</span> 1 plate
              </p>
            </div>
          </div>
        )}

        {/* People Also Bought Section */}
        {relatedItems.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">People Also Bought</h2>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide">
              {relatedItems.map((item) => {
                const itemType = item.type || 'fastfood';
                return (
                  <div
                    key={item.id}
                    onClick={() => handleRelatedClick(item, itemType)}
                    className="relative flex-shrink-0 w-40 bg-white rounded-xl border-2 border-gray-100 overflow-hidden cursor-pointer hover:border-gray-300 transition-all"
                  >
                    <img loading="lazy" src={item.image} alt={item.name} className="w-full h-24 object-cover" />
                    <div className="p-3">
                      <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                      <p className="text-sm font-bold text-gray-900">₹{item.price}</p>
                    </div>
                    {loadingRelatedId === item.id && (
                      <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center">
                        <div className="h-6 w-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                        <p className="mt-2 text-xs font-semibold text-gray-900">Loading...</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex gap-3 z-50">
        {product?.outOfStock ? (
          <button
            disabled
            className="flex-1 py-3 bg-gray-300 text-gray-500 font-bold rounded-xl cursor-not-allowed"
          >
            Out of Stock
          </button>
        ) : (
          <>
            <button
              onClick={() => handleAddToCart(product)}
              className="flex-1 py-3 bg-gray-300 text-gray-900 font-bold rounded-xl hover:bg-gray-400 transition-all"
            >
              Add to Cart
            </button>
            <button
              onClick={() => handleBuyNow(product)}
              className="flex-1 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-all"
            >
              Buy Now
            </button>
          </>
        )}
      </div>

      {/* Full Screen Reload Animation */}
      {isReloading && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center transition-opacity duration-300">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-4"></div>
          <p className="text-lg font-bold text-gray-900 animate-pulse">Loading Product...</p>
        </div>
      )}

    </div>
  );
};

export default ProductDetailPage;
