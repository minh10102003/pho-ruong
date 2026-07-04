import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_PORT = process.env.EXPO_PUBLIC_API_PORT ?? '3000';

/** IP máy dev — Expo Go truyền qua hostUri khi quét QR */
function resolveDevHost(): string {
  const envHost = process.env.EXPO_PUBLIC_API_HOST?.trim();
  if (envHost) return envHost;

  if (Platform.OS === 'web') return 'localhost';

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host && host !== 'localhost') return host;
  }

  const expoGo = Constants.expoGoConfig as { debuggerHost?: string } | null;
  if (expoGo?.debuggerHost) {
    return expoGo.debuggerHost.split(':')[0];
  }

  const legacy = Constants.manifest2?.extra?.expoClient?.hostUri;
  if (legacy) {
    const host = legacy.split(':')[0];
    if (host) return host;
  }

  return 'localhost';
}

const host = resolveDevHost();

export const API_BASE_URL = `http://${host}:${API_PORT}/api`;
export const API_ORIGIN = `http://${host}:${API_PORT}`;
export const WS_URL = `ws://${host}:${API_PORT}/ws`;
