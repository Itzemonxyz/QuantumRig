import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Search, Package, Navigation, AlertTriangle, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../store';

function OrderItemImage({ item, products }: { item: any; products: any[] }) {
  const [isError, setIsError] = useState(false);
  const foundProd = products.find((p: any) => p.id === item.productId || (p.title && p.title.toLowerCase() === (item.title || '').toLowerCase()));
  const imageUrl = foundProd?.imageUrl || item.imageUrl || '';

  if (!imageUrl || isError) {
    const initials = (item.title || 'PC').split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();
    return (
      <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 rounded-lg flex flex-col items-center justify-center p-1 text-center select-none shadow-sm shrink-0">
        <Package className="w-5 h-5 text-indigo-500 mb-0.5" strokeWidth={2} />
        <span className="text-[9px] font-bold font-mono tracking-wider text-slate-700 dark:text-slate-300 truncate max-w-full px-1">{initials}</span>
      </div>
    );
  }

  return (
    <div className="w-16 h-16 bg-white dark:bg-slate-900 border border-slate-200 rounded-lg flex items-center justify-center p-1.5 shrink-0 relative shadow-sm overflow-hidden group font-sans">
      <img 
        src={imageUrl} 
        alt={item.title} 
        onError={() => setIsError(true)}
        className="max-w-full max-h-full object-contain mix-blend-multiply transition-transform group-hover:scale-105" 
      />
    </div>
  );
}

