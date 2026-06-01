import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store';
import { Monitor, ShoppingCart, User as UserIcon, LogOut, Package, Shield, Search, Bell } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import BottomNav from './BottomNav';
import { api } from '../lib/api';

export default function Layout() {
  const { user, cart, settings, socialLinks, logout, products, categories, token, notifications, setNotifications, markNotificationRead } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('recentSearches');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const saveRecentSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setRecentSearches(prev => {
      const updated = [trimmed, ...prev.filter(q => q.toLowerCase() !== trimmed.toLowerCase())].slice(0, 3);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
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
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
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
        (p.brand || '').toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  const categoryResults = searchQuery.trim()
    ? categories.filter(c => (c.name || '').toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 3)
    : [];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      {location.pathname === '/' && (
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-700 text-white text-xs py-2 overflow-hidden w-full relative border-b border-indigo-800 shadow-sm whitespace-nowrap">
          <div className="animate-marquee font-medium tracking-widest uppercase items-center">
            <span className="mx-4">🌟</span> Welcome to QuantumRig Tech — The Ultimate Destination for PC Components and Custom Builds <span className="mx-4">🌟</span> Use code <span className="font-bold text-cyan-300 mx-2">QUANTUM24</span> for 10% off!
          </div>
        </div>
      )}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24">
            <Link to="/" className="flex items-center space-x-2 text-indigo-600 shrink-0">
              <img src="/logo-primary.svg" alt="QuantumRig" className="h-10 sm:h-14 md:h-20 w-auto shrink-0 max-w-none" />
            </Link>
            
            <div className="hidden md:flex flex-1 max-w-2xl mx-8 relative" ref={searchRef}>
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search products, brands, categories..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setIsSearchOpen(false);
                      if (searchQuery.trim()) {
                        handleSearchSubmit(searchQuery);
                      } else {
                        navigate('/products');
                      }
                      setSearchQuery('');
                    }
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-500 rounded-xl text-sm transition-colors outline-none border focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
              
              <AnimatePresence>
                {isSearchOpen && (searchQuery.trim() !== '' || recentSearches.length > 0) && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-14 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-2xl shadow-indigo-900/10 overflow-hidden z-50"
                  >
                    <div className="max-h-[28rem] overflow-y-auto overflow-x-hidden">
                      {searchQuery.trim() === '' && recentSearches.length > 0 && (
                        <div className="p-3 border-b border-slate-100 bg-slate-50/50">
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
                            {recentSearches.map((rs, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleSearchSubmit(rs)}
                                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:border-indigo-300 hover:text-indigo-600 transition-colors shadow-sm"
                              >
                                {rs}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {categoryResults.length > 0 && (
                        <div className="p-3 border-b border-slate-100">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Categories</h4>
                          {categoryResults.map(cat => (
                            <div
                              key={cat.id}
                              onClick={() => {
                                navigate(`/products?category=${cat.id}`);
                                setSearchQuery('');
                                setIsSearchOpen(false);
                              }}
                              className="px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-lg cursor-pointer flex items-center transition-colors"
                            >
                              <Search className="w-4 h-4 mr-2 text-slate-400" />
                              {cat.name}
                            </div>
                          ))}
                        </div>
                      )}

                      {searchResults.length > 0 ? (
                        <div className="p-2">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-3 pt-2">Products</h4>
                          {searchResults.map(product => (
                            <div 
                              key={product.id}
                              onClick={() => {
                                navigate(`/products/${product.id}`);
                                setSearchQuery('');
                                setIsSearchOpen(false);
                              }}
                              className="flex items-center space-x-4 p-3 hover:bg-slate-50 cursor-pointer rounded-xl transition-colors group"
                            >
                              <img src={product.imageUrl} alt={product.title} className="w-12 h-12 object-contain bg-white rounded-lg border border-slate-100 group-hover:border-indigo-100" />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{product.title}</h4>
                                <p className="text-xs text-slate-500 truncate">{product.categoryId ? categories.find(c => c.id === product.categoryId)?.name : ''}</p>
                              </div>
                              <div className="text-sm font-bold text-slate-900">
                                ৳{Number(product.price || 0).toFixed(2)}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : searchQuery.trim() !== '' && categoryResults.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center">
                          <Package className="w-8 h-8 text-slate-300 mb-2" />
                          <p className="text-sm font-medium">No results found for "{searchQuery}"</p>
                          <p className="text-xs text-slate-400 mt-1">Try a different keyword or check for typos.</p>
                        </div>
                      ) : null}
                      
                      {(searchResults.length > 0 || categoryResults.length > 0) && (
                        <div className="p-2 border-t border-slate-100 bg-slate-50 sticky bottom-0">
                          <button
                            onClick={() => {
                              navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
                              setSearchQuery('');
                              setIsSearchOpen(false);
                            }}
                            className="w-full py-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            View all results
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <nav className="hidden md:flex space-x-6 lg:space-x-8">
              <Link to="/products" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors">Products</Link>
              <Link to="/builder" className="text-indigo-600 hover:text-indigo-500 font-bold transition-colors">PC Builder</Link>
              <Link to="/laptop-finder" className="text-blue-600 hover:text-blue-500 font-bold transition-colors">Laptop Finder</Link>
              <Link to="/track-order" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors">Track Order</Link>
            </nav>

            <div className="hidden md:flex items-center space-x-6">
              <Link to="/cart" className="relative text-slate-600 hover:text-indigo-600 transition-colors">
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
                      className="absolute -top-2 -right-2 bg-rose-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {cartItemsCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
              
              {user && (
                <div className="relative" ref={notifRef}>
                  <button onClick={() => setShowNotifications(!showNotifications)} className="relative text-slate-600 hover:text-indigo-600 transition-colors">
                    <Bell className="w-6 h-6" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
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
                        className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 text-slate-900"
                      >
                        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                          <h3 className="font-bold">Notifications</h3>
                          {unreadCount > 0 && <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount} New</span>}
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {(!notifications || notifications.length === 0) ? (
                            <div className="p-6 text-center text-slate-500 text-sm">You have no notifications</div>
                          ) : (
                            notifications.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((n) => (
                              <button
                                key={n.id}
                                onClick={() => handleNotifClick(n)}
                                className={`w-full text-left p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors ${!n.read ? 'bg-indigo-50/50' : ''}`}
                              >
                                <p className={`text-sm ${!n.read ? 'font-bold text-slate-900' : 'text-slate-600'}`}>{n.message}</p>
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
                  {user.role === 'admin' ? (
                    <Link to="/admin" className="flex items-center space-x-1 text-slate-600 hover:text-indigo-600 transition-colors">
                      <Shield className="w-5 h-5" />
                      <span className="text-sm font-medium hidden sm:block">Admin</span>
                    </Link>
                  ) : (
                    <Link to="/profile" className="flex items-center space-x-1 text-slate-600 hover:text-indigo-600 transition-colors">
                      <UserIcon className="w-5 h-5" />
                      <span className="text-sm font-medium hidden sm:block">Profile</span>
                    </Link>
                  )}
                  <button onClick={handleLogout} className="text-slate-400 hover:text-rose-500 transition-colors">
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <Link to="/login" className="flex items-center space-x-1 text-slate-600 hover:text-indigo-600 font-medium transition-colors">
                  <UserIcon className="w-5 h-5" />
                  <span>Login</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 relative pb-16 sm:pb-0">
        <Outlet />
      </main>

      <footer className="bg-slate-900 text-slate-400 py-12 pb-24 sm:pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center space-x-2 text-white mb-4 shrink-0">
              <img src="/logo-white.svg" alt="QuantumRig" className="h-10 sm:h-14 md:h-16 w-auto shrink-0 max-w-none" />
            </Link>
            <p className="text-sm max-w-sm">The ultimate destination for PC components and custom builds. We deliver the components to power your dreams.</p>
          </div>
          <div>
            <h3 className="text-white font-medium mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/products" className="hover:text-white transition-colors">All Products</Link></li>
              <li><Link to="/builder" className="hover:text-white transition-colors">PC Builder Tool</Link></li>
              <li><Link to="/cart" className="hover:text-white transition-colors">Cart</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-medium mb-4">Connect With Us</h3>
            <ul className="space-y-2 text-sm">
              {socialLinks.map(link => (
                <li key={link.id}>
                  <a href={link.url} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
              {socialLinks.length === 0 && (
                <>
                  {settings?.facebookUrl && <li><a href={settings.facebookUrl} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Facebook</a></li>}
                  {settings?.whatsappUrl && <li><a href={settings.whatsappUrl} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">WhatsApp</a></li>}
                  {settings?.instagramUrl && <li><a href={settings.instagramUrl} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Instagram</a></li>}
                </>
              )}
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-slate-800 text-sm flex flex-col md:flex-row items-center justify-between">
          <span className="text-center md:text-left mb-2 md:mb-0">&copy; {new Date().getFullYear()} QuantumRig Tech. All rights reserved.</span>
          <Link to="/admin-login" className="text-slate-800 hover:text-slate-600 transition-colors text-xs cursor-text">Internal Access</Link>
        </div>
      </footer>
      <BottomNav />
    </div>
  );
}
