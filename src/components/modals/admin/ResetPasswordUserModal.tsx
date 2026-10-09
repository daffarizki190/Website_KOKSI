import React from 'react';
import { Key, X, AlertCircle, RefreshCw } from 'lucide-react';

interface ResetPasswordUserModalProps {
  resetPasswordUser: any;
  setResetPasswordUser: (user: any) => void;
  resetPasswordError: string;
  isResettingPassword: boolean;
  handleConfirmResetPassword: () => void;
}

export const ResetPasswordUserModal: React.FC<ResetPasswordUserModalProps> = ({
  resetPasswordUser,
  setResetPasswordUser,
  resetPasswordError,
  isResettingPassword,
  handleConfirmResetPassword
}) => {
  if (!resetPasswordUser) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
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
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold text-slate-800">{resetPasswordUser.nama}</p>
              <p className="text-[11px] text-slate-500 font-medium">No. HP: {resetPasswordUser.no_hp}</p>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 bg-teal-100 text-teal-800 rounded-lg">
              ID #{resetPasswordUser.id}
            </span>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
            <p className="text-xs text-amber-800 font-medium leading-relaxed">
              Apakah Anda yakin ingin mereset kata sandi akun ini?
            </p>
            <ul className="mt-2 space-y-1.5 list-disc pl-4 text-xs text-amber-700">
              <li>Password akan dikembalikan ke default: <strong className="bg-amber-100 px-1 rounded">Saza12345</strong></li>
              <li>Anggota akan diminta untuk <strong className="font-bold">wajib mengganti password baru</strong> saat mereka login berikutnya.</li>
            </ul>
          </div>

          {resetPasswordError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{resetPasswordError}</span>
            </div>
          )}
        </div>

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
                <span>Mereset...</span>
              </>
            ) : (
              <>
                <Key className="w-4 h-4 text-teal-200" />
                <span>Ya, Reset Password</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
