import React from 'react';
import { X, Save, Edit3, Check } from 'lucide-react';

export interface EditProfileModalProps {
  isEditProfileOpen: boolean;
  setIsEditProfileOpen: (isOpen: boolean) => void;
  editNama: string;
  setEditNama: (val: string) => void;
  editPt: string;
  setEditPt: (val: string) => void;
  editDepartemen: string;
  setEditDepartemen: (val: string) => void;
  editNoHp: string;
  setEditNoHp: (val: string) => void;
  editPassword: string;
  setEditPassword: (val: string) => void;
  editError: string;
  editSuccess: string;
  handleSaveProfile: () => void;
  isSavingProfile: boolean;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isEditProfileOpen,
  setIsEditProfileOpen,
  editNama,
  setEditNama,
  editPt,
  setEditPt,
  editDepartemen,
  setEditDepartemen,
  editNoHp,
  setEditNoHp,
  editPassword,
  setEditPassword,
  editError,
  editSuccess,
  handleSaveProfile,
  isSavingProfile,
}) => {
  if (!isEditProfileOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center font-bold">
              <Edit3 className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Edit Profil Saya</h3>
              <p className="text-[11px] text-slate-500 font-medium">Perbarui informasi data akun BelanjaIn Saza Anda</p>
            </div>
          </div>
          <button
            onClick={() => setIsEditProfileOpen(false)}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={editNama}
              onChange={(e) => setEditNama(e.target.value)}
              placeholder="Masukkan Nama Lengkap"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Perusahaan <span className="text-red-500">*</span>
              </label>
              <select
                value={editPt}
                onChange={(e) => setEditPt(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white cursor-pointer"
              >
                <option value="PT. Siemens Indonesia">PT. Siemens Indonesia</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Departemen <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editDepartemen}
                onChange={(e) => setEditDepartemen(e.target.value)}
                placeholder="Contoh: IT, HR, Finance..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              No. HP (WhatsApp) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={editNoHp}
              onChange={(e) => setEditNoHp(e.target.value)}
              placeholder="Contoh: 081234567890"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Password Baru <span className="text-slate-400 font-normal">(Kosongkan jika tidak diubah)</span>
            </label>
            <input
              type="password"
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
            />
          </div>

          {editError && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-1.5">
              <X className="w-4 h-4 shrink-0" />
              <span>{editError}</span>
            </div>
          )}

          {editSuccess && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
              <Check className="w-4 h-4 shrink-0" />
              <span>{editSuccess}</span>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 flex gap-2">
          <button
            onClick={() => setIsEditProfileOpen(false)}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={handleSaveProfile}
            disabled={isSavingProfile}
            className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-sm shadow-teal-600/30 flex items-center justify-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>{isSavingProfile ? 'Menyimpan...' : 'Simpan Profil'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
