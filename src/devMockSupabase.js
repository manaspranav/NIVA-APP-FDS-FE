/**
 * DEV-ONLY MOCK SUPABASE CLIENT
 * REACT_APP_DEV_MOCK=true  → uses this file (localStorage, no network)
 * REACT_APP_DEV_MOCK=false → uses real Supabase credentials from .env
 *
 * To set role open browser console and run:
 *   localStorage.setItem('devMockRole', 'admin')
 *   localStorage.setItem('devMockRole', 'customer')
 *   localStorage.setItem('devMockRole', 'partner')
 * then refresh.
 */

const fakeUser = (role) => ({
  id: `dev-${role}-id`,
  email: `${role}@dev.local`,
  user_metadata: { role },
  app_metadata: { role },
});

const fakeSession = (role) =>
  role ? { access_token: 'dev-mock-token', refresh_token: 'dev-mock-refresh', user: fakeUser(role) } : null;

/* ─── restaurants ─── */
const getMockRestaurants = () => {
  try { const s = localStorage.getItem('mockRestaurants'); if (s) return JSON.parse(s); } catch {}
  const defaults = [
    { id: 'r1', name: 'Spicy One Biryani Point', cuisine: 'Biryani', location: 'Old Guntur', rating: 4.3, delivery_time_min: 25, delivery_time_max: 35, offer_label: '70% OFF UPTO ₹130', image_url: '', is_active: true, created_at: new Date().toISOString() },
    { id: 'r2', name: 'Dragon Chinese Kitchen', cuisine: 'Chinese', location: 'Brodipet', rating: 4.1, delivery_time_min: 20, delivery_time_max: 30, offer_label: 'FREE DELIVERY', image_url: '', is_active: true, created_at: new Date().toISOString() },
    { id: 'r3', name: 'Andhra Meals Corner', cuisine: 'South Indian', location: 'Arundelpet', rating: 4.5, delivery_time_min: 15, delivery_time_max: 25, offer_label: '', image_url: '', is_active: true, created_at: new Date().toISOString() },
  ];
  localStorage.setItem('mockRestaurants', JSON.stringify(defaults));
  return defaults;
};
const saveMockRestaurants = (list) => localStorage.setItem('mockRestaurants', JSON.stringify(list));

/* ─── menu_items ─── */
const getMockMenuItems = () => {
  try { const s = localStorage.getItem('mockMenuItems'); if (s) return JSON.parse(s); } catch {}
  const defaults = [
    { id: 'm1', restaurant_id: 'r1', name: 'Chicken Biryani', price: 180, description: 'Aromatic basmati rice with tender chicken', image_url: '', category: 'Biryani', is_veg: false, is_active: true, created_at: new Date().toISOString() },
    { id: 'm2', restaurant_id: 'r1', name: 'Veg Biryani', price: 130, description: 'Fragrant rice with fresh vegetables', image_url: '', category: 'Biryani', is_veg: true, is_active: true, created_at: new Date().toISOString() },
    { id: 'm3', restaurant_id: 'r2', name: 'Fried Rice', price: 120, description: 'Wok-tossed rice with veggies', image_url: '', category: 'Rice', is_veg: true, is_active: true, created_at: new Date().toISOString() },
    { id: 'm4', restaurant_id: 'r2', name: 'Chicken Manchurian', price: 160, description: 'Crispy chicken in spicy manchurian sauce', image_url: '', category: 'Starters', is_veg: false, is_active: true, created_at: new Date().toISOString() },
    { id: 'm5', restaurant_id: 'r3', name: 'Meals Plate', price: 90, description: 'Full Andhra meals with rice, dal, curries', image_url: '', category: 'Meals', is_veg: true, is_active: true, created_at: new Date().toISOString() },
  ];
  localStorage.setItem('mockMenuItems', JSON.stringify(defaults));
  return defaults;
};
const saveMockMenuItems = (list) => localStorage.setItem('mockMenuItems', JSON.stringify(list));

