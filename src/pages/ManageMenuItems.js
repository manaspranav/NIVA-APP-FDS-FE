import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const EMPTY_FORM = {
  name: '', price: '', description: '',
  image_url: '', category: '', is_veg: true, is_active: true,
};

function ManageMenuItems() {
  const navigate = useNavigate();
  const { restaurantId } = useParams();
  const location = useLocation();
  const restaurantName = location.state?.restaurantName || 'Restaurant';

  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  /* ── Auth ── */
  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { navigate('/sys-x9k3m-auth'); return; }
        const role = session.user?.user_metadata?.role || session.user?.app_metadata?.role;
        if (role !== 'admin') { await supabase.auth.signOut(); navigate('/sys-x9k3m-auth'); return; }
        setAuthenticated(true);
        await fetchItems();
      } catch { navigate('/sys-x9k3m-auth'); }
    })();
  }, [navigate, restaurantId]);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });
    if (!error) setItems(data || []);
    setLoading(false);
  };

  const handleSave = async () => {
    setError('');
    if (!form.name.trim()) { setError('Item name is required.'); return; }
    if (!form.price || isNaN(form.price) || parseFloat(form.price) <= 0) { setError('Valid price is required.'); return; }

    setSaving(true);
    const payload = {
      restaurant_id: restaurantId,
      name: form.name.trim(),
      price: parseFloat(form.price),
      description: form.description.trim() || null,
      image_url: form.image_url.trim() || null,
      category: form.category.trim() || null,
      is_veg: form.is_veg,
      is_active: form.is_active,
    };

    let err;
    if (editingId) {
      ({ error: err } = await supabase.from('menu_items').update(payload).eq('id', editingId));
    } else {
      ({ error: err } = await supabase.from('menu_items').insert([payload]));
    }

    setSaving(false);
    if (err) { setError(err.message); return; }
    setSuccess(editingId ? 'Item updated!' : 'Item added!');
    setTimeout(() => setSuccess(''), 3000);
    setShowForm(false); setEditingId(null); setForm(EMPTY_FORM);
    await fetchItems();
  };

  const handleDelete = async (id) => {
    const { error: err } = await supabase.from('menu_items').delete().eq('id', id);
    if (!err) {
      setItems(prev => prev.filter(m => m.id !== id));
      setSuccess('Item deleted.'); setTimeout(() => setSuccess(''), 3000);
    }
    setDeleteConfirm(null);
  };

  const startEdit = (m) => {
    setForm({
      name: m.name || '', price: m.price != null ? String(m.price) : '',
      description: m.description || '', image_url: m.image_url || '',
      category: m.category || '', is_veg: m.is_veg !== false, is_active: m.is_active !== false,
    });
    setEditingId(m.id); setShowForm(true); setError('');
  };

  const cancelForm = () => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); setError(''); };

  if (loading && !authenticated) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>;
  }
  if (!authenticated) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/sys-m5r9t-restaurants')} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Menu — {restaurantName}</h1>
              <p className="text-xs text-gray-500">{items.length} item{items.length !== 1 ? 's' : ''} · visible to customers instantly</p>
            </div>
          </div>
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM); setError(''); }}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Item
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {success && (
          <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            {success}
          </div>
        )}

        {/* Add / Edit Form */}
        {showForm && (
          <div className="mb-6 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">{editingId ? 'Edit Item' : 'Add New Item'}</h2>
              <button onClick={cancelForm} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6">
              {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">{error}</div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Item Name *</label>
                  <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Chicken Biryani" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Price (₹) *</label>
                  <input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="e.g. 180" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                  <input type="text" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Biryani, Starters, Drinks" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description of the dish..." rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Image URL</label>
                  <input type="url" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent" />
                  {form.image_url && <img src={form.image_url} alt="preview" className="mt-2 h-20 w-32 object-cover rounded-lg border border-gray-200" onError={e => e.target.style.display = 'none'} />}
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-semibold text-gray-700">Veg</label>
                  <button type="button" onClick={() => setForm(f => ({ ...f, is_veg: !f.is_veg }))} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.is_veg ? 'bg-green-500' : 'bg-red-400'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.is_veg ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                  <span className={`text-xs font-semibold ${form.is_veg ? 'text-green-600' : 'text-red-500'}`}>{form.is_veg ? 'Veg' : 'Non-Veg'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-semibold text-gray-700">Active</label>
                  <button type="button" onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.is_active ? 'bg-orange-500' : 'bg-gray-300'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2">
                  {saving && <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
                  {editingId ? 'Save Changes' : 'Add Item'}
                </button>
                <button onClick={cancelForm} className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Items List */}
        {loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div></div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm">
            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
            <p className="text-gray-500 font-medium">No menu items yet</p>
            <p className="text-gray-400 text-sm mt-1">Add your first item to show it on the customer page</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(m => (
              <div key={m.id} className={`bg-white rounded-xl shadow-sm border p-4 flex items-center gap-4 ${m.is_active ? 'border-gray-100' : 'border-dashed border-gray-300 opacity-60'}`}>
                {/* Image */}
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-orange-50 shrink-0">
                  {m.image_url ? (
                    <img src={m.image_url} alt={m.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-orange-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {/* Veg/Non-veg indicator */}
                    <span className={`w-4 h-4 shrink-0 border-2 rounded-sm flex items-center justify-center ${m.is_veg ? 'border-green-600' : 'border-red-500'}`}>
                      <span className={`w-2 h-2 rounded-full ${m.is_veg ? 'bg-green-600' : 'bg-red-500'}`}></span>
                    </span>
                    <h3 className="font-bold text-gray-800 truncate">{m.name}</h3>
                    {!m.is_active && <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full shrink-0">Hidden</span>}
                  </div>
                  {m.category && <p className="text-xs text-orange-500 font-medium mt-0.5">{m.category}</p>}
                  {m.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{m.description}</p>}
                  <p className="text-base font-bold text-gray-800 mt-1">₹{m.price}</p>
                </div>
                {/* Actions */}
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => startEdit(m)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors" title="Edit">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button onClick={() => setDeleteConfirm(m.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors" title="Delete">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
            </div>
            <h3 className="text-lg font-bold text-gray-800 text-center mb-1">Delete Item?</h3>
            <p className="text-gray-500 text-sm text-center mb-6">This will permanently remove the menu item.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-semibold text-sm hover:bg-red-600 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageMenuItems;