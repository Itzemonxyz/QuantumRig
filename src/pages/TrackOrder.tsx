import React, { useState } from 'react';
import { api } from '../lib/api';
import { Search, Package, Navigation, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

export default function TrackOrder() {
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [error, setError] = useState('');

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;
    
    setLoading(true);
    setError('');
    setOrderData(null);
    
    try {
      const data = await api.get(`/public/orders/${orderId.trim()}`);
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">Track Your Order</h1>
        <p className="text-slate-500">Enter your order ID below to see the current status and tracking history.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
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
                <h2 className="text-xl font-bold text-slate-900 mb-1 flex items-center">
                  <Package className="w-6 h-6 mr-2 text-indigo-600" />
                  Order Status: <span className="text-indigo-600 ml-2">{orderData.status}</span>
                </h2>
                <div className="text-sm font-mono text-slate-500">ID: {orderData.id}</div>
              </div>
              <div className="text-right">
                <div className="text-slate-500 text-sm mb-1">Total Amount</div>
                <div className="font-bold text-xl text-slate-900">৳{orderData.totalAmount.toFixed(2)}</div>
              </div>
            </div>

            <div className="mb-10">
              <h3 className="font-bold text-slate-900 mb-6 flex items-center">
                <Navigation className="w-5 h-5 mr-2 text-slate-400" /> Tracking History
              </h3>
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                {orderData.trackingHistory?.map((event: any, i: number) => (
                  <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-200 text-slate-500 group-[.is-active]:bg-indigo-600 group-[.is-active]:text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10 transition-colors">
                      <div className="w-2.5 h-2.5 bg-current rounded-full" />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-slate-900">{event.status}</h4>
                        <time className="text-xs text-slate-500 font-mono">{new Date(event.date).toLocaleDateString()}</time>
                      </div>
                      <p className="text-slate-600 text-sm leading-snug">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 mb-4">Items in Order</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {orderData.items.map((item: any, i: number) => (
                  <div key={i} className="flex items-center gap-4 bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <div className="w-16 h-16 bg-white border border-slate-200 rounded-lg flex items-center justify-center p-2">
                      <img src={item.imageUrl} alt={item.title} className="max-w-full max-h-full object-contain mix-blend-multiply" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 text-sm line-clamp-2 leading-tight mb-1">{item.title}</h4>
                      <div className="text-xs text-slate-500">Qty: {item.quantity} × ৳{item.price.toFixed(2)}</div>
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
