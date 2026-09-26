import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LogOut, X, AlertTriangle } from "lucide-react";

const PUBLIC_PATHS = ["/login", "/register"];

export const BackExitGuard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    // Only install the root floor once per session (tab)
    const hasInitialized = sessionStorage.getItem("appRootInitialized");

    if (!hasInitialized) {
      // Install the floor
      const currentState = window.history.state || {};
      window.history.replaceState({ ...currentState, isAppRoot: true }, "");
      window.history.pushState({ ...currentState, isAppPath: true }, "");
      sessionStorage.setItem("appRootInitialized", "true");
    }

    const handlePopState = (e: PopStateEvent) => {
      // If the user navigated back to the root floor
      if (e.state && e.state.isAppRoot) {
        // Prevent leaving by pushing a state forward immediately
        window.history.pushState({ isAppPath: true }, "");
        
        // Only show dialog if we are NOT on a public path (like login)
        if (!PUBLIC_PATHS.includes(window.location.pathname)) {
          setShowDialog(true);
        } else {
          // If on login page, just let them exit normally without dialog
          window.history.go(-2);
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

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
    // Go back two steps: one for the state we pushed in handlePopState, one to exit the app
    window.history.go(-2);
    
    // Fallback for PWA
    setTimeout(() => {
      window.close();
    }, 300);
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

