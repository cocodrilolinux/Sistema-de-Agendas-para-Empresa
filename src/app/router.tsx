import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AppLayout from '../components/layout/AppLayout';
import LoginPage from '../pages/LoginPage';
import CalendarPage from '../pages/CalendarPage';
import { UpcomingPage } from '../pages/ListPages';
import HistoryPage from '../pages/HistoryPage';
import SettingsPage from '../pages/SettingsPage';
import TrashPage from '../pages/TrashPage';
import ProfilePage from '../pages/ProfilePage';
import ManagerPage from '../pages/ManagerPage';

export function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="text-center">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
        <p className="text-sm font-medium text-slate-500">Comprobando sesión…</p>
      </div>
    </div>
  );
}

function Protected() {
  const { user, loading } = useAuth();
  if (loading) return <AuthLoading />;
  return user ? <AppLayout /> : <Navigate to="/login" replace />;
}

function ManagerRoute() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'manager') return <Navigate to="/" replace />;
  return <Outlet />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<Protected />}>
        <Route index element={<CalendarPage />} />
        <Route path="upcoming" element={<UpcomingPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="trash" element={<TrashPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route element={<ManagerRoute />}>
          <Route path="manager" element={<ManagerPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
