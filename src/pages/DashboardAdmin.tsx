import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Edit2, Trash2, LogOut, Upload, Download, FileText,
  ShoppingBag, RefreshCw, CheckCircle, Clock, Package,
  Phone, MessageSquare, Search, Filter, AlertCircle, AlertTriangle, Check, X,
  QrCode, ScanLine, Camera, CameraOff, Inbox, FilterX, PackageSearch,
  Calendar, FileSpreadsheet, Building2, Key, Lock, Eye, EyeOff, Server,
  User as UserIcon, Edit3, Save, TrendingUp, BarChart2, Bell, Printer
} from 'lucide-react';
import XLSX from 'xlsx-js-style';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { SalesTrendChart } from '../components/SalesTrendChart';
import { CATEGORY_STRUCTURES } from '../data/categories';
import { smartCategorize } from '../data/smartCategorizer';

interface Product {
  id: number;
  nama_barang: string;
  kategori: string;
  sub_kategori?: string | null;
  harga: number;
  stok: number;
}

interface ImportResultItem {
  nama_barang: string;
  kategori?: string;
  sub_kategori?: string | null;
  harga?: number;
  stok?: number;
  alasan?: string; // only for rejected
}

interface ImportResult {
  inserted: ImportResultItem[];
  updated: ImportResultItem[];
  rejected: ImportResultItem[];
  insertedCount: number;
  updatedCount: number;
  rejectedCount: number;
}

interface OrderItem {
  id: number;
  productId: number;
  quantity: number;
  price: number;
  product?: {
    nama_barang: string;
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

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const DashboardAdmin = () => {
  const { user, token, logout } = useAuth();
  const { toast, confirm: confirmModal } = useNotification();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'orders' | 'analytics' | 'products' | 'users'>('orders');

  // Users state
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [ptFilter, setPtFilter] = useState('Semua');

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('Semua');
  const [orderPtFilter, setOrderPtFilter] = useState('Semua');
  const [orderDateFilter, setOrderDateFilter] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const [printingOrderId, setPrintingOrderId] = useState<number | null>(null);

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
      name,
      subCategories: Array.from(subs).sort()
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  useEffect(() => {
    if (printingOrderId !== null) {
      const timer = setTimeout(() => {
        window.print();
        setPrintingOrderId(null);
      }, 500); // Give React enough time to mount the DOM and CSS
      return () => clearTimeout(timer);
    }
  }, [printingOrderId]);

  const handlePrintReceipt = (orderId: number) => {
    setPrintingOrderId(orderId);
  };

  // Order status modal state
  const [selectedOrderForStatus, setSelectedOrderForStatus] = useState<Order | null>(null);
  const [newStatusValue, setNewStatusValue] = useState('');
  const [newKeteranganValue, setNewKeteranganValue] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);


  // Monthly Export Excel Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Import Result Notification Modal
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importResultTab, setImportResultTab] = useState<'inserted' | 'updated' | 'rejected'>('inserted');

  // Category Cleanup State
  const [isCleaningUpCategories, setIsCleaningUpCategories] = useState(false);
  const [cleanupProgress, setCleanupProgress] = useState<{ current: number, total: number }>({ current: 0, total: 0 });
  const [cleanupMessage, setCleanupMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

  const [exportMonth, setExportMonth] = useState<number>(new Date().getMonth() + 1);
  const [exportYear, setExportYear] = useState<number>(new Date().getFullYear());
  const [exportRabu, setExportRabu] = useState<string>('Semua');
  const [exportPtFilter, setExportPtFilter] = useState<string>('Semua');
  const [exportStatusFilter, setExportStatusFilter] = useState<string>('Semua');

  // Helper functions for Wednesday export
  const getWednesdaysInMonth = (month: number, year: number) => {
    if (month === 0 || year === 0) return [];
    const wednesdays = [];
    const d = new Date(year, month - 1, 1);
    while (d.getDay() !== 3) {
      d.setDate(d.getDate() + 1);
    }
    while (d.getMonth() === month - 1) {
      wednesdays.push(new Date(d));
      d.setDate(d.getDate() + 7);
    }
    return wednesdays;
  };

  const isDateInWednesdayPeriod = (orderDate: Date, wednesdayDateStr: string) => {
    if (wednesdayDateStr === 'Semua') return true;
    const wedDate = new Date(wednesdayDateStr);

    // End date is Tuesday 23:59:59 before this Wednesday
    const endDate = new Date(wedDate);
    endDate.setDate(endDate.getDate() - 1);
    endDate.setHours(23, 59, 59, 999);

    // Start date is Previous Wednesday 00:00:00
    const startDate = new Date(wedDate);
    startDate.setDate(startDate.getDate() - 7);
    startDate.setHours(0, 0, 0, 0);

    return orderDate >= startDate && orderDate <= endDate;
  };

  // Reset Password Modal State
  const [resetPasswordUser, setResetPasswordUser] = useState<{ id: number, nama: string, no_hp: string } | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetPasswordError, setResetPasswordError] = useState('');

  // Delete User Modal State
  const [deleteTargetUser, setDeleteTargetUser] = useState<{ id: number, nama: string, pt: string, no_hp: string } | null>(null);
  const [deleteReasonInput, setDeleteReasonInput] = useState('');
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [deleteUserError, setDeleteUserError] = useState('');

