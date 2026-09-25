import React, { useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LogOut, X, AlertTriangle } from "lucide-react";

// Halaman publik yang tidak perlu dijaga
const PUBLIC_PATHS = ["/login", "/register"];

export const BackExitGuard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showDialog, setShowDialog] = useState(false);
  const lastProtectedPath = useRef("/dashboard");
  const isInitialized = useRef(false);

  // Simpan path protected terakhir yang dikunjungi
  useEffect(() => {
    if (!PUBLIC_PATHS.includes(location.pathname)) {
      lastProtectedPath.current = location.pathname;
    }
  }, [location.pathname]);

  // Pasang "lantai" di bawah history saat ini agar bisa mendeteksi keluar app
  // replaceState → jadikan entry saat ini sebagai lantai
  // pushState null → push entry baru di atasnya (ini yang React Router pakai untuk navigasi)
  // Hasilnya: [... , /dashboard(LANTAI), /dashboard(current)]
  // Saat user back dari halaman manapun dan sampai ke (LANTAI), baru dialog muncul
  const installFloor = useCallback(() => {
    const url = window.location.pathname + window.location.search;
    window.history.replaceState({ _appFloor: true }, "", url);
    window.history.pushState(null, "", url);
  }, []);

  // Inisialisasi sekali saja saat pertama masuk halaman protected
  useEffect(() => {
    if (isInitialized.current) return;
    if (PUBLIC_PATHS.includes(location.pathname)) return;

    isInitialized.current = true;

    // Tunggu React Router selesai setup history-nya sendiri dulu
    const setupTimer = setTimeout(() => {
      installFloor();

      const handlePopState = (e: PopStateEvent) => {
        if (e.state?._appFloor === true) {
          // User menekan back dan sampai ke "lantai" → akan keluar dari app
          // Kembalikan ke halaman protected terakhir
          navigate(lastProtectedPath.current, { replace: true });
          // Pasang ulang lantai setelah navigate selesai
          setTimeout(() => installFloor(), 0);
          // Tampilkan dialog konfirmasi
          setShowDialog(true);
        }
        // Jika bukan lantai kita = React Router sedang handle navigasi internal biasa
        // Biarkan saja (tidak perlu intercept)
      };

      window.addEventListener("popstate", handlePopState);
    }, 100);

    return () => clearTimeout(setupTimer);
  }, [location.pathname, navigate, installFloor]);

  // Tangkap tutup tab / refresh browser
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
    navigate("/login", { replace: true });
  };

  const handleCancel = () => {
    setShowDialog(false);
  };

  if (!showDialog) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
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
