import React from 'react';
import { X } from 'lucide-react';
import { getDisplayOrderId } from '../../../utils/format';

interface EditOrderStatusModalProps {
  selectedOrderForStatus: any;
  setSelectedOrderForStatus: (order: any) => void;
  newStatusValue: string;
  setNewStatusValue: (status: string) => void;
  newKeteranganValue: string;
  setNewKeteranganValue: (keterangan: string) => void;
  updatingStatus: boolean;
  handleUpdateOrderStatus: (orderId: number, status: string, keterangan: string) => void;
}

export const EditOrderStatusModal: React.FC<EditOrderStatusModalProps> = ({
  selectedOrderForStatus,
  setSelectedOrderForStatus,
  newStatusValue,
  setNewStatusValue,
  newKeteranganValue,
  setNewKeteranganValue,
  updatingStatus,
  handleUpdateOrderStatus
}) => {
  if (!selectedOrderForStatus) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
        <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <h3 className="font-bold text-sm">Update Status Pesanan {getDisplayOrderId(selectedOrderForStatus.id, selectedOrderForStatus.createdAt)}</h3>
            <p className="text-[10px] text-teal-400 font-medium">{selectedOrderForStatus.user?.nama} ({selectedOrderForStatus.user?.pt})</p>
          </div>
          <button
            onClick={() => setSelectedOrderForStatus(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Pilih Tahap Status</label>
            <select
              value={newStatusValue}
              onChange={(e) => setNewStatusValue(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500"
            >
              <option value="Proses">1. Proses</option>
              <option value="Menyiapkan Pesanan">2. Menyiapkan Pesanan</option>
              <option value="Pengiriman">3. Pengiriman</option>
              <option value="Siap Diambil">4. Siap Diambil</option>
              <option value="Selesai">5. Selesai</option>
              <option value="Pengajuan Pembatalan">⚠️ Pengajuan Pembatalan (Konfirmasi Admin)</option>
              <option value="Dibatalkan">Dibatalkan</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Catatan / Instruksi untuk Karyawan
            </label>
            <textarea
              rows={3}
              placeholder="Contoh: Silakan di ambil di Koperasi PT. Siemens Indonesia / BelanjaIn Saza jam 12:00 WIB"
              value={newKeteranganValue}
              onChange={(e) => setNewKeteranganValue(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 placeholder-slate-400"
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setSelectedOrderForStatus(null)}
              className="px-4 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={updatingStatus}
              onClick={() => handleUpdateOrderStatus(selectedOrderForStatus.id, newStatusValue, newKeteranganValue)}
              className="px-5 py-2.5 bg-teal-600 text-white text-xs font-bold rounded-xl hover:bg-teal-700 shadow-sm"
            >
              {updatingStatus ? 'Menyimpan...' : 'Simpan Status'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
