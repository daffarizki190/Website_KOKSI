import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, Loader2, Package, Search } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface OrderItem {
  id: number;
  productId: number;
  quantity: number;
  price: number;
  product: {
    nama_barang: string;
  };
}

interface Order {
  id: number;
  total_amount: number;
  createdAt: string;
  status: string;
  items: OrderItem[];
}

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('/api/orders/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Gagal mengambil riwayat pesanan');
      }

      const data = await response.json();
      setOrders(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'completed': return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex h-16 items-center">
            <button 
              onClick={() => navigate('/dashboard')}
              className="mr-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center text-white">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold leading-tight uppercase tracking-wide text-slate-900">Riwayat Pesanan</h1>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Internal Perusahaan</p>
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
          <div className="bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <Package className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Belum ada pesanan</h3>
            <p className="text-slate-500 max-w-sm mb-6">Anda belum pernah melakukan pesanan. Silakan berbelanja di halaman utama.</p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-colors shadow-lg shadow-teal-600/20 uppercase tracking-wider text-sm"
            >
              Mulai Belanja
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="bg-slate-50 border-b border-slate-100 p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Tanggal Pesanan</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {format(new Date(order.createdAt), 'dd MMMM yyyy, HH:mm', { locale: id })}
                      </p>
                    </div>
                    <div className="hidden sm:block w-px h-8 bg-slate-200"></div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Total Belanja</p>
                      <p className="text-sm font-bold text-teal-700">Rp {order.total_amount.toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(order.status)}`}>
                      {order.status || 'Selesai'}
                    </span>
                  </div>
                </div>
                
                <div className="p-4 sm:p-6">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Daftar Item</h4>
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
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
