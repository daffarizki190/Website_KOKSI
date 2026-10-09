import React from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';

export interface DeleteAccountModalProps {
  isDeleteModalOpen: boolean;
  setIsDeleteModalOpen: (isOpen: boolean) => void;
  deleteReasonInput: string;
  setDeleteReasonInput: (val: string) => void;
  deleteAccountError: string;
  setDeleteAccountError: (val: string) => void;
  handleConfirmDeleteAccount: () => void;
  isDeletingAccount: boolean;
  user: any;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isDeleteModalOpen,
  setIsDeleteModalOpen,
  deleteReasonInput,
  setDeleteReasonInput,
  deleteAccountError,
  setDeleteAccountError,
  handleConfirmDeleteAccount,
  isDeletingAccount,
  user,
}) => {
  if (!isDeleteModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-100 text-red-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Konfirmasi Hapus Akun</h3>
              <p className="text-[11px] text-slate-500 font-medium">Tindakan ini tidak dapat dibatalkan</p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsDeleteModalOpen(false);
              setDeleteReasonInput('');
              setDeleteAccountError('');
            }}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 space-y-3">
          <p className="text-xs text-slate-600 leading-relaxed">
            Apakah Anda yakin ingin menghapus akun Anda (<strong className="text-slate-800">{user?.nama}</strong>) dari BelanjaIn Saza (PT. Siemens Indonesia)? Mohon berikan **alasan penghapusan akun**:
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Alasan Penghapusan Akun <span className="text-red-500">*</span>
            </label>
            <textarea
              value={deleteReasonInput}
              onChange={(e) => {
                setDeleteReasonInput(e.target.value);
                if (deleteAccountError) setDeleteAccountError('');
              }}
              rows={3}
              placeholder="Contoh: Resign / Keluar dari perusahaan Siemens, Duplikasi akun, atau Alasan Pribadi..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white resize-none"
            />
          </div>

          {deleteAccountError && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-1.5">
              <X className="w-4 h-4 shrink-0" />
              <span>{deleteAccountError}</span>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 flex gap-2">
          <button
            onClick={() => {
              setIsDeleteModalOpen(false);
              setDeleteReasonInput('');
              setDeleteAccountError('');
            }}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={handleConfirmDeleteAccount}
            disabled={isDeletingAccount || !deleteReasonInput.trim()}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-sm shadow-red-600/30 flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isDeletingAccount ? 'Proses Hapus...' : 'Ya, Hapus Akun'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
