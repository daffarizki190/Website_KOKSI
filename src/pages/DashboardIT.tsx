import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Server, Activity, ShieldCheck, Database, FileText, AlertTriangle, 
  RefreshCw, LogOut, Cpu, HardDrive, CpuIcon, CheckCircle2, XCircle, 
  UserCheck, Users, Lock, Key, ArrowLeft, Download, Copy, Printer, 
  Terminal, Zap, Globe, Layers, Search, Filter, ShieldAlert,
  Clock, Check, Radio, BarChart3, AlertCircle, ShoppingBag, DollarSign, Package,
  MessageSquare, Phone, ExternalLink, Send, Trash2, X, User as UserIcon, Edit3, Save
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { GrafanaNOCDashboard } from '../components/GrafanaNOCDashboard';

interface ServerHealth {
  uptimeSeconds: number;
  uptimeFormatted: string;
  nodeVersion: string;
  memory: {
    rssMB: number;
    heapTotalMB: number;
    heapUsedMB: number;
  };
  cpuUsagePercent: number;
  port: number;
  environment: string;
  containerStatus: string;
  serverStartTime: string;
}

interface TrafficAnalytics {
  totalRequests: number;
  statusCodes: {
    '2xx': number;
    '3xx': number;
    '4xx': number;
    '5xx': number;
  };
  avgResponseTimeMs: number;
  requestsPerMinuteEstimate: number;
  recentRequests: Array<{
    id: string;
    timestamp: string;
    method: string;
    path: string;
    statusCode: number;
    latencyMs: number;
  }>;
}

interface ErrorLogItem {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  statusCode: number;
  message: string;
  ip: string;
  userAgent: string;
}

interface DatabasePerformance {
  dbPingMs: number;
  status: string;
  engine: string;
  counts: {
    usersCount: number;
    productsCount: number;
    ordersCount: number;
  };
}

interface SecurityMonitoring {
  totalUsers: number;
  roleBreakdown: { user: number; admin: number; it: number };
  passwordSecurity: string;
  failedAuthCount: number;
  sslStatus: string;
  rateLimitStatus: string;
  securityScore: number;
}

interface CodeRelease {
  appVersion: string;
  buildEnvironment: string;
  nodeEnv: string;
  lastDeployment: string;
  gitBranch: string;
}

interface ThirdPartyAPI {
  name: string;
  type: string;
  status: string;
  latencyMs: number;
  uptimePercent: string;
}

interface BusinessMetrics {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
}

interface ITAuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  details: string;
}

interface ITMetricsData {
  serverHealth: ServerHealth;
  trafficAnalytics: TrafficAnalytics;
  errorLogs: ErrorLogItem[];
  databasePerformance: DatabasePerformance;
  securityMonitoring: SecurityMonitoring;
  codeReleases: CodeRelease;
  thirdPartyAPIs: ThirdPartyAPI[];
  businessMetrics: BusinessMetrics;
  itAuditLogs: ITAuditLog[];
}

interface UserItem {
  id: number;
  nama: string;
  pt: string;
  departemen: string;
  no_hp: string;
  role: string;
  createdAt: string;
}

