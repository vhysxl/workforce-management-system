import { useAuthStore } from './stores/authStore';
import AuthPage from './pages/AuthPage';
import Button from './components/Button';

export default function App() {
  const { isAuthenticated, logout } = useAuthStore();

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-primary text-secondary flex flex-col items-center justify-center p-6 gap-4">
        <p className="text-sm text-supporting">Logged in</p>
        <Button type="button" variant="danger" onClick={logout}>
          Logout
        </Button>
      </div>
    );
  }

  return <AuthPage />;
}
