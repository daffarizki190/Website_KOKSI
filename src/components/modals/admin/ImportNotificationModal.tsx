import React from 'react';
import { X, CheckCircle2, AlertTriangle, XCircle, FileText, FileSpreadsheet, CheckCircle, RefreshCw, AlertCircle, Package } from 'lucide-react';

export interface ImportResultItem {
  nama_barang: string;
  kategori?: string;
  sub_kategori?: string | null;
  harga?: number;
  stok?: number;
  alasan?: string;
}

export interface ImportResult {
  inserted: ImportResultItem[];
  updated: ImportResultItem[];
  rejected: ImportResultItem[];
  insertedCount: number;
  updatedCount: number;
  rejectedCount: number;
}


interface ImportNotificationModalProps {
  importResult: ImportResult | null;
  setImportResult: React.Dispatch<React.SetStateAction<ImportResult | null>>;
  importResultTab: 'inserted' | 'updated' | 'rejected';
  setImportResultTab: (val: 'inserted' | 'updated' | 'rejected') => void;
}

export const ImportNotificationModal: React.FC<ImportNotificationModalProps> = ({
  importResult, setImportResult, importResultTab, setImportResultTab
}) => {
  if (!importResult) return null;
  
  return (
<div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Hasil Import Produk</h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {importResult.insertedCount} baru &nbsp;·&nbsp; {importResult.updatedCount} diperbarui &nbsp;·&nbsp; {importResult.rejectedCount} ditolak
                  </p>
                </div>
              </div>
              <button
                onClick={() => setImportResult(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Summary badges */}
            <div className="flex gap-3 px-6 py-3 bg-slate-50 border-b border-slate-100 shrink-0">
              <button
                onClick={() => setImportResultTab('inserted')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${importResultTab === 'inserted'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/30'
                  : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                  }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Produk Baru
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${importResultTab === 'inserted' ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                  {importResult.insertedCount}
                </span>
              </button>
              <button
                onClick={() => setImportResultTab('updated')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${importResultTab === 'updated'
                  ? 'bg-sky-600 text-white border-sky-600 shadow-sm shadow-sky-600/30'
                  : 'bg-white text-sky-700 border-sky-200 hover:bg-sky-50'
                  }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Diperbarui
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${importResultTab === 'updated' ? 'bg-sky-500 text-white' : 'bg-sky-100 text-sky-700'}`}>
                  {importResult.updatedCount}
                </span>
              </button>
              <button
                onClick={() => setImportResultTab('rejected')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${importResultTab === 'rejected'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-600/30'
                  : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
                  }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                Ditolak
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${importResultTab === 'rejected' ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-700'}`}>
                  {importResult.rejectedCount}
                </span>
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 px-6 py-4">

              {/* --- Tab: Produk Baru --- */}
              {importResultTab === 'inserted' && (
                importResult.inserted.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <Package className="w-10 h-10 mb-2 opacity-40" />
                    <p className="text-sm font-medium">Tidak ada produk baru yang ditambahkan.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-[11px] text-slate-500 font-semibold mb-2 uppercase tracking-wide">
                      {importResult.insertedCount} produk berhasil ditambahkan ke database
                    </p>
                    <div className="overflow-x-auto rounded-xl border border-emerald-100">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-emerald-50 text-emerald-800">
                            <th className="px-3 py-2 text-left font-bold">#</th>
                            <th className="px-3 py-2 text-left font-bold">Nama Barang</th>
                            <th className="px-3 py-2 text-left font-bold">Sub Kategori</th>
                            <th className="px-3 py-2 text-right font-bold">Harga</th>
                            <th className="px-3 py-2 text-right font-bold">Stok</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importResult.inserted.map((item, idx) => (
                            <tr key={idx} className={`border-t border-emerald-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-emerald-50/30'}`}>
                              <td className="px-3 py-2 text-slate-400 font-medium">{idx + 1}</td>
                              <td className="px-3 py-2 text-slate-800 font-semibold">{item.nama_barang}</td>
                              <td className="px-3 py-2 text-slate-500">{item.sub_kategori || <span className="text-slate-300 italic">—</span>}</td>
                              <td className="px-3 py-2 text-right text-slate-700 font-medium">Rp {(item.harga ?? 0).toLocaleString('id-ID')}</td>
                              <td className="px-3 py-2 text-right text-slate-600">{item.stok ?? 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              )}

              {/* --- Tab: Diperbarui --- */}
              {importResultTab === 'updated' && (
                importResult.updated.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <RefreshCw className="w-10 h-10 mb-2 opacity-40" />
                    <p className="text-sm font-medium">Tidak ada produk yang diperbarui.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-[11px] text-slate-500 font-semibold mb-2 uppercase tracking-wide">
                      {importResult.updatedCount} produk yang sudah ada diperbarui harga & stoknya
                    </p>
                    <div className="overflow-x-auto rounded-xl border border-sky-100">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-sky-50 text-sky-800">
                            <th className="px-3 py-2 text-left font-bold">#</th>
                            <th className="px-3 py-2 text-left font-bold">Nama Barang</th>
                            <th className="px-3 py-2 text-left font-bold">Sub Kategori</th>
                            <th className="px-3 py-2 text-right font-bold">Harga</th>
                            <th className="px-3 py-2 text-right font-bold">Stok</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importResult.updated.map((item, idx) => (
                            <tr key={idx} className={`border-t border-sky-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-sky-50/30'}`}>
                              <td className="px-3 py-2 text-slate-400 font-medium">{idx + 1}</td>
                              <td className="px-3 py-2 text-slate-800 font-semibold">{item.nama_barang}</td>
                              <td className="px-3 py-2 text-slate-500">{item.sub_kategori || <span className="text-slate-300 italic">—</span>}</td>
                              <td className="px-3 py-2 text-right text-slate-700 font-medium">Rp {(item.harga ?? 0).toLocaleString('id-ID')}</td>
                              <td className="px-3 py-2 text-right text-slate-600">{item.stok ?? 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              )}

              {/* --- Tab: Ditolak --- */}
              {importResultTab === 'rejected' && (
                importResult.rejected.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-emerald-500">
                    <CheckCircle className="w-10 h-10 mb-2" />
                    <p className="text-sm font-semibold text-slate-600">Tidak ada produk yang ditolak. Semua data valid!</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-[11px] text-slate-500 font-semibold mb-2 uppercase tracking-wide">
                      {importResult.rejectedCount} produk tidak dapat diimport — periksa dan perbaiki file Excel Anda
                    </p>
                    <div className="overflow-x-auto rounded-xl border border-rose-100">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-rose-50 text-rose-800">
                            <th className="px-3 py-2 text-left font-bold">#</th>
                            <th className="px-3 py-2 text-left font-bold">Nama Barang</th>
                            <th className="px-3 py-2 text-left font-bold">Alasan Ditolak</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importResult.rejected.map((item, idx) => (
                            <tr key={idx} className={`border-t border-rose-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-rose-50/30'}`}>
                              <td className="px-3 py-2 text-slate-400 font-medium">{idx + 1}</td>
                              <td className="px-3 py-2 text-slate-800 font-semibold align-top">{item.nama_barang}</td>
                              <td className="px-3 py-2 text-rose-700 align-top">
                                <span className="inline-flex items-start gap-1">
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500 mt-0.5 shrink-0" />
                                  {item.alasan}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Panduan perbaikan */}
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                      <p className="text-[11px] font-bold text-amber-800 mb-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Panduan Perbaikan
                      </p>
                      <ul className="text-[11px] text-amber-700 space-y-0.5 list-disc list-inside">
                        <li>Gunakan <strong>Format KOKSI Supplier</strong> dengan kolom <strong>Nama Produk &amp; Gramasi</strong> dan <strong>Harga Jual ke Anggota</strong></li>
                        <li>Pastikan Kategori sesuai: <em>Makanan &amp; Minuman Siap Saji (F&amp;B)</em> atau <em>Perawatan Diri &amp; Kesehatan (Personal Care)</em></li>
                        <li>Kolom <strong>Harga</strong> tidak boleh 0 atau kosong</li>
                        <li>Tidak boleh ada nama barang yang sama dalam satu file</li>
                      </ul>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 shrink-0">
              <button
                onClick={() => setImportResult(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
  );
};
