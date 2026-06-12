import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Clock, Search, Trash2, X, ArrowRight, Eye, ShoppingCart } from 'lucide-react';
import { Product } from '../types';
import TakaIcon from './TakaIcon';

export default function RecentlyViewed() {
  const { products, addToCart, cart, addToast } = useStore();
  const navigate = useNavigate();
  
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load from LocalStorage on mount
  useEffect(() => {
    try {
      const storedProducts = localStorage.getItem('recentlyViewedProducts');
      if (storedProducts) {
        setRecentlyViewedIds(JSON.parse(storedProducts));
      }
    } catch (e) {
      console.error('Failed to parse recently viewed products', e);
    }

    try {
      const storedSearches = localStorage.getItem('recentSearches');
      if (storedSearches) {
        setRecentSearches(JSON.parse(storedSearches));
      }
    } catch (e) {
      console.error('Failed to parse recent searches', e);
    }
  }, []);

  // Listen to Storage events to update in real-time across tabs / navigation
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const storedProducts = localStorage.getItem('recentlyViewedProducts');
        if (storedProducts) {
          setRecentlyViewedIds(JSON.parse(storedProducts));
        } else {
          setRecentlyViewedIds([]);
        }
      } catch (e) {
        console.error(e);
      }

      try {
        const storedSearches = localStorage.getItem('recentSearches');
        if (storedSearches) {
          setRecentSearches(JSON.parse(storedSearches));
        } else {
          setRecentSearches([]);
        }
      } catch (e) {
        console.error(e);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    // Custom event to trigger updates within the same window
    window.addEventListener('recentlyViewedUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('recentlyViewedUpdated', handleStorageChange);
    };
  }, []);

  // Resolve IDs to full Product objects
  const viewedProducts = recentlyViewedIds
    .map(id => products.find(p => p.id === id))
    .filter((p): p is Product => !!p);

  const clearRecentSearches = () => {
    localStorage.removeItem('recentSearches');
    setRecentSearches([]);
    window.dispatchEvent(new Event('recentlyViewedUpdated'));
    addToast('Search history cleared successfully', 'info');
  };

  const removeRecentSearch = (queryToRemove: string) => {
    const updated = recentSearches.filter(q => q !== queryToRemove);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
    setRecentSearches(updated);
    window.dispatchEvent(new Event('recentlyViewedUpdated'));
  };

  const clearRecentlyViewed = () => {
    localStorage.removeItem('recentlyViewedProducts');
    setRecentlyViewedIds([]);
    window.dispatchEvent(new Event('recentlyViewedUpdated'));
    addToast('Recently viewed history cleared', 'info');
  };

  const removeRecentlyViewedItem = (productId: string) => {
    const updated = recentlyViewedIds.filter(id => id !== productId);
    localStorage.setItem('recentlyViewedProducts', JSON.stringify(updated));
    setRecentlyViewedIds(updated);
    window.dispatchEvent(new Event('recentlyViewedUpdated'));
  };

  const handleQueryClick = (query: string) => {
    navigate(`/products?search=${encodeURIComponent(query)}`);
  };

  if (viewedProducts.length === 0 && recentSearches.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 rounded-2xl p-6 sm:p-8 mt-10 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md">
      <div className="flex flex-col gap-8">
        
        {/* Recent Searches Section */}
        {recentSearches.length > 0 && (
          <div className="border-b border-slate-100 pb-6 last:border-b-0 last:pb-0">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200">
                <div className="bg-indigo-50 text-indigo-600 p-2 rounded-lg">
                  <Search className="w-5 h-5" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="font-bold text-base tracking-tight text-slate-900 dark:text-white">Recent Search Queries</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Pick up right where you left off in your search</p>
                </div>
              </div>
              <button
                onClick={clearRecentSearches}
                className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-rose-600 flex items-center gap-1.5 transition-colors bg-slate-50 dark:bg-slate-950 hover:bg-rose-50 px-3 py-1.5 rounded-lg border border-transparent hover:border-rose-100 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear All Queries
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {recentSearches.map((query, index) => (
                <div
                  key={index}
                  className="group flex items-center bg-slate-50 dark:bg-slate-950 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-200 rounded-xl px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 transition-all cursor-pointer font-medium"
                  onClick={() => handleQueryClick(query)}
                >
                  <Search className="w-3.5 h-3.5 mr-2 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                  <span className="truncate max-w-[150px]">{query}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRecentSearch(query);
                    }}
                    className="ml-2 hover:bg-slate-200 dark:bg-slate-700 hover:text-slate-900 dark:text-white text-slate-400 p-0.5 rounded-full transition-colors cursor-pointer"
                    title="Remove item"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recently Viewed Products Section */}
        {viewedProducts.length > 0 && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200">
                <div className="bg-indigo-50 text-indigo-600 p-2 rounded-lg">
                  <Clock className="w-5 h-5" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="font-bold text-base tracking-tight text-slate-900 dark:text-white">Recently Viewed Hardware</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Quickly revisit components you viewed recently</p>
                </div>
              </div>
              <button
                onClick={clearRecentlyViewed}
                className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-rose-600 flex items-center gap-1.5 transition-colors bg-slate-50 dark:bg-slate-950 hover:bg-rose-50 px-3 py-1.5 rounded-lg border border-transparent hover:border-rose-100 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Products
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {viewedProducts.map((p) => {
                const isOutOfStock = p.stockStatus === 'Out of Stock' || p.inventoryCount === 0;
                const hasDiscount = p.discountPrice !== undefined && p.discountPrice > 0;
                const displayPrice = hasDiscount ? p.discountPrice! : p.price;
                const isInCart = cart.some(item => item.product.id === p.id);

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      navigate(`/products/${p.id}`);
                      window.scrollTo(0, 0);
                    }}
                    className="group bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-slate-150 hover:border-indigo-400 rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-300 relative cursor-pointer flex flex-col justify-between h-full overflow-hidden"
                  >
                    {/* Remove individual from recently viewed */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeRecentlyViewedItem(p.id);
                      }}
                      className="absolute top-2 right-2 p-1 bg-white dark:bg-slate-900 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-full text-slate-400 transition-all z-10 shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
                      title="Remove from recently viewed"
                    >
                      <X className="w-3 h-3" />
                    </button>

                    <div>
                      {/* Image Thumbnail */}
                      <div className="aspect-square bg-white dark:bg-slate-900 rounded-lg p-2 flex items-center justify-center overflow-hidden border border-slate-100 mb-3 group-hover:scale-105 transition-transform duration-300 mix-blend-multiply relative">
                        <img
                          src={p.imageUrl}
                          alt={p.title}
                          className="max-w-full max-h-full object-contain"
                        />
                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-white dark:bg-slate-900/60 flex items-center justify-center">
                            <span className="text-[10px] bg-rose-50 border border-rose-200 text-rose-600 font-bold px-1.5 py-0.5 rounded-full select-none">
                              Sold Out
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Brand & Title */}
                      <div className="text-[10px] font-semibold text-indigo-600 mb-0.5 select-none font-mono uppercase tracking-wider">
                        {p.brand || 'Premium'}
                      </div>
                      <h4
                        className="font-bold text-xs text-slate-800 dark:text-slate-200 line-clamp-2 leading-tight tracking-tight group-hover:text-indigo-600 transition-colors"
                        title={p.title}
                      >
                        {p.title}
                      </h4>
                    </div>

                    {/* Price and Add to Cart mini actions */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950 px-1.5 py-0.5 rounded flex items-center whitespace-nowrap">
                        <TakaIcon className="w-3 h-3 mr-[1px] text-slate-600 dark:text-slate-400" />
                        {Number(displayPrice).toLocaleString('en-IN', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </span>

                      {!isOutOfStock && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isInCart) {
                              navigate('/cart');
                            } else {
                              addToCart(p, 1);
                              addToast('Added to cart', 'success');
                            }
                          }}
                          className={`p-1.5 rounded-lg transition-all border ${
                            isInCart
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100'
                              : 'bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-indigo-600 border-transparent'
                          } cursor-pointer`}
                          title={isInCart ? 'Already in cart' : 'Add to cart'}
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
