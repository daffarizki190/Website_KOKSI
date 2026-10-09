import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { User as UserIcon, X, Edit3, LogOut, Trash2, AlertTriangle, CheckCircle2, Package, CalendarDays } from 'lucide-react';

export interface GlobalOrderingClosedModalProps {
  showClosedModal: any;
  isDemoModeLoaded: any;
  handleDismissClosedModal: any;
}

export const GlobalOrderingClosedModal: React.FC<GlobalOrderingClosedModalProps> = ({ showClosedModal, isDemoModeLoaded, handleDismissClosedModal }) => {
  return (
    <>
      {/* Global Ordering Closed Modal */}
      <AnimatePresence>
        {showClosedModal && isDemoModeLoaded && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={handleDismissClosedModal}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white border border-slate-200/70 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center overflow-hidden"
            >
              {/* Background Decorations */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-teal-50/50 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky-50/50 rounded-full blur-3xl -z-10 -translate-x-1/3 translate-y-1/3"></div>
              
              {/* Animated Icon Container */}
              <div className="relative mb-5 group">
                <div className="absolute inset-0 bg-slate-200 rounded-full blur-xl opacity-50"></div>
                <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-white border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 border border-slate-100/50">
                    <CalendarDays className="w-8 h-8 text-slate-700 drop-shadow-sm" />
                  </div>
                </div>
              </div>
              
              <h3 className="text-xl font-extrabold text-slate-800 mb-2.5 tracking-tight">
                Layanan Pemesanan Ditutup
              </h3>
              
              <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">
                Sistem saat ini sedang berada di luar jadwal operasional. Layanan pemesanan barang hanya tersedia pada hari <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200/80">Senin</span> dan <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200/80">Selasa</span>.
              </p>
              
              <button
                onClick={handleDismissClosedModal}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold transition-all shadow-md cursor-pointer"
              >
                Saya Mengerti
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </>
  );
};
