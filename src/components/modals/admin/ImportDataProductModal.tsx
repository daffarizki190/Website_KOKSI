import React from 'react';
import { X, FileUp, Download, Info, Upload, FileText, AlertCircle, RefreshCw } from 'lucide-react';

interface ImportDataProductModalProps {
  isImportModalOpen: boolean;
  setIsImportModalOpen: (val: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  isCleaningUpCategories: boolean;
  cleanupProgress: { current: number, total: number };
  handleCleanupCategories: () => void;
  cleanupMessage: { type: 'success' | 'error' | 'info', text: string } | null;
  handleDownloadTemplate: () => void;
}

export const ImportDataProductModal: React.FC<ImportDataProductModalProps> = ({
  isImportModalOpen, setIsImportModalOpen, fileInputRef, isCleaningUpCategories,
  cleanupProgress, handleCleanupCategories, cleanupMessage, handleDownloadTemplate
}) => {
  if (!isImportModalOpen) return null;
  
  return (
<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center font-bold shadow-sm">
                  <Upload className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Import Data Produk</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Upload file Excel atau unduh contoh template</p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              {/* Unduh Template */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                <p className="text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-teal-600" />
                  <span>1. Unduh Format Template Excel</span>
                </p>
                <p className="text-[11px] text-slate-500 mb-3">
                  Gunakan template ini untuk mengisi daftar nama barang, kategori, harga, dan stok produk baru.
                </p>
                <button
                  onClick={handleDownloadTemplate}
                  className="w-full py-2.5 px-3 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <Download className="w-4 h-4 text-teal-600" />
                  <span>Unduh File Template (.xlsx)</span>
                </button>
              </div>

              {/* Format yang Diterima */}
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
                <p className="text-xs font-bold text-amber-900 mb-2 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Format yang Diterima: KOKSI Supplier</span>
                </p>
                <p className="text-[11px] text-amber-800 mb-2">
                  Sistem <strong>hanya menerima</strong> format Excel dari supplier KOKSI. Kolom yang diperlukan:
                </p>
                <div className="grid grid-cols-1 gap-1 mb-2">
                  {[
                    ['Kategori / Kategori Minuman', 'Sub-kategori produk (misal: Air Mineral)'],
                    ['Nama Produk & Gramasi', 'Nama lengkap produk'],
                    ['Harga Jual ke Anggota', 'Harga yang ditampilkan ke member ✓'],
                  ].map(([col, desc]) => (
                    <div key={col} className="flex items-start gap-2">
                      <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span className="text-[11px] text-amber-900"><strong>{col}</strong> — {desc}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-1 p-2 bg-amber-100 rounded-xl">
                  <p className="text-[10px] text-amber-700 font-semibold">⚠ Kolom &quot;Harga Dasar&quot; dan &quot;Harga Jual ke KOKSI&quot; diabaikan. Hanya &quot;Harga Jual ke Anggota&quot; yang dipakai.</p>
                </div>
              </div>

              {/* Upload File */}
              <div className="p-4 bg-teal-50/60 rounded-2xl border border-teal-100">
                <p className="text-xs font-bold text-teal-950 mb-1 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-teal-700" />
                  <span>Upload File Excel Supplier</span>
                </p>
                <p className="text-[11px] text-teal-800/80 mb-3">
                  Pilih file Excel format KOKSI supplier untuk mengimpor produk ke database.
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isCleaningUpCategories}
                  className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-white" />
                  <span>Pilih File Excel & Import</span>
                </button>
              </div>

              {/* Cleanup Section */}
              <div className="p-4 bg-orange-50/60 rounded-2xl border border-orange-100">
                <p className="text-xs font-bold text-orange-950 mb-1 flex items-center gap-1.5">
                  <RefreshCw className={`w-4 h-4 text-orange-600 ${isCleaningUpCategories ? 'animate-spin' : ''}`} />
                  <span>3. Rapikan Kategori (Otomatis/Manual)</span>
                </p>
                <p className="text-[11px] text-orange-800/80 mb-3">
                  Merapikan data kategori produk lama yang berantakan menggunakan sistem cerdas (Smart Categorizer). Otomatis berjalan setelah upload.
                </p>

                {isCleaningUpCategories ? (
                  <div className="space-y-2">
                    <div className="w-full bg-orange-200/50 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${cleanupProgress.total > 0 ? Math.round((cleanupProgress.current / cleanupProgress.total) * 100) : 0}%` }}
                      ></div>
                    </div>
                    <p className="text-[10px] text-orange-700 text-center font-medium">
                      {cleanupProgress.current > 0 ? `Memproses ${cleanupProgress.current} dari ${cleanupProgress.total} produk...` : 'Menganalisis produk...'}
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={handleCleanupCategories}
                    className="w-full py-2.5 px-4 bg-orange-100 hover:bg-orange-200 active:bg-orange-300 text-orange-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Jalankan Manual Sekarang</span>
                  </button>
                )}

                {cleanupMessage && !isCleaningUpCategories && (
                  <div className={`mt-3 p-2 rounded-lg text-[10px] font-medium border ${cleanupMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    cleanupMessage.type === 'error' ? 'bg-red-50 text-red-700 border-red-100' :
                      'bg-blue-50 text-blue-700 border-blue-100'
                    }`}>
                    {cleanupMessage.text}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsImportModalOpen(false)}
                disabled={isCleaningUpCategories}
                className="w-full py-2.5 bg-slate-100 disabled:opacity-50 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      
  );
};
