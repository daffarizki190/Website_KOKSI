import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { BelanjainLogo } from '../components/BelanjainLogo';

export const Register = () => {
  const [formData, setFormData] = useState({
    nama: '',
    pt: 'PT. Siemens Indonesia',
    departemen: '',
    no_hp: '',
    password: '',
    confirmPassword: '',
  });

  // OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpDemoCode, setOtpDemoCode] = useState('');
  const [waLink, setWaLink] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpMsg, setOtpMsg] = useState('');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const navigate = useNavigate();

  const calculatePasswordScore = (pass: string) => {
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    return score;
  };
  
  const passwordScore = calculatePasswordScore(formData.password);
  const passwordProgress = (passwordScore / 3) * 100;
  
  let progressColor = 'bg-slate-200';
  if (passwordScore === 1) progressColor = 'bg-red-500';
  else if (passwordScore === 2) progressColor = 'bg-yellow-500';
  else if (passwordScore === 3) progressColor = 'bg-teal-500';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === 'no_hp') {
      setIsPhoneVerified(false);
      setOtpSent(false);
      setOtpMsg('');
    }
  };

  const handleSendOtp = async (channel: 'whatsapp' | 'sms' = 'whatsapp') => {
    setError('');
    setOtpMsg('');

    const cleanNoHp = formData.no_hp.trim().replace(/[\s-]/g, '');
    if (!/^[0-9]{9,15}$/.test(cleanNoHp)) {
      setError('Nomor HP tidak valid. Masukkan 9 - 15 digit angka terlebih dahulu.');
      return;
    }

    setSendingOtp(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ no_hp: cleanNoHp, channel }),
      });

      const rawText = await res.text();

      // Deteksi jika respon adalah HTML (berasal dari sistem keamanan proxy AI Studio yang mencegat API)
      if (rawText && rawText.toLowerCase().includes('<html')) {
        if (window.self !== window.top) { setError('PROXY_IFRAME_ERROR'); } else { setError('Sesi keamanan kadaluarsa. Silakan muat ulang (Refresh) halaman ini.'); }
        return;
      }

      let data: any = null;
      try {
        data = JSON.parse(rawText);
      } catch {
        data = null;
      }
      if (!res.ok) throw new Error(data?.error || 'Gagal mengirim OTP');

      setOtpSent(true);
      setOtpDemoCode(data.otpDemo || data.otpCode);
      setWaLink(data.waLink);
      setOtpMsg(data.message);

      // Auto-fill code into input box so user can verify with 1 click
      if (data.otpDemo || data.otpCode) {
        setOtpCode(data.otpDemo || data.otpCode);
      }

      // If not sent directly by background server API, trigger WhatsApp window automatically
      if (!data.sentDirectly && data.waLink) {
        try {
          window.open(data.waLink, '_blank');
        } catch (e) {
          console.log('Window popup blocked or handled');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mengirimkan kode verifikasi OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    if (!otpCode.trim()) {
      setError('Masukkan 6 digit kode OTP verifikasi');
      return;
    }

    setVerifyingOtp(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ no_hp: formData.no_hp.trim(), otp: otpCode.trim() }),
      });

      const rawText = await res.text();

      // Deteksi jika respon adalah HTML (berasal dari sistem keamanan proxy AI Studio yang mencegat API)
      if (rawText && rawText.toLowerCase().includes('<html')) {
        if (window.self !== window.top) { setError('PROXY_IFRAME_ERROR'); } else { setError('Sesi keamanan kadaluarsa. Silakan muat ulang (Refresh) halaman ini.'); }
        return;
      }

      let data: any = null;
      try {
        data = JSON.parse(rawText);
      } catch {
        data = null;
      }
      if (!res.ok) throw new Error(data?.error || 'Verifikasi OTP gagal');

      setIsPhoneVerified(true);
      setOtpMsg('✓ Nomor WhatsApp / SMS berhasil diverifikasi!');
    } catch (err: any) {
      setError(err.message || 'Kode OTP tidak sesuai');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // Strict validation
    if (!formData.nama.trim() || !formData.pt.trim() || !formData.departemen.trim() || !formData.no_hp.trim() || !formData.password.trim()) {
      setError('Semua data wajib diisi secara lengkap');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Konfirmasi password tidak cocok');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    if (!/[A-Z]/.test(formData.password)) {
      setError('Password harus mengandung minimal 1 huruf kapital (huruf besar)');
      return;
    }

    if (!/[0-9]/.test(formData.password)) {
      setError('Password harus mengandung minimal 1 angka');
      return;
    }

    const cleanNoHp = formData.no_hp.trim().replace(/[\s-]/g, '');
    if (!/^[0-9]{9,15}$/.test(cleanNoHp)) {
      setError('Nomor HP tidak valid. Masukkan angka 9 - 15 digit');
      return;
    }

    setLoading(true);
    try {
      document.cookie = `__SECURE-aistudio_auth_flow_may_set_cookies=true; Path=/; Secure; SameSite=None; Domain=${window.location.hostname}; Partitioned; Max-Age=31536000;`;
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nama: formData.nama.trim(),
          pt: formData.pt.trim(),
          departemen: formData.departemen.trim(),
          no_hp: cleanNoHp,
          password: formData.password.trim(),
        }),
      });

      const rawText = await res.text();

      // Deteksi jika respon adalah HTML (berasal dari sistem keamanan proxy AI Studio yang mencegat API)
      if (rawText && rawText.toLowerCase().includes('<html')) {
        if (window.self !== window.top) { setError('PROXY_IFRAME_ERROR'); } else { setError('Sesi keamanan kadaluarsa. Silakan muat ulang (Refresh) halaman ini.'); }
        return;
      }

      let data: any = null;
      try {
        data = JSON.parse(rawText);
      } catch {
        data = null;
      }
      if (!res.ok) throw new Error(data?.error || 'Pendaftaran gagal');

      setSuccessMsg('Pendaftaran berhasil! Mengalihkan ke halaman login...');
      setTimeout(() => {
        navigate('/login');
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mendaftar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-y-auto overflow-x-hidden bg-slate-50 flex flex-col justify-between p-3 sm:p-5 w-full max-w-full">
      {/* Header Logo */}
      <header className="w-full flex justify-center items-center max-w-md sm:max-w-lg mx-auto pt-2 shrink-0">
        <BelanjainLogo size="md" showSubtitle={true} />
      </header>

      {/* Register Form Main */}
      <main className="w-full max-w-md mx-auto my-auto py-3">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
            Pendaftaran Anggota Belanja
          </h2>
        </div>

        <div className="mt-4 bg-white py-5 px-4 sm:px-7 shadow-sm rounded-2xl border border-slate-200">
          {successMsg ? (
            <div className="py-6 text-center space-y-3">
              <CheckCircle className="w-12 h-12 text-teal-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-900">{successMsg}</p>
            </div>
          ) : (
            <form className="space-y-3.5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  name="nama"
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={formData.nama}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Perusahaan (PT) <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="pt"
                    type="text"
                    required
                    value={formData.pt}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-xl shadow-sm bg-slate-50 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Departemen <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="departemen"
                    type="text"
                    required
                    placeholder="Contoh: Production"
                    value={formData.departemen}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  No HP / WhatsApp <span className="text-red-500">*</span>
                </label>
                <input
                  name="no_hp"
                  type="text"
                  required
                  placeholder="Contoh: 08123456789"
                  value={formData.no_hp}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Min 6 karakter, 1 kapital & 1 angka"
                      value={formData.password}
                      onChange={handleChange}
                      onFocus={() => setIsPasswordFocused(true)}
                      onBlur={() => setIsPasswordFocused(false)}
                      className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm pr-10"
                    />
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  
                  {/* Animasi Info & Progress Password */}
                  <div 
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isPasswordFocused || (formData.password.length > 0 && passwordScore < 3) ? 'max-h-40 opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0'
                    }`}
                  >
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden mb-2">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ease-out ${progressColor}`}
                          style={{ width: `${passwordProgress}%` }}
                        ></div>
                      </div>
                      <ul className="text-[10px] space-y-1">
                        <li className={`flex items-center transition-colors duration-300 ${formData.password.length >= 6 ? 'text-teal-600' : 'text-slate-500'}`}>
                          <CheckCircle className="w-3 h-3 mr-1.5 shrink-0" /> Minimal 6 karakter
                        </li>
                        <li className={`flex items-center transition-colors duration-300 ${/[A-Z]/.test(formData.password) ? 'text-teal-600' : 'text-slate-500'}`}>
                          <CheckCircle className="w-3 h-3 mr-1.5 shrink-0" /> 1 Huruf kapital
                        </li>
                        <li className={`flex items-center transition-colors duration-300 ${/[0-9]/.test(formData.password) ? 'text-teal-600' : 'text-slate-500'}`}>
                          <CheckCircle className="w-3 h-3 mr-1.5 shrink-0" /> 1 Angka
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Konfirmasi Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="Ulangi password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {error === 'PROXY_IFRAME_ERROR' ? (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl text-sm leading-snug">
                  <p className="font-semibold text-orange-800 mb-2">⚠️ Akses Keamanan Terblokir</p>
                  <p className="text-orange-700 mb-3 text-xs sm:text-sm">
                    Browser Anda memblokir sesi keamanan karena aplikasi dibuka di dalam layar Preview (iFrame).
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
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-medium">
                  {error}
                </div>
              ) : null}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 transition-colors mt-1"
                >
                  {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Daftar Sekarang'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-teal-600 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Sudah punya akun? Login di sini
            </Link>
          </div>
        </div>
      </main>

      <footer className="py-1 text-center text-[11px] sm:text-xs text-slate-400 shrink-0">
        &copy; {new Date().getFullYear()} BelanjaIn Saza - PT. Siemens Indonesia
      </footer>
    </div>
  );
};
