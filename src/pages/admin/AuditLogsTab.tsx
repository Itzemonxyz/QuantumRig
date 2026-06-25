import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useStore } from "../../store";
import { AuditLog } from "../../types";
import { FileText, Clock, User, Target, Search, ArrowUp, ArrowDown } from "lucide-react";

export default function AuditLogsTab() {
  const { token, addToast } = useStore();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<'desc'|'asc'>('desc');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.get("/audit-logs", token);
      setLogs(data);
    } catch (err: any) {
      addToast(err.message || "Failed to load audit logs", "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => 
    log.adminName?.toLowerCase().includes(search.toLowerCase()) || 
    log.action.toLowerCase().includes(search.toLowerCase()) || 
    log.details.toLowerCase().includes(search.toLowerCase())
  );

  const sortedLogs = [...filteredLogs].sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
  });

  return (
    <div>
      <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-500" />
          Audit Logs
        </h2>
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search logs..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      
      <div className="p-6">
        {loading ? (
          <div className="text-center py-10 text-slate-400">Loading audit logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-10 text-slate-400">No logs found.</div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-medium uppercase text-xs">
                  <tr>
                    <th 
                      className="px-6 py-4 border-b border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors group select-none"
                      onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                    >
                      <div className="flex items-center gap-1.5">
                        Time
                        {sortOrder === 'desc' ? (
                          <ArrowDown className="w-3.5 h-3.5 text-indigo-500" />
                        ) : (
                          <ArrowUp className="w-3.5 h-3.5 text-indigo-500" />
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-4 border-b border-slate-100">Admin</th>
                    <th className="px-6 py-4 border-b border-slate-100">Action</th>
                    <th className="px-6 py-4 border-b border-slate-100">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-mono text-xs flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" />
                          <span className="font-medium text-slate-700">{log.adminName || 'Unknown Admin'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex px-2 py-1 rounded-md font-bold uppercase tracking-wider text-[10px] items-center gap-1
                          ${log.action === 'CREATE' ? 'bg-emerald-100 text-emerald-700' :
                            log.action === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                            log.action === 'DELETE' ? 'bg-rose-100 text-rose-700' :
                            'bg-purple-100 text-purple-700'}`}
                        >
                          <Target className="w-3 h-3" />
                          {log.action}
                        </div>
                      </td>
                      <td className="px-6 py-4 min-w-[300px]">
                        <span className="text-slate-800">{log.details}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
