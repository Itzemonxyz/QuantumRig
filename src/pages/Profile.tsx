import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { api } from '../lib/api';
import { Order } from '../types';
import { Package, MapPin, ChevronDown, ChevronUp, CheckCircle2, Heart, Printer, Star, Gift, Search, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { auth, db } from '../lib/firebase';
import { updateProfile, updatePassword } from 'firebase/auth';
import { doc, updateDoc, setDoc } from 'firebase/firestore';

export default function Profile() {
  const { user, login: setLoginData, token, products, logout } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'orders' | 'saved' | 'rewards' | 'settings'>('orders');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Profile edit states
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [newPassword, setNewPassword] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editMsg, setEditMsg] = useState('');
  const [editError, setEditError] = useState('');

  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      logout();
      navigate('/login');
    } catch (err) {
      console.error('Failed to log out:', err);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        const data = await api.get('/orders/user', token);
        // Sort by newest
        data.sort((a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(data);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      }
    };

    if (token) {
      fetchOrders();
    }
  }, [user, token, navigate]);

  if (!user) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');
    setEditMsg('');
    setEditLoading(true);

    try {
      if (auth.currentUser) {
        if (editName !== user.name) {
          await updateProfile(auth.currentUser, { displayName: editName });
        }
        if (newPassword) {
          await updatePassword(auth.currentUser, newPassword);
        }
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, { name: editName, phone: editPhone });
      }

      const res = await api.put('/users/me', { name: editName, phone: editPhone, password: newPassword }, token);
      setLoginData(res, token);
      setEditMsg('Profile updated successfully!');
      setNewPassword('');
    } catch (err: any) {
      setEditError(err.message || 'Failed to update profile');
    } finally {
      setEditLoading(false);
    }
  };

  const toggleOrderExpand = (id: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedOrders(newExpanded);
  };

  const handlePrint = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Order #${order.id}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; color: #1e293b; padding: 2rem; max-width: 800px; margin: 0 auto; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 1.5rem; margin-bottom: 2rem; }
            .header h1 { margin: 0 0 0.5rem 0; font-size: 24px; color: #0f172a; }
            .header p { margin: 0.25rem 0; color: #64748b; font-size: 14px; }
            .section { margin-bottom: 2.5rem; }
            .section h2 { font-size: 18px; margin-bottom: 1rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
            th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
            th { font-weight: 600; color: #64748b; }
            .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 1rem; color: #0f172a; }
            .tracking { list-style: none; padding: 0; margin: 0; }
            .tracking li { margin-bottom: 1.5rem; }
            .tracking-date { font-weight: bold; margin-bottom: 0.25rem; font-size: 14px; color: #0f172a; }
            .tracking-status { color: #64748b; font-size: 14px; }
            .details { background: #f8fafc; padding: 1.5rem; border-radius: 8px; font-size: 14px; line-height: 1.6; border: 1px solid #e2e8f0; }
          </style>
        </head>
        <body>
          <div class="header">
            <div style="margin-bottom: 1.5rem;">
              <svg width="200" height="50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 100">
                <g transform="translate(10, 5)">
                  <circle cx="45" cy="45" r="30" stroke="#1e293b" stroke-width="8" fill="none" stroke-dasharray="140 40" stroke-linecap="round" transform="rotate(45 45 45)"/>
                  <circle cx="45" cy="45" r="8" fill="#4f46e5"/>
                  <line x1="62" y1="62" x2="85" y2="85" stroke="#1e293b" stroke-width="8" stroke-linecap="round"/>
                </g>
                <text x="110" y="62" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="42" font-weight="800" fill="#1e293b" letter-spacing="-1">Quantum<tspan fill="#4f46e5">Rig</tspan></text>
              </svg>
            </div>
            <h1>Order Receipt</h1>
            <p><strong>Order ID:</strong> #${order.id}</p>
            <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
            <p><strong>Status:</strong> ${order.status}</p>
          </div>
          
          <div class="section">
            <h2>Items</h2>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(item => `
                  <tr>
                    <td>${item.title}</td>
                    <td>${item.quantity}</td>
                    <td>৳${Number((item.price * item.quantity) || 0).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="total">Total: ৳${Number(order.totalAmount || 0).toFixed(2)}</div>
          </div>

          <div class="section">
            <h2>Delivery Details</h2>
            <div class="details">
              <strong>Receiver:</strong> ${order.deliveryDetails?.fullName || 'N/A'}<br>
              <strong>Phone:</strong> ${order.deliveryDetails?.phone || 'N/A'}<br>
              <strong>Address:</strong> ${order.deliveryDetails?.address || 'N/A'}<br>
              ${order.deliveryDetails?.instructions ? `<strong>Instructions:</strong> ${order.deliveryDetails.instructions}<br>` : ''}
              <strong>Payment Method:</strong> ${order.paymentMethod || 'Cash on Delivery'}
            </div>
          </div>

          ${order.trackingHistory && order.trackingHistory.length > 0 ? `
            <div class="section">
              <h2>Tracking History</h2>
              <ul class="tracking">
                ${(order.trackingHistory || []).map(step => `
                  <li>
                    <div class="tracking-date">${new Date(step.date).toLocaleDateString()} ${new Date(step.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${step.status}</div>
                    <div class="tracking-status">${step.description}</div>
                  </li>
                `).join('')}
              </ul>
            </div>
          ` : ''}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const lifetimeSpend = orders.reduce((acc, order) => {
    if (order.status !== 'Cancelled') {
      return acc + order.totalAmount;
    }
    return acc;
  }, 0);

  let tier = 'Bronze';
  let nextTier = 'Silver';
  let nextTierThreshold = 10000;
  let rewardRate = '1%';
  let tierColor = 'text-amber-600 bg-amber-50';
  let progressColor = 'bg-amber-500';
  
  if (lifetimeSpend >= 100000) {
    tier = 'Platinum';
    nextTier = 'Max Tier';
    nextTierThreshold = 0;
    rewardRate = '5%';
    tierColor = 'text-slate-700 bg-slate-100 border border-slate-300';
    progressColor = 'bg-slate-700';
  } else if (lifetimeSpend >= 50000) {
    tier = 'Gold';
    nextTier = 'Platinum';
    nextTierThreshold = 100000;
    rewardRate = '3%';
    tierColor = 'text-yellow-600 bg-yellow-50';
    progressColor = 'bg-yellow-500';
  } else if (lifetimeSpend >= 10000) {
    tier = 'Silver';
    nextTier = 'Gold';
    nextTierThreshold = 50000;
    rewardRate = '2%';
    tierColor = 'text-slate-500 bg-slate-50 border border-slate-200';
    progressColor = 'bg-slate-400';
  }

  const progress = nextTierThreshold === 0 ? 100 : (Math.max(0, lifetimeSpend) / nextTierThreshold) * 100;

  const savedProducts = products.filter(p => user.savedProductIds?.includes(p.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Your Profile</h1>
        <p className="text-slate-500 mt-1">Manage your account and view order history.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-24">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full object-cover mb-4 border-2 border-indigo-100 shadow-sm" />
            ) : (
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-2xl mb-4 shadow-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <h2 className="font-bold text-slate-900 text-lg">{user.name}</h2>
            <p className="text-sm text-slate-500">{user.email}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-block bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded font-medium capitalize">
                Role: {user.role}
              </span>
              {(user.loyaltyPoints !== undefined) && (
                <span className="inline-flex items-center bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded font-medium">
                  <Star className="w-3 h-3 mr-1" />
                  {user.loyaltyPoints} Loyalty Points
                </span>
              )}
            </div>

            <button
              id="btn-logout"
              onClick={handleLogout}
              className="mt-6 w-full font-sans font-medium text-xs tracking-tight text-center border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg py-2.5 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </button>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center">
              <Star className="w-5 h-5 text-indigo-600 mr-2" />
              Loyalty Tier
            </h3>
            <div className="mb-4">
              <div className="flex justify-between items-baseline mb-1">
                <span className={`text-sm font-bold px-2 py-1 rounded-md ${tierColor}`}>{tier}</span>
                <span className="text-xs font-medium text-slate-500">Reward: {rewardRate} back</span>
              </div>
            </div>
            <div className="mb-2">
              <div className="text-xs text-slate-500 mb-1 flex justify-between">
                <span>Lifetime Spend</span>
                <span className="font-bold text-slate-900">৳{lifetimeSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${progressColor} transition-all duration-500`} style={{ width: `${Math.min(progress, 100)}%` }} />
              </div>
            </div>
            {nextTierThreshold > 0 && (
              <p className="text-xs text-slate-500">
                Spend <span className="font-bold text-slate-700">৳{(nextTierThreshold - lifetimeSpend).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> more to reach <span className="font-bold">{nextTier}</span>.
              </p>
            )}
          </div>
        </div>

        <div className="md:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex items-center space-x-6 border-b border-slate-200">
              <button 
                onClick={() => setActiveTab('orders')}
                className={`pb-4 text-sm font-bold capitalize transition-colors flex items-center ${activeTab === 'orders' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-900 border-b-2 border-transparent'}`}
              >
                <Package className="w-5 h-5 mr-2" />
                Order History
              </button>
              <button 
                onClick={() => setActiveTab('saved')}
                className={`pb-4 text-sm font-bold capitalize transition-colors flex items-center ${activeTab === 'saved' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-900 border-b-2 border-transparent'}`}
              >
                <Heart className="w-5 h-5 mr-2" />
                Saved Products
              </button>
              <button 
                onClick={() => setActiveTab('rewards')}
                className={`pb-4 text-sm font-bold capitalize transition-colors flex items-center ${activeTab === 'rewards' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-900 border-b-2 border-transparent'}`}
              >
                <Gift className="w-5 h-5 mr-2" />
                Rewards History
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`pb-4 text-sm font-bold capitalize transition-colors flex items-center ${activeTab === 'settings' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-900 border-b-2 border-transparent'}`}
              >
                <Settings className="w-5 h-5 mr-2" />
                Edit Profile
              </button>
            </div>
          </div>

          {activeTab === 'orders' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="mb-6 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by Order ID or Product Title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm font-medium"
                />
              </div>
              {orders.length === 0 ? (
                <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg">
                  You haven't placed any orders yet.
                </div>
              ) : orders.filter(order => 
                (order.id || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                (order.items || []).some(item => (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()))
              ).length === 0 ? (
                <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg">
                  No orders match your search query.
                </div>
              ) : (
                <div className="space-y-6">
                {orders.filter(order => 
                  (order.id || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                  (order.items || []).some(item => (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()))
                ).map(order => {
                  const isExpanded = expandedOrders.has(order.id);
                  return (
                    <div key={order.id} className="border border-slate-200 rounded-lg overflow-hidden transition-all duration-300">
                      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between">
                        <div>
                          <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block sm:inline">Order Placed</span>
                          <span className="text-sm text-slate-900 font-medium block sm:inline sm:ml-2">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="mt-2 sm:mt-0">
                           <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block sm:inline">Total</span>
                           <span className="text-sm text-slate-900 font-medium block sm:inline sm:ml-2">৳{Number(order.totalAmount || 0).toFixed(2)}</span>
                        </div>
                        <div className="mt-2 sm:mt-0">
                          <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block sm:inline sm:hidden">Order ID</span>
                          <span className="text-sm text-slate-500 block sm:inline">#{order.id}</span>
                        </div>
                      </div>
                      
                      <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex-1 w-full">
                          <div className="flex justify-between items-start w-full">
                            <div>
                              <div className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold mb-3 ${
                                order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                                order.status === 'Cancelled' ? 'bg-rose-100 text-rose-800' :
                                'bg-indigo-100 text-indigo-800'
                              }`}>
                                {order.status}
                              </div>
                              <ul className="text-sm text-slate-600 space-y-1">
                                {order.items.map(item => (
                                  <li key={item.productId}>
                                    {item.quantity}x {item.title}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            
                            <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                              <button 
                                onClick={() => handlePrint(order)}
                                className="text-slate-600 hover:text-indigo-600 bg-white border border-slate-200 hover:border-indigo-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center space-x-1"
                              >
                                <Printer className="w-4 h-4" />
                                <span className="hidden sm:inline">Print</span>
                              </button>
                              <button 
                                onClick={() => toggleOrderExpand(order.id)}
                                className="text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
                              >
                                <span>{isExpanded ? 'Hide Details' : 'Track Package'}</span>
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Section */}
                      {isExpanded && (
                        <div className="border-t border-slate-100 bg-white p-4 sm:p-6 animate-in slide-in-from-top-2 fade-in duration-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Tracking Timeline */}
                            <div>
                              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center">
                                <MapPin className="w-4 h-4 mr-1 text-slate-400" />
                                Tracking Updates
                              </h3>
                              {order.trackingHistory && order.trackingHistory.length > 0 ? (
                                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-200">
                                  {(order.trackingHistory || []).map((step, idx) => (
                                    <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                      <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-white bg-indigo-500 text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow z-10 translate-x-[3px]">
                                        <CheckCircle2 className="w-3 h-3" />
                                      </div>
                                      <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-slate-50 p-3 rounded border border-slate-100 shadow-sm ml-4 md:ml-0 translate-x-1">
                                        <div className="flex items-center justify-between mb-1">
                                          <div className="font-bold text-slate-800 text-xs">{step.status}</div>
                                          <div className="text-[10px] text-slate-400 font-medium">{new Date(step.date).toLocaleDateString()} {new Date(step.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                        </div>
                                        <div className="text-xs text-slate-500">{step.description}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-slate-500 italic bg-slate-50 p-3 rounded">No tracking information available yet.</p>
                              )}
                            </div>

                            {/* Delivery & Summary Detials */}
                            <div>
                              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Delivery Details</h3>
                              <div className="text-sm text-slate-600 bg-slate-50 p-4 rounded border border-slate-100 space-y-2">
                                <p><span className="font-medium text-slate-800">Receiver:</span> {order.deliveryDetails?.fullName || 'N/A'}</p>
                                <p><span className="font-medium text-slate-800">Phone:</span> {order.deliveryDetails?.phone || 'N/A'}</p>
                                <p><span className="font-medium text-slate-800">Address:</span> {order.deliveryDetails?.address || 'N/A'}</p>
                                {order.deliveryDetails?.instructions && (
                                  <div className="border-t border-slate-200/60 pt-2 mt-2">
                                    <p><span className="font-medium text-slate-800">Instructions:</span> {order.deliveryDetails.instructions}</p>
                                  </div>
                                )}
                                <div className="border-t border-slate-200 pt-2 mt-2">
                                  <p><span className="font-medium text-slate-800">Payment Method:</span> {order.paymentMethod || 'Cash on Delivery'}</p>
                                </div>
                              </div>
                              <button 
                                onClick={() => handlePrint(order)}
                                className="mt-4 w-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center transition-colors shadow-sm"
                              >
                                <Printer className="w-4 h-4 mr-2" />
                                Print Receipt
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </div>
          )}

          {activeTab === 'saved' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              {savedProducts.length === 0 ? (
                <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg">
                  You don't have any saved products.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {savedProducts.map(p => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'rewards' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              {orders.filter(o => o.status !== 'Cancelled').length === 0 ? (
                <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg">
                  You don't have any point-earning transactions yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {[...orders]
                    .filter(o => o.status !== 'Cancelled')
                    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                    .map((order, index, array) => {
                      // Calculate cumulative spend before this order to determine tier rate
                      const spendBefore = array.slice(0, index).reduce((acc, o) => acc + o.totalAmount, 0);
                      let rate = 0.01; // 1% default (Bronze)
                      if (spendBefore >= 100000) rate = 0.05; // Platinum
                      else if (spendBefore >= 50000) rate = 0.03; // Gold
                      else if (spendBefore >= 10000) rate = 0.02; // Silver
                      
                      const earnedAmount = order.totalAmount * rate;
                      
                      return { ...order, earnedAmount, rate };
                    })
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map(order => (
                      <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-200 rounded-lg bg-slate-50">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900">Order #{order.id.slice(0, 8)}</span>
                            <span className="text-xs text-slate-500">• {new Date(order.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm text-slate-600 mt-1">Amount: ৳{order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Earned at {Number((order.rate * 100) || 0).toFixed(0)}% rate)</p>
                        </div>
                        <div className="mt-3 sm:mt-0 flex items-center bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                          <Gift className="w-4 h-4 text-indigo-600 mr-2" />
                          <span className="font-bold text-indigo-600">+৳{order.earnedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Edit Profile</h2>
              
              {editError && (
                <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm mb-6 border border-rose-100">
                  {editError}
                </div>
              )}
              {editMsg && (
                <div className="bg-emerald-50 text-emerald-600 p-3 rounded-lg text-sm mb-6 border border-emerald-100">
                  {editMsg}
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-6 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                  <input type="email" value={user.email} disabled className="w-full border border-slate-300 rounded-lg px-4 py-2.5 bg-slate-50 text-slate-500 cursor-not-allowed" />
                  <p className="text-xs text-slate-500 mt-1">Email address cannot be changed.</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input required type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                  <input required type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" />
                </div>
                
                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 mb-3">Change Password (Optional)</h3>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Leave blank to keep current password" className="w-full border border-slate-300 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" />
                    <p className="text-xs text-slate-500 mt-1">If you registered via Google, setting a password here will allow you to login with email next time.</p>
                  </div>
                </div>
                
                <button 
                  type="submit" 
                  disabled={editLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-70"
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
