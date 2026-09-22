import React, { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  getDoc,
  setDoc,
  doc,
  runTransaction,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { logAction } from '../lib/audit';
import { formatBDT } from '../utils/currency';
import { BKASH_NUMBER, NAGAD_NUMBER } from '../config';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  Filter,
  RefreshCw,
  RotateCcw,
  Settings,
  ArrowUpRight,
  UserCheck,
  Calendar,
  Save,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

export default function PaymentsManager({ currentHash, user }) {
  // Hash route parsing
  const getTabFromHash = () => {
    if (currentHash?.includes('/successful')) return 'successful';
    if (currentHash?.includes('/failed')) return 'failed';
    if (currentHash?.includes('/refunds')) return 'refunds';
    if (currentHash?.includes('/settings')) return 'settings';
    return 'transactions';
  };

  const [activeTab, setActiveTab] = useState(getTabFromHash);
  const [paymentsList, setPaymentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Refund Modal State
  const [refundTargetPayment, setRefundTargetPayment] = useState(null);
  const [refundAmount, setRefundAmount] = useState(0);
  const [refundReason, setRefundReason] = useState('');
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);

  // Override Action Modal State
  const [overrideTargetPayment, setOverrideTargetPayment] = useState(null);
  const [isProcessingOverride, setIsProcessingOverride] = useState(false);

  // Payment Settings Form State
  const [settingsData, setSettingsData] = useState({
    bkashNumber: BKASH_NUMBER || '01712345678',
    nagadNumber: NAGAD_NUMBER || '01812345678',
    sslcommerzEnabled: false,
    aamarpayEnabled: false,
    codEnabled: true,
    codInstructions: 'Pay cash to delivery rider upon receiving parcel.',
    checkoutInstructions: 'Send exact payment to merchant number and enter TrxID below.'
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    setActiveTab(getTabFromHash());
  }, [currentHash]);

  useEffect(() => {
    if (activeTab === 'settings') {
      fetchPaymentSettings();
    } else {
      fetchPaymentsAndOrders();
    }
  }, [activeTab]);

  const changeTab = (tabKey) => {
    setActiveTab(tabKey);
    setErrorMessage('');
    setSuccessMessage('');
    window.location.hash = `#/admin/payments/${tabKey}`;
  };

  // Fetch payments and sync with orders collection
  const fetchPaymentsAndOrders = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      // 1. Fetch payments collection
      const pmSnap = await getDocs(collection(db, 'payments'));
      const fetchedPaymentsMap = new Map();
      pmSnap.forEach((dSnap) => {
        fetchedPaymentsMap.set(dSnap.id, { id: dSnap.id, ...dSnap.data() });
      });

      // 2. Fetch orders collection to bridge orders into payments view
      const ordSnap = await getDocs(collection(db, 'orders'));
      const combinedPayments = [...fetchedPaymentsMap.values()];

      ordSnap.forEach((oSnap) => {
        const ord = oSnap.data();
        const orderId = oSnap.id;
        const existsInPayments = combinedPayments.some((p) => p.orderId === orderId);

        if (!existsInPayments) {
          // Construct bridged payment object from order doc
          const payObj = {
            id: `pay_${orderId}`,
            orderId,
            customerUid: ord.uid || null,
            customerName: ord.customer?.name || 'Customer',
            customerPhone: ord.customer?.phone || '',
            method: ord.payment?.method || 'cod',
            trxId: ord.payment?.trxId || null,
            amount: typeof ord.total === 'number' ? ord.total : (ord.pricing?.total ?? 0),
            status: ord.payment?.status || 'pending',
            submittedAt: ord.createdAt || null,
            verifiedAt: null,
            verifiedBy: null,
            note: ord.note || ''
          };
          combinedPayments.push(payObj);
        }
      });

      // Sort newest first
      combinedPayments.sort((a, b) => {
        const tA = a.submittedAt?.seconds || 0;
        const tB = b.submittedAt?.seconds || 0;
        return tB - tA;
      });

      setPaymentsList(combinedPayments);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setErrorMessage(`Failed to load payments: ${err?.message || 'Permission or network error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Payment Settings
  const fetchPaymentSettings = async () => {
    setSettingsLoading(true);
    try {
      const setRef = doc(db, 'settings', 'payment');
      const snap = await getDoc(setRef);
      if (snap.exists()) {
        setSettingsData((prev) => ({ ...prev, ...snap.data() }));
      }
    } catch (err) {
      console.warn('Payment settings fetch error (using defaults):', err);
    } finally {
      setSettingsLoading(false);
    }
  };

  // Save Payment Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const setRef = doc(db, 'settings', 'payment');
      await setDoc(
        setRef,
        {
          ...settingsData,
          updatedAt: serverTimestamp(),
          updatedBy: user?.email || 'admin'
        },
        { merge: true }
      );

      await logAction('UPDATE_PAYMENT_SETTINGS', 'payment', settingsData);

      setSuccessMessage('Payment gateway and MFS settings updated successfully.');
    } catch (err) {
      console.error('Error saving payment settings:', err);
      setErrorMessage(`Failed to save settings: ${err?.message || 'Error occurred'}`);
    } finally {
      setSavingSettings(false);
    }
  };

  // Verify Payment Action (Firestore Transaction)
  const handleVerifyPayment = async (payment) => {
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await runTransaction(db, async (transaction) => {
        const payRef = doc(db, 'payments', payment.id);
        const orderRef = doc(db, 'orders', payment.orderId);

        const paySnap = await transaction.get(payRef);
        const orderSnap = await transaction.get(orderRef);

        const updateData = {
          orderId: payment.orderId,
          customerName: payment.customerName,
          customerPhone: payment.customerPhone,
          method: payment.method,
          trxId: payment.trxId || null,
          amount: payment.amount,
          status: 'verified',
          verifiedAt: serverTimestamp(),
          verifiedBy: user?.uid || '',
          verifiedByEmail: user?.email || 'admin',
          updatedAt: serverTimestamp()
        };

        if (paySnap.exists()) {
          transaction.update(payRef, updateData);
        } else {
          transaction.set(payRef, {
            ...updateData,
            submittedAt: payment.submittedAt || serverTimestamp()
          });
        }

        if (orderSnap.exists()) {
          transaction.update(orderRef, {
            'payment.status': 'verified',
            updatedAt: serverTimestamp()
          });
        }
      });

      await logAction('VERIFY_PAYMENT', payment.id, {
        orderId: payment.orderId,
        amount: payment.amount,
        method: payment.method
      });

      setSuccessMessage(`Payment for Order #${payment.orderId.slice(0, 8)} verified successfully.`);
      await fetchPaymentsAndOrders();
    } catch (err) {
      console.error('Error verifying payment:', err);
      setErrorMessage(`Verification failed: ${err?.message || 'Transaction error'}`);
    }
  };

  // Mark Payment Failed Action (Firestore Transaction)
  const handleMarkPaymentFailed = async (payment) => {
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await runTransaction(db, async (transaction) => {
        const payRef = doc(db, 'payments', payment.id);
        const orderRef = doc(db, 'orders', payment.orderId);

        const paySnap = await transaction.get(payRef);
        const orderSnap = await transaction.get(orderRef);

        const updateData = {
          orderId: payment.orderId,
          customerName: payment.customerName,
          customerPhone: payment.customerPhone,
          method: payment.method,
          trxId: payment.trxId || null,
          amount: payment.amount,
          status: 'failed',
          verifiedAt: serverTimestamp(),
          verifiedBy: user?.uid || '',
          verifiedByEmail: user?.email || 'admin',
          updatedAt: serverTimestamp()
        };

        if (paySnap.exists()) {
          transaction.update(payRef, updateData);
        } else {
          transaction.set(payRef, {
            ...updateData,
            submittedAt: payment.submittedAt || serverTimestamp()
          });
        }

        if (orderSnap.exists()) {
          transaction.update(orderRef, {
            'payment.status': 'failed',
            updatedAt: serverTimestamp()
          });
        }
      });

      await logAction('MARK_PAYMENT_FAILED', payment.id, {
        orderId: payment.orderId
      });

      setSuccessMessage(`Payment for Order #${payment.orderId.slice(0, 8)} marked as failed.`);
      await fetchPaymentsAndOrders();
    } catch (err) {
      console.error('Error marking payment failed:', err);
      setErrorMessage(`Failed to update payment status: ${err?.message || 'Error occurred'}`);
    }
  };

  // Override Action for Failed Payments (Confirm Mark Verified)
  const handleConfirmOverride = async () => {
    if (!overrideTargetPayment) return;
    setIsProcessingOverride(true);
    await handleVerifyPayment(overrideTargetPayment);
    setIsProcessingOverride(false);
    setOverrideTargetPayment(null);
  };

  // Open Refund Modal
  const handleOpenRefundModal = (payment) => {
    setRefundTargetPayment(payment);
    setRefundAmount(payment.amount || 0);
    setRefundReason('');
  };

  // Execute Refund Transaction
  const handleSubmitRefund = async (e) => {
    e.preventDefault();
    if (!refundTargetPayment) return;
    const refAmt = parseFloat(refundAmount);
    if (isNaN(refAmt) || refAmt <= 0) {
      setErrorMessage('Refund amount must be greater than 0.');
      return;
    }

    setIsProcessingRefund(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await runTransaction(db, async (transaction) => {
        const payRef = doc(db, 'payments', refundTargetPayment.id);
        const orderRef = doc(db, 'orders', refundTargetPayment.orderId);

        const paySnap = await transaction.get(payRef);
        const orderSnap = await transaction.get(orderRef);

        const updateData = {
          status: 'refunded',
          refundAmount: refAmt,
          refundReason: refundReason.trim() || 'Customer refund',
          refundedAt: serverTimestamp(),
          refundedBy: user?.uid || '',
          refundedByEmail: user?.email || 'admin',
          updatedAt: serverTimestamp()
        };

        if (paySnap.exists()) {
          transaction.update(payRef, updateData);
        } else {
          transaction.set(payRef, {
            orderId: refundTargetPayment.orderId,
            customerName: refundTargetPayment.customerName,
            customerPhone: refundTargetPayment.customerPhone,
            method: refundTargetPayment.method,
            trxId: refundTargetPayment.trxId || null,
            amount: refundTargetPayment.amount,
            submittedAt: refundTargetPayment.submittedAt || serverTimestamp(),
            ...updateData
          });
        }

        if (orderSnap.exists()) {
          transaction.update(orderRef, {
            'payment.status': 'refunded',
            updatedAt: serverTimestamp()
          });
        }
      });

      await logAction('REFUND_PAYMENT', refundTargetPayment.id, {
        orderId: refundTargetPayment.orderId,
        refundAmount: refAmt,
        reason: refundReason
      });

      setSuccessMessage(
        `Refund of ${formatBDT(refAmt)} processed for Order #${refundTargetPayment.orderId.slice(0, 8)}.`
      );
      setRefundTargetPayment(null);
      await fetchPaymentsAndOrders();
    } catch (err) {
      console.error('Error processing refund:', err);
      setErrorMessage(`Refund failed: ${err?.message || 'Transaction error'}`);
    } finally {
      setIsProcessingRefund(false);
    }
  };

  // Filter Payments
  const filteredPayments = paymentsList.filter((pm) => {
    // Tab specific filter
    if (activeTab === 'successful' && pm.status !== 'verified') return false;
    if (activeTab === 'failed' && pm.status !== 'failed') return false;
    if (activeTab === 'refunds' && pm.status !== 'refunded') return false;

    // Sub-filters
    const matchesStatus =
      activeTab !== 'transactions' || statusFilter === 'all' || pm.status === statusFilter;
    const matchesMethod = methodFilter === 'all' || pm.method === methodFilter;

    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      (pm.trxId || '').toLowerCase().includes(term) ||
      (pm.customerName || '').toLowerCase().includes(term) ||
      (pm.customerPhone || '').toLowerCase().includes(term) ||
      (pm.orderId || '').toLowerCase().includes(term);

    return matchesStatus && matchesMethod && matchesSearch;
  });

  // Method Badge Helper
  const getMethodBadge = (method) => {
    const m = (method || '').toLowerCase();
    if (m === 'bkash') {
      return (
        <span className="px-2.5 py-0.5 rounded-lg border text-[10px] font-heading font-extrabold uppercase bg-[#E2136E] text-white border-[#0E1330]">
          bKash
        </span>
      );
    }
    if (m === 'nagad') {
      return (
        <span className="px-2.5 py-0.5 rounded-lg border text-[10px] font-heading font-extrabold uppercase bg-[#F7921E] text-white border-[#0E1330]">
          Nagad
        </span>
      );
    }
    if (m === 'sslcommerz' || m === 'aamarpay') {
      return (
        <span className="px-2.5 py-0.5 rounded-lg border text-[10px] font-heading font-extrabold uppercase bg-[#2436F5] text-white border-[#0E1330]">
          {m === 'sslcommerz' ? 'SSLCommerz' : 'Aamarpay'}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-lg border text-[10px] font-heading font-extrabold uppercase bg-[#5B6079] text-white border-[#0E1330]">
        COD
      </span>
    );
  };

  // Status Badge Helper
  const getStatusBadge = (status) => {
    const st = (status || 'pending').toLowerCase();
    if (st === 'verified') {
      return (
        <span className="px-2.5 py-1 rounded-lg border text-[10px] font-heading font-extrabold uppercase bg-emerald-100 text-emerald-800 border-emerald-600">
          Verified
        </span>
      );
    }
    if (st === 'failed') {
      return (
        <span className="px-2.5 py-1 rounded-lg border text-[10px] font-heading font-extrabold uppercase bg-rose-100 text-rose-800 border-rose-600">
          Failed
        </span>
      );
    }
    if (st === 'refunded') {
      return (
        <span className="px-2.5 py-1 rounded-lg border text-[10px] font-heading font-extrabold uppercase bg-gray-200 text-gray-800 border-gray-500">
          Refunded
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-lg border text-[10px] font-heading font-extrabold uppercase bg-amber-100 text-amber-900 border-[#0E1330]">
        Pending
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FFFFFF] p-5 rounded-[24px] border-2 border-[#0E1330] shadow-[4px_4px_0px_#0E1330]">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading font-extrabold uppercase text-[#0E1330] flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-[#2436F5]" /> Payment Operations
          </h1>
          <p className="text-xs font-sans text-[#5B6079] mt-0.5">
            Verify MFS transaction IDs (bKash/Nagad), confirm Cash on Delivery, handle refunds, and manage gateway settings.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (activeTab === 'settings') fetchPaymentSettings();
            else fetchPaymentsAndOrders();
          }}
          className="p-2.5 bg-[#F7F8FC] hover:bg-[#FFC933] text-[#0E1330] border-2 border-[#0E1330] rounded-xl font-heading font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading || settingsLoading ? 'animate-spin' : ''}`} />
          <span>Reload</span>
        </button>
      </div>

      {/* Tabs Sub-Navigation */}
      <div className="bg-[#FFFFFF] p-2 rounded-[20px] border-2 border-[#0E1330] shadow-[3px_3px_0px_#0E1330] flex flex-wrap gap-2 text-xs font-heading font-extrabold">
        <button
          type="button"
          onClick={() => changeTab('transactions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all cursor-pointer ${
            activeTab === 'transactions'
              ? 'bg-[#2436F5] text-[#FFFFFF] border-[#0E1330] shadow-[2px_2px_0px_#0E1330]'
              : 'bg-transparent text-[#0E1330] border-transparent hover:bg-[#F7F8FC] hover:border-[#0E1330]'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Transactions ({paymentsList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => changeTab('successful')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all cursor-pointer ${
            activeTab === 'successful'
              ? 'bg-[#2436F5] text-[#FFFFFF] border-[#0E1330] shadow-[2px_2px_0px_#0E1330]'
              : 'bg-transparent text-[#0E1330] border-transparent hover:bg-[#F7F8FC] hover:border-[#0E1330]'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Successful ({paymentsList.filter((p) => p.status === 'verified').length})</span>
        </button>

        <button
          type="button"
          onClick={() => changeTab('failed')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all cursor-pointer ${
            activeTab === 'failed'
              ? 'bg-[#2436F5] text-[#FFFFFF] border-[#0E1330] shadow-[2px_2px_0px_#0E1330]'
              : 'bg-transparent text-[#0E1330] border-transparent hover:bg-[#F7F8FC] hover:border-[#0E1330]'
          }`}
        >
          <AlertCircle className="w-4 h-4 text-rose-500" />
          <span>Failed ({paymentsList.filter((p) => p.status === 'failed').length})</span>
        </button>

        <button
          type="button"
          onClick={() => changeTab('refunds')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all cursor-pointer ${
            activeTab === 'refunds'
              ? 'bg-[#2436F5] text-[#FFFFFF] border-[#0E1330] shadow-[2px_2px_0px_#0E1330]'
              : 'bg-transparent text-[#0E1330] border-transparent hover:bg-[#F7F8FC] hover:border-[#0E1330]'
          }`}
        >
          <RotateCcw className="w-4 h-4 text-[#FFC933]" />
          <span>Refunds ({paymentsList.filter((p) => p.status === 'refunded').length})</span>
        </button>

        <button
          type="button"
          onClick={() => changeTab('settings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-[#2436F5] text-[#FFFFFF] border-[#0E1330] shadow-[2px_2px_0px_#0E1330]'
              : 'bg-transparent text-[#0E1330] border-transparent hover:bg-[#F7F8FC] hover:border-[#0E1330]'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Payment Settings</span>
        </button>
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

      {/* VIEW 1: PAYMENT SETTINGS TAB */}
      {activeTab === 'settings' ? (
        <div className="max-w-2xl mx-auto bg-[#FFFFFF] p-6 rounded-[24px] border-2 border-[#0E1330] shadow-[4px_4px_0px_#0E1330] space-y-6">
          <div className="flex items-center gap-3 border-b-2 border-[#0E1330] pb-4">
            <div className="w-10 h-10 bg-[#FFC933] border-2 border-[#0E1330] rounded-2xl flex items-center justify-center text-[#0E1330] shadow-[2px_2px_0px_#0E1330]">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-extrabold text-[#0E1330]">
                Payment Settings & MFS Merchants
              </h2>
              <p className="text-xs font-sans text-[#5B6079]">
                Manage merchant numbers for bKash/Nagad and gateway toggles.
              </p>
            </div>
          </div>

          {settingsLoading ? (
            <div className="p-8 text-center space-y-2">
              <div className="w-6 h-6 border-3 border-[#2436F5] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-[#5B6079]">Loading settings...</p>
            </div>
          ) : (
            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs font-sans">
              {/* bKash Number */}
              <div className="space-y-1">
                <label className="block font-heading font-extrabold text-[#0E1330] uppercase">
                  bKash Merchant / Personal Send-Money Number
                </label>
                <input
                  type="text"
                  value={settingsData.bkashNumber}
                  onChange={(e) => setSettingsData({ ...settingsData, bkashNumber: e.target.value })}
                  className="w-full p-3 bg-[#F7F8FC] border-2 border-[#0E1330] rounded-xl font-bold text-[#0E1330] focus:outline-none"
                />
              </div>

              {/* Nagad Number */}
              <div className="space-y-1">
                <label className="block font-heading font-extrabold text-[#0E1330] uppercase">
                  Nagad Merchant / Personal Send-Money Number
                </label>
                <input
                  type="text"
                  value={settingsData.nagadNumber}
                  onChange={(e) => setSettingsData({ ...settingsData, nagadNumber: e.target.value })}
                  className="w-full p-3 bg-[#F7F8FC] border-2 border-[#0E1330] rounded-xl font-bold text-[#0E1330] focus:outline-none"
                />
              </div>

              {/* Toggles */}
              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between p-3 bg-[#F7F8FC] rounded-xl border-2 border-[#0E1330]">
                  <div>
                    <p className="font-heading font-extrabold text-[#0E1330]">Cash on Delivery (COD)</p>
                    <p className="text-[10px] text-[#5B6079]">Allow customers to pay cash upon parcel delivery</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settingsData.codEnabled}
                    onChange={(e) => setSettingsData({ ...settingsData, codEnabled: e.target.checked })}
                    className="w-5 h-5 accent-[#2436F5] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-[#F7F8FC] rounded-xl border-2 border-[#0E1330]">
                  <div>
                    <p className="font-heading font-extrabold text-[#0E1330]">SSLCommerz Payment Gateway</p>
                    <p className="text-[10px] text-[#5B6079]">Enable card/banking gateway (API credentials pending)</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settingsData.sslcommerzEnabled}
                    onChange={(e) => setSettingsData({ ...settingsData, sslcommerzEnabled: e.target.checked })}
                    className="w-5 h-5 accent-[#2436F5] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-[#F7F8FC] rounded-xl border-2 border-[#0E1330]">
                  <div>
                    <p className="font-heading font-extrabold text-[#0E1330]">Aamarpay Payment Gateway</p>
                    <p className="text-[10px] text-[#5B6079]">Enable Aamarpay gateway (API credentials pending)</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settingsData.aamarpayEnabled}
                    onChange={(e) => setSettingsData({ ...settingsData, aamarpayEnabled: e.target.checked })}
                    className="w-5 h-5 accent-[#2436F5] cursor-pointer"
                  />
                </div>
              </div>

              {/* Checkout Instructions */}
              <div className="space-y-1">
                <label className="block font-heading font-extrabold text-[#0E1330] uppercase">
                  Checkout Customer Instructions Text
                </label>
                <textarea
                  rows={2}
                  value={settingsData.checkoutInstructions}
                  onChange={(e) => setSettingsData({ ...settingsData, checkoutInstructions: e.target.value })}
                  className="w-full p-3 bg-[#F7F8FC] border-2 border-[#0E1330] rounded-xl font-bold text-[#0E1330] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                className="w-full py-3 bg-[#2436F5] hover:bg-[#1122D0] text-[#FFFFFF] font-heading font-extrabold text-xs uppercase tracking-wider rounded-xl border-2 border-[#0E1330] shadow-[3px_3px_0px_#0E1330] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4 text-[#FFC933]" />
                <span>{savingSettings ? 'Saving Settings...' : 'Save Payment Settings'}</span>
              </button>
            </form>
          )}
        </div>
      ) : (
        /* VIEW 2: TRANSACTIONS / SUCCESSFUL / FAILED / REFUNDS TABLES */
        <div className="space-y-4">
          {/* Filters & Search Row */}
          <div className="bg-[#FFFFFF] p-4 rounded-[20px] border-2 border-[#0E1330] shadow-[3px_3px_0px_#0E1330] grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-[#5B6079] absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by TrxID, name, phone, or order ID..."
                className="w-full pl-9 pr-3 py-2 bg-[#F7F8FC] border-2 border-[#0E1330] rounded-xl text-xs font-bold text-[#0E1330] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 bg-[#F7F8FC] border-2 border-[#0E1330] rounded-xl px-3 py-1.5">
              <Filter className="w-4 h-4 text-[#5B6079] shrink-0" />
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-[#0E1330] focus:outline-none cursor-pointer"
              >
                <option value="all">All Methods</option>
                <option value="bkash">bKash</option>
                <option value="nagad">Nagad</option>
                <option value="sslcommerz">SSLCommerz</option>
                <option value="aamarpay">Aamarpay</option>
                <option value="cod">Cash on Delivery (COD)</option>
              </select>
            </div>

            {activeTab === 'transactions' && (
              <div className="flex items-center gap-2 bg-[#F7F8FC] border-2 border-[#0E1330] rounded-xl px-3 py-1.5">
                <ShieldCheck className="w-4 h-4 text-[#5B6079] shrink-0" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-[#0E1330] focus:outline-none cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
            )}
          </div>

          {/* Table Container */}
          {loading ? (
            <div className="p-12 text-center space-y-3 bg-[#FFFFFF] border-2 border-[#0E1330] rounded-[24px]">
              <div className="w-8 h-8 border-4 border-[#2436F5] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-heading font-bold text-[#5B6079]">Loading payments list...</p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="bg-[#FFFFFF] p-8 rounded-[24px] border-2 border-[#0E1330] text-center space-y-2">
              <CreditCard className="w-8 h-8 text-[#5B6079] mx-auto" />
              <p className="text-sm font-heading font-extrabold text-[#0E1330]">
                No payment transactions found matching your criteria.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setMethodFilter('all');
                  setStatusFilter('all');
                }}
                className="px-4 py-2 bg-[#2436F5] text-white rounded-xl text-xs font-bold"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="bg-[#FFFFFF] border-2 border-[#0E1330] rounded-[24px] shadow-[4px_4px_0px_#0E1330] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F7F8FC] border-b-2 border-[#0E1330] text-[11px] font-heading font-extrabold uppercase tracking-wider text-[#0E1330]">
                      <th className="p-4">Date / Time</th>
                      <th className="p-4">Order ID & Customer</th>
                      <th className="p-4">Method</th>
                      <th className="p-4">TrxID</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-[#0E1330]/10 text-xs font-sans text-[#0E1330]">
                    {filteredPayments.map((pm) => {
                      const dateStr = pm.submittedAt?.seconds
                        ? new Date(pm.submittedAt.seconds * 1000).toLocaleString()
                        : 'Recent';

                      return (
                        <tr key={pm.id} className="hover:bg-[#F7F8FC] transition-colors">
                          <td className="p-4 font-bold text-[#5B6079] flex items-center gap-1.5 whitespace-nowrap">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{dateStr}</span>
                          </td>

                          <td className="p-4">
                            <div>
                              <p className="font-mono font-bold text-[#2436F5]">#{pm.orderId.slice(0, 8)}</p>
                              <p className="font-heading font-bold text-xs text-[#0E1330]">
                                {pm.customerName || 'Customer'}
                              </p>
                              <p className="text-[10px] text-[#5B6079]">{pm.customerPhone}</p>
                            </div>
                          </td>

                          <td className="p-4">{getMethodBadge(pm.method)}</td>

                          <td className="p-4 font-mono font-bold text-xs">
                            {pm.trxId ? <span className="bg-[#F7F8FC] px-2 py-1 rounded border border-[#0E1330]/20">{pm.trxId}</span> : '—'}
                          </td>

                          <td className="p-4 font-heading font-extrabold text-sm text-[#0E1330]">
                            {formatBDT(pm.amount || 0)}
                          </td>

                          <td className="p-4">{getStatusBadge(pm.status)}</td>

                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Pending Quick Actions */}
                              {pm.status === 'pending' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleVerifyPayment(pm)}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-extrabold text-[11px] uppercase rounded-xl border-2 border-[#0E1330] shadow-[2px_2px_0px_#0E1330] cursor-pointer"
                                  >
                                    Verify
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMarkPaymentFailed(pm)}
                                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-heading font-extrabold text-[11px] uppercase rounded-xl border-2 border-[#0E1330] cursor-pointer"
                                  >
                                    Fail
                                  </button>
                                </>
                              )}

                              {/* Verified Action -> Initiate Refund */}
                              {pm.status === 'verified' && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenRefundModal(pm)}
                                  className="px-3 py-1.5 bg-[#FFC933] hover:bg-[#e6b42d] text-[#0E1330] font-heading font-extrabold text-[11px] uppercase rounded-xl border-2 border-[#0E1330] shadow-[2px_2px_0px_#0E1330] flex items-center gap-1 cursor-pointer"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" /> Refund
                                </button>
                              )}

                              {/* Failed Action -> Override to Verify */}
                              {pm.status === 'failed' && (
                                <button
                                  type="button"
                                  onClick={() => setOverrideTargetPayment(pm)}
                                  className="px-3 py-1.5 bg-[#FFFFFF] hover:bg-emerald-50 text-emerald-700 font-heading font-extrabold text-[11px] uppercase rounded-xl border-2 border-[#0E1330] cursor-pointer"
                                >
                                  Override to Verify
                                </button>
                              )}

                              {/* Refunded Info */}
                              {pm.status === 'refunded' && (
                                <span className="text-[10px] font-mono text-[#5B6079] italic">
                                  Refunded {formatBDT(pm.refundAmount || pm.amount)}
                                </span>
                              )}
                            </div>
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

      {/* INITIATE REFUND MODAL */}
      {refundTargetPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0E1330]/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#FFFFFF] rounded-[24px] max-w-md w-full p-6 border-2 border-[#0E1330] shadow-[4px_4px_0px_#0E1330] relative space-y-4 text-[#0E1330]">
            <button
              type="button"
              onClick={() => setRefundTargetPayment(null)}
              className="absolute top-4 right-4 p-1.5 rounded-xl border-2 border-[#0E1330] bg-[#FFFFFF] hover:bg-[#F7F8FC] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 border-b-2 border-[#0E1330] pb-3">
              <RotateCcw className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-heading font-extrabold uppercase text-[#0E1330]">
                Initiate Customer Refund
              </h3>
            </div>

            {/* Guidance Text based on method */}
            <div className="p-3 bg-[#F7F8FC] border-2 border-[#0E1330] rounded-xl text-xs font-sans text-[#0E1330] space-y-1">
              <p className="font-heading font-bold text-[#2436F5]">
                Method: {refundTargetPayment.method?.toUpperCase()} (Original Amount:{' '}
                {formatBDT(refundTargetPayment.amount)})
              </p>
              <p className="text-[11px] text-[#5B6079]">
                {['bkash', 'nagad', 'cod'].includes((refundTargetPayment.method || '').toLowerCase())
                  ? 'Note: bKash/Nagad/COD refunds are manual. Please transfer the funds via your merchant app outside this console, then log the reference note below.'
                  : 'Note: SSLCommerz/Aamarpay refunds may be processed through your payment gateway merchant portal. Enter the gateway reference below.'}
              </p>
            </div>

            <form onSubmit={handleSubmitRefund} className="space-y-3 text-xs font-sans">
              <div>
                <label className="block font-heading font-extrabold text-[#0E1330] mb-1">
                  Refund Amount (BDT) *
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max={refundTargetPayment.amount}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  required
                  className="w-full p-2.5 bg-[#F7F8FC] border-2 border-[#0E1330] rounded-xl font-bold text-[#0E1330] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-heading font-extrabold text-[#0E1330] mb-1">
                  Refund Reason / Reference Note *
                </label>
                <textarea
                  rows={2}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="e.g. Order cancelled by customer, MFS cash back reference #77123"
                  required
                  className="w-full p-2.5 bg-[#F7F8FC] border-2 border-[#0E1330] rounded-xl font-bold text-[#0E1330] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isProcessingRefund}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-[#0E1330] font-heading font-extrabold text-xs uppercase tracking-wider rounded-xl border-2 border-[#0E1330] shadow-[2px_2px_0px_#0E1330] disabled:opacity-50 cursor-pointer"
                >
                  {isProcessingRefund ? 'Processing...' : 'Confirm Refund'}
                </button>
                <button
                  type="button"
                  onClick={() => setRefundTargetPayment(null)}
                  className="px-4 py-2.5 bg-[#F7F8FC] hover:bg-gray-200 text-[#0E1330] font-heading font-extrabold text-xs rounded-xl border-2 border-[#0E1330]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OVERRIDE TO VERIFY CONFIRMATION DIALOG */}
      {overrideTargetPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0E1330]/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#FFFFFF] rounded-[24px] max-w-md w-full p-6 border-2 border-[#0E1330] shadow-[4px_4px_0px_#0E1330] relative space-y-4 text-[#0E1330]">
            <button
              type="button"
              onClick={() => setOverrideTargetPayment(null)}
              className="absolute top-4 right-4 p-1.5 rounded-xl border-2 border-[#0E1330] bg-[#FFFFFF] hover:bg-[#F7F8FC] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 bg-amber-100 border-2 border-[#0E1330] rounded-2xl flex items-center justify-center text-amber-700 shadow-[2px_2px_0px_#0E1330]">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-heading font-extrabold text-[#0E1330]">
                Override Failed Status
              </h3>
              <p className="text-xs font-sans text-[#5B6079] mt-1">
                Are you sure you want to override and mark this failed payment as{' '}
                <strong className="text-emerald-700">VERIFIED</strong> for Order #
                {overrideTargetPayment.orderId.slice(0, 8)} ({formatBDT(overrideTargetPayment.amount)})?
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleConfirmOverride}
                disabled={isProcessingOverride}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-[#FFFFFF] font-heading font-extrabold text-xs uppercase tracking-wider rounded-xl border-2 border-[#0E1330] shadow-[2px_2px_0px_#0E1330] disabled:opacity-50 cursor-pointer"
              >
                {isProcessingOverride ? 'Updating...' : 'Yes, Override to Verified'}
              </button>
              <button
                type="button"
                onClick={() => setOverrideTargetPayment(null)}
                className="flex-1 py-2.5 bg-[#F7F8FC] hover:bg-gray-200 text-[#0E1330] font-heading font-extrabold text-xs uppercase tracking-wider rounded-xl border-2 border-[#0E1330]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
