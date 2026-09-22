import React from 'react';
import {
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  Navigation,
  TrendingUp,
  ArrowRight,
  UserCheck,
  AlertCircle,
  MapPin,
  Calendar
} from 'lucide-react';

/**
 * DeliveryDashboard Component - Summary cards & success rate metrics
 */
export default function DeliveryDashboard({ metrics, onNavigateTab }) {
  const {
    totalToday = 42,
    inTransit = 12,
    delivered = 24,
    failedReturned = 2,
    pendingPickup = 4,
    successRate = 92,
    avgTimeMins = 38
  } = metrics || {};

  const daysData = [
    { day: 'Mon', rate: 94, total: 38 },
    { day: 'Tue', rate: 89, total: 42 },
    { day: 'Wed', rate: 96, total: 50 },
    { day: 'Thu', rate: 91, total: 45 },
    { day: 'Fri', rate: 95, total: 52 },
    { day: 'Sat', rate: 90, total: 40 },
    { day: 'Sun', rate: 92, total: 35 }
  ];

  return (
    <div className="space-y-6">
      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Deliveries Today */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Today</span>
            <div className="p-2 bg-indigo-50 text-[#3B4CE0] rounded-lg">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#0E1330]">{totalToday}</div>
            <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3 h-3" /> +12% from yesterday
            </p>
          </div>
        </div>

        {/* Pending Pickup */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pending Pickup</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#0E1330]">{pendingPickup}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Awaiting rider dispatch</p>
          </div>
        </div>

        {/* In Transit / Out for Delivery */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">In Transit</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Navigation className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#0E1330]">{inTransit}</div>
            <p className="text-[11px] text-blue-600 font-medium mt-0.5">Active on route</p>
          </div>
        </div>

        {/* Delivered */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Delivered</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#0E1330]">{delivered}</div>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Completed today</p>
          </div>
        </div>

        {/* Failed / Returned */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Failed / Returned</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#0E1330]">{failedReturned}</div>
            <p className="text-[11px] text-rose-600 font-medium mt-0.5">Requires attention</p>
          </div>
        </div>
      </div>

      {/* Analytics & Success Rate Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Success Rate Chart Box */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#0E1330]">Delivery Performance (Last 7 Days)</h3>
              <p className="text-xs text-slate-500">Daily delivery count and success rate percentage</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{successRate}% Avg Success Rate</span>
            </div>
          </div>

          {/* Bar chart representation */}
          <div className="pt-4 pb-2">
            <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-44 border-b border-slate-200 pb-2">
              {daysData.map((d) => (
                <div key={d.day} className="flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[10px] font-bold text-slate-600 group-hover:text-[#3B4CE0] transition-colors">
                    {d.rate}%
                  </span>
                  <div
                    style={{ height: `${d.rate}%` }}
                    className="w-full max-w-[32px] bg-indigo-500 hover:bg-[#3B4CE0] rounded-t-md transition-all relative group-hover:shadow-md"
                  >
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-[#0E1330] text-white text-[10px] px-2 py-0.5 rounded pointer-events-none whitespace-nowrap z-10">
                      {d.total} deliveries
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-600">{d.day}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-indigo-500 rounded-xs inline-block" /> Successful Delivery Rate (%)
            </span>
            <span>Average Delivery Time: <strong>{avgTimeMins} minutes</strong></span>
          </div>
        </div>

        {/* Quick Operations Panel */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-base font-bold text-[#0E1330] mb-1">Quick Dispatch Operations</h3>
            <p className="text-xs text-slate-500 mb-4">Manage orders, riders, and zones in real-time</p>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => onNavigateTab && onNavigateTab('orders')}
                className="w-full p-3 rounded-lg border border-slate-200 hover:border-[#3B4CE0] bg-slate-50 hover:bg-indigo-50/50 flex items-center justify-between text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-md border border-slate-200 text-[#0E1330] group-hover:text-[#3B4CE0]">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#0E1330]">Pending Pickup ({pendingPickup})</div>
                    <div className="text-[11px] text-slate-500">Assign available riders</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#3B4CE0]" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab && onNavigateTab('tracking')}
                className="w-full p-3 rounded-lg border border-slate-200 hover:border-[#3B4CE0] bg-slate-50 hover:bg-indigo-50/50 flex items-center justify-between text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-md border border-slate-200 text-[#0E1330] group-hover:text-[#3B4CE0]">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#0E1330]">Live Map Tracking</div>
                    <div className="text-[11px] text-slate-500">View live rider GPS routes</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#3B4CE0]" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab && onNavigateTab('riders')}
                className="w-full p-3 rounded-lg border border-slate-200 hover:border-[#3B4CE0] bg-slate-50 hover:bg-indigo-50/50 flex items-center justify-between text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-md border border-slate-200 text-[#0E1330] group-hover:text-[#3B4CE0]">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#0E1330]">Rider Directory</div>
                    <div className="text-[11px] text-slate-500">Manage active riders & status</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#3B4CE0]" />
              </button>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-800">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>2 riders are currently offline with 3 active deliveries pending assignment.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
