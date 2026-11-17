import { useState } from 'react';
import Sidebar, { type NavPage } from '../components/Sidebar';
import { useAuthStore } from '../stores/authStore';
import AttendancePage from './AttendancePage';
import EmployeesPage from './EmployeesPage';
import ProfilePage from './ProfilePage';

export default function HomePage() {
  const user = useAuthStore((state) => state.user);
  const [activePage, setActivePage] = useState<NavPage>(user?.role === 'admin' ? 'employees' : 'attendance');

  return (
    <div className="flex min-h-screen bg-primary text-secondary">
      <Sidebar activePage={activePage} onNavigate={setActivePage} user={user} />
      <main className="flex-1 min-w-0 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {activePage === 'attendance' && <AttendancePage />}
          {activePage === 'employees' && <EmployeesPage />}
          {activePage === 'profile' && <ProfilePage />}
        </div>
      </main>
    </div>
  );
}
