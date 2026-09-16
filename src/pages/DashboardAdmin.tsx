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
import { Html5Qrcode } from 'html5-qrcode';
import XLSX from 'xlsx-js-style';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { SalesTrendChart } from '../components/SalesTrendChart';
import { CATEGORY_STRUCTURES } from '../data/categories';

interface Product {
  id: number;
  nama_barang: string;
  kategori: string;
  sub_kategori?: string | null;
  harga: number;
  stok: number;
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
  
  const [activeTab, setActiveTab] = useState<'orders' | 'analytics' | 'products' | 'users' | 'scan'>('orders');
  
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

  // Barcode Pickup State (Stored / Deactivated until requested)
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [isBarcodeFeatureActive, setIsBarcodeFeatureActive] = useState<boolean>(false);
  const [scannedBarcodeInput, setScannedBarcodeInput] = useState('');
  const [verifyingBarcode, setVerifyingBarcode] = useState(false);
  const [barcodeVerifyMessage, setBarcodeVerifyMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Monthly Export Excel Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
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

  // Demo Ordering Toggle
  const [isDemoOrderingEnabled, setIsDemoOrderingEnabled] = useState(
    localStorage.getItem('demo_ordering_enabled') === 'true'
  );

  const toggleDemoOrdering = () => {
    const newVal = !isDemoOrderingEnabled;
    setIsDemoOrderingEnabled(newVal);
    localStorage.setItem('demo_ordering_enabled', newVal.toString());
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

  useEffect(() => {
    localStorage.setItem('saza_barcode_feature_active', 'false');
  }, []);

  const toggleBarcodeFeature = (active: boolean) => {
    setIsBarcodeFeatureActive(active);
    localStorage.setItem('saza_barcode_feature_active', active ? 'true' : 'false');
  };

  const executeVerifyBarcode = async (codeToVerify?: string) => {
    const code = (codeToVerify || scannedBarcodeInput).trim();
    if (!code) {
      setBarcodeVerifyMessage({ type: 'error', text: 'Silakan ketik atau pilih kode pesanan terlebih dahulu (contoh: SAZA-PKP-1002).' });
      return;
    }

    setVerifyingBarcode(true);
    setBarcodeVerifyMessage(null);

    try {
      const res = await fetch('/api/orders/verify-barcode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ barcodeToken: code })
      });

      const data = await res.json();
      if (res.ok) {
        setBarcodeVerifyMessage({ type: 'success', text: data.message || `Verifikasi Barcode ${code} Berhasil! Status pesanan diubah ke Selesai.` });
        setScannedBarcodeInput('');
        fetchOrders();
      } else {
        setBarcodeVerifyMessage({ type: 'error', text: data.error || 'Gagal memverifikasi kode barcode.' });
      }
    } catch (err) {
      console.error(err);
      setBarcodeVerifyMessage({ type: 'error', text: 'Terjadi kesalahan koneksi saat memverifikasi barcode.' });
    } finally {
      setVerifyingBarcode(false);
    }
  };

  const handleVerifyBarcode = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    executeVerifyBarcode();
  };

  // Camera QR Code Scanner Effect
  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;
    let isStopped = false;

