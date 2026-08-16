import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  ShoppingCart, User as UserIcon, X, Plus, Minus, LogOut, ShoppingBag, Search, 
  Trash2, AlertTriangle, Edit3, Save, Check, UtensilsCrossed, HeartPulse, Home, 
  Sparkles, FolderKanban, Layers, Filter, CheckCircle2, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { BelanjainLogo } from '../components/BelanjainLogo';
import { CATEGORY_STRUCTURES } from '../data/categories';
import { Product, CartItem } from '../types';

export const DashboardUser = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({});

  const fetchCart = async () => {
    try {
      const res = await fetch('/api/cart', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCart(data);
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCart();
    }
  }, [token]);

  // Edit Profile State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editNama, setEditNama] = useState('');
  const [editPt, setEditPt] = useState('');
  const [editDepartemen, setEditDepartemen] = useState('');
  const [editNoHp, setEditNoHp] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleOpenEditProfile = () => {
    if (user) {
      setEditNama(user.nama || '');
      setEditPt(user.pt || 'PT. Siemens Indonesia');
      setEditDepartemen(user.departemen || '');
      setEditNoHp(user.no_hp || '');
      setEditPassword('');
      setEditError('');
      setEditSuccess('');
      setIsProfileOpen(false);
      setIsEditProfileOpen(true);
    }
  };

  const handleSaveProfile = async () => {
    if (!editNama.trim() || !editPt.trim() || !editDepartemen.trim() || !editNoHp.trim()) {
      setEditError('Semua kolom profil wajib diisi!');
      return;
    }

    setIsSavingProfile(true);
    setEditError('');
    setEditSuccess('');

    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          nama: editNama.trim(),
          pt: editPt.trim(),
          departemen: editDepartemen.trim(),
          no_hp: editNoHp.trim(),
          newPassword: editPassword.trim() || undefined
        })
      });

      const data = await res.json();
      if (res.ok) {
        setEditSuccess('Profil berhasil diperbarui!');
        // Update user in localStorage and state
        const updatedUserObj = { ...user, ...data.user };
        localStorage.setItem('user', JSON.stringify(updatedUserObj));
        setTimeout(() => {
          setIsEditProfileOpen(false);
          window.location.reload();
        }, 800);
      } else {
        setEditError(data.error || 'Gagal memperbarui profil');
      }
    } catch (err: any) {
      setEditError(err.message || 'Koneksi gagal saat memperbarui profil');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Delete Account State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteReasonInput, setDeleteReasonInput] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState('');
  
  // Checkout & Ordering State
  const [isCheckoutConfirmOpen, setIsCheckoutConfirmOpen] = useState(false);
  const dayOfWeek = new Date().getDay();
  // 1 = Monday, 2 = Tuesday
  const isOrderingTime = dayOfWeek === 1 || dayOfWeek === 2;
  const isDemoOrderingEnabled = localStorage.getItem('demo_ordering_enabled') === 'true';
  const canOrder = isOrderingTime || isDemoOrderingEnabled;

  const handleConfirmDeleteAccount = async () => {
    if (!user) return;
    if (!deleteReasonInput.trim() || deleteReasonInput.trim().length < 3) {
      setDeleteAccountError('Alasan penghapusan akun wajib diisi (minimal 3 karakter)!');
      return;
    }

    setIsDeletingAccount(true);
    setDeleteAccountError('');

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: deleteReasonInput.trim() })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        alert('Akun Anda telah berhasil dihapus.');
        logout();
        navigate('/login');
      } else {
        setDeleteAccountError(data.error || 'Gagal menghapus akun.');
      }
    } catch (err) {
      setDeleteAccountError('Terjadi kesalahan koneksi server.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    
    // Check if user clicked 'Pesan Lagi' from Order History
    const savedReorder = localStorage.getItem('saza_cart_reorder');
    if (savedReorder) {
      try {
        const reorderItems = JSON.parse(savedReorder);
        if (Array.isArray(reorderItems) && reorderItems.length > 0) {
          setCart(reorderItems);
          setIsCartOpen(true);
        }
      } catch (e) {
        console.error('Failed to parse reorder items:', e);
      }
      localStorage.removeItem('saza_cart_reorder');
    }
  }, []);

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

  const handleQuantityChange = (id: number, delta: number) => {
    setQuantities(prev => {
      const current = prev[id] || 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [id]: next };
    });
  };

  const addToCart = async (product: Product) => {
    const qty = quantities[product.id] || 1;
    try {
      await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ productId: product.id, quantity: qty })
      });
      fetchCart();
      setQuantities(prev => ({ ...prev, [product.id]: 1 }));
    } catch (err) {
      console.error(err);
    }
  };

  const updateCartQty = async (id: number, delta: number) => {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    const newQty = item.quantity + delta;

    try {
      if (newQty <= 0) {
        await fetch(`/api/cart/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await fetch(`/api/cart/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ quantity: newQty })
        });
      }
      fetchCart();
    } catch (err) {
      console.error(err);
    }
  };

  const confirmCheckout = async () => {
    setIsCheckoutConfirmOpen(false);
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
        alert('Checkout berhasil! Pesanan Anda telah dikirim ke Admin BelanjaIn Saza.');
        setCart([]);
        setIsCartOpen(false);
        navigate('/orders');
      } else {
        const data = await res.json().catch(() => ({}));
        alert(`Gagal checkout: ${data.error || 'Terjadi kesalahan'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan koneksi saat checkout.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const pKategori = (p?.kategori || '').toLowerCase();
      const pSubKategori = (p?.sub_kategori || '').toLowerCase();
      const pNama = (p?.nama_barang || '').toLowerCase();
      const selCat = (selectedCategory || 'Semua').toLowerCase();
      const selSub = (selectedSubCategory || 'Semua').toLowerCase();
      const search = (searchQuery || '').toLowerCase().trim();

      const matchesCategory = selectedCategory === 'Semua' || pKategori === selCat;
      const matchesSubCategory = selectedSubCategory === 'Semua' || pSubKategori === selSub;
      const matchesSearch = !search || pNama.includes(search) || pKategori.includes(search) || pSubKategori.includes(search);

      return matchesCategory && matchesSubCategory && matchesSearch;
    });
  }, [products, selectedCategory, selectedSubCategory, searchQuery]);

  // Current active subcategories based on selected main category
  const activeSubCategories = useMemo(() => {
    if (selectedCategory === 'Semua') {
      const allSubs = new Set<string>();
      CATEGORY_STRUCTURES.forEach(cat => cat.subCategories.forEach(s => allSubs.add(s)));
      return Array.from(allSubs);
    }
    const current = CATEGORY_STRUCTURES.find(c => c.name === selectedCategory);
    return current ? current.subCategories : [];
  }, [selectedCategory]);

  const handleCategorySelect = (catName: string) => {
    setSelectedCategory(catName);
    setSelectedSubCategory('Semua');
  };

  const renderCategoryIcon = (id: string) => {
    switch (id) {
      case 'fnb':
        return <UtensilsCrossed className="w-3.5 h-3.5" />;
      case 'personal_care':
        return <HeartPulse className="w-3.5 h-3.5" />;
      case 'household':
        return <Home className="w-3.5 h-3.5" />;
      case 'impulse_items':
        return <Sparkles className="w-3.5 h-3.5" />;
      case 'non_food':
        return <FolderKanban className="w-3.5 h-3.5" />;
      default:
        return <Layers className="w-3.5 h-3.5" />;
    }
  };

  const getCategoryTheme = (categoryName?: string) => {
    switch (categoryName) {
      case 'Makanan & Minuman Siap Saji (F&B)':
        return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
      case 'Perawatan Diri & Kesehatan (Personal Care)':
        return { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' };
      case 'Kebutuhan Rumah Tangga (Household)':
        return { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' };
      case 'Rokok & Produk Kasir (Impulse Items)':
        return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
      case 'Non-Food & Perlengkapan Umum':
        return { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' };
      default:
        return { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' };
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.harga * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shrink-0">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
          <div className="flex justify-between h-14 sm:h-16 items-center">
            <div className="flex items-center gap-2 sm:gap-3">
              <BelanjainLogo size="sm" showSubtitle={true} />
            </div>
            <div className="flex items-center gap-1.5 sm:gap-3">
              <button 
                onClick={() => navigate('/orders')}
                className="relative p-2 text-slate-600 hover:text-teal-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title="Riwayat Pesanan"
              >
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <button 
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-slate-600 hover:text-teal-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title="Keranjang Saya"
              >
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
                {cartItemCount > 0 && (
                  <span className="absolute top-1 right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-extrabold text-white bg-teal-600 rounded-full shadow-xs">
                    {cartItemCount}
                  </span>
                )}
              </button>
              <button 
                onClick={() => setIsProfileOpen(true)}
                className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-teal-100 border border-teal-200 text-teal-700 hover:bg-teal-200 transition-colors font-bold text-xs cursor-pointer ml-1"
                title="Profil Karyawan"
              >
                {user?.nama?.substring(0, 2).toUpperCase() || <UserIcon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-5 w-full flex-1 flex flex-col overflow-hidden">
        
        {/* Search Bar */}
        <div className="flex items-center gap-2 mb-3 shrink-0">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Cari sembako, minuman, sabun..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200/90 rounded-2xl leading-5 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-xs sm:text-sm font-medium transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Main Category Tabs */}
        <div className="mb-2.5 shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
            <button
              onClick={() => handleCategorySelect('Semua')}
              className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer shadow-xs ${
                selectedCategory === 'Semua'
                  ? 'bg-teal-600 text-white shadow-teal-600/20 ring-2 ring-teal-600/20'
                  : 'bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Semua</span>
            </button>
            {CATEGORY_STRUCTURES.map((cat) => {
              const isSelected = selectedCategory === cat.name;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.name)}
                  className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer shadow-xs ${
                    isSelected
                      ? 'bg-teal-600 text-white shadow-teal-600/20 ring-2 ring-teal-600/20'
                      : 'bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50'
                  }`}
                >
                  {renderCategoryIcon(cat.id)}
                  <span>{cat.shortName}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sub-Category Filter Chips */}
        <div className="mb-3 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
            <button
              onClick={() => setSelectedSubCategory('Semua')}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedSubCategory === 'Semua'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-200/70 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Semua ({filteredProducts.length})
            </button>
            {activeSubCategories.map((sub) => {
              const isSubSelected = selectedSubCategory === sub;
              const subCount = products.filter(p => {
                const matchCat = selectedCategory === 'Semua' || p.kategori === selectedCategory;
                return matchCat && p.sub_kategori === sub;
              }).length;

              return (
                <button
                  key={sub}
                  onClick={() => setSelectedSubCategory(sub)}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    isSubSelected
                      ? 'bg-slate-900 text-white font-bold shadow-xs'
                      : 'bg-slate-200/70 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{sub}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSubSelected ? 'bg-slate-800 text-slate-200' : 'bg-white/80 text-slate-600'}`}>
                    {subCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Ordering Alert */}
        {!canOrder && (
          <div className="bg-amber-50 border border-amber-200/80 p-3 mb-3 rounded-2xl flex items-center gap-2.5 shrink-0">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <div className="text-xs text-amber-900 leading-snug">
              <span className="font-bold">Waktu Pemesanan Ditutup:</span> Pesanan dibuka <strong>Senin s/d Selasa</strong> (00.00-23.59). Katalog tetap dapat dilihat.
            </div>
          </div>
        )}

        {/* Product List */}
        <div className={`flex-1 overflow-y-auto pr-0.5 pb-20 sm:pb-6 transition-all duration-300 ${!canOrder ? 'opacity-70' : ''}`}>
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-10 text-center text-slate-500 flex flex-col items-center justify-center my-4 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <Layers className="w-6 h-6" />
              </div>
              <p className="font-bold text-slate-800 text-sm">Tidak ada produk ditemukan</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Coba gunakan kata kunci lain atau pilih kategori yang berbeda.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
              {filteredProducts.map(product => {
                const theme = getCategoryTheme(product.kategori);
                const currentQty = quantities[product.id] || 1;
                return (
                  <div 
                    key={product.id} 
                    className="bg-white rounded-2xl border border-slate-200/80 p-3.5 flex flex-col justify-between hover:border-teal-300 hover:shadow-md transition-all shadow-xs"
                  >
                    <div>
                      {/* Top: Category Tag & Stock Status */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border truncate max-w-[180px] ${theme.bg} ${theme.text} ${theme.border}`}>
                          {product.sub_kategori || product.kategori}
                        </span>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          product.stok < 10 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          Stok: {product.stok}
                        </span>
                      </div>

                      {/* Middle: Product Name */}
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-2 mb-3">
                        {product.nama_barang}
                      </h3>
                    </div>

                    {/* Bottom: Price & Stepper + Action */}
                    <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-100 mt-auto">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Harga</span>
                        <p className="text-base sm:text-lg font-black text-teal-700 leading-tight">
                          Rp {product.harga.toLocaleString('id-ID')}
                        </p>
                      </div>

                      {/* Stepper & Tambah Button */}
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center bg-slate-100 rounded-xl border border-slate-200/80 p-0.5">
                          <button 
                            onClick={() => handleQuantityChange(product.id, -1)}
                            className="w-7 h-7 flex items-center justify-center hover:bg-white text-slate-700 transition-colors rounded-lg cursor-pointer"
                            title="Kurangi"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold w-6 text-center text-slate-900">
                            {currentQty}
                          </span>
                          <button 
                            onClick={() => handleQuantityChange(product.id, 1)}
                            className="w-7 h-7 flex items-center justify-center hover:bg-white text-slate-700 transition-colors rounded-lg cursor-pointer"
                            title="Tambah"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        
                        <button
                          onClick={() => addToCart(product)}
                          disabled={!canOrder}
                          className="h-8 px-3.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1 cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Beli</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Floating Bottom Cart Bar for Mobile */}
      {cart.length > 0 && (
        <div className="sm:hidden fixed bottom-3 left-3 right-3 z-30">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onClick={() => setIsCartOpen(true)}
            className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-xl flex items-center justify-between cursor-pointer border border-slate-800"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                <ShoppingCart className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200">{cartItemCount} Barang Dipilih</p>
                <p className="text-sm font-black text-teal-400">Rp {cartTotal.toLocaleString('id-ID')}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold bg-teal-600 hover:bg-teal-500 px-3.5 py-2 rounded-xl transition-colors shadow-xs">
              <span>Keranjang</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </motion.div>
        </div>
      )}

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
                  onClick={() => setIsCheckoutConfirmOpen(true)}
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

                    {(user.role === 'it' || user.role === 'admin') && (
                      <button
                        onClick={() => { setIsProfileOpen(false); navigate('/it-dashboard'); }}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-900 text-teal-400 font-bold rounded-xl hover:bg-slate-800 transition-colors cursor-pointer text-xs uppercase tracking-wider"
                      >
                        <span>Portal Pemantauan IT</span>
                      </button>
                    )}
                    
                    <div className="pt-3 mt-2 space-y-2">
                      <button
                        onClick={handleOpenEditProfile}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-colors cursor-pointer text-xs uppercase tracking-wider shadow-sm shadow-teal-600/20"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Edit Profil</span>
                      </button>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-xs uppercase tracking-wider"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Keluar Akun</span>
                      </button>

                      {(user.role === 'admin' || user.role === 'it') && (
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            setIsDeleteModalOpen(true);
                          }}
                          className="w-full flex items-center justify-center space-x-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl transition-colors cursor-pointer text-[11px] uppercase tracking-wider"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-600" />
                          <span>Hapus Akun Saya</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MODAL HAPUS AKUN SAYA */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-100 text-red-600 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Konfirmasi Hapus Akun</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Tindakan ini tidak dapat dibatalkan</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteReasonInput('');
                  setDeleteAccountError('');
                }}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin menghapus akun Anda (<strong className="text-slate-800">{user?.nama}</strong>) dari BelanjaIn Saza (PT. Siemens Indonesia)? Mohon berikan **alasan penghapusan akun**:
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alasan Penghapusan Akun <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={deleteReasonInput}
                  onChange={(e) => {
                    setDeleteReasonInput(e.target.value);
                    if (deleteAccountError) setDeleteAccountError('');
                  }}
                  rows={3}
                  placeholder="Contoh: Resign / Keluar dari perusahaan Siemens, Duplikasi akun, atau Alasan Pribadi..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white resize-none"
                />
              </div>

              {deleteAccountError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-1.5">
                  <X className="w-4 h-4 shrink-0" />
                  <span>{deleteAccountError}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteReasonInput('');
                  setDeleteAccountError('');
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDeleteAccount}
                disabled={isDeletingAccount || !deleteReasonInput.trim()}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-sm shadow-red-600/30 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeletingAccount ? 'Proses Hapus...' : 'Ya, Hapus Akun'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT PROFIL */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center font-bold">
                  <Edit3 className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Edit Profil Saya</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Perbarui informasi data akun BelanjaIn Saza Anda</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditProfileOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editNama}
                  onChange={(e) => setEditNama(e.target.value)}
                  placeholder="Masukkan Nama Lengkap"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Perusahaan <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editPt}
                    onChange={(e) => setEditPt(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white cursor-pointer"
                  >
                    <option value="PT. Siemens Indonesia">PT. Siemens Indonesia</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Departemen <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editDepartemen}
                    onChange={(e) => setEditDepartemen(e.target.value)}
                    placeholder="Contoh: IT, HR, Finance..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  No. HP (WhatsApp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editNoHp}
                  onChange={(e) => setEditNoHp(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Password Baru <span className="text-slate-400 font-normal">(Kosongkan jika tidak diubah)</span>
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
              </div>

              {editError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-1.5">
                  <X className="w-4 h-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              {editSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{editSuccess}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => setIsEditProfileOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-sm shadow-teal-600/30 flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingProfile ? 'Menyimpan...' : 'Simpan Profil'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* MODAL KONFIRMASI CHECKOUT */}
      {isCheckoutConfirmOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center font-bold shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Konfirmasi Pemesanan</h3>
                <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
                  Apakah Anda yakin ingin melanjutkan pesanan ini? 
                  <span className="block mt-1 font-bold text-red-600">Pesanan yang sudah dilanjutkan tidak dapat dibatalkan.</span>
                </p>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => setIsCheckoutConfirmOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={confirmCheckout}
                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-sm shadow-teal-600/30 flex items-center justify-center gap-1.5"
              >
                <span>Ya, Lanjut</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
