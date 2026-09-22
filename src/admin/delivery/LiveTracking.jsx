import React, { useState } from 'react';
import StatusBadge from './StatusBadge';
import {
  MapPin,
  Navigation,
  User,
  Phone,
  Clock,
  CheckCircle2,
  AlertCircle,
  Compass,
  Layers,
  RefreshCw
} from 'lucide-react';

/**
 * LiveTracking Component - Real-time rider GPS tracking map & live route status
 */
export default function LiveTracking({ deliveries = [], riders = [] }) {
  const [selectedRiderId, setSelectedRiderId] = useState(riders[0]?.id || null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const activeRiders = riders.filter((r) => r.status !== 'Offline');
  const activeDeliveries = deliveries.filter(
    (d) => d.status === 'in_transit' || d.status === 'out_for_delivery' || d.status === 'picked_up'
  );

  const selectedRider = riders.find((r) => String(r.id) === String(selectedRiderId));
  const riderDeliveries = deliveries.filter(
    (d) => String(d.riderId) === String(selectedRiderId)
  );

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-[#0E1330]">Live Map Tracking</h3>
          <p className="text-xs text-slate-500">Real-time GPS rider tracking and active route monitoring</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 cursor-pointer ${
              autoRefresh
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin' : ''}`} />
            <span>{autoRefresh ? 'Live Auto-Sync On' : 'Auto-Sync Paused'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Container (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-md relative min-h-[420px] flex flex-col justify-between p-4">
          {/* Simulated Map Visual Layer */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 opacity-90" />

          {/* Grid pattern SVG background */}
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage:
                'radial-gradient(#3B4CE0 1px, transparent 1px), radial-gradient(#FFC933 1px, #0E1330 1px)',
              backgroundSize: '24px 24px',
              backgroundPosition: '0 0, 12px 12px'
            }}
          />

          {/* Map Header Overlay Controls */}
          <div className="relative z-10 flex items-center justify-between bg-slate-900/80 backdrop-blur-md p-3 rounded-xl border border-slate-700 text-white">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#FFC933] animate-pulse" />
              <span className="text-xs font-bold">Dhaka Metro GPS Coverage Zone</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
              ● {activeRiders.length} Riders Active
            </span>
          </div>

          {/* Map Pin Route Representation */}
          <div className="relative z-10 my-auto py-12 px-6 flex flex-col items-center justify-center text-center space-y-3">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-[#3B4CE0]/20 border-2 border-[#3B4CE0] flex items-center justify-center text-white shadow-lg animate-pulse">
                <Navigation className="w-8 h-8 text-[#FFC933]" />
              </div>
              <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-900">
                LIVE
              </div>
            </div>

            <div className="max-w-sm">
              <h4 className="text-sm font-bold text-white">
                {selectedRider ? `Tracking: ${selectedRider.name}` : 'Select a rider to view live GPS route'}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedRider
                  ? `Active on route with ${riderDeliveries.length} assigned order(s).`
                  : 'Interactive Map component integration point for Leaflet / Google Maps API.'}
              </p>
            </div>
          </div>

          {/* Map Footer Route Info */}
          <div className="relative z-10 flex items-center justify-between bg-slate-900/80 backdrop-blur-md p-3 rounded-xl border border-slate-700 text-slate-300 text-xs">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-500" />
              <span>Gulshan 2 → Banani Block C Route</span>
            </div>
            <span className="font-mono text-[#FFC933]">Speed: 28 km/h</span>
          </div>
        </div>

        {/* Active Riders Sidebar List (1 col) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h4 className="text-sm font-bold text-[#0E1330] mb-3">
              Active Riders on Road ({activeRiders.length})
            </h4>

            <div className="space-y-2 max-h-[380px] overflow-y-auto">
              {activeRiders.map((r) => {
                const isSelected = String(r.id) === String(selectedRiderId);
                const rDeliveries = deliveries.filter(
                  (d) => String(d.riderId) === String(r.id)
                );

                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedRiderId(r.id)}
                    className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-50/70 border-[#3B4CE0] ring-1 ring-[#3B4CE0]'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-xs text-[#0E1330]">
                        {r.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#0E1330]">{r.name}</div>
                        <div className="text-[10px] text-slate-500">{r.phone}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-[#3B4CE0] bg-white px-2 py-0.5 rounded border border-slate-200">
                        {rDeliveries.length} orders
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Rider Active Orders */}
          {selectedRider && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="text-xs font-bold text-[#0E1330]">
                Active Route Orders for {selectedRider.name}:
              </div>
              {riderDeliveries.length > 0 ? (
                <div className="space-y-1.5 text-xs">
                  {riderDeliveries.map((rd) => (
                    <div
                      key={rd.id}
                      className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold font-mono text-[#3B4CE0]">#{rd.orderId}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[140px]">{rd.address}</div>
                      </div>
                      <StatusBadge status={rd.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic">No active orders assigned to this rider.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