export default function TrackOrder() {
  const { products } = useStore();
  const { id } = useParams<{ id: string }>();
  const [orderId, setOrderId] = useState(id || '');
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [error, setError] = useState('');

  const steps = [
    { label: 'Pending', desc: 'Order placed', statusValue: 'Pending' },
    { label: 'Processing', desc: 'Prepping parts', statusValue: 'Accepted' },
    { label: 'Shipped', desc: 'Dispatched', statusValue: 'Shipped' },
    { label: 'Delivered', desc: 'Received successfully', statusValue: 'Delivered' }
  ];

  const getActiveStep = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'pending') return 0;
    if (s === 'accepted' || s === 'processing' || s === 'verified') return 1;
    if (s === 'shipped') return 2;
    if (s === 'delivered') return 3;
    return 0; // fallback
  };

  const fetchOrder = async (searchId: string) => {
    if (!searchId.trim()) return;
    
    setLoading(true);
    setError('');
    setOrderData(null);
    
    try {
      const data = await api.get(`/public/orders/${searchId.trim()}`);
      setOrderData(data);
    } catch (err: any) {
      if (err.statusCode === 404) {
        setError('Order not found. Please double-check your Order ID.');
      } else {
        setError('Failed to fetch order. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchOrder(id);
    }
  }, [id]);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrder(orderId);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">Track Your Order</h1>
        <p className="text-slate-500 dark:text-slate-400">Enter your order ID below to see the current status and tracking history.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
        <form onSubmit={handleTrack} className="flex gap-4 mb-8">
          <input
            type="text"
            required
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="e.g. ord171800..."
            className="flex-1 border-2 border-slate-200 rounded-xl px-4 h-14 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all font-mono"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white font-bold h-14 px-8 rounded-xl hover:bg-indigo-700 transition flex items-center justify-center shadow-lg shadow-indigo-600/20 disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {loading ? <Search className="w-5 h-5 animate-pulse" /> : 'Track Order'}
          </button>
        </form>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-xl flex items-center">
            <AlertTriangle className="w-5 h-5 mr-3" />
            {error}
          </div>
        )}

        {orderData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-t border-slate-100 pt-8"
          >
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1 flex items-center">
                  <Package className="w-6 h-6 mr-2 text-indigo-600" />
                  Order Status: <span className="text-indigo-600 ml-2">{orderData.status}</span>
                </h2>
                <div className="text-sm font-mono text-slate-500 dark:text-slate-400">ID: {orderData.id}</div>
              </div>
              <div className="text-right">
                <div className="text-slate-500 dark:text-slate-400 text-sm mb-1">Total Amount</div>
                <div className="font-bold text-xl text-slate-900 dark:text-white">৳{Number(orderData.totalAmount || 0).toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
              </div>
            </div>

            {/* Live Progress Bar Visual Indicator */}
            <div className="mb-10 bg-slate-50 dark:bg-slate-950 border border-slate-200/60 rounded-2xl p-6 md:p-8 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">Live Tracking Progress</span>
                {orderData.status === 'Cancelled' ? (
                  <span className="text-xs font-bold bg-rose-100 text-rose-700 px-3 py-1 rounded-full uppercase tracking-wider">Cancelled</span>
                ) : orderData.status === 'Delivered' ? (
                  <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                    <Check className="w-3.5 h-3.5" /> Delivered
                  </span>
                ) : (
                  <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full uppercase tracking-wider animate-pulse shadow-sm">In Progress</span>
                )}
              </div>
              
              {orderData.status === 'Cancelled' ? (
                <div className="flex items-center gap-3 bg-rose-50 border border-rose-150 text-rose-700 p-4 rounded-xl">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <div>
                    <h4 className="font-bold text-sm">Order Cancelled</h4>
                    <p className="text-xs text-rose-600 font-medium">This order was cancelled. Please contact our support team at tech support desk if you need details.</p>
                  </div>
                </div>
              ) : (
                <div className="relative mt-2">
                  {/* Outer connection Track path line */}
                  <div className="absolute top-[22px] left-[12.5%] right-[12.5%] h-1.5 bg-slate-200 dark:bg-slate-700 -translate-y-1/2 rounded-full z-0 overflow-hidden shadow-inner">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-cyan-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(getActiveStep(orderData.status) / (steps.length - 1)) * 100}%` }}
                      transition={{ duration: 1, ease: "easeInOut" }}
                    />
                  </div>

                  {/* Node Items */}
                  <div className="relative flex justify-between z-10">
                    {steps.map((step, index) => {
                      const activeIndex = getActiveStep(orderData.status);
                      const isCompleted = index <= activeIndex;
                      const isCurrent = index === activeIndex;

                      return (
                        <div key={index} className="flex flex-col items-center flex-1 text-center group">
                          {/* Round Step Cap Grid */}
                          <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: index * 0.15 + 0.2, type: "spring", stiffness: 200 }}
                            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-500 relative ${
                              isCompleted 
                                ? 'bg-gradient-to-br from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/30 border-2 border-white' 
                                : 'bg-white dark:bg-slate-900 border-4 border-slate-100 text-slate-300'
                            }`}
                          >
                            {isCompleted ? (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: index * 0.15 + 0.5, type: "spring" }}
                              >
                                <Check className="w-5 h-5 text-white" strokeWidth={3} />
                              </motion.div>
                            ) : (
                              <span className="text-xs font-mono font-bold">{index + 1}</span>
                            )}
                            {/* Glowing ping marker ring for real-time item status focus */}
                            {isCurrent && orderData.status !== 'Delivered' && (
                              <span className="absolute -inset-2 rounded-full animate-ping border-2 border-indigo-400/50 opacity-75 pointer-events-none" />
                            )}
                          </motion.div>
                          
                          {/* Label descriptions */}
                          <div className="mt-4 px-1">
                            <h4 className={`text-sm tracking-tight transition-colors duration-300 ${
                              isCurrent ? 'text-indigo-600 font-extrabold' : isCompleted ? 'text-slate-800 dark:text-slate-200 font-bold' : 'text-slate-400 font-bold'
                            }`}>
                              {step.label}
                            </h4>
                            <p className={`text-xs mt-1 max-w-[90px] md:max-w-none leading-tight ${isCurrent ? 'text-indigo-500 font-medium' : 'text-slate-500 dark:text-slate-400 font-medium'}`}>
                              {step.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {(orderData.courierName || orderData.trackingNumber) && (orderData.status === 'Shipped' || orderData.status === 'Delivered') && (
                <div className="mt-8 pt-6 border-t border-slate-200/60 pl-2">
                   <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wider flex items-center">
                     <Package className="w-3.5 h-3.5 mr-1.5" /> Shipping Details
                   </h4>
                   <div className="flex flex-col sm:flex-row sm:items-center gap-6 bg-white dark:bg-slate-900 border border-slate-100 p-4 w-full rounded-xl shadow-sm">
                     {orderData.courierName && (
                       <div>
                         <span className="block text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Courier Service</span>
                         <span className="font-bold text-slate-900 dark:text-white flex items-center">
                           {orderData.courierName}
                         </span>
                       </div>
                     )}
                     {orderData.trackingNumber && (
                       <div>
                         <span className="block text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Tracking Number</span>
                         {orderData.trackingNumber.startsWith('http') ? (
                           <a href={orderData.trackingNumber} target="_blank" rel="noopener noreferrer" className="font-mono text-indigo-600 font-bold hover:underline">
                              {orderData.trackingNumber.substring(0, 30)}...
                           </a>
                         ) : (
                           <span className="font-mono text-slate-900 dark:text-white font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded tracking-wider">
                             {orderData.trackingNumber}
                           </span>
                         )}
                       </div>
                     )}
                   </div>
                </div>
              )}
            </div>

            <div className="mb-10 bg-white dark:bg-slate-900 border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
              <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-8 flex items-center tracking-tight">
                <Navigation className="w-5 h-5 mr-3 text-indigo-500" /> Tracking History
              </h3>
              <div className="relative pl-1 sm:pl-2">
                {/* Continuous Vertical Line */}
                <div className="absolute left-[19px] sm:left-[23px] top-6 bottom-6 w-[2px] bg-slate-100 dark:bg-slate-800 rounded-full" />
                
                <div className="space-y-8">
                  {orderData.trackingHistory?.map((event: any, i: number) => {
                    const isLatest = i === orderData.trackingHistory.length - 1;
                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.2 + 0.3, type: "spring", stiffness: 100 }}
                        key={i} 
                        className="relative flex items-start group"
                      >
                        {/* Dot */}
                        <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-4 shrink-0 mr-4 sm:mr-6 transition-all duration-300 shadow-sm ${
                           isLatest ? 'bg-indigo-600 border-white text-white shadow-indigo-600/30 ring-2 ring-indigo-200' : 'bg-slate-100 dark:bg-slate-800 border-white text-slate-400 ring-2 ring-slate-100'
                        }`}>
                          {isLatest ? (
                             <motion.div 
                               initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.2 + 0.6, type: "spring" }}
                               className="w-3 h-3 rounded-full bg-white dark:bg-slate-900 shadow-sm" 
                             />
                          ) : (
                             <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className={`flex-1 mt-0 p-5 rounded-2xl border transition-all duration-300 ${isLatest ? 'bg-indigo-50/40 border-indigo-100/60 shadow-lg shadow-indigo-100/20' : 'bg-white dark:bg-slate-900 border-slate-100 shadow-sm hover:border-slate-200'}`}>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                            <h4 className={`text-base font-bold tracking-tight ${isLatest ? 'text-indigo-900' : 'text-slate-800 dark:text-slate-200'}`}>
                              {event.status}
                            </h4>
                            <div className="flex items-center text-xs font-mono font-medium text-slate-500 dark:text-slate-400 bg-slate-100/60 px-2.5 py-1 rounded-md">
                              {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {new Date(event.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <p className={`text-sm leading-relaxed max-w-2xl ${isLatest ? 'text-indigo-700/80 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
                            {event.description}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-4">Items in Order</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {orderData.items.map((item: any, i: number) => (
                  <div key={i} className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100">
                    <OrderItemImage item={item} products={products} />
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2 leading-tight mb-1">{item.title}</h4>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Qty: {item.quantity} × ৳{Number(item.price || 0).toLocaleString("en-BD", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
