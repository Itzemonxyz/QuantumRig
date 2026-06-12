import React, { useState } from 'react';
import { useStore } from '../../store';
import { api } from '../../lib/api';
import { Brand } from '../../types';
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react';

export default function BrandsTab() {
  const { brands, setBrands, token } = useStore();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/brands/${editId}`, { name, slug }, token);
      } else {
        await api.post('/brands', { name, slug }, token);
      }
      const updated = await api.get('/brands');
      setBrands(updated);
      setEditId(null);
      setName('');
      setSlug('');
    } catch (err) {
      alert("Failed to save brand");
    }
  };

  const handleEdit = (c: Brand) => {
    setEditId(c.id);
    setName(c.name);
    setSlug(c.slug);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await api.delete(`/brands/${id}`, token);
      const updated = await api.get('/brands');
      setBrands(updated);
    } catch(e) {
      alert("Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6">
       <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6">Manage Brands</h2>
       <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 mb-8 bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 rounded-lg">
         <div className="flex-1">
           <input required type="text" placeholder="Brand Name" value={name} onChange={e => { setName(e.target.value); if(!editId) setSlug(e.target.value.toLowerCase().replace(/ /g, '-')); }} className="w-full px-3 py-2 border rounded outline-none focus:border-indigo-500" />
         </div>
         <div className="flex-1">
           <input required type="text" placeholder="Slug" value={slug} onChange={e => setSlug(e.target.value)} className="w-full px-3 py-2 border rounded outline-none focus:border-indigo-500" />
         </div>
         <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-500 transition-colors">
            {editId ? 'Update' : 'Add'}
         </button>
         {editId && <button type="button" onClick={() => {setEditId(null); setName(''); setSlug('');}} className="bg-slate-300 text-slate-800 dark:text-slate-200 px-4 py-2 rounded">Cancel</button>}
       </form>

       <div className="border border-slate-200 rounded-lg overflow-hidden">
         <table className="w-full text-sm text-left">
           <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200">
             <tr>
               <th className="px-6 py-3">ID</th>
               <th className="px-6 py-3">Brand Name</th>
               <th className="px-6 py-3">Slug</th>
               <th className="px-6 py-3 text-right">Actions</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-slate-200">
              {brands.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 dark:bg-slate-950">
                  <td className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">{c.id}</td>
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{c.name}</td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{c.slug}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleEdit(c)} className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded mr-2 disabled:opacity-50" disabled={deletingId === c.id}><Edit2 className="w-4 h-4"/></button>
                    <button onClick={() => handleDelete(c.id)} className="text-rose-600 hover:bg-rose-50 p-1.5 rounded disabled:opacity-50" disabled={deletingId === c.id}>
                      {deletingId === c.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4"/>}
                    </button>
                  </td>
                </tr>
              ))}
           </tbody>
         </table>
       </div>
    </div>
  );
}
