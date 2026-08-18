import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X, HelpCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'primary';
}

interface NotificationContextType {
  showToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  toast: {
    success: (message: string, title?: string, duration?: number) => string;
    error: (message: string, title?: string, duration?: number) => string;
    warning: (message: string, title?: string, duration?: number) => string;
    info: (message: string, title?: string, duration?: number) => string;
  };
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<(ConfirmDialogOptions & { resolve: (val: boolean) => void }) | null>(null);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const duration = toast.duration ?? (toast.type === 'error' ? 5000 : 4000);
    const newToast: Toast = { ...toast, id, duration };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, [removeToast]);

  const toast = {
    success: useCallback((message: string, title = 'Berhasil', duration = 4000) => 
      showToast({ type: 'success', title, message, duration }), [showToast]),
    error: useCallback((message: string, title = 'Gagal / Kesalahan', duration = 5000) => 
      showToast({ type: 'error', title, message, duration }), [showToast]),
    warning: useCallback((message: string, title = 'Peringatan', duration = 4500) => 
      showToast({ type: 'warning', title, message, duration }), [showToast]),
    info: useCallback((message: string, title = 'Informasi', duration = 4000) => 
      showToast({ type: 'info', title, message, duration }), [showToast]),
  };

  const confirm = useCallback((options: ConfirmDialogOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setConfirmDialog({
        ...options,
        resolve: (result: boolean) => {
          setConfirmDialog(null);
          resolve(result);
        }
      });
    });
  }, []);

  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
      case 'info':
        return <Info className="w-5 h-5 text-teal-500 shrink-0" />;
    }
  };

  const getToastStyle = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          card: 'bg-white/95 border-emerald-200/80 shadow-emerald-950/5',
          bar: 'bg-emerald-500',
          badge: 'bg-emerald-50 text-emerald-800 border-emerald-200'
        };
      case 'error':
        return {
          card: 'bg-white/95 border-rose-200/80 shadow-rose-950/5',
          bar: 'bg-rose-500',
          badge: 'bg-rose-50 text-rose-800 border-rose-200'
        };
      case 'warning':
        return {
          card: 'bg-white/95 border-amber-200/80 shadow-amber-950/5',
          bar: 'bg-amber-500',
          badge: 'bg-amber-50 text-amber-800 border-amber-200'
        };
      case 'info':
        return {
          card: 'bg-white/95 border-teal-200/80 shadow-teal-950/5',
          bar: 'bg-teal-500',
          badge: 'bg-teal-50 text-teal-800 border-teal-200'
        };
    }
  };

  return (
    <NotificationContext.Provider value={{ showToast, removeToast, toast, confirm }}>
      {children}

      {/* Floating Toast Notification Container */}
      <div 
        aria-live="polite" 
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full px-3 sm:px-0 pointer-events-none"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => {
            const styles = getToastStyle(t.type);
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: -20, scale: 0.92, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.9, y: -10, filter: 'blur(2px)' }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className={`pointer-events-auto relative overflow-hidden rounded-2xl border backdrop-blur-md shadow-xl p-4 flex items-start gap-3.5 transition-all ${styles.card}`}
              >
                {/* Icon */}
                <div className="pt-0.5">
                  {getToastIcon(t.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-2">
                  {t.title && (
                    <h4 className="text-xs font-extrabold text-slate-900 tracking-tight leading-tight">
                      {t.title}
                    </h4>
                  )}
                  <p className="text-xs text-slate-600 font-medium leading-relaxed mt-0.5 break-words">
                    {t.message}
                  </p>
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => removeToast(t.id)}
                  aria-label="Tutup notifikasi"
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Animated Progress Bar */}
                {t.duration && t.duration > 0 && (
                  <motion.div
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: t.duration / 1000, ease: 'linear' }}
                    className={`absolute bottom-0 left-0 h-1 ${styles.bar}`}
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Modern Confirm / Alert Dialog Modal */}
      <AnimatePresence>
        {confirmDialog && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => confirmDialog.resolve(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
                  confirmDialog.type === 'danger'
                    ? 'bg-rose-50 border border-rose-200 text-rose-600'
                    : confirmDialog.type === 'warning'
                    ? 'bg-amber-50 border border-amber-200 text-amber-600'
                    : 'bg-teal-50 border border-teal-200 text-teal-600'
                }`}>
                  {confirmDialog.type === 'danger' ? (
                    <AlertCircle className="w-6 h-6" />
                  ) : confirmDialog.type === 'warning' ? (
                    <AlertTriangle className="w-6 h-6" />
                  ) : (
                    <HelpCircle className="w-6 h-6" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                    {confirmDialog.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-medium">
                    {confirmDialog.message}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => confirmDialog.resolve(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  {confirmDialog.cancelText || 'Batal'}
                </button>
                <button
                  type="button"
                  onClick={() => confirmDialog.resolve(true)}
                  className={`px-5 py-2.5 text-white font-extrabold text-xs rounded-xl transition-all shadow-md cursor-pointer ${
                    confirmDialog.type === 'danger'
                      ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-rose-600/20'
                      : confirmDialog.type === 'warning'
                      ? 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 shadow-amber-600/20'
                      : 'bg-teal-600 hover:bg-teal-700 active:bg-teal-800 shadow-teal-600/20'
                  }`}
                >
                  {confirmDialog.confirmText || 'Konfirmasi'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
