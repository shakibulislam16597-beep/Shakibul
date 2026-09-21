import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Header from './Header';
import BottomNav from './BottomNav';
import { Search, Package, Clock, CheckCircle2, Truck, AlertCircle, XCircle, RotateCcw } from 'lucide-react';

/**
 * TrackOrder Page - Extrovat Lifestyle
 * Route: #/track
 * Single getDoc(trackOrders/{orderNo}) - no query/list on Firestore.
 */
export default function TrackOrder({ onOpenCart }) {
  const [orderNoInput, setOrderNoInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Check initial hash for orderNo query e.g. #/track?id=EXT-250301-1234 or direct path
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('?id=')) {
      const idParam = hash.split('?id=')[1]?.split('&')[0];
      if (idParam) {
        const clean = idParam.trim().toUpperCase();
        setOrderNoInput(clean);
        fetchOrderTrack(clean);
      }
    }
  }, []);

  const fetchOrderTrack = async (orderNoToSearch) => {
    const cleanId = orderNoToSearch.trim().toUpperCase();
    if (!cleanId) return;

    setLoading(true);
    setSearched(true);
    setErrorMsg(null);
    setOrderData(null);

    if (!db) {
      setLoading(false);
      setErrorMsg('Store database is temporarily unreachable. Please check your network connection.');
      return;
    }

    try {
      const docRef = doc(db, 'trackOrders', cleanId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setOrderData(docSnap.data());
      } else {
        setOrderData(null);
      }
    } catch (err) {
      console.warn('Error fetching trackOrder:', err);
      setErrorMsg('Unable to retrieve tracking information right now. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrderTrack(orderNoInput);
  };

  const currentStatus = orderData?.status?.toLowerCase() || 'pending';

  // Step hierarchy for normal order progress
  const standardSteps = [
    { key: 'pending', label: 'Placed', icon: Clock },
    { key: 'processing', label: 'Processing', icon: Package },
    { key: 'shipped', label: 'Shipped', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle2 }
  ];

  const isCancelled = currentStatus === 'cancelled';
  const isReturned = currentStatus === 'returned';

  const getStepState = (stepKey) => {
    if (isCancelled || isReturned) return 'disabled';
    const statusOrder = ['pending', 'processing', 'shipped', 'delivered'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const stepIndex = statusOrder.indexOf(stepKey);

    if (stepIndex <= currentIndex && currentIndex !== -1) return 'active';
    return 'upcoming';
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8FC] text-[#0E1330] pb-24 font-sans selection:bg-[#2436F5] selection:text-white">
      <Header onCartClick={onOpenCart} />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 space-y-6">
        {/* Page Title Header */}
        <div className="bg-[#FFFFFF] p-6 rounded-[24px] border-2 border-[#0E1330] shadow-[4px_4px_0px_#0E1330] text-center space-y-2">
          <div className="w-12 h-12 bg-[#FFC933] text-[#0E1330] rounded-2xl border-2 border-[#0E1330] flex items-center justify-center mx-auto shadow-[2px_2px_0px_#0E1330]">
            <Package className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-heading font-extrabold text-[#0E1330]">
            Track your Extrovat order
          </h1>
          <p className="text-xs font-sans text-[#5B6079] max-w-md mx-auto">
            Enter your unique order number (e.g. EXT-250301-1234) sent via WhatsApp or receipt to view live status.
          </p>
        </div>

        {/* Search Input Box */}
        <form onSubmit={handleSearchSubmit} className="bg-[#FFFFFF] p-4 rounded-[20px] border-2 border-[#0E1330] shadow-[3px_3px_0px_#0E1330] space-y-3">
          <label className="block text-xs font-heading font-extrabold text-[#0E1330] uppercase tracking-wider">
            Order Number
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={orderNoInput}
              onChange={(e) => setOrderNoInput(e.target.value)}
              placeholder="e.g. EXT-250301-1234"
              className="flex-1 px-4 py-3 bg-[#F7F8FC] border-2 border-[#0E1330] rounded-xl text-sm font-mono font-bold uppercase text-[#0E1330] focus:outline-none focus:border-[#2436F5]"
            />
            <button
              type="submit"
              disabled={loading || !orderNoInput.trim()}
              className="px-6 py-3 bg-[#2436F5] hover:bg-[#0E1330] disabled:bg-gray-300 text-[#FFFFFF] font-heading font-extrabold text-xs uppercase tracking-wider rounded-xl border-2 border-[#0E1330] shadow-[2px_2px_0px_#0E1330] transition-all cursor-pointer flex items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>Track</span>
            </button>
          </div>
        </form>

        {/* Error message */}
        {errorMsg && (
          <div className="bg-rose-50 border-2 border-rose-500 p-4 rounded-[20px] text-xs font-bold text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Search Result */}
        {searched && !loading && !errorMsg && (
          <div className="bg-[#FFFFFF] p-6 rounded-[24px] border-2 border-[#0E1330] shadow-[4px_4px_0px_#0E1330] space-y-6 animate-in fade-in duration-200">
            {orderData ? (
              <>
                {/* Header Status Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b-2 border-[#0E1330] gap-2">
                  <div>
                    <span className="text-[10px] font-heading font-bold text-[#5B6079] uppercase tracking-wider block">
                      Order Reference
                    </span>
                    <h2 className="text-lg font-mono font-extrabold text-[#0E1330]">
                      {orderData.orderNo}
                    </h2>
                  </div>

                  <div className="inline-flex items-center gap-2">
                    <span className="text-xs font-heading font-bold text-[#0E1330]">Status:</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-heading font-extrabold uppercase border border-[#0E1330] ${
                        currentStatus === 'delivered'
                          ? 'bg-[#0F9D6B] text-white'
                          : currentStatus === 'shipped'
                          ? 'bg-[#2436F5] text-white'
                          : currentStatus === 'processing'
                          ? 'bg-[#FFC933] text-[#0E1330]'
                          : currentStatus === 'cancelled'
                          ? 'bg-rose-500 text-white'
                          : currentStatus === 'returned'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-[#0E1330]'
                      }`}
                    >
                      {currentStatus}
                    </span>
                  </div>
                </div>

                {/* Cancelled / Returned State Card */}
                {isCancelled && (
                  <div className="bg-rose-50 border-2 border-rose-500 p-4 rounded-[20px] text-rose-800 space-y-1">
                    <div className="flex items-center gap-2 font-heading font-extrabold text-sm">
                      <XCircle className="w-5 h-5 text-rose-600" />
                      <span>Order Cancelled</span>
                    </div>
                    <p className="text-xs font-sans text-rose-700">
                      This order has been cancelled. If you have any questions or would like to place a new order, please contact our support team.
                    </p>
                  </div>
                )}

                {isReturned && (
                  <div className="bg-purple-50 border-2 border-purple-500 p-4 rounded-[20px] text-purple-900 space-y-1">
                    <div className="flex items-center gap-2 font-heading font-extrabold text-sm">
                      <RotateCcw className="w-5 h-5 text-purple-600" />
                      <span>Order Returned</span>
                    </div>
                    <p className="text-xs font-sans text-purple-800">
                      This order was marked as returned.
                    </p>
                  </div>
                )}

                {/* Standard Progress Flow */}
                {!isCancelled && !isReturned && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-heading font-extrabold text-[#0E1330] uppercase tracking-wider">
                      Delivery progress
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {standardSteps.map((step) => {
                        const state = getStepState(step.key);
                        const Icon = step.icon;

                        return (
                          <div
                            key={step.key}
                            className={`p-3 rounded-2xl border-2 flex flex-col items-center text-center gap-2 transition-all ${
                              state === 'active'
                                ? 'bg-[#FFC933] border-[#0E1330] text-[#0E1330] shadow-[2px_2px_0px_#0E1330]'
                                : 'bg-[#F7F8FC] border-[#0E1330]/30 text-[#5B6079]'
                            }`}
                          >
                            <div
                              className={`p-2 rounded-xl border border-[#0E1330] ${
                                state === 'active' ? 'bg-[#0E1330] text-[#FFC933]' : 'bg-white text-gray-400'
                              }`}
                            >
                              <Icon className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-heading font-extrabold">
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Status Timeline History */}
                {Array.isArray(orderData.timeline) && orderData.timeline.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-heading font-extrabold text-[#0E1330] uppercase tracking-wider">
                      Timeline updates
                    </h3>
                    <div className="border-l-2 border-[#0E1330] pl-4 space-y-3 font-sans">
                      {orderData.timeline.map((entry, idx) => (
                        <div key={idx} className="relative">
                          <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#2436F5] border border-[#0E1330]" />
                          <div className="text-xs">
                            <span className="font-heading font-bold text-[#0E1330] uppercase">
                              {entry.status}
                            </span>
                            {entry.at && (
                              <span className="text-[10px] text-[#5B6079] ml-2 font-mono">
                                {new Date(entry.at).toLocaleString('en-GB')}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="py-8 text-center space-y-2">
                <p className="text-sm font-heading font-bold text-[#0E1330]">
                  No order found for "{orderNoInput.trim().toUpperCase()}"
                </p>
                <p className="text-xs font-sans text-[#5B6079]">
                  Please double check your order number and try again, or reach out to our WhatsApp support.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      <BottomNav activeTab="track" onTabSelect={() => {}} onOpenCart={onOpenCart} />
    </div>
  );
}
