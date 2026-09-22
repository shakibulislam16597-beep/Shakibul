import React, { useState } from 'react';
import StatusBadge from './StatusBadge';
import {
  Search,
  Filter,
  Download,
  CheckCircle2,
  UserCheck,
  Eye,
  X,
  Phone,
  MapPin,
  Clock,
  Truck,
  ArrowUpDown,
  MoreHorizontal
} from 'lucide-react';
import { formatBDT } from '../../utils/currency';

/**
 * DeliveryTable Component - Delivery order management table
 */
export default function DeliveryTable({
  deliveries = [],
  riders = [],
  zones = [],
  onUpdateDeliveryStatus,
  onAssignRider,
  onExportCsv
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedZone, setSelectedZone] = useState('all');
  const [selectedRider, setSelectedRider] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewDelivery, setViewDelivery] = useState(null);
  const [assignRiderModal, setAssignRiderModal] = useState(null);

  // Filter deliveries
  const filteredDeliveries = deliveries.filter((item) => {
    const matchesSearch =
      (item.orderId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.phone || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      selectedStatus === 'all' || item.status.toLowerCase() === selectedStatus.toLowerCase();

    const matchesZone =
      selectedZone === 'all' || (item.zone || '').toLowerCase() === selectedZone.toLowerCase();

    const matchesRider =
      selectedRider === 'all' ||
      (item.riderId && String(item.riderId) === String(selectedRider));

    return matchesSearch && matchesStatus && matchesZone && matchesRider;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredDeliveries.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredDeliveries.map((d) => d.id));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkMarkDelivered = () => {
    if (selectedIds.length === 0) return;
    selectedIds.forEach((id) => {
      if (onUpdateDeliveryStatus) onUpdateDeliveryStatus(id, 'delivered');
    });
    setSelectedIds([]);
  };

  const handleBulkAssign = (riderId) => {
    if (selectedIds.length === 0 || !riderId) return;
    selectedIds.forEach((id) => {
      if (onAssignRider) onAssignRider(id, riderId);
    });
    setSelectedIds([]);
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Control Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Field */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Order ID, customer, phone..."
            className="w-full pl-9 pr-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-[#0E1330] placeholder-slate-400 focus:outline-none focus:border-[#3B4CE0] focus:ring-1 focus:ring-[#3B4CE0]"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-[#0E1330] focus:outline-none focus:border-[#3B4CE0]"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending Pickup</option>
            <option value="picked_up">Picked Up</option>
            <option value="in_transit">In Transit</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="failed">Failed</option>
            <option value="returned">Returned</option>
          </select>

          {/* Zone Filter */}
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-[#0E1330] focus:outline-none focus:border-[#3B4CE0]"
          >
            <option value="all">All Zones</option>
            {zones.map((z) => (
              <option key={z.id} value={z.name}>
                {z.name}
              </option>
            ))}
          </select>

          {/* Rider Filter */}
          <select
            value={selectedRider}
            onChange={(e) => setSelectedRider(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-[#0E1330] focus:outline-none focus:border-[#3B4CE0]"
          >
            <option value="all">All Riders</option>
            {riders.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={onExportCsv}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-[#0E1330] font-semibold text-xs rounded-lg border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* Bulk Action Strip */}
      {selectedIds.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl flex items-center justify-between text-xs text-[#0E1330] animate-in fade-in">
          <div className="font-semibold">
            {selectedIds.length} item(s) selected
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBulkMarkDelivered}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md flex items-center gap-1 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Mark Delivered
            </button>
            <select
              onChange={(e) => {
                if (e.target.value) handleBulkAssign(e.target.value);
              }}
              defaultValue=""
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-md font-medium text-xs text-[#0E1330]"
            >
              <option value="" disabled>
                Assign Rider...
              </option>
              {riders.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.status})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Deliveries Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredDeliveries.length > 0 &&
                      selectedIds.length === filteredDeliveries.length
                    }
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-[#3B4CE0] focus:ring-[#3B4CE0]"
                  />
                </th>
                <th className="p-3">Order ID</th>
                <th className="p-3">Customer & Address</th>
                <th className="p-3">Rider</th>
                <th className="p-3">Status</th>
                <th className="p-3">ETA</th>
                <th className="p-3">Fee</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-[#0E1330]">
              {filteredDeliveries.length > 0 ? (
                filteredDeliveries.map((d) => {
                  const isSelected = selectedIds.includes(d.id);
                  const riderObj = riders.find((r) => String(r.id) === String(d.riderId));

                  return (
                    <tr
                      key={d.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-indigo-50/30' : ''
                      }`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(d.id)}
                          className="rounded border-slate-300 text-[#3B4CE0] focus:ring-[#3B4CE0]"
                        />
                      </td>

                      {/* Order ID */}
                      <td className="p-3 font-bold font-mono text-[#3B4CE0]">
                        <button
                          type="button"
                          onClick={() => setViewDelivery(d)}
                          className="hover:underline cursor-pointer"
                        >
                          #{d.orderId}
                        </button>
                      </td>

                      {/* Customer & Address */}
                      <td className="p-3 max-w-xs">
                        <div className="font-semibold text-[#0E1330]">{d.customerName}</div>
                        <div className="text-[11px] text-slate-500 truncate">{d.address}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{d.phone}</div>
                      </td>

                      {/* Rider */}
                      <td className="p-3">
                        {riderObj ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700">
                              {riderObj.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold text-[11px]">{riderObj.name}</div>
                              <div className="text-[10px] text-slate-400">{riderObj.phone}</div>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setAssignRiderModal(d)}
                            className="text-[11px] font-semibold text-[#3B4CE0] hover:underline cursor-pointer bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100"
                          >
                            + Assign Rider
                          </button>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-3">
                        <StatusBadge status={d.status} />
                      </td>

                      {/* ETA */}
                      <td className="p-3 text-slate-600 font-medium">
                        {d.eta || '30-45 mins'}
                      </td>

                      {/* Delivery Fee */}
                      <td className="p-3 font-semibold text-[#0E1330]">
                        {formatBDT(d.fee || 60)}
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setViewDelivery(d)}
                            title="View details & timeline"
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setAssignRiderModal(d)}
                            title="Reassign rider"
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-[#3B4CE0] cursor-pointer"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                    No deliveries match the selected filters or search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delivery Detail & Timeline Modal */}
      {viewDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0E1330]/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl relative text-[#0E1330] space-y-4">
            <button
              type="button"
              onClick={() => setViewDelivery(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:text-[#0E1330] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-[#0E1330]">
                  Delivery #{viewDelivery.orderId}
                </h3>
                <p className="text-xs text-slate-500">Zone: {viewDelivery.zone || 'Dhaka City'}</p>
              </div>
              <StatusBadge status={viewDelivery.status} />
            </div>

            {/* Customer info */}
            <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
              <div className="font-bold text-[#0E1330]">{viewDelivery.customerName}</div>
              <div className="text-slate-600 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {viewDelivery.address}
              </div>
              <div className="text-slate-600 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {viewDelivery.phone}
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h4 className="text-xs font-bold text-[#0E1330] mb-2">Delivery Progress Timeline</h4>
              <div className="space-y-3 pl-3 border-l-2 border-slate-200 text-xs">
                <div className="relative pl-3">
                  <div className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <div className="font-semibold text-[#0E1330]">Order Placed</div>
                  <div className="text-[10px] text-slate-400">10:15 AM</div>
                </div>
                <div className="relative pl-3">
                  <div className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <div className="font-semibold text-[#0E1330]">Rider Assigned & Picked Up</div>
                  <div className="text-[10px] text-slate-400">10:30 AM</div>
                </div>
                <div className="relative pl-3">
                  <div className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <div className="font-semibold text-[#0E1330]">Out for Delivery</div>
                  <div className="text-[10px] text-slate-400">10:45 AM</div>
                </div>
              </div>
            </div>

            {/* Quick Status Override */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Update Status:</span>
              <select
                value={viewDelivery.status}
                onChange={(e) => {
                  if (onUpdateDeliveryStatus) {
                    onUpdateDeliveryStatus(viewDelivery.id, e.target.value);
                  }
                  setViewDelivery({ ...viewDelivery, status: e.target.value });
                }}
                className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-[#0E1330]"
              >
                <option value="pending">Pending Pickup</option>
                <option value="picked_up">Picked Up</option>
                <option value="in_transit">In Transit</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="failed">Failed</option>
                <option value="returned">Returned</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Assign Rider Modal */}
      {assignRiderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0E1330]/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-slate-200 shadow-2xl relative text-[#0E1330] space-y-4">
            <button
              type="button"
              onClick={() => setAssignRiderModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:text-[#0E1330] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="text-base font-bold text-[#0E1330]">Assign Rider</h3>
              <p className="text-xs text-slate-500">
                Select courier rider for Order #{assignRiderModal.orderId}
              </p>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {riders.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    if (onAssignRider) onAssignRider(assignRiderModal.id, r.id);
                    setAssignRiderModal(null);
                  }}
                  className="w-full p-3 rounded-xl border border-slate-200 hover:border-[#3B4CE0] bg-slate-50 hover:bg-indigo-50/50 text-left flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div>
                    <div className="text-xs font-bold text-[#0E1330]">{r.name}</div>
                    <div className="text-[10px] text-slate-500">{r.phone} • {r.activeCount || 0} active orders</div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      r.status === 'Available'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {r.status}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
