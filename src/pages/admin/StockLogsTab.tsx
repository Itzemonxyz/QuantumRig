import React, { useEffect, useState } from 'react';
import { useStore } from '../../store';
import { api } from '../../lib/api';
import { StockAdjustmentLog } from '../../types';
import { Search, Calendar, User, ArrowUpCircle, ArrowDownCircle, RefreshCw, ClipboardList, Filter } from 'lucide-react';
import { motion } from 'motion/react';

export default function StockLogsTab() {
  const { token } = useStore();
  const [logs, setLogs] = useState<StockAdjustmentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'add' | 'subtract'>('all');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.get('/admin/stock-logs', token);
      if (Array.isArray(data)) {
        setLogs(data);
      }
    } catch (err) {
      console.error('Failed to fetch stock logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [token]);

  const filteredLogs = logs.filter(log => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      log.productTitle.toLowerCase().includes(query) ||
      log.userEmail.toLowerCase().includes(query) ||
      log.userName.toLowerCase().includes(query);

    if (typeFilter === 'all') return matchesSearch;
    if (typeFilter === 'add') return matchesSearch && log.amountChanged > 0;
    if (typeFilter === 'subtract') return matchesSearch && log.amountChanged < 0;

    return matchesSearch;
  });

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-indigo-600" />
            Stock Adjustment History
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tracking-wide uppercase mt-1">
            Real-time activity log of warehouse adjustments
          </p>
        </div>
        
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 dark:bg-slate-950 hover:text-indigo-600 disabled:opacity-50 transition-all shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Logs
        </button>
      </div>

      {/* Constraints & Filters Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 rounded-2xl p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by product, modifier name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            Filter Type:
          </span>
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/60 font-medium text-xs">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                typeFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white'
              }`}
            >
              All Actions
            </button>
            <button
              onClick={() => setTypeFilter('add')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                typeFilter === 'add'
                  ? 'bg-emerald-500 text-white shadow-sm font-semibold'
                  : 'text-emerald-700 hover:bg-white dark:bg-slate-900/50'
              }`}
            >
              <ArrowUpCircle className="w-3 h-3" />
              Additions
            </button>
            <button
              onClick={() => setTypeFilter('subtract')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                typeFilter === 'subtract'
                  ? 'bg-rose-500 text-white shadow-sm font-semibold'
                  : 'text-rose-700 hover:bg-white dark:bg-slate-900/50'
              }`}
            >
              <ArrowDownCircle className="w-3 h-3" />
              Subtractions
            </button>
          </div>
        </div>
      </div>

      {loading && logs.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center shadow-sm">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">Loading stock adjustment logs...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No stock logs found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search terms or filters to locate specific records.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-5">Timestamp</th>
                  <th className="py-4 px-5">Product Details</th>
                  <th className="py-4 px-5">Adjustment</th>
                  <th className="py-4 px-5">New Stock</th>
                  <th className="py-4 px-5">Modified By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredLogs.map((log) => {
                  const isAdd = log.amountChanged > 0;
                  return (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/55 transition-colors"
                    >
                      {/* Timestamp */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-xs font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-mono">{new Date(log.createdAt).toLocaleDateString()}</span>
                          <span className="text-slate-300">|</span>
                          <span className="font-mono text-slate-500 dark:text-slate-400">{new Date(log.createdAt).toLocaleTimeString()}</span>
                        </div>
                      </td>

                      {/* Product details */}
                      <td className="py-4 px-5">
                        <div className="font-semibold text-slate-900 dark:text-white max-w-xs truncate" title={log.productTitle}>
                          {log.productTitle}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono tracking-tight mt-0.5">
                          ID: {log.productId}
                        </div>
                      </td>

                      {/* Adjustment badge */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold leading-none ${
                          isAdd 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : 'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}>
                          {isAdd ? (
                            <>
                              <ArrowUpCircle className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="font-mono">+{log.amountChanged}</span>
                            </>
                          ) : (
                            <>
                              <ArrowDownCircle className="w-3.5 h-3.5 text-rose-500" />
                              <span className="font-mono">{log.amountChanged}</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* New Stock */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className="text-xs font-bold font-mono px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg border border-slate-200">
                          {log.newQuantity}
                        </span>
                      </td>

                      {/* Modified by user */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xs uppercase shrink-0">
                            {log.userName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs truncate max-w-[150px]">
                              {log.userName}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[150px] font-mono">
                              {log.userEmail}
                            </div>
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
