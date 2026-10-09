import React from 'react';
import { 
  FileText, Activity, AlertCircle, Database, Shield, FileSpreadsheet, Server, Users, Search, Play, Pause, AlertTriangle, ShieldAlert, Key, Link as LinkIcon, ExternalLink, Calendar, Plus, RefreshCw, Filter, Trash2, Edit3, X, Save, Lock, LogOut, CheckCircle2, Check, ChevronDown, CheckSquare, Package, CheckCircle
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';

export interface DeleteITUserModalProps {
  deleteTargetUser: any;
  setDeleteTargetUser: any;
  deleteReasonInput: any;
  setDeleteReasonInput: any;
  handleConfirmDeleteUser: any;
  isDeletingUser: any;
  deleteUserError: any;
  setDeleteUserError: any;
}



export const DeleteITUserModal: React.FC<DeleteITUserModalProps> = ({ deleteTargetUser, setDeleteTargetUser, deleteReasonInput, setDeleteReasonInput, handleConfirmDeleteUser, isDeletingUser, deleteUserError, setDeleteUserError }) => {
  if (!deleteTargetUser) return null;

  return (
<div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-800 animate-in fade-in zoom-in duration-200 text-slate-100">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-red-950/80 border border-red-800 text-red-400 flex items-center justify-center font-bold">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Konfirmasi Hapus Akun</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Tindakan ini akan memicu Log Audit IT</p>
                </div>
              </div>
              <button
                onClick={() => setDeleteTargetUser(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold text-white">{deleteTargetUser.nama}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-teal-950 text-teal-300 rounded border border-teal-800">
                    {deleteTargetUser.departemen || 'PT. Siemens Indonesia'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">No. HP: {deleteTargetUser.no_hp} | ID: #{deleteTargetUser.id}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Alasan Penghapusan Akun <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={deleteReasonInput}
                  onChange={(e) => {
                    setDeleteReasonInput(e.target.value);
                    if (deleteUserError) setDeleteUserError('');
                  }}
                  rows={3}
                  placeholder="Contoh: Permintaan karyawan, Penutupan akun non-aktif, atau Alasan Audit..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">Alasan wajib diisi (min 3 karakter) untuk dicatat dalam database audit.</p>
              </div>

              {deleteUserError && (
                <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{deleteUserError}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                onClick={() => setDeleteTargetUser(null)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>

              <button
                onClick={handleConfirmDeleteUser}
                disabled={isDeletingUser || !deleteReasonInput.trim()}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 active:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-red-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeletingUser ? 'Proses Hapus...' : 'Hapus Akun Permanen'}</span>
              </button>
            </div>
          </div>
        </div>
      
  );
};
