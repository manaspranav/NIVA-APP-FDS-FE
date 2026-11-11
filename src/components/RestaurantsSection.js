import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function RestaurantsSection() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let subscription;
    const fetchAndSubscribe = async () => {
      const { data } = await supabase.from('restaurants').select('*').eq('is_active', true).order('created_at', { ascending: false });
      setRestaurants(data || []);
      setLoading(false);
      subscription = supabase.channel('restaurants_live')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurants' }, () => {
          supabase.from('restaurants').select('*').eq('is_active', true).order('created_at', { ascending: false })
            .then(({ data: updated }) => setRestaurants(updated || []));
        }).subscribe();
    };
    fetchAndSubscribe();
    return () => { if (subscription) supabase.removeChannel(subscription); };
  }, []);

  if (loading) {
    return (
      <div className="px-4 py-6">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="rounded-xl overflow-hidden">
              <div className="h-36 bg-gray-200 animate-pulse"></div>
              <div className="p-2 space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 w-2/3 bg-gray-100 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (restaurants.length === 0) return null;

  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Restaurants Near You</h2>
          <p className="text-sm text-gray-500 mt-0.5">Order directly from your favourite spots</p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {restaurants.map(r => {
          const isClosed = r.restaurant_available === false;
          return (
            <div
              key={r.id}
              onClick={() => navigate(`/restaurant/${r.id}`)}
              className={`bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group ${isClosed ? 'opacity-75' : ''}`}
            >
              <div className="relative h-36 bg-gradient-to-br from-orange-50 to-orange-100 overflow-hidden">
                {r.image_url ? (
                  <img src={r.image_url} alt={r.name} className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${isClosed ? 'grayscale' : ''}`} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-14 h-14 text-orange-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  </div>
                )}
                {isClosed && (
                  <div className="absolute top-0 left-0 right-0 bottom-0 bg-black/40 flex items-center justify-center">
                    <span className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                      Restaurant Closed
                    </span>
                  </div>
                )}
                {!isClosed && r.offer_label && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 to-transparent px-2.5 py-2">
                    <span className="text-white text-xs font-bold leading-tight block">{r.offer_label}</span>
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-bold text-gray-800 text-sm truncate">{r.name}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  {r.rating && (
                    <span className="flex items-center gap-0.5 text-xs font-semibold text-white bg-green-600 px-1.5 py-0.5 rounded">
                      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                      {r.rating}
                    </span>
                  )}
                  {r.delivery_time_min && r.delivery_time_max && <span className="text-xs text-gray-500">• {r.delivery_time_min}–{r.delivery_time_max} mins</span>}
                </div>
                {r.cuisine && <p className="text-xs text-gray-500 mt-0.5 truncate">{r.cuisine}</p>}
                {r.location && <p className="text-xs text-gray-400 truncate">{r.location}</p>}
                {isClosed && <p className="text-xs text-red-500 font-semibold mt-1">Currently closed</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RestaurantsSection;