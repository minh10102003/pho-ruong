import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import AppLoadingScreen from '../src/components/AppLoadingScreen';
import { useAuthStore, getRoleHomePath } from '../src/store/authStore';

export default function IndexPage() {
  const router = useRouter();
  const hydrated = useAuthStore((s) => s.hydrated);
  const user = useAuthStore((s) => s.user);
  const restoreSession = useAuthStore((s) => s.restoreSession);

  useEffect(() => {
    if (!hydrated) return;

    const bootstrap = async () => {
      const sessionUser = user ?? (await restoreSession());
      if (!sessionUser) {
        router.replace('/login');
        return;
      }
      router.replace(getRoleHomePath(sessionUser.role));
    };

    void bootstrap();
  }, [hydrated, user, restoreSession, router]);

  return <AppLoadingScreen />;
}
