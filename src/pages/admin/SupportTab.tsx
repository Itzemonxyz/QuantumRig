import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useStore } from '../../store';
import { SupportTicket } from '../../types';
import { Trash2, Loader2, ClipboardList, LifeBuoy } from 'lucide-react';
import { useScrollLock } from '../../hooks/useScrollLock';

interface Complaint {
  id: string;
  name: string;
  email: string;
  orderId?: string;
  category: string;
  description: string;
  createdAt: string;
}

export default function SupportTab() {
  const { token } = useStore();
  const [subTab, setSubTab] = useState<'tickets' | 'complaints'>('tickets');
  
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const [deletingComplaintId, setDeletingComplaintId] = useState<string | null>(null);

  const [replyTicketId, setReplyTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  
  useScrollLock(!!replyTicketId);

  useEffect(() => {
    loadTickets();
    loadComplaints();
    const intervalId = setInterval(() => {
      if (!replyTicketId) loadTickets();
      if (!replyTicketId) loadComplaints();
    }, 5000);
    return () => clearInterval(intervalId);
  }, [replyTicketId]);

  const loadTickets = async () => {
    try {
      const data = await api.get('/support-tickets', token);
      setTickets(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTickets(false);
    }
  };

  const loadComplaints = async () => {
    try {
      const data = await api.get('/complaints', token);
      setComplaints(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingComplaints(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: 'Open' | 'Closed' | 'Answered') => {
    try {
      await api.put(`/support-tickets/${id}`, { status }, token);
      loadTickets();
    } catch (e) {
      console.error(e);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !replyTicketId) return;
    setSubmittingReply(true);
    try {
      await api.put(`/support-tickets/${replyTicketId}`, { status: 'Answered', answer: replyText }, token);
      setReplyTicketId(null);
      setReplyText('');
      loadTickets();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await api.delete(`/support-tickets/${id}`, token);
      loadTickets();
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteComplaint = async (id: string) => {
    setDeletingComplaintId(id);
    try {
      await api.delete(`/complaints/${id}`, token);
      loadComplaints();
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingComplaintId(null);
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Issues & Logs</h2>
          <p className="text-sm text-slate-500 mt-1">Manage support tickets and official customer complaints.</p>
        </div>
      </div>

      {/* Sub tabs selection */}
      <div className="flex space-x-6 border-b border-slate-200 mb-6">
        <button
          onClick={() => setSubTab('tickets')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 transition-colors border-b-2 ${
            subTab === 'tickets' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'text-slate-500 hover:text-slate-900 border-transparent'
          }`}
        >
          <LifeBuoy className="w-4 h-4" />
          Support Tickets ({tickets.length})
        </button>
        <button
          onClick={() => setSubTab('complaints')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 transition-colors border-b-2 ${
            subTab === 'complaints' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'text-slate-500 hover:text-slate-900 border-transparent'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Customer Complaints ({complaints.length})
        </button>
      </div>

      {subTab === 'tickets' ? (
        loadingTickets ? (
          <div className="p-4 text-slate-500">Loading tickets...</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-800 font-bold uppercase tracking-tight text-xs">
                  <tr>
                    <th className="px-6 py-4 whitespace-nowrap text-center">Ticket ID</th>
                    <th className="px-6 py-4 whitespace-nowrap">Email</th>
                    <th className="px-6 py-4 whitespace-nowrap">Question</th>
                    <th className="px-6 py-4 whitespace-nowrap text-center">Product ID</th>
                    <th className="px-6 py-4 whitespace-nowrap text-center">Status</th>
                    <th className="px-6 py-4 whitespace-nowrap text-right">Actions</th>
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
                      <td className="px-6 py-4 font-mono text-sm text-slate-600 whitespace-nowrap text-center">{ticket.id}</td>
                      <td className="px-6 py-4 font-medium whitespace-nowrap">{ticket.email}</td>
                      <td className="px-6 py-4 max-w-xs"><div className="truncate" title={ticket.question}>{ticket.question}</div></td>
                      <td className="px-6 py-4 font-mono text-sm text-slate-600 whitespace-nowrap text-center">
                        {ticket.productId && ticket.productId !== 'General Inquiry' ? (
                          <a href={`/products/${ticket.productId}`} target="_blank" rel="noopener noreferrer" className="font-bold text-indigo-600 hover:text-indigo-800 underline">
                            {ticket.productId}
                          </a>
                        ) : (
                          'General Inquiry'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                          ticket.status === 'Open' ? 'bg-indigo-100 text-indigo-700' :
                          ticket.status === 'Answered' ? 'bg-emerald-100 text-emerald-700' :
                           'bg-slate-100 text-slate-600'
                        }`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end space-x-3 text-sm text-right">
                        {ticket.status === 'Open' ? (
                          <>
                            <button 
                              onClick={() => setReplyTicketId(ticket.id)}
                              className="font-bold text-emerald-600 hover:text-emerald-900 transition-colors"
                            >
                              Reply
                            </button>
                            <button 
                              onClick={() => handleUpdateStatus(ticket.id, 'Closed')}
                              className="font-bold text-slate-600 hover:text-slate-900 transition-colors"
                            >
                              Close
                            </button>
                          </>
                        ) : (
                          <button 
                            onClick={() => handleUpdateStatus(ticket.id, 'Open')}
                            className="font-bold text-indigo-600 hover:text-indigo-900 transition-colors"
                          >
                            Reopen
                          </button>
                        )}
                        <button onClick={() => handleDelete(ticket.id)} disabled={deletingId === ticket.id} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors disabled:opacity-50">
                          {deletingId === ticket.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4" />}
                        </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        loadingComplaints ? (
          <div className="p-4 text-slate-500">Loading complaints...</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-300">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-800 font-bold uppercase tracking-tight text-xs">
                  <tr>
                    <th className="px-6 py-4 whitespace-nowrap text-center">ID</th>
                    <th className="px-6 py-4 whitespace-nowrap">Customer</th>
                    <th className="px-6 py-4 whitespace-nowrap">Order ID</th>
                    <th className="px-6 py-4 whitespace-nowrap">Category</th>
                    <th className="px-6 py-4 whitespace-nowrap">Description</th>
                    <th className="px-6 py-4 whitespace-nowrap">Date</th>
                    <th className="px-6 py-4 whitespace-nowrap text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-900">
                  {complaints.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-500 font-medium">
                        No customer complaints found.
                      </td>
                    </tr>
                  ) : complaints.map((complaint) => (
                    <tr key={complaint.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-sm text-slate-600 whitespace-nowrap text-center">{complaint.id.startsWith('cmp_') ? complaint.id.replace('cmp_', '') : complaint.id}</td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{complaint.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{complaint.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        {complaint.orderId ? (
                          <span className="bg-slate-100 text-slate-800 font-mono text-xs px-2 py-1 rounded font-bold">
                            {complaint.orderId}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-800 border border-amber-100">
                          {complaint.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-sm">
                        <div className="whitespace-pre-line text-xs font-medium text-slate-700 leading-relaxed max-h-24 overflow-y-auto pr-2" title={complaint.description}>
                          {complaint.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 font-medium">
                        {new Date(complaint.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDeleteComplaint(complaint.id)} 
                          disabled={deletingComplaintId === complaint.id} 
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all disabled:opacity-50"
                          title="Delete Complaint"
                        >
                          {deletingComplaintId === complaint.id ? (
                            <Loader2 className="w-4.5 h-4.5 animate-spin"/>
                          ) : (
                            <Trash2 className="w-4.5 h-4.5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Reply Modal */}
      {replyTicketId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-50 border-b border-slate-100 font-bold text-slate-800">
              Reply to Ticket #{replyTicketId}
            </div>
            <form onSubmit={handleReplySubmit} className="p-6 flex flex-col gap-4">
              <label className="text-sm font-bold text-slate-700">Your Answer</label>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your response here..."
                required
                rows={5}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex gap-3 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setReplyTicketId(null)}
                  className="px-4 py-2 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReply}
                  className="px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors text-sm disabled:opacity-50"
                >
                  {submittingReply ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
