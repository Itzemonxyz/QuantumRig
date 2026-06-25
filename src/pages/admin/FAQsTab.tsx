import React, { useState, useEffect } from 'react';
import { FAQItem } from '../../types';
import { api } from '../../lib/api';
import { useStore } from '../../store';
import { Plus, Trash2, Edit2, HelpCircle, Loader2, Search, ArrowUp, ArrowDown } from 'lucide-react';

export default function FAQsTab() {
  const { token, setFaqs } = useStore();
  const [localFaqs, setLocalFaqs] = useState<FAQItem[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<FAQItem>>({
    question: '',
    answer: '',
    category: '',
    order: 1
  });

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchFaqs = async () => {
    try {
      const data = await api.get('/faqs');
      if (Array.isArray(data)) {
        const sorted = [...data].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setLocalFaqs(sorted);
        setFaqs(sorted); // Sync state store instantly
      }
    } catch (err) {
      console.error('Failed to load FAQs:', err);
    }
  };

  useEffect(() => {
    fetchFaqs();
    const intervalId = setInterval(fetchFaqs, 7000);
    return () => clearInterval(intervalId);
  }, []);

  const handleNew = () => {
    // Propose an order number that defaults to last_order + 1
    const nextOrder = localFaqs.length > 0 ? Math.max(...localFaqs.map(f => f.order ?? 0)) + 1 : 1;
    setForm({ question: '', answer: '', category: '', order: nextOrder });
    setIsEditing(true);
  };

  const handleEdit = (f: FAQItem) => {
    setForm({ ...f });
    setIsEditing(true);
  };

  const executeDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await api.delete(`/faqs/${id}`, token);
      await fetchFaqs();
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
      setDeleteConfirmId(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.question?.trim() || !form.answer?.trim()) return;
    setLoading(true);
    try {
      if (form.id) {
        await api.put(`/faqs/${form.id}`, form, token);
      } else {
        await api.post('/faqs', form, token);
      }
      setIsEditing(false);
      await fetchFaqs();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredFaqs = [...localFaqs].filter(faq => 
    (faq.question || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (faq.answer || '').toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    return sortOrder === 'asc' ? (a.question || '').localeCompare(b.question || '') : (b.question || '').localeCompare(a.question || '');
  });

  if (isEditing) {
    return (
      <div className="p-6 font-sans">
        <div className="flex items-center gap-2 mb-6 text-slate-900">
          <HelpCircle className="w-5 h-5 text-indigo-600" />
          <h2 className="text-xl font-extrabold tracking-tight uppercase">
            {form.id ? 'Edit FAQ Item' : 'Create New FAQ Item'}
          </h2>
        </div>

        <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-xs uppercase font-extrabold text-slate-500 tracking-wider mb-2">Question Title</label>
              <input 
                required 
                type="text" 
                value={form.question} 
                onChange={e => setForm({...form, question: e.target.value})} 
                className="w-full border border-slate-200 rounded-xl p-3 focus:ring-1 focus:ring-indigo-500 font-sans text-sm text-slate-800" 
                placeholder="e.g. Can I upgrade GPU after purchase?" 
              />
            </div>
            
            <div>
              <label className="block text-xs uppercase font-extrabold text-slate-500 tracking-wider mb-2">Category (Optional)</label>
              <input 
                type="text" 
                value={form.category || ''} 
                onChange={e => setForm({...form, category: e.target.value})} 
                className="w-full border border-slate-200 rounded-xl p-3 focus:ring-1 focus:ring-indigo-500 font-sans text-sm text-slate-800" 
                placeholder="e.g. Shipping, General, Payments" 
              />
            </div>
            
            <div>
              <label className="block text-xs uppercase font-extrabold text-slate-500 tracking-wider mb-2">Detailed Answer</label>
              <textarea 
                required 
                rows={5}
                value={form.answer} 
                onChange={e => setForm({...form, answer: e.target.value})} 
                className="w-full border border-slate-200 rounded-xl p-3 focus:ring-1 focus:ring-indigo-500 font-sans text-sm text-slate-800 leading-relaxed" 
                placeholder="Write a warm, helpful, structured response addressing the question clearly..." 
              />
            </div>

            <div className="w-2/5">
              <label className="block text-xs uppercase font-extrabold text-slate-500 tracking-wider mb-2">Sort Display Order</label>
              <input 
                required 
                type="number" 
                min="1" 
                value={form.order || 1} 
                onChange={e => setForm({...form, order: parseInt(e.target.value) || 1})} 
                className="w-full border border-slate-200 rounded-xl p-3 focus:ring-1 focus:ring-indigo-500 font-sans text-sm text-slate-800" 
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button 
              type="button" 
              onClick={() => setIsEditing(false)} 
              className="px-5 py-2.5 text-xs uppercase font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 text-xs uppercase font-bold flex items-center gap-2 transition-all shadow-sm"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {form.id ? 'Save Changes' : 'Publish FAQ'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="p-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight uppercase flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
            Dynamic FAQs Editor
          </h2>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-mono mt-1">
            Build, structure and maintain trust guidelines for Gamer assemblies
          </p>
        </div>
        <button 
          onClick={handleNew} 
          className="flex items-center text-xs uppercase font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 px-5 py-3 rounded-xl transition-all shadow-sm shrink-0 gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Add New Question
        </button>
      </div>

      <div className="mb-6 flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2.5 max-w-md">
        <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
        <input 
          type="text" 
          value={searchQuery} 
          onChange={e => setSearchQuery(e.target.value)} 
          placeholder="Search FAQs by question or answer keywords..." 
          className="w-full bg-transparent text-sm focus:outline-none text-slate-800 font-sans" 
        />
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-sm">
        <table className="w-full text-left text-sm whitespace-normal">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider w-16 text-center">Order</th>
              <th 
                className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider max-w-xs cursor-pointer hover:bg-slate-100 transition-colors group select-none"
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              >
                <div className="flex items-center gap-1.5">
                  Question
                  {sortOrder === 'asc' ? (
                    <ArrowDown className="w-3.5 h-3.5 text-indigo-500" />
                  ) : (
                    <ArrowUp className="w-3.5 h-3.5 text-indigo-500" />
                  )}
                </div>
              </th>
              <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">Answer Highlights</th>
              <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-right w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150 text-slate-700">
            {filteredFaqs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                  <HelpCircle className="w-8 h-8 mx-auto mb-2 text-slate-350" />
                  <p className="text-sm font-semibold text-slate-600">No FAQ Items Found</p>
                  <p className="text-xs text-slate-400 mt-1">Try resetting your search query or add a brand new Question</p>
                </td>
              </tr>
            ) : (
              filteredFaqs.map(faq => (
                <tr key={faq.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-center font-mono font-bold text-indigo-600 bg-slate-50/30">
                    {faq.order ?? 1}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-950 align-top max-w-xs leading-relaxed text-sm">
                    {faq.question}
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-xs align-top max-w-md leading-relaxed">
                    {faq.answer}
                  </td>
                  <td className="px-6 py-4 text-right align-top">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(faq)} 
                        title="Edit FAQ"
                        className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      
                      {deleteConfirmId === faq.id ? (
                        <div className="flex items-center gap-1.5 ml-2">
                          <button 
                            onClick={() => executeDelete(faq.id)}
                            disabled={deletingId === faq.id}
                            className="px-2 py-1 text-white bg-rose-500 hover:bg-rose-600 rounded drop-shadow-sm font-bold text-xs"
                          >
                            {deletingId === faq.id ? <Loader2 className="w-3 h-3 animate-spin inline mr-1" /> : null}
                            Yes, delete
                          </button>
                          <button 
                            disabled={deletingId === faq.id}
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded drop-shadow-sm font-bold text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setDeleteConfirmId(faq.id)} 
                          title="Delete FAQ"
                          className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
