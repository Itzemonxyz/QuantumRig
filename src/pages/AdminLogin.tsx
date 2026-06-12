import React, { useState } from 'react';
import { useStore } from '../store';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Eye, EyeOff } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { login } = useStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.user.role !== 'admin') {
        throw new Error('Unauthorized Access. Admin credentials required.');
      }
      login(res.user, res.token);
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-md p-8 border border-slate-200">
        <div className="text-center mb-8">
          <div className="mx-auto bg-rose-50 w-12 h-12 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="w-6 h-6 text-rose-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Restricted Area
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
             Enter administrator credentials
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm mb-6 border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Admin Email</label>
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 text-slate-800 dark:text-slate-200 rounded-lg px-4 py-2.5 outline-none focus:bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Secret Key</label>
            <div className="relative">
              <input required type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 text-slate-800 dark:text-slate-200 rounded-lg px-4 py-2.5 outline-none focus:bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow pr-10" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:text-slate-400">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-lg font-bold transition-colors disabled:opacity-70 mt-4"
          >
            {loading ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
