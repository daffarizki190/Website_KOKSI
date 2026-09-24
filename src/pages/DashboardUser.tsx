import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { 
  ShoppingCart, User as UserIcon, X, Plus, Minus, LogOut, ShoppingBag, Search, 
  Trash2, AlertTriangle, Edit3, Save, Check, UtensilsCrossed, HeartPulse, Home, 
  Sparkles, FolderKanban, Layers, Filter, CheckCircle2, ChevronRight, CalendarDays, Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { BelanjainLogo } from '../components/BelanjainLogo';

import { Product, CartItem } from '../types';
import { TourGuide } from '../components/TourGuide';

export const DashboardUser = () => {
  const { user, token, logout } = useAuth();
  const { toast } = useNotification();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const getCartKey = (userId?: number) => userId ? `saza_cart_items_${userId}` : 'saza_cart_items';

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const storedUser = localStorage.getItem('user');
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      const key = getCartKey(parsedUser?.id);
      const saved = localStorage.getItem(key) || localStorage.getItem('saza_cart_items');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}
    return [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({});
  const [addedProductId, setAddedProductId] = useState<number | null>(null);
  
  // Checkout Modal & Success State
  const [checkoutSuccessOrder, setCheckoutSuccessOrder] = useState<any | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isDemoModeActive, setIsDemoModeActive] = useState(false);
  const [isDemoModeLoaded, setIsDemoModeLoaded] = useState(false);

  const [isOrderingClosed, setIsOrderingClosed] = useState(() => {
    const jakartaTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' });
    const dayOfWeek = new Date(jakartaTime).getDay();
    return dayOfWeek !== 1 && dayOfWeek !== 2;
  });

  useEffect(() => {
    // Fetch global demo mode state
    fetch('/api/settings/demo-mode')
      .then(res => res.json())
      .then(data => {
        if (data.demoMode) {
          setIsOrderingClosed(false);
          setShowClosedModal(false);
          setIsDemoModeActive(true);
        }
      })
      .catch(console.error)
      .finally(() => setIsDemoModeLoaded(true));
  }, []);

  const [showClosedModal, setShowClosedModal] = useState(() => {
    if (!isOrderingClosed) return false;
    
    // Deteksi apakah user melakukan refresh (reload) halaman
    let isReload = false;
    try {
      const navEntries = performance.getEntriesByType('navigation');
      if (navEntries.length > 0 && (navEntries[0] as PerformanceNavigationTiming).type === 'reload') {
        isReload = true;
      } else if (performance.navigation && performance.navigation.type === 1) {
        isReload = true;
      }
    } catch (e) {}

    // Jika reload, paksa modal muncul dan hapus flag dismissed
    if (isReload) {
      localStorage.removeItem('saza_closed_modal_dismissed');
      return true;
    }

    return !localStorage.getItem('saza_closed_modal_dismissed');
  });

  const handleDismissClosedModal = () => {
    localStorage.setItem('saza_closed_modal_dismissed', 'true');
    setShowClosedModal(false);
  };

  // Sync cart to user-scoped localStorage whenever cart or user changes
  useEffect(() => {
    try {
      const key = getCartKey(user?.id);
      localStorage.setItem(key, JSON.stringify(cart));
      localStorage.setItem('saza_cart_items', JSON.stringify(cart));
    } catch (e) {}
  }, [cart, user?.id]);

  const fetchCart = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/cart', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          // Backend is the single source of truth for logged-in user.
          // If DB cart is empty (e.g. checked out from another device), update state and local cache immediately.
          setCart(data);
          try {
            const key = getCartKey(user?.id);
            localStorage.setItem(key, JSON.stringify(data));
            localStorage.setItem('saza_cart_items', JSON.stringify(data));
          } catch (e) {}
        }
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCart();
    }
  }, [token, user?.id]);

  // Re-sync cart on window focus or visibility change to immediately reflect checkouts from other devices
  useEffect(() => {
    const handleSync = () => {
      if (token && document.visibilityState !== 'hidden') {
        fetchCart();
      }
    };
    window.addEventListener('focus', handleSync);
    document.addEventListener('visibilitychange', handleSync);
    return () => {
      window.removeEventListener('focus', handleSync);
      document.removeEventListener('visibilitychange', handleSync);
    };
  }, [token, user?.id]);

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
  // Mode Demo button indicator removal
  // We can just rely on the backend now for the actual ordering limitation
  // Selalu izinkan pemesanan & tambah keranjang (canOrder = true)
  const canOrder = true;

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
        toast.info('Akun Anda telah berhasil dihapus.');
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
      const validProducts = Array.isArray(data) ? data.filter((p: any) => p.harga && p.harga > 0) : data;
      setProducts(validProducts);
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
    
    // Optimistic UI update: Immediately update cart state
    setCart(prev => {
      const exist = prev.find(item => item.id === product.id);
      if (exist) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + qty } : item);
      }
      return [...prev, { ...product, quantity: qty }];
    });
    setAddedProductId(product.id);
    setTimeout(() => setAddedProductId(null), 1200);
    setQuantities(prev => ({ ...prev, [product.id]: 1 }));

    try {
      await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ productId: product.id, quantity: qty })
      });
    } catch (err) {
      console.warn('Network issue saving cart to backend, kept in local state:', err);
    }
  };

  const updateCartQty = async (id: number, delta: number) => {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    const newQty = item.quantity + delta;

    // Optimistic UI update
    if (newQty <= 0) {
      setCart(prev => prev.filter(i => i.id !== id));
    } else {
      setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: newQty } : i));
    }

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
    } catch (err) {
      console.warn('Cart backend sync note:', err);
    }
  };

  const confirmCheckout = async () => {
    setIsCheckingOut(true);
    setCheckoutError(null);
    try {
      const cartSubtotal = cart.reduce((sum, item) => sum + (item.harga * item.quantity), 0);
      const handlingFee = cart.length > 0 ? 2000 : 0;
      const total_amount = cartSubtotal + handlingFee;
      const items = cart.map(item => ({ productId: item.id, quantity: item.quantity, price: item.harga }));
      
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-mode': isDemoModeActive ? 'true' : 'false',
          Authorization: `Bearer ${token || localStorage.getItem('token')}`
        },
        body: JSON.stringify({ items, total_amount })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        const newOrderId = data.orderId || (data.order && data.order.id) || (1000 + Math.floor(Math.random() * 9000));
        const createdOrderObj = data.order || {
          id: newOrderId,
          userId: user?.id,
          total_amount,
          status: 'Proses',
          keterangan: 'Pesanan telah dibuat dan sedang dalam proses',
          createdAt: new Date().toISOString(),
          items: cart.map((cItem, idx) => ({
            id: idx + 1,
            orderId: newOrderId,
            productId: cItem.id,
            quantity: cItem.quantity,
            price: cItem.harga,
            product: {
              id: cItem.id,
              nama_barang: cItem.nama_barang,
              kategori: cItem.kategori,
              harga: cItem.harga
            }
          }))
        };

        // Cache locally in localStorage so it appears in /orders instantly
        try {
          const storageKey = `saza_user_orders_${user?.id || 'guest'}`;
          const existingStored = JSON.parse(localStorage.getItem(storageKey) || '[]');
          const updatedStored = [createdOrderObj, ...existingStored.filter((o: any) => o.id !== createdOrderObj.id)];
          localStorage.setItem(storageKey, JSON.stringify(updatedStored));
        } catch (e) {
          console.warn('Failed to cache created order:', e);
        }

        fetchProducts();

        setCart([]);
        try { 
          const key = getCartKey(user?.id);
          localStorage.removeItem(key);
          localStorage.removeItem('saza_cart_items'); 
        } catch (e) {}
        setIsCartOpen(false);
        setIsCheckoutConfirmOpen(false);
        setCheckoutSuccessOrder(createdOrderObj);
      } else {
        setCheckoutError(data.error || 'Gagal memproses pesanan. Silakan coba kembali.');
      }
    } catch (err: any) {
      console.error(err);
      setCheckoutError(err.message || 'Terjadi kesalahan koneksi saat checkout.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('saza_closed_modal_dismissed');
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

  const dynamicCategories = useMemo(() => {
    const catMap = new Map<string, Set<string>>();
    products.forEach(p => {
      const k = p.kategori ? String(p.kategori).trim() : 'Lainnya';
      const sk = p.sub_kategori ? String(p.sub_kategori).trim() : '';
      if (!catMap.has(k)) {
        catMap.set(k, new Set());
      }
      if (sk) {
        catMap.get(k)!.add(sk);
      }
    });

    return Array.from(catMap.entries()).map(([name, subs]) => ({
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
      name,
      subCategories: Array.from(subs).sort()
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  // Current active subcategories based on selected main category
  const activeSubCategories = useMemo(() => {
    if (selectedCategory === 'Semua') {
      const allSubs = new Set<string>();
      dynamicCategories.forEach(cat => cat.subCategories.forEach(s => allSubs.add(s)));
      return Array.from(allSubs).sort();
    }
    const current = dynamicCategories.find(c => c.name === selectedCategory);
    return current ? current.subCategories : [];
  }, [selectedCategory, dynamicCategories]);

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

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.harga * item.quantity), 0);
  const handlingFee = cart.length > 0 ? 2000 : 0;
  const cartTotal = cartSubtotal + handlingFee;
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col w-full max-w-full overflow-x-hidden">
      <TourGuide />
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shrink-0 w-full max-w-full">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
          <div className="flex justify-between h-14 sm:h-16 items-center">
            <div className="flex items-center gap-2 sm:gap-3">
              <BelanjainLogo size="sm" showSubtitle={true} />
            </div>
            <div className="flex items-center gap-1.5 sm:gap-3">
              <button 
                onClick={() => navigate('/orders')}
                className="tour-history relative p-2 text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-100 hover:text-teal-800 rounded-xl transition-colors cursor-pointer shadow-sm"
                title="Riwayat Pesanan"
              >
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <button 
                onClick={() => setIsCartOpen(true)}
                className="tour-cart relative p-2 text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-100 hover:text-teal-800 rounded-xl transition-colors cursor-pointer shadow-sm"
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
          <div className="relative flex-1 tour-search">
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
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none no-scrollbar tour-categories">
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
            {dynamicCategories.map((cat) => {
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
                  <span>{cat.name}</span>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 tour-products">
              {filteredProducts.map(product => {
                const theme = getCategoryTheme(product.kategori);
                const currentQty = quantities[product.id] || 1;
                return (
                  <div 
                    key={product.id} 
                    className="bg-white rounded-2xl border border-slate-200/80 p-3.5 flex flex-col justify-between hover:border-teal-300 hover:shadow-md transition-all shadow-xs"
                  >
                    <div>
                      {/* Top: Category Tag */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border truncate max-w-[180px] ${theme.bg} ${theme.text} ${theme.border}`}>
                          {product.sub_kategori || product.kategori}
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
                          className={`h-8 px-3.5 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1 cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${
                            addedProductId === product.id 
                              ? 'bg-emerald-600' 
                              : 'bg-teal-600 hover:bg-teal-700 active:scale-95'
                          }`}
                        >
                          {addedProductId === product.id ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Masuk</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Tambah</span>
                            </>
                          )}
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
                <div className="flex justify-between items-center mb-2">
                  <p className="text-slate-500 text-sm">Subtotal</p>
                  <p className="font-bold text-slate-700">Rp {cartSubtotal.toLocaleString('id-ID')}</p>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-slate-500 text-sm">Biaya Penanganan</p>
                  <p className="font-bold text-slate-700">Rp {handlingFee.toLocaleString('id-ID')}</p>
                </div>
                <div className="flex justify-between items-center mb-4 border-t border-slate-200 pt-3">
                  <p className="text-slate-500 text-sm font-bold">Total Pembayaran</p>
                  <p className="text-lg font-black text-teal-800">Rp {cartTotal.toLocaleString('id-ID')}</p>
                </div>
                <button
                  onClick={() => setIsCheckoutConfirmOpen(true)}
                  disabled={cart.length === 0}
                  className="w-full py-4 bg-teal-600 text-white rounded-xl font-bold shadow-lg shadow-teal-600/20 hover:bg-teal-700 active:scale-[0.98] transition-all uppercase tracking-widest text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Checkout Sekarang
                </button>
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
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-xl hover:bg-rose-100 hover:border-rose-300 transition-colors cursor-pointer text-xs uppercase tracking-wider"
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
            {checkoutError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{checkoutError}</span>
              </div>
            )}
            <div className="pt-3 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => setIsCheckoutConfirmOpen(false)}
                disabled={isCheckingOut}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={confirmCheckout}
                disabled={isCheckingOut}
                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-sm shadow-teal-600/30 flex items-center justify-center gap-1.5"
              >
                {isCheckingOut ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <span>Ya, Lanjut</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHECKOUT SUCCESS */}
      {checkoutSuccessOrder && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-50 border-2 border-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-9 h-9 text-emerald-600" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center px-3 py-1 bg-teal-50 border border-teal-200/60 rounded-full text-xs font-black text-teal-800 tracking-wide uppercase">
                Pesanan #{checkoutSuccessOrder.id}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Pesanan Berhasil Dibuat!
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
                Pesanan Anda telah dikirim ke Pengelola BelanjaIn Saza dan siap diproses di Riwayat Pesanan.
              </p>
            </div>

            {/* Order Summary Box */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left space-y-2.5">
              {(checkoutSuccessOrder.total_amount > 2000) && (
                <div className="flex justify-between items-center text-xs text-slate-500 font-semibold mb-2">
                  <span>Biaya Penanganan</span>
                  <span className="text-sm font-bold text-slate-700">Rp 2.000</span>
                </div>
              )}
              <div className={`flex justify-between items-center text-xs text-slate-500 font-semibold ${(checkoutSuccessOrder.total_amount > 2000) ? 'border-t border-slate-200/60 pt-2' : ''}`}>
                <span>Total Pembayaran</span>
                <span className="text-sm font-black text-teal-700">
                  Rp {(checkoutSuccessOrder.total_amount || 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-500 font-semibold border-t border-slate-200/60 pt-2">
                <span>Status Pesanan</span>
                <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg font-bold text-[11px]">
                  {checkoutSuccessOrder.status || 'Proses'}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => {
                  setCheckoutSuccessOrder(null);
                  navigate('/orders');
                }}
                className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-2xl text-sm font-extrabold transition-all shadow-lg shadow-teal-600/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Lihat Riwayat Pesanan</span>
              </button>
              <button
                onClick={() => setCheckoutSuccessOrder(null)}
                className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-sm font-bold transition-all cursor-pointer"
              >
                Belanja Lagi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Ordering Closed Modal */}
      <AnimatePresence>
        {showClosedModal && isDemoModeLoaded && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={handleDismissClosedModal}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white border border-slate-200/70 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center overflow-hidden"
            >
              {/* Background Decorations */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-teal-50/50 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky-50/50 rounded-full blur-3xl -z-10 -translate-x-1/3 translate-y-1/3"></div>
              
              {/* Animated Icon Container */}
              <div className="relative mb-5 group">
                <div className="absolute inset-0 bg-slate-200 rounded-full blur-xl opacity-50"></div>
                <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-white border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 border border-slate-100/50">
                    <CalendarDays className="w-8 h-8 text-slate-700 drop-shadow-sm" />
                  </div>
                </div>
              </div>
              
              <h3 className="text-xl font-extrabold text-slate-800 mb-2.5 tracking-tight">
                Layanan Pemesanan Ditutup
              </h3>
              
              <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">
                Sistem saat ini sedang berada di luar jadwal operasional. Layanan pemesanan barang hanya tersedia pada hari <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200/80">Senin</span> dan <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200/80">Selasa</span>.
              </p>
              
              <button
                onClick={handleDismissClosedModal}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold transition-all shadow-md cursor-pointer"
              >
                Saya Mengerti
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
