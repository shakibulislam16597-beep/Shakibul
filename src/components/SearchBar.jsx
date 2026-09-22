import React, { useState, useEffect, useRef } from 'react';
import { Search, Camera, X, History, Trash2, ArrowRight, Tag, AlertCircle } from 'lucide-react';
import { MOCK_PRODUCTS, INITIAL_RECENT_SEARCHES } from '../data/products';
import { formatBDT } from '../utils/currency';

/**
 * SearchBar Component - Extrovat Lifestyle
 * Full width, pill-shaped search input for Row 2 of header
 */
export default function SearchBar({
  onSearchSubmit,
  onSelectProduct,
  autoFocus = false,
  products = MOCK_PRODUCTS
}) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isFocused, setIsFocused] = useState(autoFocus);
  const [recentSearches, setRecentSearches] = useState(INITIAL_RECENT_SEARCHES);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Debounce input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);

    return () => clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const suggestionsList = Array.isArray(products) && products.length > 0 ? products : MOCK_PRODUCTS;

  const suggestions = debouncedQuery.length > 0
    ? suggestionsList.filter((prod) =>
        (prod.title || prod.name || '').toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        (prod.category || prod.categoryName || '').toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        (prod.note && prod.note.toLowerCase().includes(debouncedQuery.toLowerCase()))
      )
    : [];

  const showRecentSearches = isFocused && query.trim().length === 0;
  const showSuggestions = isFocused && query.trim().length > 0;

  const totalItems = showRecentSearches
    ? recentSearches.length
    : showSuggestions
    ? suggestions.length
    : 0;

  const handleClear = () => {
    setQuery('');
    setDebouncedQuery('');
    setSelectedIndex(-1);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleRemoveRecent = (e, indexToRemove) => {
    e.stopPropagation();
    setRecentSearches((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const executeSearch = (searchTerm) => {
    if (!searchTerm || !searchTerm.trim()) return;
    const cleanTerm = searchTerm.trim();

    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== cleanTerm.toLowerCase());
      return [cleanTerm, ...filtered].slice(0, 6);
    });

    setIsFocused(false);
    if (onSearchSubmit) {
      onSearchSubmit(cleanTerm);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (totalItems > 0) {
        setSelectedIndex((prev) => (prev + 1) % totalItems);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (totalItems > 0) {
        setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < totalItems) {
        if (showRecentSearches) {
          const selectedTerm = recentSearches[selectedIndex];
          setQuery(selectedTerm);
          executeSearch(selectedTerm);
        } else if (showSuggestions) {
          const selectedProd = suggestions[selectedIndex];
          if (onSelectProduct) {
            onSelectProduct(selectedProd);
            setIsFocused(false);
          } else {
            executeSearch(selectedProd.title);
          }
        }
      } else {
        executeSearch(query);
      }
    } else if (e.key === 'Escape') {
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-7xl mx-auto my-0 px-0">
      {/* Pill Search Input */}
      <div
        className={`relative flex items-center w-full h-10 sm:h-11 rounded-full border transition-all duration-200 bg-gray-50 dark:bg-[#181F48] ${
          isFocused
            ? 'border-[#0E1330] dark:border-[#FFC933] ring-2 ring-[#FFC933] bg-white dark:bg-[#0E1330] shadow-sm'
            : 'border-gray-300 dark:border-gray-700 hover:border-gray-400'
        }`}
      >
        {/* Left Search Icon */}
        <div className="pl-3.5 pr-1 text-gray-500 dark:text-gray-400 flex items-center justify-center shrink-0">
          <Search className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search for products, brands and more"
          aria-label="Search for products, brands and more"
          aria-expanded={showRecentSearches || showSuggestions}
          aria-autocomplete="list"
          role="combobox"
          className="w-full py-1.5 pl-1 pr-2 text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none font-medium bg-transparent rounded-full"
        />

        {/* Right Actions */}
        <div className="pr-3 flex items-center gap-1 shrink-0">
          {query.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search input"
              className="p-1 rounded-full text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FFC933]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setCameraModalOpen(true)}
            aria-label="Search by image camera"
            title="Search by image"
            className="p-1.5 rounded-full text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FFC933]"
          >
            <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isFocused && (
        <div
          role="listbox"
          aria-label="Search suggestions"
          className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-[#0E1330] rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden z-50 animate-in fade-in duration-150 text-gray-900 dark:text-white"
        >
          {/* RECENT SEARCHES */}
          {showRecentSearches && (
            <div className="p-3">
              <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400">
                <span className="flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-gray-500" /> Recent Searches
                </span>
                {recentSearches.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setRecentSearches([])}
                    className="text-[11px] text-gray-500 hover:text-black dark:hover:text-white hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {recentSearches.length > 0 ? (
                <div className="mt-1 space-y-0.5">
                  {recentSearches.map((item, idx) => {
                    const isSelected = selectedIndex === idx;
                    return (
                      <div
                        key={idx}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          setQuery(item);
                          executeSearch(item);
                        }}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#0E1330] text-white dark:bg-[#2436F5] font-semibold'
                            : 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate pr-2">
                          <History className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                          <span className="truncate">{item}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleRemoveRecent(e, idx)}
                          aria-label={`Remove ${item} from recent searches`}
                          className={`p-1 rounded-lg transition-colors ${
                            isSelected ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400'
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-gray-400">
                  No recent searches
                </div>
              )}
            </div>
          )}

          {/* LIVE SUGGESTIONS */}
          {showSuggestions && (
            <div className="p-3 max-h-[60vh] overflow-y-auto">
              <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center justify-between">
                <span>Matching Products ({suggestions.length})</span>
                {debouncedQuery.length > 0 && query !== debouncedQuery && (
                  <span className="text-[10px] text-gray-500 animate-pulse">Searching...</span>
                )}
              </div>

              {suggestions.length > 0 ? (
                <div className="mt-1 space-y-1">
                  {suggestions.map((prod, idx) => {
                    const isSelected = selectedIndex === idx;
                    return (
                      <div
                        key={prod.id}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          if (onSelectProduct) {
                            onSelectProduct(prod);
                            setIsFocused(false);
                          } else {
                            executeSearch(prod.title);
                          }
                        }}
                        className={`flex items-center gap-3 p-2 rounded-xl transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-gray-100 dark:bg-gray-800 ring-1 ring-[#0E1330] dark:ring-[#FFC933]'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/60'
                        }`}
                      >
                        <div className="relative w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0 border border-gray-200 dark:border-gray-700">
                          <img
                            src={prod.image}
                            alt={prod.title}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            <span>{prod.category}</span>
                          </div>
                          <div className="text-xs font-bold text-gray-900 dark:text-white truncate">
                            {prod.title}
                          </div>
                          <div className="flex items-center gap-2 text-xs mt-0.5">
                            <span className="font-extrabold text-[#0E1330] dark:text-[#FFC933]">
                              {formatBDT(prod.price)}
                            </span>
                            {prod.oldPrice && (
                              <span className="line-through text-gray-400 text-[11px]">
                                {formatBDT(prod.oldPrice)}
                              </span>
                            )}
                          </div>
                        </div>

                        <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-6 text-center px-4">
                  <AlertCircle className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                    No matching products found
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Try searching for "Oud", "Musk", or "Attar"
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Camera Search Modal */}
      {cameraModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0E1330] rounded-2xl max-w-sm w-full p-6 text-center border border-gray-100 dark:border-gray-700 shadow-2xl relative text-gray-900 dark:text-white">
            <button
              type="button"
              onClick={() => setCameraModalOpen(false)}
              className="absolute top-3 right-3 p-1.5 rounded-full text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#FFC933]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-black dark:text-white mx-auto mb-4 border border-gray-200 dark:border-gray-700">
              <Camera className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold mb-1">
              Visual Scent Search
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
              Take or upload a photo of any perfume bottle to instantly find matching products in Extrovat store.
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setCameraModalOpen(false);
                  executeSearch('Oud');
                }}
                className="w-full py-2.5 px-4 bg-[#0E1330] dark:bg-[#2436F5] text-white rounded-xl text-sm font-bold hover:bg-[#2436F5] transition-colors cursor-pointer uppercase focus:outline-none focus:ring-2 focus:ring-[#FFC933]"
              >
                Upload Photo Sample
              </button>
              <button
                type="button"
                onClick={() => setCameraModalOpen(false)}
                className="w-full py-2.5 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-[#FFC933]"
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
