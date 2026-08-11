import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, LogOut, Upload, Download, FileText, 
  ShoppingBag, RefreshCw, CheckCircle, Clock, Package, 
  Phone, MessageSquare, Search, Filter, AlertCircle, Check, X,
  QrCode, ScanLine, Camera, CameraOff, Inbox, FilterX, PackageSearch,
  Calendar, FileSpreadsheet, Building2, Key, Lock, Eye, EyeOff, Server
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import XLSX from 'xlsx-js-style';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface Product {
  id: number;
  nama_barang: string;
  kategori: string;
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

export const DashboardAdmin = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'users' | 'scan'>('orders');
  
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
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
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
  const [exportMonth, setExportMonth] = useState<number>(new Date().getMonth() + 1);
  const [exportYear, setExportYear] = useState<number>(new Date().getFullYear());
  const [exportPtFilter, setExportPtFilter] = useState<string>('Semua');
  const [exportStatusFilter, setExportStatusFilter] = useState<string>('Semua');

  // Reset Password Modal State
  const [resetPasswordUser, setResetPasswordUser] = useState<{ id: number, nama: string, no_hp: string } | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetPasswordError, setResetPasswordError] = useState('');

  useEffect(() => {
    localStorage.setItem('koksi_barcode_feature_active', 'false');
  }, []);

  const toggleBarcodeFeature = (active: boolean) => {
    setIsBarcodeFeatureActive(active);
    localStorage.setItem('koksi_barcode_feature_active', active ? 'true' : 'false');
  };

  const executeVerifyBarcode = async (codeToVerify?: string) => {
    const code = (codeToVerify || scannedBarcodeInput).trim();
    if (!code) {
      setBarcodeVerifyMessage({ type: 'error', text: 'Silakan ketik atau pilih kode pesanan terlebih dahulu (contoh: KOKSI-PKP-1002).' });
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

  const fetchOrders = async (isBackground = false) => {
    if (!isBackground) setOrdersLoading(true);
    try {
      const res = await fetch('/api/orders/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
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
      } else {
        const data = await res.json().catch(() => ({}));
        alert(`Gagal memperbarui status: ${data.error || 'Terjadi kesalahan'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan jaringan saat update status pesanan.');
    } finally {
      setUpdatingStatus(false);
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
        alert(`Password pengguna "${resetPasswordUser.nama}" berhasil direset!`);
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
      { 'Nama Barang': 'mi goreng Indomie', 'Satuan': 'Dus', 'Qty': 1, 'HARGA JUAL KE KOKSI': 110000 },
      { 'Nama Barang': 'Beras Premium 5kg', 'Satuan': 'Karung', 'Qty': 50, 'HARGA JUAL KE KOKSI': 75000 },
      { 'Nama Barang': 'Minyak Goreng 2L', 'Satuan': 'Pouch', 'Qty': 30, 'HARGA JUAL KE KOKSI': 34000 }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Produk');
    XLSX.writeFile(wb, 'Template_Import_Produk_KOKSI.xlsx');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const ab = evt.target?.result;
        const wb = XLSX.read(ab, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        const matrixRows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        const formattedProducts: { nama_barang: string; kategori: string; harga: number; stok: number }[] = [];

        let currentCategory = 'Sembako';
        let idxNama = -1;
        let idxHarga = -1;
        let idxQty = -1;
        let idxKat = -1;

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

              for (let i = r + 1; i < matrixRows.length; i++) {
                const itemRow = matrixRows[i];
                if (!Array.isArray(itemRow) || itemRow.length === 0) continue;

                const namaCell = String(itemRow[idxNama] || '').trim();
                const hargaRaw = idxHarga !== -1 ? itemRow[idxHarga] : undefined;
                const qtyRaw = idxQty !== -1 ? itemRow[idxQty] : undefined;
                const katRaw = idxKat !== -1 ? itemRow[idxKat] : undefined;

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

                formattedProducts.push({
                  nama_barang: namaCell,
                  kategori: String(katRaw || currentCategory || 'Lainnya').trim(),
                  harga: hargaNum,
                  stok: qtyNum
                });
              }
              break;
            }
          }
        }

        if (formattedProducts.length === 0) {
          const objectData = XLSX.utils.sheet_to_json(ws) as any[];
          if (objectData && objectData.length > 0) {
            objectData.forEach(item => {
              const nama = getRowValue(item, ['nama_barang', 'nama barang', 'nama', 'barang', 'nama produk', 'product name', 'item', 'produk']);
              const kategori = getRowValue(item, ['kategori', 'category', 'jenis', 'kat']) || 'Lainnya';
              const hargaRaw = getRowValue(item, ['harga jual ke koksi', 'harga jual', 'harga', 'harga barang', 'price']);
              const stokRaw = getRowValue(item, ['qty', 'stok', 'stock', 'jumlah', 'stok barang']);

              const hargaNum = parseInt(String(hargaRaw || 0).replace(/[^0-9]/g, ''), 10) || 0;
              const stokNum = parseInt(String(stokRaw || 0).replace(/[^0-9]/g, ''), 10) || 0;

              if (nama && String(nama).trim().length > 0) {
                formattedProducts.push({
                  nama_barang: String(nama).trim(),
                  kategori: String(kategori).trim(),
                  harga: hargaNum,
                  stok: stokNum
                });
              }
            });
          }
        }

        if (formattedProducts.length === 0) {
          alert('Tidak ditemukan data produk yang valid di Excel.');
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
          alert(resData.message || `Berhasil memproses ${formattedProducts.length} produk!`);
        } else {
          alert(`Gagal import produk: ${resData.error || 'Terjadi kesalahan pada server'}`);
        }
      } catch (err: any) {
        console.error(err);
        alert('Terjadi kesalahan saat membaca file Excel.');
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
        alert('Gagal mengambil data penjualan untuk diexport');
        return;
      }
      const allOrders: Order[] = await res.json();

      const monthToUse = targetMonth ?? exportMonth;
      const yearToUse = targetYear ?? exportYear;
      const ptToUse = targetPt ?? exportPtFilter;
      const statusToUse = targetStatus ?? exportStatusFilter;

      // Filter orders by Month, Year, PT, and Status
      const filteredOrders = allOrders.filter(order => {
        const orderDate = new Date(order.createdAt);
        const matchMonth = monthToUse === 0 || (orderDate.getMonth() + 1) === monthToUse;
        const matchYear = yearToUse === 0 || orderDate.getFullYear() === yearToUse;
        const matchPt = ptToUse === 'Semua' || (order.user?.pt || '').toLowerCase() === ptToUse.toLowerCase();
        const matchStatus = statusToUse === 'Semua' || (order.status || 'Menunggu Konfirmasi').toLowerCase() === statusToUse.toLowerCase();

        return matchMonth && matchYear && matchPt && matchStatus;
      });

      if (filteredOrders.length === 0) {
        alert('Tidak ditemukan transaksi penjualan yang cocok dengan kriteria filter tarikan bulanan.');
        return;
      }

      const periodTitle = monthToUse === 0
        ? `Tahun ${yearToUse}`
        : `${MONTH_NAMES[monthToUse - 1]} ${yearToUse}`;

      // Calculate totals
      let totalItemsCount = 0;
      let totalRevenue = 0;
      let totalCompletedCount = 0;

      filteredOrders.forEach(ord => {
        const st = (ord.status || '').toLowerCase();
        if (st.includes('selesai') || st === 'completed') totalCompletedCount++;
        ord.items?.forEach(it => {
          totalItemsCount += (it.quantity || 0);
          totalRevenue += ((it.quantity || 0) * (it.price || 0));
        });
      });

      // Construct AOA Matrix
      const r0 = ['KOPERASI KARYAWAN SIEMENS (KOKSI) - PT. SIEMENS INDONESIA & PT. SIM', '', '', '', '', '', '', '', '', '', '', '', ''];
      const r1 = ['LAPORAN REKAPITULASI TARIKAN DATA TRANSAKSI PENJUALAN BULANAN', '', '', '', '', '', '', '', '', '', '', '', ''];
      const r2 = [`Periode Laporan: ${periodTitle}   |   Tanggal Cetak: ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: idLocale })} WIB   |   PT: ${ptToUse}   |   Status: ${statusToUse}`, '', '', '', '', '', '', '', '', '', '', '', ''];
      const r3 = ['', '', '', '', '', '', '', '', '', '', '', '', ''];
      const r4 = ['RINGKASAN REKAPITULASI EKSEKUTIF', '', '', '', '', '', '', '', '', '', '', '', ''];

      const r5 = [
        'TOTAL PESANAN', '', '',
        'TOTAL ITEM TERJUAL', '', '',
        'TOTAL OMZET PENJUALAN', '', '',
        'PESANAN SELESAI', '', '', ''
      ];

      const r6 = [
        `${filteredOrders.length} Transaksi`, '', '',
        `${totalItemsCount.toLocaleString('id-ID')} Pcs`, '', '',
        totalRevenue, '', '',
        `${totalCompletedCount} Transaksi`, '', '', ''
      ];

      const r7 = ['', '', '', '', '', '', '', '', '', '', '', '', ''];
      const r8 = ['RINCIAN DETAIL TRANSAKSI PENJUALAN', '', '', '', '', '', '', '', '', '', '', '', ''];

      const r9 = [
        'NO',
        'ID PESANAN',
        'TANGGAL & WAKTU',
        'NAMA KARYAWAN',
        'PERUSAHAAN (PT)',
        'DEPARTEMEN',
        'NO HP / KONTAK',
        'NAMA BARANG / PRODUK',
        'QTY',
        'HARGA SATUAN (RP)',
        'TOTAL HARGA (RP)',
        'STATUS PESANAN',
        'CATATAN STATUS'
      ];

      const aoa: any[][] = [r0, r1, r2, r3, r4, r5, r6, r7, r8, r9];

      let orderCounter = 1;
      let grandTotalQty = 0;
      let grandTotalSubtotal = 0;

      const orderMerges: { s: { r: number, c: number }, e: { r: number, c: number } }[] = [];

      filteredOrders.forEach(order => {
        const items = (order.items && order.items.length > 0) ? order.items : [{ product: { nama_barang: 'Barang Dihapus' }, quantity: 0, price: 0 }];
        const orderStartRow = aoa.length;

        items.forEach((item, itemIdx) => {
          const subtotal = (item.quantity || 0) * (item.price || 0);
          grandTotalQty += (item.quantity || 0);
          grandTotalSubtotal += subtotal;

          const dateStr = order.createdAt ? format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm') : '-';

          if (itemIdx === 0) {
            aoa.push([
              orderCounter,
              `#KOKSI-PKP-${order.id}`,
              dateStr,
              order.user?.nama || '-',
              order.user?.pt || '-',
              order.user?.departemen || '-',
              order.user?.no_hp || '-',
              item.product?.nama_barang || 'Barang Dihapus',
              item.quantity || 0,
              item.price || 0,
              subtotal,
              order.status || 'Menunggu Konfirmasi',
              order.keterangan || '-'
            ]);
          } else {
            aoa.push([
              '',
              '',
              '',
              '',
              '',
              '',
              '',
              item.product?.nama_barang || 'Barang Dihapus',
              item.quantity || 0,
              item.price || 0,
              subtotal,
              '',
              ''
            ]);
          }
        });

        const orderEndRow = aoa.length - 1;

        if (orderEndRow > orderStartRow) {
          // Merge order-level columns (NO, ID PESANAN, TANGGAL, NAMA, PT, DEPT, NO HP)
          for (let c = 0; c <= 6; c++) {
            orderMerges.push({ s: { r: orderStartRow, c }, e: { r: orderEndRow, c } });
          }
          // Merge STATUS PESANAN, CATATAN STATUS
          for (let c = 11; c <= 12; c++) {
            orderMerges.push({ s: { r: orderStartRow, c }, e: { r: orderEndRow, c } });
          }
        }

        orderCounter++;
      });

      const footerRowIdx = aoa.length;
      aoa.push([
        'TOTAL KESELURUHAN (PERIODE BULAN INI)', '', '', '', '', '', '', '',
        grandTotalQty,
        '',
        grandTotalSubtotal,
        '',
        ''
      ]);

      const ws = XLSX.utils.aoa_to_sheet(aoa);

      // Merges
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 12 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 12 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 12 } },
        { s: { r: 4, c: 0 }, e: { r: 4, c: 12 } },
        { s: { r: 5, c: 0 }, e: { r: 5, c: 2 } },
        { s: { r: 6, c: 0 }, e: { r: 6, c: 2 } },
        { s: { r: 5, c: 3 }, e: { r: 5, c: 5 } },
        { s: { r: 6, c: 3 }, e: { r: 6, c: 5 } },
        { s: { r: 5, c: 6 }, e: { r: 5, c: 8 } },
        { s: { r: 6, c: 6 }, e: { r: 6, c: 8 } },
        { s: { r: 5, c: 9 }, e: { r: 5, c: 12 } },
        { s: { r: 6, c: 9 }, e: { r: 6, c: 12 } },
        { s: { r: 8, c: 0 }, e: { r: 8, c: 12 } },
        { s: { r: footerRowIdx, c: 0 }, e: { r: footerRowIdx, c: 7 } },
        ...orderMerges
      ];

      // Column widths
      ws['!cols'] = [
        { wch: 6 },   // NO
        { wch: 18 },  // ID PESANAN
        { wch: 20 },  // TANGGAL
        { wch: 26 },  // NAMA KARYAWAN
        { wch: 28 },  // PERUSAHAAN (PT)
        { wch: 20 },  // DEPARTEMEN
        { wch: 18 },  // NO HP
        { wch: 36 },  // NAMA BARANG
        { wch: 10 },  // QTY
        { wch: 22 },  // HARGA SATUAN
        { wch: 22 },  // TOTAL HARGA
        { wch: 22 },  // STATUS
        { wch: 45 }   // CATATAN STATUS
      ];

      // Row heights
      ws['!rows'] = [];
      ws['!rows'][0] = { hpt: 32 };
      ws['!rows'][1] = { hpt: 24 };
      ws['!rows'][2] = { hpt: 20 };
      ws['!rows'][4] = { hpt: 22 };
      ws['!rows'][5] = { hpt: 18 };
      ws['!rows'][6] = { hpt: 28 };
      ws['!rows'][8] = { hpt: 22 };
      ws['!rows'][9] = { hpt: 28 };

      const borderThin = {
        top: { style: 'thin', color: { rgb: 'D1D5DB' } },
        bottom: { style: 'thin', color: { rgb: 'D1D5DB' } },
        left: { style: 'thin', color: { rgb: 'D1D5DB' } },
        right: { style: 'thin', color: { rgb: 'D1D5DB' } }
      };

      // Styling Cells
      // Row 0
      for (let c = 0; c <= 12; c++) {
        const addr = XLSX.utils.encode_cell({ r: 0, c });
        if (!ws[addr]) ws[addr] = { v: '', t: 's' };
        ws[addr].s = {
          font: { name: 'Arial', sz: 13, bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '004B49' } },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      }

      // Row 1
      for (let c = 0; c <= 12; c++) {
        const addr = XLSX.utils.encode_cell({ r: 1, c });
        if (!ws[addr]) ws[addr] = { v: '', t: 's' };
        ws[addr].s = {
          font: { name: 'Arial', sz: 11, bold: true, color: { rgb: '0F172A' } },
          fill: { fgColor: { rgb: 'CCEBE6' } },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      }

      // Row 2
      for (let c = 0; c <= 12; c++) {
        const addr = XLSX.utils.encode_cell({ r: 2, c });
        if (!ws[addr]) ws[addr] = { v: '', t: 's' };
        ws[addr].s = {
          font: { name: 'Arial', sz: 9, italic: true, color: { rgb: '475569' } },
          fill: { fgColor: { rgb: 'F1F5F9' } },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      }

      // Section Headers (Rows 4 & 8)
      [4, 8].forEach(r => {
        for (let c = 0; c <= 12; c++) {
          const addr = XLSX.utils.encode_cell({ r, c });
          if (!ws[addr]) ws[addr] = { v: '', t: 's' };
          ws[addr].s = {
            font: { name: 'Arial', sz: 10, bold: true, color: { rgb: '005B5C' } },
            fill: { fgColor: { rgb: 'E2E8F0' } },
            alignment: { horizontal: 'left', vertical: 'center' },
            border: borderThin
          };
        }
      });

      // KPI Boxes (Rows 5 & 6)
      for (let c = 0; c <= 12; c++) {
        const lAddr = XLSX.utils.encode_cell({ r: 5, c });
        const vAddr = XLSX.utils.encode_cell({ r: 6, c });

        if (!ws[lAddr]) ws[lAddr] = { v: '', t: 's' };
        if (!ws[vAddr]) ws[vAddr] = { v: '', t: 's' };

        ws[lAddr].s = {
          font: { name: 'Arial', sz: 9, bold: true, color: { rgb: '475569' } },
          fill: { fgColor: { rgb: 'F1F5F9' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: borderThin
        };

        const isOmzetBox = c >= 6 && c <= 8;
        ws[vAddr].s = {
          font: { name: 'Arial', sz: 12, bold: true, color: isOmzetBox ? { rgb: '047857' } : { rgb: '0F172A' } },
          fill: { fgColor: isOmzetBox ? { rgb: 'ECFDF5' } : { rgb: 'FFFFFF' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: borderThin
        };

        if (isOmzetBox && typeof ws[vAddr].v === 'number') {
          ws[vAddr].z = '"Rp "#,##0';
        }
      }

      // Table Headers (Row 9)
      for (let c = 0; c <= 12; c++) {
        const addr = XLSX.utils.encode_cell({ r: 9, c });
        if (ws[addr]) {
          ws[addr].s = {
            font: { name: 'Arial', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '0F172A' } },
            alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
            border: {
              top: { style: 'medium', color: { rgb: '000000' } },
              bottom: { style: 'medium', color: { rgb: '000000' } },
              left: { style: 'thin', color: { rgb: '334155' } },
              right: { style: 'thin', color: { rgb: '334155' } }
            }
          };
        }
      }

      // Data Rows (10 to footerRowIdx - 1)
      for (let r = 10; r < footerRowIdx; r++) {
        const isEven = r % 2 === 0;
        const rowBg = isEven ? 'FFFFFF' : 'F8FAFC';

        for (let c = 0; c <= 12; c++) {
          const addr = XLSX.utils.encode_cell({ r, c });
          const cell = ws[addr];
          if (!cell) continue;

          let align: 'left' | 'center' | 'right' = 'left';
          if (c === 0 || c === 1 || c === 2 || c === 6 || c === 8) align = 'center';
          if (c === 9 || c === 10) align = 'right';

          cell.s = {
            font: { name: 'Arial', sz: 9.5, color: { rgb: '1E293B' } },
            fill: { fgColor: { rgb: rowBg } },
            alignment: { horizontal: align, vertical: 'center', wrapText: true },
            border: borderThin
          };

          if (c === 9 || c === 10) {
            if (typeof cell.v === 'number') {
              cell.z = '"Rp "#,##0';
            }
          }

          if (c === 8 && typeof cell.v === 'number') {
            cell.z = '#,##0';
            cell.s.font.bold = true;
          }

          if (c === 11) {
            const st = String(cell.v || '').toLowerCase();
            let stBg = 'FEF3C7';
            let stFont = '92400E';

            if (st.includes('selesai') || st === 'completed') {
              stBg = 'DCFCE7';
              stFont = '166534';
            } else if (st.includes('proses') || st.includes('siap')) {
              stBg = 'DBEAFE';
              stFont = '1E40AF';
            } else if (st.includes('batal') || st === 'cancelled') {
              stBg = 'FEE2E2';
              stFont = '991B1B';
            }

            cell.s = {
              font: { name: 'Arial', sz: 9.5, bold: true, color: { rgb: stFont } },
              fill: { fgColor: { rgb: stBg } },
              alignment: { horizontal: 'center', vertical: 'center' },
              border: borderThin
            };
          }
        }
      }

      // Footer Row
      ws['!rows'][footerRowIdx] = { hpt: 26 };
      for (let c = 0; c <= 12; c++) {
        const addr = XLSX.utils.encode_cell({ r: footerRowIdx, c });
        if (!ws[addr]) ws[addr] = { v: '', t: 's' };

        const curCell = ws[addr];
        curCell.s = {
          font: { name: 'Arial', sz: 10, bold: true, color: { rgb: '0F172A' } },
          fill: { fgColor: { rgb: 'E2E8F0' } },
          alignment: { horizontal: c === 8 || c === 10 ? 'right' : 'left', vertical: 'center' },
          border: {
            top: { style: 'medium', color: { rgb: '0F172A' } },
            bottom: { style: 'double', color: { rgb: '0F172A' } },
            left: { style: 'thin', color: { rgb: 'CBD5E1' } },
            right: { style: 'thin', color: { rgb: 'CBD5E1' } }
          }
        };

        if (c === 8 && typeof curCell.v === 'number') {
          curCell.z = '#,##0';
          curCell.s.alignment.horizontal = 'center';
        }
        if (c === 10 && typeof curCell.v === 'number') {
          curCell.z = '"Rp "#,##0';
        }
      }

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Laporan Penjualan');

      const cleanPeriod = periodTitle.replace(/[^a-zA-Z0-9]/g, '_');
      XLSX.writeFile(wb, `Laporan_Transaksi_KOKSI_${cleanPeriod}.xlsx`);

      setIsExportModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat mengunduh laporan transaksi Excel.');
    }
  };

  const getStatusBadgeStyle = (status?: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('selesai') || s === 'completed') return 'bg-teal-100 text-teal-800 border-teal-200';
    if (s.includes('siap')) return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    if (s.includes('proses')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (s.includes('batal') || s === 'cancelled') return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-amber-100 text-amber-800 border-amber-200';
  };

  const pendingOrdersCount = orders.filter(o => !o.status || o.status === 'Menunggu Konfirmasi').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Navbar Admin */}
      <header className="bg-slate-900 text-white sticky top-0 z-30 shadow-md shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-teal-500 text-slate-900 rounded-xl flex items-center justify-center font-black text-xl italic shadow-inner">
              K
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight">KOKSI - Admin Portal</h1>
              <p className="text-[10px] text-teal-400 font-bold uppercase tracking-wider">PT. Siemens Indonesia & PT. SIM</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/it-dashboard')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-teal-500 hover:text-slate-950 text-teal-400 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Buka Dashboard Pemantauan IT"
            >
              <Server className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pemantauan IT</span>
            </button>
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-200">{user?.nama}</p>
              <p className="text-[10px] text-slate-400 uppercase font-medium">Administrator</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col">
        {/* Navigation Tabs */}
        <div className="flex space-x-2 border-b border-slate-200 mb-6 shrink-0 overflow-x-auto">
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
              <span className="ml-1.5 px-2 py-0.5 text-[10px] bg-amber-500 text-white rounded-full font-black animate-pulse">
                {pendingOrdersCount} Baru
              </span>
            )}
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

          {isBarcodeFeatureActive && (
            <button
              onClick={() => setActiveTab('scan')}
              className={`py-3 px-4 font-bold text-xs uppercase tracking-wider flex items-center space-x-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'scan'
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <ScanLine className="w-4 h-4 text-teal-500" />
              <span>Pindai Barcode (Scan)</span>
              <span className="px-1.5 py-0.5 text-[9px] bg-slate-900 text-teal-400 font-mono rounded">
                FITUR
              </span>
            </button>
          )}
        </div>

        {/* TAB 1: PERMINTAAN TRANSAKSI (REAL-TIME ORDERS) */}
        {activeTab === 'orders' && (
          <div className="flex flex-col flex-1 space-y-4">
            {/* Header Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-teal-500 animate-ping"></div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Permintaan Transaksi Karyawan</h2>
                  <p className="text-xs text-slate-500">
                    Auto-update real-time &bull; Terakhir dicek: {format(lastUpdated, 'HH:mm:ss')}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 flex-wrap gap-y-2 w-full md:w-auto">
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
                  <p className="text-xs text-slate-400 mt-1 font-medium">Menghubungkan ke Server KOKSI PT. Siemens Indonesia & PT. SIM</p>
                </div>
              ) : orders.filter(order => {
                const matchStatus = orderStatusFilter === 'Semua' || (order.status || 'Menunggu Konfirmasi').toLowerCase() === orderStatusFilter.toLowerCase();
                const matchPt = orderPtFilter === 'Semua' || (order.user?.pt || '').toLowerCase() === orderPtFilter.toLowerCase();
                const query = orderSearch.toLowerCase();
                const matchQuery = !query ||
                  order.id.toString().includes(query) ||
                  (order.user?.nama || '').toLowerCase().includes(query) ||
                  (order.user?.no_hp || '').toLowerCase().includes(query) ||
                  (order.user?.departemen || '').toLowerCase().includes(query) ||
                  order.items.some(it => (it.product?.nama_barang || '').toLowerCase().includes(query));

                return matchStatus && matchPt && matchQuery;
              }).length === 0 ? (
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
                        Sistem KOKSI belum menerima pesanan baru dari karyawan PT. Siemens Indonesia & PT. SIM. Transaksi yang dikirim oleh pengguna akan muncul otomatis secara real-time di halaman ini.
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
                orders
                  .filter(order => {
                    const matchStatus = orderStatusFilter === 'Semua' || (order.status || 'Menunggu Konfirmasi').toLowerCase() === orderStatusFilter.toLowerCase();
                    const matchPt = orderPtFilter === 'Semua' || (order.user?.pt || '').toLowerCase() === orderPtFilter.toLowerCase();
                    const query = orderSearch.toLowerCase();
                    const matchQuery = !query ||
                      order.id.toString().includes(query) ||
                      (order.user?.nama || '').toLowerCase().includes(query) ||
                      (order.user?.no_hp || '').toLowerCase().includes(query) ||
                      (order.user?.departemen || '').toLowerCase().includes(query) ||
                      order.items.some(it => (it.product?.nama_barang || '').toLowerCase().includes(query));

                    return matchStatus && matchPt && matchQuery;
                  })
                  .map(order => (
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
                              href={`https://wa.me/62${order.user.no_hp.replace(/^0/, '')}?text=${encodeURIComponent(`Halo Sdr/i ${order.user.nama}, mengenai pesanan #${order.id} KOKSI...`)}`}
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

                          <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${getStatusBadgeStyle(order.status)}`}>
                            {order.status || 'Menunggu Konfirmasi'}
                          </span>
                        </div>
                      </div>

                      {/* Stage Status Management Bar */}
                      <div className="p-4 sm:px-6 bg-slate-50/70 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="w-full md:w-auto">
                          <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">
                            Update Tahap Status Pesanan:
                          </p>
                          {order.status === 'Dibatalkan' ? (
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
                                onClick={() => handleUpdateOrderStatus(order.id, 'Siap Diambil', 'Pesanan sudah siap diambil di lokasi KOKSI')}
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
                                  const reason = prompt('Masukkan alasan pembatalan pesanan (Wajib):');
                                  if (reason && reason.trim()) {
                                    handleUpdateOrderStatus(order.id, 'Dibatalkan', `Dibatalkan oleh Admin. Alasan: ${reason.trim()}`);
                                  } else if (reason !== null) {
                                    alert('Alasan pembatalan wajib diisi!');
                                  }
                                }}
                                className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-bold transition-colors"
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
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: DATA PRODUK */}
        {activeTab === 'products' && (
          <>
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h2 className="text-xl font-bold text-slate-900">Data Produk</h2>
              <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap gap-y-2">
                <input 
                  type="file" 
                  accept=".xlsx, .xls, .csv" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
                <button
                  onClick={handleDownloadTemplate}
                  title="Unduh contoh format Excel"
                  className="flex items-center space-x-2 px-3 py-2.5 bg-slate-100 text-slate-700 rounded-full hover:bg-slate-200 transition-colors font-bold text-xs uppercase tracking-wider"
                >
                  <FileText className="w-4 h-4 text-teal-600" />
                  <span className="hidden sm:inline">Template Excel</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-full hover:bg-slate-200 transition-colors font-bold text-xs uppercase tracking-wider"
                >
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline">Import Excel</span>
                </button>
                <button
                  onClick={() => setIsExportModalOpen(true)}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-full hover:bg-slate-200 transition-colors font-bold text-xs uppercase tracking-wider"
                >
                  <FileSpreadsheet className="w-4 h-4 text-teal-600" />
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

            <div className="bg-white rounded-xl border border-slate-200 flex-1 overflow-hidden flex flex-col">
              <div className="overflow-y-auto flex-1">
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
                          <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                            u.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button 
                            onClick={() => openResetPasswordModal(u)}
                            className="px-3.5 py-1.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 text-xs font-bold rounded-xl transition-all border border-slate-200/80 hover:border-teal-200 flex items-center gap-1.5 mx-auto cursor-pointer"
                          >
                            <Key className="w-3.5 h-3.5 text-teal-600" />
                            <span>Reset Password</span>
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
                      Fitur KOKSI
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Pindai atau masukkan kode barcode pengambilan barang karyawan (PT. Siemens Indonesia & PT. SIM) untuk verifikasi instan.
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
                        <Camera className="w-4 h-4 animate-pulse" />
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
                      placeholder="Contoh: KOKSI-PKP-1002"
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
                    <li>Barcode Karyawan berisi format ID unik, contohnya: <span className="font-mono font-bold">KOKSI-PKP-1002</span>.</li>
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
                            #KOKSI-PKP-{ord.id}
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
                            setScannedBarcodeInput(`KOKSI-PKP-${ord.id}`);
                            executeVerifyBarcode(`KOKSI-PKP-${ord.id}`);
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
                  Fitur KOKSI PT. Siemens Indonesia & PT. SIM &bull; Server Auto-Sync
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
                  <option value="Dibatalkan">Dibatalkan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Catatan / Instruksi untuk Karyawan
                </label>
                <textarea
                  rows={3}
                  placeholder="Contoh: Silakan di ambil di Koperasi KOKSI PT. Siemens Indonesia jam 12:00 WIB"
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
                  <p className="text-[11px] text-slate-500 font-medium">Konfirmasi Otomatis Pengambilan Barang KOKSI</p>
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
                    placeholder="Contoh: KOKSI-PKP-1002"
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
                  <p className="text-[11px] text-slate-500 font-medium">Export Excel Laporan KOKSI PT. Siemens Indonesia (PT SIM)</p>
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
              {/* Select Month and Year */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-teal-600" />
                    <span>Bulan Tarikan</span>
                  </label>
                  <select
                    value={exportMonth}
                    onChange={(e) => setExportMonth(parseInt(e.target.value))}
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
                    onChange={(e) => setExportYear(parseInt(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value={2026}>2026</option>
                    <option value={2025}>2025</option>
                    <option value={2024}>2024</option>
                  </select>
                </div>
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
                  const matchPt = exportPtFilter === 'Semua' || (o.user?.pt || '').toLowerCase() === exportPtFilter.toLowerCase();
                  const matchSt = exportStatusFilter === 'Semua' || (o.status || 'Menunggu Konfirmasi').toLowerCase() === exportStatusFilter.toLowerCase();
                  return matchM && matchY && matchPt && matchSt;
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
                <p className="font-extrabold text-slate-800 uppercase tracking-wider mb-1">Fitur Format Excel Professional KOKSI:</p>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>Header Logo & Brand KOKSI</span>
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
    </div>
  );
};
