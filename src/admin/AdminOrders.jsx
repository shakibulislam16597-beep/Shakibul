import React, { useState, useEffect } from 'react';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  writeBatch,
  runTransaction,
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { logAction } from '../lib/audit';
import { formatBDT } from '../utils/currency';
import {
  ShoppingBag,
  Search,
  Copy,
  Check,
  Phone,
  MessageCircle,
  Printer,
  ChevronRight,
  AlertTriangle,
  XCircle,
  Truck,
  CheckCircle2,
  Package,
  RotateCcw,
  Clock,
  Save,
  User,
  MapPin,
  CreditCard,
  FileText
} from 'lucide-react';

export default function AdminOrders({ initialTab = 'all' }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned'
  const [orders, setOrders] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrderDoc, setSelectedOrderDoc] = useState(null);

  // Status message notification
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }

  // Fields for order detail
  const [internalNote, setInternalNote] = useState('');
  const [courierName, setCourierName] = useState('');
  const [courierTrackingId, setCourierTrackingId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Stock shortage modal state
  const [shortageInfo, setShortageInfo] = useState(null); // { order, shortItems, targetStatus }

  // Sync activeTab when initialTab changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Load orders when activeTab changes or search is cleared
  useEffect(() => {
    if (!searchQuery.trim()) {
      fetchOrders(activeTab, false);
    }
  }, [activeTab]);

  const showToast = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Fetch orders based on active tab
  const fetchOrders = async (tab, isLoadMore = false) => {
    if (!db) {
      setOrders([]);
      showToast('error', 'Database connection not initialized.');
      return;
    }

    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setOrders([]);
      setLastDoc(null);
    }

    try {
      let q;
      const ordersRef = collection(db, 'orders');

      if (tab === 'all') {
        if (isLoadMore && lastDoc) {
          q = query(ordersRef, orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(50));
        } else {
          q = query(ordersRef, orderBy('createdAt', 'desc'), limit(50));
        }
      } else {
        // Status tab: query where status == tab, limit 100, sort on client
        q = query(ordersRef, where('status', '==', tab), limit(100));
      }

      const snap = await getDocs(q);
      const docsList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Client sort for status queries
      if (tab !== 'all') {
        docsList.sort((a, b) => {
          const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
          const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
          return timeB - timeA;
        });
      }

      if (isLoadMore) {
        setOrders((prev) => [...prev, ...docsList]);
      } else {
        setOrders(docsList);
      }

      if (snap.docs.length > 0) {
        setLastDoc(snap.docs[snap.docs.length - 1]);
      } else if (!isLoadMore) {
        setLastDoc(null);
      }
    } catch (err) {
      console.warn('Error fetching orders:', err);
      showToast('error', 'Failed to load orders: ' + (err.message || 'Permission or network issue'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Handle Order Search (Exact Order No or Phone)
  const handleSearch = async (e) => {
    e.preventDefault();
    const queryStr = searchQuery.trim();
    if (!queryStr) {
      fetchOrders(activeTab, false);
      return;
    }

    setLoading(true);
    setOrders([]);

    if (!db) {
      setLoading(false);
      showToast('error', 'Database offline');
      return;
    }

    try {
      const ordersRef = collection(db, 'orders');
      let foundList = [];

      // If looks like an order ID (e.g. EXT-...) or exact match attempt via getDoc
      const upperQuery = queryStr.toUpperCase();
      const directDocRef = doc(db, 'orders', upperQuery);
      const directSnap = await getDoc(directDocRef);

      if (directSnap.exists()) {
        foundList.push({ id: directSnap.id, ...directSnap.data() });
      } else {
        // Query phone number
        const phoneQ = query(ordersRef, where('customer.phone', '==', queryStr), limit(50));
        const phoneSnap = await getDocs(phoneQ);
        phoneSnap.forEach((d) => foundList.push({ id: d.id, ...d.data() }));

        // Fallback: search orderNo field
        if (foundList.length === 0) {
          const orderNoQ = query(ordersRef, where('orderNo', '==', upperQuery), limit(50));
          const orderNoSnap = await getDocs(orderNoQ);
          orderNoSnap.forEach((d) => foundList.push({ id: d.id, ...d.data() }));
        }
      }

      setOrders(foundList);
      if (foundList.length === 0) {
        showToast('error', `No order found for "${queryStr}"`);
      }
    } catch (err) {
      console.warn('Order search error:', err);
      showToast('error', 'Search failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Open Order Detail Drawer / View
  const handleSelectOrder = (ord) => {
    setSelectedOrder(ord);
    setInternalNote(ord.note || '');
    setCourierName(ord.courier?.name || '');
    setCourierTrackingId(ord.courier?.trackingId || '');
  };

  // Copy customer full address
  const handleCopyAddress = (cust) => {
    if (!cust) return;
    const fullText = `${cust.name || ''}, ${cust.phone || ''}\n${cust.address || ''}, ${cust.district || ''}`;
    navigator.clipboard.writeText(fullText);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  // Update payment status (e.g. verified or failed)
  const handleUpdatePaymentStatus = async (newStatus) => {
    if (!selectedOrder || !db) return;
    setActionLoading(true);

    try {
      const adminEmail = auth?.currentUser?.email || 'admin@extrovat.com';
      const orderRef = doc(db, 'orders', selectedOrder.id);

      const updatedPayment = {
        ...(selectedOrder.payment || {}),
        status: newStatus
      };

      const batch = writeBatch(db);
      batch.update(orderRef, {
        payment: updatedPayment,
        updatedAt: serverTimestamp()
      });

      await batch.commit();

      const updated = {
        ...selectedOrder,
        payment: updatedPayment
      };
      setSelectedOrder(updated);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));

      await logAction('UPDATE_ORDER_PAYMENT', selectedOrder.id, {
        paymentStatus: newStatus
      });

      showToast('success', `Payment marked as ${newStatus}`);
    } catch (err) {
      console.warn('Update payment error:', err);
      showToast('error', 'Failed to update payment status: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Save internal note
  const handleSaveNote = async () => {
    if (!selectedOrder || !db) return;
    setActionLoading(true);

    try {
      const orderRef = doc(db, 'orders', selectedOrder.id);
      await writeBatch(db).update(orderRef, {
        note: internalNote,
        updatedAt: serverTimestamp()
      }).commit();

      const updated = { ...selectedOrder, note: internalNote };
      setSelectedOrder(updated);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));

      await logAction('UPDATE_ORDER_NOTE', selectedOrder.id, { note: internalNote });
      showToast('success', 'Internal note saved');
    } catch (err) {
      console.warn('Save note error:', err);
      showToast('error', 'Failed to save note: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Save courier info
  const handleSaveCourier = async () => {
    if (!selectedOrder || !db) return;
    setActionLoading(true);

    try {
      const orderRef = doc(db, 'orders', selectedOrder.id);
      const courierObj = { name: courierName.trim(), trackingId: courierTrackingId.trim() };

      await writeBatch(db).update(orderRef, {
        courier: courierObj,
        updatedAt: serverTimestamp()
      }).commit();

      const updated = { ...selectedOrder, courier: courierObj };
      setSelectedOrder(updated);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));

      await logAction('UPDATE_ORDER_COURIER', selectedOrder.id, courierObj);
      showToast('success', 'Courier information saved');
    } catch (err) {
      console.warn('Save courier error:', err);
      showToast('error', 'Failed to save courier info: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Stock deduction transaction helper
  const performStockDeduction = async (orderDoc, ignoreShortage = false) => {
    const adminEmail = auth?.currentUser?.email || 'admin@extrovat.com';
    const items = orderDoc.items || [];
    const shortItems = [];

    // Step 1: Check for inventory shortages before starting transaction
    for (const item of items) {
      if (!item.productId) continue;
      try {
        const pRef = doc(db, 'products', item.productId);
        const pSnap = await getDoc(pRef);
        if (pSnap.exists()) {
          const currentStock = pSnap.data()?.stock ?? 0;
          if (currentStock < (item.qty || 1)) {
            shortItems.push({
              productId: item.productId,
              name: item.name,
              requested: item.qty || 1,
              available: currentStock
            });
          }
        }
      } catch (e) {
        console.warn('Error checking item stock:', e);
      }
    }

    if (shortItems.length > 0 && !ignoreShortage) {
      // Trigger shortage confirmation modal
      setShortageInfo({
        order: orderDoc,
        shortItems,
        targetStatus: 'processing'
      });
      return false; // Stop deduction for now until user confirms "Process anyway"
    }

    // Step 2: Execute Firestore Transaction (Strictly All Reads First, then All Writes)
    await runTransaction(db, async (transaction) => {
      const readResults = [];

      // Phase 1: All Reads
      for (const item of items) {
        if (!item.productId) continue;
        const pRef = doc(db, 'products', item.productId);
        const pSnap = await transaction.get(pRef);
        readResults.push({ item, pRef, pSnap });
      }

      // Phase 2: All Writes
      for (const { item, pRef, pSnap } of readResults) {
        if (pSnap.exists()) {
          const currentStock = pSnap.data()?.stock ?? 0;
          const newStock = Math.max(0, currentStock - (item.qty || 1));
          transaction.update(pRef, { stock: newStock });

          // Record stock movement
          const movementRef = doc(collection(db, 'stockMovements'));
          transaction.set(movementRef, {
            productId: item.productId,
            productName: item.name || '',
            type: 'out',
            qty: item.qty || 1,
            reason: 'order',
            orderNo: orderDoc.orderNo || orderDoc.id,
            by: adminEmail,
            createdAt: serverTimestamp()
          });
        }
      }
    });

    return true;
  };

  // Stock restoration transaction helper for cancellation or return
  const performStockRestoration = async (orderDoc, reasonType) => {
    if (!orderDoc.stockDeducted) return; // Only restore if stock was previously deducted

    const adminEmail = auth?.currentUser?.email || 'admin@extrovat.com';
    const items = orderDoc.items || [];

    await runTransaction(db, async (transaction) => {
      const readResults = [];

      // Phase 1: All Reads
      for (const item of items) {
        if (!item.productId) continue;
        const pRef = doc(db, 'products', item.productId);
        const pSnap = await transaction.get(pRef);
        readResults.push({ item, pRef, pSnap });
      }

      // Phase 2: All Writes
      for (const { item, pRef, pSnap } of readResults) {
        if (pSnap.exists()) {
          const currentStock = pSnap.data()?.stock ?? 0;
          const newStock = currentStock + (item.qty || 1);
          transaction.update(pRef, { stock: newStock });

          // Record stock movement
          const movementRef = doc(collection(db, 'stockMovements'));
          transaction.set(movementRef, {
            productId: item.productId,
            productName: item.name || '',
            type: 'in',
            qty: item.qty || 1,
            reason: reasonType, // 'cancel' or 'return'
            orderNo: orderDoc.orderNo || orderDoc.id,
            by: adminEmail,
            createdAt: serverTimestamp()
          });
        }
      }
    });
  };

  // Main Status Transition Handler
  const handleTransitionStatus = async (targetStatus, reason = '', ignoreShortage = false) => {
    if (!selectedOrder || !db) return;
    setActionLoading(true);

    try {
      const adminEmail = auth?.currentUser?.email || 'admin@extrovat.com';
      const nowISO = new Date().toISOString();
      const orderId = selectedOrder.id;

      let stockDeductedState = selectedOrder.stockDeducted || false;

      // Part C: Handle Stock Deduction when moving pending -> processing
      if (selectedOrder.status === 'pending' && targetStatus === 'processing' && !stockDeductedState) {
        const success = await performStockDeduction(selectedOrder, ignoreShortage);
        if (!success) {
          setActionLoading(false);
          return; // Stock shortage modal triggered
        }
        stockDeductedState = true;
      }

      // Part C: Handle Stock Restoration when cancelling or returning an order where stockDeducted == true
      if (stockDeductedState && (targetStatus === 'cancelled' || targetStatus === 'returned')) {
        const reasonType = targetStatus === 'cancelled' ? 'cancel' : 'return';
        await performStockRestoration(selectedOrder, reasonType);
        stockDeductedState = false;
      }

      // Timeline entry
      const timelineEntry = {
        status: targetStatus,
        at: nowISO,
        by: adminEmail
      };
      if (reason) {
        timelineEntry.reason = reason;
      }

      // WriteBatch: Update orders/{id} AND trackOrders/{id} simultaneously
      const batch = writeBatch(db);

      const orderRef = doc(db, 'orders', orderId);
      batch.update(orderRef, {
        status: targetStatus,
        stockDeducted: stockDeductedState,
        updatedAt: serverTimestamp(),
        timeline: arrayUnion(timelineEntry)
      });

      const trackRef = doc(db, 'trackOrders', orderId);
      batch.update(trackRef, {
        status: targetStatus,
        updatedAt: serverTimestamp(),
        timeline: arrayUnion(timelineEntry)
      });

      await batch.commit();

      // Update local state
      const updatedTimeline = [...(selectedOrder.timeline || []), timelineEntry];
      const updatedOrder = {
        ...selectedOrder,
        status: targetStatus,
        stockDeducted: stockDeductedState,
        timeline: updatedTimeline
      };

      setSelectedOrder(updatedOrder);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));

      await logAction('UPDATE_ORDER_STATUS', orderId, {
        from: selectedOrder.status,
        to: targetStatus,
        reason
      });

      showToast('success', `Order status updated to ${targetStatus}`);
    } catch (err) {
      console.warn('Status transition error:', err);
      showToast('error', 'Failed to update order status: ' + err.message);
    } finally {
      setActionLoading(false);
      setShortageInfo(null);
    }
  };

  // Prompt for cancellation/return reason
  const handlePromptTransition = (targetStatus) => {
    const reasonPrompt = window.prompt(`Please enter reason for marking order as ${targetStatus}:`);
    if (reasonPrompt === null) return; // User cancelled prompt
    handleTransitionStatus(targetStatus, reasonPrompt.trim());
  };

  // WhatsApp Customer URL generator (01XXXXXXXXX -> 8801XXXXXXXXX)
  const getWhatsAppUrl = (phone) => {
    if (!phone) return '#';
    let clean = phone.replace(/[\s-]/g, '');
    if (clean.startsWith('01')) {
      clean = '88' + clean;
    } else if (clean.startsWith('+8801')) {
      clean = clean.replace('+', '');
    }
    return `https://wa.me/${clean}`;
  };

  // Print invoice helper
  const handlePrintInvoice = () => {
    window.print();
  };

  const statusTabs = [
    { key: 'all', label: 'All Orders' },
    { key: 'pending', label: 'Pending' },
    { key: 'processing', label: 'Processing' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'cancelled', label: 'Cancelled' },
    { key: 'returned', label: 'Returns' }
  ];

  return (
    <div className="space-y-6">
      {/* Toast Feedback Notification */}
      {feedback && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl border-2 shadow-[4px_4px_0px_#0E1330] flex items-center gap-2 text-xs font-heading font-extrabold animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-[#FFC933] border-[#0E1330] text-[#0E1330]'
              : 'bg-rose-500 border-[#0E1330] text-white'
          }`}
        >
          {feedback.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FFFFFF] p-5 rounded-[24px] border-2 border-[#0E1330] shadow-[4px_4px_0px_#0E1330]">
        <div>
          <h1 className="text-xl font-heading font-extrabold text-[#0E1330] flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#2436F5]" />
            <span>Orders Management</span>
          </h1>
          <p className="text-xs font-sans text-[#5B6079]">
            Manage customer orders, status flows, verification & shipping
          </p>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="flex gap-2 max-w-md w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5B6079]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order # or phone..."
              className="w-full pl-9 pr-3 py-2 bg-[#F7F8FC] border-2 border-[#0E1330] rounded-xl text-xs font-bold text-[#0E1330] focus:outline-none focus:border-[#2436F5]"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-[#0E1330] text-white border-2 border-[#0E1330] rounded-xl text-xs font-heading font-bold hover:bg-[#2436F5] cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {statusTabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveTab(tab.key);
              }}
              className={`px-4 py-2 rounded-xl border-2 font-heading font-bold text-xs shrink-0 transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#2436F5] text-white border-[#0E1330] shadow-[2px_2px_0px_#0E1330]'
                  : 'bg-[#FFFFFF] border-[#0E1330] text-[#0E1330] hover:bg-[#FFC933]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Orders List Area */}
      {loading ? (
        <div className="bg-[#FFFFFF] p-8 rounded-[24px] border-2 border-[#0E1330] text-center space-y-3">
          <div className="w-8 h-8 border-4 border-[#2436F5] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-heading font-bold text-[#5B6079]">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-[#FFFFFF] p-8 rounded-[24px] border-2 border-[#0E1330] text-center space-y-2">
          <p className="text-sm font-heading font-bold text-[#0E1330]">No orders found</p>
          <p className="text-xs font-sans text-[#5B6079]">
            There are currently no orders in the "{activeTab}" section.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block bg-[#FFFFFF] rounded-[24px] border-2 border-[#0E1330] shadow-[4px_4px_0px_#0E1330] overflow-hidden">
            <table className="w-full text-left text-xs font-sans border-collapse">
              <thead>
                <tr className="bg-[#F7F8FC] border-b-2 border-[#0E1330] font-heading font-extrabold uppercase text-[11px]">
                  <th className="p-3.5">Order No</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">District</th>
                  <th className="p-3.5">Items</th>
                  <th className="p-3.5">Total</th>
                  <th className="p-3.5">Payment</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-[#0E1330]/10">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-[#F7F8FC] transition-colors">
                    <td className="p-3.5 font-mono font-bold text-[#0E1330]">
                      {ord.orderNo || ord.id}
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-[#0E1330]">{ord.customer?.name || 'N/A'}</div>
                      <div className="text-[10px] text-[#5B6079] font-mono">{ord.customer?.phone || ''}</div>
                    </td>
                    <td className="p-3.5 font-semibold text-[#0E1330]">
                      {ord.customer?.district || 'N/A'}
                    </td>
                    <td className="p-3.5 font-bold text-[#0E1330]">
                      {ord.items?.length || 0} items
                    </td>
                    <td className="p-3.5 font-extrabold text-[#0E1330]">
                      {formatBDT(ord.total || 0)}
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold uppercase text-[10px] text-[#0E1330] block">
                        {ord.payment?.method || 'cod'}
                      </span>
                      <span
                        className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border border-[#0E1330] inline-block mt-0.5 ${
                          ord.payment?.status === 'verified'
                            ? 'bg-[#0F9D6B] text-white'
                            : ord.payment?.status === 'failed'
                            ? 'bg-rose-500 text-white'
                            : 'bg-[#FFC933] text-[#0E1330]'
                        }`}
                      >
                        {ord.payment?.status || 'pending'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-heading font-extrabold uppercase border border-[#0E1330] ${
                          ord.status === 'delivered'
                            ? 'bg-[#0F9D6B] text-white'
                            : ord.status === 'shipped'
                            ? 'bg-[#2436F5] text-white'
                            : ord.status === 'processing'
                            ? 'bg-[#FFC933] text-[#0E1330]'
                            : ord.status === 'cancelled'
                            ? 'bg-rose-500 text-white'
                            : ord.status === 'returned'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-[#0E1330]'
                        }`}
                      >
                        {ord.status || 'pending'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleSelectOrder(ord)}
                        className="px-3 py-1.5 bg-[#FFFFFF] border-2 border-[#0E1330] rounded-xl font-heading font-bold text-xs hover:bg-[#FFC933] transition-all cursor-pointer shadow-[2px_2px_0px_#0E1330]"
                      >
                        View & Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3">
            {orders.map((ord) => (
              <div
                key={ord.id}
                onClick={() => handleSelectOrder(ord)}
                className="bg-[#FFFFFF] p-4 rounded-[20px] border-2 border-[#0E1330] shadow-[3px_3px_0px_#0E1330] space-y-3 cursor-pointer hover:bg-[#F7F8FC]"
              >
                <div className="flex items-center justify-between border-b-2 border-[#0E1330]/10 pb-2">
                  <span className="font-mono font-extrabold text-xs text-[#0E1330]">
                    {ord.orderNo || ord.id}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-heading font-extrabold uppercase border border-[#0E1330] ${
                      ord.status === 'delivered'
                        ? 'bg-[#0F9D6B] text-white'
                        : ord.status === 'shipped'
                        ? 'bg-[#2436F5] text-white'
                        : ord.status === 'processing'
                        ? 'bg-[#FFC933] text-[#0E1330]'
                        : ord.status === 'cancelled'
                        ? 'bg-rose-500 text-white'
                        : ord.status === 'returned'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-[#0E1330]'
                    }`}
                  >
                    {ord.status || 'pending'}
                  </span>
                </div>

                <div className="flex justify-between items-start text-xs font-sans">
                  <div>
                    <p className="font-bold text-[#0E1330]">{ord.customer?.name || 'N/A'}</p>
                    <p className="text-[10px] text-[#5B6079] font-mono">{ord.customer?.phone || ''}</p>
                    <p className="text-[10px] text-[#5B6079]">{ord.customer?.district || ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-sm text-[#0E1330]">{formatBDT(ord.total || 0)}</p>
                    <p className="text-[10px] font-bold text-[#5B6079] uppercase">{ord.payment?.method || 'cod'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button for 'All' tab */}
          {activeTab === 'all' && lastDoc && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => fetchOrders('all', true)}
                disabled={loadingMore}
                className="px-6 py-2.5 bg-[#FFFFFF] border-2 border-[#0E1330] shadow-[3px_3px_0px_#0E1330] rounded-full text-xs font-heading font-bold text-[#0E1330] hover:bg-[#FFC933] transition-all cursor-pointer"
              >
                {loadingMore ? 'Loading...' : 'Load more orders'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Stock Shortage Confirmation Modal */}
      {shortageInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0E1330]/50 backdrop-blur-xs">
          <div className="bg-[#FFFFFF] p-6 rounded-[24px] border-2 border-[#0E1330] shadow-[4px_4px_0px_#0E1330] max-w-md w-full space-y-4">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-heading font-extrabold text-[#0E1330]">Stock shortage warning</h3>
            </div>
            <p className="text-xs font-sans text-[#5B6079]">
              The following item(s) in this order have insufficient product inventory:
            </p>
            <div className="space-y-2 bg-amber-50 p-3 rounded-xl border-2 border-amber-300">
              {shortageInfo.shortItems.map((item, idx) => (
                <div key={idx} className="text-xs font-sans flex justify-between">
                  <span className="font-bold text-[#0E1330]">{item.name}</span>
                  <span className="text-rose-600 font-mono">
                    Req: {item.requested} | Stock: {item.available}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShortageInfo(null)}
                className="px-4 py-2 border-2 border-[#0E1330] rounded-xl text-xs font-bold bg-[#FFFFFF]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleTransitionStatus('processing', 'Admin forced process despite stock shortage', true)}
                className="px-4 py-2 border-2 border-[#0E1330] rounded-xl text-xs font-bold bg-[#FFC933] text-[#0E1330] shadow-[2px_2px_0px_#0E1330]"
              >
                Process anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal / Drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0E1330]/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#FFFFFF] rounded-[24px] max-w-3xl w-full p-5 sm:p-7 border-2 border-[#0E1330] shadow-[4px_4px_0px_#0E1330] relative text-[#0E1330] my-auto max-h-[92vh] overflow-y-auto space-y-6">

            {/* Header / Invoice print element */}
            <div className="flex items-center justify-between pb-4 border-b-2 border-[#0E1330]">
              <div>
                <span className="text-[10px] font-heading font-extrabold text-[#5B6079] uppercase tracking-wider block">
                  Order Management
                </span>
                <h2 className="text-xl font-mono font-extrabold text-[#0E1330]">
                  {selectedOrder.orderNo || selectedOrder.id}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintInvoice}
                  className="px-3 py-1.5 bg-[#FFFFFF] border-2 border-[#0E1330] rounded-xl text-xs font-heading font-bold text-[#0E1330] hover:bg-[#FFC933] flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_#0E1330]"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Invoice</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 border-2 border-[#0E1330] rounded-xl bg-[#FFFFFF] text-[#0E1330] hover:bg-[#F7F8FC]"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Invoice Container View (CSS print targets this) */}
            <div id="printable-invoice" className="space-y-6">
              {/* Order Status Action Flow Buttons */}
              <div className="bg-[#F7F8FC] p-4 rounded-[20px] border-2 border-[#0E1330] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-heading font-extrabold uppercase tracking-wider text-[#0E1330]">
                    Current Status: <strong className="uppercase font-mono text-[#2436F5]">{selectedOrder.status || 'pending'}</strong>
                  </span>
                  <span className="text-[10px] font-sans text-[#5B6079]">
                    Stock Deducted: {selectedOrder.stockDeducted ? 'YES' : 'NO'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedOrder.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleTransitionStatus('processing')}
                        className="px-4 py-2 bg-[#FFC933] text-[#0E1330] border-2 border-[#0E1330] shadow-[2px_2px_0px_#0E1330] font-heading font-extrabold text-xs uppercase rounded-xl hover:bg-[#f0ba28] cursor-pointer"
                      >
                        Start Processing
                      </button>
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handlePromptTransition('cancelled')}
                        className="px-4 py-2 bg-rose-500 text-white border-2 border-[#0E1330] shadow-[2px_2px_0px_#0E1330] font-heading font-extrabold text-xs uppercase rounded-xl hover:bg-rose-600 cursor-pointer"
                      >
                        Cancel Order
                      </button>
                    </>
                  )}

                  {selectedOrder.status === 'processing' && (
                    <>
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleTransitionStatus('shipped')}
                        className="px-4 py-2 bg-[#2436F5] text-white border-2 border-[#0E1330] shadow-[2px_2px_0px_#0E1330] font-heading font-extrabold text-xs uppercase rounded-xl hover:bg-[#0E1330] cursor-pointer"
                      >
                        Mark Shipped
                      </button>
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handlePromptTransition('cancelled')}
                        className="px-4 py-2 bg-rose-500 text-white border-2 border-[#0E1330] shadow-[2px_2px_0px_#0E1330] font-heading font-extrabold text-xs uppercase rounded-xl hover:bg-rose-600 cursor-pointer"
                      >
                        Cancel Order
                      </button>
                    </>
                  )}

                  {selectedOrder.status === 'shipped' && (
                    <>
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleTransitionStatus('delivered')}
                        className="px-4 py-2 bg-[#0F9D6B] text-white border-2 border-[#0E1330] shadow-[2px_2px_0px_#0E1330] font-heading font-extrabold text-xs uppercase rounded-xl hover:bg-[#0b7a53] cursor-pointer"
                      >
                        Mark Delivered
                      </button>
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handlePromptTransition('returned')}
                        className="px-4 py-2 bg-purple-600 text-white border-2 border-[#0E1330] shadow-[2px_2px_0px_#0E1330] font-heading font-extrabold text-xs uppercase rounded-xl hover:bg-purple-700 cursor-pointer"
                      >
                        Mark Returned
                      </button>
                    </>
                  )}

                  {selectedOrder.status === 'delivered' && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handlePromptTransition('returned')}
                      className="px-4 py-2 bg-purple-600 text-white border-2 border-[#0E1330] shadow-[2px_2px_0px_#0E1330] font-heading font-extrabold text-xs uppercase rounded-xl hover:bg-purple-700 cursor-pointer"
                    >
                      Mark Returned
                    </button>
                  )}
                </div>
              </div>

              {/* Customer & Delivery Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#F7F8FC] p-4 rounded-[20px] border-2 border-[#0E1330] space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-heading font-extrabold uppercase text-[#0E1330] flex items-center gap-1.5">
                      <User className="w-4 h-4 text-[#2436F5]" /> Customer Details
                    </h3>
                    <a
                      href={getWhatsAppUrl(selectedOrder.customer?.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#25D366] text-[#0E1330] border border-[#0E1330] rounded-lg text-[10px] font-heading font-extrabold"
                    >
                      <MessageCircle className="w-3 h-3" /> WhatsApp
                    </a>
                  </div>

                  <div className="text-xs font-sans space-y-1">
                    <p className="font-bold text-[#0E1330]">{selectedOrder.customer?.name || 'N/A'}</p>
                    <p className="font-mono text-[#0E1330]">{selectedOrder.customer?.phone || 'N/A'}</p>
                    <p className="text-[#5B6079]">{selectedOrder.customer?.district || 'N/A'}</p>
                  </div>
                </div>

                <div className="bg-[#F7F8FC] p-4 rounded-[20px] border-2 border-[#0E1330] space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-heading font-extrabold uppercase text-[#0E1330] flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#2436F5]" /> Shipping Address
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleCopyAddress(selectedOrder.customer)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#FFFFFF] border border-[#0E1330] rounded-lg text-[10px] font-heading font-extrabold hover:bg-[#FFC933] cursor-pointer"
                    >
                      {copiedAddress ? <Check className="w-3 h-3 text-[#0F9D6B]" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedAddress ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <p className="text-xs font-sans text-[#0E1330]">
                    {selectedOrder.customer?.address || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Items List */}
              <div className="bg-[#F7F8FC] p-4 rounded-[20px] border-2 border-[#0E1330] space-y-3">
                <h3 className="text-xs font-heading font-extrabold uppercase text-[#0E1330]">
                  Ordered Items ({selectedOrder.items?.length || 0})
                </h3>

                <div className="divide-y border-t border-[#0E1330]/20 pt-2">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between gap-3 text-xs font-sans">
                      <div className="flex items-center gap-3">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-10 h-10 rounded-lg border border-[#0E1330] object-cover bg-white"
                          />
                        )}
                        <div>
                          <p className="font-bold text-[#0E1330]">{item.name}</p>
                          <span className="text-[10px] font-mono text-[#5B6079]">
                            Size: {item.size || 'Standard'} | Qty: {item.qty || 1}
                          </span>
                        </div>
                      </div>
                      <span className="font-extrabold text-[#0E1330]">
                        {formatBDT((item.price || 0) * (item.qty || 1))}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t-2 border-[#0E1330] pt-2 space-y-1 text-xs font-sans">
                  <div className="flex justify-between text-[#5B6079]">
                    <span>Subtotal</span>
                    <span>{formatBDT(selectedOrder.subtotal || 0)}</span>
                  </div>
                  <div className="flex justify-between text-[#5B6079]">
                    <span>Delivery Charge</span>
                    <span>{formatBDT(selectedOrder.deliveryCharge || 0)}</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-sm text-[#0E1330] pt-1 border-t border-[#0E1330]/20">
                    <span>Grand Total</span>
                    <span>{formatBDT(selectedOrder.total || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Verification Info */}
              <div className="bg-[#F7F8FC] p-4 rounded-[20px] border-2 border-[#0E1330] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-heading font-extrabold uppercase text-[#0E1330] flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-[#2436F5]" /> Payment Verification
                  </h3>
                  <span className="text-xs font-heading font-extrabold uppercase px-2.5 py-0.5 rounded border border-[#0E1330] bg-[#FFC933] text-[#0E1330]">
                    Status: {selectedOrder.payment?.status || 'pending'}
                  </span>
                </div>

                <div className="text-xs font-sans grid grid-cols-3 gap-2 bg-white p-3 rounded-xl border border-[#0E1330]">
                  <div>
                    <span className="text-[10px] font-heading font-bold text-[#5B6079] uppercase block">
                      Method
                    </span>
                    <span className="font-extrabold uppercase text-[#0E1330]">
                      {selectedOrder.payment?.method || 'cod'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-heading font-bold text-[#5B6079] uppercase block">
                      Sender Number
                    </span>
                    <span className="font-mono font-bold text-[#0E1330]">
                      {selectedOrder.payment?.senderNumber || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-heading font-bold text-[#5B6079] uppercase block">
                      TrxID
                    </span>
                    <span className="font-mono font-bold text-[#0E1330] uppercase">
                      {selectedOrder.payment?.trxId || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleUpdatePaymentStatus('verified')}
                    className="px-3 py-1.5 bg-[#0F9D6B] text-white border-2 border-[#0E1330] rounded-xl text-xs font-heading font-bold cursor-pointer"
                  >
                    Mark Verified
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleUpdatePaymentStatus('failed')}
                    className="px-3 py-1.5 bg-rose-500 text-white border-2 border-[#0E1330] rounded-xl text-xs font-heading font-bold cursor-pointer"
                  >
                    Mark Failed
                  </button>
                </div>
              </div>

              {/* Courier & Internal Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Courier fields */}
                <div className="bg-[#F7F8FC] p-4 rounded-[20px] border-2 border-[#0E1330] space-y-2">
                  <h3 className="text-xs font-heading font-extrabold uppercase text-[#0E1330]">
                    Courier & Tracking
                  </h3>
                  <div>
                    <label className="block text-[10px] font-heading font-bold text-[#5B6079] mb-0.5">
                      Courier Name
                    </label>
                    <input
                      type="text"
                      value={courierName}
                      onChange={(e) => setCourierName(e.target.value)}
                      placeholder="e.g. Pathao / Steadfast"
                      className="w-full px-2.5 py-1.5 bg-white border-2 border-[#0E1330] rounded-xl text-xs font-bold text-[#0E1330]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-heading font-bold text-[#5B6079] mb-0.5">
                      Tracking ID
                    </label>
                    <input
                      type="text"
                      value={courierTrackingId}
                      onChange={(e) => setCourierTrackingId(e.target.value)}
                      placeholder="e.g. CID-998822"
                      className="w-full px-2.5 py-1.5 bg-white border-2 border-[#0E1330] rounded-xl text-xs font-bold text-[#0E1330]"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleSaveCourier}
                    className="px-3 py-1.5 bg-[#0E1330] text-white border-2 border-[#0E1330] rounded-xl text-xs font-heading font-bold cursor-pointer"
                  >
                    Save Courier Info
                  </button>
                </div>

                {/* Internal Note */}
                <div className="bg-[#F7F8FC] p-4 rounded-[20px] border-2 border-[#0E1330] space-y-2">
                  <h3 className="text-xs font-heading font-extrabold uppercase text-[#0E1330]">
                    Internal Staff Note
                  </h3>
                  <textarea
                    rows={3}
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
                    placeholder="Staff notes (e.g. Call customer before 3 PM)"
                    className="w-full p-2 bg-white border-2 border-[#0E1330] rounded-xl text-xs font-sans text-[#0E1330]"
                  />
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleSaveNote}
                    className="px-3 py-1.5 bg-[#2436F5] text-white border-2 border-[#0E1330] rounded-xl text-xs font-heading font-bold cursor-pointer"
                  >
                    Save Note
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
