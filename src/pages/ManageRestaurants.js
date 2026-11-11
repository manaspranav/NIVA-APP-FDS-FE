import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { secureApiCall } from '../utils/secureApi';

const API_URL = process.env.REACT_APP_API_URL || '';

const EMPTY_FORM = {
  name: '', cuisine: '', location: '',
  owner_phone: '', owner_password: '',
  is_active: true, restaurant_available: true,
};

function ManageRestaurants() {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resetPasswordModal, setResetPasswordModal] = useState(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { navigate('/sys-x9k3m-auth'); return; }
        const role = session.user?.user_metadata?.role || session.user?.app_metadata?.role;
        if (role !== 'admin') { await supabase.auth.signOut(); navigate('/sys-x9k3m-auth'); return; }
        setAuthenticated(true);
        await fetchRestaurants();
      } catch { navigate('/sys-x9k3m-auth'); }
    })();
  }, [navigate]);

  const fetchRestaurants = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('restaurants')
      .select('id, name, cuisine, location, owner_phone, is_active, restaurant_available, image_url, created_at')
      .order('created_at', { ascending: false });
    if (!error) setRestaurants(data || []);
    setLoading(false);
  };

  const handleSave = async () => {
    setError('');
    if (!form.name.trim()) { setError('Restaurant name is required.'); return; }
    if (!form.cuisine.trim()) { setError('Cuisine is required.'); return; }
    if (!form.location.trim()) { setError('Location is required.'); return; }

    setSaving(true);
    try {
      if (editingId) {
        // PUT /api/admin/restaurants/:id
        const response = await secureApiCall(`${API_URL}/api/admin/restaurants/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify({
            owner_phone: form.owner_phone.trim() || null,
            is_active: form.is_active,
            restaurant_available: form.restaurant_available,
          }),
        });
        const result = await response.json();
        if (!response.ok) {
          if (response.status === 409) {
            setError('This phone number is already assigned to another restaurant.');
          } else {
            setError(result.message || 'Failed to update restaurant.');
          }
          setSaving(false);
          return;
        }
        setSuccess('Restaurant updated!');
      } else {
        // POST /api/admin/restaurants
        const payload = {
          name: form.name.trim(),
          cuisine: form.cuisine.trim(),
          location: form.location.trim(),
          owner_phone: form.owner_phone.trim() || null,
          owner_password: form.owner_password || null,
          is_active: form.is_active,
          restaurant_available: form.restaurant_available,
        };
        const response = await secureApiCall(`${API_URL}/api/admin/restaurants`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (!response.ok) {
          if (response.status === 409) {
            setError('This phone number is already assigned to another restaurant.');
          } else {
            setError(result.message || 'Failed to create restaurant.');
          }
          setSaving(false);
          return;
        }
        setSuccess('Restaurant added!');
      }
      setTimeout(() => setSuccess(''), 3000);
      setShowForm(false); setEditingId(null); setForm(EMPTY_FORM);
      await fetchRestaurants();
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    }
    setSaving(false);
  };

  const handleResetPassword = async () => {
    if (!resetPassword.trim()) { setError('Password is required.'); return; }
    setResettingPassword(true);
    setError('');
    try {
      const response = await secureApiCall(
        `${API_URL}/api/admin/restaurants/${resetPasswordModal.id}/reset-password`,
        {
          method: 'POST',
          body: JSON.stringify({ new_password: resetPassword }),
        }
      );
      const result = await response.json();
      if (!response.ok) {
        setError(result.message || 'Failed to reset password.');
        setResettingPassword(false);
        return;
      }
      setSuccess(`Password reset for ${resetPasswordModal.name}!`);
      setTimeout(() => setSuccess(''), 3000);
      setResetPasswordModal(null);
      setResetPassword('');
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    }
    setResettingPassword(false);
  };

  const handleDelete = async (id) => {
    const { error: err } = await supabase.from('restaurants').delete().eq('id', id);
    if (!err) {
      setRestaurants(prev => prev.filter(r => r.id !== id));
      setSuccess('Restaurant deleted.'); setTimeout(() => setSuccess(''), 3000);
    }
    setDeleteConfirm(null);
  };

  const startEdit = (r) => {
    setForm({
      name: r.name || '', cuisine: r.cuisine || '', location: r.location || '',
      owner_phone: r.owner_phone || '',
      owner_password: '', // never show stored password
      is_active: r.is_active !== false,
      restaurant_available: r.restaurant_available !== false,
    });
    setEditingId(r.id); setShowForm(true); setError('');
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
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/sys-v4h8n-panel')} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Manage Restaurants</h1>
              <p className="text-xs text-gray-500">{restaurants.length} restaurant{restaurants.length !== 1 ? 's' : ''} · changes appear live</p>
            </div>
          </div>
          <button onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM); setError(''); }} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Restaurant
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
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
              <h2 className="text-lg font-bold text-gray-800">{editingId ? 'Edit Restaurant' : 'Add New Restaurant'}</h2>
              <button onClick={cancelForm} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6">
              {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">{error}</div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Restaurant Name *</label>
                  <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Spicy One Biryani Point" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent" disabled={!!editingId} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Cuisine *</label>
                  <input type="text" value={form.cuisine} onChange={e => setForm(f => ({ ...f, cuisine: e.target.value }))} placeholder="e.g. Biryani, Chinese" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent" disabled={!!editingId} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Location *</label>
                  <input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Old Guntur" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent" disabled={!!editingId} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Owner Phone Number</label>
                  <input type="tel" value={form.owner_phone} onChange={e => setForm(f => ({ ...f, owner_phone: e.target.value }))} placeholder="e.g. 9876543210" maxLength={10} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent" />
                </div>
                {!editingId && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Owner Password</label>
                    <input type="password" value={form.owner_password} onChange={e => setForm(f => ({ ...f, owner_password: e.target.value }))} placeholder="Set login password" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent" />
                    <p className="text-xs text-gray-400 mt-1">Required for restaurant owner portal login</p>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <label className="text-sm font-semibold text-gray-700">Active Status</label>
                  <button type="button" onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.is_active ? 'bg-orange-500' : 'bg-gray-300'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                  <span className="text-xs text-gray-500">{form.is_active ? 'Active' : 'Inactive'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-semibold text-gray-700">Restaurant Availability</label>
                  <button type="button" onClick={() => setForm(f => ({ ...f, restaurant_available: !f.restaurant_available }))} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.restaurant_available ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.restaurant_available ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                  <span className="text-xs text-gray-500">{form.restaurant_available ? 'Open' : 'Closed'}</span>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2">
                  {saving && <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
                  {editingId ? 'Save Changes' : 'Add Restaurant'}
                </button>
                <button onClick={cancelForm} className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Restaurant List */}
        {loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div></div>
        ) : restaurants.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm">
            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </div>
            <p className="text-gray-500 font-medium">No restaurants yet</p>
            <p className="text-gray-400 text-sm mt-1">Add your first restaurant to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {restaurants.map(r => (
              <div key={r.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-opacity ${r.is_active ? 'border-gray-100' : 'border-dashed border-gray-300 opacity-60'}`}>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-800">{r.name}</h3>
                        {!r.is_active && <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">Inactive</span>}
                        {r.restaurant_available === false && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Closed</span>}
                        {r.restaurant_available !== false && r.is_active && <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">Open</span>}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{r.cuisine} · {r.location}</p>
                      {r.owner_phone && (
                        <p className="text-xs text-gray-400 mt-1">
                          <span className="font-medium text-gray-500">Owner:</span> {r.owner_phone}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => navigate(`/sys-menu/${r.id}`, { state: { restaurantName: r.name } })} className="flex items-center gap-1 px-2 py-1.5 bg-orange-50 text-orange-600 border border-orange-200 rounded-lg text-xs font-semibold hover:bg-orange-100 transition-colors" title="Manage Menu">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        Menu
                      </button>
                      <button onClick={() => { setResetPasswordModal(r); setResetPassword(''); setError(''); }} className="p-1.5 rounded-lg hover:bg-purple-50 text-purple-500 transition-colors" title="Reset Password">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                      </button>
                      <button onClick={() => startEdit(r)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors" title="Edit">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => setDeleteConfirm(r.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors" title="Delete">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
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
            <h3 className="text-lg font-bold text-gray-800 text-center mb-1">Delete Restaurant?</h3>
            <p className="text-gray-500 text-sm text-center mb-6">This will permanently remove the restaurant and all its menu items.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-semibold text-sm hover:bg-red-600 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setResetPasswordModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
            </div>
            <h3 className="text-lg font-bold text-gray-800 text-center mb-1">Reset Password</h3>
            <p className="text-gray-500 text-sm text-center mb-4">Set a new login password for <strong>{resetPasswordModal.name}</strong></p>
            {error && <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{error}</div>}
            <input
              type="password"
              value={resetPassword}
              onChange={e => setResetPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => { setResetPasswordModal(null); setError(''); }} className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleResetPassword} disabled={resettingPassword} className="flex-1 py-2.5 bg-purple-500 text-white rounded-xl font-semibold text-sm hover:bg-purple-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {resettingPassword && <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageRestaurants;
