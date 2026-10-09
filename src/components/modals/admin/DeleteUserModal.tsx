import React from 'react';
import { Trash2, X, AlertCircle } from 'lucide-react';

interface DeleteUserModalProps {
  deleteTargetUser: any;
  setDeleteTargetUser: (user: any) => void;
  deleteReasonInput: string;
  setDeleteReasonInput: (reason: string) => void;
  deleteUserError: string;
  setDeleteUserError: (error: string) => void;
  isDeletingUser: boolean;
  handleConfirmDeleteUser: () => void;
}

export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  deleteTargetUser,
  setDeleteTargetUser,
  deleteReasonInput,
  setDeleteReasonInput,
  deleteUserError,
  setDeleteUserError,
  isDeletingUser,
  handleConfirmDeleteUser
}) => {
  if (!deleteTargetUser) return null;

  return (
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
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs font-extrabold text-slate-900">{deleteTargetUser.nama}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-teal-50 text-teal-800 rounded border border-teal-100">
                {deleteTargetUser.pt}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">No. HP: {deleteTargetUser.no_hp} | ID: #{deleteTargetUser.id}</p>
          </div>

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
  );
};
