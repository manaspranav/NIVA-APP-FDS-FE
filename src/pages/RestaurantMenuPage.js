import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function RestaurantMenuPage() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [addedIds, setAddedIds] = useState({});
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    fetchData();
    loadCart();
  }, [restaurantId]);

  const loadCart = () => {
    try {
      const saved = localStorage.getItem('cart');
      setCart(saved ? JSON.parse(saved) : []);
    } catch { setCart([]); }
  };

  const fetchData = async () => {
    setLoading(true);
    const [{ data: rest }, { data: items }] = await Promise.all([
      supabase.from('restaurants').select('*').eq('id', restaurantId).single(),
      supabase.from('menu_items').select('*').eq('restaurant_id', restaurantId).eq('is_active', true).order('category'),
    ]);
    // single() is mocked to return null — fallback to list query for mock
    if (rest) {
      setRestaurant(rest);
    } else {
      const { data: list } = await supabase.from('restaurants').select('*').eq('id', restaurantId);
      setRestaurant(list?.[0] || null);
    }
    setMenuItems(items || []);
    setLoading(false);
  };

  const isRestaurantClosed = restaurant && restaurant.restaurant_available === false;

  const addToCart = (item) => {
    if (isRestaurantClosed || item.in_stock === false) return;
    const saved = localStorage.getItem('cart');
    const currentCart = saved ? JSON.parse(saved) : [];
    const idx = currentCart.findIndex(c => c.id === item.id);
    if (idx > -1) {
      currentCart[idx].quantity = (currentCart[idx].quantity || 1) + 1;
    } else {
      currentCart.push({ ...item, quantity: 1 });
    }
    localStorage.setItem('cart', JSON.stringify(currentCart));
    window.dispatchEvent(new Event('cartUpdated'));
    setCart(currentCart);
    setAddedIds(prev => ({ ...prev, [item.id]: true }));
    setTimeout(() => setAddedIds(prev => ({ ...prev, [item.id]: false })), 1500);
  };

  const getQuantityInCart = (itemId) => {
    const found = cart.find(c => c.id === itemId);
    return found ? found.quantity || 1 : 0;
  };

  const categories = ['All', ...Array.from(new Set(menuItems.map(m => m.category).filter(Boolean)))];
  const filtered = activeCategory === 'All' ? menuItems : menuItems.filter(m => m.category === activeCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="h-48 bg-gray-200 animate-pulse"></div>
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-xl p-4 flex gap-4 animate-pulse">
              <div className="w-24 h-24 bg-gray-200 rounded-xl shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 text-lg font-medium">Restaurant not found</p>
          <button onClick={() => navigate(-1)} className="mt-4 text-orange-500 font-semibold hover:underline">Go Back</button>
        </div>
      </div>
    );
  }

  const totalItems = cart.reduce((acc, c) => acc + (c.quantity || 1), 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Hero / Restaurant Header */}
      <div className="relative">
        <div className="h-48 bg-gradient-to-br from-orange-100 to-orange-200 overflow-hidden">
          {restaurant.image_url ? (
            <img src={restaurant.image_url} alt={restaurant.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-20 h-20 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        </div>
        {/* Back button */}
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow-md">
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        {/* Restaurant info overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
          <h1 className="text-white text-2xl font-bold drop-shadow">{restaurant.name}</h1>
          <p className="text-white/80 text-sm">{restaurant.cuisine} · {restaurant.location}</p>
        </div>
      </div>

      {/* Info bar */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-4">
        {restaurant.rating && (
          <span className="flex items-center gap-1 bg-green-600 text-white text-sm font-bold px-2 py-0.5 rounded">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            {restaurant.rating}
          </span>
        )}
        {restaurant.delivery_time_min && restaurant.delivery_time_max && (
          <span className="text-sm text-gray-600 font-medium">{restaurant.delivery_time_min}–{restaurant.delivery_time_max} mins</span>
        )}
        {restaurant.offer_label && (
          <span className="text-sm text-orange-600 font-semibold bg-orange-50 px-2 py-0.5 rounded">{restaurant.offer_label}</span>
        )}
      </div>

      {/* Restaurant Closed Banner */}
      {isRestaurantClosed && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
          <span className="text-red-700 font-semibold text-sm">Restaurant is currently closed — ordering is unavailable</span>
        </div>
      )}

      {/* Category filter tabs */}
      {categories.length > 1 && (
        <div className="bg-white sticky top-0 z-10 border-b border-gray-100">
          <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${activeCategory === cat ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Menu Items */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No items available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(item => (
              <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex gap-4">
                {/* Item image */}
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-orange-50 shrink-0">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-orange-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                  )}
                </div>
                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`w-4 h-4 shrink-0 border-2 rounded-sm flex items-center justify-center ${item.is_veg ? 'border-green-600' : 'border-red-500'}`}>
                          <span className={`w-2 h-2 rounded-full ${item.is_veg ? 'bg-green-600' : 'bg-red-500'}`}></span>
                        </span>
                        <h3 className="font-bold text-gray-800 text-sm truncate">{item.name}</h3>
                      </div>
                      {item.description && <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{item.description}</p>}
                      <p className="text-base font-bold text-gray-800 mt-2">₹{item.price}</p>
                    </div>
                  </div>
                  {/* Out of Stock badge */}
                  {item.in_stock === false && (
                    <div className="mt-2">
                      <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 text-xs font-bold px-2 py-1 rounded-md border border-red-200">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                        Out of Stock
                      </span>
                    </div>
                  )}
                  {/* ADD button */}
                  <div className="mt-3 flex justify-end">
                    {item.in_stock === false || isRestaurantClosed ? (
                      <button
                        disabled
                        className="px-5 py-1.5 border-2 border-gray-300 text-gray-400 font-bold text-sm rounded-lg cursor-not-allowed bg-gray-50"
                      >
                        {item.in_stock === false ? 'Out of Stock' : 'Unavailable'}
                      </button>
                    ) : getQuantityInCart(item.id) > 0 ? (
                      <div className="flex items-center gap-2 border-2 border-orange-500 rounded-lg overflow-hidden">
                        <button
                          onClick={() => {
                            const saved = localStorage.getItem('cart');
                            let c = saved ? JSON.parse(saved) : [];
                            const idx = c.findIndex(x => x.id === item.id);
                            if (idx > -1) {
                              if (c[idx].quantity <= 1) c.splice(idx, 1);
                              else c[idx].quantity -= 1;
                            }
                            localStorage.setItem('cart', JSON.stringify(c));
                            window.dispatchEvent(new Event('cartUpdated'));
                            setCart(c);
                          }}
                          className="w-8 h-8 flex items-center justify-center text-orange-500 font-bold text-lg hover:bg-orange-50"
                        >−</button>
                        <span className="w-6 text-center text-sm font-bold text-orange-600">{getQuantityInCart(item.id)}</span>
                        <button onClick={() => addToCart(item)} className="w-8 h-8 flex items-center justify-center text-orange-500 font-bold text-lg hover:bg-orange-50">+</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(item)}
                        className={`px-5 py-1.5 border-2 border-orange-500 text-orange-600 font-bold text-sm rounded-lg hover:bg-orange-50 transition-all ${addedIds[item.id] ? 'bg-orange-50 scale-95' : ''}`}
                      >
                        {addedIds[item.id] ? 'Added!' : 'ADD'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating cart bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-50">
          <button
            onClick={() => navigate('/customer/cart')}
            className="w-full max-w-2xl mx-auto flex items-center justify-between bg-orange-500 text-white px-5 py-4 rounded-2xl shadow-2xl font-semibold"
          >
            <span className="bg-orange-600 text-white text-xs font-bold px-2 py-0.5 rounded">{totalItems} item{totalItems > 1 ? 's' : ''}</span>
            <span className="text-base font-bold">View Cart</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      )}
    </div>
  );
}

export default RestaurantMenuPage;