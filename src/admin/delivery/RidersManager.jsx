import React, { useState } from 'react';
import {
  UserCheck,
  Plus,
  Phone,
  Star,
  Truck,
  Edit2,
  Trash2,
  X,
  Check,
  Power
} from 'lucide-react';

/**
 * RidersManager Component - Manage rider directory, profiles, and statuses
 */
export default function RidersManager({ riders = [], onSaveRider, onDeleteRider }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRider, setEditingRider] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    vehicle: 'Bike',
    zone: 'Dhaka North',
    status: 'Available'
  });

  const handleOpenAdd = () => {
    setEditingRider(null);
    setFormData({
      name: '',
      phone: '',
      vehicle: 'Bike',
      zone: 'Dhaka North',
      status: 'Available'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rider) => {
    setEditingRider(rider);
    setFormData({
      name: rider.name || '',
      phone: rider.phone || '',
      vehicle: rider.vehicle || 'Bike',
      zone: rider.zone || 'Dhaka North',
      status: rider.status || 'Available'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    if (onSaveRider) {
      onSaveRider({
        id: editingRider ? editingRider.id : `rider-${Date.now()}`,
        ...formData,
        rating: editingRider ? editingRider.rating : 4.8,
        activeCount: editingRider ? editingRider.activeCount : 0
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-[#0E1330]">Rider Directory ({riders.length})</h3>
          <p className="text-xs text-slate-500">Manage courier riders, availability, and active deliveries</p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-3.5 py-2 bg-[#0E1330] hover:bg-[#1e2550] text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4 text-[#FFC933]" /> Add New Rider
        </button>
      </div>

      {/* Riders Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {riders.map((r) => {
          let statusColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
          if (r.status === 'Busy') statusColor = 'bg-amber-50 text-amber-700 border-amber-200';
          if (r.status === 'Offline') statusColor = 'bg-slate-100 text-slate-600 border-slate-200';

          return (
            <div
              key={r.id}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-[#0E1330]">
                    {r.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#0E1330]">{r.name}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" /> {r.phone}
                    </p>
                  </div>
                </div>

                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusColor}`}>
                  {r.status}
                </span>
              </div>

              {/* Vehicle & Zone Info */}
              <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Active Orders</span>
                  <span className="font-bold text-[#0E1330] flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-[#3B4CE0]" /> {r.activeCount || 0} orders
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Rating</span>
                  <span className="font-bold text-[#0E1330] flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> {r.rating || 4.8} / 5.0
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500 font-medium">{r.vehicle || 'Bike'} • {r.zone || 'Dhaka'}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(r)}
                    className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteRider && onDeleteRider(r.id)}
                    className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-rose-50 text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Rider Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0E1330]/40 backdrop-blur-xs animate-in fade-in">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl relative text-[#0E1330] space-y-4"
          >
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:text-[#0E1330] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-[#0E1330]">
              {editingRider ? 'Edit Rider Profile' : 'Add New Courier Rider'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Tanvir Ahmed"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-[#3B4CE0]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700">Phone Number</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="01700000000"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-[#3B4CE0]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700">Vehicle Type</label>
                  <select
                    value={formData.vehicle}
                    onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none"
                  >
                    <option value="Bike">Motorcycle</option>
                    <option value="Bicycle">Bicycle</option>
                    <option value="Covered Van">Covered Van</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700">Current Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none"
                  >
                    <option value="Available">Available</option>
                    <option value="Busy">Busy</option>
                    <option value="Offline">Offline</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700">Primary Delivery Zone</label>
                <input
                  type="text"
                  value={formData.zone}
                  onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                  placeholder="e.g. Dhaka City"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-[#3B4CE0]"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#0E1330] text-white font-semibold text-xs rounded-lg hover:bg-[#1e2550]"
              >
                Save Rider
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
