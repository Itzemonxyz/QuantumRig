import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Order } from '../types';
import { Package, MapPin, ChevronDown, ChevronUp, CheckCircle2, Printer, Search, Loader, Clock, Calendar } from 'lucide-react';

interface PastOrdersListProps {
  token: string | null;
  initialOrders?: Order[];
}

export default function PastOrdersList({ token, initialOrders }: PastOrdersListProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders || []);
  const [loading, setLoading] = useState(!initialOrders);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (initialOrders) {
      setOrders(initialOrders);
      setLoading(false);
      return;
    }

    if (!token) {
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await api.get('/orders/user', token);
        setOrders(data || []);
      } catch (err: any) {
        console.error('Failed to fetch orders in past orders list:', err);
        setError('Failed to fetch your order history.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token, initialOrders]);

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
            <h1 style="color: #4f46e5;">QuantumRig Receipt</h1>
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
              <p><strong>Receiver:</strong> ${order.deliveryDetails?.fullName || 'N/A'}</p>
              <p><strong>Phone:</strong> ${order.deliveryDetails?.phone || 'N/A'}</p>
              <p><strong>Address:</strong> ${order.deliveryDetails?.address || 'N/A'}</p>
              ${order.deliveryDetails?.instructions ? `<p><strong>Instructions:</strong> ${order.deliveryDetails.instructions}</p>` : ''}
              <p><strong>Payment Method:</strong> ${order.paymentMethod || 'Cash on Delivery'}</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12" id="orders-loading">
        <Loader className="w-8 h-8 text-indigo-600 animate-spin mr-2" />
        <span className="text-slate-500 font-medium text-sm">Loading order details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-rose-500 bg-rose-50 rounded-xl border border-rose-100">
        {error}
      </div>
    );
  }

  const filteredOrders = orders.filter(order => 
    (order.id || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (order.items || []).some(item => (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6" id="past-orders-component">
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
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg">
          No orders match your search query.
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map(order => {
            const isExpanded = expandedOrders.has(order.id);
            return (
              <div key={order.id} className="border border-slate-200 rounded-xl overflow-hidden transition-all duration-300 bg-white">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Order Placed</span>
                    <span className="text-sm text-slate-900 font-bold font-mono flex items-center gap-2 bg-indigo-50/80 border border-indigo-100/80 px-2.5 py-0.5 rounded-lg">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>{new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      <span className="text-slate-300">|</span>
                      <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block sm:inline">Total</span>
                    <span className="text-sm text-slate-900 font-medium block sm:inline sm:ml-2">৳{Number(order.totalAmount || 0).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block sm:inline sm:hidden">Order ID</span>
                    <span className="text-sm text-slate-500 block sm:inline">#{order.id}</span>
                  </div>
                </div>
                
                <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex-1 w-full">
                    <div className="flex justify-between items-start w-full gap-4">
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
                            <li key={item.productId} className="font-medium">
                              {item.quantity}x {item.title}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="flex items-center space-x-2 shrink-0">
                        <button 
                          onClick={() => handlePrint(order)}
                          className="text-slate-600 hover:text-indigo-600 bg-white border border-slate-200 hover:border-indigo-200 px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center space-x-1"
                        >
                          <Printer className="w-4 h-4" />
                          <span className="hidden sm:inline">Print</span>
                        </button>
                        <button 
                          onClick={() => toggleOrderExpand(order.id)}
                          className="text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
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
                            {order.trackingHistory.map((step, idx) => (
                              <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-white bg-indigo-500 text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow z-10 translate-x-[3px]">
                                  <CheckCircle2 className="w-3 h-3" />
                                </div>
                                <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-slate-50 p-3 rounded border border-slate-100 shadow-sm ml-4 md:ml-0 translate-x-1">
                                  <div className="flex items-center justify-between mb-1 gap-2">
                                    <div className="font-bold text-slate-800 text-xs">{step.status}</div>
                                    <div className="text-xs text-slate-400 font-medium shrink-0">
                                      {new Date(step.date).toLocaleDateString()} {new Date(step.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </div>
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

                      {/* Delivery Detail summary */}
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
  );
}
