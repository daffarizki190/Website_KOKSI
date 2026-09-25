import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, ShieldAlert, ArrowRight, Loader2, LogOut } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function ForceChangePassword() {
  const navigate = useNavigate();
  const { user, token, logout, refreshUser } = useAuth();
  
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Password baru dan konfirmasi password tidak cocok.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password baru minimal 6 karakter.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal mengubah password");
      }

      // Password berhasil diubah, reload context
      await refreshUser();
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <KeyRound className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          Ubah Password Anda
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 max-w">
          Halo, {user?.nama}! Karena alasan keamanan, Anda diwajibkan untuk mengubah password sementara yang diberikan Admin.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex gap-3">
                <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Password Lama (Sementara)
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Masukkan password dari admin"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Password Baru
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Minimal 6 karakter"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Konfirmasi Password Baru
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Ulangi password baru"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Simpan & Lanjutkan
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={logout}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"
              >
                <LogOut className="mr-2 w-4 h-4 text-slate-500" />
                Keluar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
