import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_PORT = process.env.EXPO_PUBLIC_API_PORT ?? '3000';
const PROD_API_ORIGIN = process.env.EXPO_PUBLIC_API_ORIGIN?.trim();

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

function resolveWsUrl(origin: string): string {
  const override = process.env.EXPO_PUBLIC_WS_URL?.trim();
  if (override) return override;

  if (origin.startsWith('https://')) {
    return `wss://${origin.slice('https://'.length)}/ws`;
  }
  if (origin.startsWith('http://')) {
    return `ws://${origin.slice('http://'.length)}/ws`;
  }
  return `ws://${origin}/ws`;
}

function resolveApiConfig() {
  if (PROD_API_ORIGIN) {
    const origin = PROD_API_ORIGIN.replace(/\/$/, '');
    return {
      API_BASE_URL: `${origin}/api`,
      API_ORIGIN: origin,
      WS_URL: resolveWsUrl(origin),
    };
  }

  const host = resolveDevHost();
  const devOrigin = `http://${host}:${API_PORT}`;
  return {
    API_BASE_URL: `${devOrigin}/api`,
    API_ORIGIN: devOrigin,
    WS_URL: `ws://${host}:${API_PORT}/ws`,
  };
}

export const { API_BASE_URL, API_ORIGIN, WS_URL } = resolveApiConfig();
