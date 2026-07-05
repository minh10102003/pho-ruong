import 'react-native-gesture-handler';
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { installAudioUnlock } from '../src/utils/sounds';
import AppLoadingScreen from '../src/components/AppLoadingScreen';
import { useAuthStore, getRoleHomePath } from '../src/store/authStore';

const SPLASH_MIN_MS = 1200;
const HYDRATION_TIMEOUT_MS = 3000;

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const hydrated = useAuthStore((s) => s.hydrated);
  const user = useAuthStore((s) => s.user);
  const restoreSession = useAuthStore((s) => s.restoreSession);
  const setHydrated = useAuthStore((s) => s.setHydrated);
  const [ready, setReady] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    installAudioUnlock();
    const timer = setTimeout(() => setReady(true), SPLASH_MIN_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!useAuthStore.getState().hydrated) {
        setHydrated(true);
      }
    }, HYDRATION_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [setHydrated]);

  useEffect(() => {
    if (!hydrated || !ready || sessionChecked) return;

    const check = async () => {
      if (!user) {
        await restoreSession();
      }
      setSessionChecked(true);
    };
    void check();
  }, [hydrated, ready, sessionChecked, user, restoreSession]);

  useEffect(() => {
    if (!ready || !hydrated || !sessionChecked) return;

    const inAuthGroup = segments[0] === 'login';
    const rootSegment = segments[0] as string | undefined;
    const onBootstrap = rootSegment === undefined;
    const currentUser = useAuthStore.getState().user;

    if (!currentUser && !inAuthGroup && !onBootstrap) {
      router.replace('/login');
      return;
    }

    if (currentUser && inAuthGroup) {
      router.replace(getRoleHomePath(currentUser.role));
      return;
    }

    if (currentUser) {
      const area = segments[0];
      if (area === 'admin' && currentUser.role !== 'ADMIN') {
        router.replace(getRoleHomePath(currentUser.role));
        return;
      }
      if (area === 'manager' && currentUser.role === 'STAFF') {
        router.replace('/staff');
        return;
      }
      if (area === 'staff' && currentUser.role !== 'STAFF') {
        router.replace(getRoleHomePath(currentUser.role));
      }
    }
  }, [ready, hydrated, sessionChecked, segments, router, user]);

  const showSplash = !ready || !hydrated || !sessionChecked;

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="manager" />
        <Stack.Screen name="staff" />
        <Stack.Screen name="admin" />
      </Stack>
      {showSplash ? <AppLoadingScreen /> : null}
    </>
  );
}
