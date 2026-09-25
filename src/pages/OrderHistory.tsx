import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, Loader2, Package, Search, X, CheckCircle2, AlertTriangle, AlertCircle, ShoppingCart, ShieldCheck, Clock, ArrowRight, RefreshCw, RotateCcw, XCircle, ScanLine } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import { getDisplayOrderId } from '../utils/format';
import { useNotification } from '../contexts/NotificationContext';
import { QRCodeSVG } from 'qrcode.react';


interface OrderItem {
  id: number;
  productId: number;
  quantity: number;
  price: number;
  product: {
    id?: number;
    nama_barang: string;
    kategori?: string;
    harga?: number;
    stok?: number;
    gambar?: string;
  };
}

interface Order {
  id: number;
  total_amount: number;
  createdAt: string;
  status: string;
  keterangan?: string;
  pickupToken?: string;
  pickupTokenExpiresAt?: string;
  items: OrderItem[];
}

export default function OrderHistory() {
  const { token, user } = useAuth();
  const { toast } = useNotification();
  const storageKey = `saza_user_orders_${user?.id || 'guest'}`;

  // Initialize from localStorage so orders are immediately visible
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey) || localStorage.getItem('saza_user_orders_guest');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}
    return [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
    // Poll every 5 seconds for real-time status updates from Admin
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [token]);

  const fetchOrders = async () => {
    try {
      const authToken = token || localStorage.getItem('token');
      if (!authToken) {
        navigate('/login');
        return;
      }

      const response = await fetch('/api/orders/history', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setOrders(prev => {
            const map = new Map<number, Order>();
            // Start with local cache — it always has the freshest post-checkout orders
            prev.forEach(o => map.set(o.id, o));
            // Merge server data on top (server data may have updated status)
            data.forEach((o: Order) => {
              // Only overwrite if server has more recent/different status
              const existing = map.get(o.id);
              if (!existing || o.status !== existing.status || (o.items && o.items.length > 0)) {
                map.set(o.id, o);
              }
            });
            const merged = Array.from(map.values()).sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            // Persist the merged result back to localStorage
            try {
              localStorage.setItem(storageKey, JSON.stringify(merged));
            } catch (e) {}
            return merged;
          });
          setError(null);
        }
      }
    } catch (err: any) {
      console.warn('Kendala koneksi riwayat pesanan:', err);
      // On network error, keep showing local cache — don't reset state
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status?: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('selesai') || s === 'completed') return 'bg-teal-100 text-teal-800 border-teal-200';
    if (s.includes('siap')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (s.includes('pengajuan')) return 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold';
    if (s.includes('pengiriman') || s.includes('dikirim')) return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    if (s.includes('menyiapkan') || s.includes('dikemas')) return 'bg-amber-100 text-amber-800 border-amber-200';
    if (s.includes('batal') || s === 'cancelled') return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const getStepNumber = (status?: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('selesai') || s === 'completed') return 5;
    if (s.includes('siap')) return 4;
    if (s.includes('pengiriman') || s.includes('dikirim')) return 3;
    if (s.includes('menyiapkan') || s.includes('dikemas')) return 2;
    if (s.includes('batal') || s === 'cancelled') return -1;
    return 1; // Default: 'Proses' / 'Menunggu Konfirmasi'
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shrink-0 w-full max-w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <button 
                onClick={() => navigate('/dashboard')}
                className="mr-4 p-2.5 text-teal-700 bg-teal-50 border border-teal-100 hover:bg-teal-100 hover:text-teal-800 rounded-xl transition-colors cursor-pointer shadow-sm"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center text-white">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-lg font-bold leading-tight uppercase tracking-wide text-slate-900">Riwayat & Status Pesanan</h1>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Update Real-Time BelanjaIn Saza</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600 mb-4" />
            <p className="text-sm font-medium">Memuat riwayat pesanan...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 text-center">
            {error}
          </div>
        ) : orders.length === 0 ? (
          <div className="max-w-3xl mx-auto py-6">
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden text-center p-8 sm:p-12 relative">
              {/* Decorative Background Accents */}
              <div className="absolute -top-16 -right-16 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Icon Center Badge */}
              <div className="relative inline-flex items-center justify-center mb-6">
                <div className="w-24 h-24 bg-gradient-to-tr from-slate-900 to-slate-800 rounded-3xl shadow-xl flex items-center justify-center text-teal-400 border border-slate-700/60 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                  <ShoppingBag className="w-12 h-12" />
                </div>
                <span className="absolute -bottom-2 -right-2 w-8 h-8 bg-teal-500 rounded-xl flex items-center justify-center text-slate-900 font-bold shadow-md">
                  <Package className="w-4 h-4 text-slate-900" />
                </span>
              </div>

              {/* Title & Description */}
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                Belum Ada Pesanan Aktif
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed max-w-md mx-auto mb-8 font-medium">
                Anda belum pernah melakukan pemesanan di BelanjaIn Saza (PT. Siemens Indonesia). Semua riwayat transaksi dan status pengiriman real-time Anda akan muncul di halaman ini.
              </p>

              {/* Action Button */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="w-full sm:w-auto px-8 py-3.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-extrabold rounded-2xl transition-all shadow-lg shadow-teal-600/25 flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Mulai Belanja</span>
                  <ArrowRight className="w-4 h-4 text-teal-200" />
                </button>
                <button 
                  onClick={() => fetchOrders()}
                  className="w-full sm:w-auto px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer text-sm border border-slate-200"
                >
                  <RefreshCw className="w-4 h-4 text-slate-500" />
                  <span>Muat Ulang</span>
                </button>
              </div>

              {/* Feature Highlights Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left border-t border-slate-100 pt-8">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-700 flex items-center justify-center shrink-0 font-bold text-xs">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Lacak Real-Time</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">Pantau setiap tahapan pemrosesan dari status 'Menunggu' hingga 'Selesai'.</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-700 flex items-center justify-center shrink-0 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Pengambilan Aman</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">Tunjukkan kode identitas pesanan saat mengambil barang di Koperasi.</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-700 flex items-center justify-center shrink-0 font-bold text-xs">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Khusus Karyawan</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">Layanan terintegrasi PT. Siemens Indonesia.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const currentStep = getStepNumber(order.status);
              const isCancelled = currentStep === -1;
              const itemSum = order.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
              const handlingFee = order.total_amount > itemSum ? order.total_amount - itemSum : 0;

              return (
                <div key={order.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                  <div className="bg-slate-50 border-b border-slate-100 p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">ID Pesanan {getDisplayOrderId(order.id, order.createdAt)}</p>
                        <p className="text-xs font-semibold text-slate-900">
                          {format(new Date(order.createdAt), 'dd MMMM yyyy, HH:mm', { locale: id })}
                        </p>
                      </div>
                      <div className="hidden sm:block w-px h-8 bg-slate-200"></div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Total Belanja</p>
                        <p className="text-sm font-bold text-teal-700">Rp {order.total_amount.toLocaleString('id-ID')}</p>
                        {handlingFee > 0 && (
                          <p className="text-[10px] text-slate-500 mt-0.5">(Termasuk Penanganan Rp {handlingFee.toLocaleString('id-ID')})</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(order.status)}`}>
                        {order.status || 'Menunggu Konfirmasi'}
                      </span>
                    </div>
                  </div>

                  {/* Stage Progress Tracker Bar */}
                  <div className="p-4 sm:p-6 bg-slate-50/50 border-b border-slate-100">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Tahapan Status Pesanan</p>
                    {order.status === 'Pengajuan Pembatalan' ? (
                      <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-amber-950 text-xs font-semibold leading-relaxed space-y-1.5 shadow-xs">
                        <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm">
                          <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                          <span>Pengajuan Pembatalan Sedang Menunggu Konfirmasi Admin</span>
                        </div>
                        <p className="text-slate-800 font-medium pt-1">
                          <strong className="text-amber-900 font-bold">Alasan Pengajuan Anda:</strong> {order.keterangan ? order.keterangan.replace(/^Pengajuan Pembatalan:\s*/, '') : 'Menunggu peninjauan Admin'}
                        </p>
                        <p className="text-[11px] text-amber-800/90 font-medium italic pt-1">
                          * Pengajuan pembatalan ini sedang ditinjau dan membutuhkan konfirmasi dari Admin.
                        </p>
                      </div>
                    ) : isCancelled ? (
                      <div className="p-4 bg-red-50/90 border border-red-200 rounded-2xl text-red-900 text-xs font-semibold leading-relaxed space-y-1">
                        <div className="flex items-center gap-2 text-red-800 font-extrabold text-sm">
                          <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                          <span>Status: DIBATALKAN (NON-AKTIF)</span>
                        </div>
                        <p className="text-slate-700 font-medium pt-1">
                          <strong className="text-red-900 font-bold">Alasan Pembatalan:</strong> {order.keterangan || 'Pesanan telah dibatalkan.'}
                        </p>
                        <p className="text-[11px] text-red-600/90 font-medium italic pt-1">
                          * Pesanan ini telah dinonaktifkan dan tidak dapat diubah kembali.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-2 text-center">
                        {[
                          { step: 1, label: 'Proses' },
                          { step: 2, label: 'Menyiapkan Pesanan' },
                          { step: 3, label: 'Pengiriman' },
                          { step: 4, label: 'Siap Diambil' },
                        ].map((s) => {
                          const isActive = currentStep >= s.step;
                          const isCurrent = currentStep === s.step;
                          return (
                            <div key={s.step} className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-1 transition-colors ${
                                isCurrent ? 'bg-teal-600 text-white ring-4 ring-teal-100' :
                                isActive ? 'bg-teal-500 text-white' : 'bg-slate-200 text-slate-500'
                              }`}>
                                {s.step}
                              </div>
                              <span className={`text-[10px] font-medium leading-tight ${
                                isActive ? 'text-teal-900 font-bold' : 'text-slate-400'
                              }`}>
                                {s.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {!isCancelled && order.status !== 'Pengajuan Pembatalan' && order.keterangan && (
                      <div className="mt-4 p-3 bg-teal-50/80 border border-teal-200 rounded-xl text-teal-900 text-xs">
                        <span className="font-bold">Catatan Koperasi:</span> {order.keterangan}
                      </div>
                    )}

                    {order.status === 'Siap di ambil' && order.pickupToken && (
                      <div className="mt-6 flex flex-col items-center bg-white p-6 rounded-2xl border-2 border-dashed border-teal-200">
                        <div className="flex items-center gap-2 mb-4">
                          <ScanLine className="w-5 h-5 text-teal-600" />
                          <h5 className="font-bold text-teal-900 text-sm uppercase tracking-wide">Gunakan Barcode Ini</h5>
                        </div>
                        <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 mb-3">
                          <QRCodeSVG value={order.pickupToken} size={180} level="H" includeMargin={true} />
                        </div>
                        <p className="text-xs text-slate-500 text-center font-medium max-w-[280px]">
                          Gunakan barcode ini pada saat pengambilan. Untuk keamanan, barcode hanya bisa digunakan 1x dan memiliki batas waktu.
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Daftar Item</h4>
                    </div>

                    <div className="space-y-4">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                              <Package className="w-5 h-5 text-slate-400" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">{item.product?.nama_barang || 'Produk Dihapus'}</p>
                              <p className="text-xs text-slate-500 mt-1">
                                {item.quantity} x Rp {item.price.toLocaleString('id-ID')}
                              </p>
                            </div>
                          </div>
                          <p className="font-bold text-slate-700 text-sm">
                            Rp {(item.quantity * item.price).toLocaleString('id-ID')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>
    </div>
  );
}
