import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import { VENDORS } from '../data/vendors';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function RestaurantsPage() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState(VENDORS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/vendors/list`);
        const data = await res.json();
        if (data.success && data.vendors?.length) {
          setVendors(
            data.vendors.map((v) => ({
              id: v.id,
              slug: v.slug,
              name: v.name,
              tagline: v.tagline,
              description: v.description,
              bannerImage: v.banner_image,
              logoImage: v.logo_image,
              isOpen: v.isOpen,
              acceptingOrders: v.acceptingOrders,
              menuRoute: v.slug === 'niva-fastfoods' ? '/customer/dashboard' : `/restaurant/${v.slug}`,
            }))
          );
        }
      } catch (e) {
        console.warn('Using local vendor list', e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button type="button" onClick={() => navigate(-1)} className="text-sm text-gray-600 hover:text-black">
            Back
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Restaurants</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {loading ? (
          <p className="text-gray-500 text-sm">Loading...</p>
        ) : (
          vendors.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => navigate(v.menuRoute || `/restaurant/${v.slug}`)}
              className="w-full text-left bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-gray-400 transition-colors"
            >
              <div className="h-36 bg-gray-100 relative">
                <img
                  src={v.bannerImage}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                {!v.isOpen && (
                  <span className="absolute top-3 right-3 bg-gray-900 text-white text-xs px-2 py-1 rounded">
                    Closed
                  </span>
                )}
              </div>
              <div className="p-4">
                <h2 className="font-semibold text-gray-900">{v.name}</h2>
                <p className="text-sm text-gray-500 mt-1">{v.tagline}</p>
                {!v.acceptingOrders && v.isOpen && (
                  <p className="text-xs text-amber-700 mt-2">Not accepting orders right now</p>
                )}
              </div>
            </button>
          ))
        )}
      </main>
      <Footer />
    </div>
  );
}
