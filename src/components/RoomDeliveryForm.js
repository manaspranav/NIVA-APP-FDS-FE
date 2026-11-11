import React, { useState, useEffect } from 'react';
import { MALE_HOSTELS, FEMALE_HOSTELS } from '../data/hostelData';
import { calculateDeliveryCharge } from '../utils/roomDeliveryUtils';

const RoomDeliveryForm = ({ 
  cartItems, 
  onClose, 
  onSubmit, 
  userProfile 
}) => {
  const [formData, setFormData] = useState({
    hostelType: '',
    hostelName: '',
    roomNumber: '',
    numberOfPackets: '',
    vendorPlatform: '',
    vendorPlatformOther: '',
    vendorOrderType: 'prepaid', // 'prepaid' or 'cod'
    foodBillAmount: '',
    description: '',
    termsAccepted: false,
    vendorCallReceived: false,
    orderId: ''
  });
  const [deliveryCharge, setDeliveryCharge] = useState(0);

  useEffect(() => {
    // If number of packets is filled, calculate delivery charge
    if (formData.numberOfPackets) {
      const charge = calculateDeliveryCharge(parseInt(formData.numberOfPackets, 10));
      setDeliveryCharge(charge);
    } else {
      setDeliveryCharge(0);
    }
  }, [formData.numberOfPackets]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    
    // Reset dependent fields
    if (name === 'hostelType') {
      setFormData(prev => ({ ...prev, hostelName: '', roomNumber: '' }));
    }
  };

  const handleHostelClick = (hostel) => {
    setFormData(prev => ({ ...prev, hostelName: hostel }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.hostelType || !formData.hostelName || !formData.numberOfPackets || !formData.vendorPlatform || !formData.roomNumber) {
      alert("Please fill all required fields.");
      return;
    }

    if (formData.vendorPlatform === 'Others' && !formData.vendorPlatformOther.trim()) {
      alert("Please specify the platform name.");
      return;
    }

    if (formData.vendorOrderType === 'cod' && (!formData.foodBillAmount || parseFloat(formData.foodBillAmount) <= 0)) {
      alert("Please enter the food bill amount.");
      return;
    }

    if (!formData.termsAccepted) {
      alert("Please accept the terms and conditions.");
      return;
    }

    const foodAmount = formData.vendorOrderType === 'cod' ? parseFloat(formData.foodBillAmount) : 0;
    const codTax = formData.vendorOrderType === 'cod' ? Number((foodAmount * 0.02).toFixed(2)) : 0;
    const penaltyFee = formData.vendorCallReceived ? 0 : 5;
    const totalAmount = deliveryCharge + foodAmount + codTax + penaltyFee;
    const finalPlatform = formData.vendorPlatform === 'Others' ? formData.vendorPlatformOther.trim() : formData.vendorPlatform;
    
    onSubmit({
      ...formData,
      vendorPlatform: finalPlatform,
      paymentMethod: 'online', // Forced to online (Razorpay) as requested
      deliveryCharge,
      foodAmount,
      codTax,
      penaltyFee,
      totalAmount
    });
  };

  const getHostelList = () => {
    return formData.hostelType === 'male' ? MALE_HOSTELS : formData.hostelType === 'female' ? FEMALE_HOSTELS : [];
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fadeIn pb-32">
      <div className="bg-white rounded-2xl w-full overflow-hidden shadow-sm border border-gray-100">
        <div className="bg-black text-white p-6 text-center">
          <h2 className="text-2xl font-bold font-heading">NIVA Room Delivery</h2>
          <p className="text-gray-300 mt-2 text-sm">We pick up your food from the main gate and deliver it right to your hostel room.</p>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Hostel Type *</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  className={`py-3.5 px-4 rounded-xl border-2 transition-all text-center ${formData.hostelType === 'male' ? 'border-black bg-black text-white font-bold shadow-sm' : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}
                  onClick={() => handleChange({ target: { name: 'hostelType', value: 'male' } })}
                >
                  Boys Hostel
                </button>
                <button
                  type="button"
                  className={`py-3.5 px-4 rounded-xl border-2 transition-all text-center ${formData.hostelType === 'female' ? 'border-black bg-black text-white font-bold shadow-sm' : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}
                  onClick={() => handleChange({ target: { name: 'hostelType', value: 'female' } })}
                >
                  Girls Hostel
                </button>
              </div>
            </div>

            {formData.hostelType && (
              <div className="animate-fadeIn">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Hostel *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {getHostelList().map(hostel => (
                    <button
                      key={hostel}
                      type="button"
                      onClick={() => handleHostelClick(hostel)}
                      className={`py-2.5 px-3 rounded-xl border-2 transition-all text-sm font-semibold ${formData.hostelName === hostel ? 'border-black bg-black text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                    >
                      {hostel}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {formData.hostelName && (
              <div className="animate-fadeIn">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Room Number *</label>
                <input
                  type="text"
                  name="roomNumber"
                  value={formData.roomNumber}
                  onChange={handleChange}
                  placeholder="e.g., A-102"
                  className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-black focus:border-black outline-none transition-all font-medium text-gray-800"
                  required
                />
              </div>
            )}

            <div className="pt-2 border-t border-gray-100">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Order Details *</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Platform *</label>
                  <select
                    name="vendorPlatform"
                    value={formData.vendorPlatform}
                    onChange={handleChange}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-black outline-none font-medium text-gray-800"
                    required
                  >
                    <option value="">Select platform</option>
                    <option value="18">18</option>
                    <option value="Charitha">Charitha</option>
                    <option value="Aunty Shop">Aunty Shop</option>
                    <option value="Friends Corner">Friends Corner</option>
                    <option value="FPD">FPD</option>
                    <option value="Pinki">Pinki</option>
                    <option value="Big Basket">Big Basket</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Packets</label>
                  <input
                    type="number"
                    name="numberOfPackets"
                    value={formData.numberOfPackets}
                    onChange={handleChange}
                    min="1"
                    max="50"
                    placeholder="Qty"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-black outline-none font-medium text-gray-800"
                    required
                  />
                </div>
              </div>
              {formData.vendorPlatform === 'Others' && (
                <div className="mt-3 animate-fadeIn">
                  <label className="block text-xs text-gray-500 mb-1">Specify Platform *</label>
                  <input
                    type="text"
                    name="vendorPlatformOther"
                    value={formData.vendorPlatformOther}
                    onChange={handleChange}
                    placeholder="Enter platform / shop name"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-black outline-none font-medium text-gray-800"
                    required
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Order ID (if applicable)</label>
                <input
                  type="text"
                  name="orderId"
                  value={formData.orderId}
                  onChange={handleChange}
                  placeholder="Vendor Order ID"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-black outline-none transition-all text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Description (Optional)</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Any instructions for the delivery partner..."
                className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-sm"
              />
            </div>

            <div className="pt-4 border-t border-gray-100">
              <label className="flex items-start gap-3 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  name="vendorCallReceived"
                  checked={formData.vendorCallReceived}
                  onChange={handleChange}
                  className="mt-1 w-4 h-4 text-black focus:ring-black rounded border-gray-300"
                />
                <span className="text-sm text-gray-700 font-medium">
                  I got the phone call from the vendor and the order has already arrived at the gate.
                </span>
              </label>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Vendor Order Status *</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, vendorOrderType: 'prepaid', foodBillAmount: '' }))}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${formData.vendorOrderType === 'prepaid' ? 'border-black bg-gray-50 shadow-sm' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  <span className="font-bold text-gray-900">Prepaid</span>
                  <span className="text-xs text-gray-500 text-center mt-1">Already paid on the platform</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, vendorOrderType: 'cod' }))}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${formData.vendorOrderType === 'cod' ? 'border-black bg-gray-50 shadow-sm' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  <span className="font-bold text-gray-900">Cash on Delivery</span>
                  <span className="text-xs text-gray-500 text-center mt-1">Partner pays at gate</span>
                </button>
              </div>
            </div>

            {formData.vendorOrderType === 'cod' && (
              <div className="animate-fadeIn">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Food Bill Amount (₹) *</label>
                <input
                  type="number"
                  name="foodBillAmount"
                  value={formData.foodBillAmount}
                  onChange={handleChange}
                  min="1"
                  placeholder="Enter the total bill amount to be paid at gate"
                  className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-black outline-none font-medium text-gray-800"
                  required={formData.vendorOrderType === 'cod'}
                />
              </div>
            )}

            {deliveryCharge > 0 && (
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 mt-6 shadow-sm">
                <div className="flex justify-between items-center mb-3 text-sm">
                  <span className="text-gray-600 font-medium">Base Delivery Charge</span>
                  <span className="font-semibold text-gray-900">₹{deliveryCharge}</span>
                </div>
                {!formData.vendorCallReceived && (
                  <div className="flex justify-between items-center mb-3 text-sm">
                    <span className="text-red-600 font-medium">No Vendor Call Penalty</span>
                    <span className="font-semibold text-red-600">+ ₹5</span>
                  </div>
                )}
                {formData.vendorOrderType === 'cod' && formData.foodBillAmount && (
                  <>
                    <div className="flex justify-between items-center mb-3 text-sm">
                      <span className="text-gray-600 font-medium">Food Bill</span>
                      <span className="font-semibold text-gray-900">₹{formData.foodBillAmount}</span>
                    </div>
                    <div className="flex justify-between items-center mb-3 text-sm">
                      <span className="text-gray-600 font-medium">COD Tax (2%)</span>
                      <span className="font-semibold text-gray-900">₹{Number((parseFloat(formData.foodBillAmount || 0) * 0.02).toFixed(2))}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <span className="font-bold text-lg text-gray-900">Total to Pay Now</span>
                  <span className="font-bold text-2xl text-black">
                    ₹{deliveryCharge + (!formData.vendorCallReceived ? 5 : 0) + (formData.vendorOrderType === 'cod' ? (parseFloat(formData.foodBillAmount) || 0) + Number((parseFloat(formData.foodBillAmount || 0) * 0.02).toFixed(2)) : 0)}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-3 pt-4 border-t border-gray-100">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="termsAccepted"
                  checked={formData.termsAccepted}
                  onChange={handleChange}
                  className="mt-1 w-4 h-4 text-black focus:ring-black rounded border-gray-300"
                />
                <span className="text-sm text-gray-700 font-medium">
                  I agree to the Terms and Conditions
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={!formData.numberOfPackets || !formData.hostelType || !formData.hostelName || !formData.roomNumber || !formData.termsAccepted || !formData.vendorPlatform || (formData.vendorPlatform === 'Others' && !formData.vendorPlatformOther.trim())}
              className="w-full mt-8 bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-all shadow-md transform active:scale-[0.98]"
            >
              Place Order
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RoomDeliveryForm;
