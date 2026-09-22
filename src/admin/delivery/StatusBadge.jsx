import React from 'react';
import {
  Clock,
  PackageCheck,
  Truck,
  Navigation,
  CheckCircle2,
  XCircle,
  RotateCcw
} from 'lucide-react';

/**
 * StatusBadge Component - Delivery Module
 * Standardized color-coded status pills
 */
export default function StatusBadge({ status }) {
  const normStatus = (status || 'pending').toLowerCase().replace('_', ' ');

  let bgClass = 'bg-amber-100 text-amber-800 border-amber-300';
  let icon = <Clock className="w-3 h-3" />;
  let label = 'Pending';

  if (normStatus === 'pending' || normStatus === 'pending_pickup' || normStatus === 'pending pickup') {
    bgClass = 'bg-amber-50 text-amber-800 border-amber-200';
    icon = <Clock className="w-3 h-3 text-amber-600" />;
    label = 'Pending Pickup';
  } else if (normStatus === 'picked_up' || normStatus === 'picked up') {
    bgClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
    icon = <PackageCheck className="w-3 h-3 text-indigo-600" />;
    label = 'Picked Up';
  } else if (normStatus === 'in_transit' || normStatus === 'in transit' || normStatus === 'shipped') {
    bgClass = 'bg-blue-50 text-blue-700 border-blue-200';
    icon = <Truck className="w-3 h-3 text-blue-600" />;
    label = 'In Transit';
  } else if (normStatus === 'out_for_delivery' || normStatus === 'out for delivery') {
    bgClass = 'bg-sky-50 text-sky-700 border-sky-200';
    icon = <Navigation className="w-3 h-3 text-sky-600" />;
    label = 'Out for Delivery';
  } else if (normStatus === 'delivered' || normStatus === 'completed') {
    bgClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    icon = <CheckCircle2 className="w-3 h-3 text-emerald-600" />;
    label = 'Delivered';
  } else if (normStatus === 'failed') {
    bgClass = 'bg-rose-50 text-rose-700 border-rose-200';
    icon = <XCircle className="w-3 h-3 text-rose-600" />;
    label = 'Failed';
  } else if (normStatus === 'returned' || normStatus === 'cancelled') {
    bgClass = 'bg-slate-100 text-slate-700 border-slate-300';
    icon = <RotateCcw className="w-3 h-3 text-slate-600" />;
    label = normStatus === 'returned' ? 'Returned' : 'Cancelled';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${bgClass}`}
    >
      {icon}
      <span>{label}</span>
    </span>
  );
}
