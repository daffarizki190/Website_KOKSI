/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { Login } from './pages/Login';


import { DashboardUser } from './pages/DashboardUser';
import { DashboardAdmin } from './pages/DashboardAdmin';
import { ScanBarcodeAdmin } from './pages/ScanBarcode';
import { DashboardIT } from './pages/DashboardIT';
import OrderHistory from './pages/OrderHistory';
import { Splash } from './components/Splash';
import { PwaInstallBanner } from './components/PwaInstallBanner';
import { BackExitGuard } from './components/BackExitGuard';
import ForceChangePassword from './pages/ForceChangePassword';
import React, { useState } from 'react';

const ProtectedRoute = ({ children, requireAdmin = false, requireIT = false, allowPasswordChange = false }: { children: React.ReactNode, requireAdmin?: boolean, requireIT?: boolean, allowPasswordChange?: boolean }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Jika user wajib ganti password dan rute ini bukan rute ganti password
  if (user.mustChangePassword && !allowPasswordChange) {
    return <Navigate to="/change-password" replace />;
  }

  // Jika user SUDAH ganti password tapi mencoba ke halaman ganti password
  if (!user.mustChangePassword && allowPasswordChange) {
    return <Navigate to="/dashboard" replace />;
  }
  
  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireIT && user.role !== 'it' && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

const AppContent = () => {
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('hasSeenSplash');
  });

  if (showSplash) {
    return <Splash onFinish={() => {
      sessionStorage.setItem('hasSeenSplash', 'true');
      setShowSplash(false);
    }} />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Navigate to="/login" replace />} />
        
        <Route 
          path="/change-password" 
          element={
            <ProtectedRoute allowPasswordChange>
              <ForceChangePassword />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardUser />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/orders" 
          element={
            <ProtectedRoute>
              <OrderHistory />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requireAdmin>
              <DashboardAdmin />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/scan" 
          element={
            <ProtectedRoute requireAdmin>
              <ScanBarcodeAdmin />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/it-dashboard" 
          element={
            <ProtectedRoute requireIT>
              <DashboardIT />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <PwaInstallBanner />
      <BackExitGuard />
    </Router>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}
