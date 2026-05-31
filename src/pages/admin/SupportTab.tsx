import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useStore } from '../../store';
import { SupportTicket } from '../../types';

export default function SupportTab() {
  const { token } = useStore();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const data = await api.get('/support-tickets', token);
      setTickets(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: 'Open' | 'Closed') => {
    try {
      await api.put(`/support-tickets/${id}`, { status }, token);
      loadTickets();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-4 text-slate-500">Loading tickets...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-6 tracking-tight">Support Tickets</h2>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-800 font-bold uppercase tracking-tight text-xs">
              <tr>
                <th className="px-6 py-4">Ticket ID</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Question</th>
                <th className="px-6 py-4">Product ID</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-900">
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 font-medium">
                    No support tickets found.
                  </td>
                </tr>
              ) : tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">{ticket.id}</td>
                  <td className="px-6 py-4 font-medium">{ticket.email}</td>
                  <td className="px-6 py-4 max-w-xs"><div className="truncate" title={ticket.question}>{ticket.question}</div></td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">{ticket.productId}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                      ticket.status === 'Open' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {ticket.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-3 text-sm">
                    {ticket.status === 'Open' ? (
                      <button 
                        onClick={() => handleUpdateStatus(ticket.id, 'Closed')}
                        className="font-bold text-slate-600 hover:text-slate-900 transition-colors"
                      >
                        Close
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleUpdateStatus(ticket.id, 'Open')}
                        className="font-bold text-indigo-600 hover:text-indigo-900 transition-colors"
                      >
                        Reopen
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
