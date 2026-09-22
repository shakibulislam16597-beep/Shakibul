import React, { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  doc,
  runTransaction,
  serverTimestamp,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { logAction } from '../lib/audit';
import { clearStorefrontCache } from '../lib/storefrontData';
import { formatBDT } from '../utils/currency';
import {
  Boxes,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  History,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Minus,
  X,
  Package,
  Calendar,
  UserCheck,
  FileText
} from 'lucide-react';

export default function InventoryManager({ currentHash, user }) {
  // Determine active tab from URL hash or default to 'stock'
  const getTabFromHash = () => {
    if (currentHash?.includes('/in')) return 'in';
    if (currentHash?.includes('/out')) return 'out';
    if (currentHash?.includes('/low')) return 'low';
    if (currentHash?.includes('/history')) return 'history';
    return 'stock';
  };

  const [activeTab, setActiveTab] = useState(getTabFromHash);
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [historyTypeFilter, setHistoryTypeFilter] = useState('all');
  const [historySearchTerm, setHistorySearchTerm] = useState('');

  // Stock In / Stock Out Form States
  const [selectedProductId, setSelectedProductId] = useState('');
  const [stockQuantity, setStockQuantity] = useState(1);
  const [stockNote, setStockNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Sync tab with route hash changes
  useEffect(() => {
    setActiveTab(getTabFromHash());
  }, [currentHash]);

  useEffect(() => {
    fetchProducts();
    if (activeTab === 'history') {
      fetchStockHistory();
    }
  }, [activeTab]);

  const changeTab = (tabKey) => {
    setActiveTab(tabKey);
    setErrorMessage('');
    setSuccessMessage('');
    window.location.hash = `#/admin/inventory/${tabKey}`;
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'products'));
      const prods = [];
      snap.forEach((docSnap) => {
        prods.push({ id: docSnap.id, ...docSnap.data() });
      });
      setProducts(prods);

      // Pre-select first product for forms if not selected
      if (prods.length > 0 && !selectedProductId) {
        setSelectedProductId(prods[0].id);
      }
    } catch (err) {
      console.error('Error fetching inventory products:', err);
      setErrorMessage(`Failed to load products: ${err?.message || 'Permission or network error'}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchStockHistory = async () => {
    setMovementsLoading(true);
    try {
      let q;
      try {
        q = query(collection(db, 'stockMovements'), orderBy('timestamp', 'desc'), limit(100));
      } catch (e) {
        q = query(collection(db, 'stockMovements'), limit(100));
      }
      const snap = await getDocs(q);
      const list = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });

      // Sort client-side as fallback if server ordering missing
      list.sort((a, b) => {
        const tA = a.timestamp?.seconds || 0;
        const tB = b.timestamp?.seconds || 0;
        return tB - tA;
      });

      setMovements(list);
    } catch (err) {
      console.error('Error fetching stock movements history:', err);
      setErrorMessage(`Failed to load stock history log: ${err?.message || 'Error occurred'}`);
    } finally {
      setMovementsLoading(false);
    }
  };

  // Stock In Submission Transaction
  const handleStockInSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!selectedProductId) {
      setErrorMessage('Please select a product.');
      return;
    }
    const qty = parseInt(stockQuantity, 10);
    if (isNaN(qty) || qty <= 0) {
      setErrorMessage('Quantity must be a positive number greater than 0.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const targetProd = products.find((p) => p.id === selectedProductId);
      const productName = targetProd?.name || targetProd?.title || 'Unknown Product';

      await runTransaction(db, async (transaction) => {
        const prodRef = doc(db, 'products', selectedProductId);
        const prodSnap = await transaction.get(prodRef);

        if (!prodSnap.exists()) {
          throw new Error('Selected product document does not exist.');
        }

        const currentStock = prodSnap.data().stock ?? 0;
        const newStock = currentStock + qty;

        // 1. Update product stock
        transaction.update(prodRef, {
          stock: newStock,
          updatedAt: serverTimestamp()
        });

        // 2. Add stockMovement log doc
        const movementRef = doc(collection(db, 'stockMovements'));
        transaction.set(movementRef, {
          productId: selectedProductId,
          productName,
          type: 'in',
          quantity: qty,
          reason: stockNote.trim() || 'Stock In',
          adminUid: user?.uid || '',
          adminEmail: user?.email || 'admin',
          timestamp: serverTimestamp()
        });
      });

      await logAction('STOCK_IN', selectedProductId, {
        productName,
        quantity: qty,
        reason: stockNote
      });

      clearStorefrontCache();
      setSuccessMessage(`Successfully added ${qty} units to "${productName}".`);
      setStockNote('');
      setStockQuantity(1);
      await fetchProducts();
    } catch (err) {
      console.error('Stock In transaction failed:', err);
      setErrorMessage(`Stock In failed: ${err?.message || 'Transaction error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Stock Out Submission Transaction
  const handleStockOutSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!selectedProductId) {
      setErrorMessage('Please select a product.');
      return;
    }
    const qty = parseInt(stockQuantity, 10);
    if (isNaN(qty) || qty <= 0) {
      setErrorMessage('Quantity must be a positive number greater than 0.');
      return;
    }

    const targetProd = products.find((p) => p.id === selectedProductId);
    const currentStock = targetProd?.stock ?? 0;
    const productName = targetProd?.name || targetProd?.title || 'Unknown Product';

    if (qty > currentStock) {
      setErrorMessage(
        `Cannot deduct ${qty} units. Current stock for "${productName}" is only ${currentStock} units.`
      );
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await runTransaction(db, async (transaction) => {
        const prodRef = doc(db, 'products', selectedProductId);
        const prodSnap = await transaction.get(prodRef);

        if (!prodSnap.exists()) {
          throw new Error('Selected product document does not exist.');
        }

        const dbCurrentStock = prodSnap.data().stock ?? 0;
        if (qty > dbCurrentStock) {
          throw new Error(`Insufficient stock. Current stock is ${dbCurrentStock} units.`);
        }

        const newStock = dbCurrentStock - qty;

        // 1. Update product stock
        transaction.update(prodRef, {
          stock: newStock,
          updatedAt: serverTimestamp()
        });

        // 2. Add stockMovement log doc
        const movementRef = doc(collection(db, 'stockMovements'));
        transaction.set(movementRef, {
          productId: selectedProductId,
          productName,
          type: 'out',
          quantity: qty,
          reason: stockNote.trim() || 'Stock Out',
          adminUid: user?.uid || '',
          adminEmail: user?.email || 'admin',
          timestamp: serverTimestamp()
        });
      });

      await logAction('STOCK_OUT', selectedProductId, {
        productName,
        quantity: qty,
        reason: stockNote
      });

      clearStorefrontCache();
      setSuccessMessage(`Successfully deducted ${qty} units from "${productName}".`);
      setStockNote('');
      setStockQuantity(1);
      await fetchProducts();
    } catch (err) {
      console.error('Stock Out transaction failed:', err);
      setErrorMessage(`Stock Out failed: ${err?.message || 'Transaction error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Helper for quick stock-in button from low stock tab or table
  const handleQuickStockIn = (productId) => {
    setSelectedProductId(productId);
    changeTab('in');
  };

  // Filters
  const filteredProducts = products.filter((prod) => {
    const nameStr = (prod.name || prod.title || '').toLowerCase();
    const catStr = prod.categoryName || prod.category || '';
    const matchesSearch = nameStr.includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'All' || catStr === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const lowStockProducts = products
    .filter((prod) => {
      const stock = typeof prod.stock === 'number' ? prod.stock : 0;
      const threshold = prod.lowStockThreshold ?? 5;
      return stock <= threshold;
    })
    .sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0));

  const filteredMovements = movements.filter((mov) => {
    const matchesType = historyTypeFilter === 'all' || mov.type === historyTypeFilter;
    const term = historySearchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      (mov.productName || '').toLowerCase().includes(term) ||
      (mov.adminEmail || '').toLowerCase().includes(term) ||
      (mov.reason || '').toLowerCase().includes(term);
    return matchesType && matchesSearch;
  });

  const uniqueCategories = [
    ...new Set(products.map((p) => p.categoryName || p.category).filter(Boolean))
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FFFFFF] p-5 rounded-[24px] border-2 border-[#0E1330] shadow-[4px_4px_0px_#0E1330]">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading font-extrabold uppercase text-[#0E1330] flex items-center gap-2">
            <Boxes className="w-6 h-6 text-[#2436F5]" /> Inventory Management
          </h1>
          <p className="text-xs font-sans text-[#5B6079] mt-0.5">
            Monitor product stock levels, perform Stock In / Stock Out adjustments, and review audit history.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            fetchProducts();
            if (activeTab === 'history') fetchStockHistory();
          }}
          className="p-2.5 bg-[#F7F8FC] hover:bg-[#FFC933] text-[#0E1330] border-2 border-[#0E1330] rounded-xl font-heading font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs Sub-Navigation */}
      <div className="bg-[#FFFFFF] p-2 rounded-[20px] border-2 border-[#0E1330] shadow-[3px_3px_0px_#0E1330] flex flex-wrap gap-2 text-xs font-heading font-extrabold">
        <button
          type="button"
          onClick={() => changeTab('stock')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all cursor-pointer ${
            activeTab === 'stock'
              ? 'bg-[#2436F5] text-[#FFFFFF] border-[#0E1330] shadow-[2px_2px_0px_#0E1330]'
              : 'bg-transparent text-[#0E1330] border-transparent hover:bg-[#F7F8FC] hover:border-[#0E1330]'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Stock Overview ({products.length})</span>
        </button>

        <button
          type="button"
          onClick={() => changeTab('in')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all cursor-pointer ${
            activeTab === 'in'
              ? 'bg-[#2436F5] text-[#FFFFFF] border-[#0E1330] shadow-[2px_2px_0px_#0E1330]'
              : 'bg-transparent text-[#0E1330] border-transparent hover:bg-[#F7F8FC] hover:border-[#0E1330]'
          }`}
        >
          <ArrowDownRight className="w-4 h-4 text-emerald-500" />
          <span>Stock In</span>
        </button>

        <button
          type="button"
          onClick={() => changeTab('out')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all cursor-pointer ${
            activeTab === 'out'
              ? 'bg-[#2436F5] text-[#FFFFFF] border-[#0E1330] shadow-[2px_2px_0px_#0E1330]'
              : 'bg-transparent text-[#0E1330] border-transparent hover:bg-[#F7F8FC] hover:border-[#0E1330]'
          }`}
        >
          <ArrowUpRight className="w-4 h-4 text-rose-500" />
          <span>Stock Out</span>
        </button>

        <button
          type="button"
          onClick={() => changeTab('low')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all cursor-pointer ${
            activeTab === 'low'
              ? 'bg-[#2436F5] text-[#FFFFFF] border-[#0E1330] shadow-[2px_2px_0px_#0E1330]'
              : 'bg-transparent text-[#0E1330] border-transparent hover:bg-[#F7F8FC] hover:border-[#0E1330]'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-[#FFC933]" />
          <span>Low Stock Alert</span>
          {lowStockProducts.length > 0 && (
            <span className="px-1.5 py-0.2 text-[10px] bg-red-600 text-white border border-[#0E1330] rounded-full">
              {lowStockProducts.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => changeTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-[#2436F5] text-[#FFFFFF] border-[#0E1330] shadow-[2px_2px_0px_#0E1330]'
              : 'bg-transparent text-[#0E1330] border-transparent hover:bg-[#F7F8FC] hover:border-[#0E1330]'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Stock History</span>
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

      {/* Loading Spinner */}
      {loading ? (
        <div className="p-12 text-center space-y-3 bg-[#FFFFFF] border-2 border-[#0E1330] rounded-[24px]">
          <div className="w-8 h-8 border-4 border-[#2436F5] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-heading font-bold text-[#5B6079]">Loading inventory data...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: STOCK OVERVIEW */}
          {activeTab === 'stock' && (
            <div className="space-y-4">
              {/* Filter Controls */}
              <div className="bg-[#FFFFFF] p-4 rounded-[20px] border-2 border-[#0E1330] shadow-[3px_3px_0px_#0E1330] grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-[#5B6079] absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Filter product stock by name..."
                    className="w-full pl-9 pr-3 py-2 bg-[#F7F8FC] border-2 border-[#0E1330] rounded-xl text-xs font-bold text-[#0E1330] focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 bg-[#F7F8FC] border-2 border-[#0E1330] rounded-xl px-3 py-1.5">
                  <Filter className="w-4 h-4 text-[#5B6079] shrink-0" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-transparent text-xs font-bold text-[#0E1330] focus:outline-none cursor-pointer"
                  >
                    <option value="All">All Categories</option>
                    {uniqueCategories.map((cat, idx) => (
                      <option key={idx} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Product Table */}
              <div className="bg-[#FFFFFF] border-2 border-[#0E1330] rounded-[24px] shadow-[4px_4px_0px_#0E1330] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#F7F8FC] border-b-2 border-[#0E1330] text-[11px] font-heading font-extrabold uppercase tracking-wider text-[#0E1330]">
                        <th className="p-4">Product</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Price</th>
                        <th className="p-4">Current Stock</th>
                        <th className="p-4">Low Stock Limit</th>
                        <th className="p-4 text-right">Quick Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-[#0E1330]/10 text-xs font-sans text-[#0E1330]">
                      {filteredProducts.map((prod) => {
                        const name = prod.name || prod.title || 'Untitled';
                        const category = prod.categoryName || prod.category || 'Attar';
                        const image = (Array.isArray(prod.images) && prod.images[0]) || prod.image || 'https://images.unsplash.com/photo-1547887537-6158d64c35b3';
                        const stock = typeof prod.stock === 'number' ? prod.stock : 0;
                        const threshold = prod.lowStockThreshold ?? 5;
                        const isLowStock = stock <= threshold;

                        return (
                          <tr key={prod.id} className="hover:bg-[#F7F8FC] transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={image}
                                  alt={name}
                                  className="w-10 h-10 rounded-xl object-cover border-2 border-[#0E1330] shrink-0"
                                />
                                <span className="font-heading font-bold text-xs text-[#0E1330] truncate max-w-xs">
                                  {name}
                                </span>
                              </div>
                            </td>
                            <td className="p-4 text-[#5B6079] font-bold">{category}</td>
                            <td className="p-4 font-extrabold text-[#0E1330]">{formatBDT(prod.price || 0)}</td>
                            <td className="p-4 font-bold">
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{stock} units</span>
                                {isLowStock && (
                                  <span className="px-2 py-0.5 bg-red-100 text-red-700 border border-[#0E1330] rounded-md text-[10px] font-heading font-extrabold flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3 text-red-600 shrink-0" /> Low Stock
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-4 text-[#5B6079] font-bold">{threshold} units</td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleQuickStockIn(prod.id)}
                                  className="px-3 py-1.5 bg-[#FFC933] hover:bg-[#e6b42d] text-[#0E1330] font-heading font-extrabold text-[11px] rounded-xl border-2 border-[#0E1330] shadow-[2px_2px_0px_#0E1330] flex items-center gap-1 cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" /> Stock In
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STOCK IN FORM */}
          {activeTab === 'in' && (
            <div className="max-w-2xl mx-auto bg-[#FFFFFF] p-6 rounded-[24px] border-2 border-[#0E1330] shadow-[4px_4px_0px_#0E1330] space-y-6">
              <div className="flex items-center gap-3 border-b-2 border-[#0E1330] pb-4">
                <div className="w-10 h-10 bg-emerald-100 border-2 border-[#0E1330] rounded-2xl flex items-center justify-center text-emerald-700 shadow-[2px_2px_0px_#0E1330]">
                  <ArrowDownRight className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-heading font-extrabold text-[#0E1330]">
                    Stock In Adjustment
                  </h2>
                  <p className="text-xs font-sans text-[#5B6079]">
                    Add received inventory to existing product stock level.
                  </p>
                </div>
              </div>

              <form onSubmit={handleStockInSubmit} className="space-y-4 text-xs font-sans">
                {/* Select Product */}
                <div className="space-y-1.5">
                  <label className="block font-heading font-extrabold text-[#0E1330] uppercase">
                    Select Product *
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    required
                    className="w-full p-3 bg-[#F7F8FC] border-2 border-[#0E1330] rounded-xl font-bold text-[#0E1330] focus:outline-none focus:border-[#2436F5]"
                  >
                    {products.map((prod) => (
                      <option key={prod.id} value={prod.id}>
                        {prod.name || prod.title} — Current Stock: {prod.stock ?? 0} units
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div className="space-y-1.5">
                  <label className="block font-heading font-extrabold text-[#0E1330] uppercase">
                    Quantity to Add *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    required
                    className="w-full p-3 bg-[#F7F8FC] border-2 border-[#0E1330] rounded-xl font-bold text-[#0E1330] focus:outline-none focus:border-[#2436F5]"
                  />
                </div>

                {/* Note / Reason */}
                <div className="space-y-1.5">
                  <label className="block font-heading font-extrabold text-[#0E1330] uppercase">
                    Note / Reason (Optional)
                  </label>
                  <input
                    type="text"
                    value={stockNote}
                    onChange={(e) => setStockNote(e.target.value)}
                    placeholder="e.g. New supplier shipment PO-2025"
                    className="w-full p-3 bg-[#F7F8FC] border-2 border-[#0E1330] rounded-xl font-bold text-[#0E1330] focus:outline-none focus:border-[#2436F5]"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-[#2436F5] hover:bg-[#1122D0] text-[#FFFFFF] font-heading font-extrabold text-xs uppercase tracking-wider rounded-xl border-2 border-[#0E1330] shadow-[3px_3px_0px_#0E1330] flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#FFC933]" />
                  <span>{submitting ? 'Processing Transaction...' : 'Add Stock (Stock In)'}</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: STOCK OUT FORM */}
          {activeTab === 'out' && (
            <div className="max-w-2xl mx-auto bg-[#FFFFFF] p-6 rounded-[24px] border-2 border-[#0E1330] shadow-[4px_4px_0px_#0E1330] space-y-6">
              <div className="flex items-center gap-3 border-b-2 border-[#0E1330] pb-4">
                <div className="w-10 h-10 bg-rose-100 border-2 border-[#0E1330] rounded-2xl flex items-center justify-center text-rose-700 shadow-[2px_2px_0px_#0E1330]">
                  <ArrowUpRight className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-heading font-extrabold text-[#0E1330]">
                    Stock Out Adjustment
                  </h2>
                  <p className="text-xs font-sans text-[#5B6079]">
                    Deduct stock for store sales, damages, or manual inventory write-offs.
                  </p>
                </div>
              </div>

              <form onSubmit={handleStockOutSubmit} className="space-y-4 text-xs font-sans">
                {/* Select Product */}
                <div className="space-y-1.5">
                  <label className="block font-heading font-extrabold text-[#0E1330] uppercase">
                    Select Product *
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    required
                    className="w-full p-3 bg-[#F7F8FC] border-2 border-[#0E1330] rounded-xl font-bold text-[#0E1330] focus:outline-none focus:border-[#2436F5]"
                  >
                    {products.map((prod) => (
                      <option key={prod.id} value={prod.id}>
                        {prod.name || prod.title} — Current Stock: {prod.stock ?? 0} units
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div className="space-y-1.5">
                  <label className="block font-heading font-extrabold text-[#0E1330] uppercase">
                    Quantity to Deduct *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    required
                    className="w-full p-3 bg-[#F7F8FC] border-2 border-[#0E1330] rounded-xl font-bold text-[#0E1330] focus:outline-none focus:border-[#2436F5]"
                  />
                </div>

                {/* Note / Reason */}
                <div className="space-y-1.5">
                  <label className="block font-heading font-extrabold text-[#0E1330] uppercase">
                    Note / Reason (Optional)
                  </label>
                  <input
                    type="text"
                    value={stockNote}
                    onChange={(e) => setStockNote(e.target.value)}
                    placeholder="e.g. Offline store sale / Damaged bottle replacement"
                    className="w-full p-3 bg-[#F7F8FC] border-2 border-[#0E1330] rounded-xl font-bold text-[#0E1330] focus:outline-none focus:border-[#2436F5]"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-[#FFFFFF] font-heading font-extrabold text-xs uppercase tracking-wider rounded-xl border-2 border-[#0E1330] shadow-[3px_3px_0px_#0E1330] flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Minus className="w-4 h-4 text-[#FFC933]" />
                  <span>{submitting ? 'Processing Transaction...' : 'Deduct Stock (Stock Out)'}</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: LOW STOCK ALERT */}
          {activeTab === 'low' && (
            <div className="space-y-4">
              <div className="bg-[#FFFFFF] p-5 rounded-[24px] border-2 border-[#0E1330] shadow-[4px_4px_0px_#0E1330] flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-heading font-extrabold text-[#0E1330] flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" /> Low Stock Items ({lowStockProducts.length})
                  </h2>
                  <p className="text-xs font-sans text-[#5B6079] mt-0.5">
                    Products at or below their low stock threshold limit. Sort by lowest stock first.
                  </p>
                </div>
              </div>

              {lowStockProducts.length === 0 ? (
                <div className="bg-[#FFFFFF] p-8 rounded-[24px] border-2 border-[#0E1330] text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p className="text-sm font-heading font-extrabold text-[#0E1330]">
                    All product inventory levels are healthy!
                  </p>
                  <p className="text-xs text-[#5B6079]">
                    No items are currently below their low stock threshold limit.
                  </p>
                </div>
              ) : (
                <div className="bg-[#FFFFFF] border-2 border-[#0E1330] rounded-[24px] shadow-[4px_4px_0px_#0E1330] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#F7F8FC] border-b-2 border-[#0E1330] text-[11px] font-heading font-extrabold uppercase tracking-wider text-[#0E1330]">
                          <th className="p-4">Product</th>
                          <th className="p-4">Category</th>
                          <th className="p-4">Current Stock</th>
                          <th className="p-4">Threshold</th>
                          <th className="p-4 text-right">Quick Restock</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-2 divide-[#0E1330]/10 text-xs font-sans text-[#0E1330]">
                        {lowStockProducts.map((prod) => {
                          const name = prod.name || prod.title || 'Untitled';
                          const category = prod.categoryName || prod.category || 'Attar';
                          const image = (Array.isArray(prod.images) && prod.images[0]) || prod.image || 'https://images.unsplash.com/photo-1547887537-6158d64c35b3';
                          const stock = typeof prod.stock === 'number' ? prod.stock : 0;
                          const threshold = prod.lowStockThreshold ?? 5;

                          return (
                            <tr key={prod.id} className="hover:bg-amber-50/50 transition-colors">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={image}
                                    alt={name}
                                    className="w-10 h-10 rounded-xl object-cover border-2 border-[#0E1330] shrink-0"
                                  />
                                  <span className="font-heading font-bold text-xs text-[#0E1330] truncate max-w-xs">
                                    {name}
                                  </span>
                                </div>
                              </td>
                              <td className="p-4 text-[#5B6079] font-bold">{category}</td>
                              <td className="p-4">
                                <span className="px-2.5 py-1 bg-red-100 text-red-700 border-2 border-[#0E1330] rounded-xl font-heading font-extrabold text-xs">
                                  {stock} units remaining
                                </span>
                              </td>
                              <td className="p-4 text-[#5B6079] font-bold">{threshold} units</td>
                              <td className="p-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleQuickStockIn(prod.id)}
                                  className="px-3 py-1.5 bg-[#FFC933] hover:bg-[#e6b42d] text-[#0E1330] font-heading font-extrabold text-[11px] rounded-xl border-2 border-[#0E1330] shadow-[2px_2px_0px_#0E1330] flex items-center gap-1 cursor-pointer ml-auto"
                                >
                                  <Plus className="w-3.5 h-3.5" /> Quick Stock In
                                </button>
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

          {/* TAB 5: STOCK HISTORY LOG */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {/* History Search & Filter Controls */}
              <div className="bg-[#FFFFFF] p-4 rounded-[20px] border-2 border-[#0E1330] shadow-[3px_3px_0px_#0E1330] grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-[#5B6079] absolute left-3 top-3" />
                  <input
                    type="text"
                    value={historySearchTerm}
                    onChange={(e) => setHistorySearchTerm(e.target.value)}
                    placeholder="Search history by product or admin email..."
                    className="w-full pl-9 pr-3 py-2 bg-[#F7F8FC] border-2 border-[#0E1330] rounded-xl text-xs font-bold text-[#0E1330] focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 bg-[#F7F8FC] border-2 border-[#0E1330] rounded-xl px-3 py-1.5">
                  <Filter className="w-4 h-4 text-[#5B6079] shrink-0" />
                  <select
                    value={historyTypeFilter}
                    onChange={(e) => setHistoryTypeFilter(e.target.value)}
                    className="w-full bg-transparent text-xs font-bold text-[#0E1330] focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Movement Types</option>
                    <option value="in">Stock In Only</option>
                    <option value="out">Stock Out Only</option>
                  </select>
                </div>
              </div>

              {movementsLoading ? (
                <div className="p-8 text-center space-y-2 bg-[#FFFFFF] border-2 border-[#0E1330] rounded-[24px]">
                  <div className="w-6 h-6 border-3 border-[#2436F5] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-bold text-[#5B6079]">Loading movement audit logs...</p>
                </div>
              ) : filteredMovements.length === 0 ? (
                <div className="bg-[#FFFFFF] p-8 rounded-[24px] border-2 border-[#0E1330] text-center space-y-2">
                  <FileText className="w-8 h-8 text-[#5B6079] mx-auto" />
                  <p className="text-sm font-heading font-extrabold text-[#0E1330]">
                    No stock movements recorded yet.
                  </p>
                  <p className="text-xs text-[#5B6079]">
                    Stock In and Stock Out actions performed by staff will appear here.
                  </p>
                </div>
              ) : (
                <div className="bg-[#FFFFFF] border-2 border-[#0E1330] rounded-[24px] shadow-[4px_4px_0px_#0E1330] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#F7F8FC] border-b-2 border-[#0E1330] text-[11px] font-heading font-extrabold uppercase tracking-wider text-[#0E1330]">
                          <th className="p-4">Date & Time</th>
                          <th className="p-4">Product Name</th>
                          <th className="p-4">Type</th>
                          <th className="p-4">Quantity</th>
                          <th className="p-4">Note / Reason</th>
                          <th className="p-4">Admin Staff</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-2 divide-[#0E1330]/10 text-xs font-sans text-[#0E1330]">
                        {filteredMovements.map((mov) => {
                          const isStockIn = mov.type === 'in';
                          const dateStr = mov.timestamp?.seconds
                            ? new Date(mov.timestamp.seconds * 1000).toLocaleString()
                            : 'Just now';

                          return (
                            <tr key={mov.id} className="hover:bg-[#F7F8FC] transition-colors">
                              <td className="p-4 font-bold text-[#5B6079] flex items-center gap-1.5 whitespace-nowrap">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{dateStr}</span>
                              </td>
                              <td className="p-4 font-heading font-bold text-[#0E1330]">
                                {mov.productName || 'Product'}
                              </td>
                              <td className="p-4">
                                <span
                                  className={`px-2.5 py-1 rounded-lg border text-[10px] font-heading font-extrabold uppercase flex items-center gap-1 w-fit ${
                                    isStockIn
                                      ? 'bg-emerald-100 text-emerald-800 border-emerald-600'
                                      : 'bg-rose-100 text-rose-800 border-rose-600'
                                  }`}
                                >
                                  {isStockIn ? (
                                    <>
                                      <ArrowDownRight className="w-3 h-3 text-emerald-600" /> Stock In
                                    </>
                                  ) : (
                                    <>
                                      <ArrowUpRight className="w-3 h-3 text-rose-600" /> Stock Out
                                    </>
                                  )}
                                </span>
                              </td>
                              <td className="p-4 font-heading font-extrabold text-sm">
                                <span className={isStockIn ? 'text-emerald-700' : 'text-rose-700'}>
                                  {isStockIn ? `+${mov.quantity}` : `-${mov.quantity}`} units
                                </span>
                              </td>
                              <td className="p-4 text-[#5B6079] italic max-w-xs truncate">
                                {mov.reason || '—'}
                              </td>
                              <td className="p-4 text-[#0E1330] font-bold flex items-center gap-1">
                                <UserCheck className="w-3.5 h-3.5 text-[#2436F5]" />
                                <span>{mov.adminEmail || 'Admin Staff'}</span>
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
        </>
      )}
    </div>
  );
}
