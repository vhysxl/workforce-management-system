import { useAuthStore } from './stores/authStore';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';

export default function App() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <HomePage />;
  }

  return <AuthPage />;
}
