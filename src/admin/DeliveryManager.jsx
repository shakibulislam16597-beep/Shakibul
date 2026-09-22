import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

import DeliveryDashboard from './delivery/DeliveryDashboard';
import DeliveryTable from './delivery/DeliveryTable';
import RidersManager from './delivery/RidersManager';
import LiveTracking from './delivery/LiveTracking';
import ZoneEditor from './delivery/ZoneEditor';
import DeliverySettings from './delivery/DeliverySettings';
import DeliveryReports from './delivery/DeliveryReports';

import {
  Truck,
  LayoutDashboard,
  ShoppingBag,
  UserCheck,
  MapPin,
  Settings,
  FileText,
  Clock
} from 'lucide-react';

// Mock Fallback Data for Deliveries
const INITIAL_DELIVERIES = [
  {
    id: 'del-1',
    orderId: 'ORD-8921',
    customerName: 'Sabbir Hossain',
    address: 'House 14, Road 7, Block D, Banani, Dhaka',
    phone: '01711223344',
    riderId: 'rider-1',
    status: 'in_transit',
    zone: 'Dhaka North',
    eta: '25 mins',
    fee: 60
  },
  {
    id: 'del-2',
    orderId: 'ORD-8922',
    customerName: 'Nusrat Jahan',
    address: 'Flat 4A, Plot 22, Gulshan 2, Dhaka',
    phone: '01822334455',
    riderId: 'rider-2',
    status: 'out_for_delivery',
    zone: 'Dhaka North',
    eta: '15 mins',
    fee: 60
  },
  {
    id: 'del-3',
    orderId: 'ORD-8923',
    customerName: 'Ariful Islam',
    address: 'Sector 4, Road 11, Uttara, Dhaka',
    phone: '01933445566',
    riderId: null,
    status: 'pending',
    zone: 'Uttara & Airport',
    eta: '45 mins',
    fee: 80
  },
  {
    id: 'del-4',
    orderId: 'ORD-8920',
    customerName: 'Tahmid Rahman',
    address: 'Dhanmondi 27, Old 16, Dhaka',
    phone: '01644556677',
    riderId: 'rider-1',
    status: 'delivered',
    zone: 'Dhaka South',
    eta: 'Delivered',
    fee: 70
  },
  {
    id: 'del-5',
    orderId: 'ORD-8919',
    customerName: 'Fariha Akter',
    address: 'Mirpur 10, Block C, Dhaka',
    phone: '01555667788',
    riderId: 'rider-3',
    status: 'failed',
    zone: 'Mirpur & Pallabi',
    eta: 'Failed',
    fee: 60
  }
];

const INITIAL_RIDERS = [
  {
    id: 'rider-1',
    name: 'Tanvir Ahmed',
    phone: '01710001122',
    vehicle: 'Motorcycle',
    zone: 'Dhaka North',
    status: 'Available',
    activeCount: 2,
    rating: 4.9,
    completedCount: 54
  },
  {
    id: 'rider-2',
    name: 'Rakibul Hasan',
    phone: '01820002233',
    vehicle: 'Motorcycle',
    zone: 'Dhaka South',
    status: 'Busy',
    activeCount: 3,
    rating: 4.8,
    completedCount: 42
  },
  {
    id: 'rider-3',
    name: 'Mehedi Hasan',
    phone: '01930003344',
    vehicle: 'Bicycle',
    zone: 'Mirpur & Pallabi',
    status: 'Offline',
    activeCount: 0,
    rating: 4.7,
    completedCount: 38
  }
];

const INITIAL_ZONES = [
  {
    id: 'zone-1',
    name: 'Dhaka North (Gulshan, Banani, Uttara)',
    baseFee: 60,
    perKmRate: 15,
    estimatedTime: '30-45 mins',
    active: true
  },
  {
    id: 'zone-2',
    name: 'Dhaka South (Dhanmondi, Lalmatia, Motijheel)',
    baseFee: 70,
    perKmRate: 18,
    estimatedTime: '40-60 mins',
    active: true
  },
  {
    id: 'zone-3',
    name: 'Mirpur & Pallabi Zone',
    baseFee: 60,
    perKmRate: 15,
    estimatedTime: '30-50 mins',
    active: true
  },
  {
    id: 'zone-4',
    name: 'Outside Dhaka / Courier Express',
    baseFee: 130,
    perKmRate: 25,
    estimatedTime: '2-3 Days',
    active: true
  }
];

