import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../lib/api';
import { useStore } from '../../store';
import { Order } from '../../types';
import { DollarSign, ShoppingCart, Users, Package, TrendingUp, TrendingDown, Minus, Download } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, BarChart, Bar 
} from 'recharts';

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444']; // Pending, Accepted, Delivered, Shipped
// Adjust mapping for pie chart
const STATUS_COLORS: Record<string, string> = {
  Pending: '#f59e0b',   // amber
  Verified: '#3b82f6',  // blue (using this for verified/accepted)
  Shipped: '#8b5cf6',   // violet
  Delivered: '#10b981'  // emerald
};

export default function AnalyticsTab() {
  const { token, analytics, setAnalytics, products } = useStore();
  const [loading, setLoading] = useState(!analytics);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await api.get('/admin/analytics', token);
        setAnalytics(data);
      } catch (err) {
        console.error("Failed to fetch analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [token, setAnalytics]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await api.get('/orders', token);
        setOrders(data);
      } catch(err) {
        console.error("Failed to fetch orders", err);
      }
    };
    fetchOrders();
  }, [token]);

  const inventoryData = useMemo(() => {
    const now = new Date().getTime();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    
    // Calculate sales per product for last week and previous week
    const salesThisWeek: Record<string, number> = {};
    const salesLastWeek: Record<string, number> = {};
    
    orders.forEach(order => {
      if (order.status === 'Cancelled') return;
      const orderTime = new Date(order.createdAt).getTime();
      const diff = now - orderTime;
      
      if (diff <= oneWeek) {
        order.items.forEach(item => {
          salesThisWeek[item.productId] = (salesThisWeek[item.productId] || 0) + item.quantity;
        });
      } else if (diff > oneWeek && diff <= oneWeek * 2) {
        order.items.forEach(item => {
          salesLastWeek[item.productId] = (salesLastWeek[item.productId] || 0) + item.quantity;
        });
      }
    });

    return products
      .map(p => {
        const tw = salesThisWeek[p.id] || 0;
        const lw = salesLastWeek[p.id] || 0;
        let trend = 'same';
        if (tw > lw) trend = 'down'; // Selling faster -> inventory trending down
        else if (tw < lw) trend = 'up'; // Selling slower -> inventory relatively higher/trending up (or less depletion)
        
        const avgWeeklySales = (tw + lw) / 2;
        const stock = p.inventoryCount || 0;
        
        let restockDateStr = 'Unknown';
        if (stock === 0) {
          restockDateStr = 'Out of Stock NOW';
        } else if (avgWeeklySales > 0) {
          const weeksUntilEmpty = stock / avgWeeklySales;
          const emptyDate = new Date(Date.now() + weeksUntilEmpty * 7 * 24 * 60 * 60 * 1000);
          restockDateStr = emptyDate.toLocaleDateString();
        } else {
          restockDateStr = 'No sales data';
        }

        return {
          name: p.title,
          code: p.code,
          stock,
          isLowStock: (p.inventoryCount !== undefined && p.inventoryCount < 5) || p.stockStatus === 'Out of Stock' || p.inventoryCount === 0,
          trend,
          tw,
          lw,
          restockDateStr
        };
      })
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 30);
  }, [products, orders]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return <div className="p-6 text-slate-500 text-center">Failed to load analytics data.</div>;
  }

  const pieData = Object.entries(analytics.orderBreakdown).map(([name, value]) => ({
    name, value
  })).filter(d => d.value > 0);

  const CustomBarLabel = (props: any) => {
    const { x, y, width, index } = props;
    const item = inventoryData[index];
    if (!item) return null;
    
    // Position slightly above the bar
    const xPos = x + width / 2;
    const yPos = y - 10;
    
    return (
      <g transform={`translate(${xPos},${yPos})`}>
        {item.trend === 'down' && <path d="M-4,0 L4,0 L0,4 Z" fill="#ef4444" />}
        {item.trend === 'up' && <path d="M-4,4 L4,4 L0,0 Z" fill="#10b981" />}
        {item.trend === 'same' && <rect x="-3" y="1" width="6" height="2" fill="#94a3b8" />}
      </g>
    );
  };
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="bg-white border border-slate-200 p-3 shadow-lg rounded-lg text-sm z-50 relative">
          <p className="font-bold text-slate-800 mb-1">{label}</p>
          <p className="text-slate-600">Code: <span className="font-mono">{p.code}</span></p>
          <div className="flex items-center gap-2 mt-1">
            <p className={`font-bold ${p.isLowStock ? 'text-rose-600' : 'text-emerald-600'}`}>
              Stock: {p.stock}
            </p>
            <span className="flex items-center text-xs font-medium px-1.5 py-0.5 rounded-md bg-slate-100">
              {p.trend === 'down' && <><TrendingDown className="w-3 h-3 text-rose-500 mr-1"/> Trending down</>}
              {p.trend === 'up' && <><TrendingUp className="w-3 h-3 text-emerald-500 mr-1"/> Trending up</>}
              {p.trend === 'same' && <><Minus className="w-3 h-3 text-slate-500 mr-1"/> Stable</>}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 border-t border-slate-200 pt-2 space-y-1">
            <p>Sales this week: {p.tw}</p>
            <p>Sales last week: {p.lw}</p>
            <p className="font-medium text-slate-700">Projected Empty: {p.restockDateStr}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  const handleDownloadCSV = () => {
    if (inventoryData.length === 0) return;
    
    const headers = ['Product', 'Code', 'Stock', 'Sales This Week', 'Sales Last Week', 'Inventory Trend', 'Projected Empty Date'];
    
    const rows = inventoryData.map(item => {
      let trendStr = 'Stable';
      if (item.trend === 'down') trendStr = 'Trending Down (High Sales)';
      if (item.trend === 'up') trendStr = 'Trending Up (Low Sales)';
      
      return [
        `"${item.name.replace(/"/g, '""')}"`,
        `"${item.code}"`,
        item.stock,
        item.tw,
        item.lw,
        trendStr,
        `"${item.restockDateStr}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `inventory_chart_data_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-8 bg-slate-50 min-h-full">
      <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Overview</h2>
      
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<DollarSign className="w-8 h-8 text-indigo-600" />} 
          title="Total Revenue" 
          value={`৳${analytics.totalRevenue.toLocaleString()}`} 
        />
        <StatCard 
          icon={<ShoppingCart className="w-8 h-8 text-indigo-600" />} 
          title="Total Orders" 
          value={analytics.totalOrders.toLocaleString()} 
        />
        <StatCard 
          icon={<Users className="w-8 h-8 text-indigo-600" />} 
          title="Total Users" 
          value={analytics.totalUsers.toLocaleString()} 
        />
        <StatCard 
          icon={<Package className="w-8 h-8 text-indigo-600" />} 
          title="Total Products" 
          value={analytics.totalProducts.toLocaleString()} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm min-h-[350px] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-white flex items-center">
              <TrendingUp className="w-5 h-5 mr-3 text-indigo-500" />
              Revenue Over Time (Last 7 Days)
            </h3>
          </div>
          <div className="flex-1 w-full relative">
            <div className="absolute inset-0">
              <ResponsiveContainer width="99%" height="100%" minWidth={100} minHeight={100}>
                <LineChart data={analytics.salesData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `৳${v}`} width={60} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#818cf8', fontWeight: 'bold' }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={4} dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#1e293b' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-h-[350px] flex flex-col">
          <h3 className="font-bold text-slate-900 mb-6 tracking-tight">Order Status Breakdown</h3>
          <div className="flex-1 w-full relative flex flex-col items-center justify-center">
            {pieData.length > 0 ? (
              <div className="absolute inset-0">
                <ResponsiveContainer width="99%" height="100%" minWidth={100} minHeight={100}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-slate-500 font-medium z-10">No orders yet.</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Inventory Status Chart */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h3 className="font-bold text-slate-900 tracking-tight">Inventory Status & Projections</h3>
            <p className="text-slate-500 text-sm mt-1">Visualizing up to 30 products sorted by lowest stock.</p>
          </div>
          <button 
            onClick={handleDownloadCSV}
            disabled={inventoryData.length === 0}
            className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Data
          </button>
        </div>
        
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 min-h-[400px] flex flex-col relative w-full">
          <div className="absolute inset-0 p-4">
            <ResponsiveContainer width="99%" height="100%" minWidth={100} minHeight={100}>
              <BarChart
                data={inventoryData}
                margin={{ top: 20, right: 30, left: 10, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100} 
                  interval={0} 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  tickMargin={10}
                />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} width={40} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }}/>
                <Bar dataKey="stock" name="Inventory Count" radius={[4, 4, 0, 0]} label={<CustomBarLabel />}>
                  {inventoryData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.isLowStock ? '#ef4444' : '#6366f1'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-rose-50 border border-rose-100 p-4 rounded-lg flex items-center justify-between">
            <div>
              <p className="text-rose-600 font-medium text-sm">Critical / Low Stock Items</p>
              <h3 className="text-2xl font-bold text-rose-700 mt-1">
                {products.filter(p => (p.inventoryCount !== undefined && p.inventoryCount < 5) || p.stockStatus === 'Out of Stock' || p.inventoryCount === 0).length}
              </h3>
            </div>
            <Package className="w-8 h-8 text-rose-200" />
          </div>
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-lg flex items-center justify-between">
            <div>
              <p className="text-emerald-700 font-medium text-sm">Total Items in Inventory</p>
              <h3 className="text-2xl font-bold text-emerald-800 mt-1">
                {products.reduce((acc, p) => acc + (p.inventoryCount || 0), 0)}
              </h3>
            </div>
            <Package className="w-8 h-8 text-emerald-200" />
          </div>
        </div>
      </div>

      {/* Top Selling Products */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-900 mb-6 tracking-tight">Top Selling Products</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50">
              <tr>
                <th className="px-6 py-4 font-semibold">Rank</th>
                <th className="px-6 py-4 font-semibold">Product Title</th>
                <th className="px-6 py-4 font-semibold text-right">Units Sold</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analytics.topProducts.length > 0 ? (
                analytics.topProducts.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-400">#{idx + 1}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{p.title}</td>
                    <td className="px-6 py-4 font-bold text-indigo-600 text-right">{p.count}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                    No sales data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value }: { icon: React.ReactNode, title: string, value: string | number }) {
  return (
    <div className="bg-white p-5 lg:p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4 h-full overflow-hidden">
      <div className="p-3 flex-shrink-0 bg-indigo-50 rounded-lg">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 truncate" title={title}>{title}</p>
        <p className="text-xl sm:text-2xl font-bold text-slate-900 truncate" title={value.toString()}>{value}</p>
      </div>
    </div>
  );
}
