import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useStore } from '../../store';
import { RefreshCw, CheckCircle, Package } from 'lucide-react';

export default function RestockRequestsTab() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useStore();

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await api.get('/admin/restock-requests', token);
      setRequests(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  return (
    <div className="bg-white border text-left border-slate-200 rounded-2xl p-6 shadow-sm">
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
                <th className="p-3 text-sm font-bold text-slate-500">Date</th>
                <th className="p-3 text-sm font-bold text-slate-500">Product</th>
                <th className="p-3 text-sm font-bold text-slate-500">User Details</th>
                <th className="p-3 text-sm font-bold text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(req => (
                <tr key={req.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="p-3 text-sm text-slate-600 whitespace-nowrap">{new Date(req.createdAt).toLocaleString()}</td>
                  <td className="p-3 font-medium text-slate-900 border-x border-slate-100">
                    <a href={`/products/${req.productId}`} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline flex flex-col">
                      <span>{req.productTitle}</span>
                      <span className="text-xs text-slate-400 font-mono mt-1">{req.productId}</span>
                    </a>
                  </td>
                  <td className="p-3 border-x border-slate-100">
                    <div className="text-sm font-bold text-slate-800">{req.userName}</div>
                    <div className="text-xs text-slate-500">{req.userEmail}</div>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {req.status === 'pending' ? (
                      <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold w-24 inline-block text-center border border-amber-200">Pending</span>
                    ) : (
                      <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center justify-center w-24 border border-emerald-200">
                        <CheckCircle className="w-3 h-3 mr-1" /> Notified
                      </span>
                    )}
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
