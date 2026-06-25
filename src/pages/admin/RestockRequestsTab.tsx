import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { useStore } from '../../store';
import { RefreshCw, CheckCircle, Package, Trash2, Loader2, Check, ArrowUp, ArrowDown } from 'lucide-react';

export default function RestockRequestsTab() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const { token, addToast } = useStore();

  const loadRequests = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const data = await api.get('/admin/restock-requests', token);
      setRequests(data);
    } catch (e) {
      console.error(e);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await api.delete(`/restock-requests/${id}`, token);
      loadRequests(true);
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  const handleAccept = async (id: string) => {
    setAcceptingId(id);
    try {
      await api.put(`/admin/restock-requests/${id}/accept`, {}, token);
      addToast('Restock request accepted successfully.', 'success');
      loadRequests(true);
    } catch (e) {
      console.error(e);
      addToast('Failed to accept request', 'error');
    } finally {
      setAcceptingId(null);
    }
  };

  useEffect(() => {
    loadRequests();
    const intervalId = setInterval(() => {
      loadRequests(true);
    }, 5000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold flex items-center">
          <RefreshCw className="mr-2" /> Restock Requests
        </h2>
        <button onClick={loadRequests} className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-bold text-sm">
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-slate-500 py-10 text-center">Loading...</div>
      ) : requests.length === 0 ? (
        <div className="text-slate-500 py-10 text-center">No restock requests found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th 
                  className="px-6 py-4 text-sm font-bold text-slate-500 cursor-pointer hover:bg-slate-100 transition-colors group select-none"
                  onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                >
                  <div className="flex items-center gap-1.5">
                    Date
                    {sortOrder === 'desc' ? (
                      <ArrowDown className="w-3.5 h-3.5 text-indigo-500" />
                    ) : (
                      <ArrowUp className="w-3.5 h-3.5 text-indigo-500" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 text-sm font-bold text-slate-500">Product</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-500">User Details</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-500">Status</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...requests].sort((a,b) => sortOrder === 'desc' ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map(req => (
                <tr key={req.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">{new Date(req.createdAt).toLocaleString()}</td>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    <Link to={`/admin/products?q=${req.productId}`} className="text-indigo-600 hover:underline flex flex-col">
                      <span>{req.productTitle}</span>
                      <span className="text-xs text-slate-400 font-mono mt-1">{req.productId}</span>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-slate-800">{req.userName}</div>
                    <div className="text-xs text-slate-500">{req.userEmail}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {req.status === 'pending' ? (
                      <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold w-24 inline-block text-center border border-amber-200">Pending</span>
                    ) : req.status === 'accepted' ? (
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center justify-center w-24 border border-blue-200">
                        <Check className="w-3 h-3 mr-1" /> Accepted
                      </span>
                    ) : (
                      <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center justify-center w-24 border border-emerald-200">
                        <CheckCircle className="w-3 h-3 mr-1" /> Restocked
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                       {req.status === 'pending' && (
                          <button onClick={() => handleAccept(req.id)} disabled={acceptingId === req.id} className="text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded shadow-sm text-xs font-bold disabled:opacity-50 inline-flex items-center justify-center">
                            {acceptingId === req.id ? <Loader2 className="w-3 h-3 animate-spin"/> : 'Accept'}
                          </button>
                       )}
                       <button onClick={() => handleDelete(req.id)} disabled={deletingId === req.id} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors disabled:opacity-50 inline-flex items-center justify-center">
                         {deletingId === req.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4" />}
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