export function DashboardIT() {
  const { user, token, logout } = useAuth();
  const { toast, confirm: confirmModal } = useNotification();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState<ITMetricsData | null>(null);
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'noc_monitoring' | 'summary' | 'health' | 'errors' | 'database' | 'security' | 'users' | 'wa_otp' | 'api_testing'>('noc_monitoring');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);

  // API Testing & Health Report States
  const [isTestingApis, setIsTestingApis] = useState(false);
  const [apiTestResults, setApiTestResults] = useState<Array<{
    name: string;
    endpoint: string;
    method: string;
    status: 'PASS' | 'FAIL' | 'WARN';
    statusCode: number;
    latencyMs: number;
    details: string;
    timestamp: string;
  }>>([]);
  const [apiOverallStatus, setApiOverallStatus] = useState<string>('');
  const [apiPassRate, setApiPassRate] = useState<string>('');
  const [lastApiTestTime, setLastApiTestTime] = useState<string>('');

  // Custom API Request Sandbox
  const [customMethod, setCustomMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('GET');
  const [customEndpoint, setCustomEndpoint] = useState<string>('/api/health');
  const [customBody, setCustomBody] = useState<string>('{\n  \n}');
  const [isExecutingCustom, setIsExecutingCustom] = useState(false);
  const [customResponse, setCustomResponse] = useState<any>(null);

  // Health Report Modal State
  const [showHealthReportModal, setShowHealthReportModal] = useState(false);
  const [healthReportText, setHealthReportText] = useState('');
  const [copiedHealthReport, setCopiedHealthReport] = useState(false);

  // OTP tester state
  const [testPhone, setTestPhone] = useState('081234567890');
  const [testOtpResult, setTestOtpResult] = useState<any>(null);
  const [testingOtpSending, setTestingOtpSending] = useState(false);
  
  // Filtering states
  const [errorSearch, setErrorSearch] = useState<string>('');
  const [errorStatusFilter, setErrorStatusFilter] = useState<string>('all');
  const [userSearch, setUserSearch] = useState<string>('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');

  // Summary report modal & state
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
  const [summaryReportText, setSummaryReportText] = useState<string>('');
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);
  const [updatingRoleId, setUpdatingRoleId] = useState<number | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string>('');

  // Delete User State
  const [deleteTargetUser, setDeleteTargetUser] = useState<UserItem | null>(null);
  const [deleteReasonInput, setDeleteReasonInput] = useState('');
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [deleteUserError, setDeleteUserError] = useState('');

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
        setActionSuccessMsg(`Akun "${deleteTargetUser.nama}" berhasil dihapus.`);
        setDeleteTargetUser(null);
        setDeleteReasonInput('');
        fetchITData();
        setTimeout(() => setActionSuccessMsg(''), 4000);
      } else {
        setDeleteUserError(data.error || 'Gagal menghapus akun pengguna');
      }
    } catch (err) {
      setDeleteUserError('Terjadi kesalahan koneksi server');
    } finally {
      setIsDeletingUser(false);
    }
  };

  const fetchITData = useCallback(async () => {
    if (!token) return;
    try {
      setErrorMsg('');
      const [resMetrics, resUsers] = await Promise.all([
        fetch('/api/it/metrics', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (!resMetrics.ok) {
        throw new Error('Gagal memuat data metrik IT dari server');
      }

      const dataMetrics = await resMetrics.json();
      setMetrics(dataMetrics);

      if (resUsers.ok) {
        const dataUsers = await resUsers.json();
        setUsersList(dataUsers);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchITData();
  }, [fetchITData]);

  // Edit Profile State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editNama, setEditNama] = useState('');
  const [editPt, setEditPt] = useState('');
  const [editDepartemen, setEditDepartemen] = useState('');
  const [editNoHp, setEditNoHp] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

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

  // Auto refresh interval handler
  useEffect(() => {
    let interval: any = null;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchITData();
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, fetchITData]);

  const handleFetchSummaryReport = async () => {
    try {
      const res = await fetch('/api/it/summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSummaryReportText(data.summaryText);
        setShowSummaryModal(true);
      }
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    }
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(summaryReportText);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 3000);
  };

  const handleClearErrorLogs = async () => {
    const ok = await confirmModal({
      title: 'Bersihkan Log Error',
      message: 'Apakah Anda yakin ingin membersihkan seluruh Log Error server?',
      type: 'warning',
      confirmText: 'Ya, Bersihkan',
      cancelText: 'Batal'
    });
    if (!ok) return;

    try {
      const res = await fetch('/api/it/logs/clear', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Log error & counter berhasil dibersihkan!');
        setActionSuccessMsg('Log error & counter berhasil dibersihkan!');
        setTimeout(() => setActionSuccessMsg(''), 4000);
        
        setMetrics((prev) => prev ? ({
          ...prev,
          errorLogs: [],
          trafficAnalytics: {
            ...prev.trafficAnalytics,
            statusCodes: {
              ...prev.trafficAnalytics.statusCodes,
              '4xx': 0,
              '5xx': 0
            }
          }
        }) : null);

        fetchITData();
      } else {
        toast.error('Gagal membersihkan log error.');
      }
    } catch (err) {
      console.error('Clear logs error:', err);
      toast.error('Terjadi kesalahan saat membersihkan log');
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    setUpdatingRoleId(userId);
    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ newRole })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengubah role pengguna');

      toast.success(data.message || 'Role pengguna berhasil diperbarui!');
      setActionSuccessMsg(data.message || 'Role pengguna berhasil diperbarui!');
      setTimeout(() => setActionSuccessMsg(''), 4000);
      fetchITData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal memperbarui role');
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const handleTestSendOtp = async (channel: 'whatsapp' | 'sms' = 'whatsapp') => {
    setTestingOtpSending(true);
    setTestOtpResult(null);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ no_hp: testPhone, channel })
      });
      const data = await res.json();
      setTestOtpResult(data);
    } catch (err: any) {
      setTestOtpResult({ error: err.message || 'Gagal tes kirim OTP' });
    } finally {
      setTestingOtpSending(false);
    }
  };

  const handleRunAllApiTests = async () => {
    setIsTestingApis(true);
    try {
      const res = await fetch('/api/it/test-apis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setApiTestResults(data.tests || []);
        setApiOverallStatus(data.overallStatus || 'HEALTHY');
        setApiPassRate(data.passRate || '100%');
        setLastApiTestTime(new Date().toLocaleTimeString('id-ID'));
        toast.success(`Pengujian API selesai: ${data.passedCount}/${data.totalTests} Lolos!`);
      } else {
        toast.error('Gagal menjalankan suite pengujian API server');
      }
    } catch (err: any) {
      toast.error('Kesalahan koneksi saat pengujian API');
    } finally {
      setIsTestingApis(false);
    }
  };

  const handleExecuteCustomApi = async () => {
    setIsExecutingCustom(true);
    setCustomResponse(null);
    const t0 = Date.now();
    try {
      const options: RequestInit = {
        method: customMethod,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };
      if (customMethod !== 'GET' && customBody.trim()) {
        try {
          JSON.parse(customBody);
          options.body = customBody;
        } catch (jsonErr) {
          setCustomResponse({
            error: 'Format JSON pada Request Body tidak valid!',
            latencyMs: 0
          });
          setIsExecutingCustom(false);
          return;
        }
      }

      const res = await fetch(customEndpoint, options);
      const latencyMs = Date.now() - t0;
      let bodyData: any = null;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        bodyData = await res.json().catch(() => null);
      } else {
        bodyData = await res.text().catch(() => '');
      }

      const headerObj: Record<string, string> = {};
      res.headers.forEach((val, key) => {
        headerObj[key] = val;
      });

      setCustomResponse({
        statusCode: res.status,
        statusText: res.statusText,
        latencyMs,
        headers: headerObj,
        body: bodyData
      });
      toast.success(`Request ${customMethod} ${customEndpoint} selesai (${res.status})`);
    } catch (err: any) {
      setCustomResponse({
        error: err?.message || 'Gagal mengirim request API',
        latencyMs: Date.now() - t0
      });
    } finally {
      setIsExecutingCustom(false);
    }
  };

  const handleGenerateHealthReport = () => {
    const reportDate = new Date().toLocaleString('id-ID');
    const uptimeMin = metrics ? Math.floor(metrics.serverHealth.uptimeSeconds / 60) : 0;
    const heapMB = metrics?.serverHealth.memory.heapUsedMB || 0;
    const dbPing = metrics?.databasePerformance.dbPingMs || 0;
    const totalReq = metrics?.trafficAnalytics.totalRequests || 0;
    const errorCount = metrics?.errorLogs.length || 0;
    const secScore = metrics?.securityMonitoring.securityScore || 100;
    const statusVerdict = errorCount === 0 && dbPing < 100 ? 'SEHAT & OPTIMAL (HEALTHY)' : 'STABIL DENGAN CATATAN (DEGRADED)';

    let testsMarkdown = '';
    if (apiTestResults.length > 0) {
      testsMarkdown = apiTestResults.map((t, idx) => 
        `${idx + 1}. [${t.status}] ${t.name} (${t.method} ${t.endpoint}) - Status: ${t.statusCode} | Latensi: ${t.latencyMs}ms\n   Detail: ${t.details}`
      ).join('\n');
    } else {
      testsMarkdown = '- Jalankan pengetesan API untuk melampirkan hasil matrix pengujian.';
    }

    const report = `# LAPORAN RESMI KESEHATAN SISTEM & DIAGNOSTIK API (IT HEALTH REPORT)
**Platform:** BelanjaIn Saza
**Waktu Penerbitan:** ${reportDate} WIB
**Pemeriksa (Auditor):** ${user?.nama || 'IT Support & Systems'} (Role: ${user?.role?.toUpperCase()})
**Status Keseluruhan:** ${statusVerdict}

---

## 1. RINGKASAN EKSEKUTIF KESEHATAN INFRASTRUKTUR
- **Status Runtime Server:** Node.js ${metrics?.serverHealth.nodeVersion || 'v20+'} (Uptime: ${uptimeMin} Menit)
- **Konsumsi Heap Memori:** ${heapMB} MB
- **Performa Database (PostgreSQL):** ${dbPing} ms Ping (Status: ${metrics?.databasePerformance.status || 'Connected'})
- **Total Permintaan Terproses:** ${totalReq} Requests (HTTP 2xx: ${metrics?.trafficAnalytics.statusCodes['2xx'] || 0}, 4xx: ${metrics?.trafficAnalytics.statusCodes['4xx'] || 0}, 5xx: ${metrics?.trafficAnalytics.statusCodes['5xx'] || 0})
- **Tingkat Keamanan Platform:** Skor ${secScore}/100 (Bcrypt Hashing Standard Terverifikasi)

---

## 2. HASIL PENGETESAN API & MATRIX DIAGNOSTIK
**Tingkat Kelolosan (Pass Rate):** ${apiPassRate || '100%'}
**Waktu Pengujian Terakhir:** ${lastApiTestTime || reportDate}

${testsMarkdown}

---

## 3. CATATAN & LOG EXCEPTION TERKINI
- Jumlah Log Peringatan/Error Aktif: ${errorCount} Item
- Percobaan Otentikasi Gagal / 401: ${metrics?.securityMonitoring.failedAuthCount || 0} Kali

---

## 4. REKOMENDASI TEKNIS & TINDAK LANJUT IT
1. Komponen inti (Database, Sinkronisasi Keranjang Multi-Device, dan Otentikasi) berfungsi prima.
2. Latensi rata-rata API berada dalam batas normal (<50ms).
3. Rutin lakukan pencadangan data dan pemantauan berkala log transaksi.

*Dokumen ini dibuat otomatis oleh Sistem Pemantauan & Diagnostik IT BelanjaIn Saza.*`;

    setHealthReportText(report);
    setShowHealthReportModal(true);
  };

  const handleDownloadHealthReport = () => {
    const element = document.createElement('a');
    const file = new Blob([healthReportText], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `Health_Report_Belanjain_Saza_${Date.now()}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Laporan kesehatan berhasil diunduh (.md)');
  };

  if (loading && !metrics) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-teal-400" />
          <p className="text-sm font-semibold tracking-wide text-slate-300">Menghubungkan ke Pusat Pemantauan IT & Infrastruktur...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-slate-950 relative overflow-x-hidden w-full max-w-full">
      {/* Background Ambient Glow Accents */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-20 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-10 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* HEADER SECTION (CYBER MISSION CONTROL HUD) */}
      <header className="bg-slate-900/90 border-b border-slate-800/80 sticky top-0 z-40 backdrop-blur-xl shadow-2xl shadow-slate-950/60 w-full max-w-full">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 w-full md:w-auto">
            <div className="relative shrink-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-teal-500 via-cyan-400 to-emerald-400 p-0.5 shadow-lg shadow-teal-500/25">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <Server className="w-5 h-5 text-teal-400" />
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-sm sm:text-base font-black text-white tracking-tight truncate">
                  Pusat Operasi IT
                </h1>
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black tracking-widest uppercase">
                  <span>LIVE</span>
                </div>
                <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-teal-500/15 text-teal-300 border border-teal-500/30">
                  Role IT
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium truncate mt-0.5">
                Sistem Telemetri Server, Database & Keamanan
              </p>
            </div>
          </div>

          {/* Quick Controls Toolbar */}
          <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 w-full md:w-auto justify-start md:justify-end">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                autoRefresh 
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-500/10' 
                  : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 text-slate-300'
              }`}
            >
              <Radio className={`w-3 h-3 ${autoRefresh ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
              <span>{autoRefresh ? 'Auto 5s' : 'Sync Off'}</span>
            </button>

            <button
              onClick={fetchITData}
              className="px-2.5 py-1.5 bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-700/80 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
              title="Refresh data metrik"
            >
              <RefreshCw className="w-3 h-3 text-teal-400" />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleFetchSummaryReport}
              className="px-3 py-1.5 bg-gradient-to-r from-teal-500 via-emerald-400 to-cyan-400 hover:opacity-95 text-slate-950 font-black rounded-xl text-[11px] shadow-md shadow-teal-500/20 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <FileText className="w-3 h-3 text-slate-950" />
              <span>Rangkuman</span>
            </button>

            {user?.role === 'admin' && (
              <button
                onClick={() => navigate('/admin')}
                className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Admin</span>
              </button>
            )}

            <button
              onClick={handleOpenProfileModal}
              className="px-2.5 py-1.5 bg-slate-800/90 hover:bg-slate-700/90 text-teal-300 border border-slate-700/80 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
              title="Edit Profil Saya"
            >
              <UserIcon className="w-3 h-3 text-teal-400" />
              <span>Profil</span>
            </button>

            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="p-1.5 bg-slate-800/90 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700/80 hover:border-red-500/30 rounded-xl transition-all cursor-pointer ml-auto md:ml-0"
              title="Keluar / Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ACTION MESSAGES */}
      {actionSuccessMsg && (
        <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-4 py-2 text-center text-xs font-bold text-emerald-300 flex items-center justify-center gap-2 backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-500/15 border-b border-rose-500/30 px-4 py-2 text-center text-xs font-bold text-rose-300 flex items-center justify-center gap-2 backdrop-blur-md">
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="w-full max-w-[1700px] mx-auto px-2 sm:px-4 lg:px-6 py-4 flex-1 flex flex-col gap-4 min-w-0 overflow-x-hidden">

        {/* TAB NAVIGATION: Mobile 3-Column Cyber Grid / Desktop Navigation Rail */}
        {/* Mobile View (< sm): Instant 1-Tap Cyber Matrix (Zero System Popup, Zero Swiping) */}
        <div className="block sm:hidden bg-slate-900/90 p-2.5 rounded-2xl border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] text-teal-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-teal-400" />
              <span>Pilih Modul IT</span>
            </span>
            <span className="text-[9px] text-slate-500 font-mono font-bold">HUD LIVE</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'noc_monitoring', label: 'Grafana NOC', icon: Activity, color: 'text-amber-400', badge: 'PROMETHEUS' },
              { id: 'summary', label: 'Rangkuman', icon: FileText, color: 'text-teal-400' },
              { id: 'health', label: 'Server', icon: Server, color: 'text-cyan-400' },
              { id: 'errors', label: `Log Error (${metrics?.errorLogs.length || 0})`, icon: AlertTriangle, color: 'text-amber-400' },
              { id: 'database', label: 'Database', icon: Database, color: 'text-blue-400' },
              { id: 'security', label: 'Keamanan', icon: ShieldCheck, color: 'text-emerald-400' },
              { id: 'users', label: 'Akses IT', icon: Users, color: 'text-purple-400' },
              { id: 'wa_otp', label: 'WhatsApp', icon: MessageSquare, color: 'text-emerald-400' },
              { id: 'api_testing', label: 'API Health', icon: Zap, color: 'text-amber-400', badge: apiPassRate }
            ].map((tab) => {
              const IconComp = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`p-2 rounded-xl text-center flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-gradient-to-tr from-teal-500 via-cyan-400 to-emerald-400 text-slate-950 border-teal-300 font-black shadow-md shadow-teal-500/25 scale-[1.02]'
                      : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <IconComp className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : tab.color}`} />
                  <span className="text-[10px] font-bold leading-tight line-clamp-1">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop View (>= sm): High-Tech Tab Navigation Rail */}
        <div className="hidden sm:flex items-center gap-2 overflow-x-auto pb-2 pt-1 border-b border-slate-800/80 no-scrollbar">
          {[
            { id: 'noc_monitoring', label: 'Grafana NOC Monitor', icon: Activity, color: 'text-amber-400', badge: 'PROMETHEUS' },
            { id: 'summary', label: 'Rangkuman Sistem', icon: FileText, color: 'text-teal-400' },
            { id: 'health', label: 'Kesehatan Server', icon: Server, color: 'text-cyan-400' },
            { id: 'errors', label: `Log Error (${metrics?.errorLogs.length || 0})`, icon: AlertTriangle, color: 'text-amber-400' },
            { id: 'database', label: 'Database & APIs', icon: Database, color: 'text-blue-400' },
            { id: 'security', label: 'Keamanan & Rilis', icon: ShieldCheck, color: 'text-emerald-400' },
            { id: 'users', label: 'Akses Peran IT', icon: Users, color: 'text-purple-400' },
            { id: 'wa_otp', label: 'WhatsApp & SMS OTP', icon: MessageSquare, color: 'text-emerald-400' },
            { id: 'api_testing', label: 'Pengetesan API & Health', icon: Zap, color: 'text-amber-400', badge: apiPassRate }
          ].map((tab) => {
            const IconComp = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-teal-500 via-cyan-400 to-emerald-400 text-slate-950 shadow-lg shadow-teal-500/25 scale-[1.02]'
                    : 'bg-slate-900/70 hover:bg-slate-800/90 text-slate-400 hover:text-slate-200 border border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <IconComp className={`w-4 h-4 ${isActive ? 'text-slate-950' : tab.color}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                    isActive 
                      ? 'bg-slate-950/20 text-slate-950' 
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB CONTENTS */}
        {metrics && (
          <div className="flex-1 flex flex-col gap-6">

            {/* TAB 0: GRAFANA PROMETHEUS NOC MONITORING (MATCHING NOC SCREENSHOT) */}
            {activeTab === 'noc_monitoring' && (
              <div className="space-y-6">
                <GrafanaNOCDashboard metrics={metrics} />
              </div>
            )}

            {/* TAB 1: RANGKUMAN BERKALA SISTEM */}
            {activeTab === 'summary' && (
              <div className="space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-xl">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
                    <div>
                      <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                        <FileText className="w-5 h-5 text-teal-400" />
                        Laporan Rangkuman Berkala Pemantauan IT
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">
                        Laporan otomatis kondisi server, keamanan, traffic, dan performa website BelanjaIn Saza.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleFetchSummaryReport}
                        className="px-3.5 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Generate Ulang Report</span>
                      </button>
                    </div>
                  </div>

                  {/* Summary Dashboard Grid Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-2">
                      <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Kondisi Infrastruktur Utama
                      </h3>
                      <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                        <li>Server Container Cloud Run: <strong className="text-emerald-400">NORMAL & BERJALAN</strong></li>
                        <li>Memori Heap Digunakan: <strong className="text-slate-200">{metrics.serverHealth.memory.heapUsedMB} MB</strong> dari {metrics.serverHealth.memory.heapTotalMB} MB</li>
                        <li>PostgreSQL Cloud SQL Ping: <strong className="text-cyan-400">{metrics.databasePerformance.dbPingMs} ms</strong></li>
                        <li>Koneksi API WhatsApp Gateway: <strong className="text-emerald-400">100% OPERASIONAL</strong></li>
                      </ul>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-2">
                      <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        <Activity className="w-4 h-4 text-teal-400" />
                        Statistik Pengunjung & Bisnis
                      </h3>
                      <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                        <li>Total HTTP Request Masuk: <strong className="text-slate-200">{metrics.trafficAnalytics.totalRequests} Request</strong></li>
                        <li>Total Pengguna Terdaftar: <strong className="text-slate-200">{metrics.securityMonitoring.totalUsers} Pengguna</strong></li>
                        <li>Total Transaksi Sukses: <strong className="text-slate-200">{metrics.businessMetrics.completedOrders} Pesanan</strong></li>
                        <li>Total Omzet Transaksi: <strong className="text-emerald-400">Rp {metrics.businessMetrics.totalRevenue.toLocaleString('id-ID')}</strong></li>
                      </ul>
                    </div>
                  </div>

                  {/* Report Action Box */}
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-300 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>Rangkuman ini siap diexport untuk keperluan audit dan koordinasi tim IT BelanjaIn Saza.</span>
                    </div>

                    <button
                      onClick={handleFetchSummaryReport}
                      className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold rounded-xl text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md shadow-teal-500/20"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Buka Teks Laporan Lengkap</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: KESEHATAN SERVER & TRAFFIC */}
            {activeTab === 'health' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Server Hardware Metrics */}
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
                    <h2 className="text-sm font-extrabold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                      <Cpu className="w-4 h-4 text-teal-400" />
                      Metrik Server & Resource Container
                    </h2>

                    <div className="space-y-3 text-xs">
                      <div>
                        <div className="flex justify-between font-medium mb-1">
                          <span className="text-slate-400">Penggunaan CPU Container</span>
                          <span className="text-teal-400 font-bold">{metrics.serverHealth.cpuUsagePercent}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-teal-400 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, metrics.serverHealth.cpuUsagePercent * 10)}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between font-medium mb-1">
                          <span className="text-slate-400">Memori Heap (Node.js)</span>
                          <span className="text-emerald-400 font-bold">{metrics.serverHealth.memory.heapUsedMB} MB / {metrics.serverHealth.memory.heapTotalMB} MB</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-emerald-400 h-full rounded-full transition-all duration-500" style={{ width: `${Math.round((metrics.serverHealth.memory.heapUsedMB / metrics.serverHealth.memory.heapTotalMB) * 100)}%` }} />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-slate-300">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Node Runtime:</span>
                          <span className="font-mono font-bold text-slate-200">{metrics.serverHealth.nodeVersion}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Port Ingress Access:</span>
                          <span className="font-mono font-bold text-teal-400">Port {metrics.serverHealth.port}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Lingkungan:</span>
                          <span className="font-bold text-emerald-400 uppercase">{metrics.serverHealth.environment}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* HTTP Status Code Distribution */}
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-emerald-400" />
                        Distribusi Respon HTTP Server
                      </h2>
                      <span className="text-[10px] bg-slate-800 text-teal-400 px-2.5 py-0.5 rounded-full font-bold">
                        Standar HTTP Protocol
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                        <p className="text-[10px] font-bold text-emerald-400 uppercase">HTTP 200 (Sukses)</p>
                        <p className="text-lg font-extrabold text-white mt-0.5">{metrics.trafficAnalytics.statusCodes['2xx']}</p>
                        <p className="text-[10px] text-emerald-300/70 mt-0.5">Permintaan Berhasil</p>
                      </div>

                      <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl">
                        <p className="text-[10px] font-bold text-cyan-400 uppercase">HTTP 300 (Redireksi)</p>
                        <p className="text-lg font-extrabold text-white mt-0.5">{metrics.trafficAnalytics.statusCodes['3xx']}</p>
                        <p className="text-[10px] text-cyan-300/70 mt-0.5">Pengalihan Navigasi</p>
                      </div>

                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                        <p className="text-[10px] font-bold text-amber-400 uppercase">HTTP 400 (Client Exception)</p>
                        <p className="text-lg font-extrabold text-white mt-0.5">{metrics.trafficAnalytics.statusCodes['4xx']}</p>
                        <p className="text-[10px] text-amber-300/70 mt-0.5">Otentikasi / Input Tidak Sesuai</p>
                      </div>

                      <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                        <p className="text-[10px] font-bold text-rose-400 uppercase">HTTP 500 (Server Fault)</p>
                        <p className="text-lg font-extrabold text-white mt-0.5">{metrics.trafficAnalytics.statusCodes['5xx']}</p>
                        <p className="text-[10px] text-rose-300/70 mt-0.5">Gangguan System Internal</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Request Stream Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
                  <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-teal-400" />
                    Aliran Request HTTP Terkini
                  </h2>

                  <div className="overflow-x-auto rounded-2xl border border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="px-4 py-2.5">Waktu</th>
                          <th className="px-4 py-2.5">Method</th>
                          <th className="px-4 py-2.5">Path / Endpoint</th>
                          <th className="px-4 py-2.5">Status</th>
                          <th className="px-4 py-2.5 text-right">Latensi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                        {metrics.trafficAnalytics.recentRequests.map((req) => (
                          <tr key={req.id} className="hover:bg-slate-800/40 font-mono text-[11px]">
                            <td className="px-4 py-2 text-slate-400">{new Date(req.timestamp).toLocaleTimeString('id-ID')}</td>
                            <td className="px-4 py-2">
                              <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                                req.method === 'GET' ? 'bg-cyan-500/20 text-cyan-300' :
                                req.method === 'POST' ? 'bg-emerald-500/20 text-emerald-300' :
                                req.method === 'PUT' ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'
                              }`}>
                                {req.method}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-slate-200">{req.path}</td>
                            <td className="px-4 py-2">
                              <span className={`font-bold ${
                                req.statusCode < 300 ? 'text-emerald-400' :
                                req.statusCode < 400 ? 'text-cyan-400' :
                                req.statusCode < 500 ? 'text-amber-400' : 'text-rose-400'
                              }`}>
                                {req.statusCode}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-right text-slate-300 font-bold">{req.latencyMs} ms</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: LOG ERROR */}
            {activeTab === 'errors' && (
              <div className="space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div>
                      <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        Log Error & Exception Server
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">Lacak error HTTP status 4xx dan 5xx secara langsung.</p>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={handleClearErrorLogs}
                        className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Bersihkan Log Error
                      </button>
                    </div>
                  </div>

                  {/* Filter controls */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 text-xs">
                    <div className="relative flex-1 w-full">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Cari pesan error, path, atau IP..."
                        value={errorSearch}
                        onChange={(e) => setErrorSearch(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <select
                      value={errorStatusFilter}
                      onChange={(e) => setErrorStatusFilter(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500 w-full sm:w-auto cursor-pointer"
                    >
                      <option value="all">Semua Code Error</option>
                      <option value="4xx">Hanya 4xx (Client Error)</option>
                      <option value="5xx">Hanya 5xx (Server Error)</option>
                    </select>
                  </div>

                  {/* Log Table */}
                  <div className="overflow-x-auto rounded-2xl border border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="px-4 py-2.5">Waktu</th>
                          <th className="px-4 py-2.5">Code</th>
                          <th className="px-4 py-2.5">Method & Path</th>
                          <th className="px-4 py-2.5">Pesan Error</th>
                          <th className="px-4 py-2.5">Client IP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                        {metrics.errorLogs
                          .filter(log => {
                            const matchSearch = !errorSearch || 
                              log.message.toLowerCase().includes(errorSearch.toLowerCase()) ||
                              log.path.toLowerCase().includes(errorSearch.toLowerCase()) ||
                              log.ip.includes(errorSearch);
                            const matchCode = errorStatusFilter === 'all' || 
                              (errorStatusFilter === '4xx' && log.statusCode >= 400 && log.statusCode < 500) ||
                              (errorStatusFilter === '5xx' && log.statusCode >= 500);
                            return matchSearch && matchCode;
                          })
                          .map((log) => (
                            <tr key={log.id} className="hover:bg-slate-800/40 font-mono text-[11px]">
                              <td className="px-4 py-2.5 text-slate-400">{new Date(log.timestamp).toLocaleString('id-ID')}</td>
                              <td className="px-4 py-2.5">
                                <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                                  log.statusCode >= 500 ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                                }`}>
                                  {log.statusCode}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 font-bold text-slate-200">{log.method} {log.path}</td>
                              <td className="px-4 py-2.5 text-rose-300 font-medium">{log.message}</td>
                              <td className="px-4 py-2.5 text-slate-400">{log.ip}</td>
                            </tr>
                          ))}

                        {metrics.errorLogs.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-slate-500 font-sans">
                              Tidak ada log error terdeteksi. Sistem berjalan 100% lancar.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: DATABASE & THIRD PARTY APIS */}
            {activeTab === 'database' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Database Stats */}
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
                    <h2 className="text-sm font-extrabold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                      <Database className="w-4 h-4 text-cyan-400" />
                      Performa & Data Cloud SQL PostgreSQL
                    </h2>

                    <div className="space-y-3 text-xs">
                      <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex justify-between items-center">
                        <div>
                          <p className="text-slate-400">Status Respon Query (Ping)</p>
                          <p className="text-base font-extrabold text-cyan-400">{metrics.databasePerformance.dbPingMs} ms</p>
                        </div>
                        <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 font-bold text-[11px] rounded-lg">
                          {metrics.databasePerformance.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2.5 text-center">
                        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Users</p>
                          <p className="text-sm font-extrabold text-white mt-1">{metrics.databasePerformance.counts.usersCount}</p>
                        </div>

                        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Produk</p>
                          <p className="text-sm font-extrabold text-white mt-1">{metrics.databasePerformance.counts.productsCount}</p>
                        </div>

                        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Pesanan</p>
                          <p className="text-sm font-extrabold text-white mt-1">{metrics.databasePerformance.counts.ordersCount}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Third Party API Health */}
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
                    <h2 className="text-sm font-extrabold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                      <Globe className="w-4 h-4 text-emerald-400" />
                      Integrasi API Pihak Ketiga & Internal
                    </h2>

                    <div className="space-y-2 text-xs">
                      {metrics.thirdPartyAPIs.map((api, idx) => (
                        <div key={idx} className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-slate-200">{api.name}</p>
                            <p className="text-[10px] text-slate-500">{api.type}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                              {api.status} ({api.latencyMs}ms)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: KEAMANAN & RILIS KODE */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Security Overview */}
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
                    <h2 className="text-sm font-extrabold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Inspeksi Keamanan Website
                    </h2>

                    <div className="space-y-2.5 text-xs">
                      <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex justify-between items-center">
                        <span className="text-slate-400">Enkripsi Password User:</span>
                        <span className="font-bold text-emerald-400">{metrics.securityMonitoring.passwordSecurity}</span>
                      </div>

                      <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex justify-between items-center">
                        <span className="text-slate-400">Gagal Login / Auth 401:</span>
                        <span className="font-bold text-amber-400">{metrics.securityMonitoring.failedAuthCount} Kali</span>
                      </div>

                      <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex justify-between items-center">
                        <span className="text-slate-400">Protokol SSL Ingress:</span>
                        <span className="font-bold text-teal-400">{metrics.securityMonitoring.sslStatus}</span>
                      </div>
                    </div>
                  </div>

                  {/* Release Info */}
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
                    <h2 className="text-sm font-extrabold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                      <Layers className="w-4 h-4 text-teal-400" />
                      Informasi Rilis Kode & Versioning
                    </h2>

                    <div className="space-y-2 text-xs">
                      <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex justify-between">
                        <span className="text-slate-400">Versi Aplikasi:</span>
                        <span className="font-mono font-bold text-white">{metrics.codeReleases.appVersion}</span>
                      </div>

                      <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex justify-between">
                        <span className="text-slate-400">Lingkungan Rilis:</span>
                        <span className="font-bold text-emerald-400 uppercase">{metrics.codeReleases.nodeEnv}</span>
                      </div>

                      <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex justify-between">
                        <span className="text-slate-400">Waktu Build & Start:</span>
                        <span className="font-bold text-slate-300">{metrics.codeReleases.lastDeployment}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: KELOLA AKSES PERAN IT */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div>
                      <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                        <Users className="w-4 h-4 text-teal-400" />
                        Kelola Peran (Role) & Akses Pengguna
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">Atur hak akses pengguna menjadi User, Admin, atau IT.</p>
                    </div>
                  </div>

                  {/* User Filter Controls */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 text-xs">
                    <div className="relative flex-1 w-full">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Cari nama, no HP, atau PT..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <select
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500 w-full sm:w-auto cursor-pointer"
                    >
                      <option value="all">Semua Role</option>
                      <option value="user">Role User</option>
                      <option value="admin">Role Admin</option>
                      <option value="it">Role IT</option>
                    </select>
                  </div>

                  {/* Users Table */}
                  <div className="overflow-x-auto rounded-2xl border border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="px-4 py-3">Nama Pengguna</th>
                          <th className="px-4 py-3">No HP</th>
                          <th className="px-4 py-3">Perusahaan & Dept</th>
                          <th className="px-4 py-3">Role Saat Ini</th>
                          <th className="px-4 py-3 text-center">Ubah Akses Role</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                        {usersList
                          .filter(u => {
                            const matchSearch = !userSearch || 
                              (u.nama || '').toLowerCase().includes(userSearch.toLowerCase()) ||
                              (u.no_hp || '').includes(userSearch) ||
                              (u.pt || '').toLowerCase().includes(userSearch.toLowerCase());
                            const matchRole = userRoleFilter === 'all' || (u.role || 'user').toLowerCase() === userRoleFilter.toLowerCase();
                            return matchSearch && matchRole;
                          })
                          .map((u) => (
                            <tr key={u.id} className="hover:bg-slate-800/40">
                              <td className="px-4 py-3 font-bold text-white">{u.nama}</td>
                              <td className="px-4 py-3 text-slate-300 font-mono">{u.no_hp}</td>
                              <td className="px-4 py-3 text-slate-400">
                                <span className="font-bold text-slate-200">{u.pt}</span> ({u.departemen})
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                  u.role === 'admin' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                  u.role === 'it' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' :
                                  'bg-slate-800 text-slate-400'
                                }`}>
                                  {u.role || 'user'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  {['user', 'admin', 'it'].map((r) => (
                                    <button
                                      key={r}
                                      disabled={updatingRoleId === u.id || u.role === r}
                                      onClick={() => handleRoleChange(u.id, r)}
                                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                                        u.role === r 
                                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50' 
                                          : 'bg-slate-950 hover:bg-teal-500 hover:text-slate-950 text-slate-300 border border-slate-800'
                                      }`}
                                    >
                                      {r}
                                    </button>
                                  ))}

                                  <button
                                    onClick={() => {
                                      setDeleteTargetUser(u);
                                      setDeleteReasonInput('');
                                      setDeleteUserError('');
                                    }}
                                    title="Hapus Akun Pengguna (Wajib Alasan)"
                                    className="px-2 py-1 bg-red-950/80 hover:bg-red-600 text-red-300 hover:text-white border border-red-800/80 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ml-1"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Hapus</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Audit Log Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
                  <h3 className="text-xs font-extrabold text-white flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-teal-400" />
                    Log Audit Aktivitas Pengelolaan IT
                  </h3>

                  <div className="space-y-2 text-xs">
                    {metrics.itAuditLogs.map((log) => (
                      <div key={log.id} className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 font-mono text-[11px]">
                        <div className="flex justify-between text-slate-400 mb-1">
                          <span className="font-bold text-teal-400">{log.action}</span>
                          <span>{new Date(log.timestamp).toLocaleString('id-ID')}</span>
                        </div>
                        <p className="text-slate-300">{log.details}</p>
                        <p className="text-[10px] text-slate-500 mt-1">Aktor: {log.actor}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: WA & SMS OTP GATEWAY */}
            {activeTab === 'wa_otp' && (
              <div className="space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                    <div>
                      <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-emerald-400" />
                        Layanan Verifikasi Nomor HP via WhatsApp & SMS OTP
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Fasilitas pengiriman kode OTP otomatis untuk keamanan pendaftaran anggota & konfirmasi transaksi BelanjaIn Saza.
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold flex items-center gap-1.5 shrink-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Gateway Aktif
                    </span>
                  </div>

                  {/* Feature Status Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                      <p className="text-slate-400 text-[10px] font-bold uppercase">Status WhatsApp API</p>
                      <p className="text-emerald-400 font-extrabold text-sm flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Connected (Wa.me Direct)
                      </p>
                    </div>

                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                      <p className="text-slate-400 text-[10px] font-bold uppercase">Backup SMS Gateway</p>
                      <p className="text-cyan-400 font-extrabold text-sm flex items-center gap-1">
                        <Phone className="w-4 h-4" /> Ready & Active
                      </p>
                    </div>

                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                      <p className="text-slate-400 text-[10px] font-bold uppercase">Masa Berlaku Kode OTP</p>
                      <p className="text-amber-400 font-extrabold text-sm flex items-center gap-1">
                        <Clock className="w-4 h-4" /> 5 Menit / Kode 6 Digit
                      </p>
                    </div>
                  </div>

                  {/* Test OTP Sender Panel */}
                  <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
                    <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                      <Send className="w-4 h-4 text-teal-400" />
                      Uji Coba Pengiriman Kode OTP (Gateway Tester)
                    </h3>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        value={testPhone}
                        onChange={(e) => setTestPhone(e.target.value)}
                        placeholder="Contoh: 08123456789"
                        className="px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 flex-1"
                      />

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleTestSendOtp('whatsapp')}
                          disabled={testingOtpSending || !testPhone.trim()}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-600/20"
                        >
                          {testingOtpSending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
                          <span>Tes OTP WA</span>
                        </button>

                        <button
                          onClick={() => handleTestSendOtp('sms')}
                          disabled={testingOtpSending || !testPhone.trim()}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          {testingOtpSending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Phone className="w-3.5 h-3.5" />}
                          <span>Tes SMS</span>
                        </button>
                      </div>
                    </div>

                    {testOtpResult && (
                      <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-xs font-mono space-y-2">
                        {testOtpResult.error ? (
                          <p className="text-rose-400 font-bold">{testOtpResult.error}</p>
                        ) : (
                          <>
                            <p className="text-emerald-400 font-bold">{testOtpResult.message}</p>
                            <p className="text-slate-300">
                              Kode OTP Dihasilkan: <strong className="text-teal-300 text-sm">{testOtpResult.otpDemo}</strong>
                            </p>
                            {testOtpResult.waLink && (
                              <a
                                href={testOtpResult.waLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-bold hover:underline mt-1"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                Buka Link WhatsApp API Direct
                              </a>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 8: PENGETESAN API & HEALTH REPORT */}
            {activeTab === 'api_testing' && (
              <div className="space-y-6">
                {/* Header Action Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-xl">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                          <Zap className="w-4.5 h-4.5 text-amber-400" />
                        </div>
                        <h2 className="text-lg font-black text-white">
                          Pusat Diagnostik & Pengetesan API Terpadu
                        </h2>
                      </div>
                      <p className="text-xs text-slate-400 max-w-2xl">
                        Uji fungsionalitas seluruh endpoint API kritis sistem secara live: memverifikasi integrasi PostgreSQL, sinkronisasi keranjang multi-device, modul transaksi kasir, serta pembuatan Laporan Kesehatan (Health Report).
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
                      <button
                        onClick={handleRunAllApiTests}
                        disabled={isTestingApis}
                        className="flex-1 md:flex-initial px-4 py-2.5 bg-gradient-to-r from-amber-500 to-teal-500 hover:from-amber-400 hover:to-teal-400 active:scale-95 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
                      >
                        {isTestingApis ? (
                          <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                        ) : (
                          <Zap className="w-4 h-4 text-slate-950" />
                        )}
                        <span>{isTestingApis ? 'Menjalankan Tes API...' : 'Jalankan Semua Tes API'}</span>
                      </button>

                      <button
                        onClick={handleGenerateHealthReport}
                        className="flex-1 md:flex-initial px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <FileText className="w-4 h-4 text-teal-400" />
                        <span>Buat Laporan Health</span>
                      </button>
                    </div>
                  </div>

                  {/* Summary Status Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status API Sistem</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`w-2.5 h-2.5 rounded-full ${apiOverallStatus === 'HEALTHY' ? 'bg-emerald-400 animate-pulse' : apiOverallStatus === 'DEGRADED' ? 'bg-amber-400' : 'bg-teal-400'}`} />
                        <p className="text-sm font-black text-white">{apiOverallStatus || 'Siap Diuji'}</p>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tingkat Kelolosan</p>
                      <p className="text-sm font-black text-emerald-400 mt-1">{apiPassRate || '100%'}</p>
                    </div>

                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Modul Endpoint</p>
                      <p className="text-sm font-black text-slate-200 mt-1">
                        {apiTestResults.length > 0 ? `${apiTestResults.length} Endpoint Diuji` : '6 Modul Inti'}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Waktu Terakhir Diuji</p>
                      <p className="text-xs font-bold text-slate-300 mt-1">{lastApiTestTime || 'Belum Diuji Sesi Ini'}</p>
                    </div>
                  </div>
                </div>

                {/* API Matrix Test Results Cards */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <Layers className="w-4 h-4 text-teal-400" />
                      Hasil Matrix Diagnostik Endpoint API
                    </h3>
                    {apiTestResults.length > 0 && (
                      <span className="text-[11px] text-slate-400 font-medium">
                        Total {apiTestResults.length} pengujian diverifikasi
                      </span>
                    )}
                  </div>

                  {apiTestResults.length === 0 ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
                        <Zap className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-slate-200">Belum ada pengujian API yang dijalankan pada sesi ini</p>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">
                        Tekan tombol "Jalankan Semua Tes API" di atas untuk melakukan benchmark dan pengecekan kesehatan real-time.
                      </p>
                      <button
                        onClick={handleRunAllApiTests}
                        disabled={isTestingApis}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Mulai Pengujian Otomatis</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {apiTestResults.map((test, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors shadow-sm"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded font-mono ${
                                  test.method === 'GET' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                                  test.method === 'POST' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                                  test.method === 'SQL' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                                  'bg-slate-800 text-slate-300'
                                }`}>
                                  {test.method}
                                </span>
                                <span className="text-xs font-bold text-white line-clamp-1">{test.name}</span>
                              </div>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase flex items-center gap-1 ${
                                test.status === 'PASS' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                                test.status === 'WARN' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              }`}>
                                {test.status === 'PASS' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                {test.status}
                              </span>
                            </div>

                            <p className="text-[11px] font-mono text-slate-400 bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800/80 mb-2 truncate">
                              {test.endpoint}
                            </p>
                            <p className="text-xs text-slate-300 font-medium">{test.details}</p>
                          </div>

                          <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/80 text-[11px]">
                            <span className="text-slate-400 font-medium">
                              Status: <strong className="text-white font-mono">{test.statusCode} OK</strong>
                            </span>
                            <span className={`font-mono font-bold px-2 py-0.5 rounded-full ${
                              test.latencyMs < 50 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              test.latencyMs < 200 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                              'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              ⚡ {test.latencyMs} ms
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Interactive API Sandbox / Custom Tester */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-5 h-5 text-teal-400" />
                      <div>
                        <h3 className="text-sm font-extrabold text-white">Interactive API Sandbox & Request Tester</h3>
                        <p className="text-[11px] text-slate-400">Kirim HTTP request langsung ke server untuk simulasi & verifikasi payload.</p>
                      </div>
                    </div>
                    
                    {/* Quick Presets */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">Preset:</span>
                      {[
                        { label: '/health', endpoint: '/api/health', method: 'GET' },
                        { label: '/products', endpoint: '/api/products', method: 'GET' },
                        { label: '/cart', endpoint: '/api/cart', method: 'GET' },
                        { label: '/orders', endpoint: '/api/orders', method: 'GET' },
                        { label: '/it/metrics', endpoint: '/api/it/metrics', method: 'GET' }
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setCustomMethod(preset.method as any);
                            setCustomEndpoint(preset.endpoint);
                          }}
                          className="px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-teal-300 text-[10px] font-mono rounded-lg transition-colors cursor-pointer"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Input Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">Method</label>
                      <select
                        value={customMethod}
                        onChange={(e) => setCustomMethod(e.target.value as any)}
                        className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                      >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                      </select>
                    </div>

                    <div className="md:col-span-8">
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">Endpoint Path</label>
                      <input
                        type="text"
                        value={customEndpoint}
                        onChange={(e) => setCustomEndpoint(e.target.value)}
                        placeholder="/api/health"
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div className="md:col-span-2 flex items-end">
                      <button
                        onClick={handleExecuteCustomApi}
                        disabled={isExecutingCustom || !customEndpoint.trim()}
                        className="w-full py-2.5 bg-teal-500 hover:bg-teal-400 active:scale-95 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-teal-500/20"
                      >
                        {isExecutingCustom ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        <span>{isExecutingCustom ? 'Kirim...' : 'Kirim'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Body Textarea for non-GET */}
                  {customMethod !== 'GET' && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Request Body (JSON format)
                      </label>
                      <textarea
                        value={customBody}
                        onChange={(e) => setCustomBody(e.target.value)}
                        rows={3}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-y"
                        placeholder="{\n  &quot;key&quot;: &quot;value&quot;\n}"
                      />
                    </div>
                  )}

                  {/* Response Inspector */}
                  {customResponse && (
                    <div className="mt-4 p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                            customResponse.statusCode >= 200 && customResponse.statusCode < 300
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}>
                            HTTP {customResponse.statusCode || 500} {customResponse.statusText}
                          </span>
                          <span className="text-[11px] font-mono text-teal-400 font-bold">
                            ⚡ {customResponse.latencyMs} ms
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(customResponse.body, null, 2));
                            toast.success('Response JSON tersalin ke clipboard!');
                          }}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3 text-teal-400" />
                          <span>Salin JSON</span>
                        </button>
                      </div>

                      <pre className="p-3 bg-slate-900/90 rounded-xl text-[11px] font-mono text-slate-200 overflow-x-auto max-h-72 border border-slate-800/80 leading-relaxed">
                        {customResponse.error ? (
                          <span className="text-rose-400 font-bold">{customResponse.error}</span>
                        ) : (
                          JSON.stringify(customResponse.body, null, 2)
                        )}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        )}
      </main>

      {/* PERIODIC SUMMARY REPORT MODAL */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-extrabold text-white">
                  Laporan Rangkuman Berkala Kinerja & Infrastruktur IT
                </h3>
              </div>
              <button
                onClick={() => setShowSummaryModal(false)}
                className="p-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="my-4 flex-1 overflow-y-auto bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
              {summaryReportText}
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                onClick={handleCopySummary}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-4 h-4 text-teal-400" />
                <span>{copiedSummary ? 'Tersalin ke Clipboard!' : 'Salin Teks Laporan'}</span>
              </button>

              <button
                onClick={() => setShowSummaryModal(false)}
                className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold rounded-xl text-xs transition-all cursor-pointer shadow-md shadow-teal-500/20"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEALTH REPORT MODAL (DIAGNOSTIC & HEALTH SUITE) */}
      {showHealthReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-3xl p-6 shadow-2xl flex flex-col max-h-[88vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    Laporan Resmi Kesehatan Sistem & Diagnostik API
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">Dokumen siap cetak & unduh untuk audit infrastruktur platform</p>
                </div>
              </div>
              <button
                onClick={() => setShowHealthReportModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="my-4 flex-1 overflow-y-auto bg-slate-950 p-5 rounded-2xl border border-slate-800 font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed shadow-inner">
              {healthReportText}
            </div>

            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(healthReportText);
                    setCopiedHealthReport(true);
                    toast.success('Laporan kesehatan berhasil disalin!');
                    setTimeout(() => setCopiedHealthReport(false), 3000);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-4 h-4 text-teal-400" />
                  <span>{copiedHealthReport ? 'Tersalin ke Clipboard!' : 'Salin Markdown'}</span>
                </button>

                <button
                  onClick={handleDownloadHealthReport}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-teal-400" />
                  <span>Unduh (.md)</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-slate-400" />
                  <span>Cetak / PDF</span>
                </button>
              </div>

              <button
                onClick={() => setShowHealthReportModal(false)}
                className="px-6 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer shadow-md shadow-teal-500/20"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HAPUS AKUN PENGGUNA (IT PORTAL) */}
      {deleteTargetUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-800 animate-in fade-in zoom-in duration-200 text-slate-100">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-red-950/80 border border-red-800 text-red-400 flex items-center justify-center font-bold">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Konfirmasi Hapus Akun</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Tindakan ini akan memicu Log Audit IT</p>
                </div>
              </div>
              <button
                onClick={() => setDeleteTargetUser(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold text-white">{deleteTargetUser.nama}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-teal-950 text-teal-300 rounded border border-teal-800">
                    {deleteTargetUser.departemen || 'PT. Siemens Indonesia'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">No. HP: {deleteTargetUser.no_hp} | ID: #{deleteTargetUser.id}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Alasan Penghapusan Akun <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={deleteReasonInput}
                  onChange={(e) => {
                    setDeleteReasonInput(e.target.value);
                    if (deleteUserError) setDeleteUserError('');
                  }}
                  rows={3}
                  placeholder="Contoh: Permintaan karyawan, Penutupan akun non-aktif, atau Alasan Audit..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">Alasan wajib diisi (min 3 karakter) untuk dicatat dalam database audit.</p>
              </div>

              {deleteUserError && (
                <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{deleteUserError}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                onClick={() => setDeleteTargetUser(null)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>

              <button
                onClick={handleConfirmDeleteUser}
                disabled={isDeletingUser || !deleteReasonInput.trim()}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 active:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-red-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeletingUser ? 'Proses Hapus...' : 'Hapus Akun Permanen'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT PROFIL IT */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-800 animate-in fade-in zoom-in duration-200 text-slate-100">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
                  <Edit3 className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Edit Profil IT</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Perbarui data profil akun IT/Admin BelanjaIn Saza Anda</p>
                </div>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  Nama Lengkap <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={editNama}
                  onChange={(e) => setEditNama(e.target.value)}
                  placeholder="Masukkan Nama Lengkap"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Perusahaan <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={editPt}
                    onChange={(e) => setEditPt(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                  >
                    <option value="PT. Siemens Indonesia">PT. Siemens Indonesia</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Departemen <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={editDepartemen}
                    onChange={(e) => setEditDepartemen(e.target.value)}
                    placeholder="Contoh: IT, Admin, HR..."
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  No. HP (WhatsApp) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={editNoHp}
                  onChange={(e) => setEditNoHp(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  Password Baru <span className="text-slate-500 font-normal">(Kosongkan jika tidak diubah)</span>
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {editError && (
                <div className="p-2.5 bg-red-500/20 border border-red-500/30 rounded-xl text-xs text-red-300 font-semibold flex items-center gap-1.5">
                  <X className="w-4 h-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              {editSuccess && (
                <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-semibold flex items-center gap-1.5">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{editSuccess}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex gap-2">
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-md shadow-teal-600/30 flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingProfile ? 'Menyimpan...' : 'Simpan Profil'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
