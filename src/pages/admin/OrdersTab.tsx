import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Order } from '../../types';
import { useStore } from '../../store';
import { Check, X, Clock, Download, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [sortOption, setSortOption] = useState<string>('oldest_first');
  const [statusFilters, setStatusFilters] = useState<string[]>(['Pending', 'Accepted', 'Shipped', 'Delivered', 'Cancelled']);
  const { token } = useStore();

  useEffect(() => {
    fetchOrders();
  }, []);

  const getSortedOrders = (data: Order[], option: string) => {
    const list = [...data];
    switch (option) {
      case 'oldest_first':
        return list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'newest_first':
        return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'highest_value':
        return list.sort((a, b) => b.totalAmount - a.totalAmount);
      case 'lowest_value':
        return list.sort((a, b) => a.totalAmount - b.totalAmount);
      case 'pending_first':
        return list.sort((a, b) => {
          if (a.status === 'Pending' && b.status !== 'Pending') return -1;
          if (a.status !== 'Pending' && b.status === 'Pending') return 1;
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
      case 'most_items':
        return list.sort((a, b) => {
          const aItems = a.items.reduce((sum, item) => sum + item.quantity, 0);
          const bItems = b.items.reduce((sum, item) => sum + item.quantity, 0);
          return bItems - aItems;
        });
      default:
        return list;
    }
  };

  const fetchOrders = async () => {
    const data = await api.get('/orders', token);
    setOrders(data);
  };

  const filteredOrders = orders.filter(o => statusFilters.length === 0 || statusFilters.includes(o.status));
  const sortedOrders = getSortedOrders(filteredOrders, sortOption);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/orders/${id}/status`, { status }, token);
      fetchOrders();
    } catch (e) {
      alert("Failed to update status");
    }
  };

  const updatePaymentStatus = async (id: string, paymentStatus: string) => {
    try {
      await api.put(`/orders/${id}/paymentStatus`, { paymentStatus }, token);
      fetchOrders();
    } catch (e) {
      alert("Failed to update payment status");
    }
  };

  const exportToCSV = () => {
    if (sortedOrders.length === 0) return;
    
    const headers = ['Order ID', 'Date', 'Customer Name', 'Phone', 'Address', 'Status', 'Payment Method', 'Payment Status', 'TrxID', 'Total Amount', 'Items Count'];
    
    const rows = sortedOrders.map(order => [
      order.id,
      `"${new Date(order.createdAt).toLocaleString().replace(/"/g, '""')}"`,
      `"${order.deliveryDetails.fullName.replace(/"/g, '""')}"`,
      `"${order.deliveryDetails.phone.replace(/"/g, '""')}"`,
      `"${order.deliveryDetails.address.replace(/"/g, '""')}"`,
      order.status,
      order.paymentMethod || 'Cash on Delivery',
      order.paymentStatus || 'Pending',
      order.transactionId || 'N/A',
      order.totalAmount.toFixed(2),
      order.items.reduce((sum, item) => sum + item.quantity, 0).toString()
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `orders_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    if (sortedOrders.length === 0) return;
    
    const doc = new jsPDF('landscape');
    
    doc.setFontSize(18);
    doc.text('Admin Orders Invoice Summary', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    
    const headers = [['Order ID', 'Date', 'Customer Name', 'Status', 'Payment', 'Total Amount', 'Items Count']];
    const data = sortedOrders.map(order => [
      order.id.slice(0, 8) + '...',
      new Date(order.createdAt).toLocaleDateString(),
      order.deliveryDetails.fullName,
      order.status,
      order.paymentStatus || 'Pending',
      `$${order.totalAmount.toFixed(2)}`,
      order.items.reduce((sum, item) => sum + item.quantity, 0).toString()
    ]);
    
    autoTable(doc, {
      startY: 40,
      head: headers,
      body: data,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 10, cellPadding: 3 },
    });
    
    doc.save(`orders_invoice_summary_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Manage Orders</h2>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={exportToCSV}
            disabled={sortedOrders.length === 0}
            className="flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Export to CSV
          </button>
          <button
            onClick={exportToPDF}
            disabled={sortedOrders.length === 0}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
          >
            <FileText className="w-4 h-4 mr-2" />
            Export to PDF
          </button>
          <div className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
            <label htmlFor="sort-orders" className="text-sm font-medium text-slate-600 px-2">Sort by:</label>
            <select
              id="sort-orders"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="border-none bg-white rounded-md py-1.5 px-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 shadow-sm"
            >
              <option value="oldest_first">Oldest First</option>
              <option value="newest_first">Newest First</option>
              <option value="highest_value">Highest Value</option>
              <option value="lowest_value">Lowest Value</option>
              <option value="pending_first">Action Required (Pending First)</option>
              <option value="most_items">Largest Orders (Most Items)</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-2 mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
        <span className="text-sm font-bold text-slate-700 mr-2">Filter by Status:</span>
        {['Pending', 'Accepted', 'Shipped', 'Delivered', 'Cancelled'].map(status => {
          const isActive = statusFilters.includes(status);
          let activeColor = 'bg-indigo-600 border-indigo-600 text-white shadow-sm';
          if (isActive) {
            if (status === 'Pending') activeColor = 'bg-amber-500 border-amber-500 text-white shadow-sm';
            if (status === 'Accepted') activeColor = 'bg-blue-500 border-blue-500 text-white shadow-sm';
            if (status === 'Shipped') activeColor = 'bg-violet-500 border-violet-500 text-white shadow-sm';
            if (status === 'Delivered') activeColor = 'bg-emerald-500 border-emerald-500 text-white shadow-sm';
            if (status === 'Cancelled') activeColor = 'bg-rose-500 border-rose-500 text-white shadow-sm';
          }
          return (
            <button
              key={status}
              onClick={() => {
                if (isActive) {
                  setStatusFilters(statusFilters.filter(s => s !== status));
                } else {
                  setStatusFilters([...statusFilters, status]);
                }
              }}
              className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${
                isActive
                  ? activeColor
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {status}
            </button>
          );
        })}
        {statusFilters.length < 5 && (
          <button
            onClick={() => setStatusFilters(['Pending', 'Accepted', 'Shipped', 'Delivered', 'Cancelled'])}
            className="px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors ml-auto underline"
          >
            Select All
          </button>
        )}
      </div>

      {sortedOrders.length === 0 ? (
        <p className="text-slate-500 text-center py-8 bg-white rounded-lg border border-slate-200">No orders found.</p>
      ) : (
        <div className="space-y-6">
          {sortedOrders.map(order => (
            <div key={order.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between mb-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Order #{order.id}</h3>
                  <p className="text-sm text-slate-500">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <div className="mt-4 md:mt-0 flex flex-wrap items-center gap-4">
                  <span className="font-bold text-xl text-indigo-600">৳{order.totalAmount.toFixed(2)}</span>
                  <select 
                    value={order.status}
                    onChange={(e) => updateStatus(order.id, e.target.value)}
                    className={`border rounded-lg px-4 py-1.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-colors cursor-pointer ${
                      order.status === 'Pending' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                      order.status === 'Accepted' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                      order.status === 'Shipped' ? 'bg-violet-100 text-violet-800 border-violet-200' :
                      order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                      order.status === 'Cancelled' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                      'bg-slate-50 border-slate-300'
                    }`}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Customer Details</h4>
                    <div className="text-sm text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-1">
                      <p><span className="font-medium text-slate-900">Name:</span> {order.deliveryDetails.fullName}</p>
                      <p><span className="font-medium text-slate-900">Phone:</span> {order.deliveryDetails.phone}</p>
                      <p><span className="font-medium text-slate-900">Address:</span> {order.deliveryDetails.address}</p>
                      {order.deliveryDetails.instructions && (
                        <div className="pt-2 mt-2 border-t border-slate-200/60">
                          <p><span className="font-medium text-slate-900 block mb-1">Instructions:</span> 
                            <span className="text-slate-600 block bg-slate-100 p-2 rounded italic">{order.deliveryDetails.instructions}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Payment Info</h4>
                    <div className={`p-4 rounded-lg border text-sm space-y-2 ${order.paymentMethod === 'Manual Payment' ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-100'}`}>
                      <p><span className="font-medium text-slate-900">Method:</span> <span className="font-semibold text-indigo-600">{order.paymentMethod || 'Cash on Delivery'}</span></p>
                      
                      {order.paymentMethod === 'Manual Payment' && (
                        <>
                          <p><span className="font-medium text-slate-900">TrxID:</span> <span className="font-mono bg-white px-2 py-0.5 rounded border border-orange-200 text-orange-900">{order.transactionId || 'N/A'}</span></p>
                          
                          <div className="flex items-center justify-between pt-2 mt-2 border-t border-orange-200/50">
                            <span className="font-medium text-slate-900 flex items-center">
                              Status: 
                              {order.paymentStatus === 'Verified' && <span className="ml-2 px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-700 flex items-center"><Check className="w-3 h-3 mr-1" /> Verified</span>}
                              {order.paymentStatus === 'Failed' && <span className="ml-2 px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-700 flex items-center"><X className="w-3 h-3 mr-1" /> Failed</span>}
                              {(!order.paymentStatus || order.paymentStatus === 'Pending') && <span className="ml-2 px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-700 flex items-center"><Clock className="w-3 h-3 mr-1" /> Pending</span>}
                            </span>
                            
                            <div className="flex gap-2">
                              {order.paymentStatus !== 'Verified' && (
                                <button 
                                  onClick={() => updatePaymentStatus(order.id, 'Verified')}
                                  className="text-xs font-semibold px-3 py-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-500 transition-colors"
                                >
                                  Verify
                                </button>
                              )}
                              {order.paymentStatus !== 'Failed' && (
                                <button 
                                  onClick={() => updatePaymentStatus(order.id, 'Failed')}
                                  className="text-xs font-semibold px-3 py-1.5 bg-rose-600 text-white rounded hover:bg-rose-500 transition-colors"
                                >
                                  Fail
                                </button>
                              )}
                              {order.paymentStatus !== 'Pending' && (
                                <button 
                                  onClick={() => updatePaymentStatus(order.id, 'Pending')}
                                  className="text-xs font-semibold px-3 py-1.5 border border-slate-300 text-slate-600 bg-white rounded hover:bg-slate-50 transition-colors"
                                >
                                  Reset
                                </button>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Items</h4>
                  <ul className="text-sm space-y-2 border border-slate-200 rounded-lg p-4 bg-slate-50">
                    {order.items.map(item => (
                      <li key={item.productId} className="flex justify-between border-b border-slate-200/60 pb-2 last:border-0 last:pb-0">
                        <span className="text-slate-700 line-clamp-1 flex-1 pr-4 font-medium">{item.quantity}x {item.title}</span>
                        <span className="font-bold text-slate-900">৳{(item.price * item.quantity).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                  {order.discountAmount ? (
                    <div className="mt-4 flex justify-between items-center text-sm px-4">
                      <span className="text-slate-500">Discount Added</span>
                      <span className="text-emerald-600 font-bold">-৳{(order.discountAmount).toFixed(2)}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
