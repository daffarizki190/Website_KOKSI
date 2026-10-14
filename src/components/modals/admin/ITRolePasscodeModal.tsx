import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, X, KeyRound, Eye, EyeOff, CheckCircle2, AlertTriangle } from 'lucide-react';

export interface ITRolePasscodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: { id: number; nama: string; no_hp: string; role?: string } | null;
  onConfirm: (passcode: string) => Promise<void>;
  isLoading?: boolean;
}

export const ITRolePasscodeModal: React.FC<ITRolePasscodeModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  onConfirm,
  isLoading = false,
}) => {
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPasscode('');
      setErrorMessage(null);
      setShowPasscode(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen || !targetUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setErrorMessage('Sandi otorisasi wajib diisi.');
      return;
    }

    try {
      setErrorMessage(null);
      await onConfirm(passcode.trim());
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sandi otorisasi tidak valid';
      setErrorMessage(msg);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="it-passcode-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 my-auto">
        <div className="flex items-start justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 id="it-passcode-title" className="text-base font-extrabold text-slate-900 leading-tight">
                Otorisasi Akses IT
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Pemberian wewenang administrator sistem
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Tutup"
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 bg-purple-50/70 border border-purple-200/80 rounded-2xl text-xs space-y-1">
          <p className="text-purple-950 font-bold">
            Target Pengguna: <span className="text-slate-900 font-extrabold">{targetUser.nama}</span>
          </p>
          <p className="text-[11px] text-purple-800 font-medium">
            Peran akan diubah dari <strong className="uppercase">{(targetUser.role || 'user')}</strong> menjadi <strong className="text-purple-900 uppercase">IT</strong>.
          </p>
        </div>

        <p className="text-xs text-slate-600 font-medium leading-relaxed">
          Mengubah role menjadi <strong className="text-purple-900">IT</strong> memberikan akses monitoring server, audit log, dan infrastruktur sistem. Masukkan sandi otorisasi keamanan untuk melanjutkan.
        </p>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="it-passcode-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Sandi Otorisasi IT
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                ref={inputRef}
                id="it-passcode-input"
                type={showPasscode ? 'text' : 'password'}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Masukkan 6 digit sandi..."
                autoComplete="off"
                className="w-full text-xs font-mono font-bold pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 outline-hidden transition-all text-slate-900"
              />
              <button
                type="button"
                onClick={() => setShowPasscode(!showPasscode)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label={showPasscode ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
              >
                {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading || !passcode.trim()}
              className="flex-1 py-2.5 bg-purple-700 hover:bg-purple-800 active:bg-purple-900 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-xs shadow-purple-700/30 flex items-center justify-center gap-1.5"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verifikasi & Ubah</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
