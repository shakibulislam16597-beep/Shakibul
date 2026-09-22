import React, { useState } from 'react';
import { MapPin, Plus, Edit2, Trash2, Power, Check, X } from 'lucide-react';
import { formatBDT } from '../../utils/currency';

/**
 * ZoneEditor Component - Manage delivery areas, base fees, and per-km rates
 */
export default function ZoneEditor({ zones = [], onSaveZone, onDeleteZone, onToggleZone }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    baseFee: 60,
    perKmRate: 15,
    estimatedTime: '30-45 mins',
    active: true
  });

  const handleOpenAdd = () => {
    setEditingZone(null);
    setFormData({
      name: '',
      baseFee: 60,
      perKmRate: 15,
      estimatedTime: '30-45 mins',
      active: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (zone) => {
    setEditingZone(zone);
    setFormData({
      name: zone.name || '',
      baseFee: zone.baseFee || 60,
      perKmRate: zone.perKmRate || 15,
      estimatedTime: zone.estimatedTime || '30-45 mins',
      active: zone.active !== false
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return;

    if (onSaveZone) {
      onSaveZone({
        id: editingZone ? editingZone.id : `zone-${Date.now()}`,
        ...formData
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-[#0E1330]">Delivery Zones & Pricing ({zones.length})</h3>
          <p className="text-xs text-slate-500">Configure delivery areas, base shipping fees, and per-km rates</p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-3.5 py-2 bg-[#0E1330] hover:bg-[#1e2550] text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4 text-[#FFC933]" /> Add Delivery Zone
        </button>
      </div>

      {/* Zones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {zones.map((z) => (
          <div
            key={z.id}
            className={`bg-white p-5 rounded-xl border transition-all flex flex-col justify-between space-y-4 ${
              z.active ? 'border-slate-200 shadow-xs' : 'border-slate-200 opacity-60 bg-slate-50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-indigo-50 text-[#3B4CE0] border border-indigo-100">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#0E1330]">{z.name}</h4>
                  <p className="text-xs text-slate-500">ETA: {z.estimatedTime || '30-60 mins'}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onToggleZone && onToggleZone(z.id)}
                title={z.active ? 'Disable zone' : 'Enable zone'}
                className={`p-1.5 rounded-lg border cursor-pointer transition-colors ${
                  z.active
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Rates Table */}
            <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Base Shipping Fee</span>
                <span className="text-sm font-extrabold text-[#0E1330]">{formatBDT(z.baseFee || 60)}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Per-KM Distance Rate</span>
                <span className="text-sm font-extrabold text-[#0E1330]">{formatBDT(z.perKmRate || 15)} / km</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className={`font-semibold ${z.active ? 'text-emerald-600' : 'text-slate-400'}`}>
                {z.active ? '● Zone Active' : '○ Zone Disabled'}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(z)}
                  className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteZone && onDeleteZone(z.id)}
                  className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-rose-50 text-rose-600 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
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
              {editingZone ? 'Edit Delivery Zone' : 'Add New Delivery Zone'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700">Zone Area Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Dhaka North (Gulshan, Banani, Uttara)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-[#3B4CE0]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700">Base Fee (৳)</label>
                  <input
                    type="number"
                    required
                    value={formData.baseFee}
                    onChange={(e) => setFormData({ ...formData, baseFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700">Per-KM Rate (৳)</label>
                  <input
                    type="number"
                    required
                    value={formData.perKmRate}
                    onChange={(e) => setFormData({ ...formData, perKmRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700">Estimated Delivery Time</label>
                <input
                  type="text"
                  value={formData.estimatedTime}
                  onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
                  placeholder="e.g. 30-45 mins"
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
                Save Zone
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