/* ─── table-aware query builder ─── */
const queryBuilder = (tableName) => {
  let _filters = {};
  let _isInsert = false; let _insertPayload = null;
  let _isUpdate = false; let _updatePayload = null;
  let _isDelete = false;

  const builder = {
    select: () => builder,
    insert: (payload) => { _isInsert = true; _insertPayload = Array.isArray(payload) ? payload[0] : payload; return builder; },
    update: (payload) => { _isUpdate = true; _updatePayload = payload; return builder; },
    delete: () => { _isDelete = true; return builder; },
    upsert: () => builder,
    eq: (col, val) => { _filters[col] = val; return builder; },
    neq: () => builder,
    in: () => builder,
    order: () => builder,
    limit: () => builder,
    single: () => Promise.resolve({ data: null, error: null }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    then: (resolve) => {
      /* ── restaurants ── */
      if (tableName === 'restaurants') {
        let list = getMockRestaurants();
        if (_isInsert && _insertPayload) {
          const item = { ..._insertPayload, id: `r${Date.now()}`, created_at: new Date().toISOString() };
          list = [item, ...list]; saveMockRestaurants(list);
          return resolve({ data: [item], error: null });
        }
        if (_isUpdate && _updatePayload && _filters.id) {
          list = list.map(r => r.id === _filters.id ? { ...r, ..._updatePayload } : r);
          saveMockRestaurants(list);
          return resolve({ data: list.filter(r => r.id === _filters.id), error: null });
        }
        if (_isDelete && _filters.id) {
          list = list.filter(r => r.id !== _filters.id); saveMockRestaurants(list);
          return resolve({ data: [], error: null });
        }
        if ('is_active' in _filters) list = list.filter(r => r.is_active === _filters.is_active);
        return resolve({ data: list, error: null });
      }

      /* ── menu_items ── */
      if (tableName === 'menu_items') {
        let list = getMockMenuItems();
        if (_isInsert && _insertPayload) {
          const item = { ..._insertPayload, id: `m${Date.now()}`, created_at: new Date().toISOString() };
          list = [item, ...list]; saveMockMenuItems(list);
          return resolve({ data: [item], error: null });
        }
        if (_isUpdate && _updatePayload && _filters.id) {
          list = list.map(m => m.id === _filters.id ? { ...m, ..._updatePayload } : m);
          saveMockMenuItems(list);
          return resolve({ data: list.filter(m => m.id === _filters.id), error: null });
        }
        if (_isDelete && _filters.id) {
          list = list.filter(m => m.id !== _filters.id); saveMockMenuItems(list);
          return resolve({ data: [], error: null });
        }
        if ('restaurant_id' in _filters) list = list.filter(m => m.restaurant_id === _filters.restaurant_id);
        if ('is_active' in _filters) list = list.filter(m => m.is_active === _filters.is_active);
        return resolve({ data: list, error: null });
      }

      return resolve({ data: [], error: null });
    },
  };
  return builder;
};

export function createMockSupabase() {
  return {
    auth: {
      getSession: async () => {
        const role = localStorage.getItem('devMockRole');
        return { data: { session: fakeSession(role) }, error: null };
      },
      getUser: async () => {
        const role = localStorage.getItem('devMockRole');
        return { data: { user: role ? fakeUser(role) : null }, error: null };
      },
      onAuthStateChange: (_cb) => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: async ({ email }) => {
        let role = 'customer';
        if (email.includes('@admin.')) role = 'admin';
        else if (email.includes('@partner.')) role = 'partner';
        localStorage.setItem('devMockRole', role);
        return { data: { session: fakeSession(role), user: fakeUser(role) }, error: null };
      },
      signOut: async () => { localStorage.removeItem('devMockRole'); return { error: null }; },
    },
    from: (table) => queryBuilder(table),
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
    channel: () => ({ on: () => ({ subscribe: () => {} }) }),
    removeChannel: () => {},
  };
}