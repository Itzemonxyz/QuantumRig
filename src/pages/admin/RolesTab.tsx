import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Role } from '../../types';
import { Shield, Plus, Edit2, Trash2, Check, X } from 'lucide-react';

const PERMISSION_KEYS = [
  'dashboard',
  'orders',
  'products',
  'inventory',
  'customers',
  'settings',
  'promotions',
  'support',
  'roles',
] as const;

export default function RolesTab() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState<Partial<Role> | null>(null);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const data = await api.get('/roles');
      setRoles(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole || !editingRole.name) return;

    try {
      if (editingRole.id) {
        await api.put(`/roles/${editingRole.id}`, editingRole);
      } else {
        await api.post('/roles', editingRole);
      }
      setEditingRole(null);
      fetchRoles();
    } catch(err) {
      console.error(err);
      alert('Failed to save role');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this role? Any staff with this role might lose access.")) return;
    try {
      await api.delete(`/roles/${id}`);
      fetchRoles();
    } catch(err) {
      console.error(err);
    }
  };

  const togglePermission = (key: string) => {
    if (!editingRole) return;
    const currentPerms = editingRole.permissions || {} as any;
    setEditingRole({
      ...editingRole,
      permissions: {
        ...currentPerms,
        [key]: !currentPerms[key]
      }
    } as any);
  };

  if (loading) return <div className="p-8 text-center">Loading Roles...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-600" /> Roles & Access Manager
          </h2>
          <p className="text-slate-500 text-sm mt-1">Create dynamic roles and assign section-level access to your branch managers & support agents.</p>
        </div>
        <button
          onClick={() => setEditingRole({ name: '', permissions: { dashboard: true } as any })}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" /> Create Role
        </button>
      </div>

      {editingRole && (
        <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl mb-8">
          <h3 className="font-bold text-lg mb-4">{editingRole.id ? 'Edit Role' : 'New Role Definition'}</h3>
          
          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Role Name</label>
            <input 
              type="text" 
              required
              value={editingRole.name || ''} 
              onChange={e => setEditingRole({ ...editingRole, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              placeholder="e.g. Support Agent, Inventory Manager"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Module Access Permissions</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {PERMISSION_KEYS.map(key => (
                <label key={key} className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-colors ${editingRole.permissions?.[key as keyof typeof editingRole.permissions] ? 'bg-indigo-50 border-indigo-200 text-indigo-800' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-indigo-200'}`}>
                   <input
                     type="checkbox"
                     className="w-4 h-4 text-indigo-600 rounded bg-white border-slate-300 focus:ring-indigo-600"
                     checked={!!editingRole.permissions?.[key as keyof typeof editingRole.permissions]}
                     onChange={() => togglePermission(key)}
                   />
                   <span className="text-sm font-medium capitalize">{key}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
             <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold flex gap-2 items-center">
                <Check className="w-4 h-4"/> Save Role
             </button>
             <button type="button" onClick={() => setEditingRole(null)} className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-6 py-2.5 rounded-xl font-bold flex gap-2 items-center">
                <X className="w-4 h-4"/> Cancel
             </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map(role => (
          <div key={role.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                 <Shield className="w-5 h-5 text-indigo-500" /> {role.name}
              </h3>
              <div className="flex gap-2">
                 <button onClick={() => setEditingRole(role)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4"/></button>
                 <button onClick={() => handleDelete(role.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
               {PERMISSION_KEYS.map(key => {
                 const hasAccess = role.permissions[key as keyof typeof role.permissions];
                 if (hasAccess) {
                   return <span key={key} className="px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full capitalize">{key}</span>;
                 }
                 return null;
               })}
               {!Object.values(role.permissions).some(Boolean) && (
                 <span className="text-sm font-medium text-slate-400 italic">No access configured</span>
               )}
            </div>
            
            <p className="text-xs text-slate-400 mt-4 font-mono">Created: {new Date(role.createdAt).toLocaleDateString()}</p>
          </div>
        ))}
        {roles.length === 0 && !editingRole && (
          <div className="col-span-full py-12 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-2xl">
            <Shield className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="font-medium">No custom roles defined.</p>
            <p className="text-sm">Click "Create Role" to start configuring access.</p>
          </div>
        )}
      </div>

    </div>
  );
}
