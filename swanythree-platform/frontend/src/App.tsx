/**
 * SwanyThree Platform — Application Root Component.
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import StreamingStudio from '@/pages/StreamingStudio';
import ViewerPage from '@/pages/ViewerPage';
import ProfilePage from '@/pages/ProfilePage';
import AdminDashboard from '@/pages/AdminDashboard';
import XPToast from '@/components/XPToast';

/** Protected route wrapper */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/** Admin route wrapper */
function AdminRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user || user.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <div className="min-h-screen bg-st3-dark text-st3-cream">
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/studio"
          element={
            <ProtectedRoute>
              <StreamingStudio />
            </ProtectedRoute>
          }
        />

        <Route path="/watch/:streamId" element={<ViewerPage />} />

        <Route
          path="/profile/:userId"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global XP Toast notifications */}
      <XPToast />
    </div>
  );
}
