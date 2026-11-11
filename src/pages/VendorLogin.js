import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function VendorLogin() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/vendors/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || 'Login failed');
        return;
      }
      localStorage.setItem('vendorAuth', JSON.stringify({
        token: data.token,
        id: data.vendor.id,
        slug: data.vendor.slug,
        name: data.vendor.name,
      }));
      navigate(`/vendor/${data.vendor.slug}/panel`);
    } catch {
      setError('Login failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form onSubmit={handleLogin} className="bg-white rounded-xl border border-gray-200 p-8 w-full max-w-md">
        <h1 className="text-xl font-bold text-gray-900">Restaurant login</h1>
        <p className="text-sm text-gray-500 mt-1">Vendor dashboard for orders and slots</p>
        {error && <p className="text-sm text-red-600 mt-4 bg-red-50 p-2 rounded">{error}</p>}
        <label className="block mt-6 text-sm font-medium text-gray-700">Phone</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
          placeholder="9000000002"
        />
        <label className="block mt-4 text-sm font-medium text-gray-700">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
        />
        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full bg-black text-white font-semibold py-2.5 rounded-lg disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
        <p className="text-xs text-gray-400 mt-4 text-center">
          Local Home Kitchen demo: 9000000002 / lhk123
        </p>
      </form>
    </div>
  );
}
