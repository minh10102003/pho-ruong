/** Thời hạn phiên đăng nhập — khớp JWT_EXPIRES_IN backend (24h) */
export const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

function decodeJwtPayload(token: string): { exp?: number } | null {
  try {
    const segment = token.split('.')[1];
    if (!segment) return null;

    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json =
      typeof globalThis.atob === 'function'
        ? globalThis.atob(padded)
        : '';

    if (!json) return null;

    return JSON.parse(json) as { exp?: number };
  } catch {
    return null;
  }
}

export function getTokenExpiryMs(token: string): number | null {
  const payload = decodeJwtPayload(token);
  if (payload?.exp) {
    return payload.exp * 1000;
  }
  return null;
}

export function isSessionExpired(token: string | null, loginAt?: number | null): boolean {
  if (!token) return true;

  const jwtExpiry = getTokenExpiryMs(token);
  if (jwtExpiry !== null) {
    return Date.now() >= jwtExpiry;
  }

  if (loginAt) {
    return Date.now() - loginAt >= SESSION_DURATION_MS;
  }

  return true;
}
