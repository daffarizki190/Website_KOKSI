import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, LogOut, Upload, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Product {
  id: number;
  nama_barang: string;
  kategori: string;
  harga: number;
  stok: number;
}

export const DashboardAdmin = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState<'products' | 'users'>('products');
  const [users, setUsers] = useState<any[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    nama_barang: '',
    kategori: '',
    harga: 0,
    stok: 0
  });

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
    } else if (user) {
      fetchProducts();
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users');
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({ nama_barang: '', kategori: '', harga: 0, stok: 0 });
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      nama_barang: p.nama_barang,
      kategori: p.kategori,
      harga: p.harga,
      stok: p.stok
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah anda yakin ingin menghapus produk ini?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchProducts();
      } else {
        alert('Gagal menghapus produk');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchProducts();
      } else {
        alert('Gagal menyimpan produk');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const ab = evt.target?.result as ArrayBuffer;
        const wb = XLSX.read(ab, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const formattedProducts = data.map(item => ({
          nama_barang: item.nama_barang || item.Nama || item.Barang,
          kategori: item.kategori || item.Kategori || 'Lainnya',
          harga: parseInt(item.harga || item.Harga || 0),
          stok: parseInt(item.stok || item.Stok || 0)
        })).filter(p => p.nama_barang);

        if (formattedProducts.length === 0) {
          alert('Tidak ada data produk yang valid di Excel');
          return;
        }

        const res = await fetch('/api/products/batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ products: formattedProducts })
        });

        if (res.ok) {
          fetchProducts();
          alert('Berhasil import ' + formattedProducts.length + ' produk!');
        } else {
          alert('Gagal import produk dari Excel');
        }
      } catch (err) {
        console.error(err);
        alert('Format Excel tidak sesuai');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExportSales = async () => {
    try {
      const res = await fetch('/api/orders/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const orders = await res.json();
      
      const exportData = orders.flatMap((order: any) => 
        order.items.map((item: any) => ({
          'ID Pesanan': order.id,
          'Tanggal': new Date(order.createdAt).toLocaleDateString('id-ID'),
          'Nama Karyawan': order.user?.nama || 'Unknown',
          'PT': order.user?.pt || 'Unknown',
          'Departemen': order.user?.departemen || 'Unknown',
          'Produk': item.product?.nama_barang || 'Unknown',
          'Qty': item.quantity,
          'Harga Satuan': item.price,
          'Subtotal': item.price * item.quantity
        }))
      );

      if (exportData.length === 0) {
        alert('Belum ada data penjualan');
        return;
      }

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Penjualan");
      XLSX.writeFile(wb, "Data_Penjualan_Koperasi.xlsx");
    } catch (err) {
      console.error(err);
      alert('Gagal export data penjualan');
    }
  };

  const handleResetPassword = async (userId: number) => {
    const newPassword = prompt('Masukkan password baru:');
    if (!newPassword) return;

    try {
      const res = await fetch(`/api/users/${userId}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ password: newPassword })
      });
      if (res.ok) {
        alert('Password berhasil direset');
      } else {
        alert('Gagal reset password');
      }
    } catch (error) {
      console.error(error);
      alert('Gagal reset password');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      <header className="bg-white border-b border-slate-200 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">K</div>
              <div>
                <h1 className="text-lg font-bold leading-tight uppercase tracking-wide text-slate-900">Admin Panel Koperasi</h1>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Internal Perusahaan</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-2 text-slate-600 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium uppercase tracking-wider">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col overflow-hidden">
        
        {/* Tabs */}
        <div className="flex border-b border-slate-200 mb-6 shrink-0 gap-6">
          <button 
            onClick={() => setActiveTab('products')}
            className={`pb-3 text-sm font-bold uppercase tracking-wider transition-colors ${
              activeTab === 'products' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Kelola Produk
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`pb-3 text-sm font-bold uppercase tracking-wider transition-colors ${
              activeTab === 'users' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Daftar Pengguna
          </button>
        </div>

        {activeTab === 'products' ? (
          <>
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h2 className="text-xl font-bold text-slate-900">Data Produk</h2>
              <div className="flex items-center space-x-3">
                <input 
                  type="file" 
                  accept=".xlsx, .xls" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-full hover:bg-slate-200 transition-colors font-bold text-xs uppercase tracking-wider"
                >
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline">Import Excel</span>
                </button>
                <button
                  onClick={handleExportSales}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-full hover:bg-slate-200 transition-colors font-bold text-xs uppercase tracking-wider"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export Penjualan</span>
                </button>
                <button
                  onClick={openAddModal}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition-colors shadow-sm font-bold text-xs uppercase tracking-wider"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Tambah Produk</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 flex-1 overflow-hidden flex flex-col">
              <div className="overflow-y-auto flex-1">
                <table className="min-w-full divide-y divide-slate-100 text-left">
                  <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 z-10">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Nama Barang</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Kategori</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Harga</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Stok</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-teal-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-800">{p.nama_barang}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{p.kategori}</td>
                        <td className="px-6 py-4 text-sm font-bold text-teal-700 text-right">Rp {p.harga.toLocaleString('id-ID')}</td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-700 text-right">{p.stok}</td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center space-x-3">
                            <button onClick={() => openEditModal(p)} className="text-slate-400 hover:text-teal-600 p-2 bg-slate-50 hover:bg-teal-50 rounded-lg transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(p.id)} className="text-slate-400 hover:text-red-600 p-2 bg-slate-50 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Belum ada produk.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 flex-1 overflow-hidden flex flex-col">
            <div className="overflow-y-auto flex-1">
              <table className="min-w-full divide-y divide-slate-100 text-left">
                <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 z-10">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Nama / No HP</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Perusahaan</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Role</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800">{u.nama}</p>
                        <p className="text-xs text-slate-500">{u.no_hp}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-800">{u.pt}</p>
                        <p className="text-xs text-slate-500">{u.departemen}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                          u.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => handleResetPassword(u.id)}
                          className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors uppercase tracking-wider"
                        >
                          Reset Password
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-500">Belum ada pengguna.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modal CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900">
                {editingProduct ? 'Edit Produk' : 'Tambah Produk'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Nama Barang</label>
                <input
                  type="text"
                  required
                  value={formData.nama_barang}
                  onChange={(e) => setFormData({...formData, nama_barang: e.target.value})}
                  className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent sm:text-sm font-medium text-slate-800 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Kategori</label>
                <input
                  type="text"
                  required
                  value={formData.kategori}
                  onChange={(e) => setFormData({...formData, kategori: e.target.value})}
                  className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent sm:text-sm font-medium text-slate-800 transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Harga</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.harga}
                    onChange={(e) => setFormData({...formData, harga: parseInt(e.target.value) || 0})}
                    className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent sm:text-sm font-medium text-slate-800 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Stok</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stok}
                    onChange={(e) => setFormData({...formData, stok: parseInt(e.target.value) || 0})}
                    className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent sm:text-sm font-medium text-slate-800 transition-colors"
                  />
                </div>
              </div>
              <div className="mt-8 flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-white border border-slate-200 shadow-sm text-xs font-bold uppercase tracking-widest rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-600 shadow-sm text-xs font-bold uppercase tracking-widest rounded-xl text-white hover:bg-teal-700 transition-colors"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
