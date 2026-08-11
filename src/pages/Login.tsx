import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, UserPlus } from 'lucide-react';
import { BelanjainLogo } from '../components/BelanjainLogo';

export const Login = () => {
  const [no_hp, setNoHp] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ no_hp, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      
      login(data.token, data.user);
      if (data.user.role === 'admin') {
        navigate('/admin');
      } else if (data.user.role === 'it') {
        navigate('/it-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-slate-50 flex flex-col justify-between p-3 sm:p-5">
      {/* Header Logo: Belanjain */}
      <header className="w-full flex justify-center items-center max-w-md sm:max-w-lg mx-auto pt-2 shrink-0">
        <BelanjainLogo size="md" showSubtitle={true} />
      </header>

      {/* Login Card Main Content */}
      <main className="w-full max-w-md mx-auto my-auto py-2 shrink-0">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
            Masuk ke Akun Belanja
          </h2>
        </div>

        <div className="mt-4 sm:mt-5 bg-white py-5 px-4 sm:px-7 shadow-sm rounded-2xl border border-slate-200">
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
                className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
              />
            </div>

            {error && (
              <div className="text-red-600 text-xs sm:text-sm font-medium">{error}</div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Masuk'}
              </button>
            </div>
          </form>

          <div className="mt-4 text-center space-y-2.5">
             <Link
               to="/register"
               className="w-full inline-flex justify-center items-center py-2 px-4 border border-teal-600 rounded-xl text-xs sm:text-sm font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors"
             >
               <UserPlus className="w-4 h-4 mr-1.5" />
               Daftar Akun Baru
             </Link>

             <p className="text-xs sm:text-sm font-medium text-slate-600 pt-1">Lupa password? <span className="text-teal-600 font-bold cursor-pointer">Hubungi Admin</span></p>
             <div className="pt-2.5 border-t border-slate-100 text-[11px] sm:text-xs text-slate-500 space-y-1 text-left bg-slate-50 p-2.5 rounded-xl border border-slate-200">
               <p className="font-bold text-slate-700 text-[10px] uppercase tracking-wider mb-1">Akun Percobaan (Demo Accounts):</p>
               <p className="text-slate-600 font-mono text-[11px]"><strong className="text-teal-700">IT Officer:</strong> 081299998888 / it123456</p>
               <p className="text-slate-600 font-mono text-[11px]"><strong className="text-amber-700">Admin:</strong> 081234567890 / admin123</p>
               <p className="text-slate-600 font-mono text-[11px]"><strong className="text-slate-700">User/Karyawan:</strong> 081222333444 / user123</p>
             </div>
          </div>
        </div>
      </main>

      <footer className="py-1 text-center text-[11px] sm:text-xs text-slate-400 shrink-0">
        &copy; {new Date().getFullYear()} KOKSI - Belanja Karyawan
      </footer>
    </div>
  );
};
