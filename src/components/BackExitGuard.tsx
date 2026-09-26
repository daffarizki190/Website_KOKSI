import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LogOut, X, AlertTriangle } from "lucide-react";

const PUBLIC_PATHS = ["/login", "/register"];

export const BackExitGuard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showDialog, setShowDialog] = useState(false);
  const showDialogRef = useRef(false);
  const isInitialized = useRef(false);

  useEffect(() => {
    showDialogRef.current = showDialog;
  }, [showDialog]);

  useEffect(() => {
    if (PUBLIC_PATHS.includes(location.pathname)) return;
    if (isInitialized.current) return;

    isInitialized.current = true;

    // Beri waktu agar React Router atau browser selesai setup history bawaannya
    const timer = setTimeout(() => {
      const currentState = window.history.state || {};
      
      if (!currentState._hasFloor && !currentState._appFloor) {
        window.history.replaceState({ ...currentState, _appFloor: true }, "");
        window.history.pushState({ ...currentState, _hasFloor: true }, "");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      // Hanya eksekusi jika mencapai lantai aplikasi (history root)
      if (e.state && e.state._appFloor) {
        if (!PUBLIC_PATHS.includes(window.location.pathname)) {
          
          if (showDialogRef.current) {
            // Jika dialog sedang terbuka dan user tekan back, tutup dialog
            setShowDialog(false);
          } else {
            // Jika dialog tertutup dan user tekan back, buka dialog
            setShowDialog(true);
          }

          // Segera kembalikan trap state agar user tidak keluar jika tekan back lagi
          setTimeout(() => {
            try {
              window.history.pushState({ ...e.state, _hasFloor: true }, "");
            } catch (err) {
              console.warn("Blocked pushState in popstate", err);
            }
          }, 10);
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const [hasExited, setHasExited] = useState(false);

  useEffect(() => {
    if (PUBLIC_PATHS.includes(location.pathname)) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [location.pathname]);

  const handleExit = () => {
    setShowDialog(false);
    
    // Coba mundur 2 langkah (melewati null state dan floor state)
    if (window.history.length > 2) {
      window.history.go(-2);
    }
    
    // Coba paksa tutup tab (berguna untuk beberapa kondisi PWA)
    setTimeout(() => {
      window.close();
    }, 150);

    // Fallback
    setTimeout(() => {
      if (!document.hidden) {
        setHasExited(true);
      }
    }, 400);
  };

  const handleCancel = () => {
    setShowDialog(false);
    // Setelah user berinteraksi (klik Batal), trap state SUDAH dipasang ulang di popstate,
    // jadi tidak perlu pushState lagi di sini (tapi fallback jika gagal push di popstate):
    const state = window.history.state || {};
    if (state._appFloor) {
      window.history.pushState({ ...state, _hasFloor: true }, "");
    }
  };

  if (hasExited) {
    return (
      <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-slate-900 text-white p-6 animate-in fade-in duration-300">
        <LogOut className="w-16 h-16 text-slate-500 mb-6 opacity-80" />
        <h2 className="text-2xl font-bold mb-2">Sesi Berakhir</h2>
        <p className="text-slate-400 text-center max-w-sm mb-8 text-sm">
          Anda telah keluar dari aplikasi BelanjaIn Saza. Silakan tutup tab atau browser Anda.
        </p>
      </div>
    );
  }

  if (!showDialog) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-amber-50 border-b border-amber-100 px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Keluar dari Aplikasi?</h3>
            <p className="text-xs text-slate-500 mt-0.5">Sesi belanja Anda masih aktif</p>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            Apakah Anda yakin ingin keluar? Keranjang belanja Anda akan tetap tersimpan.
          </p>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex flex-col gap-2">
          <button
            onClick={handleExit}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Ya, Keluar
          </button>
          <button
            onClick={handleCancel}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors"
          >
            <X className="w-4 h-4" />
            Batal, Tetap di Sini
          </button>
        </div>
      </div>
    </div>
  );
};
