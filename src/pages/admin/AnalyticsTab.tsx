import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../lib/api';
import { useStore } from '../../store';
import { Order } from '../../types';
import { 
  ShoppingCart, Users, Package, TrendingUp, TrendingDown, Minus, Download,
  Calendar, CalendarRange, X, ChevronLeft, ChevronRight, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import TakaIcon from '../../components/TakaIcon';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, BarChart, Bar 
} from 'recharts';
import { Link } from 'react-router-dom';

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444']; // Pending, Accepted, Delivered, Shipped
// Adjust mapping for pie chart
const STATUS_COLORS: Record<string, string> = {
  Pending: '#f59e0b',   // amber
  Verified: '#3b82f6',  // blue (using this for verified/accepted)
  Shipped: '#8b5cf6',   // violet
  Delivered: '#10b981'  // emerald
};

const getLocalDateString = (dateInput: Date | string) => {
  const dateObj = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function CustomDateInput({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  const parts = value ? value.split('-') : ['', '', ''];
  const [year, setYear] = useState(parts[0] || new Date().getFullYear().toString());
  const [month, setMonth] = useState(parts[1] || String(new Date().getMonth() + 1).padStart(2, '0'));
  const [day, setDay] = useState(parts[2] || String(new Date().getDate()).padStart(2, '0'));

  useEffect(() => {
    if (year && month && day) {
      const y = parseInt(year);
      const m = parseInt(month);
      const d = parseInt(day);
      if (y > 1900 && y < 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        onChange(`${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
      } else {
        onChange('');
      }
    } else {
      onChange('');
    }
  }, [year, month, day, onChange]);

  const monthInt = parseInt(month) || 1;
  const yearInt = parseInt(year) || new Date().getFullYear();
  const dayInt = parseInt(day) || 1;

  const daysInCurrentMonth = new Date(yearInt, monthInt, 0).getDate();

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col h-full hover:border-indigo-200 transition-colors">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</label>
        <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-sm font-bold font-mono tracking-tight border border-indigo-100 min-w-[110px] text-center">
          {year}-{String(monthInt).padStart(2, '0')}-{String(dayInt).padStart(2, '0')}
        </div>
      </div>
      
      <div className="space-y-6 flex-1 flex flex-col">
        
        {/* Year Input */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Year</label>
          <div className="flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 rounded-xl overflow-hidden p-1 w-full justify-between">
             <button 
               type="button"
               onClick={() => setYear(String(yearInt - 1))}
               className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 hover:bg-white dark:bg-slate-900 rounded-lg transition-colors shadow-sm"
             >
               <ChevronLeft className="w-5 h-5" />
             </button>
             <input 
               type="number" 
               min="2000" max="2100"
               value={yearInt} 
               onChange={e => setYear(e.target.value)}
               className="w-full bg-transparent text-center font-mono font-bold text-sm text-slate-800 dark:text-slate-200 outline-none"
             />
             <button 
               type="button"
               onClick={() => setYear(String(yearInt + 1))}
               className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 hover:bg-white dark:bg-slate-900 rounded-lg transition-colors shadow-sm"
             >
               <ChevronRight className="w-5 h-5" />
             </button>
          </div>
        </div>

        {/* Month Selection Grid */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Month</label>
          <div className="grid grid-cols-4 gap-1.5">
            {MONTHS.map((m, i) => {
              const mNum = i + 1;
              const isActive = mNum === monthInt;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMonth(String(mNum).padStart(2, '0'))}
                  className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-100 hover:border-indigo-200'
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>

        {/* Date Selection Grid */}
        <div className="flex flex-col gap-2 mt-auto">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-100">
            <span>Selected Day</span>
            <span className="text-indigo-600 font-bold bg-white dark:bg-slate-900 px-2 py-0.5 rounded shadow-sm border border-slate-200 text-xs">
              {dayInt} <span className="text-slate-400 font-normal">/ {daysInCurrentMonth}</span>
            </span>
          </label>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: daysInCurrentMonth }).map((_, i) => {
              const dNum = i + 1;
              const isActive = dNum === dayInt;
              return (
                <button
                  key={dNum}
                  type="button"
                  onClick={() => setDay(String(dNum).padStart(2, '0'))}
                  className={`h-8 rounded flex items-center justify-center text-[10px] font-mono transition-all ${
                    isActive 
                      ? 'bg-indigo-600 text-white font-bold scale-110 z-10 shadow-md rounded-md' 
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-100 hover:border-indigo-200'
                  }`}
                >
                  {dNum}
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

export default function AnalyticsTab() {
  const { token, analytics, setAnalytics, products } = useStore();
  const [loading, setLoading] = useState(!analytics);
  const [orders, setOrders] = useState<Order[]>([]);
  const [timeSegment, setTimeSegment] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');

  const [startDateStr, setStartDateStr] = useState<string>('');
  const [endDateStr, setEndDateStr] = useState<string>('');
  const [showDatePickerModal, setShowDatePickerModal] = useState<boolean>(false);

  const handleApplyPreset = (preset: 'lifetime' | '7days' | '30days' | '90days' | 'year') => {
    if (preset === 'lifetime') {
      setStartDateStr('');
      setEndDateStr('');
    } else {
      const end = new Date();
      const start = new Date();
      if (preset === '7days') {
        start.setDate(end.getDate() - 7);
      } else if (preset === '30days') {
        start.setDate(end.getDate() - 30);
      } else if (preset === '90days') {
        start.setDate(end.getDate() - 90);
      } else if (preset === 'year') {
        start.setFullYear(end.getFullYear() - 1);
      }
      setStartDateStr(getLocalDateString(start));
      setEndDateStr(getLocalDateString(end));
    }
  };

  const filteredOrders = useMemo(() => {
    const validOrders = orders.filter(o => o.status !== 'Cancelled');
    if (!startDateStr && !endDateStr) {
      return validOrders;
    }
    const startStr = startDateStr || '2000-01-01';
    const endStr = endDateStr || '2099-12-31';
    return validOrders.filter(o => {
      const orderDateStr = getLocalDateString(o.createdAt);
      return orderDateStr >= startStr && orderDateStr <= endStr;
    });
  }, [orders, startDateStr, endDateStr]);

  const periodRevenue = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  }, [filteredOrders]);

  const periodOrdersCount = useMemo(() => {
    return filteredOrders.length;
  }, [filteredOrders]);

  const weeklyData = useMemo(() => {
    const validOrders = orders.filter(o => o.status !== 'Cancelled');
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const targetDateStr = getLocalDateString(d);
      
      const dailyRevenue = validOrders
        .filter(o => getLocalDateString(o.createdAt) === targetDateStr)
        .reduce((sum, o) => sum + o.totalAmount, 0);
        
      return {
        name: dayNames[d.getDay()],
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        revenue: dailyRevenue
      };
    }).reverse();
  }, [orders]);

  const monthlyData = useMemo(() => {
    const validOrders = orders.filter(o => o.status !== 'Cancelled');
    
    return Array.from({ length: 30 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const targetDateStr = getLocalDateString(d);
      
      const dailyRevenue = validOrders
        .filter(o => getLocalDateString(o.createdAt) === targetDateStr)
        .reduce((sum, o) => sum + o.totalAmount, 0);
        
      return {
        name: `${d.getMonth() + 1}/${d.getDate()}`,
        revenue: dailyRevenue
      };
    }).reverse();
  }, [orders]);

  const yearlyData = useMemo(() => {
    const validOrders = orders.filter(o => o.status !== 'Cancelled');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return Array.from({ length: 12 }).map((_, i) => {
      const d = new Date();
      d.setDate(1); // prevent month overflow
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const monthIdx = d.getMonth();
      
      const monthlyRevenue = validOrders
        .filter(o => {
          const oDate = new Date(o.createdAt);
          return oDate.getFullYear() === year && oDate.getMonth() === monthIdx;
        })
        .reduce((sum, o) => sum + o.totalAmount, 0);
        
      return {
        name: `${monthNames[monthIdx]} '${String(year).slice(-2)}`,
        revenue: monthlyRevenue
      };
    }).reverse();
  }, [orders]);

  const customRangeData = useMemo(() => {
    if (!startDateStr || !endDateStr) return [];
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return [];
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 31) {
      return Array.from({ length: diffDays + 1 }).map((_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const targetDateStr = getLocalDateString(d);
        const dailyRevenue = filteredOrders
          .filter(o => getLocalDateString(o.createdAt) === targetDateStr)
          .reduce((sum, o) => sum + o.totalAmount, 0);
        return {
          name: `${d.getMonth() + 1}/${d.getDate()}`,
          revenue: Number(dailyRevenue)
        };
      });
    } else {
      const resultsMap: Record<string, number> = {};
      const d = new Date(start);
      d.setDate(1);
      const endMonth = new Date(end);
      endMonth.setDate(1);
      
      while (d <= endMonth) {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const key = `${monthNames[d.getMonth()]} '${String(d.getFullYear()).slice(-2)}`;
        resultsMap[key] = 0;
        d.setMonth(d.getMonth() + 1);
      }
      
      filteredOrders.forEach(o => {
        const oDate = new Date(o.createdAt);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const key = `${monthNames[oDate.getMonth()]} '${String(oDate.getFullYear()).slice(-2)}`;
        if (key in resultsMap) {
          resultsMap[key] += o.totalAmount;
        }
      });
      
      return Object.entries(resultsMap).map(([name, revenue]) => ({
        name,
        revenue: Number(revenue)
      }));
    }
  }, [startDateStr, endDateStr, filteredOrders]);

  const chartData = useMemo(() => {
    if (startDateStr && endDateStr) {
      return customRangeData;
    }
    if (timeSegment === 'weekly') return weeklyData;
    if (timeSegment === 'monthly') return monthlyData;
    return yearlyData;
  }, [startDateStr, endDateStr, customRangeData, timeSegment, weeklyData, monthlyData, yearlyData]);

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
    return <div className="p-6 text-slate-500 dark:text-slate-400 text-center">Failed to load analytics data.</div>;
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
        <div className="bg-[#111827] border border-slate-800/80 p-4 shadow-2xl shadow-slate-950/50 rounded-xl text-xs z-50 select-none backdrop-blur-sm min-w-[220px] text-left border-l-[4px] border-l-indigo-500 font-sans">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <span className="font-bold text-slate-100 tracking-tight text-sm truncate max-w-[150px]">{label}</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] font-bold text-indigo-400 font-sans tracking-widest uppercase">
              Inventory
            </span>
          </div>
          
          <div className="space-y-2">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Product Code</p>
              <p className="text-slate-300 font-mono text-[11px] mt-0.5 bg-slate-800/50 px-2 py-0.5 rounded border border-slate-800/40 inline-block">{p.code}</p>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Current Stock</p>
                <p className={`text-sm font-bold mt-0.5 flex items-center gap-1.5 ${p.isLowStock ? 'text-rose-400' : 'text-emerald-400'}`}>
                  <Package className="w-4 h-4 shrink-0" />
                  {p.stock} Units
                </p>
              </div>
              
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Demand State</p>
                <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 mt-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/50">
                  {p.trend === 'down' && <><TrendingDown className="w-3 h-3 text-rose-400 mr-1 shrink-0"/> Falling</>}
                  {p.trend === 'up' && <><TrendingUp className="w-3 h-3 text-emerald-400 mr-1 shrink-0"/> Surging</>}
                  {p.trend === 'same' && <><Minus className="w-3 h-3 text-slate-400 mr-1 shrink-0"/> Stable</>}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-2 mt-1 space-y-1 text-slate-400 text-[10px]">
              <div className="flex justify-between items-center">
                <span>Sold (This Week):</span>
                <span className="font-bold text-slate-200">{p.tw}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Sold (Last Week):</span>
                <span className="font-bold text-slate-300">{p.lw}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-800/40 pt-1 text-[9px]">
                <span>Projected Restock:</span>
                <span className={`font-bold ${p.isLowStock ? 'text-rose-400' : 'text-slate-300'}`}>{p.restockDateStr}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const RevenueTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const revenueVal = Number(payload[0].value);
      return (
        <div 
          id="custom-recharts-revenue-tooltip" 
          className="bg-[#111827] border border-slate-800/80 p-4 shadow-2xl shadow-slate-950/50 rounded-xl text-xs z-50 select-none backdrop-blur-sm min-w-[200px] text-left border-l-[4px] border-l-indigo-500 font-sans animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <span className="font-bold text-slate-400 tracking-wider text-[10px] uppercase">
              {label}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] font-bold text-indigo-400 uppercase tracking-widest">
              Revenue Stream
            </span>
          </div>

          {/* Details Row */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-slate-800 text-indigo-400">
                <TakaIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Total Revenue</p>
                <p className="text-sm font-bold text-slate-100 flex items-baseline">
                  ৳{revenueVal.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Accent Status Subtext */}
            <div className="flex items-center gap-1 text-[9px] text-slate-400 font-medium pt-1.5 border-t border-slate-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              <span>Direct Payment Analytics</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const OrderBreakdownTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const bulletColor = STATUS_COLORS[data.name] || '#6366f1';
      return (
        <div className="bg-[#111827] border border-slate-800/80 p-4 shadow-2xl shadow-slate-950/50 rounded-xl text-xs z-50 select-none backdrop-blur-sm min-w-[180px] text-left border-l-[4px] font-sans" style={{ borderLeftColor: bulletColor }}>
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <span className="font-bold text-slate-400 tracking-wider text-[10px] uppercase">
              {data.name}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1">
              <ShoppingCart className="w-2.5 h-2.5" /> Status
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: bulletColor }} />
              <div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Volume Count</p>
                <p className="text-sm font-bold text-slate-100">
                  {data.value} {Number(data.value) === 1 ? 'Order' : 'Orders'}
                </p>
              </div>
            </div>
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
    <div className="p-6 space-y-8 bg-slate-50 dark:bg-slate-950 min-h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Overview</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Review live financial metrics, order statuses, and projections.</p>
        </div>
      </div>

      {/* Time Period Filter Card */}
      <div id="admin-analytics-date-range-picker" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <CalendarRange className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Revenue Filter</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-xl">
            Quickly filter revenue, order volumes, and charts by pre-selected ranges, or select custom start and end dates below.
          </p>
          
          <button
            type="button"
            onClick={() => setShowDatePickerModal(true)}
            className="mt-3 relative group overflow-hidden rounded-xl border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 transition-all p-3 text-left block w-full max-w-sm cursor-pointer"
          >
            <div className="flex items-center justify-between relative z-10">
              <div>
                <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">
                  Selected Period
                </div>
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {startDateStr && endDateStr ? (
                    `${new Date(startDateStr).toLocaleDateString()} — ${new Date(endDateStr).toLocaleDateString()}`
                  ) : startDateStr ? (
                    `From ${new Date(startDateStr).toLocaleDateString()}`
                  ) : endDateStr ? (
                    `Until ${new Date(endDateStr).toLocaleDateString()}`
                  ) : (
                    'Lifetime / All Time'
                  )}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2 rounded-lg shadow-2xs group-hover:shadow border border-slate-100 transition-all group-hover:-translate-y-0.5">
                <Calendar className="w-4 h-4 text-indigo-600" />
              </div>
            </div>
            
            {/* Decorative background element */}
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-1/4 translate-y-1/4">
              <CalendarRange className="w-20 h-20 text-indigo-600" />
            </div>
          </button>
        </div>

        {/* Quick presets buttons */}
        <div className="flex flex-col gap-2 min-w-[280px]">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quick Range Shortcuts</span>
          <div className="grid grid-cols-2 gap-2">
            <button 
              type="button"
              onClick={() => handleApplyPreset('lifetime')}
              className={`px-3 py-2 border text-xs font-semibold rounded-xl transition-all text-center select-none cursor-pointer ${
                !startDateStr && !endDateStr
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:bg-slate-800 border-slate-200 text-slate-700 dark:text-slate-300'
              }`}
            >
              Lifetime Revenue
            </button>
            <button 
              type="button"
              onClick={() => handleApplyPreset('7days')}
              className={`px-3 py-2 border text-xs font-semibold rounded-xl transition-all text-center select-none cursor-pointer ${
                startDateStr && endDateStr && (Math.ceil(Math.abs(new Date(endDateStr).getTime() - new Date(startDateStr).getTime()) / (1000 * 60 * 60 * 24)) <= 7) && endDateStr === getLocalDateString(new Date())
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:bg-slate-800 border-slate-200 text-slate-700 dark:text-slate-300'
              }`}
            >
              Last 7 Days
            </button>
            <button 
              type="button"
              onClick={() => handleApplyPreset('30days')}
              className={`px-3 py-2 border text-xs font-semibold rounded-xl transition-all text-center select-none cursor-pointer ${
                startDateStr && endDateStr && (Math.ceil(Math.abs(new Date(endDateStr).getTime() - new Date(startDateStr).getTime()) / (1000 * 60 * 60 * 24)) === 30) && endDateStr === getLocalDateString(new Date())
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:bg-slate-800 border-slate-200 text-slate-700 dark:text-slate-300'
              }`}
            >
              Last 30 Days
            </button>
            <button 
              type="button"
              onClick={() => handleApplyPreset('90days')}
              className={`px-3 py-2 border text-xs font-semibold rounded-xl transition-all text-center select-none cursor-pointer ${
                startDateStr && endDateStr && (Math.ceil(Math.abs(new Date(endDateStr).getTime() - new Date(startDateStr).getTime()) / (1000 * 60 * 60 * 24)) === 90) && endDateStr === getLocalDateString(new Date())
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:bg-slate-800 border-slate-200 text-slate-700 dark:text-slate-300'
              }`}
            >
              Last 90 Days
            </button>
          </div>
          <button 
            type="button"
            onClick={() => handleApplyPreset('year')}
            className={`px-3 py-2 border text-xs font-semibold rounded-xl transition-all text-center select-none cursor-pointer ${
              startDateStr && endDateStr && (Math.ceil(Math.abs(new Date(endDateStr).getTime() - new Date(startDateStr).getTime()) / (1000 * 60 * 60 * 24)) >= 360) && endDateStr === getLocalDateString(new Date())
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                : 'bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:bg-slate-800 border-slate-200 text-slate-700 dark:text-slate-300'
            }`}
          >
            Last 1 Year
          </button>
        </div>
      </div>
      
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<TakaIcon className="w-8 h-8 text-indigo-600" />} 
          title={startDateStr || endDateStr ? "Selected Period Revenue" : "Total Revenue"} 
          value={`৳${(startDateStr || endDateStr ? periodRevenue : analytics.totalRevenue).toLocaleString()}`} 
        />
        <StatCard 
          icon={<ShoppingCart className="w-8 h-8 text-indigo-600" />} 
          title={startDateStr || endDateStr ? "Selected Period Orders" : "Total Orders"} 
          value={(startDateStr || endDateStr ? periodOrdersCount : analytics.totalOrders).toLocaleString()} 
        />
        <StatCard 
          icon={<Users className="w-8 h-8 text-indigo-600" />} 
          title="Total Users" 
          value={analytics.totalUsers.toLocaleString()} 
          to="/admin/users"
        />
        <StatCard 
          icon={<Package className="w-8 h-8 text-indigo-600" />} 
          title="Total Products" 
          value={analytics.totalProducts.toLocaleString()} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 shadow-sm min-h-[350px] flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center pr-2">
              <TrendingUp className="w-5 h-5 mr-3 text-indigo-600 shrink-0" />
              <span>
                {startDateStr && endDateStr ? (
                  `Revenue Over Time (${new Date(startDateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} — ${new Date(endDateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })})`
                ) : (
                  <>
                    {timeSegment === 'weekly' && "Revenue Over Time (Weekly)"}
                    {timeSegment === 'monthly' && "Revenue Over Time (Monthly - 30 Days)"}
                    {timeSegment === 'yearly' && "Revenue Over Time (Yearly - 12 Months)"}
                  </>
                )}
              </span>
            </h3>
            
            {/* Segment Controller or Active Badge */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {startDateStr && endDateStr ? (
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-1.5 flex items-center gap-1.5 tracking-wider uppercase select-none">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  Custom Period Active
                </span>
              ) : (
                <div className="flex bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 self-start sm:self-auto shrink-0 select-none">
                  {(['weekly', 'monthly', 'yearly'] as const).map((segment) => (
                    <button
                      key={segment}
                      type="button"
                      onClick={() => setTimeSegment(segment)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all capitalize cursor-pointer ${
                        timeSegment === segment
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:bg-slate-800'
                      }`}
                    >
                      {segment}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 w-full relative">
            <div className="absolute inset-0">
              <ResponsiveContainer width="99%" height="100%" minWidth={100} minHeight={100}>
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--chart-text)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--chart-text)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `৳${v}`} width={60} />
                  <Tooltip content={<RevenueTooltip />} />
                  <Line type="monotone" dataKey="revenue" stroke="var(--color-indigo-600)" strokeWidth={4} dot={{ r: 4, fill: 'var(--color-indigo-600)', strokeWidth: 2, stroke: 'var(--color-white)' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 shadow-sm min-h-[350px] flex flex-col">
          <h3 className="font-bold text-slate-900 dark:text-white mb-6 tracking-tight">Order Status Breakdown</h3>
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
                    <Tooltip content={<OrderBreakdownTooltip />} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-slate-500 dark:text-slate-400 font-medium z-10">No orders yet.</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Inventory Status Chart */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white tracking-tight">Inventory Status & Projections</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Visualizing up to 30 products sorted by lowest stock.</p>
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
        
        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 min-h-[400px] flex flex-col relative w-full">
          <div className="absolute inset-0 p-4">
            <ResponsiveContainer width="99%" height="100%" minWidth={100} minHeight={100}>
              <BarChart
                data={inventoryData}
                margin={{ top: 20, right: 30, left: 10, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100} 
                  interval={0} 
                  tick={{ fontSize: 10, fill: 'var(--chart-text)' }} 
                  tickMargin={10}
                />
                <YAxis tick={{ fontSize: 12, fill: 'var(--chart-text)' }} axisLine={false} tickLine={false} width={40} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--chart-grid)' }} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }}/>
                <Bar dataKey="stock" name="Inventory Count" radius={[4, 4, 0, 0]} label={<CustomBarLabel />}>
                  {inventoryData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.isLowStock ? 'var(--color-rose-500)' : 'var(--color-indigo-500)'} 
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
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-900 dark:text-white mb-6 tracking-tight">Top Selling Products</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-950">
              <tr>
                <th className="px-6 py-4 font-semibold">Rank</th>
                <th className="px-6 py-4 font-semibold">Product Title</th>
                <th className="px-6 py-4 font-semibold text-right">Units Sold</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analytics.topProducts.length > 0 ? (
                analytics.topProducts.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:bg-slate-950 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-400">#{idx + 1}</td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{p.title}</td>
                    <td className="px-6 py-4 font-bold text-indigo-600 text-right">{p.count}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    No sales data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Date Picker Modal */}
      <AnimatePresence>
        {showDatePickerModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-300">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base flex items-center gap-2">
                  <CalendarRange className="w-5 h-5 text-indigo-600" />
                  Select Custom Date Range
                </h3>
                <button 
                  type="button"
                  onClick={() => setShowDatePickerModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:text-slate-400 transition-colors p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 md:p-8 space-y-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <CustomDateInput label="Start Date" value={startDateStr} onChange={setStartDateStr} />
                  </div>
                  <div className="flex-1">
                    <CustomDateInput label="End Date" value={endDateStr} onChange={setEndDateStr} />
                  </div>
                </div>
                
                {startDateStr && endDateStr && new Date(startDateStr) > new Date(endDateStr) && (
                  <div className="p-3 border border-rose-200 text-rose-600 bg-rose-50 rounded-xl text-xs font-semibold flex items-center gap-2 animate-pulse">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    Start date cannot be after end date.
                  </div>
                )}

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setStartDateStr('');
                      setEndDateStr('');
                      setShowDatePickerModal(false);
                    }}
                    className="px-5 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 transition-colors text-xs"
                  >
                    Clear Filter
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDatePickerModal(false)}
                    className="px-5 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm text-xs disabled:opacity-50"
                    disabled={!!(startDateStr && endDateStr && new Date(startDateStr) > new Date(endDateStr))}
                  >
                    Apply Range
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ icon, title, value, to }: { icon: React.ReactNode, title: string, value: string | number, to?: string }) {
  // Determine if value is very long (like total revenue)
  const isLongValue = value.toString().length > 10;
  
  const content = (
    <div className={`bg-white dark:bg-slate-900 p-5 lg:p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4 h-full ${to ? 'hover:bg-slate-50 dark:bg-slate-950 transition-colors cursor-pointer' : ''}`}>
      <div className="p-3 flex-shrink-0 bg-indigo-50 rounded-lg">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 truncate" title={title}>{title}</p>
        <p className={`${isLongValue ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'} font-bold text-slate-900 dark:text-white break-words tracking-tight`} title={value.toString()}>{value}</p>
      </div>
    </div>
  );

  if (to) {
    return <Link to={to} className="block h-full">{content}</Link>;
  }
  return content;
}
