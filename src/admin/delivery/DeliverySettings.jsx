import React, { useState } from 'react';
import { Settings, Save, Clock, MessageSquare, ShieldCheck, DollarSign, Cpu } from 'lucide-react';

/**
 * DeliverySettings Component - Manage dispatch rules, time slots, notifications, COD settings
 */
export default function DeliverySettings({ settings = {}, onSaveSettings }) {
  const [formData, setFormData] = useState({
    autoAssignRule: settings.autoAssignRule || 'nearest',
    codEnabled: settings.codEnabled !== false,
    maxCodLimit: settings.maxCodLimit || 15000,
    timeSlots: settings.timeSlots || [
      'Morning (09:00 AM - 01:00 PM)',
      'Afternoon (01:00 PM - 05:00 PM)',
      'Evening (05:00 PM - 09:00 PM)'
    ],
    smsTemplateOutForDelivery:
      settings.smsTemplateOutForDelivery ||
      'Your Extrovat order #{order_id} is out for delivery with rider {rider_name} ({rider_phone}). ETA: {eta}.',
    smsTemplateDelivered:
      settings.smsTemplateDelivered ||
      'Thank you for shopping with Extrovat Lifestyle! Order #{order_id} has been delivered successfully.'
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSaveSettings) {
      onSaveSettings(formData);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-[#0E1330]">Delivery & Dispatch Settings</h3>
          <p className="text-xs text-slate-500">Configure auto-assignment, time slots, SMS alerts, and COD limits</p>
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-[#0E1330] hover:bg-[#1e2550] text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm"
        >
          <Save className="w-4 h-4 text-[#FFC933]" /> Save Settings
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold animate-in fade-in">
          ✓ Delivery settings saved successfully!
        </div>
      )}

      {/* Auto-Assignment Rules */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-[#0E1330]">
          <Cpu className="w-4 h-4 text-[#3B4CE0]" /> Rider Auto-Assignment Rules
        </div>
        <p className="text-xs text-slate-500">Choose how new delivery orders are assigned to active riders</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <label
            className={`p-3.5 rounded-xl border cursor-pointer flex items-start gap-3 transition-all ${
              formData.autoAssignRule === 'nearest'
                ? 'border-[#3B4CE0] bg-indigo-50/50 ring-1 ring-[#3B4CE0]'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <input
              type="radio"
              name="autoAssign"
              value="nearest"
              checked={formData.autoAssignRule === 'nearest'}
              onChange={(e) => setFormData({ ...formData, autoAssignRule: e.target.value })}
              className="mt-1 text-[#3B4CE0] focus:ring-[#3B4CE0]"
            />
            <div>
              <div className="text-xs font-bold text-[#0E1330]">Nearest Available Rider</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Automatically assigns to available rider with lowest active order count nearest to zone
              </div>
            </div>
          </label>

          <label
            className={`p-3.5 rounded-xl border cursor-pointer flex items-start gap-3 transition-all ${
              formData.autoAssignRule === 'round_robin'
                ? 'border-[#3B4CE0] bg-indigo-50/50 ring-1 ring-[#3B4CE0]'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <input
              type="radio"
              name="autoAssign"
              value="round_robin"
              checked={formData.autoAssignRule === 'round_robin'}
              onChange={(e) => setFormData({ ...formData, autoAssignRule: e.target.value })}
              className="mt-1 text-[#3B4CE0] focus:ring-[#3B4CE0]"
            />
            <div>
              <div className="text-xs font-bold text-[#0E1330]">Round Robin Rotation</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Distributes incoming orders evenly among all available riders in rotation
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Cash on Delivery Settings */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-[#0E1330]">
            <DollarSign className="w-4 h-4 text-emerald-600" /> Cash on Delivery (COD) Rules
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.codEnabled}
              onChange={(e) => setFormData({ ...formData, codEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {formData.codEnabled && (
          <div className="pt-2 text-xs space-y-2">
            <label className="block font-semibold text-slate-700">Maximum COD Order Limit (৳)</label>
            <input
              type="number"
              value={formData.maxCodLimit}
              onChange={(e) => setFormData({ ...formData, maxCodLimit: Number(e.target.value) })}
              className="w-full max-w-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-[#3B4CE0]"
            />
            <p className="text-[11px] text-slate-500">Orders exceeding this amount require partial advance digital payment</p>
          </div>
        )}
      </div>

      {/* Delivery Time Slots */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-[#0E1330]">
          <Clock className="w-4 h-4 text-[#3B4CE0]" /> Delivery Time Slots
        </div>
        <p className="text-xs text-slate-500">Time slots selectable by customers during checkout</p>

        <div className="space-y-2">
          {formData.timeSlots.map((slot, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                value={slot}
                onChange={(e) => {
                  const updated = [...formData.timeSlots];
                  updated[idx] = e.target.value;
                  setFormData({ ...formData, timeSlots: updated });
                }}
                className="w-full max-w-md px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* SMS & Notification Templates */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-[#0E1330]">
          <MessageSquare className="w-4 h-4 text-[#3B4CE0]" /> SMS & Push Notification Templates
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold mb-1 text-slate-700">Out for Delivery SMS Template</label>
            <textarea
              rows={2}
              value={formData.smsTemplateOutForDelivery}
              onChange={(e) => setFormData({ ...formData, smsTemplateOutForDelivery: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-700">Order Delivered SMS Template</label>
            <textarea
              rows={2}
              value={formData.smsTemplateDelivered}
              onChange={(e) => setFormData({ ...formData, smsTemplateDelivered: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
