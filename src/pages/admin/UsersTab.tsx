import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useStore } from '../../store';
import { useScrollLock } from '../../hooks/useScrollLock';
import { Search, Mail, Phone, Shield, User, Download, Trash2, Bell, X, ShoppingBag, MessageSquare, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';

interface UserData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  deletionRequested?: boolean;
}

function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query || !text) return <>{text || ''}</>;
  const lowerText = String(text).toLowerCase();
  const lowerQuery = String(query).toLowerCase();
  const idx = lowerText.indexOf(lowerQuery);
  if (idx === -1) return <>{text}</>;
  
  return (
    <>
      {String(text).substring(0, idx)}
      <span className="bg-yellow-200 text-slate-900 font-bold px-0.5 rounded">{String(text).substring(idx, idx + query.length)}</span>
      {String(text).substring(idx + query.length)}
    </>
  );
}

export default function UsersTab() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const { token, addToast } = useStore();

  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  useScrollLock(!!viewingUserId);

  const [roles, setRoles] = useState<any[]>([]);
  
  useEffect(() => {
    fetchUsers();
    api.get('/roles').then(data => setRoles(data || [])).catch(() => {});
  }, [token]);

  const handleUpdateRole = async (userId: string, targetRole: string, roleId?: string) => {
    try {
      await api.put(`/admin/users/${userId}`, { role: targetRole, roleId: roleId || null }, token);
      addToast('User role updated successfully', 'success');
      fetchUsers();
      if (userDetails && userDetails.id === userId) {
        setUserDetails({ ...userDetails, role: targetRole, roleId: roleId || null });
      }
    } catch (err) {
      addToast('Failed to update user role', 'error');
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await api.get('/admin/users', token);
      setUsers(data || []);
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  const [viewFilter, setViewFilter] = useState<'all' | 'pending'>('all');

  const handleApproveDeletion = async (userId: string) => {
    try {
      await api.post(`/admin/users/${userId}/approve-deletion`, {}, token);
      addToast('Account deleted successfully', 'success');
      setViewingUserId(null);
      setUserDetails(null);
      fetchUsers();
    } catch (err) {
      addToast('Failed to delete account', 'error');
    }
  };

  const handleDenyDeletion = async (userId: string) => {
    try {
      await api.post(`/admin/users/${userId}/deny-deletion`, {}, token);
      addToast('Deletion request denied', 'success');
      fetchUsers();
      if (viewingUserId === userId) {
        setViewingUserId(null); // Just close the modal, or you could refresh it.
      }
    } catch (err) {
      addToast('Failed to deny request', 'error');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase())) || 
                          (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (user.phone && user.phone.includes(searchQuery));
    if (viewFilter === 'pending') {
      return matchesSearch && user.deletionRequested;
    }
    return matchesSearch;
  });

  const toggleUser = (id: string) => {
    setSelectedUsers(prev => prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selectedUsers.length === filteredUsers.length && filteredUsers.length > 0) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Role', 'Created At', 'Last Visited'];
    const csvContent = [
      headers.join(','),
      ...filteredUsers.map(u => `"${u.id}","${u.name}","${u.email}","${u.phone || ''}","${u.role}","${u.createdAt ? new Date(u.createdAt).toLocaleString() : ''}","${u.lastVisited ? new Date(u.lastVisited).toLocaleString() : ''}"`)
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'quantumrig_users.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Users exported to CSV', 'success');
  };

  const handleBulkAction = async (action: 'notify' | 'deactivate') => {
    if (selectedUsers.length === 0) return;
    if (action === 'deactivate') {
        try {
            await api.post('/admin/users/bulk-delete', { userIds: selectedUsers }, token);
            addToast(`Successfully deactivated ${selectedUsers.length} users`, 'success');
            setSelectedUsers([]);
            fetchUsers();
        } catch (err) {
            addToast('Failed to deactivate users', 'error');
        }
    } else if (action === 'notify') {
        addToast(`Notification sent to ${selectedUsers.length} users (Mock)`, 'success');
        setSelectedUsers([]);
    }
  };

  const openUserDetails = async (id: string, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.checkbox-cell')) return;
    setViewingUserId(id);
    setLoadingDetails(true);
    try {
      const data = await api.get(`/admin/users/${id}`, token);
      setUserDetails(data);
    } catch (err) {
      console.error(err);
      addToast('Failed to load user details', 'error');
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <div className="p-6 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
           <h2 className="text-xl font-bold text-slate-900 tracking-tight">Registered Users</h2>
           <p className="text-sm text-slate-500 mt-1 mb-4">Manage and view all registered platform users.</p>
           <div className="flex bg-slate-100 p-1 rounded-lg w-fit">
             <button
               onClick={() => setViewFilter('all')}
               className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${viewFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-800 '}`}
             >
               All Users
             </button>
             <button
               onClick={() => setViewFilter('pending')}
               className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${viewFilter === 'pending' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-600 hover:text-rose-600'}`}
             >
               Pending Deletions
             </button>
           </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <input 
              type="text" 
              placeholder="Search by name, email or phone..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>
          <button 
            onClick={handleExportCSV}
            className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {selectedUsers.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 mb-6 flex items-center justify-between">
            <span className="text-sm font-bold text-indigo-800">{selectedUsers.length} users selected</span>
            <div className="flex gap-2">
                <button 
                    onClick={() => handleBulkAction('notify')}
                    className="flex items-center px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                >
                    <Bell className="w-3.5 h-3.5 mr-1.5" /> Notify
                </button>
                <button 
                    onClick={() => handleBulkAction('deactivate')}
                    className="flex items-center px-3 py-1.5 bg-rose-600 text-white rounded text-xs font-bold hover:bg-rose-700 transition-colors shadow-sm"
                >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Deactivate
                </button>
            </div>
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-slate-500">Loading users...</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-800 font-bold uppercase tracking-tight text-xs">
                <tr>
                  <th className="px-6 py-4 w-12 text-center checkbox-cell">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                      onChange={toggleAll}
                    />
                  </th>
                  <th 
                    className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors group select-none"
                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  >
                    <div className="flex items-center gap-1.5">
                      Name
                      {sortOrder === 'asc' ? (
                        <ArrowDown className="w-3.5 h-3.5 text-indigo-500" />
                      ) : (
                        <ArrowUp className="w-3.5 h-3.5 text-indigo-500" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-4 whitespace-nowrap">Email</th>
                  <th className="px-6 py-4 whitespace-nowrap">Phone</th>
                  <th className="px-6 py-4 whitespace-nowrap text-center">Role</th>
                  <th className="px-6 py-4 whitespace-nowrap">Created At</th>
                  <th className="px-6 py-4 whitespace-nowrap">Last Visited</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-900">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500 font-medium">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  [...filteredUsers].sort((a,b) => sortOrder === 'asc' ? (a.name || '').localeCompare(b.name || '') : (b.name || '').localeCompare(a.name || '')).map((user, index) => (
                    <tr 
                      key={user.id || `user-${index}`} 
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={(e) => openUserDetails(user.id, e)}
                    >
                      <td className="px-6 py-4 text-center checkbox-cell">
                        <input 
                          type="checkbox" 
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => toggleUser(user.id)}
                        />
                      </td>
                      <td className="px-6 py-4 font-medium whitespace-nowrap flex items-center">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center mr-3 font-bold">
                          {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <HighlightMatch text={user.name || 'Unknown'} query={searchQuery} />
                            {user.deletionRequested && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                                Deletion Requested
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-2 text-slate-400" />
                          <HighlightMatch text={user.email || 'No Email'} query={searchQuery} />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 mr-2 text-slate-400" />
                          {user.phone ? <HighlightMatch text={user.phone} query={searchQuery} /> : <span className="text-slate-400 italic">Not provided</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {user.role === 'admin' ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                            <Shield className="w-3 h-3 mr-1" /> Admin
                          </span>
                        ) : user.role === 'staff' ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <Shield className="w-3 h-3 mr-1" /> Staff / Manager
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            <User className="w-3 h-3 mr-1" /> User
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-slate-900 font-medium">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
                          <span className="text-xs text-slate-500">{user.createdAt ? new Date(user.createdAt).toLocaleTimeString() : ''}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-slate-900 font-medium">{user.lastVisited ? new Date(user.lastVisited).toLocaleDateString() : 'N/A'}</span>
                          <span className="text-xs text-slate-500">{user.lastVisited ? new Date(user.lastVisited).toLocaleTimeString() : ''}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {viewingUserId && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-slate-900 flex items-center tracking-tight">
                <User className="w-6 h-6 mr-3 text-indigo-600" />
                User Activity & Details
              </h3>
              <button 
                onClick={() => {setViewingUserId(null); setUserDetails(null);}}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-2 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-6 flex-1 bg-white">
              {loadingDetails || !userDetails ? (
                <div className="py-12 text-center text-slate-500 font-medium">Loading user history...</div>
              ) : (
                <div className="space-y-8">
                  {/* Account Details */}
                  <section>
                    {userDetails.deletionRequested && (
                      <div className="mb-6 bg-rose-50 border border-rose-200 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex items-center text-rose-800">
                          <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
                          <div>
                            <p className="font-bold">Account Deletion Requested</p>
                            <p className="text-sm">This user has requested to permanently delete their account.</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDenyDeletion(userDetails.id)}
                            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-bold text-sm whitespace-nowrap"
                          >
                            Deny Request
                          </button>
                          <button
                            onClick={() => handleApproveDeletion(userDetails.id)}
                            className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition font-bold text-sm whitespace-nowrap shadow-sm shadow-rose-600/20 flex items-center"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Approve Deletion
                          </button>
                        </div>
                      </div>
                    )}
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Account Overview</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-start">
                        <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-xl mr-4 shrink-0">
                          {userDetails.name ? userDetails.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-lg">{userDetails.name || 'Unknown'}</div>
                          <div className="text-sm text-slate-500">{userDetails.email || 'No Email'}</div>
                          <div className="text-sm text-slate-500 mt-1 flex items-center"><Phone className="w-3 h-3 mr-1"/> {userDetails.phone || 'N/A'}</div>
                        </div>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-center space-y-3">
                         <div>
                           <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Current Role</div>
                           <div className="flex items-center gap-2">
                             {userDetails.role === 'admin' ? (
                                 <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-indigo-100 text-indigo-700">
                                 <Shield className="w-4 h-4 mr-1.5" /> Admin
                                 </span>
                             ) : userDetails.role === 'staff' ? (
                                 <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-emerald-100 text-emerald-800">
                                 <Shield className="w-4 h-4 mr-1.5" /> Staff
                                 </span>
                             ) : (
                                 <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                 <User className="w-4 h-4 mr-1.5" /> User
                                 </span>
                             )}
                           </div>
                           
                           <div className="mt-4 pt-3 border-t border-slate-200">
                              <p className="text-xs font-bold text-slate-500 mb-2">Assign New Role:</p>
                              <select 
                                className="w-full text-sm p-2 border border-slate-300 rounded mb-2 bg-white"
                                value={userDetails.role === 'staff' ? (userDetails.roleId || 'staff') : userDetails.role}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === 'admin' || val === 'user') {
                                    handleUpdateRole(userDetails.id, val);
                                  } else {
                                    handleUpdateRole(userDetails.id, 'staff', val);
                                  }
                                }}
                              >
                                <option value="user">User (Standard)</option>
                                <option value="admin">Administrator (Full Access)</option>
                                <optgroup label="Custom Roles">
                                  {roles.map(r => (
                                    <option key={r.id} value={r.id}>Staff - {r.name}</option>
                                  ))}
                                </optgroup>
                              </select>
                           </div>
                         </div>
                         <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200 shadow-sm text-sm">
                           <span className="text-slate-500 font-medium">Joined:</span>
                           <span className="text-slate-900 font-bold">{userDetails.createdAt ? new Date(userDetails.createdAt).toLocaleDateString() : 'N/A'}</span>
                         </div>
                         <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200 shadow-sm text-sm">
                           <span className="text-slate-500 font-medium">Last Visit:</span>
                           <span className="text-slate-900 font-bold">{userDetails.lastVisited ? new Date(userDetails.lastVisited).toLocaleDateString() : 'N/A'}</span>
                         </div>
                      </div>
                    </div>
                  </section>

                  {/* Orders */}
                  <section>
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center">
                        <ShoppingBag className="w-4 h-4 mr-2 text-indigo-600" />
                        Order History ({userDetails.orders?.length || 0})
                    </h4>
                    {userDetails.orders?.length === 0 ? (
                        <p className="text-sm text-slate-500 italic">No orders placed by this user yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {userDetails.orders?.map((order: any, index: number) => (
                                <div key={order.id || `order-${index}`} className="border border-slate-200 rounded-lg p-4 flex justify-between items-center text-sm hover:border-indigo-300 transition-colors">
                                    <div>
                                        <div className="font-bold text-slate-900 mb-1">{order.id}</div>
                                        <div className="text-slate-500">{new Date(order.createdAt).toLocaleString()} • {order.items?.length || 0} items</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-slate-900 mb-1">৳{(order.totalAmount || 0).toLocaleString()}</div>
                                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold">{order.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                  </section>

                  {/* Support Tickets */}
                  <section>
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center">
                        <MessageSquare className="w-4 h-4 mr-2 text-indigo-600" />
                        Support Tickets ({userDetails.tickets?.length || 0})
                    </h4>
                    {userDetails.tickets?.length === 0 ? (
                        <p className="text-sm text-slate-500 italic">No support tickets.</p>
                    ) : (
                        <div className="space-y-3">
                            {userDetails.tickets?.map((ticket: any, index: number) => (
                                <div key={ticket.id || `ticket-${index}`} className="border border-slate-200 rounded-lg p-4 text-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold text-slate-900">{ticket.productId || 'General Inquiry'}</span>
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${ticket.status === 'Open' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600 '}`}>
                                            {ticket.status}
                                        </span>
                                    </div>
                                    <p className="text-slate-600 line-clamp-2">{ticket.question}</p>
                                </div>
                            ))}
                        </div>
                    )}
                  </section>
                  
                  {/* Complaints */}
                  {userDetails.complaints?.length > 0 && (
                      <section>
                        <h4 className="text-sm font-bold text-rose-600 uppercase tracking-wider mb-4 border-b border-rose-100 pb-2 flex items-center">
                            <AlertTriangle className="w-4 h-4 mr-2 text-rose-600" />
                            Complaints ({userDetails.complaints.length})
                        </h4>
                        <div className="space-y-3">
                            {userDetails.complaints.map((c: any, index: number) => (
                                <div key={c.id || `complaint-${index}`} className="border border-rose-200 bg-rose-50 rounded-lg p-4 text-sm">
                                    <div className="font-bold text-rose-900 mb-1">Order: {c.orderId || 'N/A'} • {c.category}</div>
                                    <p className="text-rose-700">{c.description}</p>
                                </div>
                            ))}
                        </div>
                      </section>
                  )}

                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                onClick={() => {setViewingUserId(null); setUserDetails(null);}}
                className="px-5 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
