import React, { useEffect, useState } from 'react';
import { useStore } from '../../store';
import { useNavigate, Routes, Route, Link, Outlet, useLocation } from 'react-router-dom';
import { Package, FolderTree, ShoppingCart, Settings as SettingsIcon, Ticket, AlertTriangle, Zap, LogOut, AreaChart, HelpCircle, ArrowLeft, BarChart3, Search, RefreshCw, Link as LinkIcon } from 'lucide-react';
import { api } from '../../lib/api';
import AnalyticsTab from './AnalyticsTab';
import ProductsTab from './ProductsTab';
import CategoriesTab from './CategoriesTab';
import BrandsTab from './BrandsTab';
import OrdersTab from './OrdersTab';
import CouponsTab from './CouponsTab';
import SettingsTab from './SettingsTab';
import OffersTab from './OffersTab';
import SupportTab from './SupportTab';
import SocialLinksTab from './SocialLinksTab';

import RestockRequestsTab from './RestockRequestsTab';

const boardOptions = [
  { to: '/admin/analytics', icon: <AreaChart className="w-8 h-8 text-indigo-500 mb-4" />, label: 'Analytics', desc: 'View store performance and analytics' },
  { to: '/admin/products', icon: <Package className="w-8 h-8 text-indigo-500 mb-4" />, label: 'Products', desc: 'Manage catalog and inventory' },
  { to: '/admin/categories', icon: <FolderTree className="w-8 h-8 text-indigo-500 mb-4" />, label: 'Categories', desc: 'Organize products' },
  { to: '/admin/brands', icon: <FolderTree className="w-8 h-8 text-indigo-500 mb-4" />, label: 'Brands', desc: 'Manage product brands' },
  { to: '/admin/orders', icon: <ShoppingCart className="w-8 h-8 text-indigo-500 mb-4" />, label: 'Orders', desc: 'View and fulfill orders' },
  { to: '/admin/coupons', icon: <Ticket className="w-8 h-8 text-indigo-500 mb-4" />, label: 'Coupons', desc: 'Create discount codes' },
  { to: '/admin/offers', icon: <Zap className="w-8 h-8 text-indigo-500 mb-4" />, label: 'Offers', desc: 'Manage special promotions' },
  { to: '/admin/support', icon: <HelpCircle className="w-8 h-8 text-indigo-500 mb-4" />, label: 'Support', desc: 'Handle customer inquiries' },
  { to: '/admin/restock', icon: <RefreshCw className="w-8 h-8 text-indigo-500 mb-4" />, label: 'Restock', desc: 'Manage requested inventory' },
  { to: '/admin/social-links', icon: <LinkIcon className="w-8 h-8 text-indigo-500 mb-4" />, label: 'Social Links', desc: 'Manage external social media' },
  { to: '/admin/settings', icon: <SettingsIcon className="w-8 h-8 text-indigo-500 mb-4" />, label: 'Settings', desc: 'Store configuration' },
];

