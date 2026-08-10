import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-16 h-16 bg-teal-600 rounded-xl mx-auto flex items-center justify-center mb-4 shadow-lg">
          <span className="text-white text-3xl font-black italic">K</span>
        </div>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
          Login Koperasi
        </h2>
        <p className="mt-2 text-sm text-slate-600 uppercase tracking-wider">
          Internal Perusahaan
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-200">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="no_hp" className="block text-sm font-medium text-slate-700">
                No HP
              </label>
              <div className="mt-1">
                <input
                  id="no_hp"
                  name="no_hp"
                  type="text"
                  required
                  value={no_hp}
                  onChange={(e) => setNoHp(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm font-medium">{error}</div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Masuk'}
              </button>
            </div>
          </form>
          <div className="mt-6 text-center space-y-3">
             <p className="text-sm font-medium text-slate-600">Lupa password? <span className="text-teal-600 font-bold">Hubungi Admin</span></p>
             <div className="pt-4 border-t border-slate-100">
               <p className="text-xs text-slate-500">Admin test: 081234567890 / admin123</p>
               <p className="text-xs text-slate-500">User test: 081222333444 / user123</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
