import React, { useState, useEffect } from 'react';
import { signOut, deleteUser } from 'firebase/auth';
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
  arrayRemove
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { BANGLADESH_DISTRICTS } from '../data/districts';
import { formatBDT } from '../utils/currency';
import Header from './Header';
import BottomNav from './BottomNav';
import {
  User,
  MapPin,
  Package,
  Heart,
  LogOut,
  Trash2,
  Plus,
  Check,
  AlertCircle,
  ChevronRight,
  MessageCircle,
  RotateCcw,
  ExternalLink,
  ShieldAlert,
  ShoppingBag
} from 'lucide-react';

export default function AccountPages({ currentHash, user, userProfile, onOpenCart, onAddToCart }) {
  const [profileData, setProfileData] = useState({
    displayName: userProfile?.displayName || user?.displayName || '',
    phone: userProfile?.phone || '',
    email: user?.email || '',
    photoURL: userProfile?.photoURL || user?.photoURL || ''
  });

  const [addresses, setAddresses] = useState(userProfile?.addresses || []);
  const [wishlistIds, setWishlistIds] = useState(userProfile?.wishlist || []);
  const [savedProducts, setSavedProducts] = useState([]);

  // Address Modal / Form State
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressIndex, setEditingAddressIndex] = useState(null);
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    name: userProfile?.displayName || '',
    phone: userProfile?.phone || '',
    address: '',
    district: 'Dhaka',
    isDefault: false
  });

  // Orders State
  const [myOrders, setMyOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrderNo, setSelectedOrderNo] = useState(null);

  // Status feedback
  const [toast, setToast] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Sync state if userProfile changes
  useEffect(() => {
    if (userProfile) {
      setProfileData({
        displayName: userProfile.displayName || user?.displayName || '',
        phone: userProfile.phone || '',
        email: user?.email || '',
        photoURL: userProfile.photoURL || user?.photoURL || ''
      });
      setAddresses(userProfile.addresses || []);
      setWishlistIds(userProfile.wishlist || []);
    }
  }, [userProfile, user]);

  // Handle URL route hash changes (e.g. #/account/orders/EXT-1234)
  useEffect(() => {
    if (currentHash.startsWith('#/account/orders/')) {
      const orderNoParam = currentHash.replace('#/account/orders/', '').trim();
      if (orderNoParam) {
        setSelectedOrderNo(orderNoParam);
      }
    } else {
      setSelectedOrderNo(null);
    }
  }, [currentHash]);

  // Fetch customer orders: where("uid", "==", user.uid), limit(50), client sort
  useEffect(() => {
    if (!user?.uid || !db) return;

    const fetchMyOrders = async () => {
      setOrdersLoading(true);
      try {
        const q = query(
          collection(db, 'orders'),
          where('uid', '==', user.uid),
          limit(50)
        );
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // Client-side sort by createdAt descending
        list.sort((a, b) => {
          const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
          const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
          return timeB - timeA;
        });

        setMyOrders(list);
      } catch (err) {
        console.warn('Error fetching user orders:', err);
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchMyOrders();
  }, [user]);

  // Fetch saved wishlist products from products collection or storefront cache
  useEffect(() => {
    if (!db || wishlistIds.length === 0) {
      setSavedProducts([]);
      return;
    }

    const fetchSavedProducts = async () => {
      try {
        const prods = [];
        for (const pid of wishlistIds) {
          const pRef = doc(db, 'products', String(pid));
          const pSnap = await getDoc(pRef);
          if (pSnap.exists()) {
            prods.push({ id: pSnap.id, ...pSnap.data() });
          }
        }
        setSavedProducts(prods);
      } catch (err) {
        console.warn('Error fetching saved wishlist products:', err);
      }
    };

    fetchSavedProducts();
  }, [wishlistIds]);

  const showToastMsg = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Save Profile Changes
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user?.uid || !db) return;

    const phoneRegex = /^01[3-9]\d{8}$/;
    if (profileData.phone && !phoneRegex.test(profileData.phone.trim())) {
      showToastMsg('error', 'Please enter a valid 11-digit BD phone number (01XXXXXXXXX)');
      return;
    }

    setSavingProfile(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: profileData.displayName.trim(),
        phone: profileData.phone.trim(),
        updatedAt: new Date().toISOString()
      });
      showToastMsg('success', 'Profile updated successfully!');
    } catch (err) {
      console.warn('Error saving profile:', err);
      showToastMsg('error', 'Failed to save profile changes.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Address CRUD Handlers
  const handleOpenAddAddress = () => {
    if (addresses.length >= 5) {
      showToastMsg('error', 'Maximum 5 addresses allowed.');
      return;
    }
    setEditingAddressIndex(null);
    setAddressForm({
      label: 'Home',
      name: profileData.displayName || '',
      phone: profileData.phone || '',
      address: '',
      district: 'Dhaka',
      isDefault: addresses.length === 0
    });
    setIsAddressModalOpen(true);
  };

  const handleOpenEditAddress = (idx) => {
    const addr = addresses[idx];
    if (!addr) return;
    setEditingAddressIndex(idx);
    setAddressForm({ ...addr });
    setIsAddressModalOpen(true);
  };

  const handleSaveAddressForm = async (e) => {
    e.preventDefault();
    if (!user?.uid || !db) return;

    if (!addressForm.name.trim() || !addressForm.phone.trim() || !addressForm.address.trim()) {
      showToastMsg('error', 'Please fill in all address fields.');
      return;
    }

    let updatedList = [...addresses];

    if (addressForm.isDefault) {
      updatedList = updatedList.map((a) => ({ ...a, isDefault: false }));
    }

    if (editingAddressIndex !== null) {
      updatedList[editingAddressIndex] = { ...addressForm };
    } else {
      updatedList.push({ ...addressForm });
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        addresses: updatedList,
        updatedAt: new Date().toISOString()
      });
      setAddresses(updatedList);
      setIsAddressModalOpen(false);
      showToastMsg('success', 'Address saved successfully!');
    } catch (err) {
      console.warn('Error saving address:', err);
      showToastMsg('error', 'Failed to save address.');
    }
  };

  const handleDeleteAddress = async (idx) => {
    if (!user?.uid || !db) return;
    const updatedList = addresses.filter((_, i) => i !== idx);

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        addresses: updatedList,
        updatedAt: new Date().toISOString()
      });
      setAddresses(updatedList);
      showToastMsg('success', 'Address deleted.');
    } catch (err) {
      console.warn('Error deleting address:', err);
      showToastMsg('error', 'Failed to delete address.');
    }
  };

  // Remove Wishlist item
  const handleRemoveWishlist = async (productId) => {
    if (!user?.uid || !db) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        wishlist: arrayRemove(productId)
      });
      setWishlistIds((prev) => prev.filter((id) => id !== productId));
      showToastMsg('success', 'Item removed from saved list');
    } catch (err) {
      console.warn('Error removing wishlist item:', err);
    }
  };

  // Account Logout
  const handleAccountLogout = async () => {
    try {
      await signOut(auth);
      window.location.hash = '#/';
    } catch (err) {
      console.warn('Logout error:', err);
    }
  };

  // Account Deletion
  const handleDeleteAccount = async () => {
    if (!user || !db) return;
    setDeleteLoading(true);

    try {
      // 1. Delete users/{uid} doc
      const userRef = doc(db, 'users', user.uid);
      await deleteDoc(userRef);

      // 2. Delete Auth user
      await deleteUser(user);
      window.location.hash = '#/';
    } catch (err) {
      console.warn('Account deletion error:', err);
      if (err.code === 'auth/requires-recent-login') {
        showToastMsg('error', 'Security check: Please log in again before deleting your account.');
      } else {
        showToastMsg('error', 'Failed to delete account: ' + err.message);
      }
    } finally {
      setDeleteLoading(false);
      setDeleteConfirmOpen(false);
    }
  };

  // Reorder helper
  const handleReorder = (ord) => {
    if (!ord?.items || !onAddToCart) return;
    ord.items.forEach((item) => {
      onAddToCart(
        {
          id: item.productId,
          title: item.name,
          name: item.name,
          price: item.price,
          image: item.image
        },
        item.size || '12ml'
      );
    });
    showToastMsg('success', 'Items added to cart!');
    if (onOpenCart) onOpenCart();
  };

  // Resolve Sub-Route
  const activeSubTab = currentHash.includes('/addresses')
    ? 'addresses'
    : currentHash.includes('/orders')
    ? 'orders'
    : currentHash.includes('/saved')
    ? 'saved'
    : 'profile';

  const selectedOrder = selectedOrderNo
    ? myOrders.find((o) => (o.orderNo || o.id) === selectedOrderNo)
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8FC] text-[#0E1330] pb-24 font-sans selection:bg-[#2436F5] selection:text-white">
      <Header onCartClick={onOpenCart} user={user} userProfile={userProfile} onLogout={handleAccountLogout} />

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-2xl border-2 shadow-[4px_4px_0px_#0E1330] flex items-center gap-2 text-xs font-heading font-extrabold animate-in fade-in ${
            toast.type === 'success'
              ? 'bg-[#FFC933] border-[#0E1330] text-[#0E1330]'
              : 'bg-rose-500 border-[#0E1330] text-white'
          }`}
        >
          {toast.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 space-y-6">
        {/* Navigation Tabs Header */}
        <div className="bg-[#FFFFFF] p-4 sm:p-5 rounded-[24px] border-2 border-[#0E1330] shadow-[4px_4px_0px_#0E1330] space-y-4">
          <div className="flex items-center gap-3">
            {profileData.photoURL ? (
              <img
                src={profileData.photoURL}
                alt={profileData.displayName}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-full object-cover border-2 border-[#0E1330]"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#2436F5] text-white flex items-center justify-center font-heading font-extrabold text-lg border-2 border-[#0E1330]">
                {(profileData.displayName || profileData.email || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-lg sm:text-xl font-heading font-extrabold text-[#0E1330]">
                {profileData.displayName || 'Customer Account'}
              </h1>
              <p className="text-xs font-sans text-[#5B6079]">{profileData.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-t-2 border-[#0E1330]/10 pt-3">
            <a
              href="#/account"
              className={`px-4 py-2 rounded-xl border-2 font-heading font-bold text-xs shrink-0 transition-all ${
                activeSubTab === 'profile'
                  ? 'bg-[#2436F5] text-white border-[#0E1330] shadow-[2px_2px_0px_#0E1330]'
                  : 'bg-[#FFFFFF] border-[#0E1330] text-[#0E1330] hover:bg-[#FFC933]'
              }`}
            >
              Profile
            </a>
            <a
              href="#/account/addresses"
              className={`px-4 py-2 rounded-xl border-2 font-heading font-bold text-xs shrink-0 transition-all ${
                activeSubTab === 'addresses'
                  ? 'bg-[#2436F5] text-white border-[#0E1330] shadow-[2px_2px_0px_#0E1330]'
                  : 'bg-[#FFFFFF] border-[#0E1330] text-[#0E1330] hover:bg-[#FFC933]'
              }`}
            >
              Saved Addresses ({addresses.length})
            </a>
            <a
              href="#/account/orders"
              className={`px-4 py-2 rounded-xl border-2 font-heading font-bold text-xs shrink-0 transition-all ${
                activeSubTab === 'orders'
                  ? 'bg-[#2436F5] text-white border-[#0E1330] shadow-[2px_2px_0px_#0E1330]'
                  : 'bg-[#FFFFFF] border-[#0E1330] text-[#0E1330] hover:bg-[#FFC933]'
              }`}
            >
              My Orders ({myOrders.length})
            </a>
            <a
              href="#/account/saved"
              className={`px-4 py-2 rounded-xl border-2 font-heading font-bold text-xs shrink-0 transition-all ${
                activeSubTab === 'saved'
                  ? 'bg-[#2436F5] text-white border-[#0E1330] shadow-[2px_2px_0px_#0E1330]'
                  : 'bg-[#FFFFFF] border-[#0E1330] text-[#0E1330] hover:bg-[#FFC933]'
              }`}
            >
              Saved Items ({wishlistIds.length})
            </a>
          </div>
        </div>

        {/* 1. Profile Tab View */}
        {activeSubTab === 'profile' && (
          <form
            onSubmit={handleSaveProfile}
            className="bg-[#FFFFFF] p-6 rounded-[24px] border-2 border-[#0E1330] shadow-[4px_4px_0px_#0E1330] space-y-4"
          >
            <h2 className="text-base font-heading font-extrabold text-[#0E1330] uppercase tracking-wider border-b-2 border-[#0E1330] pb-2">
              Personal Information
            </h2>

            <div>
              <label className="block text-xs font-heading font-bold text-[#0E1330] mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={profileData.displayName}
                onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                placeholder="e.g. Tanvir Ahmed"
                className="w-full px-3.5 py-2.5 bg-[#F7F8FC] border-2 border-[#0E1330] rounded-xl text-xs font-bold text-[#0E1330] focus:outline-none focus:border-[#2436F5]"
              />
            </div>

            <div>
              <label className="block text-xs font-heading font-bold text-[#0E1330] mb-1">
                Phone Number (01XXXXXXXXX)
              </label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                placeholder="e.g. 01712345678"
                className="w-full px-3.5 py-2.5 bg-[#F7F8FC] border-2 border-[#0E1330] rounded-xl text-xs font-bold text-[#0E1330] focus:outline-none focus:border-[#2436F5]"
              />
            </div>

            <div>
              <label className="block text-xs font-heading font-bold text-[#5B6079] mb-1">
                Email Address (Read-Only)
              </label>
              <input
                type="email"
                disabled
                value={profileData.email}
                className="w-full px-3.5 py-2.5 bg-gray-100 border-2 border-[#0E1330]/30 rounded-xl text-xs font-bold text-[#5B6079]"
              />
            </div>

            <div className="pt-2 flex items-center justify-between border-t-2 border-[#0E1330]/10">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-6 py-2.5 bg-[#2436F5] text-white border-2 border-[#0E1330] shadow-[2px_2px_0px_#0E1330] font-heading font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-[#0E1330] cursor-pointer"
              >
                {savingProfile ? 'Saving...' : 'Save Profile'}
              </button>

              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(true)}
                className="px-4 py-2 bg-rose-50 border-2 border-rose-500 rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-100 cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Account
              </button>
            </div>
          </form>
        )}

        {/* 2. Addresses Tab View */}
        {activeSubTab === 'addresses' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-[#FFFFFF] p-4 rounded-[20px] border-2 border-[#0E1330] shadow-[3px_3px_0px_#0E1330]">
              <h2 className="text-sm font-heading font-extrabold uppercase text-[#0E1330]">
                Saved Shipping Addresses
              </h2>
              {addresses.length < 5 && (
                <button
                  type="button"
                  onClick={handleOpenAddAddress}
                  className="px-3.5 py-2 bg-[#FFC933] text-[#0E1330] border-2 border-[#0E1330] shadow-[2px_2px_0px_#0E1330] rounded-xl text-xs font-heading font-bold cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add Address
                </button>
              )}
            </div>

            {addresses.length === 0 ? (
              <div className="bg-[#FFFFFF] p-8 rounded-[24px] border-2 border-[#0E1330] text-center space-y-2">
                <MapPin className="w-8 h-8 text-[#5B6079] mx-auto" />
                <p className="text-sm font-heading font-bold text-[#0E1330]">No saved addresses</p>
                <p className="text-xs font-sans text-[#5B6079]">
                  Add up to 5 shipping addresses for quick checkout.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map((addr, idx) => (
                  <div
                    key={idx}
                    className="bg-[#FFFFFF] p-4 rounded-[20px] border-2 border-[#0E1330] shadow-[3px_3px_0px_#0E1330] space-y-2 relative"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-heading font-extrabold uppercase px-2 py-0.5 rounded border border-[#0E1330] bg-[#FFC933] text-[#0E1330]">
                        {addr.label || 'Home'}
                      </span>
                      {addr.isDefault && (
                        <span className="text-[10px] font-bold text-[#0F9D6B] uppercase font-mono">
                          Default Address
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-bold text-[#0E1330]">{addr.name}</p>
                    <p className="text-xs font-mono text-[#5B6079]">{addr.phone}</p>
                    <p className="text-xs font-sans text-[#0E1330]">
                      {addr.address}, {addr.district}
                    </p>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#0E1330]/10">
                      <button
                        type="button"
                        onClick={() => handleOpenEditAddress(idx)}
                        className="text-xs font-heading font-bold text-[#2436F5] hover:underline cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(idx)}
                        className="text-xs font-heading font-bold text-rose-600 hover:underline cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. My Orders Tab View */}
        {activeSubTab === 'orders' && (
          <div className="space-y-4">
            {selectedOrder ? (
              /* Single Order Detail View */
              <div className="bg-[#FFFFFF] p-6 rounded-[24px] border-2 border-[#0E1330] shadow-[4px_4px_0px_#0E1330] space-y-6">
                <div className="flex items-center justify-between pb-3 border-b-2 border-[#0E1330]">
                  <div>
                    <a
                      href="#/account/orders"
                      className="text-xs font-heading font-bold text-[#2436F5] hover:underline mb-1 inline-block"
                    >
                      ← Back to Orders list
                    </a>
                    <h2 className="text-lg font-mono font-extrabold text-[#0E1330]">
                      {selectedOrder.orderNo || selectedOrder.id}
                    </h2>
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-heading font-extrabold uppercase border border-[#0E1330] bg-[#FFC933] text-[#0E1330]">
                    {selectedOrder.status || 'pending'}
                  </span>
                </div>

                {/* Ordered Items */}
                <div className="space-y-2">
                  <h3 className="text-xs font-heading font-extrabold uppercase text-[#0E1330]">
                    Ordered Items
                  </h3>
                  <div className="divide-y border-y border-[#0E1330]/20">
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between text-xs font-sans">
                        <div>
                          <p className="font-bold text-[#0E1330]">{item.name}</p>
                          <span className="text-[10px] text-[#5B6079] font-mono">
                            Size: {item.size || 'Standard'} | Qty: {item.qty || 1}
                          </span>
                        </div>
                        <span className="font-extrabold text-[#0E1330]">
                          {formatBDT((item.price || 0) * (item.qty || 1))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons: Track Order, Reorder, Need Help */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <a
                    href={`#/track?id=${selectedOrder.orderNo || selectedOrder.id}`}
                    className="px-4 py-2 bg-[#2436F5] text-white border-2 border-[#0E1330] shadow-[2px_2px_0px_#0E1330] rounded-xl text-xs font-heading font-extrabold uppercase cursor-pointer flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Track Order
                  </a>

                  <button
                    type="button"
                    onClick={() => handleReorder(selectedOrder)}
                    className="px-4 py-2 bg-[#FFC933] text-[#0E1330] border-2 border-[#0E1330] shadow-[2px_2px_0px_#0E1330] rounded-xl text-xs font-heading font-extrabold uppercase cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reorder
                  </button>

                  <a
                    href={`https://wa.me/8809638316596?text=${encodeURIComponent(
                      `Need help with order ${selectedOrder.orderNo || selectedOrder.id}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-[#25D366] text-[#0E1330] border-2 border-[#0E1330] shadow-[2px_2px_0px_#0E1330] rounded-xl text-xs font-heading font-extrabold uppercase cursor-pointer flex items-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> Need help? WhatsApp us
                  </a>
                </div>
              </div>
            ) : (
              /* Orders List */
              myOrders.length === 0 ? (
                <div className="bg-[#FFFFFF] p-8 rounded-[24px] border-2 border-[#0E1330] text-center space-y-2">
                  <Package className="w-8 h-8 text-[#5B6079] mx-auto" />
                  <p className="text-sm font-heading font-bold text-[#0E1330]">No order history</p>
                  <p className="text-xs font-sans text-[#5B6079]">
                    Your placed storefront orders will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myOrders.map((ord) => (
                    <a
                      key={ord.id}
                      href={`#/account/orders/${ord.orderNo || ord.id}`}
                      className="block bg-[#FFFFFF] p-4 rounded-[20px] border-2 border-[#0E1330] shadow-[3px_3px_0px_#0E1330] space-y-2 hover:bg-[#F7F8FC] transition-colors"
                    >
                      <div className="flex items-center justify-between border-b-2 border-[#0E1330]/10 pb-2">
                        <span className="font-mono font-extrabold text-xs text-[#0E1330]">
                          {ord.orderNo || ord.id}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-heading font-extrabold uppercase border border-[#0E1330] bg-[#FFC933] text-[#0E1330]">
                          {ord.status || 'pending'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs font-sans">
                        <div>
                          <p className="font-bold text-[#0E1330]">{ord.items?.length || 0} items</p>
                          <p className="text-[10px] font-mono text-[#5B6079]">
                            {ord.createdAt?.toDate ? ord.createdAt.toDate().toLocaleDateString('en-GB') : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-[#0E1330]">
                            {formatBDT(ord.total || 0)}
                          </span>
                          <ChevronRight className="w-4 h-4 text-[#5B6079]" />
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )
            )}
          </div>
        )}

        {/* 4. Saved Items (Wishlist) Tab View */}
        {activeSubTab === 'saved' && (
          <div className="space-y-4">
            {savedProducts.length === 0 ? (
              <div className="bg-[#FFFFFF] p-8 rounded-[24px] border-2 border-[#0E1330] text-center space-y-2">
                <Heart className="w-8 h-8 text-[#5B6079] mx-auto" />
                <p className="text-sm font-heading font-bold text-[#0E1330]">No saved items</p>
                <p className="text-xs font-sans text-[#5B6079]">
                  Tap the heart icon on any product to save it here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {savedProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="bg-[#FFFFFF] p-3 rounded-[20px] border-2 border-[#0E1330] shadow-[3px_3px_0px_#0E1330] space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      {prod.image && (
                        <img
                          src={prod.image}
                          alt={prod.title || prod.name}
                          className="w-full h-28 rounded-xl object-cover border border-[#0E1330] mb-2 bg-white"
                        />
                      )}
                      <p className="font-heading font-bold text-xs text-[#0E1330] line-clamp-1">
                        {prod.title || prod.name}
                      </p>
                      <p className="font-extrabold text-xs text-[#0E1330] mt-0.5">
                        {formatBDT(prod.price || 0)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 pt-2 border-t border-[#0E1330]/10">
                      <button
                        type="button"
                        onClick={() => {
                          if (onAddToCart) onAddToCart(prod);
                          showToastMsg('success', 'Added to cart!');
                        }}
                        className="flex-1 py-1.5 bg-[#2436F5] text-white border border-[#0E1330] rounded-lg text-[10px] font-heading font-extrabold uppercase cursor-pointer"
                      >
                        Add to Cart
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveWishlist(prod.id)}
                        aria-label="Remove item"
                        className="p-1.5 bg-rose-50 border border-[#0E1330] rounded-lg text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Address Edit/Add Modal */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0E1330]/50 backdrop-blur-xs">
          <div className="bg-[#FFFFFF] rounded-[24px] border-2 border-[#0E1330] shadow-[6px_6px_0px_#0E1330] p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-heading font-extrabold text-[#0E1330]">
              {editingAddressIndex !== null ? 'Edit Address' : 'Add New Address'}
            </h3>

            <form onSubmit={handleSaveAddressForm} className="space-y-3 text-xs font-sans">
              <div>
                <label className="block font-bold mb-1">Address Label</label>
                <input
                  type="text"
                  value={addressForm.label}
                  onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                  placeholder="e.g. Home, Office"
                  className="w-full px-3 py-2 bg-[#F7F8FC] border-2 border-[#0E1330] rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Receiver Name</label>
                <input
                  type="text"
                  required
                  value={addressForm.name}
                  onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                  placeholder="Receiver full name"
                  className="w-full px-3 py-2 bg-[#F7F8FC] border-2 border-[#0E1330] rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Receiver Phone</label>
                <input
                  type="tel"
                  required
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-3 py-2 bg-[#F7F8FC] border-2 border-[#0E1330] rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Full Address</label>
                <textarea
                  rows={2}
                  required
                  value={addressForm.address}
                  onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                  placeholder="House, Road, Thana, Area"
                  className="w-full px-3 py-2 bg-[#F7F8FC] border-2 border-[#0E1330] rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">District</label>
                <select
                  value={addressForm.district}
                  onChange={(e) => setAddressForm({ ...addressForm, district: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F7F8FC] border-2 border-[#0E1330] rounded-xl font-bold"
                >
                  {BANGLADESH_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chkDefault"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  className="w-4 h-4 accent-[#2436F5]"
                />
                <label htmlFor="chkDefault" className="font-bold text-[#0E1330]">
                  Set as default shipping address
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t-2 border-[#0E1330]/10">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="px-4 py-2 border-2 border-[#0E1330] rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2436F5] text-white border-2 border-[#0E1330] shadow-[2px_2px_0px_#0E1330] rounded-xl font-bold"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0E1330]/50 backdrop-blur-xs">
          <div className="bg-[#FFFFFF] rounded-[24px] border-2 border-[#0E1330] shadow-[6px_6px_0px_#0E1330] p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-lg font-heading font-extrabold text-[#0E1330]">Delete Account?</h3>
            </div>
            <p className="text-xs font-sans text-[#5B6079]">
              Are you sure you want to permanently delete your account and saved profile data? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-4 py-2 border-2 border-[#0E1330] rounded-xl text-xs font-bold bg-[#FFFFFF]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleDeleteAccount}
                className="px-4 py-2 border-2 border-[#0E1330] rounded-xl text-xs font-bold bg-rose-600 text-white shadow-[2px_2px_0px_#0E1330]"
              >
                {deleteLoading ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav activeTab="login" onTabSelect={() => {}} onOpenCart={onOpenCart} user={user} userProfile={userProfile} />
    </div>
  );
}