function AdminBoard() {
  const { logout } = useStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {boardOptions.map((opt) => {
          return (
            <Link 
              key={opt.to} 
              to={opt.to}
              className="bg-white border border-slate-200 text-center p-8 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col items-center group cursor-pointer"
            >
              <div className="group-hover:scale-110 transition-transform">
                 {opt.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{opt.label}</h3>
              <p className="text-slate-500 text-sm">{opt.desc}</p>
            </Link>
          );
        })}
        
        <button 
           onClick={handleLogout}
           className="bg-rose-50 border text-center border-rose-200 p-8 rounded-2xl shadow-sm hover:shadow-md hover:border-rose-300 transition-all flex flex-col items-center group cursor-pointer"
        >
           <div className="group-hover:scale-110 transition-transform">
              <LogOut className="w-8 h-8 text-rose-500 mb-4" />
           </div>
           <h3 className="text-xl font-bold text-rose-800 mb-2">Logout</h3>
           <p className="text-rose-600/80 text-sm">Sign out of admin securely</p>
        </button>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, products, token } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [globalSearch, setGlobalSearch] = useState('');
  
  const [counts, setCounts] = useState({
    orders: 0,
    coupons: 0,
    restock: 0,
    support: 0
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin-login');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user && user.role === 'admin' && token) {
      Promise.all([
        api.get('/orders', token),
        api.get('/coupons', token),
        api.get('/admin/restock-requests', token),
        api.get('/support-tickets', token)
      ])
      .then(([orders, coupons, restock, support]) => {
        setCounts({
          orders: Array.isArray(orders) ? orders.length : 0,
          coupons: Array.isArray(coupons) ? coupons.length : 0,
          restock: Array.isArray(restock) ? restock.length : 0,
          support: Array.isArray(support) ? support.length : 0
        });
      })
      .catch(console.error);
    }
  }, [user, token, location.pathname]);

  if (!user || user.role !== 'admin') return null;

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalSearch.trim()) {
      navigate(`/admin/products?q=${encodeURIComponent(globalSearch.trim())}`);
    } else {
      navigate(`/admin/products`);
    }
  };

  const lowStockCount = products.filter(p => p.inventoryCount !== undefined && p.inventoryCount < 5).length;
  const isRoot = location.pathname === '/admin' || location.pathname === '/admin/';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-4">
          {!isRoot && (
            <Link to="/admin" className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors flex-shrink-0">
              <ArrowLeft className="w-6 h-6" />
            </Link>
          )}
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Admin Dashboard</h1>
            <p className="text-slate-500 mt-1">Manage products, orders, and store settings.</p>
          </div>
        </div>
        
        <div className="mt-4 md:mt-0 flex flex-col md:flex-row items-center gap-4">
          <form onSubmit={handleGlobalSearch} className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search products globally..." 
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            />
          </form>

          {lowStockCount > 0 && (
            <div className="flex items-center bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl shadow-sm">
              <AlertTriangle className="w-6 h-6 mr-3 text-amber-500" />
              <div>
                <p className="font-bold">Inventory Alert</p>
                <p className="text-sm">{lowStockCount} item{lowStockCount !== 1 ? 's' : ''} low stock.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Persistent Quick Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-slate-100 scrollbar-none">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider pr-2 font-mono shrink-0">Quick Access:</span>
        <Link 
          to="/admin/orders" 
          className={`px-4 py-1.5 rounded-full text-xs transition-all flex items-center gap-1.5 shrink-0 ${
            location.pathname.startsWith('/admin/orders')
              ? 'bg-indigo-600 text-white shadow-sm font-bold'
              : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold border border-indigo-200'
          }`}
        >
          Orders <span className="opacity-80 ml-0.5 font-mono">({counts.orders})</span>
        </Link>
        <Link 
          to="/admin/products" 
          className={`px-4 py-1.5 rounded-full text-xs transition-all flex items-center gap-1.5 shrink-0 ${
            location.pathname.includes('/products')
              ? 'bg-blue-600 text-white shadow-sm font-bold'
              : 'bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold border border-blue-200'
          }`}
        >
          Products <span className="opacity-80 ml-0.5 font-mono">({products.length})</span>
        </Link>
        <Link 
          to="/admin/analytics" 
          className={`px-4 py-1.5 rounded-full text-xs transition-all flex items-center gap-1.5 shrink-0 ${
            location.pathname.includes('/analytics')
              ? 'bg-emerald-600 text-white shadow-sm font-bold'
              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold border border-emerald-200'
          }`}
        >
          Analytics
        </Link>
        <Link 
          to="/admin/coupons" 
          className={`px-4 py-1.5 rounded-full text-xs transition-all flex items-center gap-1.5 shrink-0 ${
            location.pathname.includes('/coupons')
              ? 'bg-fuchsia-600 text-white shadow-sm font-bold'
              : 'bg-fuchsia-50 hover:bg-fuchsia-100 text-fuchsia-700 font-extrabold border border-fuchsia-200'
          }`}
        >
          Coupons <span className="opacity-80 ml-0.5 font-mono">({counts.coupons})</span>
        </Link>
        <Link 
          to="/admin/restock" 
          className={`px-4 py-1.5 rounded-full text-xs transition-all flex items-center gap-1.5 shrink-0 ${
            location.pathname.includes('/restock')
              ? 'bg-cyan-600 text-white shadow-sm font-bold'
              : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-700 font-extrabold border border-cyan-200'
          }`}
        >
          Restock <span className="opacity-80 ml-0.5 font-mono">({counts.restock})</span>
        </Link>
        <Link 
          to="/admin/support" 
          className={`px-4 py-1.5 rounded-full text-xs transition-all flex items-center gap-1.5 shrink-0 ${
            location.pathname.includes('/support')
              ? 'bg-violet-600 text-white shadow-sm font-bold'
              : 'bg-violet-50 hover:bg-violet-100 text-violet-700 font-extrabold border border-violet-200'
          }`}
        >
          Support <span className="opacity-80 ml-0.5 font-mono">({counts.support})</span>
        </Link>
        
        {!isRoot && (
          <Link 
            to="/admin" 
            className="px-3 py-1.5 rounded-full text-xs font-bold bg-slate-250 hover:bg-slate-300 text-slate-800 ml-auto flex items-center gap-1 shrink-0 transition-colors"
          >
            ← Main Board
          </Link>
        )}
      </div>

      <div className="w-full">
        {!isRoot && <div className="bg-white border border-slate-200 rounded-xl shadow-sm min-h-[600px] mb-8">
            <Routes>
              <Route path="analytics" element={<AnalyticsTab />} />
              <Route path="products" element={<ProductsTab />} />
              <Route path="categories" element={<CategoriesTab />} />
              <Route path="brands" element={<BrandsTab />} />
              <Route path="orders" element={<OrdersTab />} />
              <Route path="coupons" element={<CouponsTab />} />
              <Route path="offers" element={<OffersTab />} />
              <Route path="support" element={<SupportTab />} />
              <Route path="restock" element={<RestockRequestsTab />} />
              <Route path="social-links" element={<SocialLinksTab />} />
              <Route path="settings" element={<SettingsTab />} />
            </Routes>
        </div>}
        {isRoot && <AdminBoard />}
      </div>
    </div>
  );
}