    if (isCameraActive) {
      // Small timeout to allow DOM container #admin-camera-reader to render
      const timer = setTimeout(() => {
        const element = document.getElementById('admin-camera-reader');
        if (!element) return;

        html5QrCode = new Html5Qrcode('admin-camera-reader');
        html5QrCode.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText) => {
            if (isStopped) return;
            setScannedBarcodeInput(decodedText);
            executeVerifyBarcode(decodedText);
            if (html5QrCode && html5QrCode.isScanning) {
              html5QrCode.stop().then(() => setIsCameraActive(false)).catch(() => setIsCameraActive(false));
            } else {
              setIsCameraActive(false);
            }
          },
          () => {
            // ignore frame read errors
          }
        ).catch((err) => {
          console.error('Camera scan start error:', err);
          setBarcodeVerifyMessage({ 
            type: 'error', 
            text: 'Kamera tidak dapat diakses. Pastikan izin kamera aktif, atau gunakan ketik/pilih kode manual di bawah.' 
          });
          setIsCameraActive(false);
        });
      }, 100);

      return () => {
        isStopped = true;
        clearTimeout(timer);
        if (html5QrCode && html5QrCode.isScanning) {
          html5QrCode.stop().catch((e) => console.error(e));
        }
      };
    }
  }, [isCameraActive]);

  // Product Form state
  const [formData, setFormData] = useState({
    nama_barang: '',
    kategori: dynamicCategories[0]?.name || 'Umum',
    sub_kategori: dynamicCategories[0]?.subCategories[0] || '',
    harga: 0,
    stok: 0
  });

  // Product Filter State
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
    const templateData = [
      { 
        'Nama Barang': 'Pocari Sweat 500ml', 
        'Kategori': 'Makanan & Minuman Siap Saji (F&B)', 
        'Sub Kategori': 'Minuman Dingin & Kemasan',
        'Satuan': 'Botol', 
        'Qty': 50, 
        'HARGA JUAL': 8000 
      },
      { 
        'Nama Barang': 'Beras Setra Ramos 5kg', 
        'Kategori': 'Makanan & Minuman Siap Saji (F&B)', 
        'Sub Kategori': 'Bahan Makanan (Sembako)',
        'Satuan': 'Karung', 
        'Qty': 40, 
        'HARGA JUAL': 75000 
      },
      { 
        'Nama Barang': 'Lifebuoy Sabun Cair 450ml', 
        'Kategori': 'Perawatan Diri & Kesehatan (Personal Care)', 
        'Sub Kategori': 'Perawatan Mandi & Rambut',
        'Satuan': 'Pouch', 
        'Qty': 30, 
        'HARGA JUAL': 24000 
      },
      { 
        'Nama Barang': 'Rinso Matic Front Load 1kg', 
        'Kategori': 'Kebutuhan Rumah Tangga (Household)', 
        'Sub Kategori': 'Pembersih Pakaian',
        'Satuan': 'Bungkus', 
        'Qty': 25, 
        'HARGA JUAL': 32000 
      },
      { 
        'Nama Barang': 'SilverQueen Almond 58g', 
        'Kategori': 'Rokok & Produk Kasir (Impulse Items)', 
        'Sub Kategori': 'Permen & Cokelat Kecil',
        'Satuan': 'Pcs', 
        'Qty': 60, 
        'HARGA JUAL': 16500 
      },
      { 
        'Nama Barang': 'Buku Tulis Sinar Dunia A5', 
        'Kategori': 'Non-Food & Perlengkapan Umum', 
        'Sub Kategori': 'Alat Tulis Kantor (ATK) Dasar',
        'Satuan': 'Pack', 
        'Qty': 20, 
        'HARGA JUAL': 45000 
      }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Produk');
    XLSX.writeFile(wb, 'Template_Import_Produk_BelanjaIn_Saza.xlsx');
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

        for (const wsname of wb.SheetNames) {
          const ws = wb.Sheets[wsname];
          const matrixRows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

          let currentCategory = CATEGORY_STRUCTURES[0].name;
          let currentSubCategory = CATEGORY_STRUCTURES[0].subCategories[0] || '';

        // Deteksi apakah formatnya adalah template KOKSI
        let isKoksiFormat = false;
        if (matrixRows && matrixRows.length > 0) {
          for (let r = 0; r < matrixRows.length; r++) { // Scan all rows, not just first 50
            const row = matrixRows[r];
            if (!Array.isArray(row)) continue;
            const rowStr = row.map(cell => String(cell || '').trim().toLowerCase());
            if (rowStr.some(cell => cell.includes('nama produk') || cell.includes('gramasi') || cell === 'nama produk & gramasi' || cell.includes('kategori perawatan'))) {
              isKoksiFormat = true;
              break;
            }
          }
        }

        if (isKoksiFormat) {
          let currentCategory = CATEGORY_STRUCTURES[0].name;
          let currentSubCategory = '';
          let idxNama = -1;
          let idxSubKat = -1;
          let idxHarga = -1;

          for (let r = 0; r < matrixRows.length; r++) {
            const row = matrixRows[r];
            if (!Array.isArray(row) || row.length === 0) continue;
            
            const rowStr = row.map(cell => String(cell || '').trim().toLowerCase());
            const nIdx = rowStr.findIndex(cell => cell.includes('nama produk') || cell.includes('nama barang'));
            
            // Is this a header row?
            if (nIdx !== -1) {
              idxNama = nIdx;
              idxSubKat = nIdx - 1;
              
              // Find Harga column
              let hIdx = rowStr.findIndex(cell => cell.includes('harga jual') || cell.includes('harga anggota'));
              if (hIdx === -1) hIdx = rowStr.findIndex(cell => cell === 'harga' || cell.includes('harga'));
              idxHarga = hIdx;
              
              // Extract Category from the header row's sub-cat column
              if (idxSubKat >= 0) {
                const catHeader = String(row[idxSubKat] || '').trim();
                if (catHeader.toLowerCase().includes('kategori')) {
                  currentCategory = catHeader.replace(/kategori\s+/i, '').trim();
                }
              }
              continue; // Skip the header row itself
            }
            
            // If we haven't found a header yet, skip
            if (idxNama === -1) continue;
            
            // Data row processing
            const productName = String(row[idxNama] || '').trim();
            
            // Stop processing if product name is something weird like total
            if (productName.toLowerCase().includes('total') || productName.toLowerCase().includes('daftar harga') || productName === 'nama produk & gramasi') {
              continue;
            }
            
            // Extract subcategory (remember, merged cells only have it on the first row)
            const subCatCell = idxSubKat >= 0 ? String(row[idxSubKat] || '').trim() : '';
            if (subCatCell) {
              // Only update if it's not a numbering (like "1", "2") and not empty
              if (!/^\d+$/.test(subCatCell) && subCatCell.toLowerCase() !== 'no') {
                currentSubCategory = subCatCell;
              }
            }
            
            // If product name is empty, it's not a product row
            if (!productName || productName.length < 2) continue;
            
            // Extract price
            const priceRaw = idxHarga !== -1 ? row[idxHarga] : undefined;
            // Parse price string safely
            const priceStr = String(priceRaw !== undefined && priceRaw !== null && String(priceRaw).trim() !== '-' ? priceRaw : '0').split(',')[0];
            const priceNum = parseInt(priceStr.replace(/[^0-9]/g, ''), 10) || 0;
            
            formattedProducts.push({
              nama_barang: productName,
              kategori: currentCategory || 'Lainnya',
              sub_kategori: currentSubCategory || '',
              harga: priceNum,
              stok: 0
            });
          }
        } else {
          let idxNama = -1;
          let idxHarga = -1;
          let idxQty = -1;
          let idxKat = -1;
          let idxSubKat = -1;

          if (matrixRows && matrixRows.length > 0) {
            for (let r = 0; r < matrixRows.length; r++) {
              const row = matrixRows[r];
              if (!Array.isArray(row)) continue;
  
              const rowStr = row.map(cell => String(cell || '').trim().toLowerCase());
              
              const nIdx = rowStr.findIndex(cell => 
                cell === 'nama barang' || cell === 'nama' || cell === 'barang' || cell === 'nama produk' || cell === 'item' || cell === 'produk'
              );
  
              if (nIdx !== -1) {
                idxNama = nIdx;
  
                idxHarga = rowStr.findIndex(cell => cell.includes('harga jual') || cell === 'harga' || cell === 'price' || cell.includes('harga barang'));
                if (idxHarga === -1) {
                  idxHarga = rowStr.findIndex(cell => cell.includes('harga') && !cell.includes('hpp') && !cell.includes('keuntungan'));
                }
  
                idxQty = rowStr.findIndex(cell => cell === 'qty' || cell === 'stok' || cell === 'stock' || cell === 'jumlah' || cell.includes('stok'));
                idxKat = rowStr.findIndex(cell => cell === 'kategori' || cell === 'category' || cell === 'jenis');
                idxSubKat = rowStr.findIndex(cell => cell === 'sub kategori' || cell === 'sub_kategori' || cell === 'sub category' || cell === 'subkategori' || cell.includes('sub kat'));
  
                for (let i = r + 1; i < matrixRows.length; i++) {
                  const itemRow = matrixRows[i];
                  if (!Array.isArray(itemRow) || itemRow.length === 0) continue;
  
                  const namaCell = String(itemRow[idxNama] || '').trim();
                  const hargaRaw = idxHarga !== -1 ? itemRow[idxHarga] : undefined;
                  const qtyRaw = idxQty !== -1 ? itemRow[idxQty] : undefined;
                  const katRaw = idxKat !== -1 ? itemRow[idxKat] : undefined;
                  const subKatRaw = idxSubKat !== -1 ? itemRow[idxSubKat] : undefined;
  
                  if (!namaCell) continue;
  
                  if (namaCell.toLowerCase().includes('daftar harga') || namaCell.toLowerCase().includes('total') || namaCell.toLowerCase() === 'nama barang') {
                    continue;
                  }
  
                  const hargaNum = parseInt(String(hargaRaw || 0).replace(/[^0-9]/g, ''), 10) || 0;
                  const qtyNum = parseInt(String(qtyRaw || 0).replace(/[^0-9]/g, ''), 10) || 0;
  
                  if (hargaNum === 0 && qtyNum === 0 && !katRaw) {
                    currentCategory = namaCell;
                    continue;
                  }
  
                  const parsedKategori = String(katRaw || currentCategory || 'Lainnya').trim();
                  const parsedSubKategori = String(subKatRaw || currentSubCategory || '').trim();
  
                  formattedProducts.push({
                    nama_barang: namaCell,
                    kategori: parsedKategori,
                    sub_kategori: parsedSubKategori,
                    harga: hargaNum,
                    stok: qtyNum
                  });
                }
                break;
              }
            }
          }
        }

        if (formattedProducts.length === 0) {
          const objectData = XLSX.utils.sheet_to_json(ws) as any[];
          if (objectData && objectData.length > 0) {
            objectData.forEach(item => {
              const nama = getRowValue(item, ['nama_barang', 'nama barang', 'nama', 'barang', 'nama produk', 'product name', 'item', 'produk']);
              const kategori = getRowValue(item, ['kategori', 'category', 'jenis', 'kat']) || CATEGORY_STRUCTURES[0].name;
              const subKategori = getRowValue(item, ['sub_kategori', 'sub kategori', 'sub category', 'subkategori', 'sub_kat', 'subkat']) || '';
              const hargaRaw = getRowValue(item, ['harga jual ke saza', 'harga jual', 'harga', 'harga barang', 'price']);
              const stokRaw = getRowValue(item, ['qty', 'stok', 'stock', 'jumlah', 'stok barang']);

              const hargaNum = parseInt(String(hargaRaw || 0).replace(/[^0-9]/g, ''), 10) || 0;
              const stokNum = parseInt(String(stokRaw || 0).replace(/[^0-9]/g, ''), 10) || 0;

              if (nama && String(nama).trim().length > 0) {
                const cleanKat = String(kategori).trim();
                const cleanSub = String(subKategori).trim() || '';

                formattedProducts.push({
                  nama_barang: String(nama).trim(),
                  kategori: cleanKat,
                  sub_kategori: cleanSub,
                  harga: hargaNum,
                  stok: stokNum
                });
              }
            });
          }
        }
        } // end of sheets loop

        if (formattedProducts.length === 0) {
          toast.warning('Tidak ditemukan data produk yang valid di Excel.');
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
          toast.success(resData.message || `Berhasil memproses ${formattedProducts.length} produk!`);
        } else {
          toast.error(`Gagal import produk: ${resData.error || 'Terjadi kesalahan pada server'}`);
        }
      } catch (err: any) {
        console.error(err);
        toast.error('Terjadi kesalahan saat membaca file Excel.');
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
      const r0 = ['BELANJAIN SAZA - PT. SIEMENS INDONESIA', '', '', '', '', '', '', '', '', ''];
      const r1 = ['LAPORAN REKAPITULASI DATA TRANSAKSI PENJUALAN', '', '', '', '', '', '', '', '', ''];
      const r2 = [`Periode: ${periodTitle}   |   Dicetak: ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: idLocale })} WIB`, '', '', '', '', '', '', '', '', ''];

      const r3 = [
        'TOTAL TRANSAKSI', '', '',
        'TOTAL ITEM TERJUAL', '', '',
        'TOTAL OMZET PENJUALAN', '', '', ''
      ];

      const r4 = [
        `${filteredOrders.length} Transaksi`, '', '',
        `${totalItemsCount.toLocaleString('id-ID')} Pcs`, '', '',
        totalRevenue, '', '', ''
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
              isFirstRowOfOrder ? orderStatus : ''
            ]);
          });

          const orderEndRow = aoa.length - 1;

          // Merge order-level columns (Tanggal pesanan, Status pesanan) jika order checkout memiliki > 1 item
          if (orderEndRow > orderStartRow) {
            orderMerges.push({ s: { r: orderStartRow, c: 4 }, e: { r: orderEndRow, c: 4 } });
            orderMerges.push({ s: { r: orderStartRow, c: 9 }, e: { r: orderEndRow, c: 9 } });
          }
        });

        const userEndRow = aoa.length - 1;
        userGroupRanges.push({ start: userStartRow, end: userEndRow, groupIdx, statusText: '' });

        // Merge user-level columns (NO, NAMA, DEPT, NO HP) jika user memiliki > 1 baris
        if (userEndRow > userStartRow) {
          for (let c = 0; c <= 3; c++) {
            orderMerges.push({ s: { r: userStartRow, c }, e: { r: userEndRow, c } });
          }
        }

        orderCounter++;
      });

      const footerRowIdx = aoa.length;
      aoa.push([
        'TOTAL KESELURUHAN (PERIODE BULAN INI)', '', '', '', '', '',
        grandTotalQty,
        '',
        grandTotalSubtotal,
        ''
      ]);

      const ws = XLSX.utils.aoa_to_sheet(aoa);

      // Merges
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 9 } },
        { s: { r: 3, c: 0 }, e: { r: 3, c: 2 } },
        { s: { r: 4, c: 0 }, e: { r: 4, c: 2 } },
        { s: { r: 3, c: 3 }, e: { r: 3, c: 5 } },
        { s: { r: 4, c: 3 }, e: { r: 4, c: 5 } },
        { s: { r: 3, c: 6 }, e: { r: 3, c: 9 } },
        { s: { r: 4, c: 6 }, e: { r: 4, c: 9 } },
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
      for (let c = 0; c <= 9; c++) {
        const addr = XLSX.utils.encode_cell({ r: 0, c });
        if (!ws[addr]) ws[addr] = { v: '', t: 's' };
        ws[addr].s = {
          font: { name: 'Arial', sz: 12, bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '004B49' } },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      }

      // Row 1
      for (let c = 0; c <= 9; c++) {
        const addr = XLSX.utils.encode_cell({ r: 1, c });
        if (!ws[addr]) ws[addr] = { v: '', t: 's' };
        ws[addr].s = {
          font: { name: 'Arial', sz: 11, bold: true, color: { rgb: '0F172A' } },
          fill: { fgColor: { rgb: 'CCEBE6' } },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      }

      // Row 2
      for (let c = 0; c <= 9; c++) {
        const addr = XLSX.utils.encode_cell({ r: 2, c });
        if (!ws[addr]) ws[addr] = { v: '', t: 's' };
        ws[addr].s = {
          font: { name: 'Arial', sz: 9, italic: true, color: { rgb: '475569' } },
          fill: { fgColor: { rgb: 'F1F5F9' } },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      }

      // KPI Boxes (Rows 3 & 4)
      for (let c = 0; c <= 9; c++) {
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
      for (let c = 0; c <= 9; c++) {
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

        for (let c = 0; c <= 9; c++) {
          const addr = XLSX.utils.encode_cell({ r, c });
          if (!ws[addr]) ws[addr] = { v: '', t: 's' };
          const cell = ws[addr];

          let align: 'left' | 'center' | 'right' = 'left';
          // Kolom NO (0), NO HP (3), Tanggal pesanan (4), QTY (6) selalu di tengah (center)
          if (c === 0 || c === 3 || c === 4 || c === 6) align = 'center';
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

          if (c === 7 || c === 8) {
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
          if (c === 9) {
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
      for (let c = 0; c <= 9; c++) {
        const addr = XLSX.utils.encode_cell({ r: footerRowIdx, c });
        if (!ws[addr]) ws[addr] = { v: '', t: 's' };

        const curCell = ws[addr];
        curCell.s = {
          font: { name: 'Arial', sz: 10, bold: true, color: { rgb: '0F172A' } },
          fill: { fgColor: { rgb: 'E2E8F0' } },
          alignment: { horizontal: c === 6 || c === 8 ? 'right' : 'left', vertical: 'center' },
          border: {
            top: { style: 'medium', color: { rgb: '0F172A' } },
            bottom: { style: 'double', color: { rgb: '0F172A' } },
            left: { style: 'thin', color: { rgb: '94A3B8' } },
            right: { style: 'thin', color: { rgb: '94A3B8' } }
          }
        };

        if (c === 8 && typeof curCell.v === 'number') {
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
              className="p-1.5 sm:p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
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
            className={`py-2 px-2.5 rounded-xl font-bold text-[11px] uppercase tracking-wider flex items-center justify-between transition-all cursor-pointer ${
              activeTab === 'orders'
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
            className={`py-2 px-2.5 rounded-xl font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer truncate ${
              activeTab === 'analytics'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'analytics' ? 'text-white' : 'text-teal-600'}`} />
            <span className="truncate">Grafik Penjualan</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`py-2 px-2.5 rounded-xl font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer truncate ${
              activeTab === 'products'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Package className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Data Produk</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-2.5 rounded-xl font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer truncate ${
              activeTab === 'users'
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
            className={`py-3 px-4 font-bold text-xs uppercase tracking-wider flex items-center space-x-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'orders'
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
            className={`py-3 px-4 font-bold text-xs uppercase tracking-wider flex items-center space-x-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-teal-600" />
            <span>Grafik & Tren Penjualan</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`py-3 px-4 font-bold text-xs uppercase tracking-wider flex items-center space-x-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'products'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Data Produk</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`py-3 px-4 font-bold text-xs uppercase tracking-wider flex items-center space-x-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'users'
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

                {isBarcodeFeatureActive && (
                  <button
                    onClick={() => setIsBarcodeModalOpen(true)}
                    className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold rounded-xl transition-all shadow-md shadow-slate-900/10 border border-slate-700 group"
                    title="Modul Pemindaian Barcode / QR Code"
                  >
                    <ScanLine className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
                    <span>Pindai Barcode</span>
                  </button>
                )}

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
                      className={`bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col transition-all ${
                        (!order.status || order.status === 'Menunggu Konfirmasi') 
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
                              Rp {order.total_amount.toLocaleString('id-ID')}
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
                        <div className="print-section text-black bg-white" style={{ fontFamily: 'monospace' }}>
                          <div className="w-full mx-auto p-4 border border-slate-200 rounded-lg no-print-border">
                            <div className="text-center mb-4">
                              <h2 className="font-extrabold text-xl mb-1">BELANJAIN SAZA</h2>
                              <p className="text-xs font-bold">Koperasi Karyawan Siemens Indonesia (KOKSI)</p>
                              <p className="text-xs">PT. Siemens Indonesia</p>
                              <div className="border-b-2 border-dashed border-black my-3"></div>
                            </div>
                            <div className="mb-4 text-xs space-y-1">
                              <div className="flex justify-between"><span>No Order:</span> <span className="font-bold">#{order.id}</span></div>
                              <div className="flex justify-between"><span>Tanggal:</span> <span>{format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm', { locale: idLocale })}</span></div>
                              <div className="flex justify-between"><span>Pemesan:</span> <span className="font-bold">{order.user?.nama || '-'}</span></div>
                              <div className="flex justify-between"><span>Dept:</span> <span>{order.user?.departemen || '-'}</span></div>
                              <div className="flex justify-between"><span>No. HP:</span> <span>{order.user?.no_hp || '-'}</span></div>
                            </div>
                            <div className="border-b-2 border-dashed border-black my-3"></div>
                            <div className="mb-4">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b border-black">
                                    <th className="text-left py-1 w-7/12">Item</th>
                                    <th className="text-center py-1 w-2/12">Qty</th>
                                    <th className="text-right py-1 w-3/12">Total</th>
                                  </tr>
                                </thead>
                                <tbody className="align-top">
                                  {order.items.map((item, idx) => (
                                    <tr key={idx} className="border-b border-dashed border-gray-300">
                                      <td className="py-2 pr-2">{item.product?.nama_barang} <br/><span className="text-[10px] text-gray-500">@ Rp {item.price.toLocaleString('id-ID')}</span></td>
                                      <td className="text-center py-2">{item.quantity}</td>
                                      <td className="text-right py-2">{(item.price * item.quantity).toLocaleString('id-ID')}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <div className="border-b-2 border-dashed border-black my-3"></div>
                            <div className="flex justify-between font-extrabold text-sm mb-6">
                              <span>TOTAL BAYAR</span>
                              <span>Rp {order.total_amount.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="text-center text-[10px] mt-6 italic text-gray-800 space-y-1">
                              <p className="font-bold">Terima kasih telah berbelanja di KOKSI</p>
                              <p>Barang yang sudah dibeli tidak dapat ditukar/dikembalikan.</p>
                              <p className="mt-2 text-[9px] uppercase">** BUKTI PEMBAYARAN SAH **</p>
                            </div>
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
                          <p className="text-sm font-black text-teal-700">Rp {p.harga.toLocaleString('id-ID')}</p>
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
                        <td className="px-6 py-4 text-sm font-bold text-teal-700 text-right">Rp {p.harga.toLocaleString('id-ID')}</td>
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
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border ${
                            u.role === 'admin' 
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
                                className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase transition-all border cursor-pointer ${
                                  (u.role || 'user') === r
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
                            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg border inline-block w-fit ${
                              u.role === 'admin' 
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
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase transition-all border cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                                    (u.role || 'user') === r
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

        {/* TAB 4: MODUL FITUR - PINDAI BARCODE / QR CODE (HALAMAN DEDIKASI) */}
        {activeTab === 'scan' && (
          <div className="flex flex-col flex-1 space-y-6">
            {/* Header Card */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center font-bold shadow-inner shrink-0">
                  <ScanLine className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-extrabold text-white">Halaman Pindai Barcode / QR Code</h2>
                    <span className="px-2 py-0.5 text-[10px] bg-teal-500 text-slate-900 font-black rounded-md uppercase tracking-wider">
                      BelanjaIn Saza
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Pindai atau masukkan kode barcode pengambilan barang karyawan (PT. Siemens Indonesia) untuk verifikasi instan.
                  </p>
                </div>
              </div>

              {/* Status Toggle Button */}
              <div className="flex items-center space-x-3 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/80 shrink-0">
                <span className="text-xs font-bold text-slate-300">Status Fitur:</span>
                <button
                  onClick={() => toggleBarcodeFeature(!isBarcodeFeatureActive)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                    isBarcodeFeatureActive
                      ? 'bg-teal-500 text-slate-900 shadow-md shadow-teal-500/20'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {isBarcodeFeatureActive ? 'FITUR AKTIF' : 'DRAFT / TERPESAN'}
                </button>
              </div>
            </div>

            {/* Scanner Input & Verification Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-teal-600" />
                    Input Pemindai Barcode (Hardware / Kamera / Manual)
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Gunakan kamera HP/laptop, pemindai barcode fisik, atau ketikkan kode pesanan.
                  </p>
                </div>

                {/* Camera Scanner Box */}
                {isCameraActive && (
                  <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center text-white">
                      <span className="text-xs font-bold flex items-center gap-2 text-teal-400">
                        <Camera className="w-4 h-4" />
                        Kamera Scanner Aktif
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsCameraActive(false)}
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg"
                      >
                        Tutup Kamera
                      </button>
                    </div>
                    <div id="admin-camera-reader" className="w-full rounded-xl overflow-hidden bg-black min-h-[220px]" />
                    <p className="text-[11px] text-slate-400 text-center">
                      Arahkan kamera ke Kode QR Pick-Up Karyawan
                    </p>
                  </div>
                )}

                <form onSubmit={handleVerifyBarcode} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Kode Pesanan / Barcode Token
                    </label>
                    <input
                      type="text"
                      value={scannedBarcodeInput}
                      onChange={(e) => setScannedBarcodeInput(e.target.value)}
                      placeholder="Contoh: SAZA-PKP-1002"
                      className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-300 rounded-2xl text-base font-mono font-bold text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white shadow-inner"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <button
                      type="submit"
                      disabled={verifyingBarcode}
                      className="flex-1 py-3 px-5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-extrabold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ScanLine className="w-4 h-4 text-teal-200" />
                      <span>{verifyingBarcode ? 'Memverifikasi...' : 'Verifikasi & Selesaikan Pesanan'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsCameraActive(!isCameraActive)}
                      className="py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      {isCameraActive ? (
                        <>
                          <CameraOff className="w-4 h-4 text-red-400" />
                          <span>Tutup Kamera</span>
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4 text-teal-400" />
                          <span>Pindai Pakai Kamera</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Feedback Toast Result */}
                {barcodeVerifyMessage && (
                  <div className={`p-4 rounded-2xl border text-xs leading-relaxed animate-in fade-in zoom-in duration-200 ${
                    barcodeVerifyMessage.type === 'success' 
                      ? 'bg-teal-50 border-teal-200 text-teal-900' 
                      : 'bg-red-50 border-red-200 text-red-900'
                  }`}>
                    <p className="font-extrabold text-sm flex items-center gap-2 mb-1">
                      {barcodeVerifyMessage.type === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-teal-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                      )}
                      {barcodeVerifyMessage.type === 'success' ? 'Verifikasi Berhasil' : 'Gagal Verifikasi'}
                    </p>
                    <p className="font-medium text-xs">{barcodeVerifyMessage.text}</p>
                  </div>
                )}

                <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-amber-900">
                    <ScanLine className="w-4 h-4 text-amber-600 shrink-0" />
                    Panduan Penggunaan Pemindaian Barcode:
                  </p>
                  <ul className="list-disc list-inside text-[11px] text-amber-800 space-y-1 leading-relaxed">
                    <li>Barcode Karyawan berisi format ID unik, contohnya: <span className="font-mono font-bold">SAZA-PKP-1002</span>.</li>
                    <li>Sistem akan secara otomatis mengubah status transaksi pesanan menjadi <span className="font-bold text-teal-700">"Selesai"</span> setelah barcode terverifikasi.</li>
                    <li>Barcode dari transaksi yang <span className="font-bold text-red-700">Dibatalkan</span> akan ditolak otomatis oleh sistem.</li>
                  </ul>
                </div>
              </div>

              {/* Quick Status Overview of Pending Pickups */}
              <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 mb-1">
                    Daftar Pesanan Siap Diambil / Diproses
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Klik tombol di sebelah kanan pesanan untuk memverifikasi instan:
                  </p>

                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {orders.filter(o => o.status !== 'Dibatalkan' && o.status !== 'Selesai').map((ord) => (
                      <div 
                        key={ord.id} 
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl transition-all flex justify-between items-center gap-2 hover:bg-slate-100"
                      >
                        <div>
                          <p className="text-xs font-mono font-bold text-slate-900">
                            #SAZA-PKP-{ord.id}
                          </p>
                          <p className="text-[11px] text-slate-600 font-medium">
                            {ord.user?.nama || 'Karyawan'} &bull; {ord.user?.pt || 'PT. Siemens Indonesia'}
                          </p>
                          <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded mt-1">
                            {ord.status || 'Menunggu'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setScannedBarcodeInput(`SAZA-PKP-${ord.id}`);
                            executeVerifyBarcode(`SAZA-PKP-${ord.id}`);
                          }}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-teal-600 text-white rounded-lg text-xs font-bold transition-colors shrink-0 cursor-pointer shadow-sm"
                        >
                          Pilih & Verifikasi
                        </button>
                      </div>
                    ))}

                    {orders.filter(o => o.status !== 'Dibatalkan' && o.status !== 'Selesai').length === 0 && (
                      <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                        Tidak ada pesanan pending yang perlu diambil.
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 text-center font-medium">
                  BelanjaIn Saza PT. Siemens Indonesia &bull; Server Auto-Sync
                </div>
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
                  onChange={(e) => setFormData({...formData, nama_barang: e.target.value})}
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
                  onChange={(e) => setFormData({...formData, sub_kategori: e.target.value})}
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
                    onChange={(e) => setFormData({...formData, harga: parseInt(e.target.value) || 0})}
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
                    onChange={(e) => setFormData({...formData, stok: parseInt(e.target.value) || 0})}
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

      {/* MODAL FITUR: PEMINDAIAN BARCODE / QR CODE UNTUK PENGAMBILAN PESANAN */}
      {isBarcodeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-teal-400 flex items-center justify-center font-bold shadow-sm">
                  <ScanLine className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                    Modul Fitur: Verifikasi Barcode
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">Konfirmasi Otomatis Pengambilan Barang BelanjaIn Saza</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsBarcodeModalOpen(false);
                  setBarcodeVerifyMessage(null);
                  setScannedBarcodeInput('');
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-5 space-y-4">
              {/* Feature Status Toggle Bar */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Status Fitur Barcode</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {isBarcodeFeatureActive 
                      ? 'Fitur Aktif & Siap Menerima Pindai Barcode dari Alat Scanner/Kamera.' 
                      : 'Fitur Tersimpan (Non-Aktif). Aktifkan jika ingin digunakan resmi.'}
                  </p>
                </div>
                <button
                  onClick={() => toggleBarcodeFeature(!isBarcodeFeatureActive)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    isBarcodeFeatureActive
                      ? 'bg-teal-600 text-white hover:bg-teal-700'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {isBarcodeFeatureActive ? 'Status: AKTIF' : 'Aktifkan Fitur'}
                </button>
              </div>

              {/* Form Input / Barcode Scanner Input */}
              <form onSubmit={handleVerifyBarcode} className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">
                  Masukkan / Tempel Kode Barcode Pesanan (atau Pemindai Barcode Gun)
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={scannedBarcodeInput}
                    onChange={(e) => setScannedBarcodeInput(e.target.value)}
                    placeholder="Contoh: SAZA-PKP-1002"
                    autoFocus
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    type="submit"
                    disabled={verifyingBarcode}
                    className="px-5 py-3 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl transition-colors shadow-sm whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <ScanLine className="w-4 h-4 text-teal-200" />
                    <span>{verifyingBarcode ? 'Memverifikasi...' : 'Verifikasi'}</span>
                  </button>
                </div>
              </form>

              {/* Feedback Alert */}
              {barcodeVerifyMessage && (
                <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                  barcodeVerifyMessage.type === 'success' 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}>
                  <p className="font-bold flex items-center gap-1.5 mb-1">
                    {barcodeVerifyMessage.type === 'success' ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    {barcodeVerifyMessage.type === 'success' ? 'Verifikasi Selesai' : 'Gagal Verifikasi'}
                  </p>
                  {barcodeVerifyMessage.text}
                </div>
              )}

              {/* Instruction Note */}
              <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl text-[11px] text-amber-900">
                <p className="font-bold mb-0.5">Catatan Fitur:</p>
                <p className="text-amber-800 leading-snug">
                  Kode program backend & frontend telah disimpan secara lengkap. Saat alat pemindai fisik / kamera admin memindai barcode karyawan, pesanan akan langsung otomatis diperbarui menjadi status <span className="font-bold">"Selesai"</span>.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  setIsBarcodeModalOpen(false);
                  setBarcodeVerifyMessage(null);
                  setScannedBarcodeInput('');
                }}
                className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                Tutup Modul Barcode
              </button>
            </div>
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

              {/* Upload File */}
              <div className="p-4 bg-teal-50/60 rounded-2xl border border-teal-100">
                <p className="text-xs font-bold text-teal-950 mb-1 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-teal-700" />
                  <span>2. Upload File Excel Anda</span>
                </p>
                <p className="text-[11px] text-teal-800/80 mb-3">
                  Pilih file Excel yang telah diisi untuk mengimpor produk secara otomatis ke database.
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-white" />
                  <span>Pilih File Excel & Import</span>
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="w-full py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
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
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold ${
                  cancellationConfirmModal.type === 'approve'
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
    </div>
  );
};
