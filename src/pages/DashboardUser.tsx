import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ShoppingCart, User as UserIcon, X, Plus, Minus, LogOut, ShoppingBag, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

interface Product {
  id: number;
  nama_barang: string;
  kategori: string;
  harga: number;
  stok: number;
}

interface CartItem extends Product {
  quantity: number;
}

export const DashboardUser = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['Semua', 'Beras', 'Minyak & Gula', 'Bumbu Dapur', 'Kebutuhan Mandi']);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({});

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setProducts(data);
      // Auto extract categories if there are new ones
      const uniqueCats = Array.from(new Set(data.map((p: Product) => p.kategori)));
      const finalCats = ['Semua', ...new Set([...categories.slice(1), ...uniqueCats])];
      setCategories(finalCats as string[]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuantityChange = (id: number, delta: number) => {
    setQuantities(prev => {
      const current = prev[id] || 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [id]: next };
    });
  };

  const addToCart = (product: Product) => {
    const qty = quantities[product.id] || 1;
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + qty } : item);
      }
      return [...prev, { ...product, quantity: qty }];
    });
    setQuantities(prev => ({ ...prev, [product.id]: 1 }));
  };

  const updateCartQty = (id: number, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQty = Math.max(0, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const handleCheckout = async () => {
    try {
      const total_amount = cart.reduce((sum, item) => sum + (item.harga * item.quantity), 0);
      const items = cart.map(item => ({ productId: item.id, quantity: item.quantity, price: item.harga }));
      
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ items, total_amount })
      });
      if (res.ok) {
        alert('Checkout berhasil!');
        setCart([]);
        setIsCartOpen(false);
      } else {
        alert('Gagal checkout');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'Semua' || p.kategori.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = p.nama_barang.toLowerCase().includes(searchQuery.toLowerCase()) || p.kategori.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const cartTotal = cart.reduce((sum, item) => sum + (item.harga * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">K</div>
              <div>
                <h1 className="text-lg font-bold leading-tight uppercase tracking-wide text-slate-900">Koperasi Sembako</h1>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Internal Perusahaan</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <button 
                onClick={() => navigate('/orders')}
                className="relative p-2 text-slate-600 hover:text-teal-600 transition-colors"
                title="Riwayat Pesanan"
              >
                <ShoppingBag className="w-6 h-6" />
              </button>
              <button 
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-slate-600 hover:text-teal-600 transition-colors"
                title="Keranjang Saya"
              >
                <ShoppingCart className="w-6 h-6" />
                {cartItemCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-teal-600 rounded-full">
                    {cartItemCount}
                  </span>
                )}
              </button>
              <button 
                onClick={() => setIsProfileOpen(true)}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-teal-100 border border-teal-200 text-teal-700 hover:bg-teal-200 transition-colors font-bold text-sm"
              >
                {user?.nama?.substring(0, 2).toUpperCase() || <UserIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col overflow-hidden">
        
        {/* Search and Categories */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4 shrink-0">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Cari produk atau kategori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm transition-colors"
            />
          </div>
          <div className="flex-1 max-w-xs">
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="block w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm font-medium text-slate-700 transition-colors appearance-none cursor-pointer"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7l3-3 3 3m0 6l-3 3-3-3" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Product List */}
        <div className="flex-1 overflow-y-auto pr-2 pb-4">
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
              Tidak ada produk di kategori ini.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredProducts.map(product => (
                <div key={product.id} className="bg-white rounded-xl border border-slate-200 p-4 flex flex-row items-center hover:border-teal-300 hover:shadow-md transition-all">
                  <div className="flex-1 pr-4">
                    <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1">{product.nama_barang}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded-md">
                        Stok: {product.stok}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-3 min-w-[120px]">
                    <p className="text-lg font-black text-teal-700">Rp {product.harga.toLocaleString('id-ID')}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200">
                        <button 
                          onClick={() => handleQuantityChange(product.id, -1)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-slate-200 text-slate-700 transition-colors rounded-l-lg"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-bold w-6 text-center text-slate-900">{quantities[product.id] || 1}</span>
                        <button 
                          onClick={() => handleQuantityChange(product.id, 1)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-slate-200 text-slate-700 transition-colors rounded-r-lg"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => addToCart(product)}
                        className="h-8 px-4 bg-teal-600 text-white text-xs font-bold rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
                      >
                        Tambah
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black z-40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-80 bg-white shadow-xl z-50 flex flex-col border-l border-slate-200"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-teal-600" />
                  Keranjang Saya
                </h2>
                <div className="flex items-center gap-3">
                  <span className="bg-teal-100 text-teal-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">{cartItemCount} Item</span>
                  <button onClick={() => setIsCartOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cart.length === 0 ? (
                  <p className="text-slate-500 text-center mt-10 text-sm">Keranjang masih kosong.</p>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-medium text-slate-800">{item.nama_barang}</p>
                        <button onClick={() => updateCartQty(item.id, -item.quantity)} className="text-slate-300 hover:text-red-500 ml-2">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-white border border-slate-200 rounded-md">
                            <button 
                              onClick={() => updateCartQty(item.id, -1)}
                              className="px-2 py-1 text-slate-600 hover:bg-slate-100 rounded-l-md transition-colors"
                            >
                              -
                            </button>
                            <span className="px-2 py-1 font-medium text-slate-800">{item.quantity}</span>
                            <button 
                              onClick={() => updateCartQty(item.id, 1)}
                              className="px-2 py-1 text-slate-600 hover:bg-slate-100 rounded-r-md transition-colors"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-slate-500">x Rp {item.harga.toLocaleString('id-ID')}</span>
                        </div>
                        <p className="font-bold text-slate-700">Rp {(item.harga * item.quantity).toLocaleString('id-ID')}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-200">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-slate-500 text-sm">Subtotal</p>
                  <p className="text-lg font-black text-teal-800">Rp {cartTotal.toLocaleString('id-ID')}</p>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={cart.length === 0}
                  className="w-full py-4 bg-teal-600 text-white rounded-xl font-bold shadow-lg shadow-teal-600/20 hover:bg-teal-700 active:scale-[0.98] transition-all uppercase tracking-widest text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Checkout Sekarang
                </button>
                <p className="text-center text-[10px] text-slate-400 mt-3">*Potong gaji otomatis periode berikutnya</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Profile Modal */}
      <AnimatePresence>
        {isProfileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProfileOpen(false)}
              className="fixed inset-0 bg-black z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 pointer-events-auto border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-slate-900">Profil Karyawan</h3>
                  <button onClick={() => setIsProfileOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {user && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 rounded-full bg-teal-100 border-2 border-teal-200 flex items-center justify-center text-teal-700 font-bold text-2xl">
                        {user.nama.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-lg">{user.nama}</p>
                        <p className="text-xs text-slate-500 uppercase tracking-wider">{user.role}</p>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 p-4 rounded-xl space-y-3 border border-slate-100">
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-medium text-slate-500 uppercase">Perusahaan</p>
                        <p className="font-bold text-slate-800 text-sm">{user.pt}</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-medium text-slate-500 uppercase">Departemen</p>
                        <p className="font-bold text-slate-800 text-sm">{user.departemen}</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-medium text-slate-500 uppercase">No. HP</p>
                        <p className="font-bold text-slate-800 text-sm">{user.no_hp}</p>
                      </div>
                    </div>
                    
                    <div className="pt-4 mt-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:text-red-600 hover:border-red-200 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="uppercase tracking-widest text-xs">Keluar Akun</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
