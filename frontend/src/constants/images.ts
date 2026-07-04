import { API_ORIGIN } from './index';

export function getUploadUrl(relativePath?: string | null): string | undefined {
  if (!relativePath) return undefined;
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return `${API_ORIGIN}${path}`;
}

export function getMenuImageUrl(imageUrl?: string | null): string | undefined {
  return getUploadUrl(imageUrl);
}
