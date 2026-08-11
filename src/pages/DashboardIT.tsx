import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Server, Activity, ShieldCheck, Database, FileText, AlertTriangle, 
  RefreshCw, LogOut, Cpu, HardDrive, CpuIcon, CheckCircle2, XCircle, 
  UserCheck, Users, Lock, Key, ArrowLeft, Download, Copy, Printer, 
  Terminal, Zap, Globe, Layers, Search, Filter, ShieldAlert,
  Clock, Check, Radio, BarChart3, AlertCircle, ShoppingBag, DollarSign, Package,
  MessageSquare, Phone, ExternalLink, Send
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

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
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState<ITMetricsData | null>(null);
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'summary' | 'health' | 'errors' | 'database' | 'security' | 'users' | 'wa_otp'>('summary');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);

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
    if (!window.confirm('Apakah Anda yakin ingin membersihkan seluruh Log Error server?')) return;
    try {
      const res = await fetch('/api/it/logs/clear', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
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
        alert('Gagal membersihkan log error.');
      }
    } catch (err) {
      console.error('Clear logs error:', err);
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

      setActionSuccessMsg(data.message || 'Role pengguna berhasil diperbarui!');
      setTimeout(() => setActionSuccessMsg(''), 4000);
      fetchITData();
    } catch (err: any) {
      alert(err.message);
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-slate-950">
      {/* HEADER SECTION */}
      <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 p-0.5 shadow-lg shadow-teal-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Server className="w-5 h-5 text-teal-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-white tracking-tight">
                  Pusat Pemantauan Infrastruktur IT
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  Role IT
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Pemantauan Server, Traffic, Database, Log Error, Keamanan & Akses Peran
              </p>
            </div>
          </div>

          {/* Quick Controls */}
          <div className="flex items-center flex-wrap gap-2.5 w-full md:w-auto justify-end">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 cursor-pointer ${
                autoRefresh 
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-xs' 
                  : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-pulse text-emerald-400' : 'text-slate-400'}`} />
              <span>Auto-Refresh (5s): {autoRefresh ? 'AKTIF' : 'NONAKTIF'}</span>
            </button>

            <button
              onClick={fetchITData}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Refresh manual data metrik IT"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleFetchSummaryReport}
              className="px-3.5 py-1.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-extrabold rounded-xl text-xs shadow-md shadow-teal-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-slate-950" />
              <span>Rangkuman Berkala</span>
            </button>

            {user?.role === 'admin' && (
              <button
                onClick={() => navigate('/admin')}
                className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Dashboard Admin</span>
              </button>
            )}

            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="p-1.5 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/30 rounded-xl transition-all cursor-pointer"
              title="Keluar / Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ACTION MESSAGES */}
      {actionSuccessMsg && (
        <div className="bg-emerald-500/20 border-b border-emerald-500/30 px-4 py-2 text-center text-xs font-bold text-emerald-300 flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-500/20 border-b border-rose-500/30 px-4 py-2 text-center text-xs font-bold text-rose-300 flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col gap-6">

        {/* HIGHLIGHT KPI OVERVIEW CARDS */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {/* Server Status & Uptime */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Uptime Server</span>
                <Server className="w-4 h-4 text-teal-400" />
              </div>
              <div>
                <p className="text-base font-extrabold text-white">{metrics.serverHealth.uptimeFormatted}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] text-emerald-400 font-semibold">{metrics.serverHealth.containerStatus}</span>
                </div>
              </div>
            </div>

            {/* Traffic & Latency */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Traffic & Latensi</span>
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-base font-extrabold text-white">{metrics.trafficAnalytics.totalRequests} Request</p>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">
                  Latensi Avg: <span className="text-emerald-400 font-bold">{metrics.trafficAnalytics.avgResponseTimeMs} ms</span>
                </p>
              </div>
            </div>

            {/* Error Logs */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Log Exception / Error</span>
                <AlertCircle className={`w-4 h-4 ${metrics.errorLogs.length > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
              </div>
              <div>
                <p className="text-base font-extrabold text-white">{metrics.errorLogs.length} Terdeteksi</p>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">
                  500-599 (Server): <span className="text-rose-400 font-bold">{metrics.trafficAnalytics.statusCodes['5xx']}</span> | 400-499 (Klien): <span className="text-amber-400 font-bold">{metrics.trafficAnalytics.statusCodes['4xx']}</span>
                </p>
              </div>
            </div>

            {/* Database Health */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Performa DB</span>
                <Database className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <p className="text-base font-extrabold text-white">{metrics.databasePerformance.dbPingMs} ms Ping</p>
                <p className="text-[11px] text-cyan-400 font-medium mt-1">
                  {metrics.databasePerformance.status} ({metrics.databasePerformance.engine})
                </p>
              </div>
            </div>

            {/* Security Score */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between col-span-2 md:col-span-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Skor Keamanan</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-base font-extrabold text-emerald-400">{metrics.securityMonitoring.securityScore}/100</p>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">SANGAT AMAN</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">
                  SSL: {metrics.securityMonitoring.sslStatus.split(' ')[0]} | Bcrypt 10
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB NAVIGATION BAR */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800 no-scrollbar">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'summary'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800/80'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Rangkuman Berkala Sistem</span>
          </button>

          <button
            onClick={() => setActiveTab('health')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'health'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800/80'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Kesehatan Server & Traffic</span>
          </button>

          <button
            onClick={() => setActiveTab('errors')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'errors'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800/80'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Log Error ({metrics?.errorLogs.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'database'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800/80'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Database & API Pihak Ketiga</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'security'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800/80'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Keamanan & Rilis Kode</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'users'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800/80'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Kelola Akses Peran IT</span>
          </button>

          <button
            onClick={() => setActiveTab('wa_otp')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'wa_otp'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800/80'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>Verifikasi WhatsApp & SMS</span>
          </button>
        </div>

        {/* TAB CONTENTS */}
        {metrics && (
          <div className="flex-1 flex flex-col gap-6">

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
                        Laporan otomatis kondisi server, keamanan, traffic, dan performa website KOKSI.
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
                      <span>Rangkuman ini siap diexport untuk keperluan audit dan koordinasi tim IT KOKSI.</span>
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
                        Fasilitas pengiriman kode OTP otomatis untuk keamanan pendaftaran anggota KOKSI & konfirmasi transaksi.
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold flex items-center gap-1.5 shrink-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
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
    </div>
  );
}
