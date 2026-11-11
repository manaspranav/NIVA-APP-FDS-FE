import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';

function FloatingCart() {
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show cart on these pages
  const hideOnPages = ['/customer/edit-profile', '/customer/cart','/customer/login','/customer/register'];
  const shouldHide = hideOnPages.some(path => location.pathname === path);

  useEffect(() => {
    const updateCartCount = () => {
      const savedCart = localStorage.getItem('cart');
      const cart = savedCart ? JSON.parse(savedCart) : [];
      const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
      setCartCount(totalItems);
    };

    updateCartCount();
    window.addEventListener('cartUpdated', updateCartCount);
    return () => window.removeEventListener('cartUpdated', updateCartCount);
  }, []);

  if (shouldHide || cartCount === 0) return null;

  return (
    <button
      onClick={() => navigate('/customer/cart')}
      className="fixed right-6 bottom-24 z-50 bg-black hover:bg-gray-800 text-white rounded-full p-4 shadow-lg flex items-center gap-2"
    >
      <ShoppingBag className="w-6 h-6" />
      <span className="text-sm font-medium">
        {cartCount} {cartCount === 1 ? 'product' : 'products'}
      </span>
    </button>
  );
}

export default FloatingCart;
