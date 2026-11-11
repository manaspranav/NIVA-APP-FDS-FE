import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Minus } from 'lucide-react';
import Footer from '../components/Footer';
import { getVendorBySlug } from '../data/vendors';
import { getMenuByVendorSlug } from '../data/productCatalog';
import { addToCart, getCartItems, getCartVendorId, replaceCartVendor } from '../utils/cartStorage';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function VendorRestaurantPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const vendor = getVendorBySlug(slug);
  const [menu, setMenu] = useState(() => getMenuByVendorSlug(slug));
  const [cartCount, setCartCount] = useState(0);
  const [availability, setAvailability] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!vendor) return;
    setMenu(getMenuByVendorSlug(slug));
    const refreshCart = () => {
      const items = getCartItems();
      if (getCartVendorId() === vendor.id) {
        setCartCount(items.reduce((s, i) => s + (i.quantity || 1), 0));
      } else {
        setCartCount(0);
      }
    };
    refreshCart();
    window.addEventListener('cartUpdated', refreshCart);
    return () => window.removeEventListener('cartUpdated', refreshCart);
  }, [slug, vendor]);

  useEffect(() => {
    if (!slug) return;
    fetch(`${API_URL}/api/vendors/${slug}/slot-availability`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setAvailability(data);
      })
      .catch(() => {});
  }, [slug]);

  const categories = useMemo(() => {
    const cats = [...new Set(menu.map((m) => m.category))];
    return cats;
  }, [menu]);

  const canOrder =
    availability?.isOpen !== false &&
    availability?.acceptingOrders !== false;

  const handleAdd = (item) => {
    if (!canOrder) {
      setMessage('This restaurant is not accepting orders right now.');
      return;
    }
    const result = addToCart(vendor.id, item, 1);
    if (!result.ok && result.reason === 'vendor_mismatch') {
      const ok = window.confirm(
        'Your cart has items from another restaurant. Clear cart and add this item?'
      );
      if (ok) {
        replaceCartVendor(vendor.id, [{ ...item, quantity: 1 }]);
        setCartCount(1);
      }
      return;
    }
    setMessage('');
    setCartCount(getCartItems().reduce((s, i) => s + (i.quantity || 1), 0));
  };

  if (!vendor) {
    return (
      <div className="p-8 text-center">
        <p>Restaurant not found.</p>
        <button type="button" className="mt-4 underline" onClick={() => navigate('/restaurants')}>
          All restaurants
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="h-44 bg-gray-100 relative">
        <img
          src={vendor.bannerImage}
          alt=""
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = vendor.logoImage;
          }}
        />
        <button
          type="button"
          onClick={() => navigate('/restaurants')}
          className="absolute top-4 left-4 bg-white/90 text-sm px-3 py-1.5 rounded-lg"
        >
          Back
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-6 relative z-10">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <h1 className="text-xl font-bold text-gray-900">{vendor.name}</h1>
          <p className="text-sm text-gray-500 mt-1">{vendor.tagline}</p>
          {!canOrder && (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">
              Orders are paused or slots are off. Please check back later.
            </p>
          )}
          {message && <p className="text-sm text-red-600 mt-2">{message}</p>}
        </div>

        {categories.map((cat) => (
          <section key={cat} className="mt-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{cat}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {menu
                .filter((m) => m.category === cat)
                .map((item) => (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-xl overflow-hidden flex flex-col"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-32 w-full object-cover bg-gray-100"
                      onError={(e) => {
                        e.target.className = 'h-32 w-full bg-gray-200';
                      }}
                    />
                    <div className="p-3 flex-1 flex flex-col">
                      <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2 flex-1">{item.description}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="font-semibold text-gray-900">₹{item.price}</span>
                        <button
                          type="button"
                          disabled={!canOrder}
                          onClick={() => handleAdd(item)}
                          className="flex items-center gap-1 bg-black text-white text-xs font-medium px-3 py-1.5 rounded-lg disabled:opacity-40"
                        >
                          <Plus className="w-3 h-3" /> Add
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        ))}
      </div>

      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/checkout', { state: { vendorId: vendor.id } })}
            className="w-full max-w-3xl mx-auto block bg-black text-white font-semibold py-3 rounded-xl"
          >
            View cart ({cartCount}) · Checkout
          </button>
        </div>
      )}

      <Footer />
    </div>
  );
}
