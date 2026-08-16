import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  ShoppingBag, 
  Package, 
  CheckCircle2, 
  Building2, 
  BarChart3, 
  PieChart as PieIcon,
  Sparkles,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, isWithinInterval, parseISO, startOfWeek, endOfWeek, subWeeks, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface OrderItem {
  id: number;
  productId: number;
  quantity: number;
  price: number;
  product?: {
    nama_barang: string;
    kategori?: string;
  };
}

interface Order {
  id: number;
  userId: number;
  total_amount: number;
  status: string;
  keterangan?: string;
  createdAt: string;
  user?: {
    id: number;
    nama: string;
    pt: string;
    departemen: string;
    no_hp: string;
  };
  items: OrderItem[];
}

interface SalesTrendChartProps {
  orders: Order[];
}

type TimeRange = '7days' | '30days' | '4weeks' | '6months';
type MetricView = 'revenue' | 'orders';

export const SalesTrendChart: React.FC<SalesTrendChartProps> = ({ orders }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('7days');
  const [metricView, setMetricView] = useState<MetricView>('revenue');
  const [statusFilter, setStatusFilter] = useState<'all' | 'valid' | 'completed'>('valid');

  // Filter orders by status rule
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const st = (order.status || '').toLowerCase();
      if (statusFilter === 'completed') {
        return st.includes('selesai') || st === 'completed';
      }
      if (statusFilter === 'valid') {
        return !st.includes('batal') && st !== 'cancelled';
      }
      return true; // 'all'
    });
  }, [orders, statusFilter]);

  // Generate chart trend data based on selected time range
  const trendData = useMemo(() => {
    const now = new Date();

    if (timeRange === '7days' || timeRange === '30days') {
      const daysCount = timeRange === '7days' ? 7 : 30;
      const result = [];

      for (let i = daysCount - 1; i >= 0; i--) {
        const targetDate = subDays(now, i);
        const dayStart = startOfDay(targetDate);
        const dayEnd = endOfDay(targetDate);

        const dayOrders = filteredOrders.filter(order => {
          if (!order.createdAt) return false;
          const orderDate = new Date(order.createdAt);
          return isWithinInterval(orderDate, { start: dayStart, end: dayEnd });
        });

        let omzet = 0;
        let itemTerjual = 0;

        dayOrders.forEach(o => {
          omzet += o.total_amount || 0;
          o.items?.forEach(it => {
            itemTerjual += it.quantity || 0;
          });
        });

        result.push({
          label: format(targetDate, daysCount === 7 ? 'EEE, dd MMM' : 'dd MMM', { locale: idLocale }),
          fullDate: format(targetDate, 'dd MMMM yyyy', { locale: idLocale }),
          omzet,
          transaksi: dayOrders.length,
          itemTerjual,
        });
      }

      return result;
    }

    if (timeRange === '4weeks') {
      const result = [];
      for (let i = 3; i >= 0; i--) {
        const weekTarget = subWeeks(now, i);
        const wStart = startOfWeek(weekTarget, { weekStartsOn: 1 });
        const wEnd = endOfWeek(weekTarget, { weekStartsOn: 1 });

        const weekOrders = filteredOrders.filter(order => {
          if (!order.createdAt) return false;
          const orderDate = new Date(order.createdAt);
          return isWithinInterval(orderDate, { start: wStart, end: wEnd });
        });

        let omzet = 0;
        let itemTerjual = 0;

        weekOrders.forEach(o => {
          omzet += o.total_amount || 0;
          o.items?.forEach(it => {
            itemTerjual += it.quantity || 0;
          });
        });

        result.push({
          label: `Minggu ${4 - i} (${format(wStart, 'dd/MM')})`,
          fullDate: `${format(wStart, 'dd MMM')} - ${format(wEnd, 'dd MMM yyyy')}`,
          omzet,
          transaksi: weekOrders.length,
          itemTerjual,
        });
      }
      return result;
    }

    // 6 Months
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const monthTarget = subMonths(now, i);
      const mStart = startOfMonth(monthTarget);
      const mEnd = endOfMonth(monthTarget);

      const monthOrders = filteredOrders.filter(order => {
        if (!order.createdAt) return false;
        const orderDate = new Date(order.createdAt);
        return isWithinInterval(orderDate, { start: mStart, end: mEnd });
      });

      let omzet = 0;
      let itemTerjual = 0;

      monthOrders.forEach(o => {
        omzet += o.total_amount || 0;
        o.items?.forEach(it => {
          itemTerjual += it.quantity || 0;
        });
      });

      result.push({
        label: format(monthTarget, 'MMM yyyy', { locale: idLocale }),
        fullDate: format(monthTarget, 'MMMM yyyy', { locale: idLocale }),
        omzet,
        transaksi: monthOrders.length,
        itemTerjual,
      });
    }

    return result;
  }, [filteredOrders, timeRange]);

  // Overall KPI Summary
  const kpiStats = useMemo(() => {
    let totalRevenue = 0;
    let totalItems = 0;
    let completedCount = 0;

    filteredOrders.forEach(o => {
      totalRevenue += o.total_amount || 0;
      const st = (o.status || '').toLowerCase();
      if (st.includes('selesai') || st === 'completed') completedCount++;
      o.items?.forEach(it => {
        totalItems += it.quantity || 0;
      });
    });

    const totalOrders = filteredOrders.length;
    const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const completionRate = orders.length > 0 ? Math.round((completedCount / orders.length) * 100) : 0;

    return {
      totalRevenue,
      totalOrders,
      totalItems,
      aov,
      completedCount,
      completionRate
    };
  }, [filteredOrders, orders]);

  // Top Products by Quantity
  const topProductsData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredOrders.forEach(o => {
      o.items?.forEach(it => {
        const name = it.product?.nama_barang || 'Produk Lainnya';
        map[name] = (map[name] || 0) + (it.quantity || 0);
      });
    });

    return Object.entries(map)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [filteredOrders]);

  // Status Distribution Donut Chart
  const statusDistributionData = useMemo(() => {
    let selesai = 0;
    let proses = 0;
    let dibatalkan = 0;
    let menunggu = 0;

    orders.forEach(o => {
      const st = (o.status || '').toLowerCase();
      if (st.includes('selesai') || st === 'completed') selesai++;
      else if (st.includes('batal') || st === 'cancelled') dibatalkan++;
      else if (st.includes('proses') || st.includes('siap') || st.includes('kirim')) proses++;
      else menunggu++;
    });

    return [
      { name: 'Selesai', value: selesai, color: '#0d9488' }, // teal
      { name: 'Proses / Siap', value: proses, color: '#3b82f6' }, // blue
      { name: 'Menunggu', value: menunggu, color: '#f59e0b' }, // amber
      { name: 'Dibatalkan', value: dibatalkan, color: '#ef4444' } // red
    ].filter(item => item.value > 0);
  }, [orders]);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-xl border border-slate-700/80 backdrop-blur-md text-xs min-w-[200px]">
          <p className="font-extrabold text-teal-300 border-b border-slate-800 pb-1.5 mb-2 flex items-center justify-between">
            <span>{data.fullDate || label}</span>
            <span className="text-[10px] text-slate-400 font-normal">BelanjaIn Saza Analytics</span>
          </p>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Total Omzet:</span>
              <span className="font-bold text-teal-400 text-sm">{formatRupiah(data.omzet)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Jumlah Transaksi:</span>
              <span className="font-bold text-white">{data.transaksi} Pesanan</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Item Terjual:</span>
              <span className="font-bold text-amber-300">{data.itemTerjual} Pcs</span>
            </div>
            {metricView === 'revenue' && (
              <div className="pt-2 border-t border-slate-800/80 mt-2 text-[11px] text-teal-300">
                <span>Rata-rata: {formatRupiah(data.transaksi > 0 ? Math.round(data.omzet / data.transaksi) : 0)} / pesanan</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards Header */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-xl group-hover:bg-teal-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Total Omzet Penjualan</span>
            <div className="w-8 h-8 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            {formatRupiah(kpiStats.totalRevenue)}
          </div>
          <p className="text-[11px] text-teal-600 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{kpiStats.totalOrders} Transaksi Sukses/Valid</span>
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Pesanan Masuk</span>
            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            {kpiStats.totalOrders} <span className="text-xs font-bold text-slate-400">Pesanan</span>
          </div>
          <p className="text-[11px] text-blue-600 font-semibold mt-1 flex items-center gap-1">
            <Package className="w-3.5 h-3.5" />
            <span>{kpiStats.totalItems.toLocaleString('id-ID')} Pcs Terjual</span>
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Rata-rata Transaksi (AOV)</span>
            <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            {formatRupiah(kpiStats.aov)}
          </div>
          <p className="text-[11px] text-amber-600 font-semibold mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Per Pesanan Karyawan</span>
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Tingkat Penyelesaian</span>
            <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            {kpiStats.completionRate}%
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{kpiStats.completedCount} Selesai dari {orders.length}</span>
          </p>
        </div>
      </div>

      {/* Main Trend Chart Section */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        {/* Controls Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 bg-slate-900 text-teal-400 rounded-2xl flex items-center justify-center font-bold shadow-md shadow-slate-900/10">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Grafik Tren Penjualan</h3>
              <p className="text-xs text-slate-500 font-medium">Visualisasi performa transaksi BelanjaIn Saza real-time</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Metric View Selectors */}
            <div className="bg-slate-100 p-1 rounded-xl flex space-x-1 border border-slate-200/60">
              <button
                onClick={() => setMetricView('revenue')}
                className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                  metricView === 'revenue'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Omzet (Rp)
              </button>
              <button
                onClick={() => setMetricView('orders')}
                className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                  metricView === 'orders'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Jumlah Pesanan
              </button>
            </div>

            {/* Time Range Selectors */}
            <div className="bg-slate-100 p-1 rounded-xl flex space-x-1 border border-slate-200/60">
              <button
                onClick={() => setTimeRange('7days')}
                className={`px-2.5 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                  timeRange === '7days'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                7 Hari
              </button>
              <button
                onClick={() => setTimeRange('30days')}
                className={`px-2.5 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                  timeRange === '30days'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                30 Hari
              </button>
              <button
                onClick={() => setTimeRange('4weeks')}
                className={`px-2.5 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                  timeRange === '4weeks'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                4 Minggu
              </button>
              <button
                onClick={() => setTimeRange('6months')}
                className={`px-2.5 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                  timeRange === '6months'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                6 Bulan
              </button>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs cursor-pointer"
            >
              <option value="valid">Pesanan Valid (Non-Batal)</option>
              <option value="completed">Hanya Selesai</option>
              <option value="all">Semua Status (Termasuk Batal)</option>
            </select>
          </div>
        </div>

        {/* Chart Render */}
        <div className="h-[320px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {metricView === 'revenue' ? (
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="label" 
                  tickLine={false} 
                  axisLine={{ stroke: '#cbd5e1' }}
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} 
                />
                <YAxis 
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  tickFormatter={(val) => `Rp ${(val / 1000).toLocaleString()}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="omzet" 
                  name="Omzet (Rp)" 
                  stroke="#0d9488" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  activeDot={{ r: 6, stroke: '#0d9488', strokeWidth: 2, fill: '#ffffff' }}
                />
              </AreaChart>
            ) : (
              <BarChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="label" 
                  tickLine={false} 
                  axisLine={{ stroke: '#cbd5e1' }}
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} 
                />
                <YAxis 
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="transaksi" 
                  name="Jumlah Pesanan" 
                  fill="#0284c7" 
                  radius={[8, 8, 0, 0]} 
                  barSize={28}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Secondary Insights Breakdown Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top 5 Products Bar Chart */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">5 Produk Terlaris (Top Sales)</h4>
                <p className="text-[11px] text-slate-500">Berdasarkan total kuantitas (Pcs) terjual</p>
              </div>
            </div>
          </div>

          <div className="h-[220px] w-full pt-1">
            {topProductsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProductsData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: '#334155', fontSize: 11, fontWeight: 600 }}
                    width={110}
                  />
                  <Tooltip 
                    formatter={(value: any) => [`${value} Pcs`, 'Terjual']}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="qty" fill="#f59e0b" radius={[0, 6, 6, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                <Package className="w-8 h-8 mb-2 text-slate-300" />
                <span>Belum ada data barang terjual pada periode ini</span>
              </div>
            )}
          </div>
        </div>

        {/* Order Status Donut Chart */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center font-bold">
                <PieIcon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">Distribusi Status Pesanan</h4>
                <p className="text-[11px] text-slate-500">Persentase tahapan pemrosesan transaksi</p>
              </div>
            </div>
          </div>

          <div className="h-[220px] w-full flex items-center justify-center">
            {statusDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val: any, name: any) => [`${val} Transaksi`, name]}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  />
                  <Legend 
                    layout="vertical" 
                    align="right" 
                    verticalAlign="middle" 
                    wrapperStyle={{ fontSize: '11px', fontWeight: 600 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                <ShoppingBag className="w-8 h-8 mb-2 text-slate-300" />
                <span>Belum ada status transaksi</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
