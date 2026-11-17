import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import Sidebar from '../components/Sidebar';
import { useAuthStore } from '../stores/authStore';

export default function HomePage() {
  const user = useAuthStore((state) => state.user);
  const { pathname } = useLocation();

  useEffect(() => window.scrollTo(0, 0), [pathname]);

  return (
    <div className="flex min-h-screen bg-primary text-secondary">
      <Sidebar user={user} />
      <main className="flex-1 min-w-0 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
