import { Link, Navigate, Outlet, Route, Routes, useLocation, useNavigate, useOutletContext, useParams, useSearchParams } from 'react-router';
import { useAuthStore } from './stores/authStore';
import type { ManagerRole } from './lib/employees';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import AccountPasswordPage from './pages/AccountPasswordPage';
import AttendancePage from './pages/AttendancePage';
import ProfilePage from './pages/ProfilePage';
import EmployeesPage from './pages/EmployeesPage';
import EmployeeEditorPage from './pages/EmployeeEditorPage';
import AttendanceHistoryPage from './pages/AttendanceHistoryPage';
import AttendanceEntryPage from './pages/AttendanceEntryPage';
import EmployeeAttendancePage from './pages/EmployeeAttendancePage';

function StartPage() {
  const { isAuthenticated, user } = useAuthStore();
  const [search] = useSearchParams();
  const token = search.get('token');
  if (token) return <Navigate to={`/account/password?token=${encodeURIComponent(token)}`} replace />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={user?.role === 'admin' ? '/employees' : '/attendance'} replace />;
}

function LoginRoute() {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();
  if (isAuthenticated) {
    return <Navigate to={location.state?.from ?? (user?.role === 'admin' ? '/employees' : '/attendance')} replace />;
  }
  return <AuthPage />;
}

function AccountRoute() {
  const [search] = useSearchParams();
  const token = search.get('token');
  if (!token) return <Navigate to="/login" replace />;
  return <AccountPasswordPage key={token} token={token} />;
}

function RequireAuth() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <Outlet />;
}

function RequireManager() {
  const role = useAuthStore((state) => state.user?.role);
  if (role !== 'admin' && role !== 'hrd') return <Navigate to="/profile" replace />;
  return <Outlet context={role} />;
}

function RequireAttendance() {
  const role = useAuthStore((state) => state.user?.role);
  if (role === 'admin') return <Navigate to="/employees" replace />;
  return <Outlet />;
}

function EmployeeEditorRoute() {
  const { employeeId } = useParams();
  const actorRole = useOutletContext<ManagerRole>();
  const navigate = useNavigate();
  return <EmployeeEditorPage key={employeeId ?? 'new'} employeeId={employeeId} actorRole={actorRole} onBack={() => navigate('/employees')} />;
}

export default function App() {
  const location = useLocation();
  return (
    <Routes>
      <Route path="/" element={<StartPage />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/account/password" element={<AccountRoute />} />
      <Route element={<RequireAuth />}>
        <Route element={<HomePage />}>
          <Route path="profile" element={<ProfilePage />} />
          <Route element={<RequireAttendance />}>
            <Route path="attendance" element={<AttendancePage key={location.pathname} />} />
            <Route path="attendance/leave" element={<AttendancePage key={location.pathname} />} />
            <Route path="profile/attendance" element={<AttendanceHistoryPage key={location.key} />} />
            <Route path="profile/attendance/:date" element={<AttendanceEntryPage key={location.key} />} />
          </Route>
          <Route element={<RequireManager />}>
            <Route path="employees" element={<EmployeesPage key={location.key} />} />
            <Route path="employees/new" element={<EmployeeEditorRoute />} />
            <Route path="employees/:employeeId" element={<EmployeeEditorRoute />} />
            <Route path="employees/:employeeId/attendance" element={<EmployeeAttendancePage />}>
              <Route index element={<AttendanceHistoryPage key={location.key} />} />
              <Route path=":date" element={<AttendanceEntryPage key={location.key} />} />
            </Route>
          </Route>
          <Route path="*" element={<section className="space-y-4"><h1 className="text-2xl font-bold">Page not found</h1><Link to="/" className="text-blue-300 hover:underline">Go to home</Link></section>} />
        </Route>
      </Route>
    </Routes>
  );
}
