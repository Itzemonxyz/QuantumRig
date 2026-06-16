import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store';
import { Monitor, ShoppingCart, User as UserIcon, LogOut, Package, Shield, Search, Bell, Tag, Moon, Sun } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import BottomNav from './BottomNav';
import CompareWidget from './CompareWidget';
import { api } from '../lib/api';
import SupportChat from './SupportChat';
import ToastContainer from './ToastContainer';
import TakaIcon from './TakaIcon';
import SocialIcon from './SocialIcon';

export default function Layout() {
  const { user, cart, settings, socialLinks, logout, products, categories, token, notifications, setNotifications, markNotificationRead, theme, setTheme } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMiniCart, setShowMiniCart] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchSelectedIndex, setSearchSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('recentSearches');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Sync state if localStorage changes globally
  useEffect(() => {
    const syncSearches = () => {
      try {
        const stored = localStorage.getItem('recentSearches');
        setRecentSearches(stored ? JSON.parse(stored) : []);
      } catch (e) {
        console.error(e);
      }
    };
    window.addEventListener('recentlyViewedUpdated', syncSearches);
    window.addEventListener('storage', syncSearches);
    return () => {
      window.removeEventListener('recentlyViewedUpdated', syncSearches);
      window.removeEventListener('storage', syncSearches);
    };
  }, []);

  const saveRecentSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setRecentSearches(prev => {
      const updated = [trimmed, ...prev.filter(q => q && typeof q === 'string' && q.toLowerCase() !== trimmed.toLowerCase())].slice(0, 10);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
      // Notify other components
      window.dispatchEvent(new Event('recentlyViewedUpdated'));
      return updated;
    });
  };

  const handleSearchSubmit = (query: string) => {
    saveRecentSearch(query);
    navigate(`/products?search=${encodeURIComponent(query.trim())}`);
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        (searchRef.current && !searchRef.current.contains(event.target as Node)) &&
        (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target as Node))
      ) {
        setIsSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInputFocused = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        (activeEl as HTMLElement).isContentEditable
      );

      const key = (e.key || '').toLowerCase();

      // Alt + C opens the cart
      if (e.altKey && key === 'c') {
        e.preventDefault();
        navigate('/cart');
        return;
      }

      // If user is focused on an input, ignore single-character shortcuts
      if (isInputFocused) return;

      if (key === 's') {
        e.preventDefault();
        setIsSearchOpen(true);
        searchInputRef.current?.focus();
      } else if (key === 'p') {
        e.preventDefault();
        navigate('/profile');
      } else if (key === 'b') {
        e.preventDefault();
        navigate('/builder');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  useEffect(() => {
    const handleGlobalEnter = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        const activeEl = document.activeElement as HTMLElement | null;
        if (activeEl && activeEl.tagName === 'INPUT' && activeEl.closest('form')) {
          const type = (activeEl as HTMLInputElement).type;
          
          if (!['submit', 'button', 'reset', 'checkbox', 'radio', 'file'].includes(type)) {
            e.preventDefault();
            
            // Limit to form elements
            const form = activeEl.closest('form');
            if (form) {
              const focusableElements = Array.from(
                form.querySelectorAll<HTMLElement>(
                  'input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), button[type="submit"]:not([disabled])'
                )
              ).filter(el => {
                const bounds = el.getBoundingClientRect();
                return bounds.width > 0 && bounds.height > 0;
              });
              
              const index = focusableElements.indexOf(activeEl);
              if (index > -1) {
                // Focus the next element. If it's the last, optionally stay or blur, but typically just focus the next focusable item (submit button).
                 if (index + 1 < focusableElements.length) {
                   focusableElements[index + 1].focus();
                 }
              }
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleGlobalEnter, true);
    return () => window.removeEventListener('keydown', handleGlobalEnter, true);
  }, []);

  useEffect(() => {
    if (user && token) {
      api.get('/users/me/notifications', token).then(data => {
        if (data && Array.isArray(data)) setNotifications(data);
      }).catch(console.error);
    }
  }, [user, token, setNotifications]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleNotifClick = (n: any) => {
    if (!n.read && token) {
      api.put(`/users/me/notifications/${n.id}/read`, {}, token).catch(console.error);
      markNotificationRead(n.id);
    }
    if (n.link) {
      navigate(n.link);
      setShowNotifications(false);
    }
  };

  const unreadCount = (notifications || []).filter(n => !n.read).length;

  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const [isShaking, setIsShaking] = useState(false);
  const prevCartCount = useRef(cartItemsCount);

  useEffect(() => {
    if (cartItemsCount > prevCartCount.current) {
      setIsShaking(true);
      const timer = setTimeout(() => setIsShaking(false), 400);
      return () => clearTimeout(timer);
    }
    prevCartCount.current = cartItemsCount;
  }, [cartItemsCount]);

  const searchResults = searchQuery.trim() 
    ? products.filter(p => 
        (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (p.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.brand || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.code || '').toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  const categoryResults = searchQuery.trim()
    ? categories.filter(c => (c.name || '').toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 3)
    : [];

  const selectableOptions: { type: 'recent' | 'category' | 'product' | 'viewAll'; id?: string; value: string; data?: any }[] = [];
  
  if (searchQuery.trim() === '' && recentSearches.length > 0) {
    recentSearches.forEach(rs => selectableOptions.push({ type: 'recent', value: rs }));
  }
  if (categoryResults.length > 0) {
    categoryResults.forEach(cat => selectableOptions.push({ type: 'category', value: cat.name, id: cat.id, data: cat }));
  }
  if (searchResults.length > 0) {
    searchResults.forEach(p => selectableOptions.push({ type: 'product', id: p.id, value: p.title, data: p }));
  }
  if (searchResults.length > 0 || categoryResults.length > 0) {
    selectableOptions.push({ type: 'viewAll', value: 'View all results' });
  }

  const getOptionIndex = (type: string, idOrValue: string) => {
    return selectableOptions.findIndex(o => o.type === type && (o.id === idOrValue || o.value === idOrValue));
  };

  const executeSearchSelection = () => {
    if (searchSelectedIndex >= 0 && searchSelectedIndex < selectableOptions.length) {
       const selected = selectableOptions[searchSelectedIndex];
       if (selected.type === 'recent') {
          handleSearchSubmit(selected.value);
       } else if (selected.type === 'category') {
          navigate(`/products?category=${selected.id}`);
          setSearchQuery('');
          setIsSearchOpen(false);
       } else if (selected.type === 'product') {
          navigate(`/products/${selected.id}`);
          setSearchQuery('');
          setIsSearchOpen(false);
       } else if (selected.type === 'viewAll') {
          navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
          setSearchQuery('');
          setIsSearchOpen(false);
       }
    } else {
       if (searchQuery.trim()) {
         handleSearchSubmit(searchQuery);
       } else {
         navigate('/products');
       }
       setSearchQuery('');
       setIsSearchOpen(false);
    }
  };

  const searchDropdownContent = (
    <div className="max-h-[28rem] overflow-y-auto overflow-x-hidden">
      {searchQuery.trim() === '' && recentSearches.length > 0 && (
        <div className="p-3 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50">
          <div className="flex items-center justify-between px-2 mb-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recent Searches</h4>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setRecentSearches([]);
                localStorage.removeItem('recentSearches');
              }}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Clear
            </button>
          </div>
          <div className="flex flex-wrap gap-2 px-2">
            {recentSearches.map((rs, idx) => {
              const isActive = getOptionIndex('recent', rs) === searchSelectedIndex;
              return (
                <button
                  key={idx}
                  onClick={() => handleSearchSubmit(rs)}
                  className={`px-3 py-1.5 border rounded-lg text-sm transition-colors shadow-sm ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 text-indigo-700 dark:text-indigo-400' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-300 hover:text-indigo-600'}`}
                >
                  {rs}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {categoryResults.length > 0 && (
        <div className="p-3 border-b border-slate-100 dark:border-slate-800/60">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Categories</h4>
          {categoryResults.map(cat => {
            const isActive = getOptionIndex('category', cat.name) === searchSelectedIndex;
            return (
              <div
                key={cat.id}
                onClick={() => {
                  navigate(`/products?category=${cat.id}`);
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className={`px-2 py-2 text-sm font-medium rounded-lg cursor-pointer flex items-center transition-colors ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-950 hover:text-indigo-600'}`}
              >
                <Search className={`w-4 h-4 mr-2 ${isActive ? 'text-indigo-500' : 'text-slate-400'}`} />
                {cat.name}
              </div>
            );
          })}
        </div>
      )}

      {searchResults.length > 0 ? (
        <div className="p-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-3 pt-2">Products</h4>
          {searchResults.map(product => {
            const isActive = getOptionIndex('product', product.id) === searchSelectedIndex;
            return (
              <div 
                key={product.id}
                onClick={() => {
                  navigate(`/products/${product.id}`);
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className={`flex items-center space-x-4 p-3 cursor-pointer rounded-xl transition-colors group ${isActive ? 'bg-indigo-50/80 dark:bg-indigo-900/20 ring-1 ring-indigo-200 dark:ring-indigo-800' : 'hover:bg-slate-50 dark:bg-slate-950'}`}
              >
                <img src={product.imageUrl} alt={product.title} className={`w-12 h-12 object-contain bg-white dark:bg-slate-900 rounded-lg border ${isActive ? 'border-indigo-200 dark:border-indigo-700' : 'border-slate-100 dark:border-slate-800/60 group-hover:border-indigo-100'}`} />
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-bold truncate transition-colors ${isActive ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-900 dark:text-white group-hover:text-indigo-600'}`}>{product.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{product.categoryId ? categories.find(c => c.id === product.categoryId)?.name : ''}</p>
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
                  <TakaIcon className="w-3.5 h-3.5 mr-[1px]" />{Number(product.price || 0).toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </div>
              </div>
            );
          })}
        </div>
      ) : searchQuery.trim() !== '' && categoryResults.length === 0 ? (
        <div className="p-8 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center">
          <Package className="w-8 h-8 text-slate-300 mb-2" />
          <p className="text-sm font-medium">No results found for "{searchQuery}"</p>
          <p className="text-xs text-slate-400 mt-1">Try a different keyword or check for typos.</p>
        </div>
      ) : null}
      
      {(searchResults.length > 0 || categoryResults.length > 0) && (
        <div className="p-2 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950 sticky bottom-0">
          <button
            onClick={() => {
              navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
              setSearchQuery('');
              setIsSearchOpen(false);
            }}
            className={`w-full py-2 text-sm font-bold rounded-lg transition-colors ${getOptionIndex('viewAll', 'View all results') === searchSelectedIndex ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700' : 'text-indigo-600 hover:text-indigo-700 hover:bg-slate-100 dark:bg-slate-800'}`}
          >
            View all results
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-white">
      <header className="hidden md:block bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24">
            <Link to="/" className="flex items-center space-x-2 text-indigo-600 shrink-0">
              <img src="/logo-primary.svg" alt="QuantumRig" className="h-10 sm:h-14 md:h-20 w-auto shrink-0 max-w-none" />
            </Link>
            
            <div className="hidden md:flex flex-1 max-w-2xl mx-8 relative" ref={searchRef}>
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search products, brands, categories... (Press 'S')"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setSearchSelectedIndex(prev => Math.min(prev + 1, selectableOptions.length - 1));
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setSearchSelectedIndex(prev => Math.max(prev - 1, -1));
                    } else if (e.key === 'Enter') {
                      executeSearchSelection();
                    }
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:bg-white dark:bg-slate-900 focus:border-indigo-500 rounded-xl text-sm transition-colors outline-none border focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
              
              <AnimatePresence>
                {isSearchOpen && (searchQuery.trim() !== '' || recentSearches.length > 0) && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-14 left-0 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl shadow-indigo-900/10 overflow-hidden z-50"
                  >
                    {searchDropdownContent}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="hidden md:flex items-center space-x-6">
              <Link to="/offers" className="flex items-center space-x-1 text-slate-600 dark:text-slate-400 hover:text-indigo-600 font-medium transition-colors">
                <Tag className="w-5 h-5" />
                <span>Offers</span>
              </Link>
              
              <div 
                className="relative group"
                onMouseEnter={() => setShowMiniCart(true)}
                onMouseLeave={() => setShowMiniCart(false)}
              >
                <Link to="/cart" title="Cart (Press 'Alt+C')" className="relative text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors flex items-center h-full py-4">
                  <motion.div animate={isShaking ? { rotate: [0, -15, 15, -15, 15, 0], scale: [1, 1.2, 1] } : {}} transition={{ duration: 0.4 }}>
                    <ShoppingCart className="w-6 h-6" />
                  </motion.div>
                  <AnimatePresence mode="popLayout">
                    {cartItemsCount > 0 && (
                      <motion.span 
                        key={cartItemsCount}
                        initial={{ scale: 0, y: -15, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 15 }}
                        className="absolute top-2 -right-2 bg-rose-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center font-mono z-10">
                        {cartItemsCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>

                {/* Mini Cart Dropdown */}
                <AnimatePresence>
                  {showMiniCart && cartItemsCount > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 top-full mt-1 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                        <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <ShoppingCart className="w-4 h-4 text-indigo-600" />
                          Your Cart
                        </h4>
                        <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                          {cartItemsCount} items
                        </span>
                      </div>
                      
                      <div className="max-h-80 overflow-y-auto p-4 space-y-4">
                        {cart.map((item) => (
                          <div key={item.product.id} className="flex gap-3">
                            <div className="w-16 h-16 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                              {item.product.imageUrl ? (
                                <img src={item.product.imageUrl} alt={item.product.title} className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-6 h-6 text-slate-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="text-sm font-bold text-slate-900 dark:text-white truncate" title={item.product.title}>{item.product.title}</h5>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Qty: {item.quantity}</p>
                              <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-1 flex items-center"><TakaIcon className="w-3 h-3 mr-[1px]" />{(item.product.price * item.quantity).toLocaleString("en-BD", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800/60">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">Subtotal</span>
                          <span className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
                            <TakaIcon className="w-4 h-4 mr-[1px]" />{cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0).toLocaleString("en-BD", {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Link 
                            to="/cart" 
                            className="text-center py-2 px-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 text-slate-700 dark:text-slate-300 font-medium text-sm hover:bg-slate-50 dark:bg-slate-950 transition-colors"
                          >
                            View Cart
                          </Link>
                          <Link 
                            to="/checkout" 
                            className="text-center py-2 px-4 rounded-lg bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 transition-colors shadow-sm"
                          >
                            Checkout
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {user && (
                <div className="relative" ref={notifRef}>
                  <button onClick={() => setShowNotifications(!showNotifications)} className="relative text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors">
                    <Bell className="w-6 h-6" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white font-mono">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800/60 overflow-hidden z-50 text-slate-900 dark:text-white"
                      >
                        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                          <h3 className="font-bold">Notifications</h3>
                          {unreadCount > 0 && <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount} New</span>}
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                           {(!notifications || notifications.length === 0) ? (
                            <div className="p-6 text-center text-slate-500 dark:text-slate-400 text-sm">You have no notifications</div>
                          ) : (
                            notifications.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((n) => (
                              <button
                                key={n.id}
                                onClick={() => handleNotifClick(n)}
                                className={`w-full text-left p-4 border-b border-slate-50 hover:bg-slate-50 dark:bg-slate-950 transition-colors ${!n.read ? 'bg-indigo-50/50' : ''}`}
                              >
                                <p className={`text-sm ${!n.read ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>{n.message}</p>
                                <p className="text-xs text-slate-400 mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
                              </button>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              
              {user ? (
                <div className="flex items-center space-x-4">
                  {user.role === 'admin' && (
                    <Link to="/admin" className="relative p-2 flex items-center justify-center text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors" title="Admin Workspace">
                      <Shield className="w-5 h-5" />
                    </Link>
                  )}
                  
                  <div className="relative group">
                    <Link to="/profile" className="flex items-center transition-transform hover:scale-105" title="User Profile (Press 'P')">
                      {user.avatar ? (
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-indigo-600 shadow-sm relative shrink-0">
                          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm tracking-tight border-2 border-indigo-200 shadow-sm shrink-0">
                          {user.name ? user.name.slice(0, 2).toUpperCase() : 'UR'}
                        </div>
                      )}
                    </Link>
                    
                    {/* User Panel Dropdown */}
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl shadow-slate-200/50 border border-slate-100 dark:border-slate-800/60 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 translate-y-2 group-hover:translate-y-0 pb-1">
                      <div className="p-4 border-b border-slate-100 dark:border-slate-800/60">
                        <p className="font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                      </div>
                      <div className="px-2 py-2">
                        <Link to="/profile" className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:bg-slate-50 dark:bg-slate-950 rounded-lg transition-colors">
                          <UserIcon className="w-4 h-4" />
                          <span>My Profile</span>
                        </Link>
                        <Link to="/profile?tab=orders" className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:bg-slate-50 dark:bg-slate-950 rounded-lg transition-colors">
                          <Package className="w-4 h-4" />
                          <span>My Orders</span>
                        </Link>
                      </div>
                      <div className="border-t border-slate-100 dark:border-slate-800/60 px-2 py-2">
                        <button 
                          onClick={() => {
                            logout();
                            window.location.href = '/login';
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-lg transition-colors font-medium"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <Link to="/login" className="flex items-center space-x-1 text-slate-600 dark:text-slate-400 hover:text-indigo-600 font-medium transition-colors">
                  <UserIcon className="w-5 h-5" />
                  <span>Login</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* Mobile Sticky Header */}
      <header className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowMobileMenu(true)}
              className="p-2 -ml-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            </button>
            <Link to="/" className="shrink-0">
              <img src="/favicon.svg" alt="QuantumRig" className="h-8 w-auto" />
            </Link>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative flex-1" ref={mobileSearchRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search products, brands, anything..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setSearchSelectedIndex(prev => Math.min(prev + 1, selectableOptions.length - 1));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setSearchSelectedIndex(prev => Math.max(prev - 1, -1));
                } else if (e.key === 'Enter') {
                  executeSearchSelection();
                }
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:bg-slate-900 focus:border-indigo-500 rounded-full text-sm outline-none border focus:ring-2 focus:ring-indigo-500/50"
            />
            
            <AnimatePresence>
              {isSearchOpen && (searchQuery.trim() !== '' || recentSearches.length > 0) && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-12 left-0 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl shadow-indigo-900/10 overflow-hidden z-50"
                >
                  {searchDropdownContent}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Global Mobile Slide-in Menu */}
      <AnimatePresence>
        {showMobileMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileMenu(false)}
              className="md:hidden fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="md:hidden fixed inset-y-0 left-0 z-[70] w-72 bg-white dark:bg-slate-900 shadow-2xl border-r border-slate-200 dark:border-slate-800 flex flex-col"
            >
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <Link to="/" onClick={() => setShowMobileMenu(false)} className="flex items-center">
                  <img src="/logo-primary.svg" alt="QuantumRig" className="h-8 w-auto" />
                </Link>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-4">
                <nav className="px-4 space-y-1">
                  <Link
                    to="/"
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center px-4 py-3 text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 rounded-xl transition-colors"
                  >
                    Home
                  </Link>
                  <Link
                    to="/products"
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center px-4 py-3 text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 rounded-xl transition-colors"
                  >
                    <Package className="w-5 h-5 mr-3 text-slate-400" />
                    All Products
                  </Link>
                  <Link
                    to="/offers"
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center px-4 py-3 text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 rounded-xl transition-colors"
                  >
                    <Tag className="w-5 h-5 mr-3 text-slate-400" />
                    Special Offers
                  </Link>
                  <Link
                    to="/builder"
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center px-4 py-3 text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 rounded-xl transition-colors"
                  >
                    <Monitor className="w-5 h-5 mr-3 text-slate-400" />
                    PC Builder Tool
                  </Link>
                </nav>

                <div className="mt-8 px-8">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Categories</h3>
                  <div className="space-y-4">
                    {categories.slice(0, 6).map(cat => (
                      <Link
                        key={cat.id}
                        to={`/products?category=${cat.id}`}
                        onClick={() => setShowMobileMenu(false)}
                        className="block text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors font-medium"
                      >
                        {cat.name}
                      </Link>
                    ))}
                    <Link
                      to="/products"
                      onClick={() => setShowMobileMenu(false)}
                      className="block text-sm text-indigo-600 font-bold hover:underline"
                    >
                      View all categories →
                    </Link>
                  </div>
                </div>
              </div>
              {user ? (
                <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center space-x-3 mb-4 px-2">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-800" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm tracking-tight border border-indigo-200">
                        {user.name ? user.name.slice(0, 2).toUpperCase() : 'UR'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setShowMobileMenu(false);
                      window.location.href = '/login';
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </button>
                </div>
              ) : (
                <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                  <Link
                    to="/login"
                    onClick={() => setShowMobileMenu(false)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm"
                  >
                    <UserIcon className="w-4 h-4" />
                    Log In / Sign Up
                  </Link>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 relative pb-16 sm:pb-0">
        <div className="flex-1 w-full h-full">
          <Outlet />
        </div>
      </main>

      <footer className="bg-[#111827] text-slate-400 py-12 pb-24 sm:pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="col-span-12 md:col-span-4">
            <Link to="/" className="flex items-center space-x-2 text-white mb-4 shrink-0">
              <img src="/logo-white.svg" alt="QuantumRig" className="h-10 sm:h-14 md:h-16 w-auto shrink-0 max-w-none" />
            </Link>
            <p className="text-sm max-w-sm">The ultimate destination for PC components and custom builds. We deliver the components to power your dreams.</p>
          </div>
          <div className="col-span-12 md:col-span-2">
            <h3 className="text-white font-medium mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/products" className="hover:text-white transition-colors">All Products</Link></li>
              <li><Link to="/builder" className="hover:text-white transition-colors">PC Builder Tool</Link></li>
              <li><Link to="/cart" className="hover:text-white transition-colors">Cart</Link></li>
            </ul>
          </div>
          <div className="col-span-12 md:col-span-2">
            <h3 className="text-white font-medium mb-4">Connect With Us</h3>
            <ul className="space-y-3 text-sm">
              {socialLinks.map(link => (
                <li key={link.id}>
                  <a href={link.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:text-white transition-colors group">
                    <SocialIcon link={link} className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                    <span>{link.name}</span>
                  </a>
                </li>
              ))}
              {socialLinks.length === 0 && (
                <>
                  {settings?.facebookUrl && (
                    <li>
                      <a href={settings.facebookUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:text-white transition-colors group">
                        <SocialIcon link={{ id: '1', name: 'Facebook', url: settings.facebookUrl, icon: 'facebook' }} className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                        <span>Facebook</span>
                      </a>
                    </li>
                  )}
                  {settings?.whatsappUrl && (
                    <li>
                      <a href={settings.whatsappUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:text-white transition-colors group">
                        <SocialIcon link={{ id: '2', name: 'WhatsApp', url: settings.whatsappUrl, icon: 'whatsapp' }} className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                        <span>WhatsApp</span>
                      </a>
                    </li>
                  )}
                  {settings?.instagramUrl && (
                    <li>
                      <a href={settings.instagramUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:text-white transition-colors group">
                        <SocialIcon link={{ id: '3', name: 'Instagram', url: settings.instagramUrl, icon: 'instagram' }} className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                        <span>Instagram</span>
                      </a>
                    </li>
                  )}
                </>
              )}
            </ul>
          </div>
          <div className="col-span-12 md:col-span-4">
            <h3 className="text-white font-medium mb-4">Subscribe to our Newsletter</h3>
            <p className="text-sm text-slate-400 mb-4">Get the latest updates on new products and upcoming sales.</p>
            <form onSubmit={(e) => { e.preventDefault(); const target = e.target as HTMLFormElement; target.reset(); }} className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                required
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-slate-500 transition-all text-sm"
              />
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors whitespace-nowrap active:scale-95 shadow-sm text-sm"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-slate-800 text-sm flex flex-col md:flex-row items-center justify-between">
          <span className="text-center md:text-left mb-2 md:mb-0">&copy; {new Date().getFullYear()} QuantumRig Tech. All rights reserved.</span>
          <Link to="/admin-login" className="text-slate-800 dark:text-slate-200 hover:text-slate-600 dark:text-slate-400 transition-colors text-xs cursor-text">Internal Access</Link>
        </div>
      </footer>
      <SupportChat />
      <BottomNav />
      <CompareWidget />
      <ToastContainer />
    </div>
  );
}
