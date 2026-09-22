import React, { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { logAction } from '../lib/audit';
import { formatBDT } from '../utils/currency';
import {
  Users,
  Search,
  ArrowUpDown,
  RefreshCw,
  ShoppingBag,
  CreditCard,
  Calendar,
  Mail,
  Phone,
  MapPin,
  ArrowLeft,
  FileText,
  Save,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  UserCheck
} from 'lucide-react';

export default function CustomersManager({ currentHash, user }) {
  // Extract customer ID from URL query param e.g. #/admin/customers?id=UID or #/admin/customers/UID
  const extractCustomerId = () => {
    if (!currentHash) return null;
    if (currentHash.includes('?id=')) {
      return currentHash.split('?id=')[1]?.split('&')[0] || null;
    }
    if (currentHash.startsWith('#/admin/customers/') && currentHash !== '#/admin/customers/') {
      return currentHash.replace('#/admin/customers/', '').split('?')[0] || null;
    }
    return null;
  };

  const activeCustomerId = extractCustomerId();

  const [usersList, setUsersList] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Filters & Sorting for List View
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Customer Detail Note State
  const [adminNoteText, setAdminNoteText] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  useEffect(() => {
    fetchCustomersAndOrders();
  }, []);

  const fetchCustomersAndOrders = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      // 1. Fetch Users
      const usersSnap = await getDocs(collection(db, 'users'));
      const fetchedUsers = [];
      usersSnap.forEach((docSnap) => {
        fetchedUsers.push({ id: docSnap.id, ...docSnap.data() });
      });
      setUsersList(fetchedUsers);

      // 2. Fetch Orders for metrics
      const ordersSnap = await getDocs(collection(db, 'orders'));
      const fetchedOrders = [];
      ordersSnap.forEach((docSnap) => {
        fetchedOrders.push({ id: docSnap.id, ...docSnap.data() });
      });
      setOrdersList(fetchedOrders);
    } catch (err) {
      console.error('Error fetching customers/orders:', err);
      if (err?.code === 'permission-denied') {
        setErrorMessage(
          'Firestore permission denied. Note: Listing all user profiles requires admin access rules on the "users" collection.'
        );
      } else {
        setErrorMessage(`Failed to load customer data: ${err?.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper to calculate customer aggregate stats
  const getCustomerMetrics = (customer) => {
    const userOrders = ordersList.filter(
      (order) =>
        (order.userId && order.userId === customer.id) ||
        (order.customerInfo?.email &&
          customer.email &&
          order.customerInfo.email.toLowerCase() === customer.email.toLowerCase())
    );

    const orderCount = userOrders.length;
    const totalSpent = userOrders.reduce((sum, o) => {
      const amt = typeof o.total === 'number' ? o.total : (o.pricing?.total ?? 0);
      return sum + amt;
    }, 0);

    return { userOrders, orderCount, totalSpent };
  };

  // Process customers with metrics
  const enrichedCustomers = usersList.map((customer) => {
    const { userOrders, orderCount, totalSpent } = getCustomerMetrics(customer);
    return {
      ...customer,
      userOrders,
      orderCount,
      totalSpent
    };
  });

  // Active Customer Object for Detail View
  const selectedCustomer = activeCustomerId
    ? enrichedCustomers.find((c) => c.id === activeCustomerId) ||
      usersList.find((c) => c.id === activeCustomerId)
    : null;

  // Populate adminNoteText when switching to detail view
  useEffect(() => {
    if (selectedCustomer) {
      setAdminNoteText(selectedCustomer.adminNote || '');
    }
  }, [activeCustomerId, selectedCustomer?.adminNote]);

  // Save Admin Note
  const handleSaveAdminNote = async () => {
    if (!selectedCustomer) return;
    setIsSavingNote(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const userRef = doc(db, 'users', selectedCustomer.id);
      await updateDoc(userRef, {
        adminNote: adminNoteText.trim(),
        updatedAt: serverTimestamp()
      });

      await logAction('UPDATE_CUSTOMER_NOTE', selectedCustomer.id, {
        customerEmail: selectedCustomer.email
      });

      setSuccessMessage('Admin internal note updated successfully.');
      // Update local state
      setUsersList((prev) =>
        prev.map((u) =>
          u.id === selectedCustomer.id ? { ...u, adminNote: adminNoteText.trim() } : u
        )
      );
    } catch (err) {
      console.error('Error saving admin note:', err);
      setErrorMessage(`Failed to save admin note: ${err?.message || 'Error occurred'}`);
    } finally {
      setIsSavingNote(false);
    }
  };

  // Filter & Sort Customer List
  const filteredCustomers = enrichedCustomers.filter((cust) => {
    const nameStr = (cust.displayName || cust.name || '').toLowerCase();
    const emailStr = (cust.email || '').toLowerCase();
    const phoneStr = (cust.phone || '').toLowerCase();
    const term = searchTerm.toLowerCase();

    return nameStr.includes(term) || emailStr.includes(term) || phoneStr.includes(term);
  });

  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    if (sortBy === 'spent-high-low') return b.totalSpent - a.totalSpent;
    if (sortBy === 'orders-high-low') return b.orderCount - a.orderCount;
    if (sortBy === 'name')
      return (a.displayName || a.name || '').localeCompare(b.displayName || b.name || '');
    // Default newest (createdAt seconds or fallback)
    const tA = a.createdAt?.seconds || 0;
    const tB = b.createdAt?.seconds || 0;
    return tB - tA;
  });

  return (
    <div className="space-y-6">
      {/* Top Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FFFFFF] p-5 rounded-[24px] border-2 border-[#0E1330] shadow-[4px_4px_0px_#0E1330]">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading font-extrabold uppercase text-[#0E1330] flex items-center gap-2">
            <Users className="w-6 h-6 text-[#2436F5]" /> Customer Directory
          </h1>
          <p className="text-xs font-sans text-[#5B6079] mt-0.5">
            View customer user accounts, lifetime spend metrics, order history, and internal notes.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={fetchCustomersAndOrders}
            className="p-2.5 bg-[#F7F8FC] hover:bg-[#FFC933] text-[#0E1330] border-2 border-[#0E1330] rounded-xl font-heading font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Reload</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border-2 border-[#0E1330] rounded-2xl flex items-center justify-between text-xs font-bold text-red-700 shadow-[2px_2px_0px_#0E1330]">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage('')}
            className="p-1 hover:bg-red-100 rounded-lg text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-green-50 border-2 border-[#0E1330] rounded-2xl flex items-center justify-between text-xs font-bold text-emerald-800 shadow-[2px_2px_0px_#0E1330]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage('')}
            className="p-1 hover:bg-green-100 rounded-lg text-emerald-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main View Switcher: Customer Detail vs Customer List */}
      {activeCustomerId ? (
        /* CUSTOMER DETAIL VIEW */
        <div className="space-y-6">
          {/* Back Button */}
          <button
            type="button"
            onClick={() => {
              window.location.hash = '#/admin/customers';
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFFFFF] hover:bg-[#FFC933] text-[#0E1330] font-heading font-extrabold text-xs uppercase tracking-wider rounded-xl border-2 border-[#0E1330] shadow-[2px_2px_0px_#0E1330] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Customer List
          </button>

          {loading ? (
            <div className="p-12 text-center space-y-3 bg-[#FFFFFF] border-2 border-[#0E1330] rounded-[24px]">
              <div className="w-8 h-8 border-4 border-[#2436F5] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-heading font-bold text-[#5B6079]">Loading customer profile details...</p>
            </div>
          ) : !selectedCustomer ? (
            <div className="bg-[#FFFFFF] p-8 rounded-[24px] border-2 border-[#0E1330] text-center space-y-2">
              <p className="text-sm font-heading font-extrabold text-[#0E1330]">
                Customer not found for ID: "{activeCustomerId}"
              </p>
              <button
                type="button"
                onClick={() => {
                  window.location.hash = '#/admin/customers';
                }}
                className="px-4 py-2 bg-[#2436F5] text-white rounded-xl text-xs font-bold"
              >
                Return to Directory
              </button>
            </div>
          ) : (
            <>
              {/* Profile Card & KPI Summary Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="bg-[#FFFFFF] p-6 rounded-[24px] border-2 border-[#0E1330] shadow-[4px_4px_0px_#0E1330] space-y-4">
                  <div className="flex items-center gap-4">
                    {selectedCustomer.photoURL ? (
                      <img
                        src={selectedCustomer.photoURL}
                        alt={selectedCustomer.displayName || 'Customer'}
                        className="w-16 h-16 rounded-full object-cover border-2 border-[#0E1330] shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-[#2436F5] text-white border-2 border-[#0E1330] flex items-center justify-center font-heading font-extrabold text-xl shrink-0">
                        {(selectedCustomer.displayName || selectedCustomer.email || 'C')
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h2 className="text-lg font-heading font-extrabold text-[#0E1330] truncate">
                        {selectedCustomer.displayName || selectedCustomer.name || 'Unnamed Customer'}
                      </h2>
                      <p className="text-xs font-sans text-[#5B6079] truncate">{selectedCustomer.email}</p>
                      <span className="inline-block px-2 py-0.5 bg-[#FFC933] text-[#0E1330] border border-[#0E1330] rounded-md text-[9px] font-heading font-extrabold mt-1">
                        Registered Customer
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t-2 border-[#0E1330]/10 space-y-2 text-xs font-sans text-[#0E1330]">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[#2436F5] shrink-0" />
                      <span className="font-bold">{selectedCustomer.email || 'No email on file'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[#2436F5] shrink-0" />
                      <span className="font-bold">{selectedCustomer.phone || 'No phone number'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#2436F5] shrink-0" />
                      <span className="text-[#5B6079]">
                        Joined:{' '}
                        <strong className="text-[#0E1330]">
                          {selectedCustomer.createdAt?.seconds
                            ? new Date(selectedCustomer.createdAt.seconds * 1000).toLocaleDateString()
                            : 'N/A'}
                        </strong>
                      </span>
                    </div>

                    {/* Addresses */}
                    <div className="pt-2">
                      <div className="flex items-center gap-2 font-heading font-extrabold uppercase text-[11px] text-[#0E1330] mb-1">
                        <MapPin className="w-3.5 h-3.5 text-[#2436F5]" /> Addresses On File
                      </div>
                      {Array.isArray(selectedCustomer.addresses) && selectedCustomer.addresses.length > 0 ? (
                        <div className="space-y-1 pl-5">
                          {selectedCustomer.addresses.map((addr, idx) => (
                            <p key={idx} className="text-[11px] bg-[#F7F8FC] p-2 rounded-lg border border-[#0E1330]/20">
                              {typeof addr === 'string'
                                ? addr
                                : `${addr.address || addr.street || ''}, ${addr.city || ''} (${addr.phone || ''})`}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-[#5B6079] italic pl-5">No saved addresses</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Metrics Cards Column */}
                <div className="lg:col-span-2 space-y-6">
                  {/* KPI Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-[#FFFFFF] p-5 rounded-[20px] border-2 border-[#0E1330] shadow-[3px_3px_0px_#0E1330] space-y-1">
                      <div className="flex items-center justify-between text-[#5B6079]">
                        <span className="text-[11px] font-heading font-extrabold uppercase">Lifetime Spend</span>
                        <CreditCard className="w-4 h-4 text-[#2436F5]" />
                      </div>
                      <p className="text-xl font-heading font-black text-[#0E1330]">
                        {formatBDT(selectedCustomer.totalSpent || 0)}
                      </p>
                    </div>

                    <div className="bg-[#FFFFFF] p-5 rounded-[20px] border-2 border-[#0E1330] shadow-[3px_3px_0px_#0E1330] space-y-1">
                      <div className="flex items-center justify-between text-[#5B6079]">
                        <span className="text-[11px] font-heading font-extrabold uppercase">Total Orders</span>
                        <ShoppingBag className="w-4 h-4 text-[#2436F5]" />
                      </div>
                      <p className="text-xl font-heading font-black text-[#0E1330]">
                        {selectedCustomer.orderCount || 0} orders
                      </p>
                    </div>

                    <div className="bg-[#FFFFFF] p-5 rounded-[20px] border-2 border-[#0E1330] shadow-[3px_3px_0px_#0E1330] space-y-1">
                      <div className="flex items-center justify-between text-[#5B6079]">
                        <span className="text-[11px] font-heading font-extrabold uppercase">Avg Order Value</span>
                        <UserCheck className="w-4 h-4 text-[#2436F5]" />
                      </div>
                      <p className="text-xl font-heading font-black text-[#0E1330]">
                        {selectedCustomer.orderCount > 0
                          ? formatBDT((selectedCustomer.totalSpent || 0) / selectedCustomer.orderCount)
                          : formatBDT(0)}
                      </p>
                    </div>
                  </div>

                  {/* Internal Admin Remarks / Notes */}
                  <div className="bg-[#FFFFFF] p-5 rounded-[24px] border-2 border-[#0E1330] shadow-[4px_4px_0px_#0E1330] space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-heading font-extrabold uppercase text-[#0E1330] flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#2436F5]" /> Internal Staff Remarks / Notes
                      </h3>
                      <button
                        type="button"
                        onClick={handleSaveAdminNote}
                        disabled={isSavingNote}
                        className="px-3.5 py-1.5 bg-[#FFC933] hover:bg-[#e6b42d] text-[#0E1330] font-heading font-extrabold text-xs uppercase rounded-xl border-2 border-[#0E1330] shadow-[2px_2px_0px_#0E1330] flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{isSavingNote ? 'Saving...' : 'Save Note'}</span>
                      </button>
                    </div>

                    <textarea
                      rows={3}
                      value={adminNoteText}
                      onChange={(e) => setAdminNoteText(e.target.value)}
                      placeholder="Add internal remarks about this customer (e.g., 'VIP customer', 'Prefers phone confirmation', 'Special discount eligible')..."
                      className="w-full p-3 bg-[#F7F8FC] border-2 border-[#0E1330] rounded-xl text-xs font-bold text-[#0E1330] focus:outline-none focus:border-[#2436F5]"
                    />
                  </div>
                </div>
              </div>

              {/* Order History for Customer */}
              <div className="bg-[#FFFFFF] border-2 border-[#0E1330] rounded-[24px] shadow-[4px_4px_0px_#0E1330] p-6 space-y-4">
                <h3 className="text-base font-heading font-extrabold uppercase text-[#0E1330] flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-[#2436F5]" /> Customer Order History ({selectedCustomer.userOrders?.length || 0})
                </h3>

                {(!selectedCustomer.userOrders || selectedCustomer.userOrders.length === 0) ? (
                  <div className="bg-[#F7F8FC] p-6 rounded-2xl border-2 border-[#0E1330]/20 text-center space-y-1">
                    <p className="text-xs font-heading font-bold text-[#5B6079]">
                      No orders placed yet by this customer account.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#F7F8FC] border-b-2 border-[#0E1330] text-[11px] font-heading font-extrabold uppercase tracking-wider text-[#0E1330]">
                          <th className="p-3">Order ID</th>
                          <th className="p-3">Date</th>
                          <th className="p-3">Items</th>
                          <th className="p-3">Total</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-2 divide-[#0E1330]/10 text-xs font-sans text-[#0E1330]">
                        {selectedCustomer.userOrders.map((ord) => {
                          const dateStr = ord.createdAt?.seconds
                            ? new Date(ord.createdAt.seconds * 1000).toLocaleDateString()
                            : 'N/A';
                          const itemCount = Array.isArray(ord.items) ? ord.items.reduce((s, i) => s + (i.quantity || 1), 0) : 1;
                          const totalAmt = typeof ord.total === 'number' ? ord.total : (ord.pricing?.total ?? 0);
                          const status = ord.status || 'pending';

                          return (
                            <tr key={ord.id} className="hover:bg-[#F7F8FC]">
                              <td className="p-3 font-mono font-bold text-[#2436F5]">#{ord.id.slice(0, 8)}</td>
                              <td className="p-3 font-bold text-[#5B6079]">{dateStr}</td>
                              <td className="p-3 font-bold">{itemCount} items</td>
                              <td className="p-3 font-heading font-extrabold text-[#0E1330]">{formatBDT(totalAmt)}</td>
                              <td className="p-3">
                                <span className="px-2.5 py-1 rounded-lg border text-[10px] font-heading font-extrabold uppercase bg-amber-100 text-amber-900 border-[#0E1330]">
                                  {status}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                <a
                                  href={`#/admin/orders?id=${ord.id}`}
                                  className="inline-flex items-center gap-1 px-3 py-1 bg-[#F7F8FC] hover:bg-[#FFC933] border-2 border-[#0E1330] rounded-lg font-heading font-bold text-[10px] text-[#0E1330]"
                                >
                                  View <ExternalLink className="w-3 h-3" />
                                </a>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        /* CUSTOMER DIRECTORY LIST VIEW */
        <div className="space-y-4">
          {/* Search Bar & Sort Row */}
          <div className="bg-[#FFFFFF] p-4 rounded-[20px] border-2 border-[#0E1330] shadow-[3px_3px_0px_#0E1330] grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-[#5B6079] absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search customers by name, email, or phone..."
                className="w-full pl-9 pr-3 py-2 bg-[#F7F8FC] border-2 border-[#0E1330] rounded-xl text-xs font-bold text-[#0E1330] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 bg-[#F7F8FC] border-2 border-[#0E1330] rounded-xl px-3 py-1.5">
              <ArrowUpDown className="w-4 h-4 text-[#5B6079] shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-[#0E1330] focus:outline-none cursor-pointer"
              >
                <option value="newest">Sort by Joined Date (Newest)</option>
                <option value="spent-high-low">Lifetime Spend: High to Low</option>
                <option value="orders-high-low">Total Orders: High to Low</option>
                <option value="name">Customer Name: A-Z</option>
              </select>
            </div>
          </div>

          {/* Main List Table */}
          {loading ? (
            <div className="p-12 text-center space-y-3 bg-[#FFFFFF] border-2 border-[#0E1330] rounded-[24px]">
              <div className="w-8 h-8 border-4 border-[#2436F5] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-heading font-bold text-[#5B6079]">Loading customer directory...</p>
            </div>
          ) : sortedCustomers.length === 0 ? (
            <div className="bg-[#FFFFFF] p-8 rounded-[24px] border-2 border-[#0E1330] text-center space-y-2">
              <Users className="w-8 h-8 text-[#5B6079] mx-auto" />
              <p className="text-sm font-heading font-extrabold text-[#0E1330]">
                No customer profiles match your search criteria.
              </p>
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="px-4 py-2 bg-[#2436F5] text-white rounded-xl text-xs font-bold"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="bg-[#FFFFFF] border-2 border-[#0E1330] rounded-[24px] shadow-[4px_4px_0px_#0E1330] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F7F8FC] border-b-2 border-[#0E1330] text-[11px] font-heading font-extrabold uppercase tracking-wider text-[#0E1330]">
                      <th className="p-4">Customer</th>
                      <th className="p-4">Phone</th>
                      <th className="p-4">Joined Date</th>
                      <th className="p-4">Total Orders</th>
                      <th className="p-4">Lifetime Spend</th>
                      <th className="p-4 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-[#0E1330]/10 text-xs font-sans text-[#0E1330]">
                    {sortedCustomers.map((cust) => {
                      const name = cust.displayName || cust.name || 'Unnamed Customer';
                      const email = cust.email || 'No email';
                      const phone = cust.phone || 'N/A';
                      const dateStr = cust.createdAt?.seconds
                        ? new Date(cust.createdAt.seconds * 1000).toLocaleDateString()
                        : 'N/A';

                      return (
                        <tr
                          key={cust.id}
                          onClick={() => {
                            window.location.hash = `#/admin/customers?id=${cust.id}`;
                          }}
                          className="hover:bg-[#F7F8FC] transition-colors cursor-pointer"
                        >
                          {/* Customer Info */}
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {cust.photoURL ? (
                                <img
                                  src={cust.photoURL}
                                  alt={name}
                                  className="w-10 h-10 rounded-full object-cover border-2 border-[#0E1330] shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-[#2436F5] text-white border-2 border-[#0E1330] flex items-center justify-center font-heading font-extrabold text-sm shrink-0">
                                  {name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-heading font-bold text-xs text-[#0E1330] truncate">
                                  {name}
                                </p>
                                <p className="text-[10px] text-[#5B6079] truncate">{email}</p>
                              </div>
                            </div>
                          </td>

                          <td className="p-4 font-bold text-[#5B6079]">{phone}</td>
                          <td className="p-4 font-bold text-[#5B6079]">{dateStr}</td>
                          <td className="p-4 font-extrabold text-[#0E1330]">{cust.orderCount} orders</td>
                          <td className="p-4 font-heading font-extrabold text-[#0E1330]">
                            {formatBDT(cust.totalSpent)}
                          </td>
                          <td className="p-4 text-right">
                            <a
                              href={`#/admin/customers?id=${cust.id}`}
                              className="px-3 py-1.5 bg-[#FFC933] hover:bg-[#e6b42d] text-[#0E1330] border-2 border-[#0E1330] rounded-xl font-heading font-extrabold text-[11px] shadow-[2px_2px_0px_#0E1330] inline-flex items-center gap-1"
                            >
                              View Profile
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
