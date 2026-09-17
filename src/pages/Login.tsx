import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, UserPlus, ArrowRight, ShieldCheck, UserCheck, Wrench, KeyRound, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
import { BelanjainLogo } from '../components/BelanjainLogo';

export const Login = () => {
  const [no_hp, setNoHp] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const [showDemoAccounts, setShowDemoAccounts] = useState(true);

  const isAnyLoading = loadingRole !== null;

  const executeLogin = async (
    phoneToUse: string,
    passToUse: string,
    roleKey: string,
    attempt = 1
  ): Promise<void> => {
    const activePhone = phoneToUse.trim();
    const activePass = passToUse;

    if (!activePhone || !activePass) {
      setError('Nomor HP dan password wajib diisi.');
      setLoadingRole(null);
      return;
    }

    try {
      document.cookie = `__SECURE-aistudio_auth_flow_may_set_cookies=true; Path=/; Secure; SameSite=None; Domain=${window.location.hostname}; Partitioned; Max-Age=31536000;`;
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ no_hp: activePhone, password: activePass }),
      });

      const rawText = await res.text();

      // Deteksi jika respon adalah HTML (berasal dari sistem keamanan proxy AI Studio yang mencegat API)
      if (rawText && rawText.toLowerCase().includes('<html')) {
        if (window.self !== window.top) {
          setError('PROXY_IFRAME_ERROR');
        } else {
          setError('Sesi keamanan kadaluarsa. Silakan muat ulang (Refresh) halaman ini.');
        }
        return;
      }

      let data: any = null;
      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch {
        data = null;
      }

      if (!res.ok) {
        // AI Studio proxy auth-bridge redirect converts POST to GET, returning 404 from our server. 
        // If this happens, it means the proxy just refreshed the session, so a retry will succeed.
        if ((res.status === 502 || res.status === 503 || res.status === 504 || res.status === 404 || res.status === 409) && attempt <= 4) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 600));
          return executeLogin(activePhone, activePass, roleKey, attempt + 1);
        }
        throw new Error(data?.error || (res.status === 401 ? 'Nomor HP atau password tidak sesuai.' : 'Gagal terhubung ke server. Silakan coba kembali.'));
      }

      if (data && data.token && data.user) {
        login(data.token, data.user);
        if (data.user.role === 'admin') {
          navigate('/admin');
        } else if (data.user.role === 'it') {
          navigate('/it-dashboard');
        } else {
          navigate('/dashboard');
        }
        return;
      }

      throw new Error(data?.error || 'Respons dari server tidak valid atau sesi kadaluarsa. Silakan coba kembali.');
    } catch (err: any) {
      if ((err.name === 'TypeError' || err.message?.includes('fetch') || err.message?.includes('network')) && attempt <= 4) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 600));
        return executeLogin(activePhone, activePass, roleKey, attempt + 1);
      }
      setError(err.message || 'Terjadi kendala saat login. Silakan coba kembali.');
    } finally {
      setLoadingRole(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoadingRole('form');
    await executeLogin(no_hp, password, 'form');
  };

  const handleQuickLogin = async (phone: string, pass: string, roleKey: string) => {
    setNoHp(phone);
    setPassword(pass);
    setError('');
    setLoadingRole(roleKey);
    await executeLogin(phone, pass, roleKey);
  };

  const fillFormOnly = (phone: string, pass: string) => {
    setNoHp(phone);
    setPassword(pass);
    setError('');
  };

  return (
    <div className="min-h-screen overflow-y-auto overflow-x-hidden bg-slate-50 flex flex-col justify-between p-3 sm:p-5 w-full max-w-full">
      {/* Header Logo: Belanjain */}
      <header className="w-full flex justify-center items-center max-w-md sm:max-w-lg mx-auto pt-2 shrink-0">
        <BelanjainLogo size="md" showSubtitle={true} />
      </header>

      {/* Login Card Main Content */}
      <main className="w-full max-w-md mx-auto my-auto py-3 shrink-0">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
            Masuk ke Akun Belanja
          </h2>
          <p className="text-xs text-slate-500 mt-1">Platform Belanja Pegawai PT. Siemens Indonesia</p>
        </div>

        <div className="mt-4 bg-white py-5 px-4 sm:px-7 shadow-sm rounded-2xl border border-slate-200">
          <form className="space-y-3.5 sm:space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="no_hp" className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                No HP
              </label>
              <input
                id="no_hp"
                name="no_hp"
                type="text"
                required
                value={no_hp}
                onChange={(e) => setNoHp(e.target.value)}
                autoComplete="tel"
                placeholder="Contoh: 081234567890"
                data-testid="input-phone"
                className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  data-testid="input-password"
                  className="appearance-none block w-full px-3 py-2 pr-10 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error === 'PROXY_IFRAME_ERROR' ? (
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl text-sm leading-snug">
                <p className="font-semibold text-orange-800 mb-2">⚠️ Akses Keamanan Terblokir</p>
                <p className="text-orange-700 mb-3 text-xs sm:text-sm">
                  Browser Anda memblokir sesi login karena aplikasi berjalan di dalam layar Preview (iFrame).
                </p>
                <button 
                  type="button"
                  onClick={() => window.open(window.location.href, '_blank')}
                  className="w-full bg-orange-600 text-white font-medium py-2 rounded-lg hover:bg-orange-700 transition-colors shadow-sm cursor-pointer"
                >
                  Buka di Tab Baru (Disarankan)
                </button>
              </div>
            ) : error ? (
              <div data-testid="error-message" className="text-red-600 bg-red-50 border border-red-200 p-2.5 rounded-xl text-xs sm:text-sm font-medium leading-snug">
                {error}
              </div>
            ) : null}

            <div>
              <button
                type="submit"
                disabled={isAnyLoading}
                data-testid="btn-login"
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {loadingRole === 'form' ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Memverifikasi Akun...
                  </>
                ) : (
                  'Masuk'
                )}
              </button>
            </div>
          </form>

          <div className="mt-4 text-center space-y-3">
             <Link
               to="/register"
               className="w-full inline-flex justify-center items-center py-2 px-4 border border-teal-600 rounded-xl text-xs sm:text-sm font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors"
             >
               <UserPlus className="w-4 h-4 mr-1.5" />
               Daftar Akun Baru
             </Link>

              <p className="text-xs font-medium text-slate-600">
                Lupa password? <span className="text-teal-600 font-bold cursor-pointer">Hubungi Admin</span>
              </p>

              {/* Demo Accounts Toggle Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowDemoAccounts(!showDemoAccounts)}
                  className="w-full py-2 px-3.5 bg-teal-50/80 hover:bg-teal-100/80 border border-teal-200 text-teal-800 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer shadow-xs"
                >
                  <div className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-teal-600" />
                    <span>Akun Demo Siap Pakai</span>
                    <span className="text-[10px] bg-teal-600 text-white px-2 py-0.5 rounded-full font-bold">3 Akun</span>
                  </div>
                  {showDemoAccounts ? (
                    <span className="flex items-center gap-1 text-[11px] text-teal-700 font-medium">
                      Tutup <ChevronUp className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] text-teal-700 font-medium">
                      Buka <ChevronDown className="w-3.5 h-3.5" />
                    </span>
                  )}
                </button>
              </div>

              {/* Demo Accounts List - Visible by default */}
              {showDemoAccounts && (
                <div className="pt-3 border-t border-slate-100 text-left bg-slate-50/90 p-3.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                      Pilihan Akun Demo:
                    </p>
                    <span className="text-[10px] text-teal-700 font-bold bg-teal-100 px-2 py-0.5 rounded-md border border-teal-200">
                      1-Klik Masuk
                    </span>
                  </div>

                 {/* IT Support Demo */}
                 <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-2">
                   <div className="min-w-0">
                     <div className="flex items-center gap-1 text-[11px] font-bold text-teal-800">
                       <Wrench className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                       <span>IT Support & Systems</span>
                     </div>
                     <p className="text-[11px] text-slate-500 font-mono mt-0.5">081299998888 (it123456)</p>
                   </div>
                   <div className="flex items-center gap-1 shrink-0">
                     <button
                       type="button"
                       disabled={isAnyLoading}
                       onClick={() => fillFormOnly('081299998888', 'it123456')}
                       className="px-2 py-1 text-[10px] font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                     >
                       Isi Form
                     </button>
                     <button
                       type="button"
                       disabled={isAnyLoading}
                       onClick={() => handleQuickLogin('081299998888', 'it123456', 'it')}
                       className="px-2.5 py-1 text-[10px] font-bold text-teal-700 bg-teal-100 hover:bg-teal-200 border border-teal-300 rounded-lg transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                     >
                       {loadingRole === 'it' ? (
                         <Loader2 className="animate-spin w-3.5 h-3.5" />
                       ) : (
                         <>Masuk <ArrowRight className="w-3 h-3" /></>
                       )}
                     </button>
                   </div>
                 </div>

                 {/* Admin Demo */}
                 <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-2">
                   <div className="min-w-0">
                     <div className="flex items-center gap-1 text-[11px] font-bold text-amber-800">
                       <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                       <span>Admin Koperasi</span>
                     </div>
                     <p className="text-[11px] text-slate-500 font-mono mt-0.5">081234567890 (admin123)</p>
                   </div>
                   <div className="flex items-center gap-1 shrink-0">
                     <button
                       type="button"
                       disabled={isAnyLoading}
                       onClick={() => fillFormOnly('081234567890', 'admin123')}
                       className="px-2 py-1 text-[10px] font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                     >
                       Isi Form
                     </button>
                     <button
                       type="button"
                       disabled={isAnyLoading}
                       onClick={() => handleQuickLogin('081234567890', 'admin123', 'admin')}
                       className="px-2.5 py-1 text-[10px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                     >
                       {loadingRole === 'admin' ? (
                         <Loader2 className="animate-spin w-3.5 h-3.5" />
                       ) : (
                         <>Masuk <ArrowRight className="w-3 h-3" /></>
                       )}
                     </button>
                   </div>
                 </div>

                 {/* User Demo */}
                 <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-2">
                   <div className="min-w-0">
                     <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-800">
                       <UserCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                       <span>Karyawan / Anggota</span>
                     </div>
                     <p className="text-[11px] text-slate-500 font-mono mt-0.5">081222333444 (user123)</p>
                   </div>
                   <div className="flex items-center gap-1 shrink-0">
                     <button
                       type="button"
                       disabled={isAnyLoading}
                       onClick={() => fillFormOnly('081222333444', 'user123')}
                       className="px-2 py-1 text-[10px] font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                     >
                       Isi Form
                     </button>
                     <button
                       type="button"
                       disabled={isAnyLoading}
                       onClick={() => handleQuickLogin('081222333444', 'user123', 'user')}
                       className="px-2.5 py-1 text-[10px] font-bold text-indigo-800 bg-indigo-100 hover:bg-indigo-200 border border-indigo-300 rounded-lg transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                     >
                       {loadingRole === 'user' ? (
                         <Loader2 className="animate-spin w-3.5 h-3.5" />
                       ) : (
                         <>Masuk <ArrowRight className="w-3 h-3" /></>
                       )}
                     </button>
                   </div>
                 </div>
               </div>
             )}
          </div>
        </div>
      </main>

      <footer className="py-1 text-center text-[11px] sm:text-xs text-slate-400 shrink-0">
        &copy; {new Date().getFullYear()} BelanjaIn Saza - PT. Siemens Indonesia
      </footer>
    </div>
  );
};