  // Edit User Profile Modal State
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editUserNama, setEditUserNama] = useState('');
  const [editUserPt, setEditUserPt] = useState('PT. Siemens Indonesia');
  const [editUserDepartemen, setEditUserDepartemen] = useState('');
  const [editUserNoHp, setEditUserNoHp] = useState('');
  const [editUserRole, setEditUserRole] = useState('user');
  const [editUserPassword, setEditUserPassword] = useState('');
  const [editUserError, setEditUserError] = useState('');
  const [editUserSuccess, setEditUserSuccess] = useState('');
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [updatingRoleId, setUpdatingRoleId] = useState<number | null>(null);

  // Cancellation Action Modal State
  const [cancellationConfirmModal, setCancellationConfirmModal] = useState<{
    orderId: number;
    type: 'approve' | 'reject';
    orderNumber: number;
  } | null>(null);
  const [cancellationNoteInput, setCancellationNoteInput] = useState('');
  const [isProcessingCancellation, setIsProcessingCancellation] = useState(false);
  const [cancellationActionError, setCancellationActionError] = useState('');
  const [cancellationActionSuccess, setCancellationActionSuccess] = useState('');

  // Delete Product Confirmation Modal State
  const [deleteProductConfirmModal, setDeleteProductConfirmModal] = useState<{ id: number; nama: string } | null>(null);

  // Admin Profile Edit State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editNama, setEditNama] = useState('');
  const [editPt, setEditPt] = useState('');
  const [editDepartemen, setEditDepartemen] = useState('');
  const [editNoHp, setEditNoHp] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Demo Ordering Toggle (Global)
  const [isDemoOrderingEnabled, setIsDemoOrderingEnabled] = useState(false);

  useEffect(() => {
    fetch('/api/settings/demo-mode')
      .then(res => res.json())
      .then(data => setIsDemoOrderingEnabled(data.demoMode))
      .catch(console.error);
  }, []);

  const toggleDemoOrdering = async () => {
    const newVal = !isDemoOrderingEnabled;
    setIsDemoOrderingEnabled(newVal);
    // Also save locally for fallback
    localStorage.setItem('demo_ordering_enabled', newVal.toString());

    try {
      const token = localStorage.getItem('token');
      await fetch('/api/settings/demo-mode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ demoMode: newVal })
      });
    } catch (err) {
      console.error('Gagal update demo mode ke server', err);
    }
  };

  const handleOpenProfileModal = () => {
    if (user) {
      setEditNama(user.nama || '');
      setEditPt(user.pt || 'PT. Siemens Indonesia');
      setEditDepartemen(user.departemen || '');
      setEditNoHp(user.no_hp || '');
      setEditPassword('');
      setEditError('');
      setEditSuccess('');
      setIsProfileModalOpen(true);
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
        const updatedUserObj = { ...user, ...data.user };
        localStorage.setItem('user', JSON.stringify(updatedUserObj));
        setTimeout(() => {
          setIsProfileModalOpen(false);
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

  // Product Form state
  const [formData, setFormData] = useState({
    nama_barang: '',
    kategori: dynamicCategories[0]?.name || 'Umum',
    sub_kategori: dynamicCategories[0]?.subCategories[0] || '',
    harga: 0,
    stok: 0
  });

  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('Semua');
  const [productSubCategoryFilter, setProductSubCategoryFilter] = useState('Semua');

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
    } else if (user) {
      fetchProducts();
      fetchUsers();
      fetchOrders();

      // Real-time polling every 4 seconds for new incoming orders
      const interval = setInterval(() => {
        fetchOrders(true);
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      const authToken = token || localStorage.getItem('token');
      if (!authToken) return;
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch users');
    }
  };

  const fetchProducts = async () => {
    try {
      const authToken = token || localStorage.getItem('token');
      const res = await fetch('/api/products', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCleanupCategories = async () => {
    setIsCleaningUpCategories(true);
    setCleanupMessage(null);
    setCleanupProgress({ current: 0, total: 0 });

    try {
      const authToken = token || localStorage.getItem('token');

      // Fetch latest products first to ensure we are working with fresh data
      const resData = await fetch('/api/products', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const freshProducts = await resData.json();

      if (!Array.isArray(freshProducts) || freshProducts.length === 0) {
        setIsCleaningUpCategories(false);
        return;
      }

      const productsToUpdate = [];

      for (const p of freshProducts) {
        const smartRes = smartCategorize(p.nama_barang);
        if (p.kategori !== smartRes.kategori || p.sub_kategori !== smartRes.sub_kategori) {
          productsToUpdate.push({
            id: p.id,
            kategori: smartRes.kategori,
            sub_kategori: smartRes.sub_kategori
          });
        }
      }

      if (productsToUpdate.length === 0) {
        setCleanupMessage({ type: 'info', text: 'Semua kategori produk sudah rapi. Tidak ada yang perlu diupdate.' });
        setIsCleaningUpCategories(false);
        return;
      }

      setCleanupProgress({ current: 0, total: productsToUpdate.length });

      const chunkSize = 50;
      let updatedSoFar = 0;

      for (let i = 0; i < productsToUpdate.length; i += chunkSize) {
        const chunk = productsToUpdate.slice(i, i + chunkSize);

        const res = await fetch('/api/products/batch-update', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`
          },
          body: JSON.stringify({ products: chunk })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Gagal update batch pada item ke-${i}`);
        }

        updatedSoFar += chunk.length;
        setCleanupProgress({ current: updatedSoFar, total: productsToUpdate.length });
      }

      setCleanupMessage({ type: 'success', text: `Berhasil merapikan kategori untuk ${productsToUpdate.length} produk!` });
      await fetchProducts();
    } catch (err: any) {
      console.error('Error cleaning up categories:', err);
      setCleanupMessage({ type: 'error', text: err.message || 'Terjadi kesalahan saat merapikan kategori.' });
    } finally {
      setIsCleaningUpCategories(false);
    }
  };

  const fetchOrders = async (isBackground = false) => {
    if (!isBackground) setOrdersLoading(true);
    try {
      const authToken = token || localStorage.getItem('token');
      if (!authToken) return;
      const res = await fetch('/api/orders/all', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setOrders(data);
          setLastUpdated(new Date());
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error('[Admin] Gagal fetch pesanan:', res.status, errData.error);
        if (!isBackground) {
          console.warn('Server gagal mengembalikan data pesanan. Coba refresh halaman.');
        }
      }
    } catch (err) {
      if (!isBackground) {
        console.warn('Kendala koneksi mengambil data pesanan:', err);
      }
    } finally {
      if (!isBackground) setOrdersLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, status: string, keterangan?: string) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status, keterangan })
      });

      if (res.ok) {
        fetchOrders(true);
        setSelectedOrderForStatus(null);
        toast.success(`Status pesanan #${orderId} berhasil diubah ke "${status}"!`);
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(`Gagal memperbarui status: ${data.error || 'Terjadi kesalahan'}`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan jaringan saat update status pesanan.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleApproveCancellation = async (orderId: number, note?: string) => {
    setIsProcessingCancellation(true);
    setCancellationActionError('');
    setCancellationActionSuccess('');

    try {
      const authToken = token || localStorage.getItem('token');
      const res = await fetch(`/api/orders/${orderId}/approve-cancellation`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ catatan: note || 'Pembatalan Disetujui Admin.' })
      });
      const data = await res.json();
      if (res.ok) {
        setCancellationActionSuccess('Pengajuan pembatalan DISETUJUI! Pesanan telah resmi Dibatalkan.');
        fetchOrders(true);
        setTimeout(() => {
          setCancellationConfirmModal(null);
          setCancellationActionSuccess('');
        }, 1000);
      } else {
        setCancellationActionError(data.error || 'Gagal menyetujui pembatalan.');
      }
    } catch (err: any) {
      setCancellationActionError('Terjadi kesalahan koneksi.');
    } finally {
      setIsProcessingCancellation(false);
    }
  };

  const handleRejectCancellation = async (orderId: number, reason?: string) => {
    const finalReason = reason && reason.trim() ? reason.trim() : 'Pesanan sedang diproses dan tidak dapat dibatalkan.';
    setIsProcessingCancellation(true);
    setCancellationActionError('');
    setCancellationActionSuccess('');

    try {
      const authToken = token || localStorage.getItem('token');
      const res = await fetch(`/api/orders/${orderId}/reject-cancellation`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ alasanPenolakan: finalReason })
      });
      const data = await res.json();
      if (res.ok) {
        setCancellationActionSuccess('Pengajuan pembatalan DITOLAK! Pesanan dikembalikan ke status "Proses".');
        fetchOrders(true);
        setTimeout(() => {
          setCancellationConfirmModal(null);
          setCancellationActionSuccess('');
        }, 1000);
      } else {
        setCancellationActionError(data.error || 'Gagal menolak pembatalan.');
      }
    } catch (err: any) {
      setCancellationActionError('Terjadi kesalahan koneksi.');
    } finally {
      setIsProcessingCancellation(false);
    }
  };

  const handleDeleteProductConfirmed = async () => {
    if (!deleteProductConfirmModal) return;
    const targetId = deleteProductConfirmModal.id;
    try {
      const authToken = token || localStorage.getItem('token');
      const res = await fetch(`/api/products/${targetId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json'
        }
      });
      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== targetId));
        setDeleteProductConfirmModal(null);
        fetchProducts();
        toast.success('Produk berhasil dihapus!');
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Gagal menghapus produk');
      }
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan koneksi server');
    }
  };

  // State & Handlers: Hapus Transaksi Sesuai Filter & Single
  const [isDeletingFilteredOrders, setIsDeletingFilteredOrders] = useState(false);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchStatus = orderStatusFilter === 'Semua' || (order.status || 'Menunggu Konfirmasi').toLowerCase() === orderStatusFilter.toLowerCase();
      const matchPt = orderPtFilter === 'Semua' || (order.user?.pt || '').toLowerCase() === orderPtFilter.toLowerCase();
      const matchDate = !orderDateFilter || (() => {
        try {
          return format(new Date(order.createdAt), 'yyyy-MM-dd') === orderDateFilter;
        } catch (e) {
          return true;
        }
      })();
      const query = orderSearch.toLowerCase().trim();
      const matchQuery = !query ||
        order.id.toString().includes(query) ||
        (order.user?.nama || '').toLowerCase().includes(query) ||
        (order.user?.no_hp || '').toLowerCase().includes(query) ||
        (order.user?.departemen || '').toLowerCase().includes(query) ||
        order.items.some(it => (it.product?.nama_barang || '').toLowerCase().includes(query));

      return matchStatus && matchPt && matchDate && matchQuery;
    });
  }, [orders, orderStatusFilter, orderPtFilter, orderDateFilter, orderSearch]);

  const handleDeleteFilteredOrders = async () => {
    if (filteredOrders.length === 0) {
      toast.warning('Tidak ada transaksi pesanan yang sesuai dengan filter saat ini.');
      return;
    }

    const totalNominal = filteredOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const filterParts: string[] = [];
    if (orderDateFilter) filterParts.push(`Tanggal: "${orderDateFilter.split('-').reverse().join('/')}"`);
    if (orderStatusFilter !== 'Semua') filterParts.push(`Status: "${orderStatusFilter}"`);
    if (orderPtFilter !== 'Semua') filterParts.push(`PT: "${orderPtFilter}"`);
    if (orderSearch.trim()) filterParts.push(`Pencarian: "${orderSearch.trim()}"`);
    const filterDesc = filterParts.length > 0 ? filterParts.join(' | ') : 'Semua Pesanan';

    const confirmed = await confirmModal({
      title: 'Hapus Transaksi Sesuai Filter?',
      message: `Apakah Anda yakin ingin menghapus ${filteredOrders.length} transaksi pesanan (${filterDesc}) dengan total nominal Rp ${totalNominal.toLocaleString('id-ID')}? Tindakan ini permanen dan akan menghapus seluruh data item terkait.`,
      type: 'danger',
      confirmText: `Ya, Hapus ${filteredOrders.length} Pesanan`,
      cancelText: 'Batal'
    });

    if (!confirmed) return;

    try {
      setIsDeletingFilteredOrders(true);
      const authToken = token || localStorage.getItem('token');
      const res = await fetch('/api/orders/delete-by-filter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          orderIds: filteredOrders.map(o => o.id),
          filterDescription: filterDesc
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus transaksi terpilih');

      toast.success(data.message || `Berhasil menghapus ${filteredOrders.length} transaksi.`);
      await fetchOrders();
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat menghapus transaksi.');
    } finally {
      setIsDeletingFilteredOrders(false);
    }
  };

  const handleDeleteSingleOrder = async (orderId: number) => {
    const confirmed = await confirmModal({
      title: 'Hapus Transaksi Pesanan',
      message: `Apakah Anda yakin ingin menghapus transaksi Pesanan #${orderId}? Seluruh data pesanan dan rincian item ini akan dihapus permanen.`,
      type: 'danger',
      confirmText: 'Ya, Hapus Pesanan',
      cancelText: 'Batal'
    });

    if (!confirmed) return;

    try {
      const authToken = token || localStorage.getItem('token');
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus pesanan');

      toast.success(data.message || `Pesanan #${orderId} berhasil dihapus.`);
      await fetchOrders();
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat menghapus pesanan.');
    }
  };

  const openStatusModal = (order: Order) => {
    setSelectedOrderForStatus(order);
    setNewStatusValue(order.status || 'Menunggu Konfirmasi');
    setNewKeteranganValue(order.keterangan || '');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSubscribePush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast.error('Browser tidak mendukung Push Notification');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.warning('Izin notifikasi ditolak.');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        const response = await fetch('/api/notifications/vapid-public-key');
        const vapidPublicKey = await response.text();
        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });
      }

      const authToken = token || localStorage.getItem('token');
      const res = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(subscription)
      });

      if (res.ok) {
        toast.success('Berhasil mengaktifkan Notifikasi HP!');
      } else {
        toast.error('Gagal mendaftarkan notifikasi di server');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Terjadi kesalahan saat mengaktifkan notifikasi');
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    const initialCategory = dynamicCategories[0]?.name || 'Umum';
    const initialSubCategory = dynamicCategories[0]?.subCategories[0] || '';

    setFormData({
      nama_barang: '',
      kategori: initialCategory,
      sub_kategori: initialSubCategory,
      harga: 0,
      stok: 0
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    const cat = p.kategori || 'Umum';
    const subCat = p.sub_kategori || '';

    setFormData({
      id: p.id,
      nama_barang: p.nama_barang,
      kategori: cat,
      sub_kategori: subCat,
      harga: p.harga,
      stok: p.stok
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    const isConfirmed = await confirmModal({
      title: 'Hapus Produk',
      message: 'Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan.',
      type: 'danger',
      confirmText: 'Hapus Produk',
      cancelText: 'Batal'
    });
    if (!isConfirmed) return;

    try {
      const authToken = token || localStorage.getItem('token');
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json'
        }
      });
      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== id));
        fetchProducts();
        toast.success('Produk berhasil dihapus!');
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Gagal menghapus produk');
      }
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan koneksi server');
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
        toast.success(editingProduct ? 'Produk berhasil diperbarui!' : 'Produk baru berhasil ditambahkan!');
      } else {
        toast.error('Gagal menyimpan produk');
      }
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan saat menyimpan produk');
    }
  };

  const openResetPasswordModal = (user: { id: number, nama: string, no_hp: string }) => {
    setResetPasswordUser(user);
    setNewPasswordInput('');
    setShowNewPassword(false);
    setResetPasswordError('');
  };

  const handleConfirmResetPassword = async () => {
    if (!resetPasswordUser) return;
    if (!newPasswordInput.trim() || newPasswordInput.trim().length < 6) {
      setResetPasswordError('Password minimal 6 karakter!');
      return;
    }

    setIsResettingPassword(true);
    setResetPasswordError('');

    try {
      const res = await fetch(`/api/users/${resetPasswordUser.id}/reset-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword: newPasswordInput.trim() })
      });

      if (res.ok) {
        toast.success(`Password pengguna "${resetPasswordUser.nama}" berhasil direset!`);
        setResetPasswordUser(null);
        setNewPasswordInput('');
      } else {
        const data = await res.json();
        setResetPasswordError(data.error || 'Gagal mereset password');
      }
    } catch (err) {
      console.error(err);
      setResetPasswordError('Terjadi kesalahan jaringan saat reset password.');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const openEditUserModal = (u: any) => {
    setEditingUser(u);
    setEditUserNama(u.nama || '');
    setEditUserPt(u.pt || 'PT. Siemens Indonesia');
    setEditUserDepartemen(u.departemen || '');
    setEditUserNoHp(u.no_hp || '');
    setEditUserRole(u.role || 'user');
    setEditUserPassword('');
    setEditUserError('');
    setEditUserSuccess('');
  };

  const handleSaveUserProfile = async () => {
    if (!editingUser) return;
    if (!editUserNama.trim() || !editUserPt.trim() || !editUserDepartemen.trim() || !editUserNoHp.trim()) {
      setEditUserError('Nama, PT, Departemen, dan No HP wajib diisi!');
      return;
    }

    setIsSavingUser(true);
    setEditUserError('');
    setEditUserSuccess('');

    try {
      const authToken = token || localStorage.getItem('token');
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          nama: editUserNama.trim(),
          pt: editUserPt.trim(),
          departemen: editUserDepartemen.trim(),
          no_hp: editUserNoHp.trim(),
          role: editUserRole,
          newPassword: editUserPassword.trim() || undefined
        })
      });

      const data = await res.json();
      if (res.ok) {
        setEditUserSuccess(`Profil "${editUserNama}" berhasil diperbarui!`);
        toast.success(`Profil "${editUserNama}" berhasil diperbarui!`);
        if (user && user.id === editingUser.id) {
          const updatedUser = { ...user, ...data.user };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        fetchUsers();
        setTimeout(() => {
          setEditingUser(null);
        }, 800);
      } else {
        setEditUserError(data.error || 'Gagal memperbarui profil pengguna');
      }
    } catch (err: any) {
      setEditUserError(err.message || 'Terjadi kesalahan jaringan');
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    setUpdatingRoleId(userId);
    try {
      const authToken = token || localStorage.getItem('token');
      const res = await fetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ newRole })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengubah role pengguna');

      toast.success(data.message || `Role pengguna berhasil diubah ke "${newRole.toUpperCase()}".`);

      // If Admin changed their own role, update local user object
      if (user && user.id === userId) {
        const updatedUser = { ...user, role: newRole };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Gagal memperbarui role');
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const openDeleteUserModal = (user: { id: number, nama: string, pt: string, no_hp: string }) => {
    setDeleteTargetUser(user);
    setDeleteReasonInput('');
    setDeleteUserError('');
  };

  const handleConfirmDeleteUser = async () => {
    if (!deleteTargetUser) return;
    if (!deleteReasonInput.trim() || deleteReasonInput.trim().length < 3) {
      setDeleteUserError('Alasan penghapusan akun wajib diisi (minimal 3 karakter)!');
      return;
    }

    setIsDeletingUser(true);
    setDeleteUserError('');

    try {
      const res = await fetch(`/api/users/${deleteTargetUser.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: deleteReasonInput.trim() })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        toast.success(data.message || `Akun "${deleteTargetUser.nama}" berhasil dihapus.`);
        setDeleteTargetUser(null);
        setDeleteReasonInput('');
        fetchUsers();
      } else {
        setDeleteUserError(data.error || 'Gagal menghapus akun pengguna.');
      }
    } catch (err) {
      console.error(err);
      setDeleteUserError('Terjadi kesalahan koneksi server.');
    } finally {
      setIsDeletingUser(false);
    }
  };

  const getRowValue = (row: any, keys: string[]): any => {
    if (!row) return undefined;
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== null) return row[key];
      const match = Object.keys(row).find(k => k.trim().toLowerCase() === key.toLowerCase());
      if (match && row[match] !== undefined && row[match] !== null) return row[match];
    }
    return undefined;
  };

  const handleDownloadTemplate = () => {
    // ===== SHEET 1: Contoh file format KOKSI Supplier (Minuman/F&B) =====
    // Format ini PERSIS seperti yang diterima dari supplier KOKSI
    const templateFnb = [
      // Header baris pertama
      ['No', 'Kategori Minuman', 'Nama Produk & Gramasi', 'Harga Dasar', 'Harga Jual ke KOKSI', 'Harga Jual ke Anggota'],
      // --- Air Mineral ---
      [1, 'Air Mineral', 'Aqua 600 ml', 2400, 3500, 4500],
      ['', '', 'Aqua 1.500 ml', 5550, 6000, 7000],
      ['', '', 'Le Minerale 600 ml', 2670, 3500, 4500],
      ['', '', 'Cleo 550 ml', 2775, 4000, 5000],
      // --- Teh Ready to Drink ---
      [2, 'Teh Ready to Drink', 'Teh Pucuk Harum 350 ml', 3620, 3500, 4500],
      ['', '', 'Tehbotol Sosro 450 ml', 6350, 7500, 8500],
      ['', '', 'Frestea Jasmine 350 ml', 4475, 4500, 5500],
      // --- Minuman Berkarbonasi ---
      [3, 'Minuman Berkarbonasi', 'Coca Cola 330 ml', 4500, 5000, 6000],
      ['', '', 'Sprite 330 ml', 4500, 5000, 6000],
      // --- Kopi RTD ---
      [4, 'Kopi RTD', 'Good Day Cappuccino 250 ml', 3800, 4000, 5000],
      ['', '', 'Nescafe Ready 240 ml', 5200, 6000, 7000],
    ];

    // ===== SHEET 2: Contoh file format KOKSI Supplier (Personal Care) =====
    const templatePc = [
      ['No', 'Kategori Perawatan', 'Nama Produk & Gramasi', 'Harga Dasar', 'Harga Jual ke KOKSI', 'Harga Jual ke Anggota'],
      [1, 'Sabun & Shampo', 'Lifebuoy Sabun Batang 85g', 3500, 5000, 6000],
      ['', '', 'Sunsilk Shampo 160 ml', 12000, 14000, 16000],
      ['', '', 'Clear Shampo 160 ml', 13000, 15000, 17000],
      [2, 'Pasta Gigi', 'Pepsodent Action 123 190g', 10000, 13000, 15000],
      ['', '', 'Close Up Deep Action 160g', 10000, 12000, 14000],
      [3, 'Deodoran', 'Rexona Men Stick 45g', 20000, 23000, 26000],
      ['', '', 'Dove Original Roll On 50 ml', 22000, 25000, 28000],
    ];

    // ===== SHEET 3: Panduan Kolom =====
    const panduan = [
      { 'Kolom': 'No', 'Keterangan': 'Nomor urut kategori (boleh kosong untuk baris lanjutan)', 'Wajib?': 'Tidak' },
      { 'Kolom': 'Kategori Minuman/Perawatan', 'Keterangan': 'Nama sub-kategori — sel bisa digabung (merged) untuk satu grup', 'Wajib?': 'Ya' },
      { 'Kolom': 'Nama Produk & Gramasi', 'Keterangan': 'Nama lengkap produk termasuk ukuran/gramasi', 'Wajib?': 'Ya' },
      { 'Kolom': 'Harga Dasar', 'Keterangan': 'Harga pokok — DIABAIKAN oleh sistem', 'Wajib?': 'Tidak' },
      { 'Kolom': 'Harga Jual ke KOKSI', 'Keterangan': 'Harga grosir — DIABAIKAN oleh sistem', 'Wajib?': 'Tidak' },
      { 'Kolom': 'Harga Jual ke Anggota', 'Keterangan': '✓ Harga yang tampil di aplikasi untuk member Siemens — WAJIB', 'Wajib?': 'Ya (UTAMA)' },
    ];

    const ws1 = XLSX.utils.aoa_to_sheet(templateFnb);
    const ws2 = XLSX.utils.aoa_to_sheet(templatePc);
    const ws3 = XLSX.utils.json_to_sheet(panduan);

    ws1['!cols'] = [{ wch: 5 }, { wch: 25 }, { wch: 38 }, { wch: 14 }, { wch: 20 }, { wch: 22 }];
    ws2['!cols'] = [{ wch: 5 }, { wch: 25 }, { wch: 38 }, { wch: 14 }, { wch: 20 }, { wch: 22 }];
    ws3['!cols'] = [{ wch: 30 }, { wch: 60 }, { wch: 12 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, 'Contoh F&B');
    XLSX.utils.book_append_sheet(wb, ws2, 'Contoh Personal Care');
    XLSX.utils.book_append_sheet(wb, ws3, 'Panduan Kolom');
    XLSX.writeFile(wb, 'Contoh_Format_KOKSI_Supplier.xlsx');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const ab = evt.target?.result;
        const wb = XLSX.read(ab, { type: 'array' });
        const formattedProducts: { nama_barang: string; kategori: string; sub_kategori?: string; harga: number; stok: number }[] = [];
        const frontendRejected: { nama_barang: string; alasan: string; kategori?: string }[] = [];

        for (const wsname of wb.SheetNames) {
          // --- Skip sheet yang bukan data produk KOKSI ---
          const wsnameLow = wsname.toLowerCase();
          const SKIP_SHEET_KEYWORDS = ['referensi', 'panduan', 'petunjuk', 'keterangan', 'info', 'catatan', 'note', 'readme', 'instruksi', 'guide', 'help', 'rekap', 'summary'];
          if (SKIP_SHEET_KEYWORDS.some(kw => wsnameLow.includes(kw))) {
            console.log(`[Parser] Sheet "${wsname}" dilewati (bukan sheet data produk).`);
            frontendRejected.push({
              nama_barang: `[Sheet: ${wsname}]`,
              alasan: `Sheet dilewati (bukan sheet data produk).`,
              kategori: '-'
            });
            continue;
          }

          const ws = wb.Sheets[wsname];
          const matrixRows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

          // --- Pre-check: sheet harus punya kolom Nama Produk + Harga Jual ke Anggota di 30 baris pertama ---
          const checkRows = matrixRows.slice(0, 30);
          const hasNamaCol = checkRows.some(row => Array.isArray(row) && row.some(cell => {
            const v = String(cell ?? '').toLowerCase();
            return v.includes('nama produk') || v.includes('nama barang') || (v.includes('nama') && (v.includes('produk') || v.includes('barang')));
          }));

          // KOKSI Format STRICT check
          let globalIdxHarga = -1;
          const hasHargaAnggotaCol = checkRows.some(row => Array.isArray(row) && row.some((cell, idx) => {
            const v = String(cell ?? '').toLowerCase();
            if (v.includes('harga jual ke anggota')) {
              globalIdxHarga = idx;
              return true;
            }
            return false;
          }));

          if (!hasNamaCol || !hasHargaAnggotaCol) {
            console.log(`[Parser] Sheet "${wsname}" dilewati (Template tidak sesuai ketentuan: tidak ada kolom 'Harga Jual ke Anggota').`);
            frontendRejected.push({
              nama_barang: `[Sheet: ${wsname}]`,
              alasan: `Template sheet tidak sesuai ketentuan (Harus format KOKSI dengan kolom 'Harga Jual ke Anggota').`,
              kategori: '-'
            });
            continue;
          }

          // ========== UNIVERSAL EXCEL AUTO-DETECTION PARSER ==========
          // Handles: KOKSI supplier format, BelanjaIn Saza template, and any arbitrary Excel

          // --- Helper functions ---
          const safeStr = (v: any): string => String(v ?? '').trim();
          const safeStrLow = (v: any): string => safeStr(v).toLowerCase();

          // Keyword dictionaries for column detection
          // Format yang diterima: Format KOKSI Supplier
          // Kolom harga: prioritas utama = "Harga Jual ke Anggota"
          const NAMA_KEYWORDS = ['nama produk & gramasi', 'nama produk', 'nama barang', 'product name', 'nama', 'item', 'produk', 'barang'];
          const HARGA_KEYWORDS = ['harga jual ke anggota', 'harga jual ke saza', 'harga anggota', 'harga jual', 'harga barang', 'harga', 'price'];
          const HARGA_EXCLUDE = ['hpp', 'keuntungan', 'modal', 'beli', 'dasar', 'koksi'];
          const SUBKAT_KEYWORDS = ['sub-kategori', 'sub kategori', 'sub_kategori', 'sub category', 'subkategori', 'sub kat'];
          const KAT_KEYWORDS = ['kategori', 'category', 'jenis'];
          const QTY_KEYWORDS = ['qty', 'stok', 'stock', 'jumlah'];
          const SKIP_ROW_KEYWORDS = ['total', 'daftar harga', 'jumlah', 'grand total', 'sub total', 'subtotal'];

          // Fuzzy match a string to CATEGORY_STRUCTURES
          const matchCategory = (text: string): string | null => {
            const lower = text.toLowerCase();
            for (const cat of CATEGORY_STRUCTURES) {
              if (lower.includes(cat.name.toLowerCase()) || cat.name.toLowerCase().includes(lower)) return cat.name;
              // Check partial keywords — require tokens longer than 5 chars to reduce false positives
              const keywords = cat.name.toLowerCase().split(/[&()\s]+/).filter(w => w.length > 5);
              const matchCount = keywords.filter(kw => lower.includes(kw)).length;
              // Need at least 2 keyword matches, or the text is long enough to be a full category name
              if (matchCount >= 2) return cat.name;
            }
            return null;
          };

          // Fuzzy match sub-category → returns { subCategory, parentCategory }
          const matchSubCategory = (text: string): { sub: string; parent: string } | null => {
            const lower = text.toLowerCase();
            for (const cat of CATEGORY_STRUCTURES) {
              for (const sub of cat.subCategories) {
                // Exact / full-string match: always trusted
                if (lower.includes(sub.toLowerCase()) || sub.toLowerCase().includes(lower)) {
                  return { sub: sub, parent: cat.name };
                }
                // Partial token match: only if tokens are long (>4 chars) AND at least 2 match
                // This prevents single-word accidents like 'dingin', 'manis', 'ringan'
                const keywords = sub.toLowerCase().split(/[&()\s]+/).filter(w => w.length > 4);
                if (keywords.length >= 2) {
                  const matchCount = keywords.filter(kw => lower.includes(kw)).length;
                  if (matchCount >= 2) {
                    return { sub: sub, parent: cat.name };
                  }
                } else if (keywords.length === 1 && keywords[0].length > 7 && lower.includes(keywords[0])) {
                  // Single very long token (>7 chars) is specific enough
                  return { sub: sub, parent: cat.name };
                }
              }
            }
            return null;
          };

          // Find column index by keyword match
          const findColIndex = (rowStr: string[], keywords: string[], exclude?: string[]): number => {
            // First pass: exact match (longest keyword first for specificity)
            const sortedKw = [...keywords].sort((a, b) => b.length - a.length);
            for (const kw of sortedKw) {
              const idx = rowStr.findIndex(cell => cell === kw);
              if (idx !== -1) return idx;
            }
            // Second pass: includes match
            for (const kw of sortedKw) {
              const idx = rowStr.findIndex(cell => cell.includes(kw) && (!exclude || !exclude.some(ex => cell.includes(ex))));
              if (idx !== -1) return idx;
            }
            return -1;
          };

          // Check if a row is a header row (contains nama keyword)
          const isHeaderRow = (rowStr: string[]): boolean => {
            return NAMA_KEYWORDS.some(kw => rowStr.some(cell => cell === kw || cell.includes(kw)));
          };

          // Check if a row looks like a section/category title (only 1-2 non-empty cells, text-only, no numbers that look like prices)
          const isSectionTitleRow = (row: any[], idxNama: number, idxHarga: number): boolean => {
            const nonEmpty = Array.from(row).filter(c => safeStr(c).length > 0);
            if (nonEmpty.length > 3) return false;
            const namaVal = safeStr(row[idxNama]);
            const hargaVal = idxHarga >= 0 ? safeStr(row[idxHarga]) : '';
            // If there's a significant price, it's not a section title
            if (hargaVal && parseInt(hargaVal.replace(/[^0-9]/g, ''), 10) > 0) return false;
            // If the name is too short, it's not useful as a section
            if (namaVal.length < 3) return false;
            // If it matches a known category or subcategory, it is a section title
            if (matchCategory(namaVal) || matchSubCategory(namaVal)) return true;
            return false;
          };

          // --- Main parsing logic: process each sheet ---
          let currentCat = CATEGORY_STRUCTURES[0].name;
          let currentSubCat = '';

          // Track column positions (can reset per section/header)
          let idxNama = -1;
          let idxHarga = -1;
          let idxQty = -1;
          let idxKat = -1;
          let idxSubKat = -1;
          // KOKSI format flag: Col A = Sub-Kategori (parent cat lookup), Col C = section label (NOT a DB category column)
          let isKoksiFormat = false;

          for (let r = 0; r < matrixRows.length; r++) {
            const rawRow = matrixRows[r];
            if (!Array.isArray(rawRow) || rawRow.length === 0) continue;
            const row = Array.from(rawRow); // handle sparse arrays
            const rowStr = row.map(safeStrLow);

            // --- Check if this row is a header row ---
            if (isHeaderRow(rowStr)) {
              const newIdxNama = findColIndex(rowStr, NAMA_KEYWORDS);
              const newIdxHarga = globalIdxHarga !== -1 ? globalIdxHarga : findColIndex(rowStr, HARGA_KEYWORDS, HARGA_EXCLUDE);
              const newIdxQty = findColIndex(rowStr, QTY_KEYWORDS);
              const newIdxKat = findColIndex(rowStr, KAT_KEYWORDS);
              const newIdxSubKat = findColIndex(rowStr, SUBKAT_KEYWORDS);

              if (newIdxNama !== -1) idxNama = newIdxNama;
              if (newIdxHarga !== -1) idxHarga = newIdxHarga;
              if (newIdxQty !== -1) idxQty = newIdxQty;
              if (newIdxKat !== -1) idxKat = newIdxKat;
              if (newIdxSubKat !== -1) idxSubKat = newIdxSubKat;

              // KOKSI supplier format:
              // Header Col C = "Kategori [SubCategoryName]" (e.g. "Kategori Pembersih Pakaian")
              // This encodes both the current sub-category AND lets us look up the parent category.
              // After extraction we set idxKat = -1 so data rows in Col C (section labels like
              // "Deterjen Cair/Bubuk") are NOT mistakenly used as the DB category.
              for (let c = 0; c < row.length; c++) {
                const cellVal = safeStr(row[c]);
                const cellLow = cellVal.toLowerCase();
                if (cellLow.startsWith('kategori ')) {
                  const catName = cellVal.replace(/^kategori\s+/i, '').trim();
                  if (catName.length > 0) {
                    // Try to find parent category from this sub-category-like name
                    const subMatch = matchSubCategory(catName);
                    if (subMatch) {
                      currentCat = subMatch.parent;
                      currentSubCat = subMatch.sub;
                    } else {
                      const catMatch = matchCategory(catName);
                      if (catMatch) {
                        currentCat = catMatch;
                        currentSubCat = '';
                      } else {
                        // Use as-is sub-category, keep current parent
                        currentSubCat = catName;
                      }
                    }
                    // Mark KOKSI format: Col C is a section-label column, not a DB category column
                    isKoksiFormat = true;
                    idxKat = -1; // Prevent data rows from reading Col C as category
                  }
                }
              }

              continue; // Skip the header row, don't add as product
            }

            // --- If no header found yet, skip ---
            if (idxNama === -1) continue;

            // --- Extract product name ---
            const productName = safeStr(row[idxNama]);
            if (!productName || productName.length < 2) continue;
            const productNameLow = productName.toLowerCase();

            // --- Skip meta-rows (totals, repeated headers, etc.) ---
            if (SKIP_ROW_KEYWORDS.some(kw => productNameLow.includes(kw))) continue;
            if (NAMA_KEYWORDS.some(kw => productNameLow === kw)) continue;

            // --- Check if this is a section/category title row ---
            if (isSectionTitleRow(row, idxNama, idxHarga)) {
              // Try to identify what category/subcategory this is
              const subMatch = matchSubCategory(productName);
              if (subMatch) {
                currentCat = subMatch.parent;
                currentSubCat = subMatch.sub;
              } else {
                const catMatch = matchCategory(productName);
                if (catMatch) {
                  currentCat = catMatch;
                  currentSubCat = '';
                } else {
                  // Unknown section name, use as sub-category
                  currentSubCat = productName;
                }
              }
              continue;
            }

            // --- Universal Category & Sub-Category Extractor ---
            // Strategy: scan EVERY cell in the row (skip product name, price, qty columns).
            // For each non-empty, non-numeric cell value:
            //   1. Strip "Kategori " prefix if present (KOKSI header format)
            //   2. Try sub-category match FIRST (most specific — also resolves parent category)
            //   3. If no sub-category match, try main-category match (updates only parent)
            //   4. If neither → it's a section label (e.g. "Deterjen Cair/Bubuk") — IGNORE
            // This approach is column-order agnostic and handles both 5-col and 6-col formats.
            const SKIP_CELL_EXACT = new Set(['no', 'sub-kategori', 'sub kategori', 'kategori', 'harga', 'nama', '-', 'rp']);
            for (let c = 0; c < row.length; c++) {
              if (c === idxNama || c === idxHarga || c === idxQty) continue; // skip data columns
              let cellVal = safeStr(row[c]);
              if (!cellVal || cellVal.length < 2) continue;
              if (/^\d[\d.,\s]*$/.test(cellVal)) continue; // skip pure numbers / prices
              const cellLow = cellVal.toLowerCase();
              if (SKIP_CELL_EXACT.has(cellLow)) continue; // skip header labels themselves

              // Strip "Kategori " prefix (e.g. "Kategori Pembersih Pakaian" → "Pembersih Pakaian")
              if (cellLow.startsWith('kategori ')) {
                cellVal = cellVal.replace(/^kategori\s+/i, '').trim();
                if (!cellVal) continue;
              }

              // Priority 1: match as a known sub-category → resolves BOTH sub_kategori + kategori
              const subMatch = matchSubCategory(cellVal);
              if (subMatch) {
                currentCat = subMatch.parent;
                currentSubCat = subMatch.sub;
                continue;
              }

              // Priority 2: match as a known main category → updates parent only
              const catMatch = matchCategory(cellVal);
              if (catMatch) {
                currentCat = catMatch;
                // Don't reset currentSubCat — preserve sub if already set from a previous row
                continue;
              }

              // Priority 3: unrecognized value (e.g. "Deterjen Cair/Bubuk", "Rokok SKM Full Flavor")
              // → it's a granular section label that has no equivalent in CATEGORY_STRUCTURES
              // → safely ignored; currentCat/currentSubCat carry forward from last match
            }


            // --- Extract price ---
            let priceNum = 0;
            if (idxHarga >= 0) {
              const priceRaw = row[idxHarga];
              if (priceRaw !== undefined && priceRaw !== null) {
                const priceStr = String(priceRaw).trim();
                if (priceStr !== '-' && priceStr !== '') {
                  priceNum = parseInt(priceStr.split(',')[0].replace(/[^0-9]/g, ''), 10) || 0;
                }
              }
            }

            // --- Extract quantity ---
            let qtyNum = 0;
            if (idxQty >= 0) {
              const qtyRaw = row[idxQty];
              if (qtyRaw !== undefined && qtyRaw !== null) {
                qtyNum = parseInt(String(qtyRaw).replace(/[^0-9]/g, ''), 10) || 0;
              }
            }

            // --- Push the product ---

            // smartCategorize is used ONLY as a fallback:
            //   - If Excel already provided a known category/sub-category (KOKSI format), trust it.
            //   - If currentCat is still the default first category AND currentSubCat is empty,
            //     it means the Excel gave us no category signal → let AI categorize instead.
            const excelHasKnownCat = CATEGORY_STRUCTURES.some(c => c.name === currentCat &&
              c.name !== CATEGORY_STRUCTURES[0].name) || // non-default parent cat was set
              CATEGORY_STRUCTURES.some(c => c.subCategories.some(s => s === currentSubCat)); // known sub-cat

            const smartCat = (!excelHasKnownCat) ? smartCategorize(productName) : null;
            let finalCat = currentCat;
            let finalSubCat = currentSubCat;

            if (smartCat) {
              finalCat = smartCat.kategori;
              finalSubCat = smartCat.sub_kategori;
            }

            formattedProducts.push({
              nama_barang: productName,
              kategori: finalCat || 'Lainnya',
              sub_kategori: finalSubCat || '',
              harga: priceNum,
              stok: qtyNum
            });
          }

          // --- Fallback: if nothing was parsed, try sheet_to_json with named keys ---
          if (formattedProducts.length === 0) {
            const objectData = XLSX.utils.sheet_to_json(ws) as any[];
            if (objectData && objectData.length > 0) {
              objectData.forEach(item => {
                const nama = getRowValue(item, ['nama_barang', 'nama barang', 'nama', 'barang', 'nama produk', 'product name', 'item', 'produk', 'nama produk & gramasi']);
                const kategori = getRowValue(item, ['kategori', 'category', 'jenis', 'kat']) || CATEGORY_STRUCTURES[0].name;
                const subKategori = getRowValue(item, ['sub_kategori', 'sub kategori', 'sub category', 'subkategori', 'sub_kat', 'subkat', 'sub-kategori']) || '';
                const hargaRaw = getRowValue(item, ['harga jual ke saza', 'harga jual', 'harga anggota', 'harga barang', 'harga', 'price']);
                const stokRaw = getRowValue(item, ['qty', 'stok', 'stock', 'jumlah', 'stok barang']);

                const hargaNum = parseInt(String(hargaRaw || 0).replace(/[^0-9]/g, ''), 10) || 0;
                const stokNum = parseInt(String(stokRaw || 0).replace(/[^0-9]/g, ''), 10) || 0;

                if (nama && String(nama).trim().length > 0) {
                  const cleanNama = String(nama).trim();
                  const cleanKat = String(kategori).trim();
                  const cleanSub = String(subKategori).trim();

                  // Apply fuzzy matching
                  const catMatch = matchCategory(cleanKat);
                  let finalCat = catMatch || cleanKat || 'Lainnya';
                  let finalSubCat = cleanSub;

                  const smartCat = smartCategorize(cleanNama);
                  if (smartCat) {
                    finalCat = smartCat.kategori;
                    finalSubCat = smartCat.sub_kategori;
                  }

                  formattedProducts.push({
                    nama_barang: cleanNama,
                    kategori: finalCat,
                    sub_kategori: finalSubCat,
                    harga: hargaNum,
                    stok: stokNum
                  });
                }
              });
            }
          }
        } // end of sheets loop

        if (formattedProducts.length === 0 && frontendRejected.length === 0) {
          toast.warning('Tidak ditemukan data produk yang valid. Pastikan file menggunakan format KOKSI supplier (kolom: Nama Produk & Gramasi, Harga Jual ke Anggota, Kategori).');
          return;
        }

        if (formattedProducts.length === 0 && frontendRejected.length > 0) {
          // If no products parsed but we have rejected sheets, show the modal directly
          setImportResult({
            inserted: [], updated: [], rejected: frontendRejected,
            insertedCount: 0, updatedCount: 0, rejectedCount: frontendRejected.length
          });
          setImportResultTab('rejected');
          setIsImportModalOpen(false);
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

        const resData = await res.json().catch(() => ({}));
        if (res.ok) {
          fetchProducts();
          // Tampilkan modal notifikasi detail hasil import
          const result: ImportResult = {
            inserted: resData.inserted || [],
            updated: resData.updated || [],
            rejected: [...frontendRejected, ...(resData.rejected || [])],
            insertedCount: resData.insertedCount || 0,
            updatedCount: resData.updatedCount || 0,
            rejectedCount: (resData.rejectedCount || 0) + frontendRejected.length,
          };
          setImportResult(result);
          // Default tab: tunjukkan rejected jika ada, kalau tidak ke inserted
          setImportResultTab(result.rejectedCount > 0 ? 'rejected' : result.insertedCount > 0 ? 'inserted' : 'updated');
          setIsImportModalOpen(false);
        } else {
          toast.error(`Gagal import produk: ${resData.error || 'Terjadi kesalahan pada server'}`);
        }
      } catch (err: any) {
        console.error(err);
        toast.error(`Kesalahan: ${err.message || 'Terjadi kesalahan saat memproses data'}`);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const executeExportMonthlySales = async (
    targetMonth?: number,
    targetYear?: number,
    targetPt?: string,
    targetStatus?: string
  ) => {
    try {
      const res = await fetch('/api/orders/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        toast.error('Gagal mengambil data penjualan untuk diexport');
        return;
      }
      const allOrders: Order[] = await res.json();

      const monthToUse = targetMonth ?? exportMonth;
      const yearToUse = targetYear ?? exportYear;
      const ptToUse = targetPt ?? exportPtFilter;
      const statusToUse = targetStatus ?? exportStatusFilter;
      const rabuToUse = exportRabu;

      // Filter orders by Month, Year, Rabu Period, PT, and Status
      const filteredOrders = allOrders.filter(order => {
        const orderDate = new Date(order.createdAt);
        const matchMonth = monthToUse === 0 || (orderDate.getMonth() + 1) === monthToUse;
        const matchYear = yearToUse === 0 || orderDate.getFullYear() === yearToUse;
        const matchRabu = isDateInWednesdayPeriod(orderDate, rabuToUse);
        const matchPt = ptToUse === 'Semua' || (order.user?.pt || '').toLowerCase() === ptToUse.toLowerCase();
        const matchStatus = statusToUse === 'Semua' || (order.status || 'Menunggu Konfirmasi').toLowerCase() === statusToUse.toLowerCase();

        return matchMonth && matchYear && matchRabu && matchPt && matchStatus;
      });

      if (filteredOrders.length === 0) {
        toast.warning('Tidak ditemukan transaksi penjualan yang cocok dengan kriteria filter tarikan bulanan.');
        return;
      }

      const periodTitle = monthToUse === 0
        ? `Tahun ${yearToUse}`
        : rabuToUse !== 'Semua'
          ? `${MONTH_NAMES[monthToUse - 1]} ${yearToUse} - ${(() => {
            const wedDate = new Date(rabuToUse);
            const endD = new Date(wedDate); endD.setDate(endD.getDate() - 1);
            const startD = new Date(wedDate); startD.setDate(startD.getDate() - 7);
            return `Rabu ${wedDate.getDate()} (${startD.getDate()}-${endD.getDate()})`;
          })()}`
          : `${MONTH_NAMES[monthToUse - 1]} ${yearToUse}`;

      // Calculate totals
      let totalItemsCount = 0;
      let totalRevenue = 0;

      filteredOrders.forEach(ord => {
        ord.items?.forEach(it => {
          totalItemsCount += (it.quantity || 0);
          totalRevenue += ((it.quantity || 0) * (it.price || 0));
        });
      });

      // Construct AOA Matrix without blank gap rows
      const r0 = ['BELANJAIN SAZA - PT. SIEMENS INDONESIA', '', '', '', '', '', '', '', '', '', ''];
      const r1 = ['LAPORAN REKAPITULASI DATA TRANSAKSI PENJUALAN', '', '', '', '', '', '', '', '', '', ''];
      const r2 = [`Periode: ${periodTitle}   |   Dicetak: ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: idLocale })} WIB`, '', '', '', '', '', '', '', '', '', ''];

      const r3 = [
        'TOTAL TRANSAKSI', '', '',
        'TOTAL ITEM TERJUAL', '', '',
        'TOTAL OMZET PENJUALAN', '', '', '', ''
      ];

      const r4 = [
        `${filteredOrders.length} Transaksi`, '', '',
        `${totalItemsCount.toLocaleString('id-ID')} Pcs`, '', '',
        totalRevenue, '', '', '', ''
      ];

      const r5 = [
        'NO',
        'NAMA KARYAWAN',
        'DEPARTEMEN',
        'NO HP / KONTAK',
        'Tanggal pesanan',
        'NAMA BARANG / PRODUK',
        'QTY',
        'HARGA SATUAN (RP)',
        'TOTAL HARGA (RP)',
        'TOTAL PEMBAYARAN (RP)',
        'STATUS PESANAN'
      ];

      const aoa: any[][] = [r0, r1, r2, r3, r4, r5];

      let orderCounter = 1;
      let grandTotalQty = 0;
      let grandTotalSubtotal = 0;

      const orderMerges: { s: { r: number, c: number }, e: { r: number, c: number } }[] = [];
      const userGroupRanges: { start: number; end: number; groupIdx: number; statusText: string }[] = [];

      // Helper for status badge color in Excel
      const getExcelStatusStyle = (statusText: string) => {
        const s = (statusText || '').toLowerCase();
        if (s.includes('selesai') || s.includes('completed')) {
          return { fgColor: 'D1FAE5', fontColor: '065F46' }; // Emerald Green
        }
        if (s.includes('siap')) {
          return { fgColor: 'E0E7FF', fontColor: '3730A3' }; // Indigo
        }
        if (s.includes('pengiriman')) {
          return { fgColor: 'E0F2FE', fontColor: '0369A1' }; // Sky Blue
        }
        if (s.includes('menyiapkan')) {
          return { fgColor: 'FEF3C7', fontColor: '92400E' }; // Amber
        }
        if (s.includes('proses')) {
          return { fgColor: 'DBEAFE', fontColor: '1E40AF' }; // Royal Blue
        }
        if (s.includes('pengajuan')) {
          return { fgColor: 'FFEDD5', fontColor: '9A3412' }; // Orange
        }
        if (s.includes('batal') || s.includes('cancelled')) {
          return { fgColor: 'FEE2E2', fontColor: '991B1B' }; // Rose Red
        }
        if (s.includes('menunggu')) {
          return { fgColor: 'FEF9C3', fontColor: '854D0E' }; // Yellow
        }
        return { fgColor: 'F1F5F9', fontColor: '334155' }; // Slate
      };

      // Grouping orders by user, maintaining distinct checkout orders
      const userOrdersMap = new Map<string, {
        user: any;
        orders: Order[];
      }>();

      filteredOrders.forEach(order => {
        const userKey = String(order.user?.no_hp || order.user?.id || 'unknown');
        if (!userOrdersMap.has(userKey)) {
          userOrdersMap.set(userKey, {
            user: order.user,
            orders: []
          });
        }
        userOrdersMap.get(userKey)!.orders.push(order);
      });

      Array.from(userOrdersMap.values()).forEach((userGroup, groupIdx) => {
        const userStartRow = aoa.length;

        let userTotal = 0;
        userGroup.orders.forEach(order => {
          const items = (order.items && order.items.length > 0) ? order.items : [];
          items.forEach(item => {
            userTotal += (item.quantity || 0) * (item.price || 0);
          });
        });

        userGroup.orders.forEach(order => {
          const orderStartRow = aoa.length;
          let formattedDate = '-';
          if (order.createdAt) {
            try {
              // Hanya tanggal tanpa waktu
              formattedDate = format(new Date(order.createdAt), 'dd/MM/yyyy', { locale: idLocale });
            } catch (e) {
              formattedDate = String(order.createdAt).split('T')[0] || String(order.createdAt);
            }
          }

          const orderStatus = order.status || 'Menunggu Konfirmasi';
          const items = (order.items && order.items.length > 0) ? order.items : [
            { id: 0, productId: 0, quantity: 0, price: 0, product: { nama_barang: 'Tidak ada barang' } }
          ];

          items.forEach((item, itemIdx) => {
            const qty = item.quantity || 0;
            const price = item.price || 0;
            const subtotal = qty * price;
            grandTotalQty += qty;
            grandTotalSubtotal += subtotal;

            const isFirstRowOfUser = (aoa.length === userStartRow);
            const isFirstRowOfOrder = (itemIdx === 0);

            aoa.push([
              isFirstRowOfUser ? orderCounter : '',
              isFirstRowOfUser ? (userGroup.user?.nama || '-') : '',
              isFirstRowOfUser ? (userGroup.user?.departemen || '-') : '',
              isFirstRowOfUser ? (userGroup.user?.no_hp || '-') : '',
              isFirstRowOfOrder ? formattedDate : '',
              item.product?.nama_barang || 'Barang Dihapus',
              qty,
              price,
              subtotal,
              isFirstRowOfUser ? userTotal : '',
              isFirstRowOfOrder ? orderStatus : ''
            ]);
          });

          const orderEndRow = aoa.length - 1;

          // Merge order-level columns (Tanggal pesanan, Status pesanan) jika order checkout memiliki > 1 item
          if (orderEndRow > orderStartRow) {
            orderMerges.push({ s: { r: orderStartRow, c: 4 }, e: { r: orderEndRow, c: 4 } });
            orderMerges.push({ s: { r: orderStartRow, c: 10 }, e: { r: orderEndRow, c: 10 } });
          }
        });

        const userEndRow = aoa.length - 1;
        userGroupRanges.push({ start: userStartRow, end: userEndRow, groupIdx, statusText: '' });

        // Merge user-level columns (NO, NAMA, DEPT, NO HP, TOTAL PEMBAYARAN) jika user memiliki > 1 baris
        if (userEndRow > userStartRow) {
          for (let c = 0; c <= 3; c++) {
            orderMerges.push({ s: { r: userStartRow, c }, e: { r: userEndRow, c } });
          }
          orderMerges.push({ s: { r: userStartRow, c: 9 }, e: { r: userEndRow, c: 9 } });
        }

        orderCounter++;
      });

      const footerRowIdx = aoa.length;
      aoa.push([
        'TOTAL KESELURUHAN (PERIODE BULAN INI)', '', '', '', '', '',
        grandTotalQty,
        '',
        grandTotalSubtotal,
        grandTotalSubtotal,
        ''
      ]);

      const ws = XLSX.utils.aoa_to_sheet(aoa);

      // Merges
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 10 } },
        { s: { r: 3, c: 0 }, e: { r: 3, c: 2 } },
        { s: { r: 4, c: 0 }, e: { r: 4, c: 2 } },
        { s: { r: 3, c: 3 }, e: { r: 3, c: 5 } },
        { s: { r: 4, c: 3 }, e: { r: 4, c: 5 } },
        { s: { r: 3, c: 6 }, e: { r: 3, c: 10 } },
        { s: { r: 4, c: 6 }, e: { r: 4, c: 10 } },
        { s: { r: footerRowIdx, c: 0 }, e: { r: footerRowIdx, c: 5 } },
        ...orderMerges
      ];

      // Column widths dibuat pas dan proporsional
      ws['!cols'] = [
        { wch: 6 },   // NO
        { wch: 24 },  // NAMA KARYAWAN
        { wch: 18 },  // DEPARTEMEN
        { wch: 16 },  // NO HP / KONTAK
        { wch: 16 },  // Tanggal pesanan (dd/MM/yyyy)
        { wch: 32 },  // NAMA BARANG / PRODUK
        { wch: 8 },   // QTY
        { wch: 18 },  // HARGA SATUAN (RP)
        { wch: 18 },  // TOTAL HARGA (RP)
        { wch: 22 },  // TOTAL PEMBAYARAN (RP)
        { wch: 22 }   // STATUS PESANAN
      ];

      // Row heights
      ws['!rows'] = [];
      ws['!rows'][0] = { hpt: 28 };
      ws['!rows'][1] = { hpt: 22 };
      ws['!rows'][2] = { hpt: 18 };
      ws['!rows'][3] = { hpt: 18 };
      ws['!rows'][4] = { hpt: 26 };
      ws['!rows'][5] = { hpt: 26 };

      const borderThin = {
        top: { style: 'thin', color: { rgb: '94A3B8' } },
        bottom: { style: 'thin', color: { rgb: '94A3B8' } },
        left: { style: 'thin', color: { rgb: '94A3B8' } },
        right: { style: 'thin', color: { rgb: '94A3B8' } }
      };

      // Styling Cells
      // Row 0
      for (let c = 0; c <= 10; c++) {
        const addr = XLSX.utils.encode_cell({ r: 0, c });
        if (!ws[addr]) ws[addr] = { v: '', t: 's' };
        ws[addr].s = {
          font: { name: 'Arial', sz: 12, bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '004B49' } },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      }

      // Row 1
      for (let c = 0; c <= 10; c++) {
        const addr = XLSX.utils.encode_cell({ r: 1, c });
        if (!ws[addr]) ws[addr] = { v: '', t: 's' };
        ws[addr].s = {
          font: { name: 'Arial', sz: 11, bold: true, color: { rgb: '0F172A' } },
          fill: { fgColor: { rgb: 'CCEBE6' } },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      }

      // Row 2
      for (let c = 0; c <= 10; c++) {
        const addr = XLSX.utils.encode_cell({ r: 2, c });
        if (!ws[addr]) ws[addr] = { v: '', t: 's' };
        ws[addr].s = {
          font: { name: 'Arial', sz: 9, italic: true, color: { rgb: '475569' } },
          fill: { fgColor: { rgb: 'F1F5F9' } },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      }

      // KPI Boxes (Rows 3 & 4)
      for (let c = 0; c <= 10; c++) {
        const lAddr = XLSX.utils.encode_cell({ r: 3, c });
        const vAddr = XLSX.utils.encode_cell({ r: 4, c });

        if (!ws[lAddr]) ws[lAddr] = { v: '', t: 's' };
        if (!ws[vAddr]) ws[vAddr] = { v: '', t: 's' };

        const isOmzet = c >= 6;
        ws[lAddr].s = {
          font: { name: 'Arial', sz: 9, bold: true, color: { rgb: isOmzet ? '065F46' : '334155' } },
          fill: { fgColor: { rgb: isOmzet ? 'DCFCE7' : 'F1F5F9' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: borderThin
        };

        ws[vAddr].s = {
          font: { name: 'Arial', sz: 12, bold: true, color: { rgb: isOmzet ? '047857' : '0F172A' } },
          fill: { fgColor: { rgb: isOmzet ? 'ECFDF5' : 'FFFFFF' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: borderThin
        };

        if (isOmzet && typeof ws[vAddr].v === 'number') {
          ws[vAddr].z = '"Rp "#,##0';
        }
      }

      // Table Headers (Row 5)
      for (let c = 0; c <= 10; c++) {
        const addr = XLSX.utils.encode_cell({ r: 5, c });
        if (!ws[addr]) ws[addr] = { v: '', t: 's' };
        ws[addr].s = {
          font: { name: 'Arial', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '0F172A' } },
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
          border: {
            top: { style: 'medium', color: { rgb: '0F172A' } },
            bottom: { style: 'medium', color: { rgb: '0F172A' } },
            left: { style: 'thin', color: { rgb: '475569' } },
            right: { style: 'thin', color: { rgb: '475569' } }
          }
        };
      }

      // Distinct visible borders
      const borderCellColor = '94A3B8';       // Slate-400 for standard inner borders (clear & crisp)
      const borderUserDividerColor = '334155'; // Slate-700 for distinct separator between user orders

      // Data Rows (6 to footerRowIdx - 1)
      for (let r = 6; r < footerRowIdx; r++) {
        const userGroup = userGroupRanges.find(ug => r >= ug.start && r <= ug.end);
        const isEvenUser = (userGroup ? userGroup.groupIdx : r) % 2 === 0;
        const rowBg = isEvenUser ? 'FFFFFF' : 'F8FAFC';
        const isUserLastRow = userGroup ? r === userGroup.end : false;

        for (let c = 0; c <= 10; c++) {
          const addr = XLSX.utils.encode_cell({ r, c });
          if (!ws[addr]) ws[addr] = { v: '', t: 's' };
          const cell = ws[addr];

          let align: 'left' | 'center' | 'right' = 'left';
          // Kolom NO (0), NO HP (3), Tanggal pesanan (4), QTY (6), TOTAL PEMBAYARAN (9) selalu di tengah (center)
          if (c === 0 || c === 3 || c === 4 || c === 6 || c === 9) align = 'center';
          if (c === 7 || c === 8) align = 'right';

          // Garis pemisah antar user dibuat lebih tegas (medium) pada baris terakhir setiap user
          const cellBorder = {
            top: { style: 'thin', color: { rgb: borderCellColor } },
            bottom: isUserLastRow
              ? { style: 'medium', color: { rgb: borderUserDividerColor } }
              : { style: 'thin', color: { rgb: borderCellColor } },
            left: { style: 'thin', color: { rgb: borderCellColor } },
            right: { style: 'thin', color: { rgb: borderCellColor } }
          };

          cell.s = {
            font: { name: 'Arial', sz: 9.5, color: { rgb: '1E293B' } },
            fill: { fgColor: { rgb: rowBg } },
            alignment: { horizontal: align, vertical: 'center', wrapText: true },
            border: cellBorder
          };

          if (c === 9 && cell.v !== '') {
            cell.s.font.bold = true;
            cell.s.font.color = { rgb: '047857' }; // emerald-700
            cell.s.fill = { fgColor: { rgb: 'D1FAE5' } }; // emerald-100
          }

          if (c === 7 || c === 8 || c === 9) {
            if (typeof cell.v === 'number') {
              cell.z = '"Rp "#,##0';
            }
          }

          if (c === 6 && typeof cell.v === 'number') {
            cell.z = '#,##0';
            cell.s.font.bold = true;
          }

          // Tanggal Pesanan harus di tengah
          if (c === 4) {
            cell.s.alignment = { horizontal: 'center', vertical: 'center', wrapText: true };
          }

          // Pewarnaan status pesanan spesifik & jelas
          if (c === 10) {
            const statusVal = String(cell.v || '');
            if (statusVal) {
              const stStyle = getExcelStatusStyle(statusVal);
              cell.s = {
                font: { name: 'Arial', sz: 9.5, bold: true, color: { rgb: stStyle.fontColor } },
                fill: { fgColor: { rgb: stStyle.fgColor } },
                alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
                border: cellBorder
              };
            }
          }
        }
      }

      // Footer Row
      ws['!rows'][footerRowIdx] = { hpt: 26 };
      for (let c = 0; c <= 10; c++) {
        const addr = XLSX.utils.encode_cell({ r: footerRowIdx, c });
        if (!ws[addr]) ws[addr] = { v: '', t: 's' };

        const curCell = ws[addr];
        curCell.s = {
          font: { name: 'Arial', sz: 10, bold: true, color: { rgb: '0F172A' } },
          fill: { fgColor: { rgb: 'E2E8F0' } },
          alignment: { horizontal: c === 6 || c === 8 || c === 9 ? 'right' : 'left', vertical: 'center' },
          border: {
            top: { style: 'medium', color: { rgb: '0F172A' } },
            bottom: { style: 'double', color: { rgb: '0F172A' } },
            left: { style: 'thin', color: { rgb: '94A3B8' } },
            right: { style: 'thin', color: { rgb: '94A3B8' } }
          }
        };

        if ((c === 8 || c === 9) && typeof curCell.v === 'number') {
          curCell.z = '"Rp "#,##0';
        }
        if (c === 6 && typeof curCell.v === 'number') {
          curCell.z = '#,##0';
        }
      }

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Laporan Penjualan');

      const cleanPeriod = periodTitle.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `Laporan_Transaksi_BelanjaIn_Saza_${cleanPeriod}.xlsx`;

      XLSX.writeFile(wb, fileName);
      setIsExportModalOpen(false);
      toast.success('Laporan transaksi bulanan Excel berhasil diunduh!');
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan saat mengunduh laporan transaksi Excel.');
    }
  };

  const getStatusBadgeStyle = (status?: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('selesai') || s === 'completed') return 'bg-teal-100 text-teal-800 border-teal-200';
    if (s.includes('siap')) return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    if (s.includes('pengiriman')) return 'bg-sky-100 text-sky-800 border-sky-200';
    if (s.includes('menyiapkan')) return 'bg-amber-100 text-amber-900 border-amber-300';
    if (s.includes('pengajuan')) return 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold';
    if (s.includes('proses')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (s.includes('batal') || s === 'cancelled') return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-amber-100 text-amber-800 border-amber-200';
  };

  const pendingOrdersCount = orders.filter(o => !o.status || o.status === 'Menunggu Konfirmasi').length;

  return (
    <div className={printingOrderId !== null ? 'hidden' : 'min-h-screen bg-slate-50 flex flex-col font-sans w-full max-w-full overflow-x-hidden'}>
      {/* Navbar Admin */}
      <header className="bg-slate-900 text-white sticky top-0 z-30 shadow-md shrink-0 w-full max-w-full">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 min-h-[64px] py-2.5 sm:py-0 flex items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-tr from-teal-500 via-teal-400 to-amber-400 text-slate-950 rounded-xl flex items-center justify-center font-black text-lg sm:text-xl italic shadow-md shrink-0">
              B
            </div>
            <div className="min-w-0 flex flex-col justify-center">
              <h1 className="text-sm sm:text-base font-extrabold tracking-tight leading-tight text-white flex items-center gap-1 truncate">
                <span>BelanjaIn Saza</span> <span className="text-teal-400 font-bold">&bull;</span> <span className="text-slate-300 font-semibold text-xs sm:text-sm">Admin Portal</span>
              </h1>
              <p className="text-[9.5px] sm:text-[10px] text-teal-400 font-bold uppercase tracking-wider leading-tight mt-0.5">
                PT. Siemens Indonesia
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <button
              onClick={handleOpenProfileModal}
              className="flex items-center gap-1 sm:gap-1.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white px-2.5 sm:px-3 py-1.5 rounded-xl transition-all cursor-pointer border border-teal-500 shadow-sm"
              title="Edit Profil Saya"
            >
              <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="text-[11px] sm:text-xs font-bold whitespace-nowrap">Edit Profil</span>
            </button>
            <button
              onClick={handleSubscribePush}
              className="p-1.5 sm:p-2 text-amber-400 hover:text-white hover:bg-amber-600 rounded-xl transition-colors cursor-pointer"
              title="Aktifkan Notifikasi HP"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={handleLogout}
              className="p-1.5 sm:p-2 text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500 rounded-xl transition-all cursor-pointer shadow-sm"
              title="Logout"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 w-full max-w-full flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Navigation Tabs (Mobile 2-Column Grid / Desktop Horizontal Tabs) */}
        {/* Mobile View (< sm): Fits 100% on screen, Zero Swiping Needed */}
        <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-200/60 rounded-2xl mb-4 sm:hidden">
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-2 px-2.5 rounded-xl font-bold text-[11px] uppercase tracking-wider flex items-center justify-between transition-all cursor-pointer ${activeTab === 'orders'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
              }`}
          >
            <div className="flex items-center gap-1.5 truncate">
              <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Transaksi</span>
            </div>
            {pendingOrdersCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[9px] bg-amber-400 text-slate-950 rounded-full font-black">
                {pendingOrdersCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-2 px-2.5 rounded-xl font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer truncate ${activeTab === 'analytics'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
              }`}
          >
            <TrendingUp className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'analytics' ? 'text-white' : 'text-teal-600'}`} />
            <span className="truncate">Grafik Penjualan</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`py-2 px-2.5 rounded-xl font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer truncate ${activeTab === 'products'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
              }`}
          >
            <Package className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Data Produk</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-2.5 rounded-xl font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer truncate ${activeTab === 'users'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
              }`}
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Pengguna ({users.length})</span>
          </button>
        </div>

        {/* Desktop View (>= sm): Standard Horizontal Tabs */}
        <div className="hidden sm:flex space-x-2 border-b border-slate-200 mb-6 shrink-0 overflow-x-auto max-w-full w-full pb-1">
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 px-4 font-bold text-xs uppercase tracking-wider flex items-center space-x-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'orders'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Permintaan Transaksi</span>
            {pendingOrdersCount > 0 && (
              <span className="ml-1.5 px-2 py-0.5 text-[10px] bg-amber-500 text-white rounded-full font-black">
                {pendingOrdersCount} Baru
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-3 px-4 font-bold text-xs uppercase tracking-wider flex items-center space-x-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'analytics'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
          >
            <TrendingUp className="w-4 h-4 text-teal-600" />
            <span>Grafik & Tren Penjualan</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`py-3 px-4 font-bold text-xs uppercase tracking-wider flex items-center space-x-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'products'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
          >
            <Package className="w-4 h-4" />
            <span>Data Produk</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`py-3 px-4 font-bold text-xs uppercase tracking-wider flex items-center space-x-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'users'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
          >
            <FileText className="w-4 h-4" />
            <span>Daftar Pengguna ({users.length})</span>
          </button>

          <button
            onClick={handleOpenProfileModal}
            className="py-3 px-4 font-bold text-xs uppercase tracking-wider flex items-center space-x-2 border-b-2 border-transparent text-slate-600 hover:text-teal-600 transition-colors whitespace-nowrap bg-teal-50/60 rounded-t-lg"
          >
            <UserIcon className="w-4 h-4 text-teal-600" />
            <span>Edit Profil Saya</span>
          </button>
        </div>

        {/* TAB 1: PERMINTAAN TRANSAKSI (REAL-TIME ORDERS) */}
        {activeTab === 'orders' && (
          <div className="flex flex-col flex-1 space-y-4">
            {/* Header Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 rounded-full bg-teal-500"></div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Permintaan Transaksi Karyawan</h2>
                  <p className="text-xs text-slate-500">
                    Auto-update real-time &bull; Terakhir dicek: {format(lastUpdated, 'HH:mm:ss')}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 flex-wrap gap-y-2 w-full md:w-auto">
                <button
                  onClick={toggleDemoOrdering}
                  className={`flex items-center space-x-1.5 px-3 py-2 text-white text-xs font-extrabold rounded-xl transition-all shadow-md cursor-pointer border ${isDemoOrderingEnabled ? 'bg-amber-500 hover:bg-amber-600 border-amber-600 shadow-amber-500/20' : 'bg-slate-500 hover:bg-slate-600 border-slate-600'}`}
                  title="Aktifkan ini untuk mengizinkan pesanan di luar hari Senin-Selasa untuk demo"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>{isDemoOrderingEnabled ? 'Mode Demo Aktif' : 'Mode Demo Mati'}</span>
                </button>

                <button
                  onClick={() => setActiveTab('analytics')}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold rounded-xl transition-all shadow-md cursor-pointer border border-slate-700"
                  title="Lihat grafik tren penjualan dan analisis Recharts"
                >
                  <BarChart2 className="w-4 h-4 text-teal-400" />
                  <span>Grafik Tren Penjualan</span>
                </button>

                <button
                  onClick={() => setIsExportModalOpen(true)}
                  className="flex items-center space-x-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs font-extrabold rounded-xl transition-all shadow-md shadow-teal-600/20 cursor-pointer"
                  title="Tarik data rekapitulasi transaksi bulanan format Excel"
                >
                  <FileSpreadsheet className="w-4 h-4 text-teal-200" />
                  <span>Tarikan Data Bulanan (Excel)</span>
                </button>
                <button
                  onClick={() => fetchOrders()}
                  disabled={ordersLoading}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                  title="Refresh data sekarang"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${ordersLoading ? 'animate-spin text-teal-600' : ''}`} />
                  <span>Refresh Real-time</span>
                </button>

                {filteredOrders.length > 0 && (
                  <button
                    onClick={handleDeleteFilteredOrders}
                    disabled={isDeletingFilteredOrders}
                    className="flex items-center space-x-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 border border-rose-200 text-xs font-extrabold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
                    title="Hapus seluruh transaksi yang sedang ditampilkan sesuai filter aktif"
                  >
                    <Trash2 className={`w-3.5 h-3.5 ${isDeletingFilteredOrders ? 'animate-spin' : 'text-rose-600'}`} />
                    <span>Hapus Sesuai Filter ({filteredOrders.length})</span>
                  </button>
                )}

                {/* Filter Tanggal */}
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl shadow-sm" title="Filter berdasarkan tanggal transaksi">
                  <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <input
                    type="date"
                    value={orderDateFilter}
                    onChange={(e) => setOrderDateFilter(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                  />
                  {orderDateFilter && (
                    <button
                      onClick={() => setOrderDateFilter('')}
                      className="text-slate-400 hover:text-rose-600 p-0.5 transition-colors cursor-pointer"
                      title="Hapus filter tanggal"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
                >
                  <option value="Semua">Semua Status Tahapan</option>
                  <option value="Proses">Proses</option>
                  <option value="Menyiapkan Pesanan">Menyiapkan Pesanan</option>
                  <option value="Pengiriman">Pengiriman</option>
                  <option value="Siap Diambil">Siap Diambil</option>
                  <option value="Selesai">Selesai</option>
                  <option value="Pengajuan Pembatalan">⚠️ Pengajuan Pembatalan</option>
                  <option value="Dibatalkan">Dibatalkan</option>
                </select>

                <select
                  value={orderPtFilter}
                  onChange={(e) => setOrderPtFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
                >
                  <option value="Semua">Semua PT</option>
                  {Array.from(new Set(orders.map(o => o.user?.pt).filter(Boolean))).map((ptName: any) => (
                    <option key={ptName} value={ptName}>{ptName}</option>
                  ))}
                </select>

                <div className="relative flex-1 md:w-48">
                  <input
                    type="text"
                    placeholder="Cari ID/Nama/No HP/Produk..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>
            </div>

            {/* Orders List Grid / Cards */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {ordersLoading && orders.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center text-slate-500 border border-slate-200/80 shadow-sm flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 mb-4">
                    <RefreshCw className="w-8 h-8 animate-spin" />
                  </div>
                  <p className="text-sm font-extrabold text-slate-800">Memuat Permintaan Transaksi Real-Time...</p>
                  <p className="text-xs text-slate-400 mt-1 font-medium">Menghubungkan ke Server BelanjaIn Saza PT. Siemens Indonesia</p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-200/80 shadow-md flex flex-col items-center justify-center relative overflow-hidden">
                  {/* Background Glow */}
                  <div className="absolute top-0 right-0 w-40 h-40 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

                  {orders.length === 0 ? (
                    <>
                      {/* Case 1: Absolutely zero orders in system */}
                      <div className="w-20 h-20 bg-slate-900 rounded-3xl shadow-lg flex items-center justify-center text-teal-400 mb-5 border border-slate-800">
                        <Inbox className="w-10 h-10" />
                      </div>
                      <h3 className="text-xl font-extrabold text-slate-900 mb-2">Belum Ada Permintaan Transaksi Masuk</h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed mb-6 font-medium">
                        Sistem BelanjaIn Saza belum menerima pesanan baru dari karyawan PT. Siemens Indonesia. Transaksi yang dikirim oleh pengguna akan muncul otomatis secara real-time di halaman ini.
                      </p>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => fetchOrders()}
                          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-teal-400" />
                          <span>Cek Pembaruan Transaksi</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Case 2: Orders exist, but filters/search returned zero matches */}
                      <div className="w-20 h-20 bg-amber-50 rounded-3xl border border-amber-200 flex items-center justify-center text-amber-600 mb-5 shadow-sm">
                        <FilterX className="w-10 h-10" />
                      </div>
                      <h3 className="text-xl font-extrabold text-slate-900 mb-2">Pesanan Tidak Ditemukan</h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed mb-4 font-medium">
                        Tidak ada riwayat transaksi pesanan yang cocok dengan kriteria filter atau pencarian yang Anda tentukan.
                      </p>

                      {/* Filter Badges Display */}
                      <div className="flex items-center justify-center gap-2 flex-wrap mb-6">
                        {orderDateFilter && (
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-[11px] font-bold rounded-lg border border-slate-200">
                            Tanggal: <span className="text-teal-700">{orderDateFilter.split('-').reverse().join('/')}</span>
                          </span>
                        )}
                        {orderStatusFilter !== 'Semua' && (
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-[11px] font-bold rounded-lg border border-slate-200">
                            Status: <span className="text-teal-700">{orderStatusFilter}</span>
                          </span>
                        )}
                        {orderPtFilter !== 'Semua' && (
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-[11px] font-bold rounded-lg border border-slate-200">
                            PT: <span className="text-teal-700">{orderPtFilter}</span>
                          </span>
                        )}
                        {orderSearch.trim() !== '' && (
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-[11px] font-bold rounded-lg border border-slate-200">
                            Cari: <span className="text-teal-700">"{orderSearch}"</span>
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setOrderDateFilter('');
                          setOrderStatusFilter('Semua');
                          setOrderPtFilter('Semua');
                          setOrderSearch('');
                        }}
                        className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-teal-600/20 flex items-center gap-2 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-teal-200" />
                        <span>Reset Filter & Tampilkan Semua Pesanan ({orders.length})</span>
                      </button>
                    </>
                  )}
                </div>
              ) : (
                filteredOrders.map(order => (
                  <div
                    key={order.id}
                    className={`bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col transition-all ${(!order.status || order.status === 'Menunggu Konfirmasi')
                      ? 'border-amber-300 ring-2 ring-amber-400/20'
                      : 'border-slate-200'
                      }`}
                  >
                    {/* Order Header Info */}
                    <div className="bg-slate-50 border-b border-slate-100 p-4 sm:px-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-4">
                        <div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">ID Order #{order.id}</span>
                          <p className="text-xs font-semibold text-slate-800">
                            {format(new Date(order.createdAt), 'dd MMMM yyyy, HH:mm', { locale: idLocale })}
                          </p>
                        </div>

                        <div className="hidden sm:block w-px h-8 bg-slate-200"></div>

                        <div>
                          <p className="text-xs font-extrabold text-slate-900">{order.user?.nama || 'Pengguna Dihapus'}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="px-2 py-0.5 bg-teal-50 text-teal-800 font-bold text-[10px] rounded-md border border-teal-200">
                              {order.user?.pt || 'PT. Siemens Indonesia'}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">{order.user?.departemen || '-'}</span>
                          </div>
                        </div>

                        <div className="hidden sm:block w-px h-8 bg-slate-200"></div>

                        {order.user?.no_hp && (
                          <a
                            href={`https://wa.me/62${order.user.no_hp.replace(/^0/, '')}?text=${encodeURIComponent(`Halo Sdr/i ${order.user.nama}, mengenai pesanan #${order.id} BelanjaIn Saza...`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200 text-xs font-bold transition-colors"
                          >
                            <Phone className="w-3 h-3 mr-1" />
                            {order.user.no_hp}
                          </a>
                        )}
                      </div>

                      <div className="flex items-center justify-between lg:justify-end gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-200">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Transaksi</span>
                          <span className="text-base font-extrabold text-teal-700">
                            Rp {(order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) + 2000).toLocaleString('id-ID')}
                          </span>
                        </div>

                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border whitespace-nowrap shrink-0 ${getStatusBadgeStyle(order.status)}`}>
                          {order.status || 'Menunggu Konfirmasi'}
                        </span>

                        <button
                          onClick={() => handlePrintReceipt(order.id)}
                          className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-colors border border-transparent hover:border-teal-200 cursor-pointer shrink-0 no-print"
                          title={`Cetak Struk Pesanan #${order.id}`}
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSingleOrder(order.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-transparent hover:border-rose-200 cursor-pointer shrink-0 no-print"
                          title={`Hapus Transaksi Pesanan #${order.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Stage Status Management Bar */}
                    <div className="p-4 sm:px-6 bg-slate-50/70 border-b border-slate-100 flex flex-col items-start justify-between gap-3">
                      <div className="w-full">
                        <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">
                          Update Tahap Status Pesanan:
                        </p>
                        {order.status === 'Pengajuan Pembatalan' ? (
                          <div className="p-4 bg-amber-50/90 border-2 border-amber-300 rounded-2xl text-amber-900 text-xs font-semibold w-full space-y-3 shadow-xs">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-amber-200/80">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-600 text-white font-black text-[10px] uppercase tracking-wider rounded-lg shadow-2xs">
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-100" />
                                  <span>Pengajuan Pembatalan Karyawan</span>
                                </span>
                                <span className="text-amber-950 font-extrabold text-xs">
                                  • Membutuhkan Konfirmasi Admin
                                </span>
                              </div>
                              <span className="text-[11px] font-bold text-amber-800">
                                Status: Menunggu Konfirmasi
                              </span>
                            </div>

                            <div className="p-2.5 bg-white/90 rounded-xl border border-amber-200/90 text-slate-800">
                              <span className="font-extrabold text-amber-950">Catatan/Alasan Pengajuan: </span>
                              <span className="font-medium">{order.keterangan ? order.keterangan.replace(/^Pengajuan Pembatalan:\s*/, '') : 'Tidak ada alasan dicantumkan.'}</span>
                            </div>

                            <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2 pt-1">
                              <button
                                onClick={() => {
                                  setCancellationNoteInput('Pembatalan Disetujui Admin.');
                                  setCancellationActionError('');
                                  setCancellationActionSuccess('');
                                  setCancellationConfirmModal({
                                    orderId: order.id,
                                    type: 'approve',
                                    orderNumber: order.id
                                  });
                                }}
                                className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-extrabold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Check className="w-4 h-4 shrink-0" />
                                <span>Setujui Pembatalan</span>
                              </button>
                              <button
                                onClick={() => {
                                  setCancellationNoteInput('Pesanan sedang diproses dan tidak dapat dibatalkan.');
                                  setCancellationActionError('');
                                  setCancellationActionSuccess('');
                                  setCancellationConfirmModal({
                                    orderId: order.id,
                                    type: 'reject',
                                    orderNumber: order.id
                                  });
                                }}
                                className="flex-1 sm:flex-none px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-xs font-extrabold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <X className="w-4 h-4 shrink-0" />
                                <span>Tolak Pembatalan</span>
                              </button>
                              <button
                                onClick={() => openStatusModal(order)}
                                className="w-full sm:w-auto px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                <span>Edit Detail Status</span>
                              </button>
                            </div>
                          </div>
                        ) : order.status === 'Dibatalkan' ? (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-semibold flex items-center justify-between gap-3 w-full">
                            <div>
                              <span className="font-extrabold text-red-900 mr-2">🔒 Non-Aktif (Dibatalkan):</span>
                              <span>{order.keterangan || 'Pesanan telah dibatalkan.'}</span>
                            </div>
                            <button
                              onClick={() => openStatusModal(order)}
                              className="px-2.5 py-1 bg-white border border-red-300 hover:bg-red-100 text-red-700 rounded-lg text-xs font-bold transition-colors shrink-0 shadow-sm"
                            >
                              Edit Catatan / Status
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, 'Proses', 'Pesanan telah diterima dan sedang diproses')}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                            >
                              &rarr; Proses
                            </button>
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, 'Menyiapkan Pesanan', 'Admin sedang menyiapkan barang pesanan Anda')}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                            >
                              &rarr; Menyiapkan
                            </button>
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, 'Pengiriman', 'Pesanan sedang dalam proses pengiriman')}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                            >
                              &rarr; Pengiriman
                            </button>
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, 'Siap Diambil', 'Pesanan sudah siap diambil di lokasi Koperasi / PT. Siemens Indonesia')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                            >
                              &rarr; Siap Diambil
                            </button>
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, 'Selesai', 'Pesanan telah selesai diserahkan ke karyawan')}
                              className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                            >
                              &rarr; Selesai
                            </button>
                            <button
                              onClick={() => {
                                setSelectedOrderForStatus(order);
                                setNewStatusValue('Dibatalkan');
                                setNewKeteranganValue('Dibatalkan oleh Admin.');
                              }}
                              className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            >
                              Batalkan
                            </button>
                            <button
                              onClick={() => openStatusModal(order)}
                              className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                            >
                              Edit Custom + Catatan
                            </button>
                          </div>
                        )}
                      </div>

                      {order.keterangan && (
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 max-w-md w-full md:w-auto">
                          <span className="font-bold text-teal-800">Catatan/Instruksi Admin:</span> {order.keterangan}
                        </div>
                      )}
                    </div>

                    {/* Items Table */}
                    <div className="p-4 sm:p-6">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Detail Barang Dipesan ({order.items.length} jenis)</p>
                      <div className="divide-y divide-slate-100">
                        {order.items.map((item) => (
                          <div key={item.id} className="py-2.5 flex justify-between items-center text-xs">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold shrink-0">
                                {item.quantity}x
                              </div>
                              <div>
                                <p className="font-bold text-slate-800">{item.product?.nama_barang || 'Produk Dihapus'}</p>
                                <p className="text-[10px] text-slate-400">Harga: Rp {item.price.toLocaleString('id-ID')}</p>
                              </div>
                            </div>
                            <span className="font-bold text-slate-900">
                              Rp {(item.quantity * item.price).toLocaleString('id-ID')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Professional Thermal Receipt Design (Print Only) */}
                    {printingOrderId === order.id && createPortal(
                      <div className="print-section text-black bg-white" style={{ fontFamily: 'monospace', display: 'flex', justifyContent: 'center', paddingTop: '20px' }}>
                        <div className="no-print-border" style={{ width: '100%', maxWidth: '18cm', padding: '0 1.5cm' }}>
                          <div className="text-center mb-6">
                            <h2 className="font-extrabold text-xl mb-1">BELANJAIN SAZA DI KOKSI</h2>
                            <p className="text-xs font-bold">Koperasi Karyawan Siemens Indonesia (KOKSI)</p>
                            <p className="text-xs">PT. Siemens Indonesia</p>
                            <div className="border-b-2 border-dashed border-black my-4"></div>
                          </div>
                          <div className="mb-4 text-xs leading-tight space-y-1">
                            <div className="flex"><span className="w-16">No Order</span><span className="mr-2">:</span> <span className="font-bold">#{order.id}</span></div>
                            <div className="flex"><span className="w-16">Tanggal</span><span className="mr-2">:</span> <span>{format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm', { locale: idLocale })}</span></div>
                            <div className="flex"><span className="w-16">Pemesan</span><span className="mr-2">:</span> <span className="font-bold">{order.user?.nama || '-'}</span></div>
                            <div className="flex"><span className="w-16">Dept</span><span className="mr-2">:</span> <span>{order.user?.departemen || '-'}</span></div>
                            <div className="flex"><span className="w-16">No. HP</span><span className="mr-2">:</span> <span>{order.user?.no_hp || '-'}</span></div>
                          </div>
                          <div className="border-b-2 border-dashed border-black my-4"></div>
                          <div className="mb-4">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-black">
                                  <th className="text-left py-1.5 w-7/12">Item</th>
                                  <th className="text-center py-1.5 w-2/12">Qty</th>
                                  <th className="text-right py-1.5 w-3/12">Total</th>
                                </tr>
                              </thead>
                              <tbody className="align-top">
                                {order.items.map((item, idx) => (
                                  <tr key={idx} className="border-b border-dashed border-gray-300">
                                    <td className="py-2.5 pr-2">{item.product?.nama_barang} <br /><span className="text-[10px] text-gray-500">@ Rp {item.price.toLocaleString('id-ID')}</span></td>
                                    <td className="text-center py-2.5">{item.quantity}</td>
                                    <td className="text-right py-2.5">{(item.price * item.quantity).toLocaleString('id-ID')}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {(() => {
                            const itemSum = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                            const handlingFee = 2000;
                            const computedTotal = itemSum + handlingFee;
                            return (
                              <div className="mt-4 text-xs">
                                <div className="flex justify-between mb-1">
                                  <span>Subtotal</span>
                                  <span>Rp {itemSum.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between mb-2">
                                  <span>Biaya Penanganan</span>
                                  <span>Rp {handlingFee.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="border-b-2 border-dashed border-black my-2"></div>
                                <div className="flex justify-between font-extrabold text-sm py-2">
                                  <span>TOTAL PEMBAYARAN</span>
                                  <span>Rp {computedTotal.toLocaleString('id-ID')}</span>
                                </div>
                              </div>
                            );
                          })()}

                          <div className="border-b-2 border-dashed border-black my-2"></div>
                          <div className="text-center text-[10px] mt-4 italic text-gray-800 space-y-1.5">
                            <p className="font-bold">Terima kasih telah berbelanja di KOKSI</p>
                            <p>Barang yang sudah dibeli tidak dapat ditukar/dikembalikan.</p>
                            <p>Cut Off Pembayaran tanggal 10 setiap bulannya.</p>
                          </div>
                          
                          {/* Signature Section (Hidden for now as requested) */}
                          {/* 
                          <div className="flex justify-between mt-10 mb-6 px-2 text-[11px] font-semibold">
                            <div className="text-center">
                              <p className="mb-12">Penerima,</p>
                              <p className="underline underline-offset-4">{order.user?.nama || '........................'}</p>
                            </div>
                            <div className="text-center">
                              <p className="mb-12">Hormat Kami,</p>
                              <p className="underline underline-offset-4">Admin KOKSI</p>
                            </div>
                          </div>
                          */}

                          <div className="text-center mt-6 text-[9px] uppercase">** BUKTI PEMBAYARAN SAH **</div>
                        </div>
                      </div>,
                      document.body
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ANALISIS & TREN PENJUALAN (RECHARTS) */}
        {activeTab === 'analytics' && (
          <div className="flex flex-col flex-1 space-y-4">
            <SalesTrendChart orders={orders} />
          </div>
        )}

        {/* TAB 3: DATA PRODUK */}
        {activeTab === 'products' && (
          <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Data Produk ({products.length})</h2>
                <p className="text-xs text-slate-500">Kelola katalog produk, kategori, harga, dan stok barang BelanjaIn Saza</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={(e) => {
                    handleFileUpload(e);
                    setIsImportModalOpen(false);
                  }}
                />

                {/* 1. IMPORT DATA EXCEL */}
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  title="Import Data Produk Excel (Upload & Template)"
                  aria-label="Import Data Produk Excel"
                  className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors font-bold text-xs tracking-wide rounded-full shadow-xs cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-teal-600 shrink-0" />
                  <span className="text-xs">Import Data</span>
                </button>

                {/* 2. EXPORT DATA EXCEL (FILTERED) */}
                <button
                  onClick={() => setIsExportModalOpen(true)}
                  title="Export Laporan Excel dengan Filter (Bulan, Tahun, PT, Status)"
                  aria-label="Export Laporan Excel dengan Filter"
                  className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors font-bold text-xs tracking-wide rounded-full shadow-xs cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-teal-600 shrink-0" />
                  <span className="text-xs">Export Data</span>
                </button>

                {/* TAMBAH PRODUK MANUAL */}
                <button
                  onClick={openAddModal}
                  title="Tambah Produk Baru Manual"
                  aria-label="Tambah Produk Baru"
                  className="flex items-center space-x-1.5 px-4 py-2 bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-sm font-bold text-xs tracking-wide rounded-full cursor-pointer"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span className="text-xs">Tambah</span>
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs mb-3 flex flex-wrap items-center gap-2.5">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama produk..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Category Filter */}
              <div className="w-full sm:w-auto">
                <select
                  value={productCategoryFilter}
                  onChange={(e) => {
                    setProductCategoryFilter(e.target.value);
                    setProductSubCategoryFilter('Semua');
                  }}
                  className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Semua">Semua Kategori ({dynamicCategories.length})</option>
                  {dynamicCategories.map((cat) => (
                    <option key={cat.name} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Sub-Category Filter */}
              {productCategoryFilter !== 'Semua' && (
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Filter Sub Kategori</label>
                  <select
                    value={productSubCategoryFilter}
                    onChange={(e) => setProductSubCategoryFilter(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-teal-500 transition-all shadow-sm"
                    disabled={productCategoryFilter === 'Semua'}
                  >
                    <option value="Semua">Semua Sub Kategori</option>
                    {productCategoryFilter !== 'Semua' && (
                      dynamicCategories.find(c => c.name === productCategoryFilter)?.subCategories.map((subName) => (
                        <option key={subName} value={subName}>{subName}</option>
                      ))
                    )}
                  </select>
                </div>
              )}

              {(productSearch || productCategoryFilter !== 'Semua' || productSubCategoryFilter !== 'Semua') && (
                <button
                  onClick={() => {
                    setProductSearch('');
                    setProductCategoryFilter('Semua');
                    setProductSubCategoryFilter('Semua');
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <FilterX className="w-3.5 h-3.5" />
                  <span>Reset Filter</span>
                </button>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 flex-1 overflow-hidden flex flex-col shadow-xs">
              {/* 1. Mobile Cards View (< md): Pas di layar HP, Tanpa Perlu Geser/Swipe */}
              <div className="block md:hidden divide-y divide-slate-100 overflow-y-auto flex-1">
                {products
                  .filter((p) => {
                    const matchCat = productCategoryFilter === 'Semua' || p.kategori === productCategoryFilter;
                    const matchSub = productSubCategoryFilter === 'Semua' || p.sub_kategori === productSubCategoryFilter;
                    const matchQuery = !productSearch ||
                      p.nama_barang.toLowerCase().includes(productSearch.toLowerCase()) ||
                      p.kategori.toLowerCase().includes(productSearch.toLowerCase()) ||
                      (p.sub_kategori || '').toLowerCase().includes(productSearch.toLowerCase());
                    return matchCat && matchSub && matchQuery;
                  })
                  .map((p) => (
                    <div key={p.id} className="p-3.5 space-y-2.5 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-extrabold text-slate-900 text-sm leading-snug">{p.nama_barang}</h4>
                          <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                            <span className="inline-block px-2 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 rounded-md text-[10px] font-bold">
                              {p.kategori}
                            </span>
                            {p.sub_kategori && (
                              <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-[10px] font-medium">
                                {p.sub_kategori}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          {p.harga > 0 ? (
                            <p className="text-sm font-black text-teal-700">Rp {p.harga.toLocaleString('id-ID')}</p>
                          ) : (
                            <p className="text-sm font-black text-slate-400">-</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => openEditModal(p)}
                          className="flex items-center gap-1 text-slate-700 hover:text-teal-700 px-3 py-1.5 bg-slate-100 hover:bg-teal-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-teal-600" />
                          <span>Edit Produk</span>
                        </button>
                        <button
                          onClick={() => setDeleteProductConfirmModal({ id: p.id, nama: p.nama_barang })}
                          className="flex items-center gap-1 text-red-600 hover:text-red-700 px-3 py-1.5 bg-red-50 hover:bg-red-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-600" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  ))}
                {products.length === 0 && (
                  <div className="p-8 text-center text-slate-500 text-xs">Belum ada produk.</div>
                )}
              </div>

              {/* 2. Desktop Table View (>= md) */}
              <div className="hidden md:block overflow-y-auto flex-1">
                <table className="min-w-full divide-y divide-slate-100 text-left">
                  <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 z-10">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Nama Barang</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Kategori</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Sub-Kategori</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Harga</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {products
                      .filter((p) => {
                        const matchCat = productCategoryFilter === 'Semua' || p.kategori === productCategoryFilter;
                        const matchSub = productSubCategoryFilter === 'Semua' || p.sub_kategori === productSubCategoryFilter;
                        const matchQuery = !productSearch ||
                          p.nama_barang.toLowerCase().includes(productSearch.toLowerCase()) ||
                          p.kategori.toLowerCase().includes(productSearch.toLowerCase()) ||
                          (p.sub_kategori || '').toLowerCase().includes(productSearch.toLowerCase());
                        return matchCat && matchSub && matchQuery;
                      })
                      .map((p) => (
                        <tr key={p.id} className="hover:bg-teal-50/30 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-semibold text-slate-800">{p.nama_barang}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-block px-2.5 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-lg text-xs font-bold">
                              {p.kategori}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium">
                              {p.sub_kategori || '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-teal-700 text-right">
                            {p.harga > 0 ? `Rp ${p.harga.toLocaleString('id-ID')}` : <span className="text-slate-400">-</span>}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex justify-center space-x-3">
                              <button onClick={() => openEditModal(p)} className="text-slate-400 hover:text-teal-600 p-2 bg-slate-50 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer" title="Edit Produk">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => setDeleteProductConfirmModal({ id: p.id, nama: p.nama_barang })} className="text-slate-400 hover:text-red-600 p-2 bg-slate-50 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Hapus Produk">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    {products.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-slate-500">Belum ada produk.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* TAB 3: DAFTAR PENGGUNA */}
        {activeTab === 'users' && (
          <div className="flex flex-col flex-1 overflow-hidden space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
              <h2 className="text-xl font-bold text-slate-900">Daftar Karyawan / Pengguna</h2>
              <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
                <select
                  value={ptFilter}
                  onChange={(e) => setPtFilter(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
                >
                  <option value="Semua">Semua Perusahaan (PT)</option>
                  {Array.from(new Set(users.map(u => u.pt).filter(Boolean))).map((ptName: any) => (
                    <option key={ptName} value={ptName}>{ptName}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Cari Nama / No HP / Dept..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm w-full sm:w-56"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 flex-1 overflow-hidden flex flex-col shadow-xs">
              {/* 1. Mobile Cards View (< md): Pas di layar HP, Tanpa Perlu Geser/Swipe */}
              <div className="block md:hidden divide-y divide-slate-100 overflow-y-auto flex-1">
                {users
                  .filter(u => {
                    const matchPt = ptFilter === 'Semua' || (u.pt || '').toLowerCase() === ptFilter.toLowerCase();
                    const query = userSearch.toLowerCase();
                    const matchSearch = !query ||
                      (u.nama || '').toLowerCase().includes(query) ||
                      (u.no_hp || '').toLowerCase().includes(query) ||
                      (u.pt || '').toLowerCase().includes(query) ||
                      (u.departemen || '').toLowerCase().includes(query);
                    return matchPt && matchSearch;
                  })
                  .map((u) => (
                    <div key={u.id} className="p-3.5 space-y-2.5 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-extrabold text-slate-900 text-sm leading-snug">{u.nama}</h4>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">{u.no_hp}</p>
                          <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                            <span className="inline-block px-2 py-0.5 bg-teal-50 text-teal-800 font-bold text-[10px] rounded-md border border-teal-100">
                              {u.pt}
                            </span>
                            {u.departemen && (
                              <span className="text-[10px] text-slate-500 font-medium">
                                • {u.departemen}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border ${u.role === 'admin'
                            ? 'bg-amber-100 text-amber-900 border-amber-200'
                            : u.role === 'it'
                              ? 'bg-purple-100 text-purple-900 border-purple-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                            {u.role || 'user'}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                        {/* Quick Role Switcher */}
                        <div className="flex items-center justify-between gap-1 flex-wrap">
                          <span className="text-[10px] text-slate-400 font-bold">Ubah Role:</span>
                          <div className="flex items-center gap-1">
                            {(['user', 'admin', 'it'] as const).map((r) => (
                              <button
                                key={r}
                                type="button"
                                disabled={updatingRoleId === u.id || (u.role || 'user') === r}
                                onClick={() => handleRoleChange(u.id, r)}
                                className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase transition-all border cursor-pointer ${(u.role || 'user') === r
                                  ? 'bg-slate-900 text-white border-slate-800 shadow-xs'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                  }`}
                              >
                                {r}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditUserModal(u)}
                            className="px-2.5 py-1 text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3 text-teal-600" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => openResetPasswordModal(u)}
                            className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Key className="w-3 h-3 text-slate-600" />
                            <span>Reset PW</span>
                          </button>
                          <button
                            onClick={() => openDeleteUserModal(u)}
                            className="px-2.5 py-1 text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3 text-red-600" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                {users.length === 0 && (
                  <div className="p-8 text-center text-slate-500 text-xs">Belum ada pengguna.</div>
                )}
              </div>

              {/* 2. Desktop Table View (>= md) */}
              <div className="hidden md:block overflow-y-auto flex-1">
                <table className="min-w-full divide-y divide-slate-100 text-left">
                  <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 z-10">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Nama / No HP</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Perusahaan (PT)</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Role</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {users
                      .filter(u => {
                        const matchPt = ptFilter === 'Semua' || (u.pt || '').toLowerCase() === ptFilter.toLowerCase();
                        const query = userSearch.toLowerCase();
                        const matchSearch = !query ||
                          (u.nama || '').toLowerCase().includes(query) ||
                          (u.no_hp || '').toLowerCase().includes(query) ||
                          (u.pt || '').toLowerCase().includes(query) ||
                          (u.departemen || '').toLowerCase().includes(query);
                        return matchPt && matchSearch;
                      })
                      .map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-semibold text-slate-800">{u.nama}</p>
                            <p className="text-xs text-slate-500">{u.no_hp}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-block px-2.5 py-0.5 bg-teal-50 text-teal-800 font-bold text-xs rounded-full border border-teal-100 mb-0.5">
                              {u.pt}
                            </span>
                            <p className="text-xs text-slate-500">{u.departemen}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1.5">
                              <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg border inline-block w-fit ${u.role === 'admin'
                                ? 'bg-amber-100 text-amber-900 border-amber-200 font-black'
                                : u.role === 'it'
                                  ? 'bg-purple-100 text-purple-900 border-purple-200 font-black'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                                }`}>
                                {u.role || 'user'}
                              </span>

                              <div className="flex items-center gap-1">
                                {(['user', 'admin', 'it'] as const).map((r) => (
                                  <button
                                    key={r}
                                    type="button"
                                    disabled={updatingRoleId === u.id || (u.role || 'user') === r}
                                    onClick={() => handleRoleChange(u.id, r)}
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase transition-all border cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${(u.role || 'user') === r
                                      ? 'bg-slate-900 text-white border-slate-800 shadow-xs'
                                      : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                                      }`}
                                    title={`Ubah role ke ${r.toUpperCase()}`}
                                  >
                                    {updatingRoleId === u.id ? '...' : r}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2 flex-wrap">
                              <button
                                onClick={() => openEditUserModal(u)}
                                title="Edit Profil Pengguna Ini"
                                className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-xl transition-all border border-teal-200 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                                <span>Edit Profil</span>
                              </button>

                              <button
                                onClick={() => openResetPasswordModal(u)}
                                title="Reset Password Pengguna"
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all border border-slate-200/80 hover:border-slate-300 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                              >
                                <Key className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                                <span>Reset Password</span>
                              </button>

                              <button
                                onClick={() => openDeleteUserModal(u)}
                                title="Hapus Akun Pengguna (Sertakan Alasan)"
                                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 text-xs font-bold rounded-xl transition-all border border-red-200/80 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-600 shrink-0" />
                                <span>Hapus Akun</span>
                              </button>
                            </div>
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
          </div>
        )}

      </main>

      {/* MODAL EDIT STATUS ORDER */}
      {selectedOrderForStatus && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Update Status Pesanan #{selectedOrderForStatus.id}</h3>
                <p className="text-[10px] text-teal-400 font-medium">{selectedOrderForStatus.user?.nama} ({selectedOrderForStatus.user?.pt})</p>
              </div>
              <button
                onClick={() => setSelectedOrderForStatus(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Pilih Tahap Status</label>
                <select
                  value={newStatusValue}
                  onChange={(e) => setNewStatusValue(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Proses">1. Proses</option>
                  <option value="Menyiapkan Pesanan">2. Menyiapkan Pesanan</option>
                  <option value="Pengiriman">3. Pengiriman</option>
                  <option value="Siap Diambil">4. Siap Diambil</option>
                  <option value="Selesai">5. Selesai</option>
                  <option value="Pengajuan Pembatalan">⚠️ Pengajuan Pembatalan (Konfirmasi Admin)</option>
                  <option value="Dibatalkan">Dibatalkan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Catatan / Instruksi untuk Karyawan
                </label>
                <textarea
                  rows={3}
                  placeholder="Contoh: Silakan di ambil di Koperasi PT. Siemens Indonesia / BelanjaIn Saza jam 12:00 WIB"
                  value={newKeteranganValue}
                  onChange={(e) => setNewKeteranganValue(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 placeholder-slate-400"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForStatus(null)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={updatingStatus}
                  onClick={() => handleUpdateOrderStatus(selectedOrderForStatus.id, newStatusValue, newKeteranganValue)}
                  className="px-5 py-2.5 bg-teal-600 text-white text-xs font-bold rounded-xl hover:bg-teal-700 shadow-sm"
                >
                  {updatingStatus ? 'Menyimpan...' : 'Simpan Status'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CRUD PRODUCT */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900">
                {editingProduct ? 'Edit Produk' : 'Tambah Produk'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Nama Barang</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pocari Sweat 500ml"
                  value={formData.nama_barang}
                  onChange={(e) => {
                    const newName = e.target.value;
                    let newCat = formData.kategori;
                    let newSub = formData.sub_kategori;

                    const smartCat = smartCategorize(newName);
                    if (smartCat) {
                      newCat = smartCat.kategori;
                      newSub = smartCat.sub_kategori;
                    }

                    setFormData({
                      ...formData,
                      nama_barang: newName,
                      kategori: newCat,
                      sub_kategori: newSub
                    });
                  }}
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent sm:text-sm font-medium text-slate-800 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Kategori Utama</label>
                <input
                  type="text"
                  list="kategori-options"
                  required
                  placeholder="Contoh: F&B"
                  value={formData.kategori}
                  onChange={(e) => {
                    const newCat = e.target.value;
                    const availableSubs = dynamicCategories.find(c => c.name === newCat)?.subCategories || [];
                    setFormData({
                      ...formData,
                      kategori: newCat,
                      sub_kategori: availableSubs[0] || formData.sub_kategori
                    });
                  }}
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 sm:text-sm font-bold text-slate-800 transition-colors"
                />
                <datalist id="kategori-options">
                  {dynamicCategories.map((cat) => (
                    <option key={cat.name} value={cat.name} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Sub-Kategori</label>
                <input
                  type="text"
                  list="sub-kategori-options"
                  placeholder="Opsional"
                  value={formData.sub_kategori}
                  onChange={(e) => setFormData({ ...formData, sub_kategori: e.target.value })}
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 sm:text-sm font-semibold text-slate-800 transition-colors"
                />
                <datalist id="sub-kategori-options">
                  {dynamicCategories.find(c => c.name === formData.kategori)?.subCategories.map((subName) => (
                    <option key={subName} value={subName} />
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Harga (Rp)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.harga}
                    onChange={(e) => setFormData({ ...formData, harga: parseInt(e.target.value) || 0 })}
                    className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent sm:text-sm font-medium text-slate-800 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Stok</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stok}
                    onChange={(e) => setFormData({ ...formData, stok: parseInt(e.target.value) || 0 })}
                    className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent sm:text-sm font-medium text-slate-800 transition-colors"
                  />
                </div>
              </div>
              <div className="mt-8 flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-white border border-slate-200 shadow-sm text-xs font-bold uppercase tracking-widest rounded-xl text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-600 shadow-sm text-xs font-bold uppercase tracking-widest rounded-xl text-white hover:bg-teal-700 transition-colors cursor-pointer"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL IMPORT DATA PRODUK EXCEL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center font-bold shadow-sm">
                  <Upload className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Import Data Produk</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Upload file Excel atau unduh contoh template</p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              {/* Unduh Template */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                <p className="text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-teal-600" />
                  <span>1. Unduh Format Template Excel</span>
                </p>
                <p className="text-[11px] text-slate-500 mb-3">
                  Gunakan template ini untuk mengisi daftar nama barang, kategori, harga, dan stok produk baru.
                </p>
                <button
                  onClick={handleDownloadTemplate}
                  className="w-full py-2.5 px-3 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <Download className="w-4 h-4 text-teal-600" />
                  <span>Unduh File Template (.xlsx)</span>
                </button>
              </div>

              {/* Format yang Diterima */}
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
                <p className="text-xs font-bold text-amber-900 mb-2 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Format yang Diterima: KOKSI Supplier</span>
                </p>
                <p className="text-[11px] text-amber-800 mb-2">
                  Sistem <strong>hanya menerima</strong> format Excel dari supplier KOKSI. Kolom yang diperlukan:
                </p>
                <div className="grid grid-cols-1 gap-1 mb-2">
                  {[
                    ['Kategori / Kategori Minuman', 'Sub-kategori produk (misal: Air Mineral)'],
                    ['Nama Produk & Gramasi', 'Nama lengkap produk'],
                    ['Harga Jual ke Anggota', 'Harga yang ditampilkan ke member ✓'],
                  ].map(([col, desc]) => (
                    <div key={col} className="flex items-start gap-2">
                      <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span className="text-[11px] text-amber-900"><strong>{col}</strong> — {desc}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-1 p-2 bg-amber-100 rounded-xl">
                  <p className="text-[10px] text-amber-700 font-semibold">⚠ Kolom &quot;Harga Dasar&quot; dan &quot;Harga Jual ke KOKSI&quot; diabaikan. Hanya &quot;Harga Jual ke Anggota&quot; yang dipakai.</p>
                </div>
              </div>

              {/* Upload File */}
              <div className="p-4 bg-teal-50/60 rounded-2xl border border-teal-100">
                <p className="text-xs font-bold text-teal-950 mb-1 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-teal-700" />
                  <span>Upload File Excel Supplier</span>
                </p>
                <p className="text-[11px] text-teal-800/80 mb-3">
                  Pilih file Excel format KOKSI supplier untuk mengimpor produk ke database.
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isCleaningUpCategories}
                  className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-white" />
                  <span>Pilih File Excel & Import</span>
                </button>
              </div>

              {/* Cleanup Section */}
              <div className="p-4 bg-orange-50/60 rounded-2xl border border-orange-100">
                <p className="text-xs font-bold text-orange-950 mb-1 flex items-center gap-1.5">
                  <RefreshCw className={`w-4 h-4 text-orange-600 ${isCleaningUpCategories ? 'animate-spin' : ''}`} />
                  <span>3. Rapikan Kategori (Otomatis/Manual)</span>
                </p>
                <p className="text-[11px] text-orange-800/80 mb-3">
                  Merapikan data kategori produk lama yang berantakan menggunakan sistem cerdas (Smart Categorizer). Otomatis berjalan setelah upload.
                </p>

                {isCleaningUpCategories ? (
                  <div className="space-y-2">
                    <div className="w-full bg-orange-200/50 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${cleanupProgress.total > 0 ? Math.round((cleanupProgress.current / cleanupProgress.total) * 100) : 0}%` }}
                      ></div>
                    </div>
                    <p className="text-[10px] text-orange-700 text-center font-medium">
                      {cleanupProgress.current > 0 ? `Memproses ${cleanupProgress.current} dari ${cleanupProgress.total} produk...` : 'Menganalisis produk...'}
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={handleCleanupCategories}
                    className="w-full py-2.5 px-4 bg-orange-100 hover:bg-orange-200 active:bg-orange-300 text-orange-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Jalankan Manual Sekarang</span>
                  </button>
                )}

                {cleanupMessage && !isCleaningUpCategories && (
                  <div className={`mt-3 p-2 rounded-lg text-[10px] font-medium border ${cleanupMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    cleanupMessage.type === 'error' ? 'bg-red-50 text-red-700 border-red-100' :
                      'bg-blue-50 text-blue-700 border-blue-100'
                    }`}>
                    {cleanupMessage.text}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsImportModalOpen(false)}
                disabled={isCleaningUpCategories}
                className="w-full py-2.5 bg-slate-100 disabled:opacity-50 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TARIKAN DATA TRANSAKSI BULANAN EXCEL */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center font-bold shadow-sm">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                    Tarikan Data Transaksi Bulanan
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">Export Excel Laporan BelanjaIn Saza PT. Siemens Indonesia</p>
                </div>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-xs text-teal-800 font-medium">
                <strong className="block text-teal-900 mb-1">Jadwal Tarikan Data:</strong>
                Data transaksi wajib ditarik dalam format Excel setiap hari <strong>Rabu</strong> (setelah periode pemesanan hari Senin s/d Selasa ditutup).
              </div>

              {/* Select Month and Year */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-teal-600" />
                    <span>Bulan Tarikan</span>
                  </label>
                  <select
                    value={exportMonth}
                    onChange={(e) => {
                      setExportMonth(parseInt(e.target.value));
                      setExportRabu('Semua'); // Reset rabu when month changes
                    }}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value={0}>Semua Bulan (Tahun Penuh)</option>
                    {MONTH_NAMES.map((name, idx) => (
                      <option key={idx + 1} value={idx + 1}>{name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Tahun
                  </label>
                  <select
                    value={exportYear}
                    onChange={(e) => {
                      setExportYear(parseInt(e.target.value));
                      setExportRabu('Semua'); // Reset rabu when year changes
                    }}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value={2026}>2026</option>
                    <option value={2025}>2025</option>
                    <option value={2024}>2024</option>
                  </select>
                </div>
              </div>

              {/* Filter Periode Rabu */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-teal-600" />
                  <span>Pilihan Hari Rabu (Periode Tarikan)</span>
                </label>
                <select
                  value={exportRabu}
                  onChange={(e) => setExportRabu(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  disabled={exportMonth === 0 || exportYear === 0}
                >
                  <option value="Semua">Semua Periode (Satu Bulan Penuh)</option>
                  {getWednesdaysInMonth(exportMonth, exportYear).map((wedDate, idx) => {
                    const d = wedDate.getDate();
                    const m = wedDate.getMonth();
                    const y = wedDate.getFullYear();

                    const startD = new Date(wedDate);
                    startD.setDate(startD.getDate() - 7);

                    const endD = new Date(wedDate);
                    endD.setDate(endD.getDate() - 1);

                    const label = `Rabu, ${d} ${MONTH_NAMES[m]} ${y} (Periode: ${startD.getDate()} ${MONTH_NAMES[startD.getMonth()]} - ${endD.getDate()} ${MONTH_NAMES[endD.getMonth()]})`;

                    return (
                      <option key={idx} value={wedDate.toISOString()}>
                        {label}
                      </option>
                    );
                  })}
                </select>
                {(exportMonth === 0 || exportYear === 0) && (
                  <p className="text-[10px] text-slate-400 mt-1">Pilih bulan & tahun spesifik untuk melihat opsi hari Rabu.</p>
                )}
              </div>

              {/* Filter PT & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-teal-600" />
                    <span>Perusahaan (PT)</span>
                  </label>
                  <select
                    value={exportPtFilter}
                    onChange={(e) => setExportPtFilter(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Semua">Semua Perusahaan / PT</option>
                    {Array.from(new Set(orders.map(o => o.user?.pt).filter(Boolean))).map((ptName: any) => (
                      <option key={ptName} value={ptName}>{ptName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Status Pesanan
                  </label>
                  <select
                    value={exportStatusFilter}
                    onChange={(e) => setExportStatusFilter(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Semua">Semua Status</option>
                    <option value="Proses">Proses</option>
                    <option value="Menyiapkan Pesanan">Menyiapkan Pesanan</option>
                    <option value="Pengiriman">Pengiriman</option>
                    <option value="Siap Diambil">Siap Diambil</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Dibatalkan">Dibatalkan</option>
                  </select>
                </div>
              </div>

              {/* Preview Matching Badge */}
              {(() => {
                const previewCount = orders.filter(o => {
                  const d = new Date(o.createdAt);
                  const matchM = exportMonth === 0 || (d.getMonth() + 1) === exportMonth;
                  const matchY = exportYear === 0 || d.getFullYear() === exportYear;
                  const matchRabu = isDateInWednesdayPeriod(d, exportRabu);
                  const matchPt = exportPtFilter === 'Semua' || (o.user?.pt || '').toLowerCase() === exportPtFilter.toLowerCase();
                  const matchSt = exportStatusFilter === 'Semua' || (o.status || 'Menunggu Konfirmasi').toLowerCase() === exportStatusFilter.toLowerCase();
                  return matchM && matchY && matchRabu && matchPt && matchSt;
                }).length;

                return (
                  <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-2xl flex items-center justify-between text-xs text-teal-900 font-medium">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>Estimasi Data Ditemukan:</span>
                    </div>
                    <span className="font-extrabold px-2.5 py-1 bg-teal-600 text-white rounded-lg text-xs shadow-xs">
                      {previewCount} Transaksi
                    </span>
                  </div>
                );
              })()}

              {/* Highlights Specs Checklist */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 text-[11px] text-slate-600 space-y-1.5">
                <p className="font-extrabold text-slate-800 uppercase tracking-wider mb-1">Fitur Format Excel Professional BelanjaIn Saza:</p>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>Header Logo & Brand BelanjaIn Saza</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>Pewarnaan Kolom Slate Dark</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>Format Mata Uang Rupiah (Rp)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>Warna Status Pesanan & Auto Width</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>

              <button
                onClick={() => executeExportMonthlySales()}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-teal-600/20 flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-teal-200" />
                <span>Unduh File Excel Professional</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RESET PASSWORD PENGGUNA */}
      {resetPasswordUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100 text-amber-700 flex items-center justify-center font-bold shadow-sm">
                  <Key className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                    Reset Password Pengguna
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">Ubah kata sandi akun karyawan</p>
                </div>
              </div>
              <button
                onClick={() => setResetPasswordUser(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              {/* User Info Badge */}
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold text-slate-800">{resetPasswordUser.nama}</p>
                  <p className="text-[11px] text-slate-500 font-medium">No. HP: {resetPasswordUser.no_hp}</p>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 bg-teal-100 text-teal-800 rounded-lg">
                  ID #{resetPasswordUser.id}
                </span>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-teal-600" />
                  <span>Password Baru</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="Masukkan minimal 6 karakter..."
                    className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Minimal 6 karakter kombinasi huruf & angka.</p>
              </div>

              {/* Error Alert */}
              {resetPasswordError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{resetPasswordError}</span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setResetPasswordUser(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>

              <button
                onClick={handleConfirmResetPassword}
                disabled={isResettingPassword}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-teal-600/20 flex items-center gap-2 cursor-pointer"
              >
                {isResettingPassword ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4 text-teal-200" />
                    <span>Simpan Password Baru</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS AKUN PENGGUNA */}
      {deleteTargetUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center font-bold shadow-xs">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Konfirmasi Hapus Akun</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Penghapusan permanen dari sistem</p>
                </div>
              </div>
              <button
                onClick={() => setDeleteTargetUser(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              {/* User Details Badge */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold text-slate-900">{deleteTargetUser.nama}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-teal-50 text-teal-800 rounded border border-teal-100">
                    {deleteTargetUser.pt}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">No. HP: {deleteTargetUser.no_hp} | ID: #{deleteTargetUser.id}</p>
              </div>

              {/* Mandatory Reason Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alasan Penghapusan Akun <span className="text-rose-600">*</span>
                </label>
                <textarea
                  value={deleteReasonInput}
                  onChange={(e) => {
                    setDeleteReasonInput(e.target.value);
                    if (deleteUserError) setDeleteUserError('');
                  }}
                  rows={3}
                  placeholder="Contoh: Karyawan telah resign, Duplikasi data anggota, atau Permintaan pengguna..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white resize-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">Alasan wajib diisi untuk dicatat dalam Log Audit IT.</p>
              </div>

              {deleteUserError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{deleteUserError}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setDeleteTargetUser(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>

              <button
                onClick={handleConfirmDeleteUser}
                disabled={isDeletingUser || !deleteReasonInput.trim()}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-rose-600/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeletingUser ? 'Proses Hapus...' : 'Hapus Akun Permanen'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT PROFIL PENGGUNA (ADMIN ACCESS) */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center font-bold">
                  <Edit3 className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Edit Profil Pengguna #{editingUser.id}</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Perbarui profil, perusahaan, role, atau password untuk Sdr/i {editingUser.nama}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editUserNama}
                  onChange={(e) => setEditUserNama(e.target.value)}
                  placeholder="Masukkan Nama Lengkap"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Perusahaan (PT) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editUserPt}
                    onChange={(e) => setEditUserPt(e.target.value)}
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
                    value={editUserDepartemen}
                    onChange={(e) => setEditUserDepartemen(e.target.value)}
                    placeholder="Contoh: Produksi, Logistics, HR..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    No. HP / WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editUserNoHp}
                    onChange={(e) => setEditUserNoHp(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Hak Akses / Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editUserRole}
                    onChange={(e) => setEditUserRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white cursor-pointer"
                  >
                    <option value="user">User (Karyawan)</option>
                    <option value="admin">Admin (Portal BelanjaIn Saza)</option>
                    <option value="it">IT (Audit Log System)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Password Baru <span className="text-slate-400 font-normal">(Kosongkan jika tidak ingin mengubah)</span>
                </label>
                <input
                  type="password"
                  value={editUserPassword}
                  onChange={(e) => setEditUserPassword(e.target.value)}
                  placeholder="Masukkan password baru (minimal 6 karakter)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
              </div>

              {editUserError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-1.5">
                  <X className="w-4 h-4 shrink-0" />
                  <span>{editUserError}</span>
                </div>
              )}

              {editUserSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{editUserSuccess}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveUserProfile}
                disabled={isSavingUser}
                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-sm shadow-teal-600/30 flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingUser ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI PENGAJUAN PEMBATALAN (SETUJUI / TOLAK) */}
      {cancellationConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold ${cancellationConfirmModal.type === 'approve'
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-100 text-rose-700 border border-rose-200'
                  }`}>
                  {cancellationConfirmModal.type === 'approve' ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <X className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {cancellationConfirmModal.type === 'approve'
                      ? `Setujui Pembatalan #${cancellationConfirmModal.orderNumber}`
                      : `Tolak Pembatalan #${cancellationConfirmModal.orderNumber}`}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {cancellationConfirmModal.type === 'approve'
                      ? 'Pesanan ini akan diubah statusnya menjadi DIBATALKAN.'
                      : 'Pengajuan akan ditolak & pesanan dilanjutkan ke PROSES.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCancellationConfirmModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-extrabold text-slate-800 mb-1">
                  {cancellationConfirmModal.type === 'approve'
                    ? 'Catatan Admin untuk Karyawan (Opsional):'
                    : 'Alasan Penolakan untuk Karyawan:'}
                </label>
                <textarea
                  rows={3}
                  value={cancellationNoteInput}
                  onChange={(e) => setCancellationNoteInput(e.target.value)}
                  placeholder={
                    cancellationConfirmModal.type === 'approve'
                      ? 'Pembatalan Disetujui Admin.'
                      : 'Contoh: Pesanan telah disiapkan dan tidak dapat dibatalkan.'
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white resize-none"
                />
              </div>

              {cancellationActionError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-1.5">
                  <X className="w-4 h-4 shrink-0" />
                  <span>{cancellationActionError}</span>
                </div>
              )}

              {cancellationActionSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{cancellationActionSuccess}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => setCancellationConfirmModal(null)}
                disabled={isProcessingCancellation}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              {cancellationConfirmModal.type === 'approve' ? (
                <button
                  onClick={() => handleApproveCancellation(cancellationConfirmModal.orderId, cancellationNoteInput)}
                  disabled={isProcessingCancellation}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-sm shadow-emerald-600/30 flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isProcessingCancellation ? 'Memproses...' : 'Ya, Setujui & Batalkan'}</span>
                </button>
              ) : (
                <button
                  onClick={() => handleRejectCancellation(cancellationConfirmModal.orderId, cancellationNoteInput)}
                  disabled={isProcessingCancellation}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-sm shadow-rose-600/30 flex items-center justify-center gap-1.5"
                >
                  <X className="w-4 h-4" />
                  <span>{isProcessingCancellation ? 'Memproses...' : 'Ya, Tolak Pembatalan'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS PRODUK */}
      {deleteProductConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center font-bold shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Hapus Produk?</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Apakah Anda yakin ingin menghapus produk <strong className="text-slate-800">"{deleteProductConfirmModal.nama}"</strong>?
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => setDeleteProductConfirmModal(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteProductConfirmed}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-sm shadow-rose-600/30 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus Produk</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT PROFIL ADMIN */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center font-bold">
                  <Edit3 className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Edit Profil Admin</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Perbarui data profil administrator BelanjaIn Saza Anda</p>
                </div>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(false)}
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
                    placeholder="Contoh: Admin, IT, HR..."
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
                onClick={() => setIsProfileModalOpen(false)}
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
      {/* EDIT USER PROFILE MODAL (ADMIN) */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center font-bold">
                  <UserIcon className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Edit Profil Pengguna</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Perbarui profil dan akses role akun karyawan</p>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
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
                  value={editUserNama}
                  onChange={(e) => setEditUserNama(e.target.value)}
                  placeholder="Masukkan Nama Lengkap"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Perusahaan (PT) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editUserPt}
                    onChange={(e) => setEditUserPt(e.target.value)}
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
                    value={editUserDepartemen}
                    onChange={(e) => setEditUserDepartemen(e.target.value)}
                    placeholder="Contoh: Digital Industries"
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
                  value={editUserNoHp}
                  onChange={(e) => setEditUserNoHp(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Peran / Akses Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={editUserRole}
                  onChange={(e) => setEditUserRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white cursor-pointer"
                >
                  <option value="user">USER (Karyawan / Anggota)</option>
                  <option value="admin">ADMIN (Pengelola Koperasi)</option>
                  <option value="it">IT (Administrator Sistem / Developer)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Password Baru <span className="text-slate-400 font-normal">(Kosongkan jika tidak diubah)</span>
                </label>
                <input
                  type="password"
                  value={editUserPassword}
                  onChange={(e) => setEditUserPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
              </div>

              {editUserError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-1.5">
                  <X className="w-4 h-4 shrink-0" />
                  <span>{editUserError}</span>
                </div>
              )}

              {editUserSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{editUserSuccess}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveUserProfile}
                disabled={isSavingUser}
                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-sm shadow-teal-600/30 flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingUser ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL NOTIFIKASI HASIL IMPORT EXCEL ===================== */}
      {importResult && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Hasil Import Produk</h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {importResult.insertedCount} baru &nbsp;·&nbsp; {importResult.updatedCount} diperbarui &nbsp;·&nbsp; {importResult.rejectedCount} ditolak
                  </p>
                </div>
              </div>
              <button
                onClick={() => setImportResult(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Summary badges */}
            <div className="flex gap-3 px-6 py-3 bg-slate-50 border-b border-slate-100 shrink-0">
              <button
                onClick={() => setImportResultTab('inserted')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${importResultTab === 'inserted'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/30'
                  : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                  }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Produk Baru
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${importResultTab === 'inserted' ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                  {importResult.insertedCount}
                </span>
              </button>
              <button
                onClick={() => setImportResultTab('updated')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${importResultTab === 'updated'
                  ? 'bg-sky-600 text-white border-sky-600 shadow-sm shadow-sky-600/30'
                  : 'bg-white text-sky-700 border-sky-200 hover:bg-sky-50'
                  }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Diperbarui
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${importResultTab === 'updated' ? 'bg-sky-500 text-white' : 'bg-sky-100 text-sky-700'}`}>
                  {importResult.updatedCount}
                </span>
              </button>
              <button
                onClick={() => setImportResultTab('rejected')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${importResultTab === 'rejected'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-600/30'
                  : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
                  }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                Ditolak
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${importResultTab === 'rejected' ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-700'}`}>
                  {importResult.rejectedCount}
                </span>
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 px-6 py-4">

              {/* --- Tab: Produk Baru --- */}
              {importResultTab === 'inserted' && (
                importResult.inserted.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <Package className="w-10 h-10 mb-2 opacity-40" />
                    <p className="text-sm font-medium">Tidak ada produk baru yang ditambahkan.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-[11px] text-slate-500 font-semibold mb-2 uppercase tracking-wide">
                      {importResult.insertedCount} produk berhasil ditambahkan ke database
                    </p>
                    <div className="overflow-x-auto rounded-xl border border-emerald-100">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-emerald-50 text-emerald-800">
                            <th className="px-3 py-2 text-left font-bold">#</th>
                            <th className="px-3 py-2 text-left font-bold">Nama Barang</th>
                            <th className="px-3 py-2 text-left font-bold">Sub Kategori</th>
                            <th className="px-3 py-2 text-right font-bold">Harga</th>
                            <th className="px-3 py-2 text-right font-bold">Stok</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importResult.inserted.map((item, idx) => (
                            <tr key={idx} className={`border-t border-emerald-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-emerald-50/30'}`}>
                              <td className="px-3 py-2 text-slate-400 font-medium">{idx + 1}</td>
                              <td className="px-3 py-2 text-slate-800 font-semibold">{item.nama_barang}</td>
                              <td className="px-3 py-2 text-slate-500">{item.sub_kategori || <span className="text-slate-300 italic">—</span>}</td>
                              <td className="px-3 py-2 text-right text-slate-700 font-medium">Rp {(item.harga ?? 0).toLocaleString('id-ID')}</td>
                              <td className="px-3 py-2 text-right text-slate-600">{item.stok ?? 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              )}

              {/* --- Tab: Diperbarui --- */}
              {importResultTab === 'updated' && (
                importResult.updated.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <RefreshCw className="w-10 h-10 mb-2 opacity-40" />
                    <p className="text-sm font-medium">Tidak ada produk yang diperbarui.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-[11px] text-slate-500 font-semibold mb-2 uppercase tracking-wide">
                      {importResult.updatedCount} produk yang sudah ada diperbarui harga & stoknya
                    </p>
                    <div className="overflow-x-auto rounded-xl border border-sky-100">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-sky-50 text-sky-800">
                            <th className="px-3 py-2 text-left font-bold">#</th>
                            <th className="px-3 py-2 text-left font-bold">Nama Barang</th>
                            <th className="px-3 py-2 text-left font-bold">Sub Kategori</th>
                            <th className="px-3 py-2 text-right font-bold">Harga</th>
                            <th className="px-3 py-2 text-right font-bold">Stok</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importResult.updated.map((item, idx) => (
                            <tr key={idx} className={`border-t border-sky-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-sky-50/30'}`}>
                              <td className="px-3 py-2 text-slate-400 font-medium">{idx + 1}</td>
                              <td className="px-3 py-2 text-slate-800 font-semibold">{item.nama_barang}</td>
                              <td className="px-3 py-2 text-slate-500">{item.sub_kategori || <span className="text-slate-300 italic">—</span>}</td>
                              <td className="px-3 py-2 text-right text-slate-700 font-medium">Rp {(item.harga ?? 0).toLocaleString('id-ID')}</td>
                              <td className="px-3 py-2 text-right text-slate-600">{item.stok ?? 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              )}

              {/* --- Tab: Ditolak --- */}
              {importResultTab === 'rejected' && (
                importResult.rejected.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-emerald-500">
                    <CheckCircle className="w-10 h-10 mb-2" />
                    <p className="text-sm font-semibold text-slate-600">Tidak ada produk yang ditolak. Semua data valid!</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-[11px] text-slate-500 font-semibold mb-2 uppercase tracking-wide">
                      {importResult.rejectedCount} produk tidak dapat diimport — periksa dan perbaiki file Excel Anda
                    </p>
                    <div className="overflow-x-auto rounded-xl border border-rose-100">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-rose-50 text-rose-800">
                            <th className="px-3 py-2 text-left font-bold">#</th>
                            <th className="px-3 py-2 text-left font-bold">Nama Barang</th>
                            <th className="px-3 py-2 text-left font-bold">Alasan Ditolak</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importResult.rejected.map((item, idx) => (
                            <tr key={idx} className={`border-t border-rose-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-rose-50/30'}`}>
                              <td className="px-3 py-2 text-slate-400 font-medium">{idx + 1}</td>
                              <td className="px-3 py-2 text-slate-800 font-semibold align-top">{item.nama_barang}</td>
                              <td className="px-3 py-2 text-rose-700 align-top">
                                <span className="inline-flex items-start gap-1">
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500 mt-0.5 shrink-0" />
                                  {item.alasan}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Panduan perbaikan */}
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                      <p className="text-[11px] font-bold text-amber-800 mb-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Panduan Perbaikan
                      </p>
                      <ul className="text-[11px] text-amber-700 space-y-0.5 list-disc list-inside">
                        <li>Gunakan <strong>Format KOKSI Supplier</strong> dengan kolom <strong>Nama Produk &amp; Gramasi</strong> dan <strong>Harga Jual ke Anggota</strong></li>
                        <li>Pastikan Kategori sesuai: <em>Makanan &amp; Minuman Siap Saji (F&amp;B)</em> atau <em>Perawatan Diri &amp; Kesehatan (Personal Care)</em></li>
                        <li>Kolom <strong>Harga</strong> tidak boleh 0 atau kosong</li>
                        <li>Tidak boleh ada nama barang yang sama dalam satu file</li>
                      </ul>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 shrink-0">
              <button
                onClick={() => setImportResult(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
