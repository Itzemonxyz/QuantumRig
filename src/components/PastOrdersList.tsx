import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Order } from '../types';
import { Package, Printer, Search, Loader, Clock, Calendar, ArrowRight } from 'lucide-react';

interface PastOrdersListProps {
  token: string | null;
  initialOrders?: Order[];
}

export default function PastOrdersList({ token, initialOrders }: PastOrdersListProps) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalOrders, setTotalOrders] = useState(0);

  useEffect(() => {
    if (!token) return;

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await api.get(`/orders/user?page=${page}&limit=5`, token);
        if (data && data.data) {
           if (page === 1) {
             setOrders(data.data);
           } else {
             setOrders(prev => [...prev, ...data.data]);
           }
           setTotalOrders(data.total);
           setHasMore(page < data.totalPages);
        } else {
           // fallback if server hasn't restarted yet
           setOrders(data || []);
           setHasMore(false);
        }
      } catch (err: any) {
        console.error('Failed to fetch orders:', err);
        setError('Failed to fetch your order history.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token, page]);

  const handlePrint = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt_Order_${order.id}</title>
          <style>
            @media print {
              @page { margin: 0; }
              body { margin: 1.6cm; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .no-print { display: none !important; }
            }
            body { font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #1e293b; padding: 3rem; max-width: 800px; margin: 0 auto; line-height: 1.5; }
            .print-btn { background: #0f172a; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 500; font-size: 14px; margin-bottom: 2rem; float: right; transition: opacity 0.2s; }
            .print-btn:hover { opacity: 0.9; }
            .brand { display: flex; align-items: center; gap: 12px; margin-bottom: 3rem; }
            .header { display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 2.5rem; margin-bottom: 3rem; align-items: flex-end; }
            .header-info p { margin: 0.25rem 0; color: #64748b; font-size: 14px; }
            .header-info h2 { font-size: 32px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; margin: 0 0 0.5rem 0; }
            .header-info strong { color: #0f172a; font-weight: 600; }
            .section { margin-bottom: 3rem; }
            .section h3 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1.5rem; color: #64748b; font-weight: 600; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 2rem; }
            th, td { padding: 1rem 0; text-align: left; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #334155; }
            th { font-weight: 600; color: #94a3b8; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; padding-bottom: 0.5rem; }
            .item-title { font-weight: 500; color: #0f172a; }
            .total-row { display: flex; justify-content: flex-end; }
            .total-box { min-width: 300px; padding-top: 1rem; }
            .total-line { display: flex; justify-content: space-between; margin-bottom: 0.75rem; font-size: 14px; color: #64748b; }
            .total-line.grand-total { border-top: 1px solid #0f172a; padding-top: 1rem; margin-top: 1rem; font-size: 20px; font-weight: 700; color: #0f172a; }
            .details { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 4rem; }
            .detail-box { }
            .detail-box p { margin: 0 0 0.25rem 0; color: #334155; font-size: 14px; }
            .detail-box h4 { color: #94a3b8; margin: 0 0 0.5rem 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
            .footer { text-align: center; margin-top: 5rem; padding-top: 2rem; border-top: 1px solid #f1f5f9; color: #94a3b8; font-size: 13px; }
          </style>
        </head>
        <body>
          <button class="no-print print-btn" onclick="window.print()">Print Receipt</button>
          
          <div class="brand">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 32px; height: 32px;">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
            <div style="font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">Quantum<span style="color: #4f46e5;">Rig</span></div>
          </div>
          
          <div class="header">
            <div class="header-info">
              <h2>Receipt</h2>
              <p><strong>Order #</strong> ${order.id}</p>
              <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
              <p><strong>Status:</strong> ${order.status}</p>
            </div>
            <div class="header-info" style="text-align: right;">
              <p style="text-transform: uppercase; font-size: 11px; font-weight: 600; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 0.5rem;">Billed To</p>
              <p><strong>${order.deliveryDetails?.fullName || 'N/A'}</strong></p>
              <p>${order.deliveryDetails?.phone || 'N/A'}</p>
              <p>${order.deliveryDetails?.address || ''}</p>
            </div>
          </div>
          
          <div class="section">
            <h3>Order Items</h3>
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(item => `
                  <tr>
                    <td>
                      <div class="item-title">${item.title}</div>
                      ${item.selectedOptions && Object.keys(item.selectedOptions).length > 0 ? `
                        <div style="font-size: 10px; color: #4338ca; margin-top: 3px; font-weight: 600;">
                          ${Object.entries(item.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                        </div>
                      ` : ''}
                      ${item.warranty ? `
                        <div style="font-size: 9px; color: #475569; margin-top: 2px; font-weight: 500;">
                          Warranty: ${item.warranty}
                        </div>
                      ` : ''}
                    </td>
                    <td style="text-align: center;">${item.quantity}</td>
                    <td style="text-align: right; color: #0f172a; font-weight: 500;">৳${Number((item.price * item.quantity) || 0).toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="total-row">
              <div class="total-box">
                <div class="total-line">
                  <span>Subtotal</span>
                  <span>৳${Number(order.totalAmount || 0).toLocaleString("en-BD", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
                <div class="total-line">
                  <span>Shipping</span>
                  <span>Calculated</span>
                </div>
                <div class="total-line grand-total">
                  <span>Total</span>
                  <span>৳${Number(order.totalAmount || 0).toLocaleString("en-BD", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <h3>Delivery & Payment</h3>
            <div class="details">
              <div class="detail-box">
                <h4>Shipping Address</h4>
                <p>${order.deliveryDetails?.address || 'N/A'}</p>
                ${order.deliveryDetails?.instructions ? `<p style="margin-top: 1rem;"><h4>Instructions</h4>${order.deliveryDetails.instructions}</p>` : ''}
              </div>
              <div class="detail-box">
                <h4>Payment Method</h4>
                <p>${order.paymentMethod || 'Cash on Delivery'}</p>
              </div>
            </div>
          </div>
          
          <div class="footer">
            <p>Thank you for shopping with QuantumRig!</p>
            <p>If you have any questions concerning this invoice, please contact support.</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    
    // Slight delay to ensure styles are loaded before print dialog appears
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12" id="orders-loading">
        <Loader className="w-8 h-8 text-indigo-600 animate-spin mr-2" />
        <span className="text-slate-500 dark:text-slate-400 font-medium text-sm">Loading order details...</span>
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
          className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 dark:bg-slate-950 focus:bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm font-medium"
        />
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12 px-4 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200">
          <div className="w-20 h-20 bg-slate-50 dark:bg-slate-950 text-indigo-400 rounded-full flex items-center justify-center mb-4">
             <Package className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No orders yet</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm max-w-sm mx-auto tracking-tight">You haven't placed any orders. Start browsing our catalog to find the best hardware for your next build.</p>
          <a href="/products" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl transition-colors text-sm shadow-sm">
            Browse Products
          </a>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 rounded-lg">
          No orders match your search query.
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map(order => {
            return (
              <div key={order.id} className="border border-slate-200 rounded-xl overflow-hidden transition-all duration-300 bg-white dark:bg-slate-900">
                <div className="bg-slate-50 dark:bg-slate-950 px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Order Placed</span>
                    <span className="text-sm text-slate-900 dark:text-white font-bold font-mono flex items-center gap-2 bg-indigo-50/80 border border-indigo-100/80 px-2.5 py-0.5 rounded-lg">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>{new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      <span className="text-slate-300">|</span>
                      <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold block sm:inline">Total</span>
                    <span className="text-sm text-slate-900 dark:text-white font-medium block sm:inline sm:ml-2">৳{Number(order.totalAmount || 0).toLocaleString("en-BD", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold block sm:inline sm:hidden">Order ID</span>
                    <span className="text-sm text-slate-500 dark:text-slate-400 block sm:inline">#{order.id}</span>
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
                        <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-3">
                          {order.items.map((item, idx) => (
                            <li key={idx} className="font-medium">
                              <div className="flex flex-col">
                                <span className="text-slate-800 dark:text-slate-200 font-semibold">{item.quantity}x {item.title}</span>
                                {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1 font-sans">
                                    {Object.entries(item.selectedOptions).map(([key, val]) => (
                                      <span key={key} className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5 uppercase tracking-wide">
                                        {key}: {val}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {item.warranty && (
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium font-sans mt-0.5">
                                    Warranty: {item.warranty}
                                  </span>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="flex items-center space-x-2 shrink-0">
                        <button 
                          onClick={() => handlePrint(order)}
                          className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 bg-white dark:bg-slate-900 border border-slate-200 hover:border-indigo-200 px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center space-x-1"
                        >
                          <Printer className="w-4 h-4" />
                          <span className="hidden sm:inline">Download PDF</span>
                        </button>
                        <button 
                          onClick={() => navigate(`/track-order/${order.id}`)}
                          className="text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-lg text-sm font-bold transition-colors flex items-center space-x-1"
                        >
                          <span>Track Package</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {hasMore && (
            <div className="flex justify-center mt-6">
              <button 
                onClick={() => setPage(p => p + 1)} 
                disabled={loading}
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