export default function DeliveryManager({ currentHash, user }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [deliveries, setDeliveries] = useState(INITIAL_DELIVERIES);
  const [riders, setRiders] = useState(INITIAL_RIDERS);
  const [zones, setZones] = useState(INITIAL_ZONES);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(false);

  // Sync hash routing sub-tabs
  useEffect(() => {
    if (currentHash === '#/admin/delivery/orders') setActiveTab('orders');
    else if (currentHash === '#/admin/delivery/riders') setActiveTab('riders');
    else if (currentHash === '#/admin/delivery/tracking') setActiveTab('tracking');
    else if (currentHash === '#/admin/delivery/zones') setActiveTab('zones');
    else if (currentHash === '#/admin/delivery/settings') setActiveTab('settings');
    else if (currentHash === '#/admin/delivery/reports') setActiveTab('reports');
    else setActiveTab('overview');
  }, [currentHash]);

  // Load riders and delivery data from Firestore with fallback
  useEffect(() => {
    let isMounted = true;
    const fetchDeliveryData = async () => {
      if (!db) return;
      try {
        const ridersSnap = await getDocs(collection(db, 'riders'));
        if (isMounted && !ridersSnap.empty) {
          const loaded = ridersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setRiders(loaded);
        }
      } catch (err) {
        console.warn('Firestore fetch riders warning:', err);
      }
    };
    fetchDeliveryData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleUpdateDeliveryStatus = async (id, newStatus) => {
    setDeliveries((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: newStatus } : d))
    );
    if (db) {
      try {
        await updateDoc(doc(db, 'deliveries', id), { status: newStatus });
      } catch (e) {
        console.warn('Firestore update status error:', e);
      }
    }
  };

  const handleAssignRider = async (deliveryId, riderId) => {
    setDeliveries((prev) =>
      prev.map((d) =>
        d.id === deliveryId ? { ...d, riderId, status: 'picked_up' } : d
      )
    );
  };

  const handleSaveRider = async (riderData) => {
    setRiders((prev) => {
      const idx = prev.findIndex((r) => r.id === riderData.id);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx] = riderData;
        return updated;
      }
      return [riderData, ...prev];
    });

    if (db) {
      try {
        await setDoc(doc(db, 'riders', riderData.id), riderData);
      } catch (e) {
        console.warn('Firestore save rider error:', e);
      }
    }
  };

  const handleDeleteRider = async (riderId) => {
    setRiders((prev) => prev.filter((r) => r.id !== riderId));
    if (db) {
      try {
        await deleteDoc(doc(db, 'riders', riderId));
      } catch (e) {
        console.warn('Firestore delete rider error:', e);
      }
    }
  };

  const handleSaveZone = (zoneData) => {
    setZones((prev) => {
      const idx = prev.findIndex((z) => z.id === zoneData.id);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx] = zoneData;
        return updated;
      }
      return [zoneData, ...prev];
    });
  };

  const handleDeleteZone = (zoneId) => {
    setZones((prev) => prev.filter((z) => z.id !== zoneId));
  };

  const handleToggleZone = (zoneId) => {
    setZones((prev) =>
      prev.map((z) => (z.id === zoneId ? { ...z, active: !z.active } : z))
    );
  };

  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
  };

  const handleExportCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Order ID,Customer,Address,Phone,Status,Fee\n' +
      deliveries
        .map(
          (d) =>
            `${d.orderId},"${d.customerName}","${d.address}",${d.phone},${d.status},${d.fee}`
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `extrovat_deliveries_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tabs = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard, hash: '#/admin/delivery' },
    { key: 'orders', label: 'Delivery Orders', icon: ShoppingBag, hash: '#/admin/delivery/orders' },
    { key: 'riders', label: 'Riders Directory', icon: UserCheck, hash: '#/admin/delivery/riders' },
    { key: 'tracking', label: 'Live GPS Map', icon: MapPin, hash: '#/admin/delivery/tracking' },
    { key: 'zones', label: 'Zones & Fees', icon: Truck, hash: '#/admin/delivery/zones' },
    { key: 'settings', label: 'Settings', icon: Settings, hash: '#/admin/delivery/settings' },
    { key: 'reports', label: 'Reports', icon: FileText, hash: '#/admin/delivery/reports' }
  ];

  return (
    <div className="space-y-6">
      {/* Module Title Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#3B4CE0] text-white rounded-xl shadow-xs">
              <Truck className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0E1330]">
              Delivery Management Console
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dispatch control, real-time rider tracking, zone rates, and delivery logistics
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs Bar */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto pb-1 text-xs font-semibold select-none scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <a
              key={tab.key}
              href={tab.hash}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-[#3B4CE0] text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-[#0E1330] hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </a>
          );
        })}
      </div>

      {/* Main Tab Content View */}
      {activeTab === 'overview' && (
        <DeliveryDashboard
          metrics={{
            totalToday: deliveries.length,
            inTransit: deliveries.filter((d) => d.status === 'in_transit' || d.status === 'out_for_delivery').length,
            delivered: deliveries.filter((d) => d.status === 'delivered').length,
            failedReturned: deliveries.filter((d) => d.status === 'failed' || d.status === 'returned').length,
            pendingPickup: deliveries.filter((d) => d.status === 'pending').length
          }}
          onNavigateTab={(tabKey) => {
            window.location.hash = `#/admin/delivery/${tabKey}`;
          }}
        />
      )}

      {activeTab === 'orders' && (
        <DeliveryTable
          deliveries={deliveries}
          riders={riders}
          zones={zones}
          onUpdateDeliveryStatus={handleUpdateDeliveryStatus}
          onAssignRider={handleAssignRider}
          onExportCsv={handleExportCsv}
        />
      )}

      {activeTab === 'riders' && (
        <RidersManager
          riders={riders}
          onSaveRider={handleSaveRider}
          onDeleteRider={handleDeleteRider}
        />
      )}

      {activeTab === 'tracking' && (
        <LiveTracking deliveries={deliveries} riders={riders} />
      )}

      {activeTab === 'zones' && (
        <ZoneEditor
          zones={zones}
          onSaveZone={handleSaveZone}
          onDeleteZone={handleDeleteZone}
          onToggleZone={handleToggleZone}
        />
      )}

      {activeTab === 'settings' && (
        <DeliverySettings settings={settings} onSaveSettings={handleSaveSettings} />
      )}

      {activeTab === 'reports' && (
        <DeliveryReports riders={riders} onExportReport={handleExportCsv} />
      )}
    </div>
  );
}
