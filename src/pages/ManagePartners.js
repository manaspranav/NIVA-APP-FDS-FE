import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { supabase } from '../supabaseClient';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// SECURITY: Helper function to get auth headers with JWT token
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    };
  }
  return { headers: { 'Content-Type': 'application/json' } };
};

function ManagePartners() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: ''
  });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'admin') {
      navigate('/sys-x9k3m-auth');
      return;
    }
    fetchPartners();
  }, [navigate]);

  const fetchPartners = async () => {
    try {
      const authHeaders = await getAuthHeaders();
      const response = await axios.get(`${API_URL}/api/admin/partners`, authHeaders);
      if (response.data.success) {
        setPartners(response.data.partners || []);
      }
    } catch (error) {
      console.error('Error fetching partners:', error);
      setMessage('Error loading partners');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddPartner = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const authHeaders = await getAuthHeaders();
      const response = await axios.post(`${API_URL}/api/admin/partners`, formData, authHeaders);
      if (response.data.success) {
        setMessage('Partner added successfully!');
        setFormData({ name: '', phone: '', password: '' });
        setShowAddForm(false);
        fetchPartners();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error adding partner:', error);
      setMessage(error.response?.data?.message || 'Error adding partner');
    }
  };

  const handleDeletePartner = async (partnerId) => {
    if (!window.confirm('Are you sure you want to delete this partner?')) {
      return;
    }

    try {
      const authHeaders = await getAuthHeaders();
      const response = await axios.delete(`${API_URL}/api/admin/partners/${partnerId}`, authHeaders);
      if (response.data.success) {
        setMessage('Partner deleted successfully!');
        fetchPartners();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error deleting partner:', error);
      setMessage('Error deleting partner');
    }
  };

  const handleBack = () => {
    navigate('/sys-v4h8n-panel');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-2xl text-gray-600">Loading partners...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Manage Partners</h1>
              <p className="text-gray-600 mt-1">Add, view, and delete delivery partners</p>
            </div>
            <button
              onClick={handleBack}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('Error') || message.includes('error')
              ? 'bg-red-100 text-red-700 border border-red-300'
              : 'bg-gray-100 text-gray-700 border border-gray-300'
          }`}>
            {message}
          </div>
        )}

        {/* Add Partner Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-gray-800 hover:bg-black text-white px-6 py-3 rounded-lg font-semibold transition-colors">
          >
            {showAddForm ? '✕ Cancel' : '+ Add New Partner'}
          </button>
        </div>

        {/* Add Partner Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Add New Partner</h2>
            <form onSubmit={handleAddPartner}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Partner Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter partner name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    pattern="[0-9]{10}"
                    maxLength="10"
                    placeholder="10-digit phone number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  minLength="6"
                  placeholder="Minimum 6 characters"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <button
                type="submit"
                className="bg-gray-800 hover:bg-black text-white px-8 py-2 rounded-lg font-semibold transition-colors">
              >
                Add Partner
              </button>
            </form>
          </div>
        )}

        {/* Partners List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Partners List</h2>
          
          {partners.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <p className="text-xl text-gray-600">No partners yet</p>
              <p className="text-gray-500 mt-2">Click "Add New Partner" to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-200">
                    <th className="text-left p-4 font-semibold text-gray-700">Name</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Phone</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Created At</th>
                    <th className="text-center p-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {partners.map((partner) => (
                    <tr key={partner.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="p-4 text-gray-800 font-medium">{partner.name}</td>
                      <td className="p-4 text-gray-700">{partner.phone}</td>
                      <td className="p-4 text-gray-600">
                        {new Date(partner.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleDeletePartner(partner.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ManagePartners;
