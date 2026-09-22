import React from 'react';
import {
  FileText,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  Star,
  Award,
  AlertTriangle
} from 'lucide-react';

/**
 * DeliveryReports Component - Performance analytics and export
 */
export default function DeliveryReports({ riders = [], onExportReport }) {
  const failedReasons = [
    { reason: 'Customer Unreachable / Phone Off', count: 12, pct: 45 },
    { reason: 'Wrong Address / Area Unmapped', count: 8, pct: 30 },
    { reason: 'Customer Cancelled on Doorstep', count: 4, pct: 15 },
    { reason: 'Rider Vehicle Breakdown', count: 2, pct: 10 }
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-[#0E1330]">Delivery & Rider Reports</h3>
          <p className="text-xs text-slate-500">Performance summaries, on-time delivery %, and failure reasons</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onExportReport && onExportReport('csv')}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-[#0E1330] font-semibold text-xs rounded-lg border border-slate-200 flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> CSV Export
          </button>
          <button
            type="button"
            onClick={() => onExportReport && onExportReport('pdf')}
            className="px-3.5 py-2 bg-[#0E1330] hover:bg-[#1e2550] text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <FileText className="w-3.5 h-3.5 text-[#FFC933]" /> PDF Report
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-semibold text-slate-500">On-Time Delivery Rate</div>
          <div className="text-2xl font-bold text-emerald-600">94.2%</div>
          <p className="text-[11px] text-slate-400">Target: &gt; 90.0%</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-semibold text-slate-500">Avg Delivery Duration</div>
          <div className="text-2xl font-bold text-[#0E1330]">36.5 mins</div>
          <p className="text-[11px] text-slate-400">Target: &lt; 45.0 mins</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-semibold text-slate-500">Failed / Return Rate</div>
          <div className="text-2xl font-bold text-rose-600">3.8%</div>
          <p className="text-[11px] text-slate-400">Target: &lt; 5.0%</p>
        </div>
      </div>

      {/* Failed Delivery Breakdown & Rider Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Failed Delivery Reasons */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[#0E1330]">
            <AlertTriangle className="w-4 h-4 text-rose-500" /> Primary Failed Delivery Reasons
          </div>

          <div className="space-y-3 pt-1">
            {failedReasons.map((item, idx) => (
              <div key={idx} className="space-y-1 text-xs">
                <div className="flex items-center justify-between font-semibold text-[#0E1330]">
                  <span>{item.reason}</span>
                  <span className="text-slate-500">{item.count} orders ({item.pct}%)</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${item.pct}%` }}
                    className="h-full bg-rose-500 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rider Performance Table */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[#0E1330]">
            <Award className="w-4 h-4 text-amber-500" /> Top Rider Performance Leaderboard
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase">
                  <th className="pb-2">Rider</th>
                  <th className="pb-2 text-center">Completed</th>
                  <th className="pb-2 text-center">On-Time %</th>
                  <th className="pb-2 text-right">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-[#0E1330]">
                {riders.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="py-2.5 font-bold">{r.name}</td>
                    <td className="py-2.5 text-center font-mono">{r.completedCount || 48}</td>
                    <td className="py-2.5 text-center font-semibold text-emerald-600">96.5%</td>
                    <td className="py-2.5 text-right font-bold text-amber-600 flex items-center justify-end gap-1">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {r.rating || 4.9}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
